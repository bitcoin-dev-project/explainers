/**
 * EP8 — Keccak SHA3-256: The Sponge That Solved Length Extension
 *
 * Oceanic palette. Liquid motion. Absorb is the verb.
 * 17 scenes, ~2:35. Revised per director: Act 1 trimmed to 5 scenes,
 * aha merged into one scene, Act 4 = comparison (no tournament bracket).
 */

import { createThemedCE } from '@/lib/video';

// ─── Colors ──────────────────────────────────────────────────────
export const EP_COLORS = {
  bg: '#0A1628',           // deep ocean — primary
  bgAlt: '#0F1B3D',       // secondary panels, act transitions
  rate: '#38BDF8',         // rate zone — sky blue, exposed
  rateGlow: '#7DD3FC',     // rate highlights, particle trails
  capacity: '#1E3A5F',     // capacity zone — deep navy, hidden
  capacityGlow: '#0E2442', // capacity inner glow
  waterline: '#22D3EE',    // bright cyan dividing line
  accent: '#06D6A0',       // seafoam green — permutation action
  danger: '#EF4444',       // attack / vulnerability
  dangerGlow: '#FCA5A5',   // attack particle trails
  highlight: '#FDE68A',    // gold — aha moment, key reveals
  text: '#E2E8F0',         // primary text (light slate)
  muted: '#64748B',        // de-emphasized labels
  orange: '#EB5234',       // BDP brand — CTA only
  pipe: '#94A3B8',         // SHA-256 pipeline metal
  pipeInner: '#CBD5E1',    // data flowing through pipe
};

// ─── Springs — Liquid / Gravitational ────────────────────────────
export const EP_SPRINGS = {
  absorb: { type: 'spring' as const, stiffness: 40, damping: 20, mass: 2 },
  permute: { type: 'spring' as const, stiffness: 150, damping: 12, mass: 0.8 },
  squeeze: { type: 'spring' as const, stiffness: 60, damping: 25, mass: 1.5 },
  reveal: { type: 'spring' as const, stiffness: 80, damping: 30, mass: 1.2 },
  impact: { duration: 0.15, ease: 'power4.out' },
  camera: { type: 'spring' as const, stiffness: 35, damping: 22, mass: 2 },
};

// ─── Scene Durations (17 scenes) ─────────────────────────────────
// Director: Act 1 = 5 scenes (0-4), sponge enters scene 5.
// Aha merged into scene 13. Act 4 = comparison + CTA (14-16).
export const SCENE_DURATIONS = {
  scene0: 7000,   // Title: "Bitcoin hashes everything twice"
  scene1: 8000,   // SHA-256 pipeline builds
  scene2: 8000,   // Data flows through — output = internal state
  scene3: 9000,   // The vulnerability: output IS the state
  scene4: 9000,   // LENGTH EXTENSION ATTACK — pipe extends
  scene5: 9000,   // Sponge tank rises from below
  scene6: 8000,   // Absorb — data streams in
  scene7: 8000,   // Permute — particles churn
  scene8: 8000,   // Squeeze — output rises from rate zone
  scene9: 8000,   // Zoom: rate zone — exposed surface
  scene10: 8000,  // Zoom: capacity zone — hidden depths
  scene11: 8000,  // Waterline — the boundary
  scene12: 9000,  // Why capacity defeats length extension
  scene13: 10000, // HIGHLIGHT: attack bounces + "512 bits" gold text
  scene14: 8000,  // Pull back — SHA-256d pipe vs sponge tank
  scene15: 8000,  // Comparison labels + moral
  scene16: 7000,  // CTA
};

// ─── CE Theme — "Rising from the Depths" ─────────────────────────
export const ECE = createThemedCE({
  initial: { opacity: 0, y: 25, filter: 'blur(8px) brightness(0.4)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)' },
  exit: { opacity: 0, y: -15, filter: 'blur(6px) brightness(0.3)' },
  transition: { type: 'spring', stiffness: 60, damping: 25, mass: 1.5 },
});

// ─── Particle Physics Constants ──────────────────────────────────
export const PARTICLE = {
  count: 100,
  rateGravity: 0.02,
  capacityViscosity: 0.92,
  rateViscosity: 0.97,
  brownianForce: 0.3,
  absorbSpeed: 2.5,
  squeezeSpeed: -1.8,
  permuteForce: 8,
  bounceElasticity: 0.6,
  maxSpeed: 4,
  minRadius: 2,
  maxRadius: 5,
};

// ─── Sponge Dimensions (relative to canvas) ──────────────────────
export const SPONGE = {
  /** Ratio of rate zone height to total tank height */
  rateRatio: 1088 / 1600,  // r / (r + c) = 1088 / 1600 = 0.68
  /** Ratio of capacity zone height */
  capacityRatio: 512 / 1600, // c / (r + c) = 512 / 1600 = 0.32
  tankPadding: 0.08,         // 8% padding inside tank walls
  cornerRadius: 16,
};

// ─── SHA-256 Pipe Data ───────────────────────────────────────────
export const PIPE_BLOCKS = [
  { label: 'M₁', color: EP_COLORS.rate },
  { label: 'M₂', color: EP_COLORS.rate },
  { label: 'M₃', color: EP_COLORS.rate },
  { label: 'M₄', color: EP_COLORS.rate },
];

export const ATTACK_BLOCKS = [
  { label: 'M₅*', color: EP_COLORS.danger },
  { label: 'M₆*', color: EP_COLORS.danger },
];
