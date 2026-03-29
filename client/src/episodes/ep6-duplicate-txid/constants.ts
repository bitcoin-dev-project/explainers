/**
 * EP6: The Duplicate Transaction Bug — "The Doppelganger"
 * Shared constants: colors, springs, fonts
 */

import type { Transition } from 'framer-motion';

// ─── Episode Palette ──────────────────────────────────────────────────
// Ice blue = original/trust, Ghost crimson = clone/danger, Fix gold = solution
export const C = {
  // Episode accents
  iceBlue: '#93C5FD',
  iceBlueGlow: 'rgba(147, 197, 253, 0.25)',
  iceBlueFaint: 'rgba(147, 197, 253, 0.10)',
  ghostCrimson: '#F87171',
  ghostCrimsonGlow: 'rgba(248, 113, 113, 0.30)',
  ghostCrimsonFaint: 'rgba(248, 113, 113, 0.06)',
  fixGold: '#FBBF24',
  fixGoldGlow: 'rgba(251, 191, 36, 0.25)',
  fixGoldFaint: 'rgba(251, 191, 36, 0.10)',

  // Brand
  primary: '#EB5234',
  primaryFaint: 'rgba(235, 82, 52, 0.10)',

  // Neutrals
  text: '#201E1E',
  textMuted: '#78716C',
  textFaint: '#A8A29E',
  bgLight: '#E6D3B3',
  bgCard: 'rgba(255, 255, 255, 0.88)',
  bgWarm: '#F5EDE0',
  divider: 'rgba(32, 30, 30, 0.08)',
  dividerStrong: 'rgba(32, 30, 30, 0.15)',

  // Status
  green: '#10B981',
  greenFaint: 'rgba(16, 185, 129, 0.10)',
  amber: '#F59E0B',
  amberFaint: 'rgba(245, 158, 11, 0.10)',
} as const;

// ─── Episode Springs ──────────────────────────────────────────────────
// Matched to the topic's emotional register:
// Eerie tension (ghost approach) → violent collision → mathematical fix
export const EP = {
  ominous: { type: 'spring', stiffness: 100, damping: 30 } as Transition,
  collision: { type: 'spring', stiffness: 700, damping: 10 } as Transition,
  precise: { type: 'spring', stiffness: 150, damping: 25 } as Transition,
  pop: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  heavy: { type: 'spring', stiffness: 500, damping: 15 } as Transition,
  reveal: { type: 'spring', stiffness: 250, damping: 25 } as Transition,
};

// ─── Font References ──────────────────────────────────────────────────
export const F = {
  display: 'var(--font-display)',
  mono: 'var(--font-mono)',
  body: 'var(--font-body)',
} as const;
