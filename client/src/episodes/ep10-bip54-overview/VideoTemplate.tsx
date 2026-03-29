/**
 * Episode 10: BIP 54 — The 4 Bugs Bitcoin Never Fixed
 *
 * Single-canvas architecture with Camera for pan/zoom across two zones:
 *   Zone A (0-95vw): DiagnosticConsole — 2×2 bug grid
 *   Zone B (105-250vw): TimelineJourney — proposal history
 *
 * Canvas: 250vw × 200vh
 * 13 scenes (indices 0-12), ~107s runtime, 3 acts:
 *   Act 1 (Scenes 0-6):   Console boot → rapid bug scan → all red
 *   Act 2 (Scenes 7-8):   Timeline reveal → stall → revival
 *   Act 3 (Scenes 9-12):  Twist → highlight → resolution → CTA
 *
 * ─── POSITION AUDIT ────────────────────────────────────────────────
 * Formula: screen = canvas × scale + camera
 *
 * Grid positions (at 1920×1080):
 *   Console frame: (5vw, 5vh), 90vw × 90vh
 *   Grid area: (7vw, 10vh), 86vw × 80vh, gap 1.5vh
 *   TL cell: (7, 10)    → center (28.3, 29.6)   size 42.6vw × 39.3vh
 *   TR cell: (50.4, 10) → center (71.7, 29.6)   size 42.6vw × 39.3vh
 *   BL cell: (7, 50.8)  → center (28.3, 70.4)   size 42.6vw × 39.3vh
 *   BR cell: (50.4, 50.8) → center (71.7, 70.4) size 42.6vw × 39.3vh
 *
 * Scene 0-1: camera(0, 0, 1)
 *   Console at (5,5) → screen(5,5) ✓  right edge 95vw ✓  bottom 95vh ✓
 *
 * Scene 2: camera(-12vw, -15vh, 2.2) — TL quadrant
 *   TL left edge:  7×2.2 + (-12) = 3.4vw ✓
 *   TL right edge: 49.6×2.2 + (-12) = 97.1vw ✓
 *   TL top:        10×2.2 + (-15) = 7vh ✓
 *   TL bottom:     49.3×2.2 + (-15) = 93.5vh ✓
 *
 * Scene 3: camera(-108vw, -15vh, 2.2) — TR quadrant
 *   TR left edge:  50.4×2.2 + (-108) = 2.9vw ✓
 *   TR right edge: 93×2.2 + (-108) = 96.6vw ✓
 *   TR top/bottom: same as scene 2 ✓
 *
 * Scene 4: camera(-12vw, -105vh, 2.2) — BL quadrant
 *   BL left/right: same as scene 2 ✓
 *   BL top:        50.8×2.2 + (-105) = 6.8vh ✓
 *   BL bottom:     90.1×2.2 + (-105) = 93.2vh ✓
 *
 * Scene 5: camera(-108vw, -105vh, 2.2) — BR quadrant
 *   BR left/right: same as scene 3 ✓
 *   BR top/bottom: same as scene 4 ✓
 *
 * Scene 6: camera(0, 0, 1) — full console, same as scene 0 ✓
 *
 * Scene 7: camera(0, 22vh, 0.55) — wide shot
 *   Console center (50,50) → screen(27.5, 49.5) ✓
 *   Console left 5×0.55 = 2.75 ✓   right 95×0.55 = 52.25 ✓
 *   Timeline start 105×0.55 = 57.75 ✓
 *   Timeline at 175vw → screen 96.25 ✓
 *   Vertical: 5×0.55+22 = 24.75 top, 95×0.55+22 = 74.25 bottom ✓
 *
 * Scene 8: camera(-74vw, 15vh, 0.7) — timeline focus
 *   2009 (115vw): 115×0.7 - 74 = 6.5vw ✓
 *   2017 (145vw): 145×0.7 - 74 = 27.5vw ✓
 *   2019 (175vw): 175×0.7 - 74 = 48.5vw ✓ (near center)
 *   2024 (220vw): 220×0.7 - 74 = 80vw ✓
 *   2025 (240vw): 240×0.7 - 74 = 94vw ✓
 *   Vertical: 15×0.7+15 = 25.5 top, 85×0.7+15 = 74.5 bottom ✓
 *
 * Scene 9: camera(-29vw, -33vh, 2.8) — TL tight zoom (twist)
 *   TL center (28.3,29.6) → screen(28.3×2.8-29, 29.6×2.8-33) = (50.2, 49.9) ✓ centered
 *   Edges clipped ~10vw each side (intentional dramatic close-up)
 *
 * Scene 10: camera(-12vw, -15vh, 2.2) — TL at 2.2 (same as scene 2) ✓
 *
 * Scene 11: camera(0, 0, 1) — full console ✓
 *
 * Scene 12: camera(-3vw, 30vh, 0.4) — extra-wide CTA shot
 *   Console left (5vw): 5×0.4 - 3 = -1vw (1vw clip, negligible — border at 5vw anyway)
 *   Console right (95vw): 95×0.4 - 3 = 35vw ✓
 *   Console top: 5×0.4 + 30 = 32vh ✓   bottom: 95×0.4 + 30 = 68vh ✓
 *   Timeline 2009 (115vw): 115×0.4 - 3 = 43vw ✓
 *   Timeline 2019 (175vw): 175×0.4 - 3 = 67vw ✓
 *   Timeline 2025 (240vw): 240×0.4 - 3 = 93vw ✓ (ALL nodes visible)
 *   Gap between zones: console ends at 35vw, timeline starts at 43vw — clean separation ✓
 * ────────────────────────────────────────────────────────────────────
 */

import { motion } from 'framer-motion';
import { useVideoPlayer, DevControls, Camera, morph, sceneRange } from '@/lib/video';
import { ECE, EP_COLORS, EP_SPRINGS, SCENE_DURATIONS, CAMERA_SHOTS } from './constants';
import DiagnosticConsole from './DiagnosticConsole';
import TimelineJourney from './TimelineJourney';

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  // Camera transition speed changes by act
  const cameraTransition =
    s === 9
      ? EP_SPRINGS.alert     // Snap for twist
      : s >= 7 && s <= 8
        ? EP_SPRINGS.camera   // Slow cinematic for timeline
        : s >= 2 && s <= 5
          ? EP_SPRINGS.diagnostic // Methodical for bug scan
          : s === 11
            ? EP_SPRINGS.resolve  // Satisfying settle for resolution
            : EP_SPRINGS.camera;  // Default cinematic

  // Derive bug count for the persistent counter
  const bugCount = s <= 1 ? 0 : s <= 5 ? s - 1 : 4;
  const allFixed = s >= 11;

  return (
    <div
      data-video="ep10"
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: EP_COLORS.bg }}
    >
      {/* ─── Background mood glow — stacked colored layers with opacity morph ─── */}
      {/* Framer Motion can't interpolate gradient strings, so each color is a
          separate layer whose opacity is driven by morph(). */}
      {([
        { color: EP_COLORS.cyan, scenes: { 0: 0, 1: 0.15, 2: 0, 7: 0.1, 9: 0, 12: 0 } },
        { color: EP_COLORS.red, scenes: { 0: 0, 2: 0.2, 6: 0.25, 7: 0, 9: 0 } },
        { color: EP_COLORS.amber, scenes: { 0: 0, 9: 0.3, 11: 0 } },
        { color: EP_COLORS.green, scenes: { 0: 0, 11: 0.2 } },
      ] as const).map(({ color, scenes }, i) => (
        <motion.div
          key={i}
          {...morph(s,
            Object.fromEntries(Object.entries(scenes).map(([k, v]) => [k, { opacity: v }])),
            { duration: 1.2, ease: 'easeInOut' },
          )}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${color}30, transparent)`,
          }}
        />
      ))}

      {/* ─── Camera wrapping both zones ─── */}
      <Camera
        scene={s}
        shots={CAMERA_SHOTS}
        width="250vw"
        height="200vh"
        transition={cameraTransition}
      >
        {/* Zone A: Diagnostic Console (0-95vw) */}
        <DiagnosticConsole scene={s} />

        {/* Zone B: Timeline Journey (105-250vw) */}
        <TimelineJourney scene={s} />
      </Camera>

      {/* ─── Persistent vulnerability counter (top-right, above Camera) ─── */}
      {sceneRange(s, 1, 12) && (
        <motion.div
          {...morph(s, {
            1: { opacity: 0.7, x: 0 },
            2: { opacity: 1, x: 0 },
            7: { opacity: 0.5, x: 0 },
            9: { opacity: 1, x: 0 },
            11: { opacity: 0.9, x: 0 },
          }, EP_SPRINGS.diagnostic)}
          style={{
            position: 'absolute',
            top: '2.5vh',
            right: '2.5vw',
            display: 'flex',
            alignItems: 'center',
            gap: '1vw',
            padding: '0.8vh 1.5vw',
            borderRadius: '0.8vh',
            background: `${EP_COLORS.panelBg}d0`,
            border: `1px solid ${allFixed ? EP_COLORS.green : bugCount > 0 ? EP_COLORS.red : EP_COLORS.steel}40`,
            zIndex: 70,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Bug count dots */}
          <div style={{ display: 'flex', gap: '0.5vw' }}>
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{
                  background: allFixed
                    ? EP_COLORS.green
                    : i < bugCount
                      ? EP_COLORS.red
                      : EP_COLORS.dim,
                  boxShadow: allFixed
                    ? `0 0 6px ${EP_COLORS.green}80`
                    : i < bugCount
                      ? `0 0 6px ${EP_COLORS.red}80`
                      : 'none',
                }}
                transition={EP_SPRINGS.diagnostic}
                style={{
                  width: '1vh',
                  height: '1vh',
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.3vh',
            letterSpacing: '0.1em',
            color: allFixed ? EP_COLORS.green : bugCount > 0 ? EP_COLORS.red : EP_COLORS.muted,
            fontWeight: 600,
          }}>
            {allFixed ? 'ALL PATCHED' : `${bugCount}/4 DETECTED`}
          </span>
        </motion.div>
      )}

      {/* ─── Text Overlays (fixed to viewport, above Camera) ─── */}

      {/* Scene 0: Title */}
      <ECE s={s} enter={0} exit={1} delay={0.8} style={{
        position: 'absolute',
        top: '33vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '5.5vh',
          fontWeight: 700,
          color: EP_COLORS.text,
          letterSpacing: '0.04em',
          lineHeight: 1.2,
        }}>
          The 4 Bugs Bitcoin<br />Never Fixed
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2vh',
          color: EP_COLORS.cyan,
          marginTop: '2.5vh',
          letterSpacing: '0.15em',
        }}>
          BIP 54 — GREAT CONSENSUS CLEANUP
        </p>
      </ECE>

      {/* Scene 1: Scan begins */}
      <ECE s={s} enter={1} exit={2} delay={0.3} style={{
        position: 'absolute',
        bottom: '12vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3vh',
          fontWeight: 600,
          color: EP_COLORS.text,
          textAlign: 'center',
        }}>
          4 bugs have lived in Bitcoin since 2009
        </p>
      </ECE>

      {/* Scenes 2-5: Bug labels (during quadrant zooms) — progressive reveal */}
      {[
        { enter: 2, label: 'Bug #1', name: 'Timewarp Attack', detail: 'Difficulty drops to zero in 38 days' },
        { enter: 3, label: 'Bug #2', name: 'Block Validation DoS', detail: 'One block stalls a node for 1.5 hours' },
        { enter: 4, label: 'Bug #3', name: 'Merkle Ambiguity', detail: '64-byte TX fakes a tree node' },
        { enter: 5, label: 'Bug #4', name: 'Coinbase Collision', detail: 'Duplicate TXIDs at block 1,983,702' },
      ].map(({ enter, label, name, detail }) => (
        <ECE key={enter} s={s} enter={enter} exit={enter + 1} delay={0.4} style={{
          position: 'absolute',
          bottom: '6vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 60,
        }}>
          <span style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4vh',
            color: EP_COLORS.red,
            letterSpacing: '0.2em',
            fontWeight: 700,
          }}>
            {label}
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5vh',
            fontWeight: 700,
            color: EP_COLORS.text,
            marginTop: '0.5vh',
          }}>
            {name}
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '2vh',
            color: EP_COLORS.muted,
            marginTop: '0.5vh',
          }}>
            {detail}
          </p>
        </ECE>
      ))}

      {/* Scene 6: All red summary */}
      <ECE s={s} enter={6} exit={7} delay={0.3} style={{
        position: 'absolute',
        bottom: '10vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5vh',
          fontWeight: 700,
          color: EP_COLORS.red,
        }}>
          Nobody has fixed them. Why?
        </h2>
      </ECE>

      {/* Scene 7: Timeline transition text */}
      <ECE s={s} enter={7} exit={8} delay={0.5} style={{
        position: 'absolute',
        top: '6vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5vh',
          fontWeight: 600,
          color: EP_COLORS.cyan,
        }}>
          2019: Matt Corallo proposes a fix
        </p>
      </ECE>

      {/* Scene 8: Stall + Revival (merged per director) */}
      <ECE s={s} enter={8} exit={9} delay={0.3} style={{
        position: 'absolute',
        top: '5vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.8vh',
          fontWeight: 600,
          color: EP_COLORS.text,
        }}>
          The proposal stalls for 5 years
        </p>
      </ECE>
      {/* Second line appears 3s later for progressive reveal */}
      <ECE s={s} enter={8} exit={9} delay={3.5} style={{
        position: 'absolute',
        top: '10vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          color: EP_COLORS.amber,
        }}>
          2024: Antoine Poinsot revives it with fresh eyes
        </p>
      </ECE>

      {/* Scene 9: Twist — camera snaps back */}
      <ECE s={s} enter={9} exit={10} delay={0.3} style={{
        position: 'absolute',
        bottom: '6vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.8vh',
          fontWeight: 700,
          color: EP_COLORS.amber,
        }}>
          But reviewing the timewarp fix...
        </p>
      </ECE>

      {/* Scene 10: HIGHLIGHT SCENE — the aha moment */}
      {/* HIGHLIGHT SCENE */}
      {sceneRange(s, 10, 11) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${EP_COLORS.amber}20 0%, transparent 70%)`,
            zIndex: 55,
            pointerEvents: 'none',
          }}
        />
      )}
      <ECE s={s} enter={10} exit={11} delay={0.4} style={{
        position: 'absolute',
        bottom: '4vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
        maxWidth: '80vw',
      }}>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.4vh',
          color: EP_COLORS.amber,
          letterSpacing: '0.2em',
          fontWeight: 700,
        }}>
          MURCH-ZAWY DISCOVERY
        </span>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4vh',
          fontWeight: 700,
          color: EP_COLORS.text,
          marginTop: '0.6vh',
          lineHeight: 1.2,
        }}>
          The fix revealed a bug nobody knew about
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          color: EP_COLORS.amber,
          marginTop: '0.8vh',
        }}>
          A second timewarp variant — hidden for 15 years
        </p>
      </ECE>

      {/* Scene 11: Resolution */}
      <ECE s={s} enter={11} exit={12} delay={0.4} style={{
        position: 'absolute',
        bottom: '8vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5vh',
          fontWeight: 700,
          color: EP_COLORS.green,
        }}>
          The delay was a feature, not a failure
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '2vh',
          color: EP_COLORS.muted,
          marginTop: '0.5vh',
        }}>
          BIP 54 patches all five vulnerabilities
        </p>
      </ECE>

      {/* Scene 12: CTA */}
      <ECE s={s} enter={12} delay={0.5} style={{
        position: 'absolute',
        bottom: '15vh',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 60,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3vh',
          fontWeight: 700,
          color: EP_COLORS.orange,
        }}>
          Follow @Bitcoin_Devs
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.8vh',
          color: EP_COLORS.muted,
          marginTop: '0.8vh',
        }}>
          Next: How the timewarp attack actually works
        </p>
      </ECE>

      <DevControls player={player} />
    </div>
  );
}
