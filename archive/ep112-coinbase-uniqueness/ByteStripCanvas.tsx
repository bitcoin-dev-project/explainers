// ByteStripCanvas.tsx — Signature visual for EP112
// Canvas 2D coinbase transaction byte dissection with 9 modes,
// ambient shimmer, particle dissolution, sync pulse, and gold seal.

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  EP_COLORS, COINBASE_FIELDS, COINBASE_HEX, TOTAL_BYTES, BYTE_TO_FIELD,
} from './constants';

// ─── Types ───────────────────────────────────────────────────────────

export type StripMode =
  | 'hidden' | 'anatomy' | 'miner' | 'duplicate' | 'overwrite'
  | 'aftermath' | 'normal' | 'zoom-scriptsig' | 'split-highlight' | 'fixed';

interface Props {
  mode: StripMode;
  scene: number;
  locktimeHex?: string[];
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  opacity: number; color: string; size: number;
}

interface AnimState {
  fieldReveal: number[];
  secondStripOp: number;
  syncPulse: number;
  dissolveIdx: number;
  ghostOp: number;
  zoomFactor: number;
  hlScriptSig: number;
  hlNLockTime: number;
  dimOthers: number;
  goldBorder: number;
  locktimeGlow: number;
  opacity: number;
}

// ─── Canvas Constants ────────────────────────────────────────────────

const CW = 1400;
const CH = 500;
const STRIP_W = 1340;
const CELL_H = 36;
const STRIP_X = (CW - STRIP_W) / 2;

// ─── Pre-computed colour RGB tuples ──────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const RGB_BYTE = hexToRgb(EP_COLORS.byte);
const RGB_FIELDS = COINBASE_FIELDS.map(f => hexToRgb(f.color));

function randomHex(): string {
  return Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
}

// ─── Geometry ────────────────────────────────────────────────────────

function computePositions(zoom: number): Array<{ x: number; w: number }> {
  const ssField = COINBASE_FIELDS.find(f => f.name === 'scriptSig')!;
  const ssStart = ssField.start;
  const ssEnd = ssStart + ssField.length;
  let totalWeight = 0;
  for (let i = 0; i < TOTAL_BYTES; i++) {
    totalWeight += (i >= ssStart && i < ssEnd) ? zoom : 1;
  }
  const out: Array<{ x: number; w: number }> = [];
  let x = STRIP_X;
  for (let i = 0; i < TOTAL_BYTES; i++) {
    const weight = (i >= ssStart && i < ssEnd) ? zoom : 1;
    const w = (weight / totalWeight) * STRIP_W;
    out.push({ x, w });
    x += w;
  }
  return out;
}

// ─── Particles ───────────────────────────────────────────────────────

function spawnCellParticles(
  particles: Particle[], pos: { x: number; w: number }, y: number,
) {
  const n = 4 + Math.floor(Math.random() * 3);
  for (let j = 0; j < n; j++) {
    particles.push({
      x: pos.x + Math.random() * pos.w,
      y: y + Math.random() * CELL_H,
      vx: (Math.random() - 0.5) * 50,
      vy: 15 + Math.random() * 50,
      opacity: 0.8 + Math.random() * 0.2,
      color: EP_COLORS.danger,
      size: 2 + Math.random() * 3,
    });
  }
}

function tickParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += 80 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.opacity -= 0.35 * dt;
    if (p.opacity <= 0 || p.y > CH + 20) particles.splice(i, 1);
  }
}

// ─── Drawing Helpers ─────────────────────────────────────────────────

function drawStrip(
  ctx: CanvasRenderingContext2D,
  pos: Array<{ x: number; w: number }>,
  stripY: number,
  a: AnimState,
  hex: string[],
  dissolved: Set<number> | null,
  time: number,
) {
  for (let i = 0; i < TOTAL_BYTES; i++) {
    if (dissolved?.has(i)) continue;
    const { x, w } = pos[i];
    const fi = BYTE_TO_FIELD[i];
    const reveal = a.fieldReveal[fi] ?? 0;

    // Shimmer: slow scanning wave
    const shimmer = 0.85 + Math.sin(time * 2 + i * 0.3) * 0.12;

    // Blend byte base → field colour by reveal amount
    const fr = RGB_FIELDS[fi];
    let r = RGB_BYTE[0] + (fr[0] - RGB_BYTE[0]) * reveal * 0.35;
    let g = RGB_BYTE[1] + (fr[1] - RGB_BYTE[1]) * reveal * 0.35;
    let b = RGB_BYTE[2] + (fr[2] - RGB_BYTE[2]) * reveal * 0.35;

    // Dim non-highlighted fields
    if (a.dimOthers > 0.01) {
      const field = COINBASE_FIELDS[fi];
      const keep =
        field.name === 'scriptSig' || field.name === 'scriptSigLen' ||
        field.name === 'nLockTime';
      if (!keep) { const d = 1 - a.dimOthers; r *= d; g *= d; b *= d; }
    }

    r *= shimmer; g *= shimmer; b *= shimmer;

    // Cell rect
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.fillRect(x + 0.5, stripY, w - 1, CELL_H);

    // Hex text (skip if too narrow)
    if (w > 8) {
      const fs = Math.min(11, w * 0.65);
      ctx.fillStyle = `rgba(226,232,240,${(0.35 + reveal * 0.65).toFixed(2)})`;
      ctx.font = `${fs}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hex[i], x + w / 2, stripY + CELL_H / 2);
    }
  }
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  pos: Array<{ x: number; w: number }>,
  stripY: number,
  fieldName: string,
  intensity: number,
  color: string,
  blur: number,
) {
  if (intensity < 0.01) return;
  const field = COINBASE_FIELDS.find(f => f.name === fieldName);
  if (!field) return;
  const s = pos[field.start];
  const e = pos[field.start + field.length - 1];
  const gx = s.x - 6;
  const gw = e.x + e.w - s.x + 12;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * intensity;
  const rgb = hexToRgb(color);
  ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(0.12 * intensity).toFixed(3)})`;
  ctx.fillRect(gx, stripY - 6, gw, CELL_H + 12);
  ctx.restore();
}

function drawGhostOutline(ctx: CanvasRenderingContext2D, y: number, op: number) {
  ctx.save();
  ctx.strokeStyle = `rgba(71,85,105,${op.toFixed(2)})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(STRIP_X, y, STRIP_W, CELL_H);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSyncPulse(
  ctx: CanvasRenderingContext2D,
  pos: Array<{ x: number; w: number }>,
  y1: number, y2: number, pulsePos: number,
) {
  const range = 4;
  for (let i = Math.max(0, Math.floor(pulsePos) - range);
       i <= Math.min(TOTAL_BYTES - 1, Math.floor(pulsePos) + range); i++) {
    const dist = Math.abs(i - pulsePos);
    const intensity = Math.max(0, 1 - dist / (range + 1));
    const { x, w } = pos[i];
    ctx.fillStyle = `rgba(245,158,11,${(0.45 * intensity).toFixed(2)})`;
    ctx.fillRect(x, y1, w, CELL_H);
    ctx.fillRect(x, y2, w, CELL_H);
  }
}

function drawGoldBorder(ctx: CanvasRenderingContext2D, y: number, progress: number) {
  if (progress < 0.01) return;
  ctx.save();
  ctx.strokeStyle = EP_COLORS.highlight;
  ctx.lineWidth = 2;
  ctx.shadowColor = EP_COLORS.highlight;
  ctx.shadowBlur = 12;

  const w = STRIP_W, h = CELL_H, x = STRIP_X;
  const perimeter = 2 * (w + h);
  let rem = perimeter * progress;

  ctx.beginPath();
  ctx.moveTo(x + w, y + h);

  // bottom → left → top → right (starting from nLockTime corner)
  const segs: [number, number][] = [[-w, 0], [0, -h], [w, 0], [0, h]];
  let cx = x + w, cy = y + h;
  for (const [dx, dy] of segs) {
    const len = Math.abs(dx || dy);
    const draw = Math.min(rem, len);
    const frac = draw / len;
    cx += dx * frac;
    cy += dy * frac;
    ctx.lineTo(cx, cy);
    rem -= draw;
    if (rem <= 0) break;
  }
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ─── Component ───────────────────────────────────────────────────────

export default function ByteStripCanvas({ mode, locktimeHex }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const modeRef = useRef<StripMode>(mode);
  const animRef = useRef<AnimState>({
    fieldReveal: Array(COINBASE_FIELDS.length).fill(0),
    secondStripOp: 0, syncPulse: -1, dissolveIdx: -1, ghostOp: 0,
    zoomFactor: 1, hlScriptSig: 0, hlNLockTime: 0, dimOthers: 0,
    goldBorder: 0, locktimeGlow: 0, opacity: 0,
  });
  const particlesRef = useRef<Particle[]>([]);
  const hexRef = useRef([...COINBASE_HEX]);
  const dissolvedRef = useRef(new Set<number>());
  const lastDissolveRef = useRef(0);
  const cycleTimerRef = useRef(0);

  // ── Mode-change handler ──
  useEffect(() => {
    modeRef.current = mode;
    const a = animRef.current;
    gsap.killTweensOf(a);
    gsap.killTweensOf(a.fieldReveal);

    // Reset transient state
    if (mode !== 'overwrite') {
      particlesRef.current.length = 0;
      dissolvedRef.current.clear();
      lastDissolveRef.current = 0;
    }
    if (mode !== 'miner') hexRef.current = [...COINBASE_HEX];
    if (locktimeHex && mode === 'fixed') {
      for (let i = 0; i < 4 && i < locktimeHex.length; i++)
        hexRef.current[81 + i] = locktimeHex[i];
    }

    const reset = {
      secondStripOp: 0, syncPulse: -1, dissolveIdx: -1, ghostOp: 0,
      zoomFactor: 1, hlScriptSig: 0, hlNLockTime: 0, dimOthers: 0,
      goldBorder: 0, locktimeGlow: 0,
    };

    switch (mode) {
      case 'hidden':
        gsap.to(a, { opacity: 0, duration: 0.3 });
        break;

      case 'anatomy':
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, duration: 0.3 });
        a.fieldReveal.fill(0);
        COINBASE_FIELDS.forEach((_, i) => {
          gsap.to(a.fieldReveal, { [i]: 1, duration: 0.3, delay: 0.4 + i * 0.3, ease: 'power2.out' });
        });
        break;

      case 'miner':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, duration: 0.3 });
        break;

      case 'duplicate':
        a.fieldReveal.fill(1);
        Object.assign(a, { ...reset, syncPulse: -1 });
        gsap.to(a, { opacity: 1, duration: 0.3 });
        gsap.to(a, { secondStripOp: 1, duration: 0.6, delay: 0.4 });
        gsap.fromTo(a, { syncPulse: 0 }, { syncPulse: TOTAL_BYTES, duration: 1.7, delay: 1.2, ease: 'none' });
        break;

      case 'overwrite':
        a.fieldReveal.fill(1);
        a.secondStripOp = 1;
        a.opacity = 1;
        gsap.fromTo(a, { dissolveIdx: 0 }, { dissolveIdx: TOTAL_BYTES, duration: 2.5, delay: 2.2, ease: 'none' });
        break;

      case 'aftermath':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, ghostOp: 0.25, duration: 0.4, delay: 0.3 });
        break;

      case 'normal':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, duration: 0.3 });
        break;

      case 'zoom-scriptsig':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, zoomFactor: 2.5, duration: 0.8, ease: 'power2.out' });
        break;

      case 'split-highlight':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, duration: 0.3 });
        gsap.to(a, { hlScriptSig: 1, hlNLockTime: 1, dimOthers: 0.7, duration: 0.5, delay: 0.3 });
        break;

      case 'fixed':
        a.fieldReveal.fill(1);
        Object.assign(a, reset);
        gsap.to(a, { opacity: 1, hlNLockTime: 1, locktimeGlow: 1, duration: 0.6, delay: 0.2 });
        gsap.to(a, { goldBorder: 1, duration: 1.5, delay: 0.5 });
        break;
    }
  }, [mode, locktimeHex]);

  // ── Canvas + rAF loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext('2d')!;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;
      const a = animRef.current;
      const m = modeRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CW, CH);

      if (a.opacity > 0.005) {
        ctx.globalAlpha = a.opacity;
        const pos = computePositions(a.zoomFactor);
        const hasDual = a.secondStripOp > 0.01;
        const y1 = hasDual ? CH * 0.32 : CH * 0.5 - CELL_H / 2;
        const y2 = CH * 0.62;

        // Glow layers
        drawGlow(ctx, pos, y1, 'scriptSig', a.hlScriptSig, EP_COLORS.fieldScriptSig, 22);
        drawGlow(ctx, pos, y1, 'nLockTime',
          Math.max(a.hlNLockTime, a.locktimeGlow), EP_COLORS.fieldLockTime, 35);

        // Strip 1
        drawStrip(ctx, pos, y1, a, hexRef.current,
          m === 'overwrite' ? dissolvedRef.current : null, timeRef.current);

        // Strip 2
        if (hasDual) {
          const prevAlpha = ctx.globalAlpha;
          ctx.globalAlpha = a.opacity * a.secondStripOp;
          drawStrip(ctx, pos, y2, a, hexRef.current, null, timeRef.current);
          ctx.globalAlpha = prevAlpha;
        }

        // Ghost outline
        if (a.ghostOp > 0.01) drawGhostOutline(ctx, y1 - 100, a.ghostOp);

        // Sync pulse
        if (a.syncPulse >= 0 && a.syncPulse <= TOTAL_BYTES && hasDual)
          drawSyncPulse(ctx, pos, y1, y2, a.syncPulse);

        // Particle spawning
        if (m === 'overwrite' && a.dissolveIdx > 0) {
          const target = Math.min(Math.floor(a.dissolveIdx), TOTAL_BYTES);
          while (lastDissolveRef.current < target) {
            const idx = lastDissolveRef.current;
            dissolvedRef.current.add(idx);
            spawnCellParticles(particlesRef.current, pos[idx], y1);
            lastDissolveRef.current++;
          }
        }

        // Particle update + draw
        tickParticles(particlesRef.current, dt);
        if (particlesRef.current.length > 0) drawParticles(ctx, particlesRef.current);

        // Gold border
        if (a.goldBorder > 0.01) drawGoldBorder(ctx, y1, a.goldBorder);

        ctx.globalAlpha = 1;
      }

      // scriptSig hex cycling (miner mode)
      if (modeRef.current === 'miner') {
        cycleTimerRef.current += dt;
        if (cycleTimerRef.current >= 0.2) {
          cycleTimerRef.current -= 0.2;
          const ss = COINBASE_FIELDS.find(f => f.name === 'scriptSig')!;
          for (let i = ss.start; i < ss.start + ss.length; i++)
            hexRef.current[i] = randomHex();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      gsap.killTweensOf(animRef.current);
      gsap.killTweensOf(animRef.current.fieldReveal);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: CW, height: CH, display: 'block' }}
    />
  );
}
