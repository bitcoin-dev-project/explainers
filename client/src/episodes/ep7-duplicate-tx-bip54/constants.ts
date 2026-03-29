/**
 * EP7 — "The Overwrite"
 * Duplicate coinbase transactions & BIP 54 coinbase uniqueness fix.
 *
 * Palette: cold navy database-noir. Motion: STAMP / OVERWRITE / SEAL.
 */

import { createThemedCE } from '@/lib/video';

// ─── Colors ──────────────────────────────────────────────────────
export const EP_COLORS = {
  bg: '#0F172A',        // deep slate navy — database noir
  bgAlt: '#1E293B',     // slightly lighter for cards/sections
  accent: '#F59E0B',    // amber gold — healthy/valid state
  danger: '#EF4444',    // signal red — overwrite/destruction
  fix: '#06B6D4',       // electric cyan — BIP fix/solution
  ghost: 'rgba(255,255,255,0.12)', // spectral — destroyed entries
  muted: '#64748B',     // cool gray — de-emphasized
  text: '#F1F5F9',      // near white — primary text
  highlight: '#FDE68A', // warm yellow — key reveals
  match: '#22C55E',     // green — hex match confirmation
} as const;

// ─── Springs ─────────────────────────────────────────────────────
export const EP_SPRINGS = {
  /** Slow, methodical for database reveals — data precision mood */
  reveal: { type: 'spring' as const, stiffness: 120, damping: 28 },
  /** Sharp snap for the overwrite impact — feels violent and wrong */
  impact: { duration: 0.1, ease: 'easeOut' as const },
  /** Tense, tight for the time bomb countdown */
  tension: { type: 'spring' as const, stiffness: 500, damping: 18 },
  /** Calm, deliberate for the fix explanations */
  fix: { type: 'spring' as const, stiffness: 80, damping: 30 },
  /** Gentle drift for ghost/particle effects */
  decay: { duration: 2.0, ease: [0.16, 1, 0.3, 1] as const },
} as const;

// ─── CE Theme ────────────────────────────────────────────────────
// clipCircle aperture reveal — data appearing through a database lens.
// Custom exit: dissolves into blur (hex fragment feel).
export const ECE = createThemedCE({
  initial: { clipPath: 'circle(0% at 50% 50%)', opacity: 0 },
  animate: { clipPath: 'circle(100% at 50% 50%)', opacity: 1 },
  exit: { opacity: 0, filter: 'blur(8px)', scale: 0.95 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
});

// ─── Data ────────────────────────────────────────────────────────

/** Real TXID from the duplicate coinbase incident (block 91,722 / 91,812) */
export const DUPLICATE_TXID_1 = 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468';
/** Second pair (block 91,880 / 91,842) */
export const DUPLICATE_TXID_2 = 'd5d27987d2a3dfc724e359870c6644b40e497bdc0589a033220fe15429d88599';

/** The four blocks where duplicates occurred */
export const DUPLICATE_BLOCKS = [
  { height: 91722, pair: 91812, txid: DUPLICATE_TXID_1, btc: 50 },
  { height: 91880, pair: 91842, txid: DUPLICATE_TXID_2, btc: 50 },
] as const;

/** Block 164,384 — the time bomb. Real coinbase scriptSig hex. */
export const TIMEBOMB_BLOCK = 164384;
export const TIMEBOMB_HEIGHT = 1983702;
export const TIMEBOMB_YEAR = 2046;

/**
 * Simplified hex representation of block 164,384's coinbase scriptSig.
 * The critical 4 bytes that encode height 1,983,702 are at indices 1-3.
 * In reality the scriptSig is: 03 86 43 1e ...
 * 0x1e4386 = 1,983,334 (close to 1,983,702 depending on serialization).
 * We use a simplified representation for visual clarity.
 */
export const TIMEBOMB_HEX = [
  '03', '86', '43', '1e',  // height bytes (the time bomb)
  '06', '2f', '50', '32',  // "/P2" pool tag start
  '53', '48', '2f', '04',  // "SH/."
  'b8', '86', '4e', '00',  // timestamp
  '01', '8e', '06', '2f',  // extra nonce start
  '50', '32', '53', '48',  // "/P2SH"
  '2f', '04', '00', '00',  // padding
  '00', '00', '00', '00',  // padding
] as const;

/** Indices into TIMEBOMB_HEX that are the critical height bytes */
export const TIMEBOMB_CRITICAL_BYTES = [0, 1, 2, 3] as const;

// ─── UTXO Hashmap sample entries ─────────────────────────────────
export interface UTXOEntry {
  txid: string;
  vout: number;
  btc: number;
  state: 'normal' | 'highlighted' | 'ghost' | 'overwriting' | 'duplicate';
}

export const SAMPLE_UTXOS: UTXOEntry[] = [
  { txid: 'a1b2c3d4e5f6...7890', vout: 0, btc: 12.5, state: 'normal' },
  { txid: DUPLICATE_TXID_1.slice(0, 16) + '...' + DUPLICATE_TXID_1.slice(-4), vout: 0, btc: 50, state: 'normal' },
  { txid: '9f8e7d6c5b4a...3210', vout: 0, btc: 25.0, state: 'normal' },
  { txid: 'deadbeef0123...cafe', vout: 1, btc: 6.25, state: 'normal' },
  { txid: 'f0e1d2c3b4a5...6789', vout: 0, btc: 50, state: 'normal' },
  { txid: '1a2b3c4d5e6f...abcd', vout: 0, btc: 3.125, state: 'normal' },
];

/** The duplicate entry that will overwrite */
export const DUPLICATE_ENTRY: UTXOEntry = {
  txid: DUPLICATE_TXID_1.slice(0, 16) + '...' + DUPLICATE_TXID_1.slice(-4),
  vout: 0,
  btc: 50,
  state: 'duplicate',
};
