/**
 * EP7: BIP 54 — The Great Consensus Cleanup
 *
 * 15 scenes (0-14), ~2:18 runtime. Panoramic bug-map layout (400vw × 280vh).
 * Camera explores 5 zones: Title → DifficultyStaircase → QuadraticValidator → Callbacks → Meta.
 *
 * Act 1 (0-6): Timewarp attack — deep dive with cascade collapse climax
 * Act 2 (7-9): Slow validation — quadratic blowup + fix
 * Act 3 (10-11): Quick callbacks to EP5/EP6
 * Act 4 (12-14): Meta-insight + final reveal
 */
import { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  useVideoPlayer,
  DevControls,
  Camera,
  focus,
  fitRect,
  createThemedCE,
  morph,
  useSceneGSAP,
  sceneRange,
} from '@/lib/video';
import type { CameraZone } from '@/lib/video';
import DifficultyStaircase from './DifficultyStaircase';
import QuadraticValidator from './QuadraticValidator';
import CallbackPanel from './CallbackPanel';
import ConsensusTimeline from './ConsensusTimeline';
import {
  EP_COLORS,
  EP_SPRINGS,
  EP7_CE_THEME,
  SCENE_DURATIONS,
  COLLAPSE_SEQUENCE,
} from './constants';

// ─── Themed CE (glitch-in for security episode) ─────────────────────
const ECE = createThemedCE(EP7_CE_THEME);

// ─── Camera zones ────────────────────────────────────────────────────
const ZONES: CameraZone[] = [
  { label: 'A — Title',    x: 0,   y: 0,   w: 80,  h: 60,  color: '#3b82f6' },
  { label: 'B — Staircase', x: 100, y: 0,   w: 180, h: 90,  color: '#ef4444' },
  { label: 'C — Quadratic', x: 0,   y: 120, w: 120, h: 80,  color: '#f472b6' },
  { label: 'D — Callbacks', x: 160, y: 120, w: 140, h: 80,  color: '#f97316' },
  { label: 'E — Meta',      x: 100, y: 230, w: 200, h: 50,  color: '#fde68a' },
];

// ─── Camera shots per scene ──────────────────────────────────────────
const SHOTS: Record<number, ReturnType<typeof focus>> = {
  0:  focus(40, 30, 1.0),       // Zone A — title
  1:  focus(40, 30, 1.3),       // Zone A — slight zoom
  2:  focus(190, 45, 1.2),      // Zone B — staircase healthy
  3:  focus(210, 45, 2.2),      // Zone B — boundary zoom TIGHT
  4:  focus(210, 45, 1.5),      // Zone B — attack, pull back slightly
  5:  focus(190, 50, 0.8),      // Zone B — CASCADE COLLAPSE, wide pull-back
  6:  focus(250, 45, 1.3),      // Zone B — fix, right edge
  7:  focus(60, 160, 1.0),      // Zone C — quadratic explain
  8:  focus(60, 160, 0.8),      // Zone C — split panel wide
  9:  focus(60, 160, 1.0),      // Zone C — fix pull-back
  10: focus(230, 160, 0.9),     // Zone D — 64-byte TX
  11: focus(230, 175, 0.95),    // Zone D — duplicate coinbase
  12: focus(200, 252, 0.85),    // Zone E — HIGHLIGHT
  13: focus(200, 252, 0.85),    // Zone E — reframe
  14: fitRect(0, 0, 400, 280, { pad: 5 }), // FINAL REVEAL — entire canvas
};

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  const titleRef = useRef<HTMLDivElement>(null);

  // GSAP for Zone A scene-specific animations
  useSceneGSAP(titleRef, s, {
    0: (tl) => {
      // Ghost zone outlines
      tl.from('.ghost-zone', {
        opacity: 0, stagger: 0.15, duration: 0.8,
      });
    },
    1: (tl) => {
      // Timeline bar draws in
      tl.from('.timeline-bar', {
        scaleX: 0, transformOrigin: 'left center',
        duration: 1.5, ease: 'power2.out',
      }, 0.4);
      // Block icons pop in
      tl.from('.block-icon', {
        scale: 0, stagger: 0.15, duration: 0.4,
        ease: 'back.out(1.7)',
      }, 1.0);
      // Red bug dots
      tl.from('.bug-dot', {
        scale: 0, stagger: 0.2, duration: 0.3,
        ease: 'back.out(2)',
      }, 3.5);
    },
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: EP_COLORS.bg }}
      data-video="ep7"
    >
      {/* ════════════════════════════════════════════════════════════════
          CAMERA — 400vw × 280vh panoramic canvas
          All visual components mounted at all times inside Camera
          ════════════════════════════════════════════════════════════════ */}
      <Camera
        scene={s}
        shots={SHOTS}
        width="400vw"
        height="280vh"
        zones={ZONES}
        transition={EP_SPRINGS.camera}
      >
        {/* ── Zone A: Title + Context (0,0 → 80,60) ── */}
        <div
          ref={titleRef}
          style={{
            position: 'absolute', left: '2vw', top: '5vh',
            width: '76vw', height: '50vh',
          }}
        >
          {/* Ghost zone outlines — hint at the bug map */}
          {ZONES.map((z, i) => (
            <div
              key={i}
              className="ghost-zone"
              style={{
                position: 'absolute',
                left: `${z.x * 0.18}vw`,
                top: `${z.y * 0.18}vh`,
                width: `${z.w * 0.18}vw`,
                height: `${z.h * 0.18}vh`,
                border: `1px solid ${EP_COLORS.muted}30`,
                borderRadius: '0.3vw',
                opacity: 0.3,
                animation: 'ghost-pulse 3s ease-in-out infinite',
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}

          {/* Timeline bar (Scene 1) */}
          <div
            className="timeline-bar"
            style={{
              position: 'absolute', top: '60%', left: '5%', width: '85%',
              height: '2px', background: EP_COLORS.muted,
            }}
          />

          {/* Block icons on timeline */}
          {['2009', '2012', '2015', '2017', '2021', '2026'].map((year, i) => (
            <div
              key={year}
              className="block-icon"
              style={{
                position: 'absolute',
                top: 'calc(60% - 1.2vh)',
                left: `${5 + i * 15.5}%`,
                width: '2.4vh', height: '2.4vh',
                background: EP_COLORS.difficulty,
                borderRadius: '0.3vh',
              }}
            >
              <span style={{
                position: 'absolute', top: '110%', left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.8vw', color: EP_COLORS.muted,
                fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
              }}>
                {year}
              </span>
            </div>
          ))}

          {/* Red bug dots */}
          {[18, 35, 55, 72].map((pos, i) => (
            <div
              key={i}
              className="bug-dot"
              style={{
                position: 'absolute',
                top: 'calc(60% + 2vh)',
                left: `${pos}%`,
                width: '1.5vh', height: '1.5vh',
                borderRadius: '50%',
                background: EP_COLORS.accent,
                animation: 'bug-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <span style={{
                position: 'absolute', top: '-1.8vh', left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.9vw', color: EP_COLORS.accent,
                fontFamily: 'var(--font-mono)',
              }}>
                ?
              </span>
            </div>
          ))}
        </div>

        {/* ── Zone B: DifficultyStaircase (100,0 → 280,90) ── */}
        <DifficultyStaircase
          scene={s}
          style={{
            position: 'absolute', left: '100vw', top: '0vh',
            width: '180vw', height: '90vh',
          }}
        />

        {/* ── Zone C: QuadraticValidator (0,120 → 120,200) ── */}
        <QuadraticValidator
          scene={s}
          style={{
            position: 'absolute', left: '0vw', top: '120vh',
            width: '120vw', height: '80vh',
          }}
        />

        {/* ── Zone D: CallbackPanels (160,120 → 300,200) ── */}
        <CallbackPanel
          scene={s}
          style={{
            position: 'absolute', left: '160vw', top: '120vh',
            width: '140vw', height: '80vh',
          }}
        />

        {/* ── Zone E: ConsensusTimeline (100,230 → 300,270) ── */}
        <ConsensusTimeline
          scene={s}
          style={{
            position: 'absolute', left: '100vw', top: '230vh',
            width: '200vw', height: '50vh',
          }}
        />
      </Camera>

      {/* ════════════════════════════════════════════════════════════════
          SCREEN-SPACE CAPTIONS — always visible, outside Camera
          ════════════════════════════════════════════════════════════════ */}

      {/* Scene 0: Title */}
      <ECE s={s} enter={0} exit={1} delay={0.3} style={{
        position: 'absolute', top: '25vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '4.5vw',
          fontWeight: 'bold', color: EP_COLORS.text,
          margin: 0,
        }}>
          4 bugs hiding in plain sight
        </h1>
      </ECE>

      <ECE s={s} enter={0} exit={1} delay={0.7} style={{
        position: 'absolute', top: '37vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.muted, margin: 0,
        }}>
          BIP 54: The Great Consensus Cleanup
        </p>
      </ECE>

      {/* Scene 0: Year badges */}
      <ECE s={s} enter={0} exit={1} delay={1.6} style={{
        position: 'absolute', top: '47vh', left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: '2vw',
      }}>
        {['2019 proposed', '2024 revised', '2025 merged'].map((badge, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.2vw',
              color: i === 2 ? EP_COLORS.fix : EP_COLORS.muted,
              padding: '0.3vh 0.8vw',
              border: `1px solid ${i === 2 ? EP_COLORS.fix : EP_COLORS.muted}40`,
              borderRadius: '0.3vw',
            }}
          >
            {badge}
          </span>
        ))}
      </ECE>

      {/* Scene 1: Context captions */}
      <ECE s={s} enter={1} exit={2} delay={0.8} style={{
        position: 'absolute', top: '20vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2.2vw',
          color: EP_COLORS.text, margin: 0,
        }}>
          Bitcoin's rules haven't changed much in 15 years.
        </p>
      </ECE>

      <ECE s={s} enter={1} exit={2} delay={3.5} style={{
        position: 'absolute', top: '28vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2.2vw',
          color: EP_COLORS.accent, margin: 0,
        }}>
          But 4 bugs have been sitting in those rules since day one.
        </p>
      </ECE>

      {/* Scene 2: Difficulty explanation */}
      <ECE s={s} enter={2} exit={3} delay={4.0} style={{
        position: 'absolute', bottom: '8vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.text, margin: 0,
        }}>
          Every 2,016 blocks, Bitcoin adjusts the difficulty.
        </p>
      </ECE>

      {/* Scene 3: Boundary */}
      <ECE s={s} enter={3} exit={4} delay={1.5} style={{
        position: 'absolute', top: '12vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.5vw',
          fontWeight: 'bold', color: EP_COLORS.text, margin: 0,
        }}>
          One block wears two hats.
        </h2>
      </ECE>

      <ECE s={s} enter={3} exit={4} delay={3.5} style={{
        position: 'absolute', bottom: '10vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '1.8vw',
          color: EP_COLORS.highlight, margin: 0,
        }}>
          This block's timestamp controls the difficulty math.
        </p>
      </ECE>

      {/* Scene 4: Attack */}
      <ECE s={s} enter={4} exit={5} delay={4.0} style={{
        position: 'absolute', bottom: '8vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.accent, margin: 0, fontWeight: 'bold',
        }}>
          Lie about the time. Difficulty drops.
        </p>
      </ECE>

      {/* Scene 5: Collapse — running counter in screen space */}
      <ECE s={s} enter={5} exit={6} delay={1.5} style={{
        position: 'absolute', top: '6vh', right: '4vw',
        textAlign: 'right', zIndex: 10,
      }}>
        <RunningCounter scene={s} />
      </ECE>

      <ECE s={s} enter={5} exit={6} delay={5.0} style={{
        position: 'absolute', bottom: '8vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.text, margin: 0,
        }}>
          A 51% attack that feeds itself.
        </p>
      </ECE>

      {/* Scene 6: Fix */}
      <ECE s={s} enter={6} exit={7} delay={3.0} style={{
        position: 'absolute', bottom: '12vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '2.5vw',
          fontWeight: 'bold', color: EP_COLORS.fix, margin: 0,
        }}>
          One rule. Problem solved.
        </p>
      </ECE>

      {/* Scene 7: Quadratic explanation */}
      <ECE s={s} enter={7} exit={8} delay={3.5} style={{
        position: 'absolute', bottom: '8vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.text, margin: 0,
        }}>
          Double the signatures, quadruple the work.
        </p>
      </ECE>

      {/* Scene 8: Split panel */}
      <ECE s={s} enter={8} exit={9} delay={4.5} style={{
        position: 'absolute', bottom: '6vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.highlight, margin: 0,
        }}>
          One crafted transaction. One hour to validate.
        </p>
      </ECE>

      {/* Scene 9: Validation fix */}
      <ECE s={s} enter={9} exit={10} delay={2.5} style={{
        position: 'absolute', bottom: '10vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2vw',
          fontWeight: 'bold', color: EP_COLORS.fix, margin: 0,
        }}>
          Cap the operations. Fixed.
        </p>
      </ECE>

      {/* Scene 12: Highlight */}
      <ECE s={s} enter={12} exit={13} delay={4.5} style={{
        position: 'absolute', top: '8vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '3vw',
          fontWeight: 'bold', color: EP_COLORS.highlight, margin: 0,
        }}>
          4 bugs. 4 one-liners.
        </h2>
      </ECE>

      <ECE s={s} enter={12} exit={13} delay={6.5} style={{
        position: 'absolute', top: '16vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '3vw',
          fontWeight: 'bold', color: EP_COLORS.highlight, margin: 0,
        }}>
          7+ years and counting.
        </h2>
      </ECE>

      {/* Scene 13: Reframe */}
      <ECE s={s} enter={13} exit={14} delay={4.5} style={{
        position: 'absolute', bottom: '10vh', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '2vw',
          color: EP_COLORS.highlight, margin: 0,
        }}>
          Bitcoin's slowness IS its security property.
        </p>
      </ECE>

      {/* Scene 14: CTA overlay */}
      {sceneRange(s, 14, 14) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.5 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(8px)',
            padding: '4vh 6vw', borderRadius: '1.5vw',
            textAlign: 'center', zIndex: 20,
          }}
        >
          {/* Brand accent bars */}
          <div style={{
            width: '60%', height: '2px', background: '#EB5234',
            margin: '0 auto 2vh',
          }} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '3vw',
            fontWeight: 'bold', color: EP_COLORS.text, margin: 0,
          }}>
            Follow @bitcoin_devs
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '1.8vw',
            color: EP_COLORS.highlight, margin: '1.5vh 0 0',
          }}>
            BIP 54 — The Cleanup Bitcoin Needs
          </p>
          <div style={{
            width: '60%', height: '2px', background: '#EB5234',
            margin: '2vh auto 0',
          }} />
        </motion.div>
      )}

      {/* Final scene zone labels */}
      {sceneRange(s, 14, 14) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}
        >
          {['Timewarp', 'Slow Validation', '64-byte TX', 'Duplicate Coinbase', 'The Cleanup'].map((label, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: `${[20, 58, 58, 58, 82][i]}%`,
                left: `${[15, 15, 55, 75, 55][i]}%`,
                fontFamily: 'var(--font-mono)', fontSize: '1vw',
                color: EP_COLORS.text, opacity: 0.5,
              }}
            >
              {label}
            </span>
          ))}
        </motion.div>
      )}

      {/* Ambient CSS animations */}
      <style>{`
        @keyframes ghost-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes bug-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

      <DevControls player={player} />
    </div>
  );
}

// ─── Running counter for Scene 5 collapse ────────────────────────────
function RunningCounter({ scene }: { scene: number }) {
  const isCollapse = scene === 5;
  if (!isCollapse) return null;

  return (
    <div style={{ fontFamily: 'var(--font-mono)' }}>
      {COLLAPSE_SEQUENCE.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 1.5 + 0.5, duration: 0.3 }}
          style={{
            fontSize: i === COLLAPSE_SEQUENCE.length - 1 ? '2.2vw' : '1.5vw',
            color: i === COLLAPSE_SEQUENCE.length - 1 ? '#FF0000' : EP_COLORS.accent,
            fontWeight: i === COLLAPSE_SEQUENCE.length - 1 ? 'bold' : 'normal',
            marginBottom: '0.5vh',
          }}
        >
          {step.label}
        </motion.div>
      ))}
    </div>
  );
}
