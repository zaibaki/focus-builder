/**
 * Music Screen — Sound Library tab with Custom Ambient Mixer & Track Importer
 */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
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

const CHANNELS = [
  { key: 'rain', label: 'Rain Sound', icon: '🌧️' },
  { key: 'birds', label: 'Forest Birds', icon: '🐦' },
  { key: 'cafe', label: 'Café Chatter', icon: '☕' },
  { key: 'beats', label: 'Binaural Waves', icon: '🧘' },
];

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

  // Mixer states
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [mixName, setMixName] = useState('');
  const [volumes, setVolumes] = useState<Record<string, number>>({
    rain: 0,
    birds: 0,
    cafe: 0,
    beats: 0,
  });

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

  const handleVolumeChange = (channel: string, level: number) => {
    setVolumes((prev) => ({ ...prev, [channel]: level }));
  };

  const handleSaveMix = async () => {
    if (!mixName.trim()) return;
    try {
      const config = JSON.stringify(volumes);
      await db.saveCustomMix(mixName, config);
      setMixName('');
      setVolumes({ rain: 0, birds: 0, cafe: 0, beats: 0 });
      setIsMixerOpen(false);
      await loadSavedMixesAndTracks();
      setActiveCategory('custom'); // Switch to custom tab
    } catch (e) {
      console.warn('Failed to save mix', e);
    }
  };

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
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Sound Library</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} ·{' '}
              {formatTotalDuration(
                filteredTracks.reduce((sum, t) => sum + t.duration, 0),
              )}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            {/* Toggle Mixer Button */}
            <Pressable
              style={({ pressed }) => [
                styles.mixerToggle,
                isMixerOpen && styles.mixerToggleActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setIsMixerOpen(!isMixerOpen)}
            >
              <Text style={styles.mixerToggleText}>
                {isMixerOpen ? 'Mixer' : '🎛️ Mixer'}
              </Text>
            </Pressable>

            {/* Import Audio Button */}
            <Pressable
              style={({ pressed }) => [
                styles.mixerToggle,
                pressed && styles.pressed,
              ]}
              onPress={handleImportAudio}
            >
              <Text style={styles.mixerToggleText}>
                📥 Import
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Category filter */}
      <CategoryChips
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
      />

      {/* Mixer Panel */}
      {isMixerOpen && (
        <View style={styles.mixerConsole}>
          <Text style={styles.mixerTitle}>Create Custom Ambient Mix</Text>
          
          {CHANNELS.map((ch) => (
            <View key={ch.key} style={styles.mixerRow}>
              <View style={styles.channelInfo}>
                <Text style={styles.channelIcon}>{ch.icon}</Text>
                <Text style={styles.channelLabel}>{ch.label}</Text>
              </View>

              <View style={styles.swatchContainer}>
                {[0, 1, 2, 3, 4].map((level) => {
                  const isActive = volumes[ch.key] >= level;
                  return (
                    <Pressable
                      key={level}
                      style={[
                        styles.swatch,
                        isActive && styles.swatchActive,
                        level === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                        level === 4 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                      ]}
                      onPress={() => handleVolumeChange(ch.key, level)}
                    />
                  );
                })}
              </View>
            </View>
          ))}

          {/* Mix Name Input */}
          <View style={styles.saveContainer}>
            <TextInput
              style={styles.mixerInput}
              placeholder="Name your ambient mix..."
              placeholderTextColor={Colors.textMuted}
              value={mixName}
              onChangeText={setMixName}
              maxLength={25}
            />
            <Pressable
              style={({ pressed }) => [
                styles.mixerSaveButton,
                !mixName.trim() && styles.mixerSaveDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleSaveMix}
              disabled={!mixName.trim()}
            >
              <Text style={styles.mixerSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

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
                ? 'Create a custom mix or import a local audio track!'
                : 'Tracks in this category will appear here'}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: FontSize.xxl - 2,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  mixerToggle: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mixerToggleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  mixerToggleText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  mixerConsole: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  mixerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  mixerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    fontSize: FontSize.lg,
    marginRight: Spacing.sm,
  },
  channelLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  swatchContainer: {
    flexDirection: 'row',
    height: 24,
    width: 140,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 6,
  },
  swatch: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: Colors.surface,
  },
  swatchActive: {
    backgroundColor: Colors.primary,
  },
  saveContainer: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  mixerInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    height: 40,
  },
  mixerSaveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    height: 40,
  },
  mixerSaveDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    opacity: 0.5,
  },
  mixerSaveText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
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
});
