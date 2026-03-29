/**
 * EP8 — Keccak SHA3-256: The Sponge That Solved Length Extension
 *
 * 17 scenes, ~2:35. 4 acts on a 280vw × 180vh canvas.
 *
 * Act 1 (0-4):   SHA-256 pipeline + length extension attack
 * Act 2 (5-8):   Sponge tank — absorb, permute, squeeze
 * Act 3 (9-13):  Deep dive — rate/capacity/waterline + HIGHLIGHT attack bounce
 * Act 4 (14-16): SHA-256d vs SHA-3 comparison + CTA
 *
 * Canvas: 280vw × 180vh, 3 zones (10vw gaps between):
 *   Zone A: 0–90vw    (Act 1 — SHA-256 pipeline)
 *   Zone B: 100–180vw (Acts 2-3 — Sponge tank, 25vw×65vh at 110vw,8vh)
 *   Zone C: 190–270vw (Act 4 — Comparison + CTA)
 *
 * Sponge tank: 480px=25vw wide, 700px=65vh tall
 *   Left: 110vw, Right: 135vw, Top: 8vh, Bottom: 73vh
 *   Waterline: 8 + 65×0.68 = ~52vh
 *
 * ──────────────────────────────────────────────────────────────────
 * POSITION AUDIT — screen = canvas × scale + camera
 * ──────────────────────────────────────────────────────────────────
 *
 * Scene 0: camera(0, 0, 1)
 *   Title at (15vw, 28vh)   → screen(15, 28) ✓
 *   Subtitle at (15vw, 40vh) → screen(15, 40) ✓
 *
 * Scene 1: camera(0, 0, 1)
 *   Pipe at (8vw, 32vh)     → screen(8, 32) ✓
 *   Pipe width ~45vw        → right edge 53vw ✓
 *   Label at (8vw, 20vh)    → screen(8, 20) ✓
 *
 * Scene 2: camera(-5vw, -8vh, 1.2)
 *   Pipe at (8vw, 32vh)     → screen(8×1.2-5, 32×1.2-8) = (4.6, 30.4) ✓
 *   Right edge: 53×1.2-5    = 58.6vw ✓
 *   Label at (8vw, 20vh)    → screen(4.6, 16) ✓
 *
 * Scene 3: camera(-8vw, -10vh, 1.3)
 *   Pipe at (8vw, 32vh)     → screen(8×1.3-8, 32×1.3-10) = (2.4, 31.6) ✓
 *   Label at (8vw, 20vh)    → screen(2.4, 16) ✓
 *
 * Scene 4: camera(-10vw, -10vh, 1.3)
 *   Pipe+attack at (8vw, 32vh) → screen(8×1.3-10, 32×1.3-10) = (0.4, 31.6) ✓
 *   Attack extends right ~70vw → 70×1.3-10 = 81vw ✓
 *   Attack label at (45vw, 56vh) → screen(45×1.3-10, 56×1.3-10) = (48.5, 62.8) ✓
 *
 * Scene 5: camera(-100vw, 0, 1)
 *   Tank at (110vw, 8vh)    → screen(10, 8) ✓
 *   Tank right: 135-100     = 35vw ✓
 *   Label at (138vw, 28vh)  → screen(38, 28) ✓
 *
 * Scene 6-8: camera(-100vw, 0, 1)
 *   DataStream at (107vw, 5vh) → screen(7, 5) ✓
 *   Phase label at (138vw, 22-35vh) → screen(38, 22-35) ✓
 *
 * Scene 9: camera(-98vw, -2vh, 1.15)
 *   Tank at (110vw, 8vh)    → screen(110×1.15-98, 8×1.15-2) = (28.5, 7.2) ✓
 *   Tank right: 135×1.15-98 = 57.25vw ✓
 *   Label at (138vw, 14vh)  → screen(138×1.15-98, 14×1.15-2) = (60.7, 14.1) ✓
 *
 * Scene 10: camera(-98vw, -18vh, 1.15)
 *   Tank top off-screen (intentional — showing lower half)
 *   Waterline at 52vh       → screen 52×1.15-18 = 41.8vh ✓
 *   Label at (138vw, 50vh)  → screen(60.7, 39.5) ✓
 *
 * Scene 11: camera(-98vw, -10vh, 1.15)
 *   Waterline at 52vh       → screen 52×1.15-10 = 49.8vh ✓ (centered)
 *   Label at (138vw, 34vh)  → screen(60.7, 29.1) ✓
 *
 * Scene 12: camera(-102vw, -12vh, 1.3)
 *   Tank at (110vw, 8vh)    → screen(110×1.3-102, 8×1.3-12) = (41, -1.6) ✓
 *   Tank right: 135×1.3-102 = 73.5vw ✓
 *   Label at (134vw, 18vh)  → screen(134×1.3-102, 18×1.3-12) = (72.2, 11.4) ✓
 *     maxWidth 20vw×1.3=26vw → right edge: 72.2+26 = 98.2vw ✓
 *     (was 138vw → 103.4vw right edge CLIPPED — fixed by moving to 134vw)
 *
 * Scene 13 HIGHLIGHT: camera(-100vw, -8vh, 1.15)
 *   Tank at (110vw, 8vh)    → screen(110×1.15-100, 8×1.15-8) = (26.5, 1.2) ✓
 *   Tank right: 135×1.15-100= 55.25vw ✓
 *   Gold text at (138vw, 24vh) → screen(138×1.15-100, 24×1.15-8) = (58.7, 19.6) ✓
 *     WaterlineEffect labels HIDDEN during scene 13 (overlap fix)
 *
 * Scene 14-15: camera(-190vw, 0, 1)
 *   Comparison at (200vw, 15vh) → screen(10, 15) ✓
 *   Width ~75vw             → right edge 85vw ✓
 *
 * Scene 16: camera(-190vw, 0, 1)
 *   Comparison fades out (morph state 16: opacity 0) — prevents overlap with CTA
 *   CTA at (210vw, 30vh)    → screen(20, 30) ✓
 *   Follow at (215vw, 52vh) → screen(25, 52) ✓
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  useVideoPlayer,
  DevControls,
  Camera,
  sceneRange,
  morph,
  useSceneGSAP,
} from '@/lib/video';
import SpongeCanvas from './SpongeCanvas';
import type { SpongeMode } from './SpongeCanvas';
import SHA256Pipe from './SHA256Pipe';
import WaterlineEffect from './WaterlineEffect';
import DataStream from './DataStream';
import ComparisonView from './ComparisonView';
import { SCENE_DURATIONS, EP_COLORS, EP_SPRINGS, ECE } from './constants';

// ─── Camera Shots (verified in POSITION AUDIT above) ────────────
const CAMERA_SHOTS = {
  // Act 1: SHA-256 pipeline (Zone A)
  0: { x: 0, y: 0, scale: 1 },
  2: { x: '-5vw', y: '-8vh', scale: 1.2 },
  3: { x: '-8vw', y: '-10vh', scale: 1.3 },
  4: { x: '-10vw', y: '-10vh', scale: 1.3 },
  // Act 2: Sponge intro (Zone B — wide)
  5: { x: '-100vw', y: 0, scale: 1 },
  // Act 3: Deep dive (Zone B — zoom)
  9: { x: '-98vw', y: '-2vh', scale: 1.15 },
  10: { x: '-98vw', y: '-18vh', scale: 1.15 },
  11: { x: '-98vw', y: '-10vh', scale: 1.15 },
  12: { x: '-102vw', y: '-12vh', scale: 1.3 },
  13: { x: '-100vw', y: '-8vh', scale: 1.15 },
  // Act 4: Comparison (Zone C)
  14: { x: '-190vw', y: 0, scale: 1 },
};

// ─── Sponge Mode by Scene ────────────────────────────────────────
function getSpongeMode(scene: number): SpongeMode {
  if (scene === 6) return 'absorb';
  if (scene === 7) return 'permute';
  if (scene === 8) return 'squeeze';
  if (scene === 13) return 'attack';
  return 'idle';
}

// ─── Main Template ───────────────────────────────────────────────
export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  const highlightRef = useRef<HTMLDivElement>(null);

  // GSAP choreography for highlight scene 13 — gold text entrance
  useSceneGSAP(highlightRef, s, {
    13: (tl) => {
      tl.from('.aha-title', {
        opacity: 0,
        scale: 0.5,
        filter: 'blur(20px)',
        duration: 1.5,
        ease: 'power3.out',
        delay: 1.0,
      })
        .from('.aha-subtitle', {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power2.out',
        }, '-=0.3')
        .from('.aha-impossible', {
          opacity: 0,
          y: 15,
          duration: 0.6,
          ease: 'power2.out',
        }, '-=0.2');
    },
  });

  return (
    <div
      data-video="ep8"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: EP_COLORS.bg,
      }}
    >
      <Camera
        scene={s}
        shots={CAMERA_SHOTS}
        width="280vw"
        height="180vh"
        transition={EP_SPRINGS.camera}
      >
        {/* ════════════════════════════════════════════════════════
            ZONE A (0-90vw): Act 1 — SHA-256 Pipeline
            ════════════════════════════════════════════════════════ */}

        {/* Scene 0: Title */}
        <ECE s={s} enter={0} exit={1} style={{ position: 'absolute', left: '15vw', top: '28vh' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.2vw',
            fontWeight: 700,
            color: EP_COLORS.text,
            lineHeight: 1.2,
            margin: 0,
          }}>
            Bitcoin hashes everything twice.
          </h1>
        </ECE>

        <ECE s={s} enter={0} exit={1} delay={0.5} style={{ position: 'absolute', left: '15vw', top: '40vh' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.4vw',
            color: EP_COLORS.muted,
            margin: 0,
          }}>
            Ever wonder why?
          </p>
        </ECE>

        {/* SHA-256 Pipeline — stays mounted, morph controls visibility */}
        <motion.div
          style={{ position: 'absolute', left: '8vw', top: '32vh' }}
          {...morph(s, {
            0: { opacity: 0, x: -30 },
            1: { opacity: 1, x: 0 },
            5: { opacity: 0 },
          }, EP_SPRINGS.reveal)}
        >
          <SHA256Pipe scene={s} showAttack={s >= 4} />
        </motion.div>

        {/* Scene 1 label */}
        <ECE s={s} enter={1} exit={2} delay={0.3} style={{ position: 'absolute', left: '8vw', top: '20vh' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6vw',
            fontWeight: 600,
            color: EP_COLORS.text,
          }}>
            SHA-256: the Merkle-Damg&#229;rd pipeline
          </span>
        </ECE>

        {/* Scene 2 label */}
        <ECE s={s} enter={2} exit={3} delay={0.4} style={{ position: 'absolute', left: '8vw', top: '20vh' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4vw',
            fontWeight: 600,
            color: EP_COLORS.text,
          }}>
            Data flows through. Each block compresses.
          </span>
        </ECE>

        {/* Scene 3 — the vulnerability revealed */}
        <ECE s={s} enter={3} exit={5} delay={0.3} style={{ position: 'absolute', left: '8vw', top: '20vh' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4vw',
            fontWeight: 600,
            color: EP_COLORS.highlight,
          }}>
            The output IS the internal state.
          </span>
        </ECE>

        <ECE s={s} enter={3} exit={5} delay={0.8} style={{ position: 'absolute', left: '8vw', top: '25vh' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1vw',
            color: EP_COLORS.muted,
          }}>
            An attacker who sees the hash can pick up exactly where it left off.
          </span>
        </ECE>

        {/* Scene 4 — length extension attack */}
        <ECE s={s} enter={4} exit={5} delay={0.6} style={{ position: 'absolute', left: '45vw', top: '56vh' }}>
          <div style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: EP_COLORS.danger + '15',
            border: `1px solid ${EP_COLORS.danger}40`,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3vw',
              fontWeight: 600,
              color: EP_COLORS.danger,
            }}>
              Length extension attack
            </span>
          </div>
        </ECE>

        {/* ════════════════════════════════════════════════════════
            ZONE B (100-180vw): Acts 2-3 — Sponge Tank
            ════════════════════════════════════════════════════════ */}

        {/* Sponge tank — mounts at scene 5, morph handles entrance */}
        {sceneRange(s, 5, 14) && (
          <motion.div
            style={{ position: 'absolute', left: '110vw', top: '8vh' }}
            initial={{ y: '80vh', opacity: 0 }}
            {...morph(s, {
              5: { y: 0, opacity: 1 },
              13: { y: 0, opacity: 1, scale: 1.02 },
            }, EP_SPRINGS.absorb)}
          >
            <SpongeCanvas
              mode={getSpongeMode(s)}
              width={480}
              height={700}
              showBounceGlow={s === 13}
            />

            {/* Waterline annotation overlay — inside tank's div */}
            {/* Labels hidden during scene 13 highlight — they overlap the gold text */}
            <WaterlineEffect
              width={480}
              height={700}
              showRate={sceneRange(s, 9, 13)}
              showCapacity={sceneRange(s, 10, 13)}
              showWaterlineLabel={sceneRange(s, 11, 13)}
              attackMode={s === 13}
              style={{ top: 0, left: 0 }}
            />
          </motion.div>
        )}

        {/* DataStream — absorb phase (scene 6) */}
        {sceneRange(s, 6, 7) && (
          <div style={{ position: 'absolute', left: '107vw', top: '5vh' }}>
            <DataStream scene={s} direction="down" charCount={12} />
          </div>
        )}

        {/* DataStream — squeeze phase (scene 8) */}
        {sceneRange(s, 8, 9) && (
          <div style={{ position: 'absolute', left: '107vw', top: '5vh' }}>
            <DataStream scene={s} direction="up" charCount={12} />
          </div>
        )}

        {/* Scene 5 — sponge introduction */}
        <ECE s={s} enter={5} exit={6} delay={0.8} style={{ position: 'absolute', left: '138vw', top: '28vh' }}>
          <div style={{ maxWidth: '25vw' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2vw',
              fontWeight: 700,
              color: EP_COLORS.waterline,
              margin: 0,
            }}>
              The Sponge
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.1vw',
              color: EP_COLORS.text,
              marginTop: 8,
              lineHeight: 1.5,
            }}>
              Keccak absorbs data in, squeezes output out.
            </p>
          </div>
        </ECE>

        {/* Scene 6 — absorb */}
        <ECE s={s} enter={6} exit={7} delay={0.4} style={{ position: 'absolute', left: '138vw', top: '22vh' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5vw',
              fontWeight: 600,
              color: EP_COLORS.rate,
              letterSpacing: 2,
              textTransform: 'uppercase' as const,
            }}>
              Absorb
            </span>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1vw',
              color: EP_COLORS.muted,
              marginTop: 4,
            }}>
              Data streams into the rate zone.
            </p>
          </div>
        </ECE>

        {/* Scene 7 — permute */}
        <ECE s={s} enter={7} exit={8} delay={0.4} style={{ position: 'absolute', left: '138vw', top: '32vh' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5vw',
              fontWeight: 600,
              color: EP_COLORS.accent,
              letterSpacing: 2,
              textTransform: 'uppercase' as const,
            }}>
              Permute
            </span>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1vw',
              color: EP_COLORS.muted,
              marginTop: 4,
            }}>
              All 1600 bits churn together.
            </p>
          </div>
        </ECE>

        {/* Scene 8 — squeeze */}
        <ECE s={s} enter={8} exit={9} delay={0.4} style={{ position: 'absolute', left: '138vw', top: '22vh' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5vw',
              fontWeight: 600,
              color: EP_COLORS.rateGlow,
              letterSpacing: 2,
              textTransform: 'uppercase' as const,
            }}>
              Squeeze
            </span>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1vw',
              color: EP_COLORS.muted,
              marginTop: 4,
            }}>
              Output rises from the rate zone only.
            </p>
          </div>
        </ECE>

        {/* Scene 9 — rate zone zoom */}
        <ECE s={s} enter={9} exit={10} delay={0.5} style={{ position: 'absolute', left: '138vw', top: '14vh' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1vw',
            color: EP_COLORS.text,
            maxWidth: '20vw',
            display: 'block',
            lineHeight: 1.5,
          }}>
            The rate zone is the surface the outside world touches.
            This is all an attacker can see.
          </span>
        </ECE>

        {/* Scene 10 — capacity zone zoom */}
        <ECE s={s} enter={10} exit={11} delay={0.5} style={{ position: 'absolute', left: '138vw', top: '50vh' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1vw',
            color: EP_COLORS.text,
            maxWidth: '20vw',
            display: 'block',
            lineHeight: 1.5,
          }}>
            But 512 bits churn below the surface.
            No output ever comes from here.
          </span>
        </ECE>

        {/* Scene 11 — waterline */}
        <ECE s={s} enter={11} exit={12} delay={0.5} style={{ position: 'absolute', left: '138vw', top: '34vh' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1vw',
            color: EP_COLORS.waterline,
            maxWidth: '20vw',
            display: 'block',
            lineHeight: 1.5,
          }}>
            The waterline is a structural boundary.
            Not a lock. Not encryption. Just geometry.
          </span>
        </ECE>

        {/* Scene 12 — why capacity defeats length extension */}
        {/* Moved left from 138vw → 134vw: at scale 1.3, 138vw puts right edge at 103.4vw (clipped) */}
        <ECE s={s} enter={12} exit={13} delay={0.4} style={{ position: 'absolute', left: '134vw', top: '18vh' }}>
          <div style={{ maxWidth: '20vw' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3vw',
              fontWeight: 600,
              color: EP_COLORS.highlight,
            }}>
              To continue hashing, you need the full state.
            </span>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1vw',
              color: EP_COLORS.muted,
              marginTop: 8,
              lineHeight: 1.5,
            }}>
              But the output only reveals the rate zone.
              The capacity is gone. Permanently.
            </p>
          </div>
        </ECE>

        {/* ── Scene 13: HIGHLIGHT — attack bounce + "512 bits" ── */}
        {/* HIGHLIGHT SCENE — GSAP-driven gold text */}
        {s === 13 && (
          <div
            ref={highlightRef}
            style={{
              position: 'absolute',
              left: '138vw',
              top: '24vh',
              zIndex: 10,
              maxWidth: '28vw',
            }}
          >
            <h2
              className="aha-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5vw',
                fontWeight: 700,
                color: EP_COLORS.highlight,
                textShadow: `0 0 30px ${EP_COLORS.highlight}40, 0 0 60px ${EP_COLORS.highlight}20`,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              512 bits the attacker
              <br />
              will never see.
            </h2>
            <p
              className="aha-subtitle"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1vw',
                color: EP_COLORS.text,
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              The output only exposes the rate zone.
            </p>
            <p
              className="aha-impossible"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9vw',
                color: EP_COLORS.danger,
                marginTop: 8,
                letterSpacing: 1,
              }}
            >
              Length extension is structurally impossible.
            </p>
          </div>
        )}

        {/* ── Shockwave ring at waterline during attack ── */}
        {s === 13 && (
          <motion.div
            style={{
              position: 'absolute',
              left: 'calc(110vw + 240px)',
              top: '52vh',
              width: 0,
              height: 0,
              borderRadius: '50%',
              border: `2px solid ${EP_COLORS.danger}`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
            animate={{
              width: [0, 300, 500],
              height: [0, 300, 500],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
          />
        )}

        {/* ════════════════════════════════════════════════════════
            ZONE C (190-270vw): Act 4 — Comparison + CTA
            ════════════════════════════════════════════════════════ */}

        {/* Comparison view — morph controls visibility */}
        <motion.div
          style={{
            position: 'absolute',
            left: '200vw',
            top: '15vh',
            width: '75vw',
            height: '65vh',
          }}
          {...morph(s, {
            0: { opacity: 0 },
            14: { opacity: 1 },
            16: { opacity: 0 },
          }, EP_SPRINGS.reveal)}
        >
          <ComparisonView
            scene={s}
            showLabels={s >= 15}
          />
        </motion.div>

        {/* Scene 14 header */}
        <ECE s={s} enter={14} exit={16} delay={0.3} style={{ position: 'absolute', left: '215vw', top: '5vh' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6vw',
            fontWeight: 600,
            color: EP_COLORS.text,
          }}>
            Two approaches. One problem.
          </span>
        </ECE>

        {/* Scene 16: CTA */}
        <ECE s={s} enter={16} style={{ position: 'absolute', left: '210vw', top: '30vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5vw',
              fontWeight: 700,
              color: EP_COLORS.text,
              margin: 0,
            }}>
              Bitcoin chose the patch.
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.2vw',
              color: EP_COLORS.muted,
              marginTop: 12,
            }}>
              SHA-3 was the cure.
            </p>
          </div>
        </ECE>

        <ECE s={s} enter={16} delay={0.8} style={{ position: 'absolute', left: '215vw', top: '52vh' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 8,
            background: EP_COLORS.orange + '20',
            border: `1.5px solid ${EP_COLORS.orange}60`,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2vw',
              fontWeight: 600,
              color: EP_COLORS.orange,
            }}>
              Follow @bitcoin_devs
            </span>
          </div>
        </ECE>

        {/* ── Ambient zone dividers ── */}
        <div style={{
          position: 'absolute',
          left: '95vw',
          top: 0,
          width: '10vw',
          height: '180vh',
          background: `linear-gradient(to right, ${EP_COLORS.bg}00, ${EP_COLORS.bgAlt}40, ${EP_COLORS.bg}00)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          left: '185vw',
          top: 0,
          width: '10vw',
          height: '180vh',
          background: `linear-gradient(to right, ${EP_COLORS.bg}00, ${EP_COLORS.bgAlt}40, ${EP_COLORS.bg}00)`,
          pointerEvents: 'none',
        }} />
      </Camera>

      <DevControls player={player} />

      {/* Ambient CSS animations */}
      <style>{`
        @keyframes ep8-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ep8-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
