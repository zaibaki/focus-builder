import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  Animated,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useBlockStore } from '../../stores/useBlockStore';
import { useTimerStore } from '../../stores/useTimerStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';
import * as db from '../../services/database';

const OVERLAY_IMAGE = require('../../../assets/images/ui/blocker_overlay.jpg');
const COMMITMENT_PHRASE = "I commit to my focus session";

export function BlockerOverlay() {
  const showOverlay = useBlockStore((s) => s.showOverlay);
  const overlayAppName = useBlockStore((s) => s.overlayAppName);
  const overlayPackageName = useBlockStore((s) => s.overlayPackageName);
  const dismissBlockOverlay = useBlockStore((s) => s.dismissBlockOverlay);

  const sessionId = useTimerStore((s) => s.sessionId);

  // States: 'breathing' | 'choice' | 'bypass'
  const [step, setStep] = useState<'breathing' | 'choice' | 'bypass'>('breathing');
  const [breathText, setBreathText] = useState('Inhale...');
  const [commitmentInput, setCommitmentInput] = useState('');
  
  // Animation ref
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showOverlay) {
      setStep('breathing');
      setBreathText('Inhale...');
      setCommitmentInput('');
      
      // Start breathing animation sequence
      // Inhale: scale from 1 to 1.5 (4 seconds)
      // Exhale: scale from 1.5 to 1 (4 seconds)
      const breathingAnimation = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 4000,
          useNativeDriver: true,
        })
      ]);

      Animated.loop(breathingAnimation).start();

      // Breath step timers
      const textTimer = setTimeout(() => {
        setBreathText('Exhale...');
      }, 4000);

      const stepTimer = setTimeout(() => {
        setStep('choice');
      }, 8000);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(stepTimer);
        pulseAnim.setValue(1);
      };
    }
  }, [showOverlay]);

  const handleBackToFocus = async () => {
    if (sessionId && overlayPackageName) {
      await db.logBlockAttempt(sessionId, overlayPackageName, false);
    }
    dismissBlockOverlay();
  };

  const handleActivatePass = async () => {
    if (commitmentInput.trim().toLowerCase() === COMMITMENT_PHRASE.toLowerCase()) {
      if (sessionId && overlayPackageName) {
        await db.logBlockAttempt(sessionId, overlayPackageName, true);
      }
      dismissBlockOverlay();
    }
  };

  if (!showOverlay) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={showOverlay}
      onRequestClose={handleBackToFocus}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlayContainer}
      >
        <View style={styles.card}>
          
          {/* STEP 1: Breathing check */}
          {step === 'breathing' && (
            <View style={styles.stepContent}>
              <View style={styles.warningTag}>
                <Text style={styles.warningText}>MINDFUL PAUSE</Text>
              </View>
              <Text style={styles.title}>Resisting Impulse</Text>
              <Text style={styles.subtitle}>
                Take a deep breath. Let the impulse pass away.
              </Text>
              
              <View style={styles.breathingContainer}>
                <Animated.View style={[
                  styles.breathingCircle,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <Text style={styles.breathText}>{breathText}</Text>
                </Animated.View>
              </View>
            </View>
          )}

          {/* STEP 2: Make choice */}
          {step === 'choice' && (
            <View style={styles.stepContent}>
              <View style={styles.warningTag}>
                <Text style={styles.warningText}>DISTRACTION INTERCEPTED</Text>
              </View>
              
              <Image source={OVERLAY_IMAGE} style={styles.illustration} resizeMode="cover" />
              
              <Text style={styles.title}>Do you really need this?</Text>
              <Text style={styles.subtitle}>
                You blocked <Text style={styles.appName}>{overlayAppName || 'this app'}</Text> to focus on your goals.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={handleBackToFocus}
              >
                <Text style={styles.buttonText}>No, Back to Focus</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.textButton, pressed && styles.buttonPressed]}
                onPress={() => setStep('bypass')}
              >
                <Text style={styles.textButtonText}>Yes, I need a 1-minute pass</Text>
              </Pressable>
            </View>
          )}

          {/* STEP 3: Commitment Bypass */}
          {step === 'bypass' && (
            <View style={styles.stepContent}>
              <View style={styles.warningTag}>
                <Text style={styles.warningText}>FOCUS INTEGRITY COMMITMENT</Text>
              </View>
              
              <Text style={styles.title}>Type Commitment</Text>
              <Text style={styles.subtitle}>
                To unlock a 1-minute bypass, type the focus phrase exactly as shown:
              </Text>
              
              <View style={styles.phraseBox}>
                <Text style={styles.phraseText}>{COMMITMENT_PHRASE}</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Type the phrase here..."
                placeholderTextColor={Colors.textMuted}
                value={commitmentInput}
                onChangeText={setCommitmentInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  commitmentInput.trim().toLowerCase() !== COMMITMENT_PHRASE.toLowerCase() && styles.buttonDisabled,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleActivatePass}
                disabled={commitmentInput.trim().toLowerCase() !== COMMITMENT_PHRASE.toLowerCase()}
              >
                <Text style={styles.buttonText}>Activate 1-Minute Pass</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.textButton, pressed && styles.buttonPressed]}
                onPress={() => setStep('choice')}
              >
                <Text style={styles.textButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  warningTag: {
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    marginBottom: Spacing.md,
  },
  warningText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  illustration: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  appName: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  breathingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  breathText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  phraseBox: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    width: '100%',
  },
  phraseText: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  textButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  textButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
