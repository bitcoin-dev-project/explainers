/**
 * EP7 — "The Overwrite"
 *
 * Duplicate coinbase transactions & the BIP 54 coinbase uniqueness fix.
 * How identical TXIDs silently destroyed 100 BTC, and the 16-year
 * journey from BIP 30 → BIP 34 → BIP 54 to fix it — including the
 * accidental time bomb in block 164,384 that ticks until 2046.
 *
 * 18 scenes (director merged 11→12 and 17+18→17 from original 20).
 * Single-canvas architecture with Camera horizontal journey across 300vw.
 * First episode to use GSAP as primary animation engine.
 *
 * Visual centerpieces per act:
 *   Act 1 (0-4): BlockStrip — blockchain overview
 *   Act 2 (5-9): UTXOHashmap — the overwrite choreography
 *   Act 3 (10-13): HexRibbon — the time bomb {HIGHLIGHT at scene 12}
 *   Act 4 (14-17): PatchViz — BIP 54 lock mechanism
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  useVideoPlayer,
  DevControls,
  morph,
  sceneRange,
  Camera,
} from '@/lib/video';
import { EP_COLORS, EP_SPRINGS, ECE, DUPLICATE_BLOCKS, TIMEBOMB_YEAR } from './constants';
import BlockStrip from './BlockStrip';
import UTXOHashmap from './UTXOHashmap';
import HexRibbon from './HexRibbon';
import OverwriteParticles from './OverwriteParticles';
import PatchViz from './PatchViz';

// ─── Scene Durations (ms) ────────────────────────────────────────
// Formula: content density → 6-10s per scene, complex animations get more.
const SCENE_DURATIONS = {
  scene1: 7000,   // 0: Title card
  scene2: 8000,   // 1: Blockchain strip appears
  scene3: 8000,   // 2: Camera zooms into block 91,722
  scene4: 8000,   // 3: "Every coinbase TX gets a unique TXID"
  scene5: 7000,   // 4: "But what if two produce the same TXID?"
  scene6: 9000,   // 5: UTXO hashmap appears, target glows gold
  scene7: 10000,  // 6: Duplicate materializes, char-by-char match
  scene8: 10000,  // 7: THE OVERWRITE — stamp, shatter, particles
  scene9: 9000,   // 8: "This happened TWICE" — both pairs
  scene10: 8000,  // 9: Pull back — ghost entries, "gone forever"
  scene11: 9000,  // 10: BIP 30 scan (merged w/ transition)
  scene12: 9000,  // 11: BIP 34 stamp
  scene13: 10000, // 12: HexRibbon time bomb {/* HIGHLIGHT SCENE */}
  scene14: 10000, // 13: Countdown 2012→2046
  scene15: 7000,  // 14: "BIP 54 closes the gap — permanently"
  scene16: 11000, // 15: Lock mechanism (nLockTime + nSequence merged)
  scene17: 8000,  // 16: Hashmap with lock icons — safe state
  scene18: 7000,  // 17: CTA
};

// ─── Camera Shots ────────────────────────────────────────────────
// Camera uses transformOrigin '0 0', so math is simple:
// To see content at left=Xvw → set x=-Xvw. Scale zooms from top-left.
// Horizontal journey: left zone (0-90vw) → center zone (105-185vw) → right zone (210-285vw)
const CAMERA_SHOTS: Record<number, { x?: string | number; y?: string | number; scale?: number }> = {
  0:  { x: 0, y: 0, scale: 1 },                        // wide: blockchain strip (left zone)
  2:  { x: '-86vw', y: '-18vh', scale: 1.8 },           // zoom: inside block 91,722 (at canvas ~71vw)
  4:  { x: 0, y: 0, scale: 1 },                         // pull back: ominous question
  5:  { x: '-95vw', y: 0, scale: 1 },                   // pan: UTXO hashmap (center zone)
  6:  { x: '-120vw', y: '-8vh', scale: 1.2 },           // zoom: match detail (fits full hashmap width)
  7:  { x: '-105vw', y: 0, scale: 1.1 },                // overwrite impact (reduced zoom to fit content)
  9:  { x: '-90vw', y: 0, scale: 0.9 },                 // pull back: see damage
  10: { x: '-200vw', y: 0, scale: 1 },                  // pan: fix zone (right zone)
  12: { x: '-210vw', y: 0, scale: 1.1 },                // zoom: time bomb hex (HIGHLIGHT, fits grid)
  14: { x: '-200vw', y: '-25vh', scale: 1 },            // pan down: BIP 54 fix
  16: { x: '-85vw', y: 0, scale: 0.85 },                // pull way back: safe hashmap (centered)
  17: { x: 0, y: 0, scale: 1 },                         // CTA: back to center
};

// ─── Ambient background CSS ──────────────────────────────────────
const ambientCSS = `
  @keyframes bg-gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes subtle-pulse {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.06; }
  }
`;

// ─── Main VideoTemplate ──────────────────────────────────────────

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  return (
    <div
      data-video="ep7"
      className="w-full h-screen overflow-hidden relative"
      style={{
        backgroundColor: EP_COLORS.bg,
        fontFamily: 'var(--font-body)',
        color: EP_COLORS.text,
      }}
    >
      <style>{ambientCSS}</style>

      {/* Ambient background — subtle gradient animation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 40%, ${EP_COLORS.bgAlt}40, transparent 70%)`,
          animation: 'subtle-pulse 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CAMERA — wraps all content on the 300vw × 200vh canvas    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Camera
        scene={s}
        shots={CAMERA_SHOTS}
        width="300vw"
        height="200vh"
        transition={{
          type: 'spring',
          stiffness: 50,
          damping: 22,
          mass: 1.8,
        }}
      >
        {/* ─── ACT 1: The Coinbase Transaction (scenes 0-4) ─── */}
        {/* Each act only renders during its scenes to prevent bleed-through */}

        {sceneRange(s, 0, 5) && <BlockStrip scene={s} />}

        {/* ─── ACT 2: The Overwrite (scenes 5-9) ─── */}

        {sceneRange(s, 4, 10) && <UTXOHashmap scene={s} />}

        {s === 7 && (
          <OverwriteParticles
            active={true}
            originX="145vw"
            originY="45vh"
            count={50}
          />
        )}

        {/* ─── ACT 3: The Time Bomb (scenes 10-13) ─── */}

        {sceneRange(s, 10, 14) && <HexRibbon scene={s} />}

        {/* ─── ACT 4: The Permanent Fix (scenes 14-17) ─── */}

        {sceneRange(s, 10, 18) && <PatchViz scene={s} />}

        {/* ─── Return to hashmap (scene 16) — safe state ─── */}
        {sceneRange(s, 16, 18) && <UTXOHashmap scene={s} />}
      </Camera>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TEXT CAPTIONS — ECE (themed CE) for labels and headings    */}
      {/* These are positioned in screen space (outside Camera)      */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* ── Scene 0: Title Card ── */}
      <ECE s={s} enter={0} exit={1} delay={0.3} style={{
        position: 'absolute',
        top: '30vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <motion.h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '6vh',
            fontWeight: 800,
            color: EP_COLORS.text,
            letterSpacing: '0.05em',
            lineHeight: 1.2,
          }}
          {...morph(s, {
            0: { opacity: 1, scale: 1 },
          })}
          transition={EP_SPRINGS.reveal}
        >
          The Overwrite
        </motion.h1>
      </ECE>

      <ECE s={s} enter={0} exit={1} delay={0.8} style={{
        position: 'absolute',
        top: '42vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2.2vh',
          color: EP_COLORS.muted,
          letterSpacing: '0.08em',
        }}>
          How duplicate TXIDs destroyed 100 BTC
        </span>
      </ECE>

      <ECE s={s} enter={0} exit={1} delay={1.2} style={{
        position: 'absolute',
        top: '50vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.5vh',
          color: EP_COLORS.accent,
          letterSpacing: '0.1em',
        }}>
          BIP 30 → BIP 34 → BIP 54
        </span>
      </ECE>

      {/* ── Scene 1: Blockchain strip intro ── */}
      <ECE s={s} enter={1} exit={2} delay={0.4} style={{
        position: 'absolute',
        top: '8vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3vh',
          fontWeight: 700,
          color: EP_COLORS.text,
        }}>
          Every block has a coinbase transaction
        </h2>
      </ECE>

      {/* ── Scene 2: Zoom into block ── */}
      <ECE s={s} enter={2} exit={4} delay={0.5} style={{
        position: 'absolute',
        bottom: '12vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          color: EP_COLORS.text,
        }}>
          The miner's reward — freshly minted coins
        </span>
      </ECE>

      {/* ── Scene 3: TXID forming ── */}
      <ECE s={s} enter={3} exit={4} delay={0.3} style={{
        position: 'absolute',
        top: '8vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.8vh',
          fontWeight: 700,
          color: EP_COLORS.highlight,
        }}>
          Every coinbase gets a unique TXID
        </h2>
      </ECE>

      {/* ── Scene 4: Ominous question ── */}
      <ECE s={s} enter={4} exit={5} delay={0.3} style={{
        position: 'absolute',
        top: '12vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.2vh',
          fontWeight: 700,
          color: EP_COLORS.danger,
        }}>
          But what if two produce the same TXID?
        </h2>
      </ECE>

      {/* ── Scene 5: UTXO hashmap intro ── */}
      <ECE s={s} enter={5} exit={6} delay={0.5} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.6vh',
          fontWeight: 700,
          color: EP_COLORS.text,
        }}>
          Bitcoin stores unspent coins in a hashmap
        </h2>
      </ECE>

      <ECE s={s} enter={5} exit={6} delay={1.0} style={{
        position: 'absolute',
        top: '10vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.6vh',
          color: EP_COLORS.muted,
        }}>
          TXID → Value — each key must be unique
        </span>
      </ECE>

      {/* ── Scene 6: Match warning ── */}
      <ECE s={s} enter={6} exit={7} delay={1.5} style={{
        position: 'absolute',
        bottom: '8vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.2vh',
          fontWeight: 700,
          color: EP_COLORS.match,
        }}>
          Every character matches — identical key
        </span>
      </ECE>

      {/* ── Scene 7: Overwrite impact — minimal text, let the visual speak ── */}
      {/* No text caption — the "50 BTC Destroyed" label is inside UTXOHashmap */}

      {/* ── Scene 8: "This happened TWICE" — strengthened per director ── */}
      <ECE s={s} enter={8} exit={10} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3vh',
          fontWeight: 800,
          color: EP_COLORS.danger,
          letterSpacing: '0.05em',
        }}>
          This happened twice. November 2010.
        </h2>
      </ECE>

      {/* Block pair details — staggered reveal */}
      <ECE s={s} enter={8} exit={10} delay={0.9} style={{
        position: 'absolute',
        bottom: '18vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5vh',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '4vw', alignItems: 'center' }}>
          {DUPLICATE_BLOCKS.map((pair, i) => (
            <div key={i} style={{
              padding: '1.5vh 2vw',
              borderRadius: '0.8vh',
              background: EP_COLORS.bgAlt,
              border: `1px solid ${EP_COLORS.danger}30`,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.5vh',
              color: EP_COLORS.text,
              textAlign: 'center',
            }}>
              <div style={{ color: EP_COLORS.muted, fontSize: '1.2vh', marginBottom: '0.5vh' }}>
                Pair {i + 1}
              </div>
              <div>
                Block <span style={{ color: EP_COLORS.accent }}>{pair.height.toLocaleString()}</span>
                {' = '}
                Block <span style={{ color: EP_COLORS.accent }}>{pair.pair.toLocaleString()}</span>
              </div>
              <div style={{ color: EP_COLORS.danger, fontWeight: 700, marginTop: '0.5vh' }}>
                {pair.btc} BTC lost
              </div>
            </div>
          ))}
        </div>
      </ECE>

      {/* ── Scene 9: Ghost state summary ── */}
      <ECE s={s} enter={9} exit={10} delay={0.3} style={{
        position: 'absolute',
        bottom: '8vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2.2vh',
          color: EP_COLORS.muted,
          fontStyle: 'italic',
        }}>
          100 BTC — gone forever. Silently overwritten.
        </span>
      </ECE>

      {/* ── Scene 10: BIP 30 transition ── */}
      <ECE s={s} enter={10} exit={11} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.8vh',
          fontWeight: 700,
          color: EP_COLORS.fix,
        }}>
          Developers started patching
        </h2>
      </ECE>

      {/* ── Scene 11: BIP 34 ── */}
      <ECE s={s} enter={11} exit={12} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.6vh',
          fontWeight: 700,
          color: EP_COLORS.fix,
        }}>
          Embed the block height — unique input, unique hash
        </h2>
      </ECE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HIGHLIGHT SCENE — Scene 12: The Time Bomb                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <ECE s={s} enter={12} exit={13} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3vh',
          fontWeight: 800,
          color: EP_COLORS.danger,
          letterSpacing: '0.05em',
        }}>
          But one miner planted an accidental time bomb
        </h2>
      </ECE>

      {/* ── Scene 13: Countdown ── */}
      <ECE s={s} enter={13} exit={14} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          color: EP_COLORS.highlight,
        }}>
          At block 1,983,702 — BIP 34's guarantee breaks
        </span>
      </ECE>

      {/* ── Scene 14: BIP 54 intro ── */}
      <ECE s={s} enter={14} exit={15} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.2vh',
          fontWeight: 800,
          color: EP_COLORS.fix,
          letterSpacing: '0.04em',
        }}>
          BIP 54 closes the gap — permanently
        </h2>
      </ECE>

      {/* ── Scene 15: Lock mechanism — text handled by PatchViz ── */}

      {/* ── Scene 16: Safe hashmap ── */}
      <ECE s={s} enter={16} exit={17} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.6vh',
          fontWeight: 700,
          color: EP_COLORS.match,
        }}>
          Every coinbase — past and future — is now unique
        </h2>
      </ECE>

      <ECE s={s} enter={16} exit={17} delay={0.8} style={{
        position: 'absolute',
        bottom: '10vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.6vh',
          color: EP_COLORS.muted,
        }}>
          All historical coinbases have nLockTime = 0 — no collision possible
        </span>
      </ECE>

      {/* ── Scene 17: CTA ── */}
      <ECE s={s} enter={17} delay={0.3} style={{
        position: 'absolute',
        top: '32vh',
        left: '50vw',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3vh',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5vh',
          fontWeight: 800,
          color: EP_COLORS.text,
          letterSpacing: '0.05em',
        }}>
          Follow @bitcoin_devs
        </h2>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.8vh',
          color: EP_COLORS.muted,
        }}>
          Next: The Great Consensus Cleanup
        </span>
      </ECE>

      {/* ── Highlight scene background flash (scene 12) ── */}
      {/* Visually breaks the pattern per CLAUDE.md — different bg mood */}
      {sceneRange(s, 12, 14) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 40%, ${EP_COLORS.danger}12, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* DevControls — playback UI for preview */}
      <DevControls player={player} />
    </div>
  );
}
