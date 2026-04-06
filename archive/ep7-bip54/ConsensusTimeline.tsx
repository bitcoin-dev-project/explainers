/**
 * ConsensusTimeline — GSAP timeline visual for Act 4
 *
 * Scene 12 (HIGHLIGHT): 4 bug columns + "7+ years" center + timeline milestones
 * Scene 13 (REFRAME): columns compress → "The hard part isn't code. It's coordination."
 */
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSceneGSAP, morph } from '@/lib/video';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

const BUG_COLUMNS = [
  { icon: '📉', bug: 'Timewarp', fix: 'Constrain boundary timestamp' },
  { icon: '🐌', bug: 'Slow validation', fix: 'Cap at 2,500 sigops' },
  { icon: '🔀', bug: '64-byte TX', fix: 'Ban 64-byte transactions' },
  { icon: '👯', bug: 'Duplicate coinbase', fix: 'nLockTime = height - 1' },
];

const MILESTONES = [
  { year: '2019', label: 'Corallo proposes', color: EP_COLORS.muted },
  { year: '2024', label: 'Poinsot revises', color: EP_COLORS.muted },
  { year: '2025', label: 'BIP 54 merged', color: EP_COLORS.fix },
  { year: '2026', label: 'Still on signet', color: EP_COLORS.highlight },
];

const COORD_LETTERS = 'coordination';
const LETTER_COLORS: Record<number, string> = {
  0: '#3B82F6', 1: '#3B82F6', 2: '#3B82F6', 3: '#3B82F6',  // c-o-o-r = blue (miners)
  4: '#22C55E', 5: '#22C55E', 6: '#22C55E', 7: '#22C55E',  // d-i-n-a = green (nodes)
  8: '#F97316', 9: '#F97316', 10: '#F97316', 11: '#F97316', // t-i-o-n = orange (wallets)
};

const STAKEHOLDERS = [
  { label: 'miners', color: '#3B82F6' },
  { label: 'node operators', color: '#22C55E' },
  { label: 'wallets', color: '#F97316' },
  { label: 'exchanges', color: '#A78BFA' },
];

export default function ConsensusTimeline({ scene, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHighlight = scene === 12;
  const isReframe = scene >= 13;

  // GSAP animations for column entrance and timeline
  useSceneGSAP(containerRef, scene, {
    12: (tl) => {
      tl.from('.bug-col', {
        opacity: 0, y: 40, scale: 0.9,
        stagger: 0.4, duration: 0.8,
        ease: 'power2.out',
      });
      tl.from('.center-years', {
        opacity: 0, scale: 0,
        duration: 1.2, ease: 'power2.out',
      }, 2.5);
      tl.from('.milestone', {
        opacity: 0, x: -20,
        stagger: 0.3, duration: 0.5,
        ease: 'power2.out',
      }, 4.0);
    },
    13: (tl) => {
      // Compress columns into a single bar
      tl.to('.bug-col', {
        width: '8vw', padding: '1vh 0.5vw',
        stagger: 0.1, duration: 1.0,
        ease: 'power2.inOut',
      });
      tl.from('.reframe-text', {
        opacity: 0, filter: 'blur(8px)', y: 20,
        duration: 0.8, ease: 'power2.out',
      }, 1.5);
      tl.from('.coord-letter', {
        opacity: 0,
        stagger: 0.08, duration: 0.3,
      }, 2.5);
      tl.from('.stakeholder-label', {
        opacity: 0, y: 10,
        stagger: 0.2, duration: 0.4,
        ease: 'power2.out',
      }, 4.0);
    },
  });

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Amber background zone */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, borderRadius: '1.5vw',
        }}
        {...morph(scene, {
          0: { opacity: 0, background: EP_COLORS.amber },
          12: { opacity: 1, background: EP_COLORS.amber },
          14: { opacity: 0.8, background: EP_COLORS.amber },
        })}
      />

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1, padding: '4vh 4vw' }}>

        {/* ─── Scene 12: Four columns + center reveal ─── */}
        {!isReframe && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'stretch',
              gap: '2vw', position: 'relative',
            }}>
              {BUG_COLUMNS.map((col, i) => (
                <div
                  key={i}
                  className="bug-col"
                  style={{
                    width: '15vw', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '2vh', padding: '2vh 1vw',
                    background: 'rgba(15,23,42,0.4)', borderRadius: '0.8vw',
                  }}
                >
                  {/* Bug icon */}
                  <div style={{ fontSize: '3vw' }}>{col.icon}</div>
                  <div style={{
                    color: EP_COLORS.text, fontSize: '1.2vw',
                    fontFamily: 'var(--font-display)', fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    {col.bug}
                  </div>

                  {/* Vertical green line */}
                  <div style={{
                    flex: 1, width: '2px', minHeight: '4vh',
                    background: `linear-gradient(${EP_COLORS.fix}80, ${EP_COLORS.fix})`,
                  }} />

                  {/* Fix text */}
                  <div style={{
                    color: EP_COLORS.fix, fontSize: '0.9vw',
                    fontFamily: 'var(--font-mono)', textAlign: 'center',
                  }}>
                    {col.fix}
                  </div>
                </div>
              ))}

              {/* "7+ years" center overlay */}
              <div
                className="center-years"
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: EP_COLORS.highlight,
                  fontSize: '6vw',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'bold',
                  textShadow: `0 0 40px ${EP_COLORS.highlight}60`,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                7+ years
              </div>
            </div>

            {/* Timeline bar with milestones */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '4vh', padding: '0 2vw',
              borderTop: `1px solid ${EP_COLORS.muted}40`,
              paddingTop: '2vh',
            }}>
              {MILESTONES.map((ms, i) => (
                <div
                  key={i}
                  className="milestone"
                  style={{
                    textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1vw',
                  }}
                >
                  <div style={{ color: ms.color, fontWeight: 'bold', fontSize: '1.3vw' }}>
                    {ms.year}
                  </div>
                  <div style={{
                    color: ms.color, opacity: 0.8, marginTop: '0.3vh',
                    animation: ms.year === '2026' ? 'pulse-glow 2s ease-in-out infinite' : undefined,
                  }}>
                    {ms.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Scene 13: Reframe ─── */}
        {isReframe && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '30vh', gap: '4vh',
          }}>
            {/* Compressed bar */}
            <motion.div
              style={{
                padding: '1.5vh 4vw', borderRadius: '0.5vw',
                background: EP_COLORS.fix + '20', border: `1px solid ${EP_COLORS.fix}60`,
                fontFamily: 'var(--font-mono)', fontSize: '1.5vw',
                color: EP_COLORS.fix, textAlign: 'center',
              }}
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={EP_SPRINGS.insight}
            >
              4 one-line fixes
            </motion.div>

            {/* Main text */}
            <div className="reframe-text" style={{ textAlign: 'center' }}>
              <div style={{
                color: EP_COLORS.text, fontSize: '3.5vw',
                fontFamily: 'var(--font-display)', fontWeight: 'bold',
              }}>
                The hard part isn't code.
              </div>
              <div style={{
                marginTop: '1.5vh', fontSize: '4vw',
                fontFamily: 'var(--font-display)', fontWeight: 'bold',
              }}>
                It's{' '}
                {COORD_LETTERS.split('').map((letter, i) => (
                  <span
                    key={i}
                    className="coord-letter"
                    style={{
                      color: LETTER_COLORS[i] ?? EP_COLORS.text,
                      display: 'inline-block',
                    }}
                  >
                    {letter}
                  </span>
                ))}
                .
              </div>
            </div>

            {/* Stakeholder labels */}
            <div style={{
              display: 'flex', gap: '3vw', justifyContent: 'center',
            }}>
              {STAKEHOLDERS.map((s, i) => (
                <div
                  key={i}
                  className="stakeholder-label"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.9vw',
                    color: s.color,
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ambient pulse CSS */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; text-shadow: none; }
          50% { opacity: 1; text-shadow: 0 0 8px ${EP_COLORS.highlight}80; }
        }
      `}</style>
    </div>
  );
}
