/**
 * AppListItem — A single app row for the blocklist screen
 */
import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';

interface AppListItemProps {
  name: string;
  packageName: string;
  isBlocked: boolean;
  onToggle: () => void;
  color?: string;
  iconUri?: string | null;
}

export function AppListItem({ name, packageName, isBlocked, onToggle, color = Colors.primary, iconUri }: AppListItemProps) {
  const firstLetter = name.charAt(0).toUpperCase();

  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isBlocked && styles.containerActive,
        pressed && styles.containerPressed,
      ]}
      onPress={handleToggle}
    >
      {iconUri ? (
        <Image source={{ uri: iconUri }} style={styles.appIcon} resizeMode="contain" />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: color + '25' }]}>
          <Text style={[styles.iconLetter, { color }]}>{firstLetter}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.appName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.packageName} numberOfLines={1}>
          {packageName}
        </Text>
      </View>

      <Switch
        value={isBlocked}
        onValueChange={handleToggle}
        trackColor={{ false: Colors.surfaceHighlight, true: Colors.primaryMuted }}
        thumbColor={isBlocked ? Colors.primary : Colors.textMuted}
        ios_backgroundColor={Colors.surfaceHighlight}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerActive: {
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.surfaceElevated,
  },
  containerPressed: {
    opacity: 0.85,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLetter: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  packageName: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
