import { useRef, useEffect, useCallback } from 'react';
import { EP_COLORS } from './constants';

export type RaceMode = 'hook' | 'dormant' | 'explained' | 'fullRace';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface RaceState {
  quantumProgress: number;   // 0-1
  blockProgress: number;     // 0-1
  quantumDone: boolean;
  blockDone: boolean;
  raceCount: number;
  quantumWins: number;
  phase: 'racing' | 'finished' | 'flash' | 'idle';
  flashAlpha: number;
  particles: Particle[];
  counterDisplay: number;
  raceSpeed: number;
  startTime: number;
}

interface RaceCanvasProps {
  mode: RaceMode;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Canvas 2D dual-clock race simulation.
 * Two concentric arcs: quantum key derivation (~9 min, deterministic)
 * vs block confirmation (~10 min, stochastic exponential distribution).
 * Runs Monte Carlo simulation, converges toward ~41% quantum wins.
 */
export default function RaceCanvas({
  mode,
  width = 1920,
  height = 1080,
  className,
  style,
}: RaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>({
    quantumProgress: 0,
    blockProgress: 0,
    quantumDone: false,
    blockDone: false,
    raceCount: 0,
    quantumWins: 0,
    phase: 'idle',
    flashAlpha: 0,
    particles: [],
    counterDisplay: 0,
    raceSpeed: 1,
    startTime: 0,
  });
  const animFrameRef = useRef<number>(0);
  const modeRef = useRef(mode);
  const prevModeRef = useRef(mode);

  // Sample from exponential distribution — block time model
  const sampleBlockTime = useCallback(() => {
    const u = Math.random();
    // Average 600s (10 min), returns normalized 0-1 progress rate
    // Higher = faster block, quantum less likely to win
    return -Math.log(u) * 600;
  }, []);

  const initParticles = useCallback((count: number, color: string): Particle[] => {
    const cx = width / 2;
    const cy = height / 2;
    return Array.from({ length: count }, () => ({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: 0.3 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      color,
    }));
  }, [width, height]);

  const resetRace = useCallback((state: RaceState) => {
    state.quantumProgress = 0;
    state.blockProgress = 0;
    state.quantumDone = false;
    state.blockDone = false;
    state.phase = 'racing';
    state.flashAlpha = 0;
    state.startTime = performance.now();

    // Block time is stochastic — sample once per race
    // Quantum time is fixed at 540s (9 min)
    // We normalize: quantum fills in 540 "ticks", block fills in sampled time
    const blockTime = sampleBlockTime();
    // Store block fill rate relative to quantum
    // quantum rate = 1/540, block rate = 1/blockTime
    (state as any)._blockTime = blockTime;
    (state as any)._quantumTime = 540;
  }, [sampleBlockTime]);

  useEffect(() => {
    modeRef.current = mode;

    // On mode change, setup initial state
    const state = stateRef.current;
    if (mode === 'hook' || mode === 'fullRace') {
      state.particles = [
        ...initParticles(80, EP_COLORS.text),
        ...initParticles(60, EP_COLORS.accent),
      ];
      resetRace(state);
      if (mode === 'fullRace') {
        state.raceSpeed = 3;
        state.raceCount = 0;
        state.quantumWins = 0;
      } else {
        state.raceSpeed = 1;
      }
    } else if (mode === 'explained') {
      state.particles = [
        ...initParticles(40, EP_COLORS.text),
        ...initParticles(30, EP_COLORS.accent),
      ];
      resetRace(state);
      state.raceSpeed = 0.6;
    } else if (mode === 'dormant') {
      state.phase = 'idle';
      state.particles = initParticles(20, EP_COLORS.textDim);
    }

    prevModeRef.current = mode;
  }, [mode, initParticles, resetRace]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(width, height) * 0.38;
    const innerRadius = outerRadius * 0.72;
    const startAngle = -Math.PI / 2; // 12 o'clock

    const drawArc = (
      radius: number,
      progress: number,
      color: string,
      lineWidth: number,
      glow: boolean,
    ) => {
      const endAngle = startAngle + Math.PI * 2 * Math.min(progress, 1);
      if (glow) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawTrack = (radius: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = EP_COLORS.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const updateParticles = (state: RaceState, dt: number) => {
      for (const p of state.particles) {
        // Brownian drift
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy += (Math.random() - 0.5) * 0.3;
        // Damping
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // If racing, particles trail behind their respective arcs
        if (state.phase === 'racing') {
          const isQuantum = p.color === EP_COLORS.accent;
          const progress = isQuantum ? state.quantumProgress : state.blockProgress;
          const radius = isQuantum ? innerRadius : outerRadius;
          const angle = startAngle + Math.PI * 2 * progress;
          const targetX = cx + Math.cos(angle) * radius;
          const targetY = cy + Math.sin(angle) * radius;
          // Gentle attraction to arc head
          p.x += (targetX - p.x) * 0.02;
          p.y += (targetY - p.y) * 0.02;
        } else if (modeRef.current === 'dormant') {
          // Slow drift toward center
          p.x += (cx - p.x) * 0.001;
          p.y += (cy - p.y) * 0.001;
        }

        // Boundary wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    };

    const drawParticles = (state: RaceState) => {
      for (const p of state.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (modeRef.current === 'dormant' ? 0.15 : 0.6);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;

      const state = stateRef.current;
      const currentMode = modeRef.current;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Update particles
      updateParticles(state, dt);

      if (currentMode === 'dormant') {
        // Just draw dim particles, no arcs
        drawParticles(state);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Update race progress
      if (state.phase === 'racing') {
        const quantumTime = (state as any)._quantumTime || 540;
        const blockTime = (state as any)._blockTime || 600;
        const rateMultiplier = state.raceSpeed * dt * (currentMode === 'hook' ? 0.18 : currentMode === 'fullRace' ? 0.8 : 0.12);

        state.quantumProgress += rateMultiplier / (quantumTime / 600);
        state.blockProgress += rateMultiplier / (blockTime / 600);

        // Add jitter to block progress
        state.blockProgress += (Math.random() - 0.5) * 0.003 * state.raceSpeed;
        state.blockProgress = Math.max(0, state.blockProgress);

        // Check completion
        if (state.quantumProgress >= 1 && !state.quantumDone) {
          state.quantumDone = true;
          state.quantumProgress = 1;
          if (!state.blockDone) {
            state.quantumWins++;
            state.phase = 'flash';
            state.flashAlpha = 0.3;
          }
        }
        if (state.blockProgress >= 1 && !state.blockDone) {
          state.blockDone = true;
          state.blockProgress = 1;
          if (!state.quantumDone) {
            state.phase = 'finished';
          }
        }
        if (state.quantumDone || state.blockDone) {
          state.raceCount++;
          if (currentMode === 'fullRace' && state.raceCount < 100) {
            // Quick delay then next race
            setTimeout(() => {
              if (modeRef.current === 'fullRace') {
                resetRace(state);
                // Accelerate after first few races
                if (state.raceCount > 5) state.raceSpeed = 6;
                if (state.raceCount > 15) state.raceSpeed = 15;
              }
            }, state.raceCount < 5 ? 400 : 100);
            state.phase = 'finished';
          } else if (currentMode === 'hook') {
            state.phase = 'finished';
          }
        }
      }

      // Flash effect
      if (state.flashAlpha > 0) {
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius * 1.5);
        gradient.addColorStop(0, `rgba(255, 45, 45, ${state.flashAlpha})`);
        gradient.addColorStop(1, 'rgba(255, 45, 45, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        state.flashAlpha *= 0.92;
        if (state.flashAlpha < 0.01) state.flashAlpha = 0;
      }

      // Draw arc tracks
      drawTrack(outerRadius);
      drawTrack(innerRadius);

      // Draw progress arcs
      drawArc(outerRadius, state.blockProgress, EP_COLORS.text, 6, false);
      drawArc(innerRadius, state.quantumProgress, EP_COLORS.accent, 4, true);

      // Draw particles
      drawParticles(state);

      // Draw labels on the arcs
      ctx.font = '14px "JetBrains Mono", monospace';

      // Quantum label at center
      ctx.fillStyle = EP_COLORS.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (currentMode === 'explained') {
        ctx.fillText('~9 min: key derivation', cx, cy - 16);
        ctx.fillStyle = EP_COLORS.textMuted;
        ctx.fillText('~10 min avg: block confirmation', cx, cy + 16);
      } else if (currentMode !== 'fullRace') {
        ctx.fillText('QUANTUM DERIVATION', cx, cy - 16);
        ctx.fillStyle = EP_COLORS.textMuted;
        ctx.fillText('BLOCK CONFIRMATION', cx, cy + 16);
      }

      // Counter display for fullRace mode
      if (currentMode === 'fullRace' && state.raceCount > 0) {
        const pct = Math.round((state.quantumWins / state.raceCount) * 100);
        state.counterDisplay += (pct - state.counterDisplay) * 0.1;

        ctx.font = 'bold 36px "Montserrat", sans-serif';
        ctx.fillStyle = EP_COLORS.accent;
        ctx.textAlign = 'right';
        ctx.fillText(
          `~${Math.round(state.counterDisplay)}%`,
          width - 80,
          80,
        );
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillStyle = EP_COLORS.textMuted;
        ctx.fillText(
          `${state.quantumWins} / ${state.raceCount}`,
          width - 80,
          120,
        );
      }

      // Hook mode: show 41% counter when finished
      if (currentMode === 'hook' && state.phase === 'finished') {
        ctx.font = 'bold 120px "Montserrat", sans-serif';
        ctx.fillStyle = EP_COLORS.accent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.shadowColor = EP_COLORS.accent;
        ctx.shadowBlur = 30;
        ctx.fillText('41%', cx, cy);
        ctx.restore();

        ctx.font = '24px "Quicksand", sans-serif';
        ctx.fillStyle = EP_COLORS.textMuted;
        ctx.fillText('of the time, the quantum computer wins', cx, cy + 80);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height, resetRace]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
}
