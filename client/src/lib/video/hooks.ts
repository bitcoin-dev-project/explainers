// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
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
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef(0);
  const sceneStartRef = useRef(0);

  const togglePause = () => setIsPaused(p => !p);

  // Setup local recording fallback and start on mount
  useEffect(() => {
    setupLocalRecording();
    window.startRecording?.();
  }, []);

  // Scene advancement (pause-aware)
  useEffect(() => {
    if (hasEnded && !loop) return;
    if (isPaused) return;

    const duration = remainingRef.current > 0
      ? remainingRef.current
      : durationsArray[currentScene];

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

        if (loop) {
          setCurrentScene(0);
        }
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      // Save remaining time when pausing
      if (isPaused) return;
      const elapsed = Date.now() - sceneStartRef.current;
      const scheduled = remainingRef.current > 0 ? remainingRef.current : durationsArray[currentScene];
      remainingRef.current = Math.max(0, scheduled - elapsed);
    };
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd, isPaused]);

  const next = () => {
    if (currentScene < totalScenes - 1) {
      remainingRef.current = 0;
      setCurrentScene(prev => prev + 1);
    }
  };

  const prev = () => {
    if (currentScene > 0) {
      remainingRef.current = 0;
      setCurrentScene(prev => prev - 1);
    }
  };

  const goToScene = (index: number) => {
    if (index >= 0 && index < totalScenes) {
      remainingRef.current = 0;
      setCurrentScene(index);
    }
  };

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
