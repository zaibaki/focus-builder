/**
 * TrackCard — Individual track row for the music library
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
import type { PlayerTrack } from '../../stores/usePlayerStore';

interface TrackCardProps {
  track: PlayerTrack;
  isPlaying: boolean;
  onPress: () => void;
}

/** Format seconds → "M:SS" */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.textPrimary}>
      <Path d="M8 5.14v14l11-7-11-7z" />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.textPrimary}>
      <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </Svg>
  );
}

export default function TrackCard({ track, isPlaying, onPress }: TrackCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Artwork */}
      <Image source={track.artwork} style={styles.artwork} />

      {/* Track info */}
      <View style={styles.info}>
        <Text style={[styles.title, isPlaying && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      {/* Duration + Play/Pause */}
      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>

      <TouchableOpacity
        style={styles.playButton}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  containerActive: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.25)',
  },
  artwork: {
    width: 48,
    height: 48,
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
  titleActive: {
    color: Colors.primaryLight,
  },
  artist: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  duration: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
