import { useRef, useEffect, useCallback } from 'react';
import { EP_COLORS } from './constants';

type HeatmapMode = 'linear' | 'quadratic' | 'capped' | 'hidden';

interface HashingHeatmapProps {
  mode: HeatmapMode;
  scene: number;
  width?: number;
  height?: number;
}

const GRID_SIZE = 40;
const CELL_SIZE = 12;
const CELL_GAP = 1;
const FONT_MONO = '"JetBrains Mono", monospace';

// Heat color ramp: blue → amber → white
function heatColor(t: number): string {
  if (t < 0.33) {
    const p = t / 0.33;
    const r = Math.round(96 * p);
    const g = Math.round(165 * p);
    const b = Math.round(250 * (0.5 + p * 0.5));
    return `rgb(${r},${g},${b})`;
  }
  if (t < 0.66) {
    const p = (t - 0.33) / 0.33;
    const r = Math.round(96 + (245 - 96) * p);
    const g = Math.round(165 + (158 - 165) * p);
    const b = Math.round(250 + (11 - 250) * p);
    return `rgb(${r},${g},${b})`;
  }
  const p = (t - 0.66) / 0.34;
  const r = Math.round(245 + (253 - 245) * p);
  const g = Math.round(158 + (230 - 158) * p);
  const b = Math.round(11 + (138 - 11) * p);
  return `rgb(${r},${g},${b})`;
}

function timerText(elapsed: number): string {
  if (elapsed < 60) return `${elapsed.toFixed(1)}s`;
  return `${Math.floor(elapsed / 60)}m ${Math.round(elapsed % 60)}s`;
}

export default function HashingHeatmap({
  mode,
  scene,
  width = 600,
  height = 600,
}: HashingHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const stateRef = useRef({
    time: 0,
    filledCells: 0,
    simulatedElapsed: 0,
    capLine: 0,
    shatterPhase: 0,
    shatterParticles: [] as Array<{
      x: number; y: number; vx: number; vy: number; opacity: number; color: string;
    }>,
  });
  const prevModeRef = useRef(mode);

  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

  // Reset state on mode change
  useEffect(() => {
    if (mode !== prevModeRef.current) {
      const s = stateRef.current;
      s.time = 0;
      s.filledCells = 0;
      s.simulatedElapsed = 0;
      s.capLine = 0;
      s.shatterPhase = 0;
      s.shatterParticles = [];
      prevModeRef.current = mode;
    }
  }, [mode]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    const s = stateRef.current;
    s.time += dt;
    const t = s.time;

    ctx.clearRect(0, 0, width, height);

    if (mode === 'hidden') return;

    const totalCells = GRID_SIZE * GRID_SIZE;
    const gridW = GRID_SIZE * (CELL_SIZE + CELL_GAP);
    const gridX = (width - gridW) / 2;
    const gridY = 60;

    // Determine fill amount based on mode
    if (mode === 'linear') {
      // Linear: fill one row (GRID_SIZE cells) over 1.5s
      s.filledCells = Math.min(GRID_SIZE, Math.floor(t * GRID_SIZE / 1.5));
      s.simulatedElapsed = Math.min(0.003, t * 0.003 / 1.5);
    } else if (mode === 'quadratic') {
      // Quadratic: O(n²) fill — starts slow, accelerates exponentially
      const progress = Math.min(1, t / 6);
      // Quadratic curve: fills proportional to t²
      const fillFraction = progress * progress;
      s.filledCells = Math.min(totalCells, Math.floor(fillFraction * totalCells));
      // Simulated timer goes from 0 to 90 minutes (5400s) over the animation
      s.simulatedElapsed = fillFraction * 5400;
    } else if (mode === 'capped') {
      // Show cap line drawing, then shatter above it
      if (t < 0.8) {
        // Draw all cells filled
        s.filledCells = totalCells;
        s.capLine = t / 0.8;
        s.simulatedElapsed = 5400;
      } else if (t < 1.5) {
        // Shatter phase — cells above cap dissolve
        s.filledCells = totalCells;
        s.capLine = 1;
        s.shatterPhase = (t - 0.8) / 0.7;
        s.simulatedElapsed = 5400;

        // Generate shatter particles if not yet
        if (s.shatterParticles.length === 0) {
          const capRow = Math.floor(GRID_SIZE * 0.5);
          for (let row = 0; row < capRow; row++) {
            for (let col = 0; col < GRID_SIZE; col += 3) {
              const cx = gridX + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
              const cy = gridY + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
              s.shatterParticles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 300,
                vy: -50 - Math.random() * 200,
                opacity: 1,
                color: heatColor(0.5 + Math.random() * 0.5),
              });
            }
          }
        }
      } else {
        // After shatter: show only bottom half, rerun timer
        const capRow = Math.floor(GRID_SIZE * 0.5);
        s.filledCells = capRow * GRID_SIZE;
        s.capLine = 1;
        s.shatterPhase = 1;
        // Timer reruns: 0 → 2.2s over 1.5s
        s.simulatedElapsed = Math.min(2.2, (t - 1.5) * 2.2 / 1.5);
      }
    }

    // Draw grid
    const capRow = Math.floor(GRID_SIZE * 0.5);
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cellIndex = row * GRID_SIZE + col;
        const cx = gridX + col * (CELL_SIZE + CELL_GAP);
        const cy = gridY + row * (CELL_SIZE + CELL_GAP);

        // Skip shattered cells above cap
        if (mode === 'capped' && s.shatterPhase > 0 && row < capRow) {
          const fadeOut = 1 - s.shatterPhase;
          if (fadeOut <= 0) continue;
          ctx.globalAlpha = fadeOut * 0.3;
        }

        if (cellIndex < s.filledCells) {
          const fillProgress = cellIndex / totalCells;
          const color = mode === 'capped' && s.shatterPhase >= 1 && row >= capRow
            ? heatColor(fillProgress * 0.3) // Cooled down: blue
            : heatColor(fillProgress);
          ctx.fillStyle = color;
        } else {
          ctx.fillStyle = EP_COLORS.bgAlt;
        }
        ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
        ctx.globalAlpha = 1;
      }
    }

    // Bloom/glow overlay when heavily filled
    if (mode === 'quadratic' && s.filledCells > totalCells * 0.7) {
      const intensity = ((s.filledCells / totalCells) - 0.7) / 0.3;
      ctx.fillStyle = `rgba(245, 158, 11, ${intensity * 0.08})`;
      ctx.fillRect(gridX, gridY, gridW, gridW);
    }

    // Cap line
    if (mode === 'capped' && s.capLine > 0) {
      const lineY = gridY + capRow * (CELL_SIZE + CELL_GAP) - 2;
      const lineEndX = gridX + gridW * s.capLine;
      ctx.strokeStyle = EP_COLORS.actCoinbase;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gridX, lineY);
      ctx.lineTo(lineEndX, lineY);
      ctx.stroke();

      // Cap label
      if (s.capLine >= 1) {
        ctx.font = `bold 12px ${FONT_MONO}`;
        ctx.fillStyle = EP_COLORS.actCoinbase;
        ctx.fillText('2,500 sigops/tx limit', lineEndX + 8, lineY + 4);
      }
    }

    // Shatter particles
    for (const p of s.shatterParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.opacity = Math.max(0, p.opacity - dt * 1.5);
      if (p.opacity > 0) {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
    }
    ctx.globalAlpha = 1;

    // Timer display
    const timerX = width - 20;
    const timerY = 40;
    const isLong = s.simulatedElapsed > 60;

    if (mode === 'capped' && s.shatterPhase >= 1 && t > 1.5) {
      // Rerun timer in green
      ctx.font = `bold 24px ${FONT_MONO}`;
      ctx.fillStyle = EP_COLORS.statusGreen;
      ctx.textAlign = 'right';
      ctx.fillText(timerText(s.simulatedElapsed), timerX, timerY);

      // "40× faster" badge
      if (s.simulatedElapsed >= 2.0) {
        ctx.font = `bold 28px var(--font-display)`;
        ctx.fillStyle = EP_COLORS.statusGreen;
        ctx.fillText('40× faster', timerX, timerY + 40);
      }
    } else {
      const fontSize = isLong ? 36 : 20;
      ctx.font = `bold ${fontSize}px ${FONT_MONO}`;
      ctx.fillStyle = isLong ? EP_COLORS.statusRed : s.simulatedElapsed > 10 ? EP_COLORS.actQuadratic : EP_COLORS.statusGreen;
      ctx.textAlign = 'right';

      if (s.simulatedElapsed >= 5400) {
        ctx.fillText('90 MINUTES', timerX, timerY);
        ctx.font = `14px ${FONT_MONO}`;
        ctx.fillStyle = EP_COLORS.textMuted;
        ctx.fillText('on a Raspberry Pi 4', timerX, timerY + 22);
      } else {
        ctx.fillText(timerText(s.simulatedElapsed), timerX, timerY);
      }
    }
    ctx.textAlign = 'left';

    // Mode label
    if (mode === 'linear') {
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = EP_COLORS.text;
      ctx.fillText('Cost: N × S (inputs × size)', gridX, gridY + gridW + 30);
    } else if (mode === 'quadratic') {
      ctx.font = `13px ${FONT_MONO}`;
      ctx.fillStyle = EP_COLORS.actQuadratic;
      ctx.fillText('Cost: N × S — all inputs × full tx size', gridX, gridY + gridW + 30);
    }
  }, [mode, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * DPR;
    canvas.height = height * DPR;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(DPR, DPR);
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      draw(ctx, dt);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw, width, height, DPR]);

  if (mode === 'hidden') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
    />
  );
}
