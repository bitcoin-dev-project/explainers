/**
 * EP9 — Worst-Case Block Validation ("The Meltdown")
 *
 * Three-act structure on a 300vw × 140vh zoned canvas:
 *   Zone A (0–90vw):     Act 1 — Normal validation (boring, clinical)
 *   Zone B (100–200vw):  Act 2 — The quadratic attack (meltdown)
 *   Zone C (210–290vw):  Act 3 — BIP 54 fix (relief)
 *
 * Canvas zones with 20vw gaps to prevent cross-zone bleed:
 *   Zone A: 0–90vw    (components: BlockAnatomy, small heatmap)
 *   Gap:    90–100vw
 *   Zone B: 100–200vw (components: big HeatmapCanvas, SigopsCounter)
 *   Gap:    200–210vw
 *   Zone C: 210–290vw (components: MinerRace at top, BIP54/Before-After below)
 *
 * POSITION AUDIT — verify every scene's content is within viewport
 * Formula: screen = canvas × scale + camera
 * Viewport: 0 ≤ screen_x ≤ 100vw, 0 ≤ screen_y ≤ 100vh
 *
 * Scene 0: camera(0, 0, 1) — Title
 *   Title at (15vw, 25vh) → screen(15, 25) ✓
 *   Subtitle at (15vw, 52vh) → screen(15, 52) ✓
 *   Zone B at 105vw → screen(105) off-screen right ✓
 *
 * Scene 1: camera(-5vw, -5vh, 1.3) — Block assembles
 *   BlockAnatomy at (8vw, 15vh) → screen(8×1.3-5, 15×1.3-5) = (5.4, 14.5) ✓
 *   Width 38vw×1.3=49.4vw → right edge 5.4+49.4=54.8vw ✓
 *   Height ~35vh×1.3=45.5vh → bottom 14.5+45.5=60vh ✓
 *
 * Scene 2: camera(-10vw, -8vh, 1.5) — Sig checks zoom
 *   BlockAnatomy morphed x=-2vw → canvas ~6vw → screen(6×1.5-10, 15×1.5-8) = (-1, 14.5)
 *   Left edge -1vw (intentional tight zoom). Right edge (6+38)×1.5-10=56vw ✓
 *   Sig-check text at (42vw, 60vh) → screen(42×1.5-10, 60×1.5-8) = (53, 82) ✓
 *   Text maxWidth 30vw → right edge (42+30)×1.5-10 = 98vw ✓
 *
 * Scene 3: camera(-25vw, -5vh, 1.2) — Small heatmap
 *   Small HeatmapCanvas at (50vw, 20vh) → screen(50×1.2-25, 20×1.2-5) = (35, 19) ✓
 *   Width 35vw×1.2=42vw → right edge 35+42=77vw ✓
 *   "Normal block" text at (50vw, 50vh) → screen(35, 55) ✓
 *   BlockAnatomy (opacity 0.6, fading) at ~3vw → screen(3×1.2-25) = -21.4vw (retreating left) ✓
 *
 * Scene 4: camera(-95vw, -5vh, 1) — Pan to Zone B
 *   "What if..." at (105vw, 35vh) → screen(10, 30) ✓
 *   Subtitle at (105vw, 55vh) → screen(10, 50) ✓
 *   Zone A at 50vw → screen(-45) off-screen left ✓
 *
 * Scene 5: camera(-95vw, -5vh, 1) — HIGHLIGHT: heatmap explodes
 *   HeatmapCanvas at (105vw, 10vh) → screen(10, 5) ✓
 *   Width 65vw → right edge (105+65)-95=75vw ✓
 *   SigopsCounter at (152vw, 12vh) → screen(152-95, 12-5) = (57, 7) ✓
 *   Counter ~18vw wide → right edge 75vw ✓
 *
 * Scene 6: camera(-100vw, -8vh, 1.15) — Meltdown closeup
 *   HeatmapCanvas at (105vw, 10vh) → screen(105×1.15-100, 10×1.15-8) = (20.75, 3.5) ✓
 *   Right edge (105+65)×1.15-100 = 95.5vw ✓ tight
 *   SigopsCounter at (152vw, 12vh) → screen(152×1.15-100, 12×1.15-8) = (74.8, 5.8) ✓
 *   Counter right edge ~74.8+18×1.15=95.5vw ✓
 *   Meltdown overlay at (120vw, 28vh) → screen(120×1.15-100, 28×1.15-8) = (38, 24.2) ✓
 *   O(n²) text at (105vw, 62vh) → screen(20.75, 63.3) ✓
 *
 * Scene 7: camera(-210vw, -5vh, 1) — Miner race intro
 *   MinerRace at (215vw, 10vh) → screen(5, 5) ✓
 *   Width 65vw → right edge 70vw ✓, height 50vh → bottom 55vh ✓
 *   Zone B heatmap at 105vw → screen(-105) off-screen ✓
 *
 * Scene 8: camera(-210vw, -5vh, 1) — Squeeze
 *   Same framing as scene 7. GSAP animates lane divider ✓
 *
 * Scene 9: camera(-210vw, -65vh, 1) — BIP 54 intro
 *   BIP 54 text at (215vw, 80vh) → screen(5, 15) ✓
 *   MinerRace bottom at 60vh → screen(60-65) = -5vh OFF-SCREEN ✓ no bleed
 *   Before/After at (220vw, 85vh) ECE enter=11 → NOT visible ✓
 *
 * Scene 10: camera(-100vw, -5vh, 1.1) — Capped heatmap
 *   HeatmapCanvas at (105vw, 10vh) → screen(105×1.1-100, 10×1.1-5) = (15.5, 6) ✓
 *   Right edge (170)×1.1-100=87vw ✓
 *   SigopsCounter at (152vw, 12vh) → screen(152×1.1-100, 12×1.1-5) = (67.2, 8.2) ✓
 *   Cap text at (105vw, 60vh) → screen(15.5, 61) ✓
 *
 * Scene 11: camera(-210vw, -70vh, 1) — Before/After
 *   Before/After at (220vw, 85vh) → screen(10, 15) ✓
 *   "40× faster" at (235vw, 100vh) → screen(25, 30) ✓
 *   MinerRace bottom at 60vh → screen(60-70) = -10vh OFF-SCREEN ✓ no bleed
 *   BIP54 text at (215, 80) ECE exit=10 → NOT visible ✓
 *
 * Scene 12: camera(-210vw, -5vh, 1) — Equalized race
 *   MinerRace at (215vw, 10vh) → screen(5, 5) ✓
 *   Before/After ECE exit=12 → NOT visible ✓
 *
 * Scene 13: camera(0, 0, 0.5) — CTA pullback
 *   CTA at (115vw, 45vh) → screen(115×0.5, 45×0.5) = (57.5, 22.5) ✓
 *   Zone C MinerRace at 215vw → screen(107.5) off-screen right ✓
 *   All other ECE elements exited ✓
 */

import { useVideoPlayer, DevControls, Camera, sceneRange } from '@/lib/video';
import { motion } from 'framer-motion';
import { morph } from '@/lib/video/canvas';
import HeatmapCanvas from './HeatmapCanvas';
import type { HeatmapMode } from './HeatmapCanvas';
import BlockAnatomy from './BlockAnatomy';
import MinerRace from './MinerRace';
import SigopsCounter from './SigopsCounter';
import ScanlineOverlay from './ScanlineOverlay';
import { EP_COLORS, EP_SPRINGS, ECE, SCENE_DURATIONS } from './constants';

// ─── Camera Shots ──────────────────────────────────────────────────

const SHOTS = {
  0: { x: 0, y: 0, scale: 1 },                             // Wide Zone A — title
  1: { x: '-5vw', y: '-5vh', scale: 1.3 },                  // Zoom into block
  2: { x: '-10vw', y: '-8vh', scale: 1.5 },                 // Tighter on sigs
  3: { x: '-25vw', y: '-5vh', scale: 1.2 },                 // Pan right to mini heatmap
  4: { x: '-95vw', y: '-5vh', scale: 1 },                   // Pan to Zone B
  5: { x: '-95vw', y: '-5vh', scale: 1 },                   // HIGHLIGHT — heatmap explodes
  6: { x: '-100vw', y: '-8vh', scale: 1.15 },               // Closer on meltdown
  7: { x: '-210vw', y: '-5vh', scale: 1 },                  // Pan to Zone C — miner race
  8: { x: '-210vw', y: '-5vh', scale: 1 },                  // Squeeze continues
  9: { x: '-210vw', y: '-65vh', scale: 1 },                 // Pan down — BIP 54 intro (below MinerRace bottom at 60vh)
  10: { x: '-100vw', y: '-5vh', scale: 1.1 },               // Back to Zone B — capped heatmap
  11: { x: '-210vw', y: '-70vh', scale: 1 },                // Before/after numbers (below MinerRace bottom at 60vh)
  12: { x: '-210vw', y: '-5vh', scale: 1 },                 // Miner race equalized
  13: { x: 0, y: 0, scale: 0.5 },                           // Pull back — CTA
};

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  // ─── Derive heatmap modes from scene ─────────────────────
  const smallHeatmapMode: HeatmapMode = s >= 3 && s < 4 ? 'linear' : 'idle';
  const bigHeatmapMode: HeatmapMode =
    s >= 10 ? 'capped' :
    s >= 5 ? 'quadratic' :
    s >= 4 ? 'linear' :
    'idle';
  const counterMode = bigHeatmapMode;

  // ─── Mood for atmospheric overlay ────────────────────────
  const mood: 'calm' | 'danger' | 'safe' =
    s >= 9 ? 'safe' :
    s >= 5 ? 'danger' :
    'calm';

  // Background gradient shifts with mood
  const bgColor = s >= 9 ? '#081820' : s >= 5 ? '#12081a' : EP_COLORS.bg;

  return (
    <div
      data-video="ep9"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: bgColor,
        transition: 'background 1.5s ease',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Atmospheric scanlines — always on */}
      <ScanlineOverlay mood={mood} />

      <Camera
        scene={s}
        shots={SHOTS}
        width="300vw"
        height="140vh"
        transition={EP_SPRINGS.camera}
      >
        {/* ═══════════════════════════════════════════════════════════
            ZONE A: Act 1 — Normal Validation (0–90vw)
            ═══════════════════════════════════════════════════════════ */}

        {/* Scene 0: Title */}
        <ECE s={s} enter={0} exit={1} style={{ position: 'absolute', left: '15vw', top: '25vh' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '4vw',
            fontWeight: 700,
            color: EP_COLORS.textBright,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            Worst-Case<br />Block Validation
          </h1>
        </ECE>

        <ECE s={s} enter={0} exit={1} delay={0.5} style={{ position: 'absolute', left: '15vw', top: '52vh' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2vw',
            color: EP_COLORS.hot,
            display: 'flex',
            alignItems: 'center',
            gap: '1.5vw',
          }}>
            <span style={{ color: EP_COLORS.warm }}>100ms</span>
            <span style={{ color: EP_COLORS.textMuted, fontSize: '1.5vw' }}>vs</span>
            <span style={{ color: EP_COLORS.critical }}>10 hours</span>
          </div>
        </ECE>

        {/* Scene 1-2: Block anatomy */}
        <BlockAnatomy scene={s} />

        {/* Scene 2: Supporting text for sig checks */}
        <ECE s={s} enter={2} exit={4} delay={0.8} style={{ position: 'absolute', left: '42vw', top: '60vh' }}>
          <p style={{
            color: EP_COLORS.text,
            fontSize: '1.3vw',
            fontFamily: 'var(--font-body)',
            maxWidth: '30vw',
            lineHeight: 1.5,
          }}>
            Each input re-hashes the <em>entire</em> transaction.
            <br />
            <span style={{ color: EP_COLORS.textMuted, fontSize: '1vw' }}>
              More inputs = more work. Linearly... right?
            </span>
          </p>
        </ECE>

        {/* Scene 3: Small heatmap — normal validation */}
        {sceneRange(s, 3, 5) && (
          <motion.div
            {...morph(s, {
              3: { opacity: 1, scale: 1 },
              4: { opacity: 0, scale: 0.8 },
            })}
            style={{ position: 'absolute', left: '50vw', top: '20vh' }}
          >
            <HeatmapCanvas
              mode={smallHeatmapMode}
              scene={s}
              width="35vw"
              height="25vh"
            />
            <div style={{
              textAlign: 'center',
              marginTop: '1vh',
              color: EP_COLORS.warm,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.6vw',
              fontWeight: 600,
            }}>
              ~100ms
            </div>
          </motion.div>
        )}

        <ECE s={s} enter={3} exit={4} delay={0.3} style={{ position: 'absolute', left: '50vw', top: '50vh' }}>
          <p style={{ color: EP_COLORS.text, fontSize: '1.3vw' }}>
            A normal block validates in milliseconds.
          </p>
        </ECE>

        {/* ═══════════════════════════════════════════════════════════
            ZONE B: Act 2 — The Attack (100–200vw)
            ═══════════════════════════════════════════════════════════ */}

        {/* Scene 4: "What if..." transition */}
        <ECE s={s} enter={4} exit={5} style={{ position: 'absolute', left: '105vw', top: '35vh' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5vw',
            fontWeight: 700,
            color: EP_COLORS.critical,
            letterSpacing: '-0.02em',
          }}>
            What if a miner<br />crafts a weapon?
          </h2>
        </ECE>

        <ECE s={s} enter={4} exit={5} delay={0.6} style={{ position: 'absolute', left: '105vw', top: '55vh' }}>
          <p style={{ color: EP_COLORS.textMuted, fontSize: '1.4vw', maxWidth: '40vw' }}>
            One transaction. Thousands of inputs.
            <br />Each input re-hashes everything.
          </p>
        </ECE>

        {/* Scenes 5-6: Big heatmap — the explosion */}
        {sceneRange(s, 5, 11) && (
          <motion.div
            {...morph(s, {
              5: { opacity: 1, scale: 1 },
              10: { opacity: 1, scale: 1 }, // stays for capped view
            })}
            style={{ position: 'absolute', left: '105vw', top: '10vh' }}
          >
            {/* HIGHLIGHT SCENE — scene 5-6 */}
            <HeatmapCanvas
              mode={bigHeatmapMode}
              scene={s}
              showCap={s >= 10}
              width="65vw"
              height="45vh"
              style={s >= 5 && s < 9 ? {
                animation: s >= 6 ? 'ep9-shake 0.3s ease-in-out infinite' : undefined,
              } : undefined}
            />
          </motion.div>
        )}

        {/* Sigops counter overlay — top-right of heatmap */}
        {sceneRange(s, 5, 11) && (
          <div style={{ position: 'absolute', left: '152vw', top: '12vh' }}>
            <SigopsCounter mode={counterMode} scene={s} />
          </div>
        )}

        {/* Scene 5 text */}
        <ECE s={s} enter={5} exit={6} delay={0.3} style={{ position: 'absolute', left: '105vw', top: '60vh' }}>
          <p style={{ color: EP_COLORS.text, fontSize: '1.4vw', maxWidth: '50vw' }}>
            Same transaction, re-signed with every input...
          </p>
        </ECE>

        {/* Scene 6: Meltdown text */}
        <ECE s={s} enter={6} exit={7} delay={0.5} style={{ position: 'absolute', left: '105vw', top: '62vh' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2vw',
            fontWeight: 700,
            color: EP_COLORS.meltdown,
          }}>
            O(n²) — double the inputs, 4× the work
          </div>
        </ECE>

        {/* Scene 6: Meltdown numbers overlay (director: on the hot heatmap) */}
        <ECE s={s} enter={6} exit={7} delay={1.0} style={{ position: 'absolute', left: '120vw', top: '28vh' }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            padding: '2vh 2vw',
            borderRadius: '8px',
            border: `1px solid ${EP_COLORS.critical}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '3vw',
              fontWeight: 700,
              color: EP_COLORS.meltdown,
              lineHeight: 1.2,
            }}>
              100ms → 10 hours
            </div>
            <div style={{
              color: EP_COLORS.critical,
              fontSize: '1.3vw',
              marginTop: '0.5vh',
            }}>
              360,000 : 1 ratio
            </div>
          </div>
        </ECE>

        {/* ═══════════════════════════════════════════════════════════
            ZONE C: Act 3 — The Fix (210–290vw)
            ═══════════════════════════════════════════════════════════ */}

        {/* Scenes 7-8: Miner race */}
        <MinerRace scene={s} equalized={s >= 12} />

        {/* Scene 9: BIP 54 intro (merged with SegWit context per director) */}
        <ECE s={s} enter={9} exit={10} style={{ position: 'absolute', left: '215vw', top: '80vh' }}>
          <div>
            <span style={{
              color: EP_COLORS.textMuted,
              fontSize: '1vw',
              display: 'block',
              marginBottom: '0.5vh',
            }}>
              SegWit fixed this for new transactions in 2017. Legacy remained vulnerable.
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3vw',
              fontWeight: 700,
              color: EP_COLORS.fix,
              letterSpacing: '-0.01em',
            }}>
              BIP 54: The Great Consensus Cleanup
            </h2>
          </div>
        </ECE>

        {/* Scene 10: Cap line on heatmap — camera goes back to Zone B */}
        <ECE s={s} enter={10} exit={11} delay={0.5} style={{ position: 'absolute', left: '105vw', top: '60vh' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8vw',
            fontWeight: 600,
            color: EP_COLORS.fix,
          }}>
            2,500 signature operations. Hard cap.
          </div>
        </ECE>

        {/* Scene 11: Before / After comparison */}
        <ECE s={s} enter={11} exit={12} style={{ position: 'absolute', left: '220vw', top: '85vh' }}>
          <div style={{
            display: 'flex',
            gap: '4vw',
            alignItems: 'center',
          }}>
            {/* Before */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4vw',
                fontWeight: 700,
                color: EP_COLORS.critical,
                lineHeight: 1,
              }}>
                120s
              </div>
              <div style={{ color: EP_COLORS.textMuted, fontSize: '1vw', marginTop: '0.5vh' }}>
                worst case (before)
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3vw',
              color: EP_COLORS.fix,
            }}>
              →
            </div>

            {/* After */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4vw',
                fontWeight: 700,
                color: EP_COLORS.fix,
                lineHeight: 1,
              }}>
                3s
              </div>
              <div style={{ color: EP_COLORS.textMuted, fontSize: '1vw', marginTop: '0.5vh' }}>
                worst case (after)
              </div>
            </div>
          </div>
        </ECE>

        <ECE s={s} enter={11} exit={12} delay={0.5} style={{ position: 'absolute', left: '235vw', top: '100vh' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5vw',
            fontWeight: 700,
            color: EP_COLORS.fixGlow,
          }}>
            40× faster worst case
          </div>
        </ECE>

        {/* Scene 13: CTA */}
        <ECE s={s} enter={13} style={{ position: 'absolute', left: '115vw', top: '45vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.5vw',
              fontWeight: 700,
              color: EP_COLORS.textBright,
              marginBottom: '2vh',
            }}>
              Worst-Case Block Validation
            </h2>
            <p style={{
              color: EP_COLORS.textMuted,
              fontSize: '1.5vw',
              marginBottom: '3vh',
            }}>
              From the BIP 54: Great Consensus Cleanup series
            </p>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2vw',
              fontWeight: 600,
              color: EP_COLORS.accent,
            }}>
              Follow @AcademyBDP
            </div>
          </div>
        </ECE>

      </Camera>

      <DevControls player={player} />

      {/* Global keyframe for heatmap shake */}
      <style>{`
        @keyframes ep9-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(1px, -2px); }
          50% { transform: translate(-2px, 0); }
          60% { transform: translate(2px, 1px); }
          70% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 2px); }
          90% { transform: translate(0, -2px); }
        }
      `}</style>
    </div>
  );
}
