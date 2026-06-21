/**
 * Timer Screen — The main Focus Session tab
 */
import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularProgress } from '../../components/timer/CircularProgress';
import { useTimerStore } from '../../stores/useTimerStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import * as db from '../../services/database';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
} from '../../constants/colors';

// ─── Helpers ────────────────────────────────────────────
/** Format seconds → MM:SS */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Constants ──────────────────────────────────────────
const RING_SIZE = 250;
const RING_STROKE = 10;

// ─── Screen ─────────────────────────────────────────────
export default function TimerScreen() {
  const insets = useSafeAreaInsets();

  const {
    isRunning,
    isPaused,
    targetDuration,
    elapsed,
    label,
    presets,
    setTargetDuration,
    setLabel,
    startSession,
    pauseSession,
    resumeSession,
    abandonSession,
    tick,
  } = useTimerStore();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  // Background Soothing Pan/Zoom Animation (Ken Burns Effect)
  const zoomAnim = useRef(new Animated.Value(1.0)).current;
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying && currentTrack) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(zoomAnim, {
              toValue: 1.12,
              duration: 22000,
              useNativeDriver: true,
            }),
            Animated.timing(panAnim, {
              toValue: { x: 8, y: -8 },
              duration: 22000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(zoomAnim, {
              toValue: 1.0,
              duration: 22000,
              useNativeDriver: true,
            }),
            Animated.timing(panAnim, {
              toValue: { x: -8, y: 8 },
              duration: 22000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animationLoop.start();
    } else {
      zoomAnim.setValue(1.0);
      panAnim.setValue({ x: 0, y: 0 });
    }
    
    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [isPlaying, currentTrack]);

  const handleSimulateDistraction = async () => {
    const blocked = useBlockStore.getState().blockedApps.filter(a => a.isActive);
    let appName = 'Instagram';
    let pkgName = 'com.instagram.android';
    
    if (blocked.length > 0) {
      appName = blocked[0].displayName;
      pkgName = blocked[0].packageName;
    }
    
    useBlockStore.getState().triggerBlockOverlay(appName, pkgName);
  };

  // Timer tick
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, tick]);

  // Derived values
  const remaining = Math.max(targetDuration - elapsed, 0);
  const progress = targetDuration > 0 ? elapsed / targetDuration : 0;
  const isIdle = !isRunning;
  const selectedMinutes = targetDuration / 60;

  return (
    <View style={styles.root}>
      {currentTrack && isPlaying && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.Image
            source={currentTrack.artwork}
            style={[
              styles.backgroundImage,
              {
                transform: [
                  { scale: zoomAnim },
                  { translateX: panAnim.x },
                  { translateY: panAnim.y },
                ],
              },
            ]}
            resizeMode="cover"
          />
          <View style={styles.backgroundOverlay} />
        </View>
      )}

      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* ── Title ─────────────────────────── */}
      <Text style={styles.title}>Focus Session</Text>

      {/* ── Circular Progress Ring ─────────── */}
      <View style={styles.ringWrapper}>
        <CircularProgress
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
          progress={progress}
        >
          <Text style={styles.timeText}>{formatTime(remaining)}</Text>
          <Text style={styles.labelBelow}>
            {label.trim() || 'Stay focused'}
          </Text>
        </CircularProgress>
      </View>

      {/* ── Duration Presets ──────────────── */}
      {isIdle && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsRow}
          style={styles.presetsScroll}
        >
          {presets.map((minutes) => {
            const isSelected = selectedMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => setTargetDuration(minutes * 60)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {minutes}m
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── Optional Label Input ──────────── */}
      {isIdle && (
        <TextInput
          style={styles.input}
          placeholder="Session label (optional)"
          placeholderTextColor={Colors.textMuted}
          value={label}
          onChangeText={setLabel}
          maxLength={60}
          returnKeyType="done"
        />
      )}

      {/* ── Action Buttons ───────────────── */}
      <View style={styles.actionsRow}>
        {isIdle && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={startSession}
          >
            <Text style={styles.primaryButtonText}>Start Focus</Text>
          </Pressable>
        )}

        {isRunning && !isPaused && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={pauseSession}
            >
              <Text style={styles.secondaryButtonText}>Pause</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={abandonSession}
            >
              <Text style={styles.dangerButtonText}>Give Up</Text>
            </Pressable>
          </>
        )}

        {isRunning && isPaused && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={resumeSession}
            >
              <Text style={styles.secondaryButtonText}>Resume</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={abandonSession}
            >
              <Text style={styles.dangerButtonText}>Give Up</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* ── Simulation Button ────────────── */}
      {isRunning && !isPaused && (
        <Pressable
          style={({ pressed }) => [
            styles.simulateButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSimulateDistraction}
        >
          <Text style={styles.simulateButtonText}>Simulate Distraction App Open</Text>
        </Pressable>
      )}
    </ScrollView>
  </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.28,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    opacity: 0.65,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Title
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },

  // Ring
  ringWrapper: {
    marginBottom: Spacing.xl,
  },
  timeText: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  labelBelow: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Presets
  presetsScroll: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  presetsRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textPrimary,
  },

  // Input
  input: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },

  // Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.error,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  simulateButton: {
    width: '100%',
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  simulateButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.accent,
  },
});
