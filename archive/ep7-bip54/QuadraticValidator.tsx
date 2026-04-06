/**
 * QuadraticValidator — SVG + GSAP visual for Act 2
 *
 * Shows why legacy sigops are quadratic: N signatures × N hashes = N² ops.
 * Split-panel comparison: normal tx (instant) vs worst-case legacy (1 hour).
 * Fix: cap at 2,500 sigops → curve flattens.
 */
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

const SIG_SLOTS = [
  { label: 'sig₁', x: 15, y: 25 },
  { label: 'sig₂', x: 15, y: 45 },
  { label: 'sig₃', x: 15, y: 65 },
  { label: 'sig₄', x: 15, y: 85 },
];

const TIMER_STEPS = ['1s', '10s', '60s', '600s', '3,600s'];
const TIMER_SIZES = ['1.2vw', '1.4vw', '1.6vw', '1.8vw', '2.2vw'];

// Quadratic curve points (normalized to 0-100 viewBox)
function quadCurvePath(maxX: number): string {
  let d = 'M 5 95';
  for (let x = 5; x <= maxX; x += 1) {
    const t = (x - 5) / 90;
    const y = 95 - 90 * t * t; // quadratic
    d += ` L ${x} ${y}`;
  }
  return d;
}

function modeFromScene(scene: number): 'explain' | 'split' | 'fix' {
  if (scene <= 7) return 'explain';
  if (scene === 8) return 'split';
  return 'fix';
}

export default function QuadraticValidator({ scene, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timerIdx, setTimerIdx] = useState(0);
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [curveLen, setCurveLen] = useState(0);
  const [capVisible, setCapVisible] = useState(false);
  const [curveFixed, setCurveFixed] = useState(false);

  const mode = modeFromScene(scene);

  // GSAP choreography for split panel
  useSceneGSAP(containerRef, scene, {
    8: (tl) => {
      // Left panel: instant fill
      tl.to({}, {
        duration: 0.5,
        onUpdate: function(this: gsap.core.Tween) { setLeftProgress(this.progress()); },
      });
      // Right panel: fills to 2% then freezes
      tl.to({}, {
        duration: 0.8,
        onUpdate: function(this: gsap.core.Tween) { setRightProgress(this.progress() * 0.02); },
      }, 0.3);
      // Timer counting up
      tl.call(() => setTimerIdx(0), [], 1.5);
      tl.call(() => setTimerIdx(1), [], 2.3);
      tl.call(() => setTimerIdx(2), [], 3.1);
      tl.call(() => setTimerIdx(3), [], 3.9);
      tl.call(() => setTimerIdx(4), [], 4.7);
      // Curve draws
      tl.to({}, {
        duration: 2,
        ease: 'power2.in',
        onUpdate: function(this: gsap.core.Tween) { setCurveLen(this.progress() * 95); },
      }, 3.5);
    },
    9: (tl) => {
      // Cap line slides down
      tl.call(() => setCapVisible(true), [], 0.3);
      tl.call(() => setCurveFixed(true), [], 1.2);
      // Right progress completes
      tl.to({}, {
        duration: 1,
        onUpdate: function(this: gsap.core.Tween) { setRightProgress(0.02 + this.progress() * 0.98); },
      }, 1.5);
      tl.call(() => setTimerIdx(0), [], 1.8);
    },
  });

  // Reset states when entering explain mode
  useEffect(() => {
    if (mode === 'explain') {
      setLeftProgress(0);
      setRightProgress(0);
      setTimerIdx(0);
      setCurveLen(0);
      setCapVisible(false);
      setCurveFixed(false);
    }
  }, [mode]);

  return (
    <div ref={containerRef} style={{ ...style, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-mono)' }}>
      {/* Explain mode: shows N² relationship */}
      {mode === 'explain' && (
        <div style={{ display: 'flex', gap: '3vw', alignItems: 'flex-start', padding: '3vh 2vw' }}>
          {/* Transaction box with sig slots */}
          <div style={{ position: 'relative', width: '40vw', height: '35vh' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Transaction body */}
              <rect x="30" y="10" width="60" height="80" rx="4"
                fill={EP_COLORS.bgAlt} stroke={EP_COLORS.muted} strokeWidth="0.8" />
              <text x="60" y="50" textAnchor="middle" fill={EP_COLORS.text}
                fontSize="5" fontFamily="var(--font-mono)">TX body</text>

              {/* Signature slots */}
              {SIG_SLOTS.map((slot, i) => (
                <g key={i}>
                  <rect x={slot.x - 8} y={slot.y - 5} width="16" height="10" rx="2"
                    fill={EP_COLORS.quadratic + '30'} stroke={EP_COLORS.quadratic} strokeWidth="0.5" />
                  <text x={slot.x} y={slot.y + 2} textAnchor="middle" fill={EP_COLORS.quadratic}
                    fontSize="4" fontFamily="var(--font-mono)">{slot.label}</text>

                  {/* Arrows from each sig to TX body */}
                  <line x1={slot.x + 8} y1={slot.y} x2="30" y2={slot.y}
                    stroke={EP_COLORS.quadratic + '60'} strokeWidth="0.5" strokeDasharray="2,1" />
                </g>
              ))}
            </svg>

            {/* Count callout */}
            <div style={{
              position: 'absolute', bottom: '1vh', left: '50%', transform: 'translateX(-50%)',
              color: EP_COLORS.text, fontSize: '1.3vw', fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              4 sigs × 4 hashes = <span style={{ color: EP_COLORS.quadratic, fontWeight: 'bold' }}>16</span> operations
            </div>
          </div>

          {/* Formula */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            gap: '2vh', padding: '5vh 0',
          }}>
            <div style={{
              color: EP_COLORS.text, fontSize: '1.2vw', fontFamily: 'var(--font-mono)',
            }}>
              Each signature hashes the <span style={{ color: EP_COLORS.quadratic }}>entire</span> transaction
            </div>
            <div style={{
              color: EP_COLORS.quadratic, fontSize: '2vw', fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
            }}>
              N signatures → N² hash operations
            </div>
          </div>
        </div>
      )}

      {/* Split panel: normal vs worst-case */}
      {(mode === 'split' || mode === 'fix') && (
        <div style={{ display: 'flex', gap: '2vw', padding: '2vh 3vw', height: '100%' }}>
          {/* Left panel — normal tx */}
          <div style={{
            flex: 1, background: EP_COLORS.bgAlt, borderRadius: '1vw',
            padding: '2vh 1.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh',
          }}>
            <div style={{ color: EP_COLORS.fix, fontSize: '1.4vw', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
              Normal transaction
            </div>
            {/* Progress bar */}
            <div style={{ background: EP_COLORS.bg, borderRadius: '0.5vw', height: '2vh', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '0.5vw', background: EP_COLORS.fix }}
                animate={{ width: `${leftProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div style={{ color: EP_COLORS.fix, fontSize: '1.8vw', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
              {leftProgress > 0.9 ? '0.1 seconds' : '...'}
            </div>
          </div>

          {/* Right panel — worst-case */}
          <div style={{
            flex: 1, background: EP_COLORS.bgAlt, borderRadius: '1vw',
            padding: '2vh 1.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh',
            position: 'relative',
          }}>
            <div style={{ color: EP_COLORS.accent, fontSize: '1.4vw', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
              Worst-case legacy tx
            </div>
            {/* Progress bar */}
            <div style={{ background: EP_COLORS.bg, borderRadius: '0.5vw', height: '2vh', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '0.5vw' }}
                animate={{
                  width: `${rightProgress * 100}%`,
                  background: curveFixed ? EP_COLORS.fix : EP_COLORS.accent,
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div style={{
              color: curveFixed ? EP_COLORS.fix : EP_COLORS.accent,
              fontSize: TIMER_SIZES[timerIdx],
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              transition: 'font-size 0.3s',
            }}>
              {curveFixed ? '0.1 seconds' : TIMER_STEPS[timerIdx]}
            </div>

            {/* Quadratic curve SVG */}
            <svg viewBox="0 0 100 100" style={{ flex: 1, width: '100%' }}>
              {/* Curve */}
              <path
                d={quadCurvePath(curveLen > 0 ? 5 + curveLen : 5)}
                fill="none"
                stroke={curveFixed ? EP_COLORS.fix + '60' : EP_COLORS.quadratic}
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Cap line (when fixing) */}
              {capVisible && (
                <motion.line
                  x1="0" y1="35" x2="100" y2="35"
                  stroke={EP_COLORS.fix}
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                  initial={{ opacity: 0, y1: 5, y2: 5 }}
                  animate={{ opacity: 1, y1: 35, y2: 35 }}
                  transition={EP_SPRINGS.fix}
                />
              )}
              {capVisible && (
                <text x="50" y="30" textAnchor="middle" fill={EP_COLORS.fix}
                  fontSize="4" fontFamily="var(--font-mono)">
                  2,500 sigops cap
                </text>
              )}
            </svg>

            {/* Fix result label */}
            {curveFixed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={EP_SPRINGS.fix}
                style={{
                  color: EP_COLORS.fix, fontSize: '1.6vw',
                  fontFamily: 'var(--font-display)', fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                40× faster worst-case validation
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
