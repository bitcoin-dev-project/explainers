/**
 * Episode 10: BIP 54 — The 4 Bugs Bitcoin Never Fixed
 *
 * Visual identity: Diagnostic console / CRT war room aesthetic.
 * Deep navy background, cyan scan lines, red→amber→green severity progression.
 */

import { createThemedCE, type CETheme } from '@/lib/video/canvas';

// ─── Color Palette ───────────────────────────────────────────────

export const EP_COLORS = {
  /** Deep navy — the void, dormant system */
  bg: '#0B1426',
  /** Console steel — panel borders, grid lines */
  steel: '#1A2D4A',
  /** Lighter steel for panel backgrounds */
  panelBg: '#0F1D35',
  /** Scan cyan — active indicators, data flow */
  cyan: '#38BDF8',
  /** Danger red — bug severity, alerts */
  red: '#EF4444',
  /** Amber alert — twist moment, new discovery */
  amber: '#FBBF24',
  /** Success green — resolution, fixed status */
  green: '#10B981',
  /** BDP Orange — CTA, brand accent (sparingly) */
  orange: '#EB5234',
  /** Primary text */
  text: '#E2E8F0',
  /** Secondary/muted text */
  muted: '#64748B',
  /** Dim text for dormant labels */
  dim: '#334155',
} as const;

// ─── Spring Configs ─────────────────────────────────────────────

export const EP_SPRINGS = {
  /** Mechanical diagnostic movements — precise, no overshoot */
  diagnostic: { type: 'spring' as const, stiffness: 300, damping: 28 },
  /** Camera pans — slow, cinematic, weighty */
  camera: { type: 'spring' as const, stiffness: 50, damping: 22, mass: 1.8 },
  /** Alert/alarm moments — sharp snap with ring */
  alert: { type: 'spring' as const, stiffness: 800, damping: 12 },
  /** Slow reveals for timeline nodes */
  reveal: { type: 'spring' as const, stiffness: 100, damping: 25 },
  /** Instant for glitch frames */
  glitch: { duration: 0.05, ease: 'easeOut' as const },
  /** Resolution — satisfying settle */
  resolve: { type: 'spring' as const, stiffness: 200, damping: 20 },
} as const;

// ─── Custom CE Theme — diagnostic text ──────────────────────────

export const diagnosticTextTheme: CETheme = {
  initial: { opacity: 0, x: -12, skewX: -3, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, skewX: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 8, skewX: 2 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

/** Episode-themed CE — diagnostic glitch-in text */
export const ECE = createThemedCE(diagnosticTextTheme);

// ─── Bug Data ───────────────────────────────────────────────────

export type BugId = 'timewarp' | 'validation' | 'merkle64' | 'coinbase';
export type BugStatus = 'dormant' | 'scanning' | 'diagnosed' | 'fixed';

export interface BugData {
  id: BugId;
  label: string;
  severity: string;
  /** Short description shown during scan */
  tagline: string;
  /** Real data value to display */
  dataValue: string;
  /** Color accent for this bug's mini-animation */
  accent: string;
}

export const BUGS: BugData[] = [
  {
    id: 'timewarp',
    label: 'TIMEWARP ATTACK',
    severity: 'CRITICAL',
    tagline: 'Difficulty reduced to zero in 38 days',
    dataValue: '2016 blocks',
    accent: EP_COLORS.red,
  },
  {
    id: 'validation',
    label: 'BLOCK VALIDATION DoS',
    severity: 'HIGH',
    tagline: 'One block stalls a node for 1.5 hours',
    dataValue: '1.5 hrs → 10s',
    accent: EP_COLORS.amber,
  },
  {
    id: 'merkle64',
    label: 'MERKLE AMBIGUITY',
    severity: 'HIGH',
    tagline: 'Transaction fakes a Merkle node',
    dataValue: '64 bytes',
    accent: EP_COLORS.cyan,
  },
  {
    id: 'coinbase',
    label: 'COINBASE COLLISION',
    severity: 'MEDIUM',
    tagline: 'Duplicate TXIDs at block 1,983,702',
    dataValue: 'Block 1,983,702',
    accent: EP_COLORS.amber,
  },
];

// ─── Scene Durations ────────────────────────────────────────────
// Director's revision: merged heartbeat stutter into boot, cut scene 10.
// 14 scenes, ~107s runtime.

export const SCENE_DURATIONS: Record<string, number> = {
  scene1: 7000,   // Title + console boot
  scene2: 8000,   // Scan begins, heartbeat stutters
  scene3: 8000,   // Bug #1: Timewarp zoom
  scene4: 8000,   // Bug #2: Validation zoom
  scene5: 8000,   // Bug #3: 64-byte TX zoom
  scene6: 8000,   // Bug #4: Coinbase zoom
  scene7: 7000,   // Pull back — all 4 red
  scene8: 9000,   // Console → timeline transition, 2019 node
  scene9: 10000,  // Stall + flatline + revival (merged 9+10)
  scene10: 9000,  // TWIST: snap back to timewarp, glitch
  scene11: 10000, // HIGHLIGHT: quadrant splits, new variant
  scene12: 8000,  // All green — resolution
  scene13: 7000,  // CTA — wide shot
};

// ─── Camera Shots ───────────────────────────────────────────────
//
// POSITION MATH — quadrant positions on canvas at 1920x1080:
//   Console: absolute (5vw, 5vh), size 90vw × 90vh
//   Grid: starts at (7vw, 10vh), size 86vw × 80vh, gap 1.5vh ≈ 0.84vw
//   Column width: (86vw − 0.84vw) / 2 ≈ 42.6vw
//   Row height: (80vh − 1.5vh) / 2 ≈ 39.25vh
//
//   TL quadrant: canvas (7vw, 10vh),    center (28.3vw, 29.6vh)
//   TR quadrant: canvas (50.4vw, 10vh), center (71.7vw, 29.6vh)
//   BL quadrant: canvas (7vw, 50.8vh),  center (28.3vw, 70.4vh)
//   BR quadrant: canvas (50.4vw, 50.8vh), center (71.7vw, 70.4vh)
//
// Formula: camera_offset = screen_target − canvas_center × scale
// To center a quadrant at screen (50vw, 50vh):
//   camera_x = 50 − cx × scale
//   camera_y = 50 − cy × scale

export const CAMERA_SHOTS: Record<number, { x: string | number; y: string | number; scale: number }> = {
  // Scene 0 (title): Zone A — full console
  0: { x: 0, y: 0, scale: 1 },
  // Scene 1 (boot/scan): Zone A — same
  1: { x: 0, y: 0, scale: 1 },
  // Scene 2 (bug1): TL quadrant centered → 50 − 28.3×2.2 = −12.3, 50 − 29.6×2.2 = −15.1
  2: { x: '-12vw', y: '-15vh', scale: 2.2 },
  // Scene 3 (bug2): TR quadrant centered → 50 − 71.7×2.2 = −107.7, same y
  3: { x: '-108vw', y: '-15vh', scale: 2.2 },
  // Scene 4 (bug3): BL quadrant centered → same x as TL, 50 − 70.4×2.2 = −104.9
  4: { x: '-12vw', y: '-105vh', scale: 2.2 },
  // Scene 5 (bug4): BR quadrant centered → same x as TR, same y as BL
  5: { x: '-108vw', y: '-105vh', scale: 2.2 },
  // Scene 6 (all red): pull back to full console
  6: { x: 0, y: 0, scale: 1 },
  // Scene 7 (wide shot): both zones visible at 0.55
  //   Console center (50,50)→screen(27.5, 49.5) ✓  Timeline start (105)→screen(57.8) ✓
  //   Content centered vertically: 50 − 50×0.55 = 22.5
  7: { x: 0, y: '22vh', scale: 0.55 },
  // Scene 8 (timeline focus): Zone B at scale 0.7
  //   2009 (115vw)→screen(6.5) ✓  2019 (175vw)→screen(48.5) ✓  2025 (240vw)→screen(94) ✓
  //   camera_x = 50 − 177×0.7 = −73.9, camera_y = 50 − 50×0.7 = 15
  8: { x: '-74vw', y: '15vh', scale: 0.7 },
  // Scene 9 (twist): TL tight at 2.8 → 50 − 28.3×2.8 = −29.2, 50 − 29.6×2.8 = −32.9
  //   Intentional heavy clip for dramatic tight zoom
  9: { x: '-29vw', y: '-33vh', scale: 2.8 },
  // Scene 10 (highlight): TL at 2.2 — same as scene 2
  10: { x: '-12vw', y: '-15vh', scale: 2.2 },
  // Scene 11 (resolution): full console
  11: { x: 0, y: 0, scale: 1 },
  // Scene 12 (CTA): extra-wide shot showing green console + FULL completed timeline
  //   At scale 0.4: viewport shows 250vw of canvas
  //   Console left (5vw): 5×0.4 - 3 = -1vw (1vw clip, negligible)
  //   Console right (95vw): 95×0.4 - 3 = 35vw ✓
  //   Timeline 2025 (240vw): 240×0.4 - 3 = 93vw ✓
  //   Vertical: 50×0.4 + 30 = 50vh (centered) ✓
  12: { x: '-3vw', y: '30vh', scale: 0.4 },
};

// ─── Timeline Events ────────────────────────────────────────────

export interface TimelineEvent {
  year: number;
  label: string;
  sublabel?: string;
  color: string;
  /** x position on the timeline (vw) */
  x: number;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { year: 2009, label: 'Genesis', sublabel: 'Bugs born', color: EP_COLORS.muted, x: 115 },
  { year: 2017, label: 'CVE-2017-12842', sublabel: 'Merkle attack documented', color: EP_COLORS.red, x: 145 },
  { year: 2019, label: 'Matt Corallo', sublabel: 'Proposes BIP 54', color: EP_COLORS.cyan, x: 175 },
  { year: 2024, label: 'Antoine Poinsot', sublabel: 'Revives proposal', color: EP_COLORS.amber, x: 220 },
  { year: 2025, label: 'BIP 54', sublabel: 'Consensus cleanup', color: EP_COLORS.green, x: 240 },
];
