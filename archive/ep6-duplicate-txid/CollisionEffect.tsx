/**
 * CollisionEffect — Dramatic radial flash + screen shake.
 *
 * Full-viewport overlay that triggers when two cards collide.
 * A crimson radial burst expands from center and fades.
 * The parent container shakes via CSS animation.
 *
 * Used in: Scene 9 (the UTXO overwrite collision)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { C } from './constants';

interface CollisionEffectProps {
  /** Whether the collision is active */
  active: boolean;
  /** Flash color (default: ghost crimson) */
  color?: string;
  /** Callback when the flash animation completes */
  onComplete?: () => void;
}

export function CollisionEffect({
  active,
  color = C.ghostCrimson,
  onComplete,
}: CollisionEffectProps) {
  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Radial flash burst */}
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, ${color}40 0%, ${color}15 30%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0.6, 0], scale: [0.3, 1.2, 1.4, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              times: [0, 0.15, 0.4, 1],
              ease: 'easeOut',
            }}
            onAnimationComplete={onComplete}
          />

          {/* Secondary ring pulse */}
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '20vw',
              height: '20vw',
              marginTop: '-10vw',
              marginLeft: '-10vw',
              borderRadius: '50%',
              border: `0.15vw solid ${color}50`,
              zIndex: 51,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 2.5, 4],
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.2, 1],
              ease: 'easeOut',
              delay: 0.05,
            }}
          />

          {/* Hot center flash */}
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '6vw',
              height: '6vw',
              marginTop: '-3vw',
              marginLeft: '-3vw',
              borderRadius: '50%',
              backgroundColor: `${color}`,
              filter: 'blur(1.5vw)',
              zIndex: 52,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: 0.4,
              times: [0, 0.3, 1],
              ease: 'easeOut',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ─── useScreenShake ───────────────────────────────────────────────────
// Hook that applies a CSS shake animation to a ref'd element.
// Returns a style object to spread onto the container.

export function getShakeStyle(active: boolean): React.CSSProperties {
  if (!active) return {};
  return {
    animation: 'ep6-shake 0.35s ease-out',
  };
}

// Inject the keyframe animation into the document (only once)
if (typeof document !== 'undefined') {
  const styleId = 'ep6-collision-shake';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes ep6-shake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-3px, 1px); }
        20% { transform: translate(3px, -2px); }
        30% { transform: translate(-2px, 2px); }
        40% { transform: translate(2px, -1px); }
        50% { transform: translate(-1px, 1px); }
        60% { transform: translate(1px, -1px); }
        70% { transform: translate(-1px, 0px); }
        80% { transform: translate(1px, 0px); }
        90% { transform: translate(0px, -1px); }
      }
    `;
    document.head.appendChild(style);
  }
}
