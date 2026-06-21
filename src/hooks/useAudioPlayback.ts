import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

/**
 * Hook to simulate audio playback progress in the UI.
 * Advances track progress every second and triggers next track when completed.
 */
export function useAudioPlayback() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      const duration = currentTrack.duration || 300; // default 5 mins
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
