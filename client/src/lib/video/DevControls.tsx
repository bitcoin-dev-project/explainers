import { useState, useEffect, useRef } from 'react';
import type { UseVideoPlayerReturn } from './hooks';

function formatTime(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [1, 1.5, 2, 4];

export function DevControls({ player }: { player: UseVideoPlayerReturn }) {
  const {
    currentScene, totalScenes, prev, next, isPaused, togglePause,
    durationsArray, totalDuration, getCurrentTime, seekTo,
    speed, setSpeed,
  } = player;

  const [displayTime, setDisplayTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef(player);
  playerRef.current = player;

  // Hide when recording
  if (
    new URLSearchParams(window.location.search).has('record') ||
    window.location.hash.includes('record')
  ) return null;

  // Poll getCurrentTime for smooth progress display
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setDisplayTime(getCurrentTime());
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging, getCurrentTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const p = playerRef.current;
      if (e.code === 'Space') { e.preventDefault(); p.togglePause(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); p.prev(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); p.next(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scene boundaries as percentages of total duration
  const sceneBoundaries: { start: number; end: number }[] = [];
  let acc = 0;
  for (let i = 0; i < durationsArray.length; i++) {
    sceneBoundaries.push({
      start: acc / totalDuration,
      end: (acc + durationsArray[i]) / totalDuration,
    });
    acc += durationsArray[i];
  }

  const progress = isDragging ? dragTime / totalDuration : displayTime / totalDuration;
  const shownTime = isDragging ? dragTime : displayTime;
  const progressPct = Math.min(Math.max(progress * 100, 0), 100);

  const getTimeFromMouse = (e: React.MouseEvent | MouseEvent) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * totalDuration;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const time = getTimeFromMouse(e);
    setIsDragging(true);
    setDragTime(time);

    const onMove = (ev: MouseEvent) => setDragTime(getTimeFromMouse(ev));

    const onUp = (ev: MouseEvent) => {
      const t = getTimeFromMouse(ev);
      seekTo(t);
      setDisplayTime(t);
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (idx + 1) % SPEED_OPTIONS.length;
    setSpeed(SPEED_OPTIONS[nextIdx]);
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-black/80 px-4 py-2.5 font-mono text-xs text-white backdrop-blur-md select-none"
      style={{ width: 'min(92vw, 720px)' }}
    >
      {/* Play / Pause */}
      <button
        onClick={togglePause}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-white/20 transition-colors"
        title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>

      {/* Prev scene */}
      <button
        onClick={prev}
        disabled={currentScene === 0}
        className="shrink-0 px-1 py-1 rounded-md hover:bg-white/20 disabled:opacity-30 transition-colors"
        title="Prev scene (←)"
      >
        ◀
      </button>

      {/* Next scene */}
      <button
        onClick={next}
        disabled={currentScene === totalScenes - 1}
        className="shrink-0 px-1 py-1 rounded-md hover:bg-white/20 disabled:opacity-30 transition-colors"
        title="Next scene (→)"
      >
        ▶
      </button>

      {/* Scrubable progress bar */}
      <div className="relative flex-1 cursor-pointer group py-2" onMouseDown={handleMouseDown}>
        <div ref={barRef} className="relative h-1.5 bg-white/15 rounded-full group-hover:h-2.5 transition-all duration-150">
          {/* Scene boundary ticks */}
          {sceneBoundaries.slice(1).map((b, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-px bg-white/25"
              style={{ left: `${b.start * 100}%` }}
            />
          ))}

          {/* Filled portion */}
          <div
            className="absolute top-0 left-0 h-full rounded-full pointer-events-none"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #EB5234, #EB9B34)',
            }}
          />

          {/* Thumb (visible on hover / drag) */}
          <div
            className={`absolute top-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-lg pointer-events-none transition-opacity duration-100 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{
              left: `${progressPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>

      {/* Scene counter */}
      <span className="shrink-0 text-white/50 tabular-nums">
        {currentScene + 1}/{totalScenes}
      </span>

      {/* Time readout */}
      <span className="shrink-0 text-white/70 tabular-nums">
        {formatTime(shownTime)}/{formatTime(totalDuration)}
      </span>

      {/* Playback speed */}
      <button
        onClick={cycleSpeed}
        className="shrink-0 px-1.5 py-0.5 rounded-md hover:bg-white/20 transition-colors text-[10px] min-w-[28px] text-center"
        title="Playback speed (click to cycle)"
        style={{ color: speed !== 1 ? '#EB9B34' : undefined }}
      >
        {speed}x
      </button>
    </div>
  );
}
