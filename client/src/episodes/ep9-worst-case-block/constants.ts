/**
 * EP9 — Worst-Case Block Validation ("The Meltdown")
 *
 * Deep navy surveillance aesthetic. Computational heat as the visual language.
 * Act 1: clinical blue. Act 2: red-shifted danger. Act 3: emerald relief.
 */

import { createThemedCE, type CETheme } from '@/lib/video/canvas';

// ─── Color Palette ─────────────────────────────────────────────────

export const EP_COLORS = {
  // Base
  bg: '#0A1628',
  bgGradient: '#0F2847',
  surface: '#132040',

  // Temperature ramp (heatmap language)
  cool: '#2563EB',
  warm: '#06B6D4',
  hot: '#F59E0B',
  critical: '#EF4444',
  meltdown: '#FDE68A',

  // Semantic
  accent: '#EB5234',
  fix: '#10B981',
  fixGlow: '#34D399',

  // Text
  text: '#E2E8F0',
  textMuted: '#64748B',
  textBright: '#F8FAFC',

  // Atmospheric
  scanline: 'rgba(255,255,255,0.03)',
  dangerGlow: 'rgba(239,68,68,0.15)',
  safeGlow: 'rgba(16,185,129,0.12)',
} as const;

// ─── Motion Personality ────────────────────────────────────────────

export const EP_SPRINGS = {
  // Act 1: Methodical precision
  precise: { type: 'spring' as const, stiffness: 200, damping: 30 },
  // Act 2: Aggressive urgency
  urgent: { type: 'spring' as const, stiffness: 600, damping: 12 },
  impact: { duration: 0.08, ease: 'easeOut' as const },
  // Act 3: Controlled authority
  resolve: { type: 'spring' as const, stiffness: 150, damping: 25 },
  // Camera: slow cinematic drift
  camera: { type: 'spring' as const, stiffness: 40, damping: 22, mass: 2 },
  // BIP 54 cap slam
  capDrop: { type: 'spring' as const, stiffness: 400, damping: 18, mass: 1.5 },
} as const;

// ─── Heatmap Color Ramp ────────────────────────────────────────────
// HSL-based interpolation: deep blue → cyan → amber → red → white-hot

export function heatColor(t: number): string {
  // t: 0 (cool) → 1 (meltdown)
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.25) {
    // Deep blue → cyan
    const p = clamped / 0.25;
    const h = 220 - p * 40; // 220 → 180
    const s = 80 + p * 10;  // 80 → 90
    const l = 20 + p * 20;  // 20 → 40
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (clamped < 0.5) {
    // Cyan → amber
    const p = (clamped - 0.25) / 0.25;
    const h = 180 - p * 140; // 180 → 40
    const s = 90 + p * 10;   // 90 → 100
    const l = 40 + p * 25;   // 40 → 65
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (clamped < 0.75) {
    // Amber → red
    const p = (clamped - 0.5) / 0.25;
    const h = 40 - p * 40;   // 40 → 0
    const s = 100;
    const l = 65 - p * 15;   // 65 → 50
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  // Red → white-hot
  const p = (clamped - 0.75) / 0.25;
  const h = 0 + p * 40;    // 0 → 40 (shift to gold)
  const s = 100 - p * 20;  // 100 → 80
  const l = 50 + p * 40;   // 50 → 90
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// ─── CE Theme: Glitch-in (chromatic aberration) ────────────────────

export const EP_CE_THEME: CETheme = {
  initial: {
    opacity: 0,
    filter: 'blur(8px)',
    textShadow: '-3px 0 #EF4444, 3px 0 #2563EB',
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    textShadow: '0 0 transparent, 0 0 transparent',
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.95,
  },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const ECE = createThemedCE(EP_CE_THEME);

// ─── Heatmap Grid Config ───────────────────────────────────────────

export const GRID = {
  cols: 80,
  rows: 45,
  cellSize: 10,
  gap: 1,
  get totalCells() { return this.cols * this.rows; },
  get width() { return this.cols * (this.cellSize + this.gap); },
  get height() { return this.rows * (this.cellSize + this.gap); },
} as const;

// ─── Scene Durations (ms) ──────────────────────────────────────────
// Director merged some scenes: 15 scenes total after merges

export const SCENE_DURATIONS = {
  scene0: 7000,   // Title
  scene1: 8000,   // Block arrives
  scene2: 9000,   // Sig checks + sighashing (merged per director)
  scene3: 8000,   // Normal heatmap — 100ms
  scene4: 8000,   // "What if..." transition to Zone B
  scene5: 10000,  // Quadratic heatmap EXPLODES (HIGHLIGHT)
  scene6: 9000,   // Full meltdown + numbers overlay
  scene7: 9000,   // Miner race intro
  scene8: 8000,   // Miner squeeze
  scene9: 8000,   // BIP 54 intro + SegWit context (merged per director)
  scene10: 9000,  // Cap line SLAMS on heatmap
  scene11: 8000,  // Before/After numbers
  scene12: 8000,  // Miner race equalized
  scene13: 7000,  // CTA
};
