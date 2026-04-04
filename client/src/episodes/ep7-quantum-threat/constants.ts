import type { CameraShot, CameraZone } from '@/lib/video/camera';
import { focus, fitRect } from '@/lib/video/camera';
import type { CETheme } from '@/lib/video/canvas';

// ── COLORS ── Three-act palette: Gold → Blue/Red → Green
export const EP_COLORS = {
  bg: '#0B0E17',
  bgAlt: '#111827',
  bgSurface: '#1E293B',

  // Act I — Gold (confidence, elegance)
  gold: '#F59E0B',
  goldBright: '#FBBF24',
  goldDim: '#92400E',
  curve: '#FCD34D',

  // Act II — Blue + Red (danger, quantum power)
  danger: '#EF4444',
  dangerDark: '#991B1B',
  quantum: '#3B82F6',
  quantumBright: '#60A5FA',
  quantumDim: '#1E3A5F',
  warning: '#F97316',

  // Act III — Green (hope, defense)
  safe: '#10B981',
  safeBright: '#34D399',
  safeDim: '#064E3B',

  // Neutrals
  text: '#F1F5F9',
  textDim: '#94A3B8',
  muted: '#64748B',
  border: '#334155',
};

// ── SPRINGS ──
export const EP_SPRINGS = {
  math: { type: 'spring' as const, stiffness: 120, damping: 28 },
  mathSlow: { type: 'spring' as const, stiffness: 80, damping: 30 },
  attack: { type: 'spring' as const, stiffness: 550, damping: 16 },
  attackSnap: { type: 'spring' as const, stiffness: 800, damping: 12 },
  defend: { type: 'spring' as const, stiffness: 200, damping: 22 },
  defendSlow: { type: 'spring' as const, stiffness: 100, damping: 25 },
  camera: { type: 'spring' as const, stiffness: 50, damping: 22, mass: 1.8 },
  impact: { duration: 0.1, ease: 'easeOut' as const },
};

// ── CE THEME — Focus-pull blur effect ──
export const EP7_CE_THEME: CETheme = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(8px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.95, filter: 'blur(4px)', y: -10 },
  transition: { type: 'spring', stiffness: 200, damping: 25 },
};

// ── SCENE DURATIONS (30 scenes, 1-indexed keys) ──
export const SCENE_DURATIONS: Record<string, number> = {
  scene1: 7000,  scene2: 7000,  scene3: 8000,  scene4: 8000,  scene5: 10000,
  scene6: 9000,  scene7: 9000,  scene8: 8000,  scene9: 8000,  scene10: 6000,
  scene11: 8000, scene12: 10000, scene13: 10000, scene14: 9000, scene15: 12000,
  scene16: 9000, scene17: 9000, scene18: 10000, scene19: 10000, scene20: 8000,
  scene21: 8000, scene22: 9000, scene23: 7000, scene24: 9000, scene25: 10000,
  scene26: 9000, scene27: 10000, scene28: 9000, scene29: 8000, scene30: 8000,
};

// ── CAMERA ZONES ──
export const ZONES: CameraZone[] = [
  { label: 'A', x: 5, y: 5, w: 110, h: 85, color: EP_COLORS.gold },
  { label: 'B', x: 160, y: 5, w: 135, h: 80, color: EP_COLORS.quantum },
  { label: 'C', x: 75, y: 200, w: 160, h: 85, color: EP_COLORS.danger },
  { label: 'D', x: 5, y: 400, w: 120, h: 70, color: EP_COLORS.warning },
  { label: 'E', x: 160, y: 400, w: 140, h: 70, color: EP_COLORS.safe },
];

// ── CAMERA SHOTS (0-indexed scene keys) ──
export const CAMERA_SHOTS: Record<number, CameraShot> = {
  // Act I — Scenes 0-9 (Zone A: 5,5 → 115,90)
  0:  focus(60, 45, 1.0),
  1:  focus(50, 45, 1.3),
  2:  focus(55, 45, 1.6),
  3:  focus(55, 40, 1.6),
  4:  focus(55, 45, 1.6),
  5:  focus(55, 45, 1.5),
  6:  focus(60, 45, 1.5),
  7:  focus(55, 45, 1.5),
  8:  focus(80, 40, 1.3),
  9:  focus(80, 45, 1.2),
  // Act II — Scenes 10-21
  10: focus(210, 30, 1.0),    // Classical vs Quantum at 165,10
  11: focus(215, 32, 0.9),
  12: focus(215, 42, 1.1),    // ResourceChart at 185,35
  13: focus(220, 45, 1.1),
  14: focus(115, 228, 1.3),   // ★ Drop to Zone C — RaceCanvas at 80,205
  15: focus(110, 232, 1.4),   // P2PK boxes at 80,215
  16: focus(120, 240, 1.3),   // SupplyChart at 100,230
  17: focus(155, 230, 1.3),   // VaultGrid at 135,215
  18: focus(158, 232, 1.4),   // ★ Stay on VaultGrid for Taproot twist
  19: focus(40, 422, 1.3),    // ★ Drop to Zone D — content at ~10,410
  20: focus(50, 425, 1.2),
  21: focus(65, 428, 1.0),
  // Act III — Scenes 22-29
  22: focus(150, 400, 0.6),   // ★ Pull way back
  23: focus(185, 420, 1.4),   // ShieldStack at 165,410
  24: focus(188, 423, 1.4),
  25: focus(192, 425, 1.3),
  26: focus(215, 440, 1.4),   // DormantCoins at 200,430
  27: focus(218, 440, 1.3),
  28: focus(248, 432, 1.4),   // ZK pipeline at 230,422
  29: fitRect(0, 0, 400, 550, { pad: 5 }), // ★ Final reveal
};

// ── CURVE MATH ──
export type CurveMode = 'IDLE' | 'DRAW' | 'POINT_ADD' | 'MULTIPLY' | 'TRAPDOOR' | 'QUANTUM_FLOOD' | 'SHATTER' | 'LATTICE';

export function curveYPositive(x: number): number | null {
  const val = x * x * x + 7;
  return val >= 0 ? Math.sqrt(val) : null;
}

// Math viewport for CurveCanvas
export const CV = { xMin: -2, xMax: 4, yMin: -5, yMax: 5 };

// Pre-computed points on y² = x³ + 7
export const CURVE_POINTS = [
  { x: -1.5, y: 1.904, label: 'G' },
  { x: 1.0, y: 2.828, label: 'P₂' },
  { x: 0.637, y: -2.694, label: 'P₃' },
  { x: 2.0, y: 3.873, label: '2G' },
  { x: 2.5, y: 4.213, label: 'P' },
];

// ── CHART DATA ──
export const RESOURCE_DATA = [
  { author: "Proos '04", qubits: 1500, gates: 4.6e9 },
  { author: "Roetteler '17", qubits: 2300, gates: 5e10 },
  { author: "Häner '20", qubits: 2100, gates: 5e9 },
  { author: "Gouzien '23", qubits: 2000, gates: 1.3e8 },
  { author: "Litinski '23", qubits: 3000, gates: 2e8 },
  { author: "This Work ★", qubits: 1200, gates: 9e7, isThisWork: true as const },
  { author: "This Work ★", qubits: 1450, gates: 7e7, isThisWork: true as const },
];

export const RSA_TREND = [
  { year: 2012, qubits: 1e9 },
  { year: 2015, qubits: 2.3e8 },
  { year: 2017, qubits: 1.7e8 },
  { year: 2019, qubits: 2e7 },
  { year: 2021, qubits: 1.3e7 },
  { year: 2023, qubits: 4e6 },
  { year: 2025, qubits: 1e6 },
];

export const VULN_DATA = [
  { type: 'P2PK', exposure: 'On-chain + mempool', prefix: '04...', atRest: true, onSpend: true, btc: '1.7M' },
  { type: 'P2PKH', exposure: 'Mempool only', prefix: '1...', atRest: false, onSpend: true, btc: '—' },
  { type: 'P2MS', exposure: 'On-chain + mempool', prefix: 'n/a', atRest: true, onSpend: true, btc: '0.1M' },
  { type: 'P2SH', exposure: 'Mempool only', prefix: '3...', atRest: false, onSpend: true, btc: '—' },
  { type: 'P2WPKH', exposure: 'Mempool only', prefix: 'bc1q...', atRest: false, onSpend: true, btc: '—' },
  { type: 'P2WSH', exposure: 'Mempool only', prefix: 'bc1q...', atRest: false, onSpend: true, btc: '—' },
  { type: 'P2TR', exposure: '???', prefix: 'bc1p...', atRest: true, onSpend: true, btc: '2.8M', isTwist: true as const },
  { type: 'P2MR', exposure: 'Mitigation', prefix: 'bc1...', atRest: false, onSpend: false, btc: '—', proposed: true as const },
];
