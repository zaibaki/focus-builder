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
  AppState,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import { useBlockStore, type InstalledAppItem } from '../../stores/useBlockStore';
import { AppListItem } from '../../components/blocker/AppListItem';

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
  const {
    blockedApps,
    installedApps,
    hasPermission,
    hasOverlayPermission,
    loadBlockedApps,
    loadInstalledApps,
    checkPermission,
    requestPermission,
    requestOverlayPermission,
    addApp,
    removeApp,
  } = useBlockStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlockedApps();
    loadInstalledApps();
    checkPermission();

    // Check permission status when user returns from settings page
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadBlockedApps, loadInstalledApps, checkPermission]);

  // Set of blocked package names for quick lookup
  const blockedSet = useMemo(() => {
    return new Set(blockedApps.filter((a) => a.isActive).map((a) => a.packageName));
  }, [blockedApps]);

  const blockedCount = blockedSet.size;

  // Filter catalog by search query
  const filteredApps = useMemo(() => {
    if (!search.trim()) return installedApps;
    const q = search.toLowerCase().trim();
    return installedApps.filter(
      (app) =>
        app.displayName.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q)
    );
  }, [installedApps, search]);

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
    ({ item }: { item: InstalledAppItem }) => {
      const isBlocked = blockedSet.has(item.packageName);
      return (
        <AppListItem
          name={item.displayName}
          packageName={item.packageName}
          isBlocked={isBlocked}
          onToggle={() => handleToggle(item.packageName, item.displayName, isBlocked)}
          iconUri={item.icon}
        />
      );
    },
    [blockedSet, handleToggle]
  );

  const keyExtractor = useCallback(
    (item: InstalledAppItem) => item.packageName,
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

            {/* Permission Request Banner (Usage Access) */}
            {!hasPermission && (
              <View style={styles.permissionCard}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Usage Access Needed</Text>
                  <Text style={styles.permissionSubtitle}>
                    To detect and intercept distracting apps during focus sessions, the app requires Usage Stats access.
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.permissionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Grant Access</Text>
                </Pressable>
              </View>
            )}

            {/* Overlay Permission Request Banner */}
            {!hasOverlayPermission && (
              <View style={[styles.permissionCard, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
                <View style={styles.permissionInfo}>
                  <Text style={[styles.permissionTitle, { color: Colors.accent }]}>Display Over Other Apps Needed</Text>
                  <Text style={styles.permissionSubtitle}>
                    To overlay the focus integrity screen on top of distracting apps on Android 10+, please grant the Draw Over Other Apps permission.
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.permissionButton,
                    { backgroundColor: Colors.accent },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={requestOverlayPermission}
                >
                  <Text style={[styles.permissionButtonText, { color: Colors.textPrimary }]}>Grant Permission</Text>
                </Pressable>
              </View>
            )}

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
            <Text style={styles.emptyText}>
              {installedApps.length === 0 ? 'Loading applications...' : 'No apps match your search'}
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
  permissionCard: {
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  permissionInfo: {
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    color: Colors.warning,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  permissionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm + 1,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
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
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
