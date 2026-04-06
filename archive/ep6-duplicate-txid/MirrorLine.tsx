/**
 * MirrorLine — Vertical center-screen axis representing bilateral symmetry.
 *
 * States:
 *   - hidden:  not visible
 *   - pulse:   thin white line pulsing gently (tension building)
 *   - crack:   line with hairline fractures (fix is applied)
 *   - shatter: line splits into falling, rotating segments (mirror breaks)
 *
 * The shatter animation is the episode's cathartic visual payoff —
 * when the nLockTime fix makes the cards non-identical, the mirror breaks.
 *
 * Used in: Scenes 7, 8, 9, 15, 17 (aha moment)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { C, EP } from './constants';

type MirrorState = 'hidden' | 'pulse' | 'crack' | 'shatter';

interface MirrorLineProps {
  /** Current visual state */
  state: MirrorState;
  /** Line color (default: white at low opacity) */
  color?: string;
  /** Height of the line as CSS value */
  height?: string;
  /** Entrance delay */
  delay?: number;
}

// Pre-computed shard configs for deterministic shatter
const SHARD_COUNT = 10;
const SHARDS = Array.from({ length: SHARD_COUNT }, (_, i) => ({
  yOffset: i * (100 / SHARD_COUNT),          // percentage along the line
  rotation: ((i % 2 === 0 ? 1 : -1) * (12 + (i * 7) % 25)),  // ±12-37 degrees
  fallDistance: 60 + (i * 13) % 80,          // vh units to fall
  xDrift: ((i % 2 === 0 ? 1 : -1) * (2 + (i * 3) % 8)),     // vw drift
  fallDelay: i * 0.04,                        // stagger
}));

export function MirrorLine({
  state,
  color = 'rgba(255, 255, 255, 0.5)',
  height = '60vh',
  delay = 0,
}: MirrorLineProps) {
  if (state === 'hidden') return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '2vw',
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── Pulse State ──────────────────────────────────────── */}
        {state === 'pulse' && (
          <motion.div
            key="pulse"
            style={{
              width: '0.08vw',
              height: '100%',
              backgroundColor: color,
              borderRadius: '0.04vw',
              boxShadow: `0 0 0.5vw ${color}`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scaleY: 1,
            }}
            exit={{ opacity: 0, scaleY: 0.8 }}
            transition={{
              scaleY: { delay, duration: 0.6, ease: 'circOut' },
              opacity: { delay: delay + 0.3, duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        )}

        {/* ── Crack State ──────────────────────────────────────── */}
        {state === 'crack' && (
          <motion.div
            key="crack"
            style={{
              width: '0.15vw',
              height: '100%',
              position: 'relative',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay }}
          >
            {/* Main cracked line — segmented */}
            {SHARDS.slice(0, 6).map((shard, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${shard.yOffset}%`,
                  left: '50%',
                  width: '0.08vw',
                  height: `${100 / 6 - 1}%`,
                  backgroundColor: color,
                  borderRadius: '0.04vw',
                  transformOrigin: 'center top',
                }}
                initial={{ opacity: 0, x: '-50%' }}
                animate={{
                  opacity: [0.5, 0.7, 0.4],
                  x: `calc(-50% + ${(i % 2 === 0 ? 0.5 : -0.5) * (i * 0.15)}vw)`,
                }}
                transition={{
                  opacity: { delay: delay + 0.2 + i * 0.06, duration: 1.5, repeat: Infinity },
                  x: { delay: delay + i * 0.06, ...EP.precise },
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ── Shatter State ────────────────────────────────────── */}
        {state === 'shatter' && (
          <motion.div
            key="shatter"
            style={{
              width: '0.15vw',
              height: '100%',
              position: 'relative',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            {SHARDS.map((shard, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${shard.yOffset}%`,
                  left: '50%',
                  width: '0.12vw',
                  height: `${100 / SHARD_COUNT}%`,
                  backgroundColor: color,
                  borderRadius: '0.04vw',
                  transformOrigin: 'center center',
                  boxShadow: `0 0 0.3vw ${color}`,
                }}
                initial={{
                  x: '-50%',
                  rotate: 0,
                  opacity: 0.7,
                }}
                animate={{
                  x: `calc(-50% + ${shard.xDrift}vw)`,
                  y: `${shard.fallDistance}vh`,
                  rotate: shard.rotation,
                  opacity: 0,
                  scale: 0.5,
                }}
                transition={{
                  delay: delay + shard.fallDelay,
                  duration: 1.2,
                  ease: [0.2, 0, 0.8, 1],  // custom gravity-like ease
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Equals sign (visible during pulse/crack) ──────────── */}
      <AnimatePresence>
        {(state === 'pulse') && (
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '1.5vw',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: C.ghostCrimson,
              textShadow: `0 0 0.8vw ${C.ghostCrimsonGlow}`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.5, 0.9, 0.5],
              scale: [0.95, 1.1, 0.95],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              delay: delay + 0.5,
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            =
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Not-equals sign (visible during shatter) ──────────── */}
      <AnimatePresence>
        {state === 'shatter' && (
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2vw',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: C.green,
              textShadow: `0 0 1vw ${C.greenFaint}`,
            }}
            initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.3, ...EP.pop }}
          >
            {'\u2260'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
