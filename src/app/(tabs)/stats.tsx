/**
 * Stats Screen — Gamified Focus Guild statistics and weekly progress
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import * as db from '../../services/database';
import { WeeklyChart, type DayData } from '../../components/stats/WeeklyChart';

// ─── Helper: format seconds into readable duration ──────────────
function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ─── Helper: format unix timestamp ──────────────────────────────
function formatDateTime(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

// ─── Helper: get current week's Monday at 00:00 (epoch sec) ────
function getWeekStartEpoch(): number {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return Math.floor(monday.getTime() / 1000);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── SVG Icons ──────────────────────────────────────────────────
function ClockIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 20, color = Colors.secondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldIcon({ size = 20, color = Colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Summary Card Component ─────────────────────────────────────
function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIconWrap}>{icon}</View>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Session Row Component ──────────────────────────────────────
function SessionRow({ session }: { session: db.Session }) {
  const isCompleted = session.status === 'completed';
  const statusColor = isCompleted ? Colors.success : Colors.error;
  const statusLabel = isCompleted ? 'Completed' : 'Abandoned';

  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionTime}>{formatDateTime(session.start_time)}</Text>
        <Text style={styles.sessionDuration}>
          {formatDuration(session.actual_duration_sec)}
          {' / '}
          {formatDuration(session.target_duration_sec)} target
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

// ─── Stats Screen ────────────────────────────────────────────────
export default function StatsScreen() {
  const [totalTime, setTotalTime] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [abandonedCount, setAbandonedCount] = useState(0);
  const [blockAttempts, setBlockAttempts] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DayData[]>(
    DAY_LABELS.map((d) => ({ day: d, minutes: 0 }))
  );
  const [recentSessions, setRecentSessions] = useState<db.Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Guild Leveling Stats
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0); // Minutes towards next level (0 to 30)
  const [rankTitle, setRankTitle] = useState('Focus Initiate');
  
  // Badge Achievements
  const [badges, setBadges] = useState([
    { id: 'first_step', title: 'First Flow', desc: 'Complete 1st session', icon: '🌱', unlocked: false },
    { id: 'knight', title: 'Focus Knight', desc: 'Complete 5 sessions', icon: '⚔️', unlocked: false },
    { id: 'shield', title: 'Iron Shield', desc: 'Block 5 distractions', icon: '🛡️', unlocked: false },
    { id: 'unstoppable', title: 'Unstoppable', desc: 'Focus 60m at once', icon: '🔥', unlocked: false },
    { id: 'zen', title: 'Zen Master', desc: '100% completion rate', icon: '🧘', unlocked: false },
    { id: 'consistent', title: 'Consistent', desc: 'Focused today', icon: '📅', unlocked: false },
  ]);

  const loadStats = useCallback(async () => {
    try {
      const [time, count, abandoned, attempts, weekSessions, recent] = await Promise.all([
        db.getTotalFocusTime(),
        db.getCompletedSessionCount(),
        db.getAbandonedSessionCount(),
        db.getBlockAttemptCount(),
        db.getSessionsForWeek(getWeekStartEpoch()),
        db.getRecentSessions(20),
      ]);

      setTotalTime(time);
      setCompletedCount(count);
      setAbandonedCount(abandoned);
      setBlockAttempts(attempts);

      // Build weekly chart data
      const weekStart = getWeekStartEpoch();
      const dailyMinutes = DAY_LABELS.map((day, idx) => {
        const dayStart = weekStart + idx * 86400;
        const dayEnd = dayStart + 86400;
        const daySeconds = weekSessions
          .filter(
            (s) =>
              s.start_time >= dayStart &&
              s.start_time < dayEnd &&
              s.status === 'completed'
          )
          .reduce((sum, s) => sum + s.actual_duration_sec, 0);
        return { day, minutes: Math.round(daySeconds / 60) };
      });
      setWeeklyData(dailyMinutes);

      // Filter only finished sessions for recent list
      setRecentSessions(recent.filter((s) => s.status !== 'active'));

      // Calculate level metrics (1 Level = 30 minutes focused)
      const focusedMinutes = Math.floor(time / 60);
      const calculatedLevel = Math.floor(focusedMinutes / 30) + 1;
      const calculatedXp = focusedMinutes % 30;
      setLevel(calculatedLevel);
      setXpProgress(calculatedXp);

      // Resolve Rank Title
      if (calculatedLevel === 1) setRankTitle('Focus Initiate');
      else if (calculatedLevel === 2) setRankTitle('Zen Apprentice');
      else if (calculatedLevel >= 3 && calculatedLevel <= 4) setRankTitle('Deep Worker');
      else if (calculatedLevel >= 5 && calculatedLevel <= 7) setRankTitle('Productivity Knight');
      else if (calculatedLevel >= 8 && calculatedLevel <= 9) setRankTitle('Focus Master');
      else setRankTitle('Zen Monk');

      // Check achievements unlocking
      const todayString = new Date().toDateString();
      const hasFocusedToday = recent.some(
        (s) => s.status === 'completed' && new Date(s.start_time * 1000).toDateString() === todayString
      );
      const hasUnstoppable = recent.some((s) => s.status === 'completed' && s.actual_duration_sec >= 3600);
      
      setBadges([
        { id: 'first_step', title: 'First Flow', desc: 'Complete 1st session', icon: '🌱', unlocked: count >= 1 },
        { id: 'knight', title: 'Focus Knight', desc: 'Complete 5 sessions', icon: '⚔️', unlocked: count >= 5 },
        { id: 'shield', title: 'Iron Shield', desc: 'Block 5 distractions', icon: '🛡️', unlocked: attempts >= 5 },
        { id: 'unstoppable', title: 'Unstoppable', desc: 'Focus 60m at once', icon: '🔥', unlocked: hasUnstoppable },
        { id: 'zen', title: 'Zen Master', desc: '0 sessions abandoned', icon: '🧘', unlocked: count > 0 && abandoned === 0 },
        { id: 'consistent', title: 'Consistent', desc: 'Focused today', icon: '📅', unlocked: hasFocusedToday },
      ]);

    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const renderSession = useCallback(
    ({ item }: { item: db.Session }) => <SessionRow session={item} />,
    []
  );

  const keyExtractor = useCallback((item: db.Session) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        data={recentSessions}
        keyExtractor={keyExtractor}
        renderItem={renderSession}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.surface}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Your Progress</Text>
            </View>

            {/* ── Focus Guild RPG Level Card ── */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLevel}>Lvl {level}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankText}>{rankTitle}</Text>
                  <Text style={styles.xpText}>{xpProgress} / 30 mins to next level</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressFill, { width: `${(xpProgress / 30) * 100}%` }]} />
              </View>
            </View>

            {/* Summary Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.summaryRow}
            >
              <SummaryCard
                icon={<ClockIcon size={22} color={Colors.primary} />}
                value={formatDuration(totalTime)}
                label="Total Focus"
              />
              <SummaryCard
                icon={<CheckIcon size={22} color={Colors.secondary} />}
                value={String(completedCount)}
                label="Sessions"
              />
              <SummaryCard
                icon={<ShieldIcon size={22} color={Colors.accent} />}
                value={String(blockAttempts)}
                label="Blocked"
              />
            </ScrollView>

            {/* Weekly Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <View style={styles.chartCard}>
                <WeeklyChart data={weeklyData} />
              </View>
            </View>

            {/* Achievements Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Guild Achievements</Text>
              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeCard,
                      !badge.unlocked && styles.badgeCardLocked,
                    ]}
                  >
                    <Text style={[styles.badgeIcon, !badge.unlocked && { opacity: 0.3 }]}>
                      {badge.icon}
                    </Text>
                    <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeLockedText]}>
                      {badge.title}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>
                      {badge.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent Sessions Header */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Complete your first focus session to see stats here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 80,
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },

  // RPG Profile Card
  profileCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLevel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  rankInfo: {
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  rankText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  xpText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },

  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minWidth: 110,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryIconWrap: {
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  chartCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Achievements Badges Grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeCard: {
    width: '31%',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCardLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeTitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeLockedText: {
    color: Colors.textSecondary,
  },
  badgeDesc: {
    color: Colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },

  // Session Rows
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  sessionTime: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionDuration: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    maxWidth: 260,
  },
});
