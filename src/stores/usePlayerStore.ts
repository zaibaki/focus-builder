import { create } from 'zustand';
import { audioService } from '../services/audio';

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

  // Audio Configurations (Preferences)
  playbackSpeed: number;
  audioMode: 'normal' | 'alpha' | 'theta' | 'deep-eq';
  mixerVolumes: Record<string, number>;

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

  // Preference Actions
  setPlaybackSpeed: (speed: number) => void;
  setAudioMode: (mode: 'normal' | 'alpha' | 'theta' | 'deep-eq') => void;
  setMixerVolume: (channel: string, level: number) => void;
  resetMixer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  queue: [],
  currentIndex: -1,
  activeCategory: 'all',

  // Default Preferences
  playbackSpeed: 1.0,
  audioMode: 'normal',
  mixerVolumes: {
    rain: 0,
    birds: 0,
    cafe: 0,
    beats: 0,
  },

  setTrack: (track) => {
    const { queue } = get();
    const index = queue.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentIndex: index >= 0 ? index : -1,
    });
    audioService.playTrack(track);
  },

  play: () => {
    set({ isPlaying: true });
    audioService.resume();
  },

  pause: () => {
    set({ isPlaying: false });
    audioService.pause();
  },

  togglePlayback: () => {
    const isPlaying = get().isPlaying;
    set({ isPlaying: !isPlaying });
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.resume();
    }
  },

  setProgress: (progress) => set({ progress }),

  setQueue: (tracks) => set({ queue: tracks }),

  nextTrack: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    const track = queue[nextIndex];
    set({
      currentTrack: track,
      currentIndex: nextIndex,
      isPlaying: true,
      progress: 0,
    });
    audioService.playTrack(track);
  },

  previousTrack: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    const track = queue[prevIndex];
    set({
      currentTrack: track,
      currentIndex: prevIndex,
      isPlaying: true,
      progress: 0,
    });
    audioService.playTrack(track);
  },

  setActiveCategory: (category) => set({ activeCategory: category }),

  clearPlayer: () => {
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      currentIndex: -1,
    });
    audioService.stopTrack();
  },

  // Preferences
  setPlaybackSpeed: (playbackSpeed) => {
    set({ playbackSpeed });
    audioService.applySpeed(playbackSpeed);
  },

  setAudioMode: (audioMode) => {
    set({ audioMode });
    audioService.applyAudioModeEffects(audioMode);
  },

  setMixerVolume: (channel, level) => {
    set((s) => ({
      mixerVolumes: { ...s.mixerVolumes, [channel]: level },
    }));
    audioService.setMixerVolume(channel, level);
  },

  resetMixer: () => {
    set({
      mixerVolumes: { rain: 0, birds: 0, cafe: 0, beats: 0 },
    });
    audioService.resetMixer();
  },
}));
