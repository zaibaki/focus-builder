/**
 * Settings Screen — Preferences, Audio modes, playback speeds, and database controls
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import { usePlayerStore } from '../../stores/usePlayerStore';
import * as db from '../../services/database';

const CHANNELS = [
  { key: 'rain', label: 'Rain Sound', icon: '🌧️' },
  { key: 'birds', label: 'Forest Birds', icon: '🐦' },
  { key: 'cafe', label: 'Café Chatter', icon: '☕' },
  { key: 'beats', label: 'Binaural Waves', icon: '🧘' },
];

const SPEEDS = [0.5, 0.8, 1.0, 1.25, 1.5];

const AUDIO_MODES = [
  { key: 'normal', label: 'Normal Mode', desc: 'Standard music loop playback', emoji: '🎵' },
  { key: 'alpha', label: 'Alpha Waves', desc: '10Hz binaural beats for memory & learning', emoji: '🧬' },
  { key: 'theta', label: 'Theta Waves', desc: '5Hz binaural beats for creative focus', emoji: '🧠' },
  { key: 'deep-eq', label: 'Deep Focus EQ', desc: 'Attenuates high frequencies for soothing bass', emoji: '🔊' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  // Store bindings
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = usePlayerStore((s) => s.setPlaybackSpeed);
  const audioMode = usePlayerStore((s) => s.audioMode);
  const setAudioMode = usePlayerStore((s) => s.setAudioMode);
  const mixerVolumes = usePlayerStore((s) => s.mixerVolumes);
  const setMixerVolume = usePlayerStore((s) => s.setMixerVolume);
  const resetMixer = usePlayerStore((s) => s.resetMixer);

  // Local Mixer Save State
  const [mixName, setMixName] = useState('');

  const handleSaveMix = async () => {
    if (!mixName.trim()) return;
    try {
      const config = JSON.stringify(mixerVolumes);
      await db.saveCustomMix(mixName, config);
      setMixName('');
      resetMixer();
      Alert.alert('Mix Saved', `"${mixName}" is now available in your Sound Library.`);
    } catch (e) {
      console.warn('Failed to save mix', e);
      Alert.alert('Error', 'Failed to save custom ambient mix.');
    }
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database?',
      'This will permanently delete all focus sessions, blocked apps list, achievements, and custom mixes. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.resetDatabase();
              usePlayerStore.getState().clearPlayer();
              resetMixer();
              setPlaybackSpeed(1.0);
              setAudioMode('normal');
              Alert.alert('Database Cleared', 'Your database has been restored to factory settings.');
            } catch (err) {
              console.warn('Failed to reset database:', err);
              Alert.alert('Error', 'Unable to fully clear database.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl + 80 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Configure your audio settings and focus environment</Text>
      </View>

      {/* SECTION 1: Ambient Mixer */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎛️ Ambient Sound Mixer</Text>
        <Text style={styles.cardDesc}>
          Blend multiple background channels to create your own customizable flow environment.
        </Text>

        {CHANNELS.map((ch) => (
          <View key={ch.key} style={styles.mixerRow}>
            <View style={styles.channelInfo}>
              <Text style={styles.channelIcon}>{ch.icon}</Text>
              <Text style={styles.channelLabel}>{ch.label}</Text>
            </View>

            <View style={styles.swatchContainer}>
              {[0, 1, 2, 3, 4].map((level) => {
                const isActive = (mixerVolumes[ch.key] ?? 0) >= level;
                return (
                  <Pressable
                    key={level}
                    style={[
                      styles.swatch,
                      isActive && styles.swatchActive,
                      level === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                      level === 4 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                    ]}
                    onPress={() => setMixerVolume(ch.key, level)}
                  />
                );
              })}
            </View>
          </View>
        ))}

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

      {/* SECTION 2: Playback Speed */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ Audio Playback Speed</Text>
        <Text style={styles.cardDesc}>Adjust loop speed to modify tempo (e.g. slowing nature birds down).</Text>

        <View style={styles.speedRow}>
          {SPEEDS.map((speed) => {
            const isSelected = playbackSpeed === speed;
            return (
              <Pressable
                key={speed}
                style={[
                  styles.speedChip,
                  isSelected && styles.speedChipSelected,
                ]}
                onPress={() => setPlaybackSpeed(speed)}
              >
                <Text
                  style={[
                    styles.speedText,
                    isSelected && styles.speedTextSelected,
                  ]}
                >
                  {speed.toFixed(2)}x
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* SECTION 3: Brainwave Audio Modes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧘 Focus Audio Waves</Text>
        <Text style={styles.cardDesc}>Inject binaural frequency modulations to induce cognitive focus states.</Text>

        <View style={styles.modesContainer}>
          {AUDIO_MODES.map((mode) => {
            const isSelected = audioMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                style={[
                  styles.modeCard,
                  isSelected && styles.modeCardSelected,
                ]}
                onPress={() => setAudioMode(mode.key)}
              >
                <View style={styles.modeHeader}>
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                  <Text style={[styles.modeLabel, isSelected && styles.modeSelectedText]}>
                    {mode.label}
                  </Text>
                </View>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* SECTION 4: Danger Zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>🛡️ System Controls</Text>
        <Text style={styles.cardDesc}>Perform database diagnostic cleanups and wipe local storage files.</Text>

        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.pressed,
          ]}
          onPress={handleResetDatabase}
        >
          <Text style={styles.dangerButtonText}>Wipe Database & Reset App</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
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
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  speedChip: {
    flex: 1,
    minWidth: 50,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  speedChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  speedText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  speedTextSelected: {
    color: Colors.textPrimary,
  },
  modesContainer: {
    gap: Spacing.sm,
  },
  modeCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeCardSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeEmoji: {
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  modeLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modeSelectedText: {
    color: Colors.primaryLight,
  },
  modeDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
  dangerCard: {
    borderColor: Colors.error + '40',
  },
  dangerTitle: {
    color: Colors.error,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  dangerButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
