/**
 * UTXOEntry — Horizontal UTXO status bar.
 *
 * Displays a single UTXO database entry with txid, value, block number,
 * and status badge. Animates between states:
 *   - active:      green badge, healthy entry
 *   - overwritten: red flash, block number morphs, strikethrough on old value
 *   - gone:        ghosted out, value fades to "—"
 *
 * Used in: Scenes 9, 11 (showing the UTXO corruption)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { C, EP, F } from './constants';

type UTXOStatus = 'active' | 'overwritten' | 'gone';

interface UTXOEntryProps {
  /** Truncated txid */
  txid: string;
  /** BTC value */
  value: string;
  /** Block number */
  block: string | number;
  /** Current status */
  status: UTXOStatus;
  /** Entrance delay */
  delay?: number;
  /** Additional styles */
  style?: React.CSSProperties;
}

const statusConfig: Record<UTXOStatus, {
  badge: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  bg: string;
  textOpacity: number;
}> = {
  active: {
    badge: 'UNSPENT',
    badgeColor: C.green,
    badgeBg: C.greenFaint,
    borderColor: `${C.green}30`,
    bg: C.bgCard,
    textOpacity: 1,
  },
  overwritten: {
    badge: 'OVERWRITTEN',
    badgeColor: C.ghostCrimson,
    badgeBg: C.ghostCrimsonFaint,
    borderColor: `${C.ghostCrimson}40`,
    bg: C.ghostCrimsonFaint,
    textOpacity: 0.6,
  },
  gone: {
    badge: 'GONE',
    badgeColor: C.textFaint,
    badgeBg: 'rgba(0,0,0,0.04)',
    borderColor: C.divider,
    bg: 'rgba(0,0,0,0.02)',
    textOpacity: 0.3,
  },
};

export function UTXOEntry({
  txid,
  value,
  block,
  status,
  delay = 0,
  style,
}: UTXOEntryProps) {
  const cfg = statusConfig[status];

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1vw',
        padding: '0.8vh 1.2vw',
        borderRadius: '0.4vw',
        border: `0.08vw solid ${cfg.borderColor}`,
        backgroundColor: cfg.bg,
        boxShadow: status === 'overwritten'
          ? `0 0 1vw ${C.ghostCrimsonGlow}`
          : '0 0.1vw 0.3vw rgba(0,0,0,0.04)',
        minWidth: '35vw',
        transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s',
        ...style,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...EP.reveal }}
    >
      {/* TXID */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2vh',
          flex: 1,
        }}
        animate={{ opacity: cfg.textOpacity }}
        transition={{ duration: 0.4 }}
      >
        <span style={{
          fontSize: '0.5vw',
          fontWeight: 700,
          fontFamily: F.display,
          color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04vw',
        }}>
          TXID
        </span>
        <span style={{
          fontSize: '0.7vw',
          fontFamily: F.mono,
          color: C.text,
          fontWeight: 500,
          textDecoration: status === 'gone' ? 'line-through' : 'none',
          textDecorationColor: C.ghostCrimson,
        }}>
          {txid}
        </span>
      </motion.div>

      {/* Divider */}
      <div style={{
        width: '0.06vw',
        height: '3vh',
        backgroundColor: C.divider,
        flexShrink: 0,
      }} />

      {/* Value */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2vh',
          minWidth: '6vw',
        }}
        animate={{ opacity: cfg.textOpacity }}
        transition={{ duration: 0.4 }}
      >
        <span style={{
          fontSize: '0.5vw',
          fontWeight: 700,
          fontFamily: F.display,
          color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04vw',
        }}>
          Value
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={status === 'gone' ? 'gone' : 'value'}
            style={{
              fontSize: '0.8vw',
              fontFamily: F.mono,
              fontWeight: 600,
              color: status === 'gone' ? C.textFaint : C.text,
              textDecoration: status === 'overwritten' ? 'line-through' : 'none',
              textDecorationColor: C.ghostCrimson,
              textDecorationThickness: '0.08vw',
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            {status === 'gone' ? '\u2014' : value}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Divider */}
      <div style={{
        width: '0.06vw',
        height: '3vh',
        backgroundColor: C.divider,
        flexShrink: 0,
      }} />

      {/* Block */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2vh',
          minWidth: '5vw',
        }}
        animate={{ opacity: cfg.textOpacity }}
        transition={{ duration: 0.4 }}
      >
        <span style={{
          fontSize: '0.5vw',
          fontWeight: 700,
          fontFamily: F.display,
          color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04vw',
        }}>
          Block
        </span>
        <span style={{
          fontSize: '0.8vw',
          fontFamily: F.mono,
          fontWeight: 600,
          color: C.text,
        }}>
          {typeof block === 'number' ? block.toLocaleString() : block}
        </span>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        style={{
          padding: '0.3vh 0.6vw',
          borderRadius: '0.25vw',
          backgroundColor: cfg.badgeBg,
          border: `0.06vw solid ${cfg.badgeColor}30`,
          flexShrink: 0,
        }}
        animate={{
          backgroundColor: cfg.badgeBg,
          borderColor: `${cfg.badgeColor}30`,
        }}
        transition={{ duration: 0.4 }}
      >
        <motion.span
          style={{
            fontSize: '0.55vw',
            fontWeight: 700,
            fontFamily: F.display,
            textTransform: 'uppercase',
            letterSpacing: '0.05vw',
          }}
          animate={{ color: cfg.badgeColor }}
          transition={{ duration: 0.4 }}
        >
          {cfg.badge}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
