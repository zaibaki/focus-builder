/**
 * Settings Screen — Preferences, DAW Ambient Mixer, Audio Modes, Playback Speeds, and Diagnostics
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import { usePlayerStore } from '../../stores/usePlayerStore';
import * as db from '../../services/database';

// ─── Custom High-Fidelity SVG Icon Components ────────────────────

function RainIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.secondary : Colors.textSecondary;
  const cloudColor = active ? Colors.primaryLight : Colors.textMuted;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 15A4.5 4.5 0 0 0 17 6h-.5A7 7 0 0 0 3 11.5c0 .25.02.5.05.75A4.5 4.5 0 0 0 7.5 17h10a4.5 4.5 0 0 0 0-9z"
        fill={cloudColor}
        opacity={active ? 0.25 : 0.1}
      />
      <Path
        d="M19 12c0-2.2-1.8-4-4-4a5.9 5.9 0 0 0-11 3 4 4 0 0 0 3 6.9H19a4 4 0 0 0 0-5.9z"
        stroke={cloudColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={8} y1={19} x2={6} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={10} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={16} y1={19} x2={14} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BirdsIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.secondary : Colors.textSecondary;
  const branchColor = active ? Colors.primaryLight : Colors.textMuted;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18h18" stroke={branchColor} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M17 18c0-2.5-1-5-3.5-5.5A4.5 4.5 0 0 0 10.5 8c0-1.2.4-2 1.2-2.4-1.2 0-2.4.4-2.8 1.6C8.5 8.5 7.5 9 6.5 9c-1.2 0-2 .4-2.4 1.2 2 .4 2.4 2 2.4 3.6 0 .8.4 2 1.2 2.4M12.5 12l1.2-1.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Singing note symbol */}
      <Path d="M19 4v3.5M17.5 5.5h3" stroke={Colors.accent} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function CafeIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.accent : Colors.textSecondary;
  const cupBg = active ? Colors.accent : Colors.textMuted;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 8H6c0 0 0 6 5.5 6s5.5-6 5.5-6z"
        fill={cupBg}
        opacity={active ? 0.25 : 0.1}
      />
      <Path
        d="M5 8h12a1 1 0 0 1 1 1v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V9a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 11h1.2a1.8 1.8 0 0 1 1.8 1.8v0a1.8 1.8 0 0 1-1.8 1.8H18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 21h18" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
      {/* Steam lines */}
      <Path d="M8 5c.4-.8 0-1.6.4-2.4M11 5c.4-.8 0-1.6.4-2.4M14 5c.4-.8 0-1.6.4-2.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function BeatsIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.primaryLight : Colors.textSecondary;
  const wave2 = active ? Colors.secondary : Colors.textMuted;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12c2.5-6 4.5 6 7 0s2.5-6 5 0 3.5 6 5.5 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M4 12c2.5 6 4.5-6 7 0s2.5 6 5 0 3.5-6 5.5 0"
        stroke={wave2}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={active ? 0.6 : 0.3}
      />
    </Svg>
  );
}

function NormalModeIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.primaryLight : Colors.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M9.5 15.5V8.5l6 3.5-6 3.5z" fill={color} />
    </Svg>
  );
}

function AlphaModeIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.primaryLight : Colors.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 9c2-4 5.5-6 7.5-6s5.5 2 7.5 6M4.5 15c2 4 5.5 6 7.5 6s5.5-2 7.5-6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line x1={8} y1={6} x2={8} y2={18} stroke={color} strokeWidth={1.5} opacity={active ? 0.75 : 0.4} />
      <Line x1={12} y1={3} x2={12} y2={21} stroke={color} strokeWidth={1.5} opacity={active ? 0.75 : 0.4} />
      <Line x1={16} y1={6} x2={16} y2={18} stroke={color} strokeWidth={1.5} opacity={active ? 0.75 : 0.4} />
    </Svg>
  );
}

function ThetaModeIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.secondary : Colors.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4c-4.5 0-8 3-8 7.5 0 2.2.8 4 2.2 5.5a3 3 0 0 1 .8 2v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 1 .8-2c1.4-1.5 2.2-3.3 2.2-5.5C20 7 16.5 4 12 4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M12 4v16" stroke={color} strokeWidth={1.5} strokeDasharray="3 3" />
      <Circle cx={8.5} cy={10} r={1.5} fill={color} />
      <Circle cx={15.5} cy={10} r={1.5} fill={color} />
    </Svg>
  );
}

function DeepFocusEQIcon({ active }: { active?: boolean }) {
  const color = active ? Colors.accent : Colors.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1={5} y1={20} x2={5} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
      <Line x1={12} y1={20} x2={12} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
      <Line x1={19} y1={20} x2={19} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
      <Circle cx={5} cy={7} r={3} fill={color} />
      <Circle cx={12} cy={15} r={3} fill={color} />
      <Circle cx={19} cy={10} r={3} fill={color} />
    </Svg>
  );
}

// ─── Data definitions ────────────────────────────────────────────

const CHANNELS = [
  { key: 'rain', label: 'Rain Sound' },
  { key: 'birds', label: 'Forest Birds' },
  { key: 'cafe', label: 'Café Chatter' },
  { key: 'beats', label: 'Binaural Waves' },
];

const SPEEDS = [0.5, 0.8, 1.0, 1.25, 1.5];

const AUDIO_MODES = [
  { key: 'normal', label: 'Normal Mode', desc: 'Standard ambient mix loop playbacks' },
  { key: 'alpha', label: 'Alpha Waves (10Hz)', desc: 'Backing pulses for learning & memory' },
  { key: 'theta', label: 'Theta Waves (5Hz)', desc: 'Deep binaural resonance for creative focus' },
  { key: 'deep-eq', label: 'Deep Focus EQ', desc: 'Attenuates high frequencies; warm bass focus' },
] as const;

function ChannelIcon({ channelKey, active }: { channelKey: string; active: boolean }) {
  switch (channelKey) {
    case 'rain':
      return <RainIcon active={active} />;
    case 'birds':
      return <BirdsIcon active={active} />;
    case 'cafe':
      return <CafeIcon active={active} />;
    case 'beats':
      return <BeatsIcon active={active} />;
    default:
      return null;
  }
}

function ModeIcon({ modeKey, active }: { modeKey: string; active: boolean }) {
  switch (modeKey) {
    case 'normal':
      return <NormalModeIcon active={active} />;
    case 'alpha':
      return <AlphaModeIcon active={active} />;
    case 'theta':
      return <ThetaModeIcon active={active} />;
    case 'deep-eq':
      return <DeepFocusEQIcon active={active} />;
    default:
      return null;
  }
}

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

  // Local Custom Mix States
  const [mixName, setMixName] = useState('');
  const [savedMixList, setSavedMixList] = useState<any[]>([]);

  // Load custom mixes
  const loadSavedMixes = useCallback(async () => {
    try {
      const data = await db.getCustomMixes();
      setSavedMixList(data);
    } catch (e) {
      console.warn('Failed to load mixes:', e);
    }
  }, []);

  useEffect(() => {
    loadSavedMixes();
  }, [loadSavedMixes]);

  // Handle saving of current slider mix configuration
  const handleSaveMix = async () => {
    if (!mixName.trim()) return;
    try {
      const config = JSON.stringify(mixerVolumes);
      await db.saveCustomMix(mixName.trim(), config);
      setMixName('');
      loadSavedMixes();
      Alert.alert('Mix Saved', `"${mixName.trim()}" is now saved. Select it anytime in the Sound Library.`);
    } catch (e) {
      console.warn('Failed to save mix', e);
      Alert.alert('Error', 'Failed to save custom ambient mix.');
    }
  };

  // Delete a saved mix
  const handleDeleteMix = async (id: number, name: string) => {
    Alert.alert('Delete Mix?', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.deleteCustomMix(id);
            loadSavedMixes();
          } catch (e) {
            console.warn(e);
          }
        },
      },
    ]);
  };

  // Toggle or select volume levels
  const handleChannelVolumePress = (channel: string, level: number) => {
    const current = mixerVolumes[channel] ?? 0;
    if (current === level) {
      // Toggle mute if tapping the active block
      setMixerVolume(channel, 0);
    } else {
      setMixerVolume(channel, level);
    }
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Wipe Database?',
      'This will permanently delete all focus history, achievements, custom uploaded tracks, and custom mixer settings. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.resetDatabase();
              usePlayerStore.getState().clearPlayer();
              resetMixer();
              setPlaybackSpeed(1.0);
              setAudioMode('normal');
              loadSavedMixes();
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
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>DAW Ambient Mixer</Text>
          {(mixerVolumes.rain > 0 || mixerVolumes.birds > 0 || mixerVolumes.cafe > 0 || mixerVolumes.beats > 0) && (
            <Pressable onPress={resetMixer} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.cardDesc}>
          Blend background tracks to build a custom acoustic sanctuary. Tapping an active volume block will mute that channel.
        </Text>

        {CHANNELS.map((ch) => {
          const activeVol = mixerVolumes[ch.key] ?? 0;
          const isChannelActive = activeVol > 0;

          return (
            <View key={ch.key} style={styles.mixerRow}>
              <View style={styles.channelInfo}>
                <View style={[styles.iconWrapper, isChannelActive && styles.iconWrapperActive]}>
                  <ChannelIcon channelKey={ch.key} active={isChannelActive} />
                </View>
                <Text style={[styles.channelLabel, isChannelActive && styles.channelLabelActive]}>
                  {ch.label}
                </Text>
              </View>

              {/* Daw Mixer Swatches */}
              <View style={styles.swatchContainer}>
                {[1, 2, 3, 4].map((level) => {
                  const isActive = activeVol >= level;
                  return (
                    <Pressable
                      key={level}
                      style={({ pressed }) => [
                        styles.swatch,
                        isActive && styles.swatchActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleChannelVolumePress(ch.key, level)}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.saveContainer}>
          <TextInput
            style={styles.mixerInput}
            placeholder="Name your custom mix..."
            placeholderTextColor={Colors.textMuted}
            value={mixName}
            onChangeText={setMixName}
            maxLength={20}
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
            <Text style={styles.mixerSaveText}>Save Mix</Text>
          </Pressable>
        </View>
      </View>

      {/* SECTION 2: Saved Mixes List */}
      {savedMixList.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Custom Mixes</Text>
          <Text style={styles.cardDesc}>Activate saved volume blend presets directly.</Text>
          <View style={styles.savedMixesContainer}>
            {savedMixList.map((item) => {
              let config: Record<string, number> = {};
              try {
                config = JSON.parse(item.mix_config);
              } catch (e) {
                console.warn('Failed to parse custom mix config:', e);
              }

              const details = Object.keys(config)
                .map((k) => `${k}: ${config[k]}`)
                .join(' | ');

              return (
                <View key={item.id} style={styles.savedMixRow}>
                  <TouchableOpacity
                    style={styles.mixActivationButton}
                    onPress={() => {
                      // Apply mix configuration
                      for (const ch of Object.keys(config)) {
                        setMixerVolume(ch, config[ch]);
                      }
                      Alert.alert('Applied Mix', `"${item.name}" loaded successfully.`);
                    }}
                  >
                    <Text style={styles.savedMixName}>{item.name}</Text>
                    <Text style={styles.savedMixDetails}>{details}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteMixButton}
                    onPress={() => handleDeleteMix(item.id, item.name)}
                  >
                    <Text style={styles.deleteMixText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* SECTION 3: Playback Speed */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tempo Calibration</Text>
        <Text style={styles.cardDesc}>
          Adjust playback speed to modulate track pace (e.g. slowing nature bird loops down for deeper calming).
        </Text>

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

      {/* SECTION 4: Brainwave Audio Modes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cognitive Wave Entrainment</Text>
        <Text style={styles.cardDesc}>
          Inject binaural sound modulations to nudge brainwaves into targeted creative or deep focus states.
        </Text>

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
                  <View style={[styles.modeIconWrapper, isSelected && styles.modeIconWrapperActive]}>
                    <ModeIcon modeKey={mode.key} active={isSelected} />
                  </View>
                  <View style={styles.modeTitleContainer}>
                    <Text style={[styles.modeLabel, isSelected && styles.modeSelectedText]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* SECTION 5: Diagnostics & Wipe */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>System Diagnostic Cleanups</Text>
        <Text style={styles.cardDesc}>
          Wipe cached audio data, reset all SQLite tables, and restore Focus application to initial state.
        </Text>

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
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 58, 0.45)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
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
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  channelLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  channelLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  swatchContainer: {
    flexDirection: 'row',
    height: 28,
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  swatch: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
  },
  swatchActive: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  saveContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  mixerInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mixerSaveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mixerSaveDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.3,
  },
  mixerSaveText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  savedMixesContainer: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  savedMixRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  mixActivationButton: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  savedMixName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  savedMixDetails: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteMixButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error + '18',
  },
  deleteMixText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
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
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  speedChipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  speedText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  speedTextSelected: {
    color: Colors.primaryLight,
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
  },
  modeIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeIconWrapperActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  modeTitleContainer: {
    flex: 1,
  },
  modeLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  modeSelectedText: {
    color: Colors.primaryLight,
  },
  modeDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 16,
    marginTop: 2,
  },
  dangerCard: {
    borderColor: Colors.error + '40',
  },
  dangerTitle: {
    color: Colors.error,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
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
