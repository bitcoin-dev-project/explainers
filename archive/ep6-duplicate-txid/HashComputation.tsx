/**
 * HashComputation — Animated bytes -> SHA256d -> txid flow.
 *
 * Three-column horizontal layout:
 *   [Raw Hex Bytes] → [SHA256d] → [TXID Result]
 *
 * The SHA256d box has a subtle processing glow.
 * Connecting arrows draw in via SVG pathLength.
 *
 * Used in: Scenes 3, 4, 8, 17
 */

import { motion } from 'framer-motion';
import { C, EP, F } from './constants';

interface HashComputationProps {
  /** Hex bytes to display on the left */
  bytes: string;
  /** Resulting txid to display on the right */
  result: string;
  /** Entrance delay in seconds */
  delay?: number;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Override accent color for the SHA256d box */
  accentColor?: string;
  /** Label above the bytes column */
  bytesLabel?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export function HashComputation({
  bytes,
  result,
  delay = 0,
  compact = false,
  accentColor = C.primary,
  bytesLabel,
  style,
}: HashComputationProps) {
  const boxH = compact ? '4vh' : '5vh';
  const boxW = compact ? '7vw' : '9vw';
  const fontSize = compact ? '0.6vw' : '0.7vw';
  const labelSize = compact ? '0.5vw' : '0.6vw';
  const arrowW = compact ? '3vw' : '4vw';

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3vw',
        ...style,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* ── Left: Raw Bytes ──────────────────────────────────── */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.3vh',
        }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1, ...EP.reveal }}
      >
        {bytesLabel && (
          <span style={{
            fontSize: labelSize,
            fontWeight: 600,
            fontFamily: F.body,
            color: C.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.04vw',
          }}>
            {bytesLabel}
          </span>
        )}
        <div style={{
          padding: compact ? '0.5vh 0.6vw' : '0.8vh 0.8vw',
          borderRadius: '0.3vw',
          backgroundColor: C.iceBlueFaint,
          border: `0.06vw solid ${C.iceBlue}30`,
          maxWidth: compact ? '10vw' : '13vw',
        }}>
          <span style={{
            fontSize,
            fontFamily: F.mono,
            color: C.text,
            fontWeight: 500,
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}>
            {bytes}
          </span>
        </div>
      </motion.div>

      {/* ── Arrow 1 ──────────────────────────────────────────── */}
      <FlowArrow delay={delay + 0.3} width={arrowW} color={C.textFaint} />

      {/* ── Center: SHA256d Box ───────────────────────────────── */}
      <motion.div
        style={{
          width: boxW,
          height: boxH,
          borderRadius: '0.4vw',
          border: `0.1vw solid ${accentColor}`,
          backgroundColor: `${accentColor}0A`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.4, ...EP.pop }}
      >
        {/* Processing glow sweep */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${accentColor}15 50%, transparent 100%)`,
            pointerEvents: 'none',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            delay: delay + 0.6,
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'easeInOut',
          }}
        />
        <span style={{
          fontSize: compact ? '0.7vw' : '0.85vw',
          fontWeight: 700,
          fontFamily: F.mono,
          color: accentColor,
          position: 'relative',
          zIndex: 1,
        }}>
          SHA256d
        </span>
      </motion.div>

      {/* ── Arrow 2 ──────────────────────────────────────────── */}
      <FlowArrow delay={delay + 0.6} width={arrowW} color={C.textFaint} />

      {/* ── Right: TXID Result ───────────────────────────────── */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.3vh',
        }}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.8, ...EP.reveal }}
      >
        <span style={{
          fontSize: labelSize,
          fontWeight: 700,
          fontFamily: F.display,
          color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04vw',
        }}>
          TXID
        </span>
        <div style={{
          padding: compact ? '0.5vh 0.6vw' : '0.8vh 0.8vw',
          borderRadius: '0.3vw',
          backgroundColor: C.amberFaint,
          border: `0.06vw solid ${C.amber}30`,
          maxWidth: compact ? '10vw' : '13vw',
        }}>
          <span style={{
            fontSize,
            fontFamily: F.mono,
            color: C.text,
            fontWeight: 600,
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}>
            {result}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── FlowArrow ────────────────────────────────────────────────────────
// Minimal SVG arrow with pathLength draw-in animation.

function FlowArrow({
  delay = 0,
  width = '4vw',
  color = C.textFaint,
}: {
  delay?: number;
  width?: string;
  color?: string;
}) {
  return (
    <svg
      width={width}
      height="2vh"
      viewBox="0 0 60 20"
      fill="none"
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {/* Line */}
      <motion.line
        x1="2" y1="10" x2="48" y2="10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { delay, duration: 0.5, ease: 'circOut' },
          opacity: { delay, duration: 0.15 },
        }}
      />
      {/* Arrowhead */}
      <motion.polygon
        points="46,5 58,10 46,15"
        fill={color}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.35, ...EP.pop }}
        style={{ transformOrigin: '52px 10px' }}
      />
    </svg>
  );
}
