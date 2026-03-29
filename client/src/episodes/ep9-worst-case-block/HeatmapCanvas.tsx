/**
 * HeatmapCanvas — THE signature visual for EP9.
 *
 * A Canvas 2D grid representing signature hash operations.
 * Each cell = one sigop. Color = computational heat.
 *
 * Three modes:
 * - 'linear'    → steady fill, cool blue-green. Normal block.
 * - 'quadratic' → fill rate accelerates (t²). Blue → amber → red → WHITE.
 * - 'capped'    → fills linearly up to the BIP 54 cap line, then stops.
 *
 * The ACCELERATION is the message — the rate of change IS the quadratic curve.
 * The viewer doesn't need to understand O(n²) math. They SEE it.
 */

import { useRef, useEffect, useCallback } from 'react';
import { GRID, EP_COLORS, heatColor } from './constants';

export type HeatmapMode = 'idle' | 'linear' | 'quadratic' | 'capped';

interface HeatmapCanvasProps {
  mode: HeatmapMode;
  /** Current scene — resets animation on scene change */
  scene: number;
  /** Speed multiplier (default 1) */
  speed?: number;
  /** Show the BIP 54 cap line */
  showCap?: boolean;
  /** Width in CSS units (e.g. '60vw') */
  width?: string;
  /** Height in CSS units */
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Temperature gauge height fraction
const GAUGE_WIDTH = 14;
const GAUGE_PAD = 20;

// Cap line position: row ~18 of 45 (40% height = 2,500 sigops cap)
const CAP_ROW = 18;

export default function HeatmapCanvas({
  mode,
  scene,
  speed = 1,
  showCap = false,
  width = '60vw',
  height = '40vh',
  className,
  style,
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const filledRef = useRef<number>(0);

  // Convert cell index to row/col
  const cellToPos = useCallback((index: number) => {
    const col = index % GRID.cols;
    const row = Math.floor(index / GRID.cols);
    return { col, row };
  }, []);

  // Draw the grid
  const draw = useCallback((ctx: CanvasRenderingContext2D, filledCount: number, elapsed: number) => {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    // Clear
    ctx.clearRect(0, 0, cw, ch);

    // Background with subtle grid pattern
    ctx.fillStyle = EP_COLORS.surface;
    ctx.fillRect(0, 0, cw - GAUGE_WIDTH - GAUGE_PAD, ch);

    const totalCells = GRID.cols * GRID.rows;
    const cappedFill = mode === 'capped' ? CAP_ROW * GRID.cols : totalCells;
    const actualFilled = Math.min(filledCount, cappedFill);

    // Draw cells
    for (let i = 0; i < totalCells; i++) {
      const { col, row } = cellToPos(i);
      const x = col * (GRID.cellSize + GRID.gap);
      const y = row * (GRID.cellSize + GRID.gap);

      if (i < actualFilled) {
        // Filled cell — compute heat based on position and mode
        let heat: number;
        if (mode === 'quadratic') {
          // Later cells are hotter (acceleration visible)
          heat = Math.pow(i / totalCells, 0.6);
          // Boost heat based on elapsed time for dramatic effect
          const timeFactor = Math.min(elapsed / 6000, 1);
          heat = Math.min(1, heat + timeFactor * 0.4);
        } else if (mode === 'capped') {
          heat = (i / cappedFill) * 0.3; // stays cool
        } else {
          heat = (i / totalCells) * 0.25; // linear: stays cool blue-green
        }

        const color = heatColor(heat);

        // Bloom/glow for hot cells
        if (heat > 0.5) {
          ctx.save();
          const glowSize = GRID.cellSize * (1 + heat * 0.8);
          const glowAlpha = (heat - 0.5) * 0.4;
          ctx.globalAlpha = glowAlpha;
          ctx.fillStyle = heatColor(Math.min(1, heat + 0.1));
          ctx.beginPath();
          ctx.arc(
            x + GRID.cellSize / 2,
            y + GRID.cellSize / 2,
            glowSize,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, GRID.cellSize, GRID.cellSize);
      } else {
        // Empty cell — dark with subtle outline
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(x, y, GRID.cellSize, GRID.cellSize);
      }
    }

    // ─── Cap line ──────────────────────────────────────────
    if (showCap || mode === 'capped') {
      const capY = CAP_ROW * (GRID.cellSize + GRID.gap) - GRID.gap / 2;
      ctx.save();

      // Glow behind the line
      ctx.shadowColor = EP_COLORS.fix;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = EP_COLORS.fix;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(0, capY);
      ctx.lineTo(cw - GAUGE_WIDTH - GAUGE_PAD, capY);
      ctx.stroke();

      // Label
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      ctx.fillStyle = EP_COLORS.fix;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('2,500 sigops cap', 8, capY - 6);

      ctx.restore();
    }

    // ─── Temperature gauge (right edge) ────────────────────
    const gaugeX = cw - GAUGE_WIDTH - 4;
    const gaugeH = ch - 20;
    const gaugeY = 10;

    // Gauge background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(gaugeX, gaugeY, GAUGE_WIDTH, gaugeH);

    // Gauge fill
    const fillFraction = actualFilled / totalCells;
    const gaugeFillH = fillFraction * gaugeH;

    // Draw gradient fill from bottom up
    if (gaugeFillH > 0) {
      const grad = ctx.createLinearGradient(0, gaugeY + gaugeH, 0, gaugeY + gaugeH - gaugeFillH);
      grad.addColorStop(0, EP_COLORS.cool);
      if (mode === 'quadratic') {
        const timeFactor = Math.min(elapsed / 6000, 1);
        if (timeFactor > 0.3) grad.addColorStop(0.4, EP_COLORS.hot);
        if (timeFactor > 0.5) grad.addColorStop(0.7, EP_COLORS.critical);
        if (timeFactor > 0.8) grad.addColorStop(1, EP_COLORS.meltdown);
      } else {
        grad.addColorStop(1, EP_COLORS.warm);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(gaugeX, gaugeY + gaugeH - gaugeFillH, GAUGE_WIDTH, gaugeFillH);
    }

    // Gauge outline
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX, gaugeY, GAUGE_WIDTH, gaugeH);

  }, [mode, showCap, cellToPos]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution — pixel-crisp grid look (no DPR scaling)
    canvas.width = GRID.width + GAUGE_WIDTH + GAUGE_PAD;
    canvas.height = GRID.height;

    startRef.current = performance.now();
    filledRef.current = 0;

    if (mode === 'idle') {
      // Draw empty grid
      draw(ctx, 0, 0);
      return;
    }

    const totalCells = GRID.cols * GRID.rows;

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) * speed;

      let filled: number;
      if (mode === 'linear') {
        // Constant rate: fill all cells over ~3 seconds
        const rate = totalCells / 3000;
        filled = Math.floor(elapsed * rate);
      } else if (mode === 'quadratic') {
        // Quadratic: fill rate = ceil(t² / k)
        // Tuned so it starts gentle and finishes in ~5.5 seconds
        const k = 9;
        const t = elapsed / 1000;
        filled = Math.ceil((t * t * t) / k * (totalCells / 20));
      } else if (mode === 'capped') {
        // Linear up to cap, then stops
        const capCells = CAP_ROW * GRID.cols;
        const rate = capCells / 2500;
        filled = Math.min(Math.floor(elapsed * rate), capCells);
      } else {
        filled = 0;
      }

      filled = Math.min(filled, totalCells);
      filledRef.current = filled;

      draw(ctx, filled, elapsed);

      // Keep animating until full (or capped)
      const limit = mode === 'capped' ? CAP_ROW * GRID.cols : totalCells;
      if (filled < limit) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [mode, scene, speed, draw]);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          borderRadius: '4px',
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      />

      {/* Screen shake in quadratic mode */}
      {mode === 'quadratic' && (
        <style>{`
          @keyframes ep9-shake {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-2px, 1px); }
            20% { transform: translate(2px, -1px); }
            30% { transform: translate(-1px, 2px); }
            40% { transform: translate(1px, -2px); }
            50% { transform: translate(-2px, 0px); }
            60% { transform: translate(2px, 1px); }
            70% { transform: translate(-1px, -1px); }
            80% { transform: translate(1px, 2px); }
            90% { transform: translate(0px, -2px); }
          }
        `}</style>
      )}

      {/* Danger glow overlay in quadratic mode */}
      {mode === 'quadratic' && (
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '8px',
            boxShadow: `inset 0 0 60px ${EP_COLORS.dangerGlow}, 0 0 80px ${EP_COLORS.dangerGlow}`,
            pointerEvents: 'none',
            animation: 'ep9-dangerPulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes ep9-dangerPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
