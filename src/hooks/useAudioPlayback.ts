import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

/**
 * Hook to manage audio playback progress.
 * If the current track is a Custom Mix (which has no single backing MP3),
 * it runs a simulated timer to advance progress. For actual audio files,
 * it lets expo-av update progress natively.
 */
export function useAudioPlayback() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only run simulated progress for Custom Mixes (ID 1000 to 4999)
    const isCustomMix = currentTrack && currentTrack.id >= 1000 && currentTrack.id < 5000;

    if (isPlaying && currentTrack && isCustomMix) {
      const duration = currentTrack.duration || 1800; // default 30 mins
      const step = 1 / duration;

      intervalRef.current = setInterval(() => {
        const currentProgress = usePlayerStore.getState().progress;
        const nextProgress = currentProgress + step;

        if (nextProgress >= 1) {
          setProgress(0);
          nextTrack();
        } else {
          setProgress(nextProgress);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentTrack, setProgress, nextTrack]);
}
