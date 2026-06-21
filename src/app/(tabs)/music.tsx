/**
 * Music Screen — Sound Library tab with Track Importer
 */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, copyAsync, deleteAsync } from 'expo-file-system/legacy';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { BUNDLED_TRACKS, CATEGORIES, DEFAULT_ARTWORK } from '../../constants/tracks';
import { usePlayerStore, type PlayerTrack } from '../../stores/usePlayerStore';
import CategoryChips from '../../components/music/CategoryChips';
import TrackCard from '../../components/music/TrackCard';
import MiniPlayer from '../../components/music/MiniPlayer';
import * as db from '../../services/database';

function toPlayerTrack(track: (typeof BUNDLED_TRACKS)[number], index: number): PlayerTrack {
  return {
    id: index + 1,
    title: track.title,
    artist: track.artist,
    uri: '',
    artwork: track.artwork,
    duration: track.duration_sec,
    category: track.category,
  };
}

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

  // Custom mixes and imported tracks loaded from SQLite
  const [savedMixes, setSavedMixes] = useState<PlayerTrack[]>([]);

  // Load custom mixes AND user-imported audio tracks from DB
  const loadSavedMixesAndTracks = useCallback(async () => {
    try {
      // 1. Fetch custom slider mixes
      const mixes = await db.getCustomMixes();
      const mappedMixes: PlayerTrack[] = mixes.map((m) => ({
        id: 1000 + m.id, // Mix IDs start at 1000
        title: m.name,
        artist: 'My Custom Mix',
        uri: '',
        artwork: DEFAULT_ARTWORK,
        duration: 1800, // 30m simulated loops
        category: 'custom',
      }));

      // 2. Fetch user-imported audio tracks
      const imported = await db.getAllTracks('custom');
      const mappedImported: PlayerTrack[] = imported.map((t) => ({
        id: 5000 + t.id, // Imported track IDs start at 5000
        title: t.title,
        artist: t.artist || 'Imported Track',
        uri: t.uri,
        artwork: DEFAULT_ARTWORK,
        duration: t.duration_sec || 300,
        category: 'custom',
      }));

      // Combine both in the "My Tracks" category
      setSavedMixes([...mappedMixes, ...mappedImported]);
    } catch (e) {
      console.warn('Failed to load custom library items:', e);
    }
  }, []);

  useEffect(() => {
    loadSavedMixesAndTracks();
  }, [loadSavedMixesAndTracks]);

  // Build full player-track list from bundled data
  const allTracks = useMemo(
    () => BUNDLED_TRACKS.map(toPlayerTrack),
    [],
  );

  // Filter by active category
  const filteredTracks = useMemo(() => {
    if (activeCategory === 'custom') return savedMixes;
    if (activeCategory === 'all') return allTracks;
    return allTracks.filter((t) => t.category === activeCategory);
  }, [allTracks, activeCategory, savedMixes]);

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

  const handleImportAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const filename = asset.name || `track_${Date.now()}.mp3`;
      const localUri = documentDirectory + filename;

      // Copy file from cache to app permanent storage sandbox
      await copyAsync({
        from: asset.uri,
        to: localUri,
      });

      // Insert track record into SQLite
      await db.insertTrack({
        title: filename.replace(/\.[^/.]+$/, ""), // Strip file extension
        artist: 'Local Import',
        uri: localUri,
        category: 'custom',
        duration_sec: 300,
      });

      await loadSavedMixesAndTracks();
      setActiveCategory('custom'); // Automatically focus custom tab
      Alert.alert('Success', `${filename} imported to your Sound Library.`);
    } catch (e) {
      console.warn('Failed to import track', e);
      Alert.alert('Import Failed', 'Unable to copy audio file.');
    }
  };

  const handleDeleteItem = async (item: PlayerTrack) => {
    try {
      if (item.id >= 5000) {
        // User imported track
        const dbId = item.id - 5000;
        await db.deleteTrack(dbId);
        // Clean up file sandbox
        if (item.uri) {
          await deleteAsync(item.uri, { idempotent: true }).catch(() => {});
        }
      } else {
        // Saved Custom Mix
        const dbId = item.id - 1000;
        await db.deleteCustomMix(dbId);
      }
      
      loadSavedMixesAndTracks();
      if (currentTrack?.id === item.id) {
        usePlayerStore.getState().clearPlayer();
      }
    } catch (e) {
      console.warn('Failed to delete item', e);
    }
  };

  const renderTrack = useCallback(
    ({ item }: { item: PlayerTrack }) => {
      const isCurrent = currentTrack?.id === item.id;
      return (
        <View style={styles.trackCardRow}>
          <View style={{ flex: 1 }}>
            <TrackCard
              track={item}
              isPlaying={isCurrent && isPlaying}
              onPress={() => handleTrackPress(item)}
            />
          </View>
          {item.category === 'custom' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [currentTrack, isPlaying, handleTrackPress]
  );

  const keyExtractor = useCallback((item: PlayerTrack) => String(item.id), []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Sound Library</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} ·{' '}
              {formatTotalDuration(
                filteredTracks.reduce((sum, t) => sum + t.duration, 0),
              )}
            </Text>
          </View>
        </View>
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
              {activeCategory === 'custom'
                ? 'Import a local audio track using the + button!'
                : 'Tracks in this category will appear here'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button for importing */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.pressed,
        ]}
        onPress={handleImportAudio}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  trackCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 20,
    fontWeight: '300',
    marginTop: -3,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
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
    textAlign: 'center',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    bottom: 86,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
  fabIcon: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
