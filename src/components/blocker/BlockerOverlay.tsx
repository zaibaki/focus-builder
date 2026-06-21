import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useBlockStore } from '../../stores/useBlockStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/colors';

const OVERLAY_IMAGE = require('../../../assets/images/ui/blocker_overlay.jpg');

export function BlockerOverlay() {
  const showOverlay = useBlockStore((s) => s.showOverlay);
  const overlayAppName = useBlockStore((s) => s.overlayAppName);
  const dismissBlockOverlay = useBlockStore((s) => s.dismissBlockOverlay);

  const [countdown, setCountdown] = useState(3);

  // Restart countdown when overlay is shown
  useEffect(() => {
    if (showOverlay) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            dismissBlockOverlay();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showOverlay, dismissBlockOverlay]);

  if (!showOverlay) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={showOverlay}
      onRequestClose={dismissBlockOverlay}
    >
      <View style={styles.overlayContainer}>
        <View style={styles.card}>
          {/* Header Warning */}
          <View style={styles.warningTag}>
            <Text style={styles.warningText}>DISTRACTION DETECTED</Text>
          </View>

          {/* Overlay Illustration */}
          <Image source={OVERLAY_IMAGE} style={styles.illustration} resizeMode="cover" />

          {/* Block Message */}
          <Text style={styles.title}>Stay Focused!</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.appName}>{overlayAppName || 'This app'}</Text> is blocked during your focus session.
          </Text>

          {/* Return Countdown / Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={dismissBlockOverlay}
          >
            <Text style={styles.buttonText}>
              Back to Focus ({countdown}s)
            </Text>
          </Pressable>
        </View>
      </View>
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
    height: 160,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl + 2,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  appName: {
    color: Colors.primaryLight,
    fontWeight: '700',
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
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
