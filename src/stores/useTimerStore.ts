/**
 * Timer Store — Manages focus session state
 */
import { create } from 'zustand';
import * as db from '../services/database';

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

  // Actions
  setTargetDuration: (seconds: number) => void;
  setLabel: (label: string) => void;
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

  setTargetDuration: (seconds) => set({ targetDuration: seconds, elapsed: 0 }),
  setLabel: (label) => set({ label }),

  startSession: async () => {
    const { targetDuration, label } = get();
    const sessionId = await db.createSession(targetDuration, label || undefined);
    set({ isRunning: true, isPaused: false, elapsed: 0, sessionId });
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
  },

  abandonSession: async () => {
    const { sessionId, elapsed } = get();
    if (sessionId) {
      await db.abandonSession(sessionId, elapsed);
    }
    set({ isRunning: false, isPaused: false, elapsed: 0, sessionId: null });
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
