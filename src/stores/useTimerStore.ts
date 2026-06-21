/**
 * Timer Store — Manages focus session state
 */
import { create } from 'zustand';
import * as db from '../services/database';
import ExpoAppBlocker from '../../modules/expo-app-blocker/src/ExpoAppBlockerModule';
import { useBlockStore } from './useBlockStore';

interface TimerState {
  // Timer state
  isRunning: boolean;
  isPaused: boolean;
  targetDuration: number; // seconds
  elapsed: number; // seconds
  sessionId: number | null;
  label: string;

  // Preset durations (in minutes)
  presets: number[];

  // Visual Theme State
  selectedThemeId: string;

  // Actions
  setTargetDuration: (seconds: number) => void;
  setLabel: (label: string) => void;
  setSelectedThemeId: (id: string) => void;
  startSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  tick: () => void;
  completeSession: () => Promise<void>;
  abandonSession: () => Promise<void>;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  targetDuration: 25 * 60, // 25 minutes default
  elapsed: 0,
  sessionId: null,
  label: '',
  presets: [15, 25, 45, 60, 90],
  selectedThemeId: 'deep_focus',

  setTargetDuration: (seconds) => set({ targetDuration: seconds, elapsed: 0 }),
  setLabel: (label) => set({ label }),
  setSelectedThemeId: (selectedThemeId) => set({ selectedThemeId }),

  startSession: async () => {
    const { targetDuration, label } = get();
    const sessionId = await db.createSession(targetDuration, label || undefined);
    set({ isRunning: true, isPaused: false, elapsed: 0, sessionId });

    // Trigger native app blocking
    const activeBlockedApps = useBlockStore.getState().blockedApps
      .filter((a) => a.isActive)
      .map((a) => a.packageName);
    if (activeBlockedApps.length > 0) {
      ExpoAppBlocker.startBlocking(activeBlockedApps);
      useBlockStore.setState({ isBlockingActive: true });
    }
  },

  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),

  tick: () => {
    const { elapsed, targetDuration, isRunning, isPaused } = get();
    if (!isRunning || isPaused) return;
    if (elapsed >= targetDuration) {
      get().completeSession();
      return;
    }
    set({ elapsed: elapsed + 1 });
  },

  completeSession: async () => {
    const { sessionId, elapsed } = get();
    if (sessionId) {
      await db.completeSession(sessionId, elapsed);
    }
    set({ isRunning: false, isPaused: false, sessionId: null });

    // Terminate native app blocking
    ExpoAppBlocker.stopBlocking();
    useBlockStore.setState({ isBlockingActive: false });
  },

  abandonSession: async () => {
    const { sessionId, elapsed } = get();
    if (sessionId) {
      await db.abandonSession(sessionId, elapsed);
    }
    set({ isRunning: false, isPaused: false, elapsed: 0, sessionId: null });

    // Terminate native app blocking
    ExpoAppBlocker.stopBlocking();
    useBlockStore.setState({ isBlockingActive: false });
  },

  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      elapsed: 0,
      sessionId: null,
      label: '',
    }),
}));
