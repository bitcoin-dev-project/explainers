// EP116 — The Great Consensus Cleanup (BIP 54)

export const EP_COLORS = {
  bg: '#0B1120',
  bgAlt: '#131B2E',
  bgConsole: '#0A0F1A',
  bgHighlight: '#080E1A',

  actTimewarp: '#A78BFA',
  actQuadratic: '#F59E0B',
  actMerkle: '#2DD4BF',
  actCoinbase: '#EF4444',

  statusRed: '#F87171',
  statusGreen: '#34D399',
  statusDim: '#374151',

  accent: '#EB5234',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  highlight: '#FDE68A',

  scanLine: 'rgba(45, 212, 191, 0.15)',
  hexStream: 'rgba(167, 139, 250, 0.08)',
};

export const EP_SPRINGS = {
  timewarpSlam: { type: 'spring' as const, stiffness: 600, damping: 15 },
  timewarpDrop: { duration: 0.15, ease: 'easeIn' as const },

  heatmapFill: { duration: 0.05, ease: 'linear' as const },
  heatmapCascade: { stagger: 0.002 },

  merkleMorph: { type: 'spring' as const, stiffness: 80, damping: 30, mass: 1.5 },
  merkleReveal: { duration: 1.2, ease: [0.45, 0, 0.55, 1] as const },

  coinbaseImpact: { duration: 0.08, ease: 'easeOut' as const },
  coinbaseShatter: { type: 'spring' as const, stiffness: 400, damping: 8 },
  coinbaseResolve: { type: 'spring' as const, stiffness: 120, damping: 25 },

  consolePulse: { duration: 1.5, ease: 'easeInOut' as const },
  consoleStatusWipe: { duration: 0.6, ease: 'easeOut' as const },

  enter: { type: 'spring' as const, stiffness: 300, damping: 22 },
  exit: { duration: 0.3, ease: 'easeIn' as const },
};

export const SCENE_DURATIONS = {
  scene1: 7000,
  scene2: 8000,
  scene3: 7000,
  scene4: 9000,
  scene5: 8000,
  scene6: 7000,
  scene7: 8000,
  scene8: 5000,
  scene9: 8000,
  scene10: 10000,
  scene11: 9000,
  scene12: 4000,
  scene13: 8000,
  scene14: 9000,
  scene15: 12000,
  scene16: 8000,
  scene17: 8000,
  scene18: 8000,
  scene19: 8000,
  scene20: 9000,
  scene21: 8000,
  scene22: 9000,
  scene23: 7000,
};

export type BugStatus = 'UNKNOWN' | 'VULNERABLE' | 'ANALYZING' | 'PATCHED';

export interface ConsoleBugRow {
  id: string;
  label: string;
  accentColor: string;
  status: BugStatus;
}

export const BUG_ROWS: ConsoleBugRow[] = [
  { id: 'timewarp', label: 'CVE-TIMEWARP', accentColor: EP_COLORS.actTimewarp, status: 'UNKNOWN' },
  { id: 'quadratic', label: 'CVE-QUADRATIC', accentColor: EP_COLORS.actQuadratic, status: 'UNKNOWN' },
  { id: 'merkle', label: 'CVE-MERKLE-64B', accentColor: EP_COLORS.actMerkle, status: 'UNKNOWN' },
  { id: 'coinbase', label: 'CVE-COINBASE-DUP', accentColor: EP_COLORS.actCoinbase, status: 'UNKNOWN' },
];

export function getBugStatuses(scene: number): BugStatus[] {
  return [
    scene >= 7 ? 'PATCHED' : scene >= 4 ? 'VULNERABLE' : scene >= 1 ? 'VULNERABLE' : 'UNKNOWN',
    scene >= 11 ? 'PATCHED' : scene >= 9 ? 'VULNERABLE' : scene >= 1 ? 'VULNERABLE' : 'UNKNOWN',
    scene >= 17 ? 'PATCHED' : scene >= 13 ? 'VULNERABLE' : scene >= 1 ? 'VULNERABLE' : 'UNKNOWN',
    scene >= 21 ? 'PATCHED' : scene >= 18 ? 'VULNERABLE' : scene >= 1 ? 'VULNERABLE' : 'UNKNOWN',
  ];
}

export function getActiveBugIndex(scene: number): number {
  if (scene >= 18 && scene <= 21) return 3;
  if (scene >= 13 && scene <= 17) return 2;
  if (scene >= 9 && scene <= 11) return 1;
  if (scene >= 4 && scene <= 7) return 0;
  return -1;
}

export function getProgress(scene: number): number {
  const statuses = getBugStatuses(scene);
  return statuses.filter(s => s === 'PATCHED').length / 4;
}

export const CE_THEME = {
  initial: { opacity: 0, x: -20, filter: 'blur(6px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 20, filter: 'blur(4px)' },
  transition: { type: 'spring' as const, stiffness: 300, damping: 22 },
};
