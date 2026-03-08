import type { UseVideoPlayerReturn } from './hooks';

export function DevControls({ player }: { player: UseVideoPlayerReturn }) {
  const { currentScene, totalScenes, prev, next, goToScene, isPaused, togglePause } = player;

  // Hide when recording (?record in URL or #ep4?record)
  if (
    new URLSearchParams(window.location.search).has('record') ||
    window.location.hash.includes('record')
  ) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/70 px-3 py-2 font-mono text-xs text-white backdrop-blur-sm">
      <button onClick={prev} disabled={currentScene === 0} className="px-2 py-1 rounded hover:bg-white/20 disabled:opacity-30">
        Prev
      </button>
      <button
        onClick={togglePause}
        className={`px-2 py-1 rounded hover:bg-white/20 ${isPaused ? 'bg-white/25 text-yellow-300' : ''}`}
      >
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>
      <div className="flex gap-1">
        {Array.from({ length: totalScenes }, (_, i) => (
          <button
            key={i}
            onClick={() => goToScene(i)}
            className={`h-6 w-6 rounded text-[10px] transition-colors ${
              i === currentScene ? 'bg-white text-black font-bold' : 'hover:bg-white/20'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button onClick={next} disabled={currentScene === totalScenes - 1} className="px-2 py-1 rounded hover:bg-white/20 disabled:opacity-30">
        Next
      </button>
    </div>
  );
}
