/**
 * Player Store — Manages music playback state
 */
import { create } from 'zustand';

export interface PlayerTrack {
  id: number;
  title: string;
  artist: string;
  uri: string;
  artwork: any; // require() asset or URI string
  duration: number;
  category: string;
}

interface PlayerState {
  // Playback state
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number; // 0 to 1
  queue: PlayerTrack[];
  currentIndex: number;

  // Filter
  activeCategory: string;

  // Actions
  setTrack: (track: PlayerTrack) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setProgress: (progress: number) => void;
  setQueue: (tracks: PlayerTrack[]) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setActiveCategory: (category: string) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  queue: [],
  currentIndex: -1,
  activeCategory: 'all',

  setTrack: (track) => {
    const { queue } = get();
    const index = queue.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentIndex: index >= 0 ? index : -1,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setProgress: (progress) => set({ progress }),

  setQueue: (tracks) => set({ queue: tracks }),

  nextTrack: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    set({
      currentTrack: queue[nextIndex],
      currentIndex: nextIndex,
      isPlaying: true,
      progress: 0,
    });
  },

  previousTrack: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    set({
      currentTrack: queue[prevIndex],
      currentIndex: prevIndex,
      isPlaying: true,
      progress: 0,
    });
  },

  setActiveCategory: (category) => set({ activeCategory: category }),

  clearPlayer: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      currentIndex: -1,
    }),
}));
