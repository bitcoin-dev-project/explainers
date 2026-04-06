/**
 * EP111 — Worst-Case Block Validation
 *
 * How a single malicious block can take minutes to validate,
 * the quadratic signature hashing bug, and how BIP-54 fixes it.
 *
 * 18 scenes across 4 acts: Setup → Problem → History → Fix
 * Signature visual: QuadraticGrid (Canvas 2D heat-mapped N×N grid)
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  useVideoPlayer,
  DevControls,
  morph,
  sceneRange,
  createThemedCE,
  ceThemes,
  useSceneGSAP,
} from '@/lib/video';
import { EP_COLORS, EP_SPRINGS, SCENE_DURATIONS } from './constants';
import QuadraticGrid, { type GridMode } from './QuadraticGrid';
import WorkCounter from './WorkCounter';
import ValidationTimer from './ValidationTimer';
import CapLine from './CapLine';
import BlockQueue from './BlockQueue';

// ── Themed CE (glitch snap for security topic) ─────────────────────
const ECE = createThemedCE({
  initial: { opacity: 0, x: -6, skewX: -2, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, skewX: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 6, skewX: 2, filter: 'blur(6px)' },
  transition: { duration: 0.4, ease: 'circOut' },
});

// ── Grid config per scene ──────────────────────────────────────────
function gridConfig(
  s: number,
  urgencyFlash: boolean,
): { mode: GridMode; n: number; bias: 'default' | 'segwit' | 'teal'; cps?: number } {
  switch (s) {
    case 3:
      return { mode: 'linear', n: 3, bias: 'default' };
    case 4:
      return { mode: 'quadratic', n: 50, bias: 'default' };
    case 5:
      return { mode: 'quadratic', n: 100, bias: 'default' };
    case 6:
      return { mode: 'meltdown', n: 100, bias: 'default' };
    case 7:
      return { mode: 'historical', n: 100, bias: 'default' };
    case 8:
      return { mode: 'meltdown', n: 100, bias: 'default' };
    case 9:
      return { mode: 'historical', n: 50, bias: 'default' };
    case 10:
      return { mode: 'off', n: 50, bias: 'default' };
    case 11:
      return { mode: 'meltdown', n: 50, bias: 'default' };
    case 12:
      return { mode: 'quadratic', n: 100, bias: 'default' };
    case 13:
      return { mode: 'capped', n: 100, bias: 'default' };
    case 14:
      return { mode: 'resolved', n: 50, bias: 'teal' };
    case 15:
      return { mode: 'resolved', n: 25, bias: 'teal' };
    case 16:
      return {
        mode: urgencyFlash ? 'meltdown' : 'resolved',
        n: 50,
        bias: urgencyFlash ? 'default' : 'teal',
      };
    case 17:
      return { mode: 'resolved', n: 3, bias: 'teal' };
    default:
      return { mode: 'off', n: 3, bias: 'default' };
  }
}

// ── Counter value per scene ────────────────────────────────────────
function counterValue(s: number): number {
  switch (s) {
    case 3: return 9;
    case 4: return 2500;
    case 5: return 25_000_000;
    case 6: return 25_000_000;
    case 7: return 31_024_900;
    case 8: return 31_024_900;
    case 9: return 31_024_900;
    case 12: return 25_000_000;
    case 13: return 6250;
    case 17: return 9;
    default: return 0;
  }
}

function counterColor(s: number): string {
  if (s <= 3) return EP_COLORS.text;
  if (s === 4) return EP_COLORS.cellWarm;
  if (s >= 5 && s <= 8) return EP_COLORS.cellCritical;
  if (s >= 12 && s <= 13) return EP_COLORS.fix;
  if (s === 17) return EP_COLORS.fix;
  return EP_COLORS.text;
}

// ── Component ──────────────────────────────────────────────────────

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  // Urgency flash (scene 16): grid briefly reverts to meltdown
  const [urgencyFlash, setUrgencyFlash] = useState(false);
  useEffect(() => {
    if (s === 16) {
      const t1 = setTimeout(() => setUrgencyFlash(true), 1000);
      const t2 = setTimeout(() => setUrgencyFlash(false), 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    setUrgencyFlash(false);
  }, [s]);

  // Screen shake (scenes 5 and 13)
  const shakeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((s === 5 || s === 13) && shakeRef.current) {
      const delay = s === 5 ? 5500 : 620;
      const timer = setTimeout(() => {
        if (shakeRef.current) {
          gsap.to(shakeRef.current, {
            x: 3, y: -2, duration: 0.05, yoyo: true, repeat: 5,
            onComplete: () => { gsap.set(shakeRef.current, { x: 0, y: 0 }); },
          });
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [s]);

  // Setup scenes GSAP container
  const setupRef = useRef<HTMLDivElement>(null);
  useSceneGSAP(setupRef, s, {
    // Scene 0: Title card
    0: (tl) => {
      tl.set('.s0-wrap', { opacity: 1 })
        .from('.s0-char', { y: 40, opacity: 0, stagger: 0.03, ease: 'power3.out', duration: 0.5 }, 0.3)
        .from('.s0-sub', { opacity: 0, filter: 'blur(12px)', duration: 0.6 }, 0.9)
        .from('.s0-line', { scaleX: 0, duration: 0.4, ease: 'power2.out' }, 1.8)
        .to('.s0-wrap', { opacity: 0, duration: 0.4 }, 5.5);
    },
    // Scene 1: Nodes validate blocks
    1: (tl) => {
      tl.set('.s1-wrap', { opacity: 1 })
        .from('.s1-block', { x: 960, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.3)
        .from('.s1-node', { scale: 0, opacity: 0, stagger: 0.12, ease: 'back.out(2)', duration: 0.4 }, 1.0)
        .from('.s1-check', { scale: 0, opacity: 0, stagger: 0.2, ease: 'elastic.out(1,0.5)', duration: 0.5 }, 2.5)
        .to('.s1-wrap', { opacity: 0, duration: 0.3 }, 6.5);
    },
    // Scene 2: How signature checking works
    2: (tl) => {
      tl.set('.s2-wrap', { opacity: 1 })
        .from('.s2-block', { scale: 0.8, opacity: 0, duration: 0.5 }, 0.2)
        .from('.s2-input', { x: -30, opacity: 0, stagger: 0.2, duration: 0.4 }, 0.6)
        .from('.s2-arrow', { scaleX: 0, stagger: 0.8, duration: 0.3, ease: 'power2.out' }, 1.8)
        .from('.s2-formula', { opacity: 0, y: 15, duration: 0.5 }, 6.0)
        .to('.s2-wrap', { opacity: 0, duration: 0.3 }, 7.5);
    },
  });

  const gc = gridConfig(s, urgencyFlash);

  // Background color
  const bgColor =
    s >= 5 && s <= 6 ? EP_COLORS.bgCrisis
    : s >= 7 && s <= 8 ? '#0F1220'
    : EP_COLORS.bg;

  // Cap line mode
  const capMode: 'hint' | 'slam' | 'active' | null =
    s === 12 ? 'hint' : s === 13 ? 'slam' : s >= 14 ? 'active' : null;

  return (
    <div
      ref={shakeRef}
      data-video="ep111"
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: bgColor, transition: 'background-color 0.6s' }}
    >
      {/* ═══════════════════ SETUP SCENES (0-2) ═══════════════════ */}
      <div ref={setupRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* Scene 0: Title */}
        <div className="s0-wrap absolute inset-0 flex flex-col items-center justify-center" style={{ opacity: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {'Worst-Case Block Validation'.split('').map((ch, i) => (
              <span
                key={i}
                className="s0-char"
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '4.5vw',
                  fontWeight: 700,
                  color: EP_COLORS.text,
                  lineHeight: 1.1,
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>
          <p
            className="s0-sub"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.5vw',
              color: EP_COLORS.textMuted,
              marginTop: '2vh',
            }}
          >
            One block. Every node. Three minutes.
          </p>
          <div
            className="s0-line"
            style={{
              width: '16vw',
              height: '3px',
              background: EP_COLORS.accent,
              marginTop: '1.5vh',
              transformOrigin: 'left center',
            }}
          />
        </div>

        {/* Scene 1: Nodes validate blocks */}
        <div className="s1-wrap absolute inset-0" style={{ opacity: 0 }}>
          {/* Block icon */}
          <div
            className="s1-block"
            style={{
              position: 'absolute',
              left: '50%',
              top: '42%',
              transform: 'translate(-50%, -50%)',
              width: '8vw',
              height: '5.5vh',
              borderRadius: '0.5vw',
              border: `2px solid ${EP_COLORS.cellCool}`,
              background: EP_COLORS.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8vw',
              color: EP_COLORS.textMuted,
            }}
          >
            Block #841,203
          </div>
          {/* Node circles */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (Math.PI * 0.2) + (i / 4) * Math.PI * 0.6;
            const cx = 50 + Math.cos(angle) * 12;
            const cy = 58 + Math.sin(angle) * 10;
            return (
              <div
                key={i}
                className="s1-node"
                style={{
                  position: 'absolute',
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: '1.6vw',
                  height: '1.6vw',
                  borderRadius: '50%',
                  background: EP_COLORS.cellCool,
                  border: `2px solid ${EP_COLORS.text}`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}
          {/* Checkmarks */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (Math.PI * 0.2) + (i / 4) * Math.PI * 0.6;
            const cx = 50 + Math.cos(angle) * 12;
            const cy = 58 + Math.sin(angle) * 10 - 3;
            return (
              <div
                key={i}
                className="s1-check"
                style={{
                  position: 'absolute',
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2vw',
                  color: EP_COLORS.fix,
                }}
              >
                ✓
              </div>
            );
          })}
        </div>

        {/* Scene 2: How signature checking works */}
        <div className="s2-wrap absolute inset-0" style={{ opacity: 0 }}>
          <div
            className="s2-block"
            style={{
              position: 'absolute',
              left: '20%',
              top: '30%',
              width: '14vw',
              padding: '1.5vh 1vw',
              borderRadius: '0.5vw',
              border: `2px solid ${EP_COLORS.cellCool}`,
              background: EP_COLORS.surface,
            }}
          >
            {['Input 1', 'Input 2', 'Input 3'].map((label, i) => (
              <div
                key={label}
                className="s2-input"
                style={{
                  height: '3.5vh',
                  marginBottom: i < 2 ? '0.8vh' : 0,
                  borderRadius: '0.3vw',
                  background: EP_COLORS.cellIdle,
                  border: `1px solid ${EP_COLORS.cellCool}`,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '0.6vw',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75vw',
                  color: EP_COLORS.textMuted,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          {/* Arrows showing full re-serialization per input */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="s2-arrow"
              style={{
                position: 'absolute',
                left: '36%',
                top: `${35 + i * 6}%`,
                width: '15vw',
                height: '2px',
                background: `linear-gradient(90deg, ${EP_COLORS.cellCool}, ${EP_COLORS.cellWarm})`,
                transformOrigin: 'left center',
              }}
            />
          ))}
          {/* Counter */}
          <div
            style={{
              position: 'absolute',
              right: '20%',
              top: '35%',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4vw',
              color: EP_COLORS.text,
              textAlign: 'right',
            }}
          >
            <div style={{ marginBottom: '0.5vh' }}>3 fields × 3 inputs</div>
          </div>
          {/* Formula */}
          <div
            className="s2-formula"
            style={{
              position: 'absolute',
              right: '20%',
              top: '52%',
              fontFamily: 'var(--font-display)',
              fontSize: '1.6vw',
              fontWeight: 700,
              color: EP_COLORS.accent,
            }}
          >
            n inputs × n fields = n²
          </div>
        </div>
      </div>

      {/* ═══════════════════ MAIN GRID ═══════════════════ */}
      {sceneRange(s, 3, 18) && (
        <motion.div
          style={{ position: 'absolute' }}
          {...morph(
            s,
            {
              3:  { left: '38vw', top: '38vh', width: '24vw', height: '42vh', opacity: 1 },
              4:  { left: '12vw', top: '22vh', width: '50vw', height: '62vh' },
              5:  { left: '2vw',  top: '8vh',  width: '96vw', height: '86vh' },
              6:  { left: '5vw',  top: '18vh', width: '90vw', height: '75vh' },
              7:  { left: '18vw', top: '28vh', width: '46vw', height: '56vh' },
              8:  { left: '8vw',  top: '28vh', width: '46vw', height: '56vh' },
              9:  { left: '8vw',  top: '28vh', width: '46vw', height: '56vh' },
              10: { left: '50vw', top: '50vh', width: '1vw',  height: '1vh', opacity: 0 },
              11: { left: '18vw', top: '38vh', width: '46vw', height: '50vh', opacity: 1 },
              12: { left: '5vw',  top: '24vh', width: '90vw', height: '70vh' },
              13: { left: '15vw', top: '24vh', width: '70vw', height: '64vh' },
              14: { left: '56vw', top: '42vh', width: '26vw', height: '38vh' },
              15: { left: '34vw', top: '45vh', width: '32vw', height: '42vh' },
              16: { left: '26vw', top: '28vh', width: '48vw', height: '56vh' },
              17: { left: '38vw', top: '35vh', width: '24vw', height: '42vh' },
            },
            EP_SPRINGS.enter,
          )}
        >
          <QuadraticGrid
            mode={gc.mode}
            gridSize={gc.n}
            colorBias={gc.bias}
            capRow={s === 13 ? 25 : undefined}
            cellsPerSecond={gc.cps}
          />
        </motion.div>
      )}

      {/* ═══════════════════ SPLIT SCREEN (Scene 10) ═══════════════════ */}
      {sceneRange(s, 10, 11) && (
        <>
          {/* Vertical divider */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '20vh',
              width: '1px',
              height: '60vh',
              background: EP_COLORS.textMuted,
              transformOrigin: 'top center',
              zIndex: 2,
            }}
          />
          {/* Left: SegWit (linear) */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={EP_SPRINGS.enter}
            style={{ position: 'absolute', left: '3vw', top: '24vh', width: '44vw', height: '52vh' }}
          >
            <QuadraticGrid mode="linear" gridSize={50} colorBias="segwit" cellsPerSecond={500} />
          </motion.div>
          {/* Right: Legacy (quadratic) */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...EP_SPRINGS.enter, delay: 0.2 }}
            style={{ position: 'absolute', left: '53vw', top: '24vh', width: '44vw', height: '52vh' }}
          >
            <QuadraticGrid mode="quadratic" gridSize={50} colorBias="default" cellsPerSecond={40} />
          </motion.div>
          {/* Split labels */}
          <ECE s={s} enter={10} exit={11} delay={0.3}>
            <div style={{ position: 'absolute', left: '3vw', top: '18vh', fontFamily: 'var(--font-display)', fontSize: '1.4vw', color: EP_COLORS.segwit, fontWeight: 700 }}>
              SegWit (2017)
            </div>
          </ECE>
          <ECE s={s} enter={10} exit={11} delay={0.5}>
            <div style={{ position: 'absolute', left: '53vw', top: '18vh', fontFamily: 'var(--font-display)', fontSize: '1.4vw', color: EP_COLORS.cellHot, fontWeight: 700 }}>
              Legacy
            </div>
          </ECE>
          {/* Split counters */}
          <ECE s={s} enter={10} exit={11} delay={1.2}>
            <div style={{ position: 'absolute', left: '15vw', top: '78vh', fontFamily: 'var(--font-mono)', fontSize: '1.1vw', color: EP_COLORS.segwit }}>
              n operations
            </div>
          </ECE>
          <ECE s={s} enter={10} exit={11} delay={2.0}>
            <div style={{ position: 'absolute', left: '65vw', top: '78vh', fontFamily: 'var(--font-mono)', fontSize: '1.1vw', color: EP_COLORS.cellHot }}>
              n² operations
            </div>
          </ECE>
        </>
      )}

      {/* ═══════════════════ WORK COUNTER ═══════════════════ */}
      <ECE s={s} enter={3} exit={14} delay={1.0}>
        <div style={{ position: 'absolute', right: '4vw', top: '4vh' }}>
          <WorkCounter
            value={counterValue(s)}
            color={counterColor(s)}
            fontSize={s >= 5 && s <= 8 ? '3.5vw' : '2.8vw'}
          />
        </div>
      </ECE>
      {/* Bookend counter (scene 17) */}
      <ECE s={s} enter={17} delay={0.5}>
        <div style={{ position: 'absolute', right: '4vw', top: '4vh' }}>
          <WorkCounter value={9} color={EP_COLORS.fix} fontSize="2.8vw" />
        </div>
      </ECE>

      {/* ═══════════════════ VALIDATION TIMER ═══════════════════ */}
      <ECE s={s} enter={6} exit={8} delay={0.5}>
        <div style={{ position: 'absolute', right: '4vw', top: '14vh' }}>
          <ValidationTimer targetSeconds={180} color={EP_COLORS.stall} />
        </div>
      </ECE>
      {/* Timer reappears for the fix (scene 13) */}
      <ECE s={s} enter={13} exit={14} delay={3.5}>
        <div style={{ position: 'absolute', right: '4vw', top: '14vh' }}>
          <ValidationTimer targetSeconds={5} color={EP_COLORS.fix} />
        </div>
      </ECE>
      {/* Flash timer (scene 16 urgency) */}
      {urgencyFlash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'absolute', right: '4vw', top: '14vh', fontFamily: 'var(--font-mono)', fontSize: '2.2vw', fontWeight: 700, color: EP_COLORS.stall }}
        >
          3:00
        </motion.div>
      )}

      {/* ═══════════════════ CAP LINE ═══════════════════ */}
      {capMode && (
        <motion.div
          style={{ position: 'absolute', zIndex: 5 }}
          {...morph(s, {
            12: { left: '5vw', right: '5vw', top: '42vh' },
            13: { left: '0vw', right: '0vw', top: '38vh' },
            14: { left: '56vw', right: '18vw', top: '42vh' },
            15: { left: '34vw', right: '34vw', top: '45vh' },
            16: { left: '26vw', right: '26vw', top: '28vh' },
            17: { left: '38vw', right: '38vw', top: '35vh' },
          }, EP_SPRINGS.resolve)}
        >
          <CapLine mode={capMode} />
        </motion.div>
      )}

      {/* ═══════════════════ BLOCK QUEUE (Scene 6) ═══════════════════ */}
      <ECE s={s} enter={6} exit={7} delay={2.0}>
        <div style={{ position: 'absolute', right: '4vw', top: '38vh' }}>
          <BlockQueue />
        </div>
      </ECE>

      {/* ═══════════════════ CAPTIONS ═══════════════════ */}
      {/* Scene 1 */}
      <ECE s={s} enter={1} exit={2} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '2vw', color: EP_COLORS.text }}>
          Every node checks every block.
        </div>
      </ECE>
      {/* Scene 2 */}
      <ECE s={s} enter={2} exit={3} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          Each input needs its own signature check.
        </div>
      </ECE>
      {/* Scene 3 */}
      <ECE s={s} enter={3} exit={4} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          3 inputs. 9 hash operations. Done.
        </div>
      </ECE>
      <ECE s={s} enter={3} exit={4} delay={4.0}>
        <div style={{ position: 'absolute', left: '38vw', bottom: '8vh', fontFamily: 'var(--font-body)', fontSize: '1vw', color: EP_COLORS.fix }}>
          ~0.001 seconds
        </div>
      </ECE>
      {/* Scene 4 */}
      <ECE s={s} enter={4} exit={5} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          What if a transaction has more inputs?
        </div>
      </ECE>
      {/* Scene 5 — HIGHLIGHT */}
      <ECE s={s} enter={5} exit={6} delay={0}>
        <div style={{ position: 'absolute', left: '50%', top: '2vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2vw', color: EP_COLORS.cellHot, textAlign: 'center' }}>
          Now imagine thousands of inputs.
        </div>
      </ECE>
      <ECE s={s} enter={5} exit={6} delay={4.5}>
        <div style={{ position: 'absolute', left: '50%', top: '6vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.6vw', fontWeight: 700, color: '#FFF', textAlign: 'center' }}>
          5,000 × 5,000 = 25,000,000 hash ops
        </div>
      </ECE>
      {/* Scene 6 */}
      <ECE s={s} enter={6} exit={7} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.stall }}>
          The entire network waits.
        </div>
      </ECE>
      <ECE s={s} enter={6} exit={7} delay={5.0}>
        <div style={{ position: 'absolute', left: '50%', top: '6vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2vw', fontWeight: 700, color: '#FFF', textAlign: 'center' }}>
          3 minutes. From one block.
        </div>
      </ECE>
      {/* Scene 7 */}
      <ECE s={s} enter={7} exit={8} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          July 6, 2015. Block #364,292.
        </div>
      </ECE>
      {/* Data card */}
      <ECE s={s} enter={7} exit={8} delay={0.5}>
        <div
          style={{
            position: 'absolute',
            right: '5vw',
            top: '8vh',
            padding: '1.5vh 1.5vw',
            borderRadius: '0.6vw',
            border: `1px solid ${EP_COLORS.cellWarm}`,
            background: EP_COLORS.surface,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '1.1vw', fontWeight: 700, color: EP_COLORS.cellWarm, marginBottom: '0.6vh' }}>Block #364,292</div>
          <div style={{ fontSize: '0.85vw', color: EP_COLORS.textMuted, marginBottom: '0.3vh' }}>f2pool</div>
          <div style={{ fontSize: '0.95vw', color: EP_COLORS.cellHot }}>5,570 inputs</div>
          <div style={{ fontSize: '0.95vw', color: EP_COLORS.cellHot }}>~1 GB hashing</div>
          <div style={{ fontSize: '0.95vw', color: EP_COLORS.cellCritical, fontWeight: 700 }}>~25 seconds</div>
        </div>
      </ECE>
      <ECE s={s} enter={7} exit={8} delay={3.5}>
        <div style={{ position: 'absolute', right: '5vw', top: '28vh', fontFamily: 'var(--font-body)', fontSize: '1.1vw', color: EP_COLORS.textMuted }}>
          A brainwallet sweep. <span style={{ color: EP_COLORS.text }}>By accident.</span>
        </div>
      </ECE>

      {/* Scene 8 — Poinsot's worst case */}
      <ECE s={s} enter={8} exit={9} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.7vw', color: EP_COLORS.text }}>
          In 2024, researchers proved it could be far worse.
        </div>
      </ECE>
      {/* Comparison bars */}
      <ECE s={s} enter={8} exit={9} delay={0.5}>
        <div style={{ position: 'absolute', right: '5vw', top: '40vh', display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
            <div style={{ width: '8vw', height: '2vh', borderRadius: '0.2vw', background: EP_COLORS.cellWarm }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85vw', color: EP_COLORS.cellWarm }}>2015: ~25 sec</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '28vw' }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              style={{ height: '2vh', borderRadius: '0.2vw', background: EP_COLORS.cellHot }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85vw', color: EP_COLORS.cellHot }}>2024: ~3 min (laptop)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '38vw' }}
              transition={{ duration: 2, ease: 'easeOut', delay: 0.8 }}
              style={{ height: '2vh', borderRadius: '0.2vw', background: EP_COLORS.cellCritical }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85vw', color: EP_COLORS.cellCritical, whiteSpace: 'nowrap' }}>RPi 4: ~90 min →</span>
          </div>
        </div>
      </ECE>

      {/* Scene 9 — SegWit partial fix */}
      <ECE s={s} enter={9} exit={10} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          SegWit fixed this. <span style={{ color: EP_COLORS.segwit }}>Partially.</span>
        </div>
      </ECE>
      <ECE s={s} enter={9} exit={10} delay={1.5}>
        <div style={{ position: 'absolute', left: '4vw', top: '12vh', fontFamily: 'var(--font-body)', fontSize: '1vw', color: EP_COLORS.segwit }}>
          SegWit inputs: precomputed hashes. O(n), not O(n²).
        </div>
      </ECE>
      <ECE s={s} enter={9} exit={10} delay={3.5}>
        <div style={{ position: 'absolute', left: '4vw', top: '18vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.cellHot }}>
          But legacy inputs are <span style={{ fontWeight: 700 }}>still</span> valid.
        </div>
      </ECE>

      {/* Scene 10 caption */}
      <ECE s={s} enter={10} exit={11} delay={4.5}>
        <div style={{ position: 'absolute', left: '50%', top: '6vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.6vw', color: EP_COLORS.text, textAlign: 'center' }}>
          SegWit is linear. Legacy is still quadratic.
        </div>
      </ECE>
      <ECE s={s} enter={10} exit={11} delay={6.0}>
        <div style={{ position: 'absolute', left: '50%', top: '84vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.3vw', color: EP_COLORS.accent, textAlign: 'center' }}>
          Both are valid on the network today.
        </div>
      </ECE>

      {/* Scene 11 — Timeline */}
      <ECE s={s} enter={11} exit={12} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          This bug has existed since day one.
        </div>
      </ECE>
      {/* Timeline bar */}
      <ECE s={s} enter={11} exit={12} delay={0.5}>
        <div style={{ position: 'absolute', left: '5vw', right: '5vw', top: '16vh' }}>
          {/* Line */}
          <div style={{ height: '2px', background: EP_COLORS.textMuted, position: 'relative' }}>
            {/* Red vulnerability span */}
            <div style={{ position: 'absolute', top: '-2px', left: 0, right: 0, height: '6px', background: `${EP_COLORS.cellHot}40`, borderRadius: '3px' }} />
          </div>
          {/* Markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1vh', fontFamily: 'var(--font-body)', fontSize: '0.75vw', color: EP_COLORS.textMuted }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>2009</div><div>Satoshi's code</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>2015</div><div>First incident</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: EP_COLORS.segwit }}>2017</div><div>Partial fix</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>2024</div><div>Weaponized</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: EP_COLORS.cellCritical }}>Today</div><div style={{ color: EP_COLORS.cellCritical }}>Still open</div></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5vh', fontFamily: 'var(--font-mono)', fontSize: '0.85vw', color: EP_COLORS.cellHot }}>
            Vulnerability window: 15+ years
          </div>
        </div>
      </ECE>
      <ECE s={s} enter={11} exit={12} delay={4.5}>
        <div style={{ position: 'absolute', left: '50%', top: '32vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.5vw', color: EP_COLORS.cellWarm, textAlign: 'center' }}>
          How do you fix a 15-year-old bug?
        </div>
      </ECE>

      {/* Scene 12 — BIP-54 intro */}
      <ECE s={s} enter={12} exit={13} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '2vw', color: EP_COLORS.fix }}>
          BIP-54: cap the damage.
        </div>
      </ECE>
      <ECE s={s} enter={12} exit={13} delay={0.5}>
        <div style={{ position: 'absolute', left: '50%', top: '14vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.3vw', color: EP_COLORS.fix, textAlign: 'center' }}>
          Maximum 2,500 signature operations per transaction
        </div>
      </ECE>
      <ECE s={s} enter={12} exit={13} delay={2.5}>
        <div style={{ position: 'absolute', right: '4vw', top: '8vh', display: 'flex', gap: '2vw', fontFamily: 'var(--font-mono)', fontSize: '1vw' }}>
          <div style={{ color: EP_COLORS.cellHot, textDecoration: 'line-through' }}>Before: ~3 min</div>
          <div style={{ color: EP_COLORS.fix, fontWeight: 700 }}>After: ~5 sec</div>
        </div>
      </ECE>
      <ECE s={s} enter={12} exit={13} delay={5.5}>
        <div style={{ position: 'absolute', left: '50%', bottom: '4vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.5vw', color: EP_COLORS.fix }}>
          One rule. Forty times faster.
        </div>
      </ECE>

      {/* Scene 13 — Cap line slam */}
      <ECE s={s} enter={13} exit={14} delay={5.5}>
        <div style={{ position: 'absolute', left: '50%', top: '4vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2.2vw', fontWeight: 700, color: EP_COLORS.fix, textAlign: 'center' }}>
          Forty times faster.
        </div>
      </ECE>

      {/* Scene 14 — No coins burned */}
      <ECE s={s} enter={14} exit={15} delay={0}>
        <div style={{ position: 'absolute', left: '4vw', top: '4vh', fontFamily: 'var(--font-display)', fontSize: '1.8vw', color: EP_COLORS.text }}>
          The constraint that shaped the fix.
        </div>
      </ECE>
      <ECE s={s} enter={14} exit={15} delay={0.5}>
        <div style={{ position: 'absolute', left: '5vw', top: '14vh', display: 'flex', gap: '6vw' }}>
          {/* What it does */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1vw', color: EP_COLORS.fix, marginBottom: '1vh', fontWeight: 700 }}>What BIP-54 does</div>
            {['Caps sigops at 2,500/tx', 'Bounds worst-case to ~5 sec', 'Works with all existing scripts'].map((t) => (
              <div key={t} style={{ fontFamily: 'var(--font-body)', fontSize: '0.95vw', color: EP_COLORS.fix, marginBottom: '0.6vh' }}>✓ {t}</div>
            ))}
          </div>
          {/* What it doesn't */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1vw', color: EP_COLORS.textMuted, marginBottom: '1vh', fontWeight: 700 }}>What it doesn't do</div>
            {['Ban legacy opcodes', 'Invalidate old UTXOs', 'Require a hard fork'].map((t) => (
              <div key={t} style={{ fontFamily: 'var(--font-body)', fontSize: '0.95vw', color: EP_COLORS.textMuted, marginBottom: '0.6vh', textDecoration: 'line-through' }}>✗ {t}</div>
            ))}
          </div>
        </div>
      </ECE>
      <ECE s={s} enter={14} exit={15} delay={3.5}>
        <div style={{ position: 'absolute', left: '5vw', top: '38vh', fontFamily: 'var(--font-display)', fontSize: '1.3vw', color: EP_COLORS.cellWarm }}>
          Every existing coin remains spendable.
        </div>
      </ECE>

      {/* Scene 15 — Design philosophy */}
      <ECE s={s} enter={15} exit={16} delay={0}>
        <div style={{ position: 'absolute', left: '50%', top: '8vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2vw', color: EP_COLORS.text, textAlign: 'center' }}>
          Don't ban the code. Budget the work.
        </div>
      </ECE>
      <ECE s={s} enter={15} exit={16} delay={0.5}>
        <div style={{ position: 'absolute', left: '50%', top: '20vh', transform: 'translateX(-50%)', display: 'flex', gap: '6vw', alignItems: 'center' }}>
          {/* Rejected approach */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2vw', color: EP_COLORS.cellHot, textDecoration: 'line-through', marginBottom: '0.5vh' }}>OP_X</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9vw', color: EP_COLORS.cellHot }}>Dangerous</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5vw', color: EP_COLORS.textMuted }}>→</div>
          {/* Chosen approach */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '4vw', height: '2.5vh', borderRadius: '0.3vw', border: `2px solid ${EP_COLORS.fix}`, background: `linear-gradient(90deg, ${EP_COLORS.fix}40, ${EP_COLORS.fix})`, marginBottom: '0.5vh' }} />
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9vw', color: EP_COLORS.fix }}>Bounded</div>
          </div>
        </div>
      </ECE>
      <ECE s={s} enter={15} exit={16} delay={2.0}>
        <div style={{ position: 'absolute', left: '50%', top: '36vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-body)', fontSize: '1vw', color: EP_COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', maxWidth: '60vw' }}>
          "You can't ban opcodes without potentially burning someone's coins."
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8vw', marginTop: '0.5vh', fontStyle: 'normal' }}>
            — Corallo (2019) → Poinsot (2024)
          </div>
        </div>
      </ECE>

      {/* Scene 16 — Urgency */}
      <ECE s={s} enter={16} exit={17} delay={0}>
        <div style={{ position: 'absolute', left: '50%', top: '6vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2vw', fontWeight: 700, color: '#FFF', textAlign: 'center' }}>
          BIP-54 has not activated yet.
        </div>
      </ECE>
      <ECE s={s} enter={16} exit={17} delay={2.8}>
        <div style={{ position: 'absolute', left: '50%', top: '14vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.5vw', color: EP_COLORS.cellHot, textAlign: 'center' }}>
          This vulnerability is live on mainnet today.
        </div>
      </ECE>
      <ECE s={s} enter={16} exit={17} delay={5.5}>
        <div style={{ position: 'absolute', left: '50%', top: '20vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.5vw', color: EP_COLORS.fix, textAlign: 'center' }}>
          One soft fork away from safe.
        </div>
      </ECE>

      {/* Scene 17 — CTA + Bookend */}
      <ECE s={s} enter={17} delay={1.0}>
        <div style={{ position: 'absolute', left: '50%', top: '12vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: '2.5vw', fontWeight: 700, color: EP_COLORS.text, textAlign: 'center' }}>
          Follow @bitcoin_devs
        </div>
      </ECE>
      <ECE s={s} enter={17} delay={1.8}>
        <div style={{ position: 'absolute', left: '50%', top: '22vh', transform: 'translateX(-50%)', fontFamily: 'var(--font-body)', fontSize: '1.1vw', color: EP_COLORS.textMuted, textAlign: 'center' }}>
          Next: Coinbase Transaction Uniqueness
        </div>
      </ECE>
      <ECE s={s} enter={17} delay={3.0}>
        <div style={{ position: 'absolute', left: '38vw', bottom: '8vh', fontFamily: 'var(--font-body)', fontSize: '1vw', color: EP_COLORS.fix }}>
          3 inputs. 9 operations. Safe.
        </div>
      </ECE>
      {/* BDP accent */}
      <ECE s={s} enter={17} delay={2.5}>
        <div style={{ position: 'absolute', right: '3vw', bottom: '3vh', width: '2vw', height: '2vw', borderRadius: '50%', background: EP_COLORS.accent, opacity: 0.6 }} />
      </ECE>

      {/* ═══════════════════ DEV CONTROLS ═══════════════════ */}
      <DevControls player={player} />
    </div>
  );
}
