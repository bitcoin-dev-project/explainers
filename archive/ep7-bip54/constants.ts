// EP7: BIP 54 — The Great Consensus Cleanup
// Dark security/documentary palette with attack/fix contrast

export const EP_COLORS = {
  bg: '#0F172A',           // dark navy slate
  bgAlt: '#1E293B',        // lighter slate for panels
  accent: '#EF4444',       // danger red — attacks
  accentAlt: '#F97316',    // warning orange — timestamps
  fix: '#22C55E',          // green — fixes, resolution
  highlight: '#FDE68A',    // gold — key reveals
  muted: '#64748B',        // slate gray
  text: '#F1F5F9',         // near-white
  difficulty: '#3B82F6',   // blue — healthy difficulty
  timestamp: '#A78BFA',    // purple — timestamp tracks
  quadratic: '#F472B6',    // pink — quadratic curve
  amber: '#78350F',        // deep amber — highlight scene bg
};

export const EP_SPRINGS = {
  attack: { type: 'spring' as const, stiffness: 600, damping: 15 },
  collapse: { type: 'spring' as const, stiffness: 400, damping: 12 },
  fix: { type: 'spring' as const, stiffness: 120, damping: 30 },
  enter: { type: 'spring' as const, stiffness: 200, damping: 25 },
  camera: { type: 'spring' as const, stiffness: 50, damping: 22, mass: 1.8 },
  insight: { type: 'spring' as const, stiffness: 60, damping: 35, mass: 2.0 },
};

export const EP7_CE_THEME = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(6px)', x: -8 },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', x: 0 },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)', x: 8 },
  transition: EP_SPRINGS.enter,
};

export const SCENE_DURATIONS = {
  scene0: 7000,
  scene1: 8000,
  scene2: 10000,
  scene3: 9000,
  scene4: 10000,
  scene5: 12000,
  scene6: 9000,
  scene7: 9000,
  scene8: 10000,
  scene9: 8000,
  scene10: 7000,
  scene11: 7000,
  scene12: 11000,
  scene13: 9000,
  scene14: 8000,
};

// Collapse sequence difficulty multipliers per period
export const COLLAPSE_SEQUENCE = [
  { day: 1, label: 'Day 1: difficulty ÷2', factor: 0.5 },
  { day: 5, label: 'Day 5: difficulty ÷10', factor: 0.1 },
  { day: 12, label: 'Day 12: difficulty ÷100', factor: 0.01 },
  { day: 25, label: 'Day 25: difficulty ÷10,000', factor: 0.0001 },
  { day: 38, label: 'Day 38: difficulty = 1', factor: 0.001 },
];
