// Episode 133 — Google's Quantum Threat to Bitcoin

export const EP_COLORS = {
  // Grayscale foundation
  bg: '#0a0a0f',
  bgAlt: '#141418',
  bgPanel: '#1c1c22',
  surface: '#2a2a32',

  // Text hierarchy
  text: '#e8e8ec',
  textMuted: '#888892',
  textDim: '#555560',

  // Structural grays
  line: '#333340',
  lineBright: '#555568',
  fill: '#3a3a48',
  fillAlt: '#4a4a58',

  // Single accent — Signal Red
  accent: '#ff2d2d',
  accentDim: '#991a1a',
  accentGlow: 'rgba(255, 45, 45, 0.15)',
  accentBright: '#ff6b6b',

  // Semantic
  safe: '#666672',
  vulnerable: '#ff2d2d',
  dormant: '#444450',
};

export const EP_SPRINGS = {
  // Act 1: Mathematical precision
  mathEnter: { type: 'spring' as const, stiffness: 120, damping: 28 },
  mathMorph: { type: 'spring' as const, stiffness: 80, damping: 35 },

  // Act 2: Threat escalation
  threatSnap: { type: 'spring' as const, stiffness: 600, damping: 18 },
  threatPulse: { type: 'spring' as const, stiffness: 400, damping: 12 },
  threatMorph: { duration: 0.15, ease: 'easeOut' as const },

  // Act 3: Response & resolution
  resolveEnter: { type: 'spring' as const, stiffness: 100, damping: 30 },
  resolveSettle: { type: 'spring' as const, stiffness: 60, damping: 40 },

  // Cross-act utilities
  dataReveal: { type: 'spring' as const, stiffness: 200, damping: 25 },
  countUp: { duration: 0.8, ease: 'easeOut' as const },
  panelSlide: { type: 'spring' as const, stiffness: 250, damping: 22 },
};

export const EP_CE_THEME = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  transition: { type: 'spring' as const, stiffness: 120, damping: 28 },
};

export const SCENE_DURATIONS = {
  scene1: 8000,
  scene2: 7000,
  scene3: 7000,
  scene4: 7000,
  scene5: 8000,
  scene6: 10000,
  scene7: 9000,
  scene8: 10000,
  scene9: 8000,
  scene10: 8000,
  scene11: 6000,
  scene12: 8000,
  scene13: 10000,
  scene14: 10000,
  scene15: 9000,
  scene16: 6000,
  scene17: 11000,
  scene18: 10000,
  scene19: 9000,
  scene20: 10000,
  scene21: 7000,
  scene22: 10000,
  scene23: 9000,
  scene24: 8000,
  scene25: 6000,
  scene26: 9000,
  scene27: 9000,
  scene28: 8000,
  scene29: 8000,
  scene30: 11000,
  scene31: 9000,
  scene32: 8000,
  scene33: 6000,
};

// Finite field points for y² ≡ x³ + 7 (mod 97)
// Pre-computed valid points on the curve
export function computeFiniteFieldPoints(): Array<{ x: number; y: number }> {
  const p = 97;
  const points: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < p; x++) {
    const rhs = (x * x * x + 7) % p;
    for (let y = 0; y < p; y++) {
      if ((y * y) % p === rhs) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

// Resource chart data points (Fig 1 from the paper)
export const RESOURCE_DATA = [
  { year: 2004, label: "Proos+Zalka '04", qubits: 6000, gates: 2e12 },
  { year: 2017, label: "Roetteler+ '17", qubits: 2330, gates: 1.26e11 },
  { year: 2020, label: "Häner+ '20", qubits: 2048, gates: 3e10 },
  { year: 2023, label: "Gouzien+ '23", qubits: 2048, gates: 1.6e10 },
  { year: 2023.5, label: "Litinski '23", qubits: 1536, gates: 6.4e9 },
  { year: 2026, label: "This Work '26", qubits: 1200, gates: 9e7 },
];

// Resource trend data (physical qubits over time for breaking crypto)
export const RESOURCE_TREND_DATA = [
  { year: 2012, qubits: 1e9 },
  { year: 2015, qubits: 3e8 },
  { year: 2017, qubits: 2e8 },
  { year: 2019, qubits: 5e7 },
  { year: 2021, qubits: 2e7 },
  { year: 2024, qubits: 4e6 },
  { year: 2025, qubits: 1e6 },
];
