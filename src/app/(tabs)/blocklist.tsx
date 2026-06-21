/**
 * Blocklist Screen — Manage which apps are blocked during focus sessions
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import { useBlockStore } from '../../stores/useBlockStore';
import { AppListItem } from '../../components/blocker/AppListItem';

// ─── Hardcoded App Catalog ──────────────────────────────────────
const APP_CATALOG = [
  { name: 'Instagram', packageName: 'com.instagram.android', color: '#E4405F' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', color: '#00F2EA' },
  { name: 'Twitter / X', packageName: 'com.twitter.android', color: '#1DA1F2' },
  { name: 'Facebook', packageName: 'com.facebook.katana', color: '#1877F2' },
  { name: 'YouTube', packageName: 'com.google.android.youtube', color: '#FF0000' },
  { name: 'Reddit', packageName: 'com.reddit.frontpage', color: '#FF4500' },
  { name: 'Snapchat', packageName: 'com.snapchat.android', color: '#FFFC00' },
  { name: 'WhatsApp', packageName: 'com.whatsapp', color: '#25D366' },
  { name: 'Telegram', packageName: 'org.telegram.messenger', color: '#0088CC' },
  { name: 'Discord', packageName: 'com.discord', color: '#5865F2' },
] as const;

// ─── Shield Icon SVG ────────────────────────────────────────────
function ShieldIcon({ size = 28, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        fill={color}
        opacity={0.15}
      />
      <Path
        d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Search Icon SVG ────────────────────────────────────────────
function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={11} cy={11} r={7} stroke={Colors.textMuted} strokeWidth={2} />
      <Path
        d="M16.5 16.5L21 21"
        stroke={Colors.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function BlocklistScreen() {
  const { blockedApps, loadBlockedApps, addApp, removeApp } = useBlockStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlockedApps();
  }, []);

  // Set of blocked package names for quick lookup
  const blockedSet = useMemo(() => {
    return new Set(blockedApps.filter((a) => a.isActive).map((a) => a.packageName));
  }, [blockedApps]);

  const blockedCount = blockedSet.size;

  // Filter catalog by search query
  const filteredApps = useMemo(() => {
    if (!search.trim()) return APP_CATALOG;
    const q = search.toLowerCase().trim();
    return APP_CATALOG.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q)
    );
  }, [search]);

  const handleToggle = useCallback(
    async (packageName: string, name: string, isCurrentlyBlocked: boolean) => {
      if (isCurrentlyBlocked) {
        await removeApp(packageName);
      } else {
        await addApp(packageName, name);
      }
    },
    [addApp, removeApp]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof APP_CATALOG)[number] }) => {
      const isBlocked = blockedSet.has(item.packageName);
      return (
        <AppListItem
          name={item.name}
          packageName={item.packageName}
          isBlocked={isBlocked}
          onToggle={() => handleToggle(item.packageName, item.name, isBlocked)}
          color={item.color}
        />
      );
    },
    [blockedSet, handleToggle]
  );

  const keyExtractor = useCallback(
    (item: (typeof APP_CATALOG)[number]) => item.packageName,
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        data={filteredApps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>App Blocker</Text>
              <Text style={styles.subtitle}>
                Block distracting apps during focus sessions
              </Text>
            </View>

            {/* Status Card */}
            <View
              style={[
                styles.statusCard,
                blockedCount > 0 && styles.statusCardActive,
              ]}
            >
              <ShieldIcon
                size={32}
                color={blockedCount > 0 ? Colors.primary : Colors.textMuted}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusCount}>
                  {blockedCount} {blockedCount === 1 ? 'app' : 'apps'} blocked
                </Text>
                <Text style={styles.statusLabel}>
                  {blockedCount > 0
                    ? 'Protection active during sessions'
                    : 'Add apps to start blocking'}
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps…"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No apps match your search</Text>
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
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusCardActive: {
    borderColor: Colors.primaryMuted,
  },
  statusInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  statusCount: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
