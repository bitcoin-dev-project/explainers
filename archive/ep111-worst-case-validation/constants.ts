export const EP_COLORS = {
  bg: '#0B0E17',
  bgAlt: '#131829',
  bgCrisis: '#0D0208',
  surface: '#1A1F35',

  cellIdle: '#1E2A4A',
  cellCool: '#2E86DE',
  cellWarm: '#F6AD55',
  cellHot: '#E53E3E',
  cellCritical: '#FF6B6B',
  cellWhiteHot: '#FFF5F5',

  accent: '#EB5234',
  fix: '#38D9A9',
  fixAlt: '#20C997',
  segwit: '#748FFC',
  capLine: '#00FF88',

  text: '#E2E8F0',
  textMuted: '#64748B',
  textEmphasis: '#FFF',

  cursor: '#00D4FF',
  stall: '#FF4444',
};

export const EP_SPRINGS = {
  enter: { type: 'spring' as const, stiffness: 300, damping: 28 },
  escalate: { type: 'spring' as const, stiffness: 500, damping: 15 },
  capSlam: { duration: 0.12, ease: 'easeOut' as const },
  resolve: { type: 'spring' as const, stiffness: 80, damping: 35 },
  text: { type: 'spring' as const, stiffness: 400, damping: 30 },
  counter: { type: 'spring' as const, stiffness: 600, damping: 20 },
};

export const SCENE_DURATIONS = {
  scene0: 7000,
  scene1: 8000,
  scene2: 9000,
  scene3: 8000,
  scene4: 10000,
  scene5: 12000,
  scene6: 10000,
  scene7: 9000,
  scene8: 10000,
  scene9: 8000,
  scene10: 10000,
  scene11: 8000,
  scene12: 8000,
  scene13: 10000,
  scene14: 8000,
  scene15: 7000,
  scene16: 9000,
  scene17: 7000,
};
