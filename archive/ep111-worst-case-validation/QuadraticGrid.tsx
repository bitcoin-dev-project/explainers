/**
 * QuadraticGrid — Canvas 2D signature visual for EP111.
 *
 * Renders an N×N grid of cells representing hash operations.
 * The grid IS the quadratic scaling — rows = inputs, columns = fields hashed per input.
 * Driven by a mathematical model: cursor sweeps cells, heat ramp visualises stress,
 * jitter conveys overload. Multiple modes for the episode's emotional arc.
 *
 * Modes: off | linear | quadratic | meltdown | historical | capped | resolved
 */

import { useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export type GridMode =
  | 'off'
  | 'linear'
  | 'quadratic'
  | 'meltdown'
  | 'historical'
  | 'capped'
  | 'resolved';

interface Props {
  mode: GridMode;
  gridSize: number;
  /** Override fill speed (cells per second). Default computed from mode. */
  cellsPerSecond?: number;
  /** Color palette bias. */
  colorBias?: 'default' | 'segwit' | 'teal';
  /** Row number at which the cap line sits (for capped mode). */
  capRow?: number;
  style?: React.CSSProperties;
  className?: string;
}

// ── Color utilities ────────────────────────────────────────────────

type RGB = [number, number, number];

const HEAT_STOPS: RGB[] = [
  [30, 42, 74],     // 0.00 idle (dark navy)
  [46, 134, 222],   // 0.15 cool (blue)
  [246, 173, 85],   // 0.40 warm (amber)
  [229, 62, 62],    // 0.70 hot (red)
  [255, 107, 107],  // 0.90 critical (bright red)
  [255, 245, 245],  // 1.00 white-hot
];
const HEAT_POS = [0, 0.15, 0.4, 0.7, 0.9, 1.0];

const TEAL_STOPS: RGB[] = [[30, 42, 74], [32, 140, 110], [56, 217, 169]];
const TEAL_POS = [0, 0.3, 1.0];

const SEGWIT_STOPS: RGB[] = [[30, 42, 74], [60, 80, 180], [116, 143, 252]];
const SEGWIT_POS = [0, 0.3, 1.0];

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function rampLookup(t: number, stops: RGB[], pos: number[]): RGB {
  const ct = clamp01(t);
  for (let i = 1; i < stops.length; i++) {
    if (ct <= pos[i]) {
      const f = (ct - pos[i - 1]) / (pos[i] - pos[i - 1]);
      return [
        stops[i - 1][0] + (stops[i][0] - stops[i - 1][0]) * f,
        stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * f,
        stops[i - 1][2] + (stops[i][2] - stops[i - 1][2]) * f,
      ];
    }
  }
  return stops[stops.length - 1];
}

/** Build a 256-entry rgb() string lookup table for fast per-cell coloring. */
function buildLUT(bias: 'default' | 'segwit' | 'teal'): string[] {
  const [stops, pos] =
    bias === 'segwit' ? [SEGWIT_STOPS, SEGWIT_POS]
    : bias === 'teal' ? [TEAL_STOPS, TEAL_POS]
    : [HEAT_STOPS, HEAT_POS];
  const lut: string[] = [];
  for (let i = 0; i < 256; i++) {
    const c = rampLookup(i / 255, stops, pos);
    lut.push(`rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
  }
  return lut;
}

const CURSOR_FILL = 'rgb(0,212,255)';
const CURSOR_GLOW = 'rgba(0,212,255,0.35)';
const BG = '#0B0E17';

// ── Internal mutable state ─────────────────────────────────────────

interface GState {
  n: number;
  heat: Float32Array;
  phases: Float32Array;
  dissolve: Float32Array;
  cursor: number;
  time: number;
  lastTs: number;
  stress: number;
  tgtStress: number;
  flashAcc: number;
  scanPhase: number;
  w: number;
  h: number;
  dpr: number;
  lut: string[];
  // Change-detection bookkeeping
  _pMode: string;
  _pN: number;
  _pBias: string;
}

function createState(n: number, bias: 'default' | 'segwit' | 'teal'): GState {
  const total = n * n;
  const phases = new Float32Array(total);
  for (let i = 0; i < total; i++) phases[i] = Math.random() * Math.PI * 2;
  return {
    n,
    heat: new Float32Array(total),
    phases,
    dissolve: new Float32Array(total),
    cursor: 0,
    time: 0,
    lastTs: 0,
    stress: 0,
    tgtStress: 0,
    flashAcc: 0,
    scanPhase: 0,
    w: 100,
    h: 100,
    dpr: 1,
    lut: buildLUT(bias),
    _pMode: '',
    _pN: 0,
    _pBias: '',
  };
}

// ── Component ──────────────────────────────────────────────────────

export default function QuadraticGrid({
  mode,
  gridSize,
  cellsPerSecond,
  colorBias = 'default',
  capRow,
  style,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Lazy init — only once
  const sRef = useRef<GState | null>(null);
  if (sRef.current === null) sRef.current = createState(gridSize, colorBias);

  // Mirror props every render (read each rAF frame via the ref)
  const P = useRef({ mode, gridSize, cellsPerSecond, colorBias, capRow });
  P.current = { mode, gridSize, cellsPerSecond, colorBias, capRow };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const s = sRef.current!;

    // ── Resize ──
    function resize() {
      const r = parent!.getBoundingClientRect();
      s.dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(r.width * s.dpr);
      canvas!.height = Math.round(r.height * s.dpr);
      s.w = r.width;
      s.h = r.height;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // ── Frame loop ──
    function frame(now: number) {
      const p = P.current;
      const dt = s.lastTs ? Math.min(now - s.lastTs, 50) : 16;
      s.lastTs = now;
      s.time += dt;

      // — Grid size change —
      if (p.gridSize !== s._pN) {
        const oldProg = s._pN > 0 ? s.cursor / (s._pN * s._pN) : 0;
        s._pN = p.gridSize;
        s.n = p.gridSize;
        const total = s.n * s.n;
        s.heat = new Float32Array(total);
        s.phases = new Float32Array(total);
        s.dissolve = new Float32Array(total);
        for (let i = 0; i < total; i++) s.phases[i] = Math.random() * Math.PI * 2;
        s.cursor =
          p.mode === 'historical' || p.mode === 'resolved'
            ? total
            : Math.floor(oldProg * total);
      }

      // — Mode change —
      if (p.mode !== s._pMode) {
        s._pMode = p.mode;
        const total = s.n * s.n;
        switch (p.mode) {
          case 'linear':
            s.cursor = 0;
            s.tgtStress = 0.05;
            break;
          case 'quadratic':
            if (s.cursor >= total) s.cursor = 0;
            s.tgtStress = Math.min(0.85, s.n / 110);
            break;
          case 'meltdown':
            s.tgtStress = 1;
            break;
          case 'historical':
            s.cursor = total;
            s.tgtStress = 0.45;
            break;
          case 'capped':
            s.tgtStress = 0.08;
            s.dissolve.fill(0);
            break;
          case 'resolved':
            s.cursor = total;
            s.tgtStress = 0;
            break;
          default:
            s.tgtStress = 0;
        }
      }

      // — Color bias change —
      if (p.colorBias !== s._pBias) {
        s._pBias = p.colorBias;
        s.lut = buildLUT(p.colorBias);
      }

      // — Off: clear and bail —
      if (p.mode === 'off') {
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, s.w, s.h);
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const { n, heat, phases, dissolve, lut } = s;
      const total = n * n;
      const W = s.w;
      const H = s.h;

      // ════════════════════════ UPDATE ════════════════════════

      // Smooth stress interpolation
      s.stress += (s.tgtStress - s.stress) * (1 - Math.exp(-dt * 0.004));

      // Fill rate (cells / ms)
      let fillRate: number;
      if (p.cellsPerSecond != null) {
        fillRate = p.cellsPerSecond / 1000;
      } else {
        switch (p.mode) {
          case 'linear':
            fillRate = total / 2500;
            break;
          case 'quadratic':
            // n*1.5 cells/s — bigger grid → visually slower fill
            fillRate = (n * 1.5) / 1000;
            break;
          default:
            fillRate = 0;
        }
      }

      // Advance cursor
      if (fillRate > 0 && s.cursor < total) {
        s.cursor = Math.min(total, s.cursor + fillRate * dt);
      }

      // Update cell heat
      const cursorFloor = Math.floor(s.cursor);
      const stress = s.stress;
      for (let i = 0; i < total; i++) {
        const row = (i / n) | 0;
        const posGrad = row / Math.max(1, n - 1);
        let target: number;
        if (i < cursorFloor) {
          target = 0.12 + stress * 0.7 * (0.5 + posGrad * 0.5);
        } else if (i === cursorFloor) {
          target = 0.5 + stress * 0.4;
        } else {
          target = 0;
        }
        heat[i] += (target - heat[i]) * (1 - Math.exp(-dt * 0.008));
      }

      // Meltdown: random white-hot flashes, all cells drift hot
      if (p.mode === 'meltdown') {
        s.flashAcc += dt;
        if (s.flashAcc > 40) {
          s.flashAcc = 0;
          const k = 3 + ((Math.random() * 6) | 0);
          for (let f = 0; f < k; f++) {
            heat[(Math.random() * total) | 0] = 0.92 + Math.random() * 0.08;
          }
        }
        for (let i = 0; i < total; i++) {
          if (heat[i] < 0.65) heat[i] += dt * 0.00009;
        }
      }

      // Capped: dissolve cells below cap row, cool cells above
      const cRow = p.capRow ?? Infinity;
      if (p.mode === 'capped' && cRow < n) {
        for (let i = 0; i < total; i++) {
          const row = (i / n) | 0;
          if (row >= cRow) {
            dissolve[i] = Math.min(1, dissolve[i] + dt * 0.0012);
          } else {
            heat[i] += (0.15 - heat[i]) * (1 - Math.exp(-dt * 0.003));
          }
        }
      }

      // Resolved: drift all cells to steady value
      if (p.mode === 'resolved') {
        for (let i = 0; i < total; i++) {
          heat[i] += (0.7 - heat[i]) * (1 - Math.exp(-dt * 0.004));
        }
      }

      // Scanline phase (~3s period)
      s.scanPhase = (s.time * 0.00033) % 1;

      // ════════════════════════ RENDER ════════════════════════

      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Grid layout: square cells centered in canvas
      const maxGap = n <= 5 ? 4 : n <= 20 ? 2 : n <= 60 ? 1 : 0.5;
      const gap = Math.max(0.3, maxGap);
      const cellW = (W - gap * (n + 1)) / n;
      const cellH = (H - gap * (n + 1)) / n;
      const cell = Math.max(1, Math.min(cellW, cellH));
      const gW = cell * n + gap * (n + 1);
      const gH = cell * n + gap * (n + 1);
      const ox = (W - gW) / 2;
      const oy = (H - gH) / 2;

      // Jitter amplitude (proportional to stress and cell size)
      const jitter = stress * Math.min(3, cell * 0.3);

      // ── Draw cells ──
      ctx.globalAlpha = 1;
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const idx = row * n + col;
          const h = heat[idx];
          const d = dissolve[idx];
          if (d >= 1) continue;

          // Shimmer: subtle luminance oscillation on completed cells
          const shim = Math.sin(s.time * 0.002 + phases[idx]) * 0.025 * (0.3 + h);
          const hIdx = Math.min(255, Math.max(0, ((h + shim) * 255) | 0));

          // Base position
          let x = ox + gap + col * (cell + gap);
          let y = oy + gap + row * (cell + gap);

          // Jitter (stress-proportional random offset)
          if (jitter > 0.1) {
            x += (Math.random() - 0.5) * jitter;
            y += (Math.random() - 0.5) * jitter;
          }

          // Dissolve: drift down + fade
          if (d > 0) {
            y += d * 30;
            ctx.globalAlpha = 1 - d;
          }

          ctx.fillStyle = lut[hIdx];
          ctx.fillRect(x, y, cell, cell);

          if (d > 0) ctx.globalAlpha = 1;
        }
      }

      // ── Cursor highlight ──
      if (s.cursor < total && fillRate > 0) {
        const cR = (cursorFloor / n) | 0;
        const cC = cursorFloor % n;
        const cx = ox + gap + cC * (cell + gap);
        const cy = ox + gap + cR * (cell + gap); // oy not ox — fixed below

        // Trail: highlight current row behind cursor
        const rowStartX = ox + gap;
        ctx.fillStyle = 'rgba(0,212,255,0.08)';
        ctx.fillRect(rowStartX, oy + gap + cR * (cell + gap), cC * (cell + gap), cell);

        // Leading edge
        const actualCy = oy + gap + cR * (cell + gap);
        ctx.fillStyle = CURSOR_FILL;
        ctx.fillRect(cx - 0.5, actualCy - 0.5, cell + 1, cell + 1);

        // Glow
        ctx.shadowColor = CURSOR_FILL;
        ctx.shadowBlur = 12;
        ctx.fillStyle = CURSOR_GLOW;
        ctx.fillRect(cx - 2, actualCy - 2, cell + 4, cell + 4);
        ctx.shadowBlur = 0;
      }

      // ── Bloom: hot cells get additive glow ──
      if (stress > 0.2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = stress * 0.2;
        for (let row = 0; row < n; row++) {
          for (let col = 0; col < n; col++) {
            const idx = row * n + col;
            if (heat[idx] < 0.5 || dissolve[idx] > 0.5) continue;
            const x = ox + gap + col * (cell + gap);
            const y = oy + gap + row * (cell + gap);
            const hIdx = Math.min(255, (heat[idx] * 255) | 0);
            ctx.fillStyle = lut[hIdx];
            ctx.fillRect(x - 1, y - 1, cell + 2, cell + 2);
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }

      // ── Scanline sweep ──
      if (stress > 0.15) {
        const scanY = oy + s.scanPhase * gH;
        ctx.fillStyle = `rgba(255,255,255,${(0.015 + stress * 0.03).toFixed(3)})`;
        ctx.fillRect(ox, scanY, gW, 1.5);
      }

      // ── Background radial glow behind grid ──
      if (stress > 0.3) {
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, gW * 0.6);
        grad.addColorStop(0, `rgba(229,62,62,${(stress * 0.06).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(229,62,62,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []); // Mount once — reads props via P.current each frame

  return (
    <div style={{ width: '100%', height: '100%', ...style }} className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
