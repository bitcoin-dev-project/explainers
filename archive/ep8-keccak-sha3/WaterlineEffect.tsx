/**
 * WaterlineEffect — glowing annotation overlay for the sponge tank.
 *
 * Sits on top of SpongeCanvas. Provides:
 * - Animated SVG wave path (CSS @keyframes)
 * - Zone labels ("RATE r=1088" / "CAPACITY c=512")
 * - Glow effect via CSS filter
 *
 * Does NOT render the particles — SpongeCanvas does that.
 * This is the labeling/annotation layer.
 */

import { motion } from 'framer-motion';
import { EP_COLORS, EP_SPRINGS, SPONGE } from './constants';

interface WaterlineEffectProps {
  /** Show the rate label */
  showRate?: boolean;
  /** Show the capacity label */
  showCapacity?: boolean;
  /** Show the waterline label */
  showWaterlineLabel?: boolean;
  /** Attack mode — red glow pulse */
  attackMode?: boolean;
  /** Width matching SpongeCanvas */
  width?: number;
  /** Height matching SpongeCanvas */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function WaterlineEffect({
  showRate = false,
  showCapacity = false,
  showWaterlineLabel = false,
  attackMode = false,
  width = 480,
  height = 700,
  className,
  style,
}: WaterlineEffectProps) {
  const waterlineY = height * (SPONGE.tankPadding + (1 - SPONGE.tankPadding * 2) * SPONGE.rateRatio);
  const tankPad = width * SPONGE.tankPadding;

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        width,
        height,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* ── Zone labels ── */}
      {showRate && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={EP_SPRINGS.reveal}
          style={{
            position: 'absolute',
            right: -160,
            top: waterlineY * 0.4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            color: EP_COLORS.rate,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Rate
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: EP_COLORS.rateGlow,
          }}>
            r = 1088 bits
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: EP_COLORS.muted,
            maxWidth: 140,
            lineHeight: 1.4,
          }}>
            exposed surface — the world can touch this
          </span>
        </motion.div>
      )}

      {showCapacity && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={EP_SPRINGS.reveal}
          style={{
            position: 'absolute',
            right: -160,
            top: waterlineY + (height - waterlineY) * 0.3,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            color: EP_COLORS.accent,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Capacity
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: EP_COLORS.accent,
          }}>
            c = 512 bits
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: EP_COLORS.muted,
            maxWidth: 140,
            lineHeight: 1.4,
          }}>
            hidden interior — structurally inaccessible
          </span>
        </motion.div>
      )}

      {/* ── Waterline label ── */}
      {showWaterlineLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={EP_SPRINGS.reveal}
          style={{
            position: 'absolute',
            left: tankPad,
            top: waterlineY - 28,
            width: width - tankPad * 2,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{
            background: EP_COLORS.bg + 'E0',
            padding: '4px 12px',
            borderRadius: 4,
            border: `1px solid ${EP_COLORS.waterline}40`,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: EP_COLORS.waterline,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              waterline — exposed above / hidden below
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Attack glow pulse ── */}
      {attackMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: tankPad,
            top: waterlineY - 15,
            width: width - tankPad * 2,
            height: 30,
            background: `radial-gradient(ellipse at center, ${EP_COLORS.danger}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* ── Ambient CSS ripple on waterline (always visible when mounted) ── */}
      <style>{`
        @keyframes waterline-ripple {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.3; }
          50% { transform: scaleX(1.02) translateY(-1px); opacity: 0.5; }
        }
        @keyframes depth-pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.12; }
        }
      `}</style>

      {/* Ambient waterline glow bar */}
      <div
        style={{
          position: 'absolute',
          left: tankPad + 4,
          top: waterlineY - 1,
          width: width - tankPad * 2 - 8,
          height: 2,
          background: EP_COLORS.waterline,
          boxShadow: `0 0 12px ${EP_COLORS.waterline}60, 0 0 24px ${EP_COLORS.waterline}30`,
          animation: 'waterline-ripple 4s ease-in-out infinite',
          borderRadius: 1,
        }}
      />
    </div>
  );
}
