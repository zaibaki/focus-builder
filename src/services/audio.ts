/**
 * Audio Service — Manages multi-channel loop mixing, track playback,
 * speed adjustments, and audio modes (binaural beats entrainment and EQ simulation)
 * using the modern, New Architecture-compatible `expo-audio`.
 */
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import type { PlayerTrack } from '../stores/usePlayerStore';

const MIXER_SOUNDS: Record<string, string> = {
  rain: 'https://raw.githubusercontent.com/Alen-guo/SoundScape-AI/master/public/sounds/rain.mp3',
  birds: 'https://raw.githubusercontent.com/Alen-guo/SoundScape-AI/master/public/sounds/birds.mp3',
  cafe: 'https://raw.githubusercontent.com/Alen-guo/SoundScape-AI/master/public/sounds/coffee.mp3',
  beats: 'https://raw.githubusercontent.com/danielrosehill/HA-White-Noise-Component/master/audio/brown.mp3',
};

const MODE_SOUNDS: Record<string, string> = {
  alpha: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/night.mp3',
  theta: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3',
};

// Dynamic store registry to break cyclic circular imports
let playerStore: any = null;

export function registerPlayerStore(store: any) {
  playerStore = store;
}

class AudioService {
  private mainPlayer: AudioPlayer | null = null;
  private mainSubscription: any = null;

  private mixerPlayers: Record<string, AudioPlayer | null> = {
    rain: null,
    birds: null,
    cafe: null,
    beats: null,
  };

  private modePlayers: Record<string, AudioPlayer | null> = {
    alpha: null,
    theta: null,
  };

  private isAudioModeConfigured = false;

  /** Initialize iOS / Android audio routing policies */
  private async ensureAudioMode() {
    if (this.isAudioModeConfigured) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsRecording: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
      this.isAudioModeConfigured = true;
    } catch (e) {
      console.warn('[AudioService] Failed to set audio mode configuration:', e);
    }
  }

  /** Plays or updates a music track */
  async playTrack(track: PlayerTrack) {
    if (!playerStore) return;
    await this.ensureAudioMode();
    try {
      // 1. Clean up previous main player
      if (this.mainPlayer) {
        if (this.mainSubscription) {
          this.mainSubscription.remove();
          this.mainSubscription = null;
        }
        this.mainPlayer.remove();
        this.mainPlayer = null;
      }

      // Check if it's a Custom Mix track
      if (track.category === 'custom' && track.id >= 1000 && track.id < 5000) {
        // It's an ambient mix container. No single backing track to play.
        return;
      }

      if (!track.uri) {
        console.warn('[AudioService] Cannot play track with empty URI:', track.title);
        return;
      }

      // 2. Create new AudioPlayer
      const player = createAudioPlayer(track.uri, { updateInterval: 1000 });
      player.loop = true;
      player.volume = 0.8;

      // Subscribe to playback status updates
      this.mainSubscription = player.addListener('playbackStatusUpdate', (status) => {
        if (!playerStore) return;
        if (status.duration && status.currentTime) {
          const progress = status.currentTime / status.duration;
          playerStore.getState().setProgress(progress);
        }

        // Handle track completion
        if (status.didJustFinish) {
          playerStore.getState().nextTrack();
        }
      });

      this.mainPlayer = player;

      // Start playing
      player.play();

      // Apply current speed and mode adjustments
      const state = playerStore.getState();
      await this.applySpeed(state.playbackSpeed);
      await this.applyAudioModeEffects(state.audioMode);
    } catch (e) {
      console.warn('[AudioService] Failed to load/play track:', track.title, e);
    }
  }

  /** Pause active playbacks */
  async pause() {
    try {
      if (this.mainPlayer) {
        this.mainPlayer.pause();
      }
      // Pause mixer channels
      for (const key of Object.keys(this.mixerPlayers)) {
        const player = this.mixerPlayers[key];
        if (player) {
          player.pause();
        }
      }
      // Pause active mode sounds
      for (const key of Object.keys(this.modePlayers)) {
        const player = this.modePlayers[key];
        if (player) {
          player.pause();
        }
      }
    } catch (e) {
      console.warn('[AudioService] Error pausing audio:', e);
    }
  }

  /** Resume playbacks */
  async resume() {
    if (!playerStore) return;
    await this.ensureAudioMode();
    try {
      const state = playerStore.getState();

      if (this.mainPlayer) {
        this.mainPlayer.play();
      }

      // Resume mixer loops with non-zero volume
      for (const key of Object.keys(MIXER_SOUNDS)) {
        const vol = state.mixerVolumes[key] ?? 0;
        if (vol > 0) {
          await this.setMixerVolume(key, vol);
        }
      }

      // Resume waves/beats if a mode is active
      if (state.audioMode !== 'normal') {
        await this.applyAudioModeEffects(state.audioMode);
      }
    } catch (e) {
      console.warn('[AudioService] Error resuming audio:', e);
    }
  }

  /** Unloads the main track */
  async stopTrack() {
    try {
      if (this.mainPlayer) {
        if (this.mainSubscription) {
          this.mainSubscription.remove();
          this.mainSubscription = null;
        }
        this.mainPlayer.remove();
        this.mainPlayer = null;
      }
    } catch (e) {
      console.warn('[AudioService] Error unloading track:', e);
    }
  }

  /** Adjust mixer volume channel in real-time */
  async setMixerVolume(channel: string, level: number) {
    if (!playerStore) return;
    await this.ensureAudioMode();
    const uri = MIXER_SOUNDS[channel];
    if (!uri) return;

    try {
      let player = this.mixerPlayers[channel];
      const volume = level / 4.0;

      // If volume is 0 and player exists, pause it to save bandwidth/battery
      if (level === 0) {
        if (player) {
          player.pause();
          player.volume = 0;
        }
        return;
      }

      // If player doesn't exist, create it
      if (!player) {
        player = createAudioPlayer(uri);
        player.loop = true;
        player.volume = volume;
        this.mixerPlayers[channel] = player;
      } else {
        player.volume = volume;
      }

      // If player store is playing, start playback
      if (playerStore.getState().isPlaying) {
        player.play();
      }

      // Apply mode effects if Deep Focus EQ is active
      const currentMode = playerStore.getState().audioMode;
      if (currentMode === 'deep-eq') {
        await this.applyAudioModeEffects('deep-eq');
      }
    } catch (e) {
      console.warn(`[AudioService] Failed to update mixer channel ${channel}:`, e);
    }
  }

  /** Speed multiplier (pitch-corrected rate setting) */
  async applySpeed(speed: number) {
    try {
      if (this.mainPlayer) {
        this.mainPlayer.setPlaybackRate(speed);
      }
      for (const player of Object.values(this.mixerPlayers)) {
        if (player) {
          player.setPlaybackRate(speed);
        }
      }
    } catch (e) {
      console.warn('[AudioService] Failed to set playback rate:', e);
    }
  }

  /** Reset all mixer volumes */
  async resetMixer() {
    try {
      for (const key of Object.keys(this.mixerPlayers)) {
        const player = this.mixerPlayers[key];
        if (player) {
          player.pause();
          player.volume = 0;
        }
      }
    } catch (e) {
      console.warn('[AudioService] Failed to reset mixer sounds:', e);
    }
  }

  /** Apply audio mode (Alpha, Theta, EQ attenuation) */
  async applyAudioModeEffects(mode: 'normal' | 'alpha' | 'theta' | 'deep-eq') {
    if (!playerStore) return;
    await this.ensureAudioMode();
    try {
      // 1. Manage Binaural Wave Channels (Alpha and Theta)
      for (const key of ['alpha', 'theta']) {
        let player = this.modePlayers[key];
        if (key === mode) {
          const uri = MODE_SOUNDS[key];
          if (!player) {
            player = createAudioPlayer(uri);
            player.loop = true;
            player.volume = 0.35; // Balanced volume for low-frequency backing hum
            this.modePlayers[key] = player;
          } else {
            player.volume = 0.35;
          }
          if (playerStore.getState().isPlaying) {
            player.play();
          }
        } else {
          if (player) {
            player.pause();
            player.volume = 0;
          }
        }
      }

      // 2. Manage Deep Focus EQ Simulation
      const state = playerStore.getState();
      const mainVolume = mode === 'deep-eq' ? 0.55 : 0.8;
      if (this.mainPlayer) {
        this.mainPlayer.volume = mainVolume;
      }

      // Adjust mixer channels
      for (const channel of Object.keys(this.mixerPlayers)) {
        const player = this.mixerPlayers[channel];
        if (!player) continue;

        const baseVol = (state.mixerVolumes[channel] ?? 0) / 4.0;
        let finalVol = baseVol;

        if (mode === 'deep-eq') {
          if (channel === 'birds') finalVol = baseVol * 0.25; // 75% cut
          else if (channel === 'cafe') finalVol = baseVol * 0.3; // 70% cut
          else if (channel === 'rain') finalVol = baseVol * 0.5; // 50% cut
        }

        player.volume = finalVol;
      }
    } catch (e) {
      console.warn('[AudioService] Failed to apply audio mode effects:', mode, e);
    }
  }
}

export const audioService = new AudioService();
