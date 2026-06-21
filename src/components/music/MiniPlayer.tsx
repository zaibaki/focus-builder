/**
 * MiniPlayer — Persistent bottom bar showing current track + controls
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { usePlayerStore } from '../../stores/usePlayerStore';

function PlayIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={Colors.textPrimary}>
      <Path d="M8 5.14v14l11-7-11-7z" />
    </Svg>
  );
}

function PauseIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={Colors.textPrimary}>
      <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </Svg>
  );
}

function NextIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={Colors.textSecondary}>
      <Path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
    </Svg>
  );
}

export default function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(progress * 100).toFixed(1)}%` as any },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Artwork */}
        <Image source={currentTrack.artwork} style={styles.artwork} />

        {/* Track info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={togglePlayback}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={nextTrack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NextIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.surface,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: Spacing.md,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  artist: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
});
