/**
 * Audio Service — Manages multi-channel loop mixing, track playback,
 * speed adjustments, and audio modes (binaural beats entrainment and EQ simulation)
 * using `expo-av`.
 */
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
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
  private mainSound: Audio.Sound | null = null;
  private mixerSounds: Record<string, Audio.Sound | null> = {
    rain: null,
    birds: null,
    cafe: null,
    beats: null,
  };
  private modeSounds: Record<string, Audio.Sound | null> = {
    alpha: null,
    theta: null,
  };

  private isAudioModeConfigured = false;

  /** Initialize iOS / Android audio routing policies */
  private async ensureAudioMode() {
    if (this.isAudioModeConfigured) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
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
      // 1. Stop and unload previous track
      if (this.mainSound) {
        await this.mainSound.unloadAsync();
        this.mainSound = null;
      }

      // Check if it's a Custom Mix track
      if (track.category === 'custom' && track.id >= 1000 && track.id < 5000) {
        // It's an ambient mix container. We shouldn't stream a backing track.
        return;
      }

      if (!track.uri) {
        console.warn('[AudioService] Cannot play track with empty URI:', track.title);
        return;
      }

      const source = { uri: track.uri };

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.8,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.mainSound = sound;

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
      if (this.mainSound) {
        await this.mainSound.pauseAsync();
      }
      // Pause mixer channels that are playing
      for (const key of Object.keys(this.mixerSounds)) {
        const sound = this.mixerSounds[key];
        if (sound) {
          await sound.pauseAsync();
        }
      }
      // Pause active mode sounds
      for (const key of Object.keys(this.modeSounds)) {
        const sound = this.modeSounds[key];
        if (sound) {
          await sound.pauseAsync();
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

      if (this.mainSound) {
        await this.mainSound.playAsync();
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
      if (this.mainSound) {
        await this.mainSound.unloadAsync();
        this.mainSound = null;
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
      let sound = this.mixerSounds[channel];

      // Volume scaling: level is 0 to 4
      const volume = level / 4.0;

      // If volume is 0 and sound exists, pause it to save bandwidth/battery
      if (level === 0) {
        if (sound) {
          await sound.setStatusAsync({ shouldPlay: false, volume: 0 });
        }
        return;
      }

      // If sound doesn't exist, load it
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          {
            shouldPlay: true,
            isLooping: true,
            volume,
          }
        );
        this.mixerSounds[channel] = newSound;
        sound = newSound;
      } else {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setStatusAsync({
            shouldPlay: playerStore.getState().isPlaying,
            volume,
          });
        }
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
      if (this.mainSound) {
        await this.mainSound.setRateAsync(speed, true);
      }
      // Speed can also modulate the ambient mixer loops for cohesive feel
      for (const sound of Object.values(this.mixerSounds)) {
        if (sound) {
          await sound.setRateAsync(speed, true);
        }
      }
    } catch (e) {
      console.warn('[AudioService] Failed to set playback rate:', e);
    }
  }

  /** Reset all mixer volumes */
  async resetMixer() {
    try {
      for (const key of Object.keys(this.mixerSounds)) {
        const sound = this.mixerSounds[key];
        if (sound) {
          await sound.setStatusAsync({ shouldPlay: false, volume: 0 });
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
        const sound = this.modeSounds[key];
        if (key === mode) {
          const uri = MODE_SOUNDS[key];
          if (!sound) {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri },
              {
                shouldPlay: playerStore.getState().isPlaying,
                isLooping: true,
                volume: 0.35, // Balanced volume for low-frequency backing hum
              }
            );
            this.modeSounds[key] = newSound;
          } else {
            await sound.setStatusAsync({
              shouldPlay: playerStore.getState().isPlaying,
              volume: 0.35,
            });
          }
        } else {
          if (sound) {
            await sound.setStatusAsync({ shouldPlay: false, volume: 0 });
          }
        }
      }

      // 2. Manage Deep Focus EQ Simulation
      const state = playerStore.getState();
      const mainVolume = mode === 'deep-eq' ? 0.55 : 0.8;
      if (this.mainSound) {
        await this.mainSound.setVolumeAsync(mainVolume);
      }

      // Adjust mixer channels: birds and cafe chatter have prominent mid-highs
      for (const channel of Object.keys(this.mixerSounds)) {
        const sound = this.mixerSounds[channel];
        if (!sound) continue;

        const baseVol = (state.mixerVolumes[channel] ?? 0) / 4.0;
        let finalVol = baseVol;

        if (mode === 'deep-eq') {
          if (channel === 'birds') finalVol = baseVol * 0.25; // 75% cut
          else if (channel === 'cafe') finalVol = baseVol * 0.3; // 70% cut
          else if (channel === 'rain') finalVol = baseVol * 0.5; // 50% cut
        }

        await sound.setVolumeAsync(finalVol);
      }
    } catch (e) {
      console.warn('[AudioService] Failed to apply audio mode effects:', mode, e);
    }
  }

  /** Callback to feed player store progress */
  private onPlaybackStatusUpdate(status: any) {
    if (!playerStore) return;
    if (!status.isLoaded) {
      if (status.error) {
        console.warn(`[AudioService] Playback error: ${status.error}`);
      }
      return;
    }

    // Push progress (0 to 1) into Zustand
    if (status.durationMillis && status.positionMillis) {
      const progress = status.positionMillis / status.durationMillis;
      playerStore.getState().setProgress(progress);

      // Handle track completion
      if (status.didJustFinish) {
        playerStore.getState().nextTrack();
      }
    }
  }
}

export const audioService = new AudioService();
