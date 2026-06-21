/**
 * CategoryChips — Horizontal scrollable filter chips for track categories
 */
import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/colors';
import type { TrackCategory } from '../../constants/tracks';

interface CategoryItem {
  key: TrackCategory | 'all';
  label: string;
}

interface CategoryChipsProps {
  categories: CategoryItem[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryChips({
  categories,
  activeCategory,
  onSelect,
}: CategoryChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = cat.key === activeCategory;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
});
