/**
 * Audio sync utilities — replace manual audio playback boilerplate
 * and voiceover-to-animation delay calculations.
 *
 * Two parts:
 * 1. useAudioSync() hook — manages audio playback synced to scene changes
 * 2. syncTo() helper — converts "narrator says X at T seconds" to animation delay
 *
 * Usage (per-scene audio files):
 *   const audio = useAudioSync(s, {
 *     scenePaths: ['/audio/ep8/scene1.mp3', '/audio/ep8/scene2.mp3', ...],
 *   });
 *   <motion.div transition={{ delay: audio.syncTo(3.5) }}> // narrator says it at 3.5s
 *
 * Usage (continuous audio file):
 *   const audio = useAudioSync(s, {
 *     src: '/audio/ep1/full.mp3',
 *     sceneStartTimes: [0, 7.66, 22.37, ...],
 *   });
 *
 * Usage (no hook, just delay math):
 *   import { syncTo } from '@/lib/video';
 *   <motion.div transition={{ delay: syncTo(3.5) }}> // 3.5 + 0.4 = 3.9s
 */

import { useEffect, useRef } from 'react';

const DEFAULT_OFFSET = 0.4; // 400ms delay before audio starts after scene transition

/* ── Pure helpers (no hooks) ─────────────────────────────────── */

/**
 * Convert audio timestamp to animation delay.
 *
 * When using per-scene audio, audio starts `offset` seconds after the scene enters.
 * If the narrator says "here's the root" at 3.5s into the audio, the animation
 * should fire at 3.5 + 0.4 = 3.9s into the scene.
 *
 * @param audioSec - Seconds into the current scene's audio
 * @param offset - Delay before audio starts (default 0.4s)
 *
 * @example
 *   // Narrator says "here's the Merkle root" at 3.5s in the audio
 *   <motion.div transition={{ delay: syncTo(3.5) }}>
 *     <MerkleRoot />
 *   </motion.div>
 *   // → delay = 3.9s
 */
export function syncTo(audioSec: number, offset = DEFAULT_OFFSET): number {
  return audioSec + offset;
}

/**
 * Add buffer to raw audio durations to create SCENE_DURATIONS.
 * Takes output from the voiceover generation script (audioLengths in ms)
 * and adds breathing room for transitions and absorption time.
 *
 * @param audioMs - Scene keys to audio length in ms (e.g. from timestamps.json)
 * @param buffer - Additional ms per scene (default 2500)
 *
 * @example
 *   // In constants.ts — instead of manually adding buffer to each line:
 *   import { durationsFromAudio } from '@/lib/video';
 *
 *   // From timestamps.json audioLengths:
 *   export const SCENE_DURATIONS = durationsFromAudio({
 *     scene1: 7660,   // Title
 *     scene2: 14710,  // Opening concept
 *     scene3: 12560,  // Deep dive
 *   });
 *   // → { scene1: 10160, scene2: 17210, scene3: 15060 }
 */
export function durationsFromAudio(
  audioMs: Record<string, number>,
  buffer = 2500,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(audioMs).map(([k, v]) => [k, v + buffer]),
  );
}

/* ── Hook ────────────────────────────────────────────────────── */

interface UseAudioSyncOptions {
  /** Per-scene audio file paths (one per scene index) */
  scenePaths?: string[];
  /** Single continuous audio file path */
  src?: string;
  /** Scene start times in seconds — required for continuous mode (from timestamps.json) */
  sceneStartTimes?: number[];
  /** Delay before audio plays after scene transition in seconds (default 0.4) */
  offset?: number;
  /** Whether the player is paused — pass player.isPaused */
  isPaused?: boolean;
  /** Disable audio entirely (default false) */
  disabled?: boolean;
}

interface AudioSyncReturn {
  /** Convert audio timestamp (seconds into current scene's audio) to animation delay */
  syncTo: (audioSec: number) => number;
  /** Ref to the current HTMLAudioElement (for external control if needed) */
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

/**
 * Manages audio playback synced to scene changes.
 * Replaces the 20+ lines of audioRef + useEffect boilerplate in each episode.
 *
 * Supports two modes:
 * - **Per-scene files:** Each scene has its own .mp3, played with a delay after scene enters
 * - **Continuous:** One .mp3 file, seeked to the right position on scene change
 *
 * @example
 *   // Per-scene audio (most common):
 *   const SCENE_AUDIO = [
 *     '/audio/ep8/scene1.mp3',
 *     '/audio/ep8/scene2.mp3',
 *   ];
 *   const audio = useAudioSync(s, {
 *     scenePaths: SCENE_AUDIO,
 *     isPaused: player.isPaused,
 *   });
 *   // Sync animation to narrator:
 *   <motion.div transition={{ delay: audio.syncTo(3.5) }}>
 *
 *   // Continuous audio (single file):
 *   const audio = useAudioSync(s, {
 *     src: '/audio/ep1/full.mp3',
 *     sceneStartTimes: [0, 7.66, 22.37],
 *     isPaused: player.isPaused,
 *   });
 */
export function useAudioSync(
  scene: number,
  options: UseAudioSyncOptions,
): AudioSyncReturn {
  const {
    scenePaths,
    src,
    sceneStartTimes,
    offset = DEFAULT_OFFSET,
    isPaused = false,
    disabled = false,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSceneRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-scene audio mode
  useEffect(() => {
    if (disabled || !scenePaths) return;

    // Stop previous scene's audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isPaused) return;

    const path = scenePaths[scene];
    if (!path) return;

    timerRef.current = setTimeout(() => {
      const audio = new Audio(path);
      audio.play().catch(() => {});
      audioRef.current = audio;
    }, offset * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [scene, isPaused, disabled, scenePaths, offset]);

  // Continuous audio mode
  useEffect(() => {
    if (disabled || !src || scenePaths) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }
    const audio = audioRef.current;

    if (isPaused) {
      audio.pause();
      return;
    }

    const prev = prevSceneRef.current;
    // Seek on non-sequential navigation (skip, jump, first play)
    if (prev === -1 || scene !== prev + 1) {
      audio.currentTime = sceneStartTimes?.[scene] ?? 0;
    }
    audio.play().catch(() => {});
    prevSceneRef.current = scene;
  }, [scene, isPaused, disabled, src, sceneStartTimes, scenePaths]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const mode = scenePaths ? 'per-scene' : 'continuous';

  return {
    syncTo: (audioSec: number) =>
      mode === 'per-scene' ? audioSec + offset : audioSec,
    audioRef,
  };
}
