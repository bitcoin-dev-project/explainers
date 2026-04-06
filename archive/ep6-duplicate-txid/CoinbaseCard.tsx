/**
 * CoinbaseCard — The signature visual for EP6: The Duplicate Transaction Bug.
 *
 * A styled "identity card" for a coinbase transaction showing its internal fields.
 * Two variants:
 *   - solid (ice blue accent) — the original transaction
 *   - ghost (translucent crimson) — the doppelganger clone
 *
 * Used in: Scenes 5-9, 12, 14-17 (the star of the show)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { C, EP, F } from './constants';

// ─── Types ────────────────────────────────────────────────────────────

export interface CardFieldData {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
  dimmed?: boolean;
  annotation?: string;
}

export interface CoinbaseCardProps {
  /** Visual variant: solid = original, ghost = doppelganger clone */
  variant?: 'solid' | 'ghost';
  /** Override the left accent color */
  accentColor?: string;
  /** Transaction fields to display */
  fields: CardFieldData[];
  /** Block number shown in the header */
  blockNumber?: string | number;
  /** Optional sub-label under block number (e.g., "January 2012") */
  blockLabel?: string;
  /** The computed txid shown at the bottom */
  txid?: string;
  /** Whether to show the txid footer */
  showTxid?: boolean;
  /** Entrance delay in seconds */
  delay?: number;
  /** Compact mode for bilateral layout (two cards side by side) */
  compact?: boolean;
  /** Additional inline styles on the card container */
  style?: React.CSSProperties;
}

// ─── CoinbaseCard ─────────────────────────────────────────────────────

export function CoinbaseCard({
  variant = 'solid',
  accentColor,
  fields,
  blockNumber,
  blockLabel,
  txid,
  showTxid = false,
  delay = 0,
  compact = false,
  style,
}: CoinbaseCardProps) {
  const isGhost = variant === 'ghost';
  const accent = accentColor ?? (isGhost ? C.ghostCrimson : C.iceBlue);

  // Variant-driven styling
  const bg = isGhost ? C.ghostCrimsonFaint : C.bgCard;
  const borderTint = isGhost ? `${C.ghostCrimson}25` : `${C.iceBlue}30`;
  const shadow = isGhost
    ? `0 0 1.5vw ${C.ghostCrimsonGlow}, 0 0.15vw 0.6vw rgba(0,0,0,0.04)`
    : `0 0.2vw 0.8vw rgba(0,0,0,0.06), 0 0.05vw 0.15vw rgba(0,0,0,0.04)`;

  const w = compact ? '22vw' : '28vw';
  const pad = compact ? '1vh 1.2vw' : '1.4vh 1.5vw';
  const padFields = compact ? '0.6vh 1.2vw' : '0.8vh 1.5vw';

  return (
    <motion.div
      style={{
        width: w,
        borderRadius: '0.6vw',
        border: `0.1vw solid ${borderTint}`,
        borderLeft: `0.3vw solid ${accent}`,
        backgroundColor: bg,
        boxShadow: shadow,
        overflow: 'hidden',
        backdropFilter: isGhost ? 'blur(2px)' : undefined,
        ...style,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, ...(isGhost ? EP.ominous : EP.precise) }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ padding: pad, borderBottom: `0.06vw solid ${C.divider}` }}>
        <motion.div
          style={{
            fontSize: compact ? '0.65vw' : '0.75vw',
            fontWeight: 700,
            fontFamily: F.display,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: '0.1vw',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.15 }}
        >
          Coinbase Transaction
        </motion.div>

        {blockNumber !== undefined && (
          <motion.div
            style={{
              fontSize: compact ? '1vw' : '1.2vw',
              fontWeight: 700,
              fontFamily: F.display,
              color: C.text,
              marginTop: '0.3vh',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.6vw',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.25 }}
          >
            Block #{typeof blockNumber === 'number' ? blockNumber.toLocaleString() : blockNumber}
            {blockLabel && (
              <span style={{
                fontSize: '0.7vw',
                fontWeight: 400,
                fontFamily: F.body,
                color: C.textMuted,
              }}>
                {blockLabel}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Fields ─────────────────────────────────────────────── */}
      <div style={{ padding: padFields }}>
        {fields.map((field, i) => (
          <CardField
            key={field.label}
            label={field.label}
            value={field.value}
            highlight={field.highlight}
            highlightColor={field.highlightColor}
            dimmed={field.dimmed}
            annotation={field.annotation}
            delay={delay + 0.3 + i * 0.12}
            compact={compact}
            isLast={i === fields.length - 1}
          />
        ))}
      </div>

      {/* ── TXID Footer ────────────────────────────────────────── */}
      <AnimatePresence>
        {showTxid && txid && (
          <motion.div
            style={{
              padding: pad,
              borderTop: `0.06vw solid ${C.divider}`,
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: delay + 0.3 + fields.length * 0.12 + 0.15, ...EP.precise }}
          >
            <div style={{
              fontSize: '0.55vw',
              fontWeight: 700,
              fontFamily: F.display,
              color: C.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06vw',
              marginBottom: '0.4vh',
            }}>
              TXID
            </div>
            <div style={{
              fontSize: compact ? '0.6vw' : '0.7vw',
              fontFamily: F.mono,
              color: C.text,
              fontWeight: 500,
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}>
              {txid}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CardField ────────────────────────────────────────────────────────
// Individual field row within the CoinbaseCard.
// Supports highlight glow, dim state, and annotation arrows.

interface CardFieldProps {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
  dimmed?: boolean;
  annotation?: string;
  delay?: number;
  compact?: boolean;
  isLast?: boolean;
}

export function CardField({
  label,
  value,
  highlight = false,
  highlightColor = C.fixGold,
  dimmed = false,
  annotation,
  delay = 0,
  compact = false,
  isLast = false,
}: CardFieldProps) {
  const hc = highlightColor;

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '0.5vw' : '0.8vw',
        padding: compact ? '0.55vh 0.3vw' : '0.7vh 0.4vw',
        borderBottom: isLast ? 'none' : `0.04vw solid ${C.divider}`,
        borderRadius: '0.25vw',
        position: 'relative',
      }}
      initial={{ opacity: 0, x: -6 }}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        x: 0,
      }}
      transition={{ delay, ...EP.precise }}
    >
      {/* Highlight glow overlay */}
      <AnimatePresence>
        {highlight && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '-0.15vh -0.2vw',
              borderRadius: '0.3vw',
              backgroundColor: `${hc}10`,
              border: `0.08vw solid ${hc}35`,
              boxShadow: `0 0 0.6vw ${hc}18, inset 0 0 0.4vw ${hc}08`,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: delay + 0.08, ...EP.pop }}
          />
        )}
      </AnimatePresence>

      {/* Label */}
      <span style={{
        fontSize: compact ? '0.65vw' : '0.75vw',
        fontWeight: 600,
        fontFamily: F.body,
        color: highlight ? hc : C.textMuted,
        minWidth: compact ? '4.5vw' : '5.5vw',
        flexShrink: 0,
        transition: 'color 0.3s',
      }}>
        {label}
      </span>

      {/* Value */}
      <span style={{
        fontSize: compact ? '0.65vw' : '0.75vw',
        fontWeight: 500,
        fontFamily: F.mono,
        color: highlight ? hc : C.text,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s',
      }}>
        {value}
      </span>

      {/* Annotation */}
      <AnimatePresence>
        {annotation && (
          <motion.span
            style={{
              fontSize: compact ? '0.5vw' : '0.58vw',
              fontFamily: F.body,
              color: C.primary,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 0.85, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: delay + 0.2, ...EP.reveal }}
          >
            {annotation}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
