// EP112 — Duplicate Coinbase Transactions: Constants

export const EP_COLORS = {
  bg: '#080C18',
  bgAlt: '#0F1629',
  bgPanel: '#151D33',
  bgWarm: '#0D1520',
  accent: '#F59E0B',
  accentAlt: '#14B8A6',
  danger: '#EF4444',
  dangerGlow: '#7F1D1D',
  success: '#10B981',
  highlight: '#FDE68A',
  muted: '#475569',
  text: '#E2E8F0',
  textDim: '#94A3B8',
  byte: '#1E293B',
  byteHot: '#F59E0B',
  fieldVersion: '#6366F1',
  fieldInput: '#8B5CF6',
  fieldScriptSig: '#F97316',
  fieldSequence: '#64748B',
  fieldOutput: '#14B8A6',
  fieldLockTime: '#FDE68A',
};

export const EP_SPRINGS = {
  reveal: { type: 'spring' as const, stiffness: 120, damping: 28 },
  snap: { type: 'spring' as const, stiffness: 500, damping: 22 },
  destroy: { duration: 0.15, ease: 'easeIn' as const },
  sweep: { duration: 2.0, ease: [0.645, 0.045, 0.355, 1] as const },
  aha: { type: 'spring' as const, stiffness: 200, damping: 12 },
  float: { type: 'spring' as const, stiffness: 30, damping: 15 },
};

export const SCENE_DURATIONS = {
  scene0: 6000,   // Title card
  scene1: 7000,   // What's a coinbase?
  scene2: 8000,   // Byte strip anatomy
  scene3: 7000,   // Miner controls everything
  scene4: 9000,   // Two identical strips
  scene5: 10000,  // The overwrite — 100 BTC destroyed
  scene6: 7000,   // Aftermath
  scene7: 6000,   // BIP-30 band-aid
  scene8: 8000,   // BIP-34 height in scriptSig
  scene9: 6000,   // False confidence
  scene10: 8000,  // Timeline enters
  scene11: 10000, // ★ The 2046 time bomb
  scene12: 7000,  // The wrong field
  scene13: 9000,  // FieldContrast — chaos vs calm
  scene14: 8000,  // BIP-54 rule
  scene15: 9000,  // Proof — column of zeros
  scene16: 8000,  // ★ Hiding in plain sight (AHA)
  scene17: 7000,  // Three fixes summary
  scene18: 6000,  // CTA
};

export const EP112_CE_THEME = {
  initial: { opacity: 0, y: -8, filter: 'blur(6px) brightness(1.5)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)' },
  exit: { opacity: 0, y: 8, filter: 'blur(4px) brightness(0.5)' },
  transition: { type: 'spring' as const, stiffness: 180, damping: 24 },
};

// ---------- Coinbase byte layout ----------

export interface CoinbaseField {
  name: string;
  label: string;
  start: number;
  length: number;
  color: string;
}

export const COINBASE_FIELDS: CoinbaseField[] = [
  { name: 'version',      label: 'VERSION',              start: 0,  length: 4,  color: EP_COLORS.fieldVersion },
  { name: 'inputCount',   label: '',                     start: 4,  length: 1,  color: EP_COLORS.fieldInput },
  { name: 'prevout',      label: 'INPUT (null prevout)', start: 5,  length: 36, color: EP_COLORS.fieldInput },
  { name: 'scriptSigLen', label: '',                     start: 41, length: 1,  color: EP_COLORS.fieldScriptSig },
  { name: 'scriptSig',    label: 'SCRIPTSIG',            start: 42, length: 18, color: EP_COLORS.fieldScriptSig },
  { name: 'sequence',     label: 'SEQ',                  start: 60, length: 4,  color: EP_COLORS.fieldSequence },
  { name: 'outputCount',  label: '',                     start: 64, length: 1,  color: EP_COLORS.fieldOutput },
  { name: 'value',        label: 'OUTPUTS',              start: 65, length: 8,  color: EP_COLORS.fieldOutput },
  { name: 'pubkeyLen',    label: '',                     start: 73, length: 1,  color: EP_COLORS.fieldOutput },
  { name: 'scriptPubKey', label: '',                     start: 74, length: 7,  color: EP_COLORS.fieldOutput },
  { name: 'nLockTime',    label: 'nLockTime',            start: 81, length: 4,  color: EP_COLORS.fieldLockTime },
];

export const TOTAL_BYTES = 85;

// Realistic hex values for the coinbase of block 91,722
export const COINBASE_HEX: string[] = [
  // version (4 bytes)
  '01', '00', '00', '00',
  // inputCount (1 byte)
  '01',
  // prevout hash — 32 zeros (coinbase marker)
  '00', '00', '00', '00', '00', '00', '00', '00',
  '00', '00', '00', '00', '00', '00', '00', '00',
  '00', '00', '00', '00', '00', '00', '00', '00',
  '00', '00', '00', '00', '00', '00', '00', '00',
  // prevout index — FFFFFFFF
  'FF', 'FF', 'FF', 'FF',
  // scriptSigLen
  '12',
  // scriptSig (18 bytes — miner-controlled)
  'FF', 'FF', '00', '1D', '01', '04', '45', '54',
  '68', '65', '20', '54', '69', '6D', '65', '73',
  '20', '30',
  // sequence
  'FF', 'FF', 'FF', 'FF',
  // outputCount
  '01',
  // value — 50 BTC (5,000,000,000 satoshi LE)
  '00', 'F2', '05', '2A', '01', '00', '00', '00',
  // scriptPubKeyLen
  '43',
  // scriptPubKey (7 bytes, condensed)
  '41', '04', '96', 'B5', '38', 'E8', '53',
  // nLockTime — always zero
  '00', '00', '00', '00',
];

// BIP-54 worked example: nLockTime = 799,999 (height 800,000 − 1) little-endian
export const BIP54_LOCKTIME_HEX = ['FF', '34', '0C', '00'];

// Block 164,384 scriptSig bytes that accidentally encode height 1,983,702
export const BLOCK_164384_HEX = ['04', '96', '1B', '1E'];

// Display TXID (truncated)
export const EXAMPLE_TXID = 'd5ef7e02f89c...a31c';

// Pre-built field-index lookup
export const BYTE_TO_FIELD: number[] = (() => {
  const map: number[] = [];
  for (let i = 0; i < TOTAL_BYTES; i++) {
    for (let fi = 0; fi < COINBASE_FIELDS.length; fi++) {
      const f = COINBASE_FIELDS[fi];
      if (i >= f.start && i < f.start + f.length) {
        map[i] = fi;
        break;
      }
    }
  }
  return map;
})();
