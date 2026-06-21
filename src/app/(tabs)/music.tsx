/**
 * Music Screen — Sound Library tab
 */
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../constants/colors';
import { BUNDLED_TRACKS, CATEGORIES, type TrackCategory } from '../../constants/tracks';
import { usePlayerStore, type PlayerTrack } from '../../stores/usePlayerStore';
import CategoryChips from '../../components/music/CategoryChips';
import TrackCard from '../../components/music/TrackCard';
import MiniPlayer from '../../components/music/MiniPlayer';

/** Convert bundled track data to PlayerTrack format used by the store */
function toPlayerTrack(track: (typeof BUNDLED_TRACKS)[number], index: number): PlayerTrack {
  return {
    id: index + 1,
    title: track.title,
    artist: track.artist,
    uri: '', // bundled tracks don't have a URI yet
    artwork: track.artwork,
    duration: track.duration_sec,
    category: track.category,
  };
}

/** Format total duration for header stats */
function formatTotalDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function MusicScreen() {
  const insets = useSafeAreaInsets();

  const activeCategory = usePlayerStore((s) => s.activeCategory);
  const setActiveCategory = usePlayerStore((s) => s.setActiveCategory);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  // Build full player-track list from bundled data
  const allTracks = useMemo(
    () => BUNDLED_TRACKS.map(toPlayerTrack),
    [],
  );

  // Filter by active category
  const filteredTracks = useMemo(() => {
    if (activeCategory === 'all') return allTracks;
    return allTracks.filter((t) => t.category === activeCategory);
  }, [allTracks, activeCategory]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (cat: string) => {
      setActiveCategory(cat);
    },
    [setActiveCategory],
  );

  // Handle track press: set queue context + play, or toggle if already playing
  const handleTrackPress = useCallback(
    (track: PlayerTrack) => {
      if (currentTrack?.id === track.id) {
        usePlayerStore.getState().togglePlayback();
        return;
      }
      setQueue(filteredTracks);
      setTrack(track);
    },
    [currentTrack, filteredTracks, setQueue, setTrack],
  );

  const renderTrack = useCallback(
    ({ item }: { item: PlayerTrack }) => (
      <TrackCard
        track={item}
        isPlaying={currentTrack?.id === item.id && isPlaying}
        onPress={() => handleTrackPress(item)}
      />
    ),
    [currentTrack, isPlaying, handleTrackPress],
  );

  const keyExtractor = useCallback((item: PlayerTrack) => String(item.id), []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sound Library</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} ·{' '}
          {formatTotalDuration(
            filteredTracks.reduce((sum, t) => sum + t.duration, 0),
          )}
        </Text>
      </View>

      {/* Category filter */}
      <CategoryChips
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
      />

      {/* Track list */}
      <FlatList
        data={filteredTracks}
        renderItem={renderTrack}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tracks yet</Text>
            <Text style={styles.emptySubtitle}>
              Tracks in this category will appear here
            </Text>
          </View>
        }
      />

      {/* Mini player */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
