// EP12 — SHRINCS & SHRIMPS: Hash-Based Post-Quantum Signatures
// Dark navy "quantum forge" palette with teal construction, red cracks, gold payoff.

export const EP_COLORS = {
  bg: '#0A1628',
  bgAlt: '#0F2240',
  accent: '#00E5CC',
  accentAlt: '#7B68EE',
  danger: '#FF3B4F',
  dangerAlt: '#FF6B35',
  gold: '#FFD93D',
  goldDim: '#B8960C',
  highlight: '#FFFFFF',
  muted: '#3A5070',
  text: '#E8F0FE',
  textDim: '#8BA3C4',
  chain: '#A78BFA',
  leaf: '#34D399',
  stateful: '#00E5CC',
  stateless: '#FF6B35',
};

export const EP_SPRINGS = {
  build: { type: 'spring' as const, stiffness: 120, damping: 28 },
  crack: { type: 'spring' as const, stiffness: 600, damping: 12 },
  forge: { type: 'spring' as const, stiffness: 200, damping: 22 },
  reveal: { type: 'spring' as const, stiffness: 80, damping: 10 },
  gauge: { type: 'spring' as const, stiffness: 150, damping: 30 },
  drift: { type: 'spring' as const, stiffness: 20, damping: 40 },
};

export const EP12_CE_THEME = {
  initial: { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.95, filter: 'blur(4px)', y: -10 },
  transition: EP_SPRINGS.build,
};

export const SCENE_DURATIONS = {
  scene1: 6000,
  scene2: 8000,
  scene3: 10000,
  scene4: 8000,
  scene5: 9000,
  scene6: 8000,
  scene7: 9000,
  scene8: 7000,
  scene9: 10000,
  scene10: 8000,
  scene11: 9000,
  scene12: 9000,
  scene13: 7000,
  scene14: 10000,
  scene15: 9000,
  scene16: 10000,
  scene17: 10000,
  scene18: 8000,
  scene19: 7000,
  scene20: 6000,
};

// Scheme accent colors for forge column + gauge bars
export const SCHEME_COLORS: Record<string, string> = {
  lamport: EP_COLORS.accent,
  wots: EP_COLORS.chain,
  xmss: EP_COLORS.leaf,
  sphincs: EP_COLORS.accentAlt,
  shrincs: EP_COLORS.gold,
};

// Column heights (px, proportional to actual byte counts, log-compressed for visual)
export const SCHEME_HEIGHTS: Record<string, number> = {
  lamport: 560,
  wots: 360,
  xmss: 380,
  sphincs: 620,
  shrincs: 120,
};

// Byte counts for size gauge labels
export const SCHEME_BYTES: Record<string, { label: string; bytes: number }> = {
  schnorr: { label: 'Schnorr', bytes: 64 },
  ecdsa: { label: 'ECDSA', bytes: 72 },
  lamport: { label: 'Lamport', bytes: 16000 },
  wots: { label: 'WOTS', bytes: 2500 },
  xmss: { label: 'XMSS', bytes: 2500 },
  sphincs: { label: 'SLH-DSA', bytes: 7856 },
  shrincs: { label: 'SHRINCS', bytes: 324 },
  shrimps: { label: 'SHRIMPS', bytes: 2564 },
  mldsa: { label: 'ML-DSA', bytes: 2420 },
};
