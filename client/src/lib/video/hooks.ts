// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
    __recordingStartScene?: number;
    __episodeInfo?: {
      currentScene: number;
      totalScenes: number;
      durationsArray: number[];
      totalDuration: number;
      hasEnded: boolean;
      isPaused: boolean;
    };
    __episodeControls?: {
      togglePause: () => void;
      play: () => void;
      pause: () => void;
      goToScene: (index: number) => void;
      next: () => void;
      prev: () => void;
    };
  }
}

// Local recording fallback using MediaRecorder API
function setupLocalRecording() {
  if (window.startRecording) return;

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  window.startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
        audio: false,
      });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bitcoin-Error-Explainer-${new Date().toISOString().slice(0, 10)}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      console.log('Recording started — select this tab when prompted');
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  window.stopRecording = () => {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      console.log('Recording stopped — downloading video...');
    }
  };
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
  isPaused: boolean;
  togglePause: () => void;
  next: () => void;
  prev: () => void;
  goToScene: (index: number) => void;
  // Timeline controls
  durationsArray: number[];
  totalDuration: number;
  getCurrentTime: () => number;
  seekTo: (ms: number) => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const isRecordMode = hashParams.has('record');
  const isArmedRecord = isRecordMode && hashParams.has('arm');
  const shouldAutoStartLocalCapture = isRecordMode && hashParams.has('local');

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;
  const totalDuration = durationsArray.reduce((a, b) => a + b, 0);
  const initialScene = isRecordMode
    ? Math.max(0, Math.min(window.__recordingStartScene ?? 0, totalScenes - 1))
    : 0;
  const shouldLoop = isRecordMode ? false : loop;

  const [currentScene, setCurrentScene] = useState(initialScene);
  const [hasEnded, setHasEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(isArmedRecord);
  const [speed, setSpeed] = useState(1);
  const [seekCount, setSeekCount] = useState(0);

  const remainingRef = useRef(0);        // Video-time ms remaining in current scene
  const sceneStartRef = useRef(0);       // Real-time timestamp when current timer started
  const scheduledRef = useRef(0);        // Video-time duration scheduled for current timer
  const seekTargetRef = useRef<number | null>(null); // Pending seek remaining (video-time)

  const togglePause = () => setIsPaused(p => !p);
  const play = () => setIsPaused(false);
  const pause = () => setIsPaused(true);

  // Helper: sum durations of scenes before index
  const sumBefore = (scene: number) => {
    let sum = 0;
    for (let i = 0; i < scene; i++) sum += durationsArray[i];
    return sum;
  };

  // Always expose episode state + controls for external tools (record.mjs, visual-qa)
  useEffect(() => {
    window.__episodeInfo = {
      currentScene,
      totalScenes,
      durationsArray,
      totalDuration,
      hasEnded,
      isPaused,
    };
  });

  // Expose a manual browser-capture fallback. Only auto-start when explicitly
  // requested with ?record&local=1 so automated exports do not trigger a prompt.
  useEffect(() => {
    setupLocalRecording();
    if (shouldAutoStartLocalCapture) {
      window.startRecording?.();
    }
  }, [shouldAutoStartLocalCapture]);

  // Scene advancement (pause-aware, speed-aware)
  useEffect(() => {
    if (hasEnded && !shouldLoop) return;
    if (isPaused) return;

    // Determine video-time duration for this scene segment
    let dur: number;
    if (seekTargetRef.current !== null) {
      dur = seekTargetRef.current;
      seekTargetRef.current = null;
    } else if (remainingRef.current > 0) {
      dur = remainingRef.current;
    } else {
      dur = durationsArray[currentScene];
    }

    scheduledRef.current = dur;
    sceneStartRef.current = Date.now();
    remainingRef.current = 0;

    const timer = setTimeout(() => {
      if (currentScene < totalScenes - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        onVideoEnd?.();

        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
        }

        if (shouldLoop) {
          setCurrentScene(0);
        }
      }
    }, dur / speed);

    return () => {
      clearTimeout(timer);
      // Save remaining video-time for pause/resume
      const realElapsed = Date.now() - sceneStartRef.current;
      const videoElapsed = realElapsed * speed;
      remainingRef.current = Math.max(0, scheduledRef.current - videoElapsed);
    };
  }, [currentScene, totalScenes, durationsArray, hasEnded, shouldLoop, onVideoEnd, isPaused, speed, seekCount]);

  // getCurrentTime — returns absolute video-time position in ms
  // Uses a ref so the returned function reference is stable
  const getCurrentTimeRef = useRef<() => number>(() => 0);
  getCurrentTimeRef.current = () => {
    const before = sumBefore(currentScene);

    if (isPaused) {
      // Pending seek while paused
      if (seekTargetRef.current !== null) {
        return before + durationsArray[currentScene] - seekTargetRef.current;
      }
      // Paused mid-scene (remaining was saved by cleanup)
      if (remainingRef.current > 0) {
        return before + durationsArray[currentScene] - remainingRef.current;
      }
      // At start of scene (e.g. after goToScene while paused)
      return before;
    }

    // Playing: compute from timer start
    const sceneOffset = durationsArray[currentScene] - scheduledRef.current;
    const realElapsed = Date.now() - sceneStartRef.current;
    const videoElapsed = realElapsed * speed;
    return Math.min(before + sceneOffset + videoElapsed, before + durationsArray[currentScene]);
  };
  const getCurrentTime = useCallback(() => getCurrentTimeRef.current(), []);

  // seekTo — jump to an absolute video-time position in ms
  const seekTo = useCallback((ms: number) => {
    const clamped = Math.max(0, Math.min(ms, totalDuration - 1));
    let acc = 0;
    for (let i = 0; i < totalScenes; i++) {
      if (acc + durationsArray[i] > clamped) {
        seekTargetRef.current = acc + durationsArray[i] - clamped;
        setCurrentScene(i);
        setSeekCount(c => c + 1);
        return;
      }
      acc += durationsArray[i];
    }
    // At the very end
    seekTargetRef.current = 1;
    setCurrentScene(totalScenes - 1);
    setSeekCount(c => c + 1);
  }, [totalDuration, totalScenes, durationsArray]);

  const next = () => {
    if (currentScene < totalScenes - 1) {
      remainingRef.current = 0;
      seekTargetRef.current = null;
      setCurrentScene(prev => prev + 1);
    }
  };

  const prev = () => {
    if (currentScene > 0) {
      remainingRef.current = 0;
      seekTargetRef.current = null;
      setCurrentScene(prev => prev - 1);
    }
  };

  const goToScene = (index: number) => {
    if (index >= 0 && index < totalScenes) {
      remainingRef.current = 0;
      seekTargetRef.current = null;
      setHasEnded(false);
      setCurrentScene(index);
      setSeekCount(c => c + 1);
    }
  };

  // Expose controls for external tools (record.mjs uses these in ?record mode
  // where DevControls is not mounted and keyboard shortcuts are unavailable)
  useEffect(() => {
    window.__episodeControls = { togglePause, play, pause, goToScene, next, prev };
  });

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
    isPaused,
    togglePause,
    next,
    prev,
    goToScene,
    durationsArray,
    totalDuration,
    getCurrentTime,
    seekTo,
    speed,
    setSpeed,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
