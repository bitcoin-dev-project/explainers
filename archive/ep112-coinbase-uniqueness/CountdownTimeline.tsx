// CountdownTimeline.tsx — Act 2 centerpiece for EP112
// GSAP-driven SVG timeline from 2010→2046 with event pins,
// sweeping cursor, and the 2046 alarm pulse.

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;   // 0-indexed; active during scenes 10-11
  active: boolean;
}

// ─── Layout constants (within a 1600×400 coordinate space) ───────────

const LINE_Y = 200;
const LINE_X1 = 80;
const LINE_X2 = 1520;
const LINE_W = LINE_X2 - LINE_X1;
const YEAR_MIN = 2005;
const YEAR_MAX = 2055;

function yearToX(year: number) {
  return LINE_X1 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * LINE_W;
}

const PINS = [
  { year: 2010, label: 'Blocks 91,722 & 91,880', color: EP_COLORS.danger, id: 'pin-2010' },
  { year: 2012, label: 'BIP-34 activates', color: EP_COLORS.success, id: 'pin-2012' },
  { year: 2025, label: 'BIP-54 proposed', color: EP_COLORS.accent, id: 'pin-2025' },
  { year: 2046, label: 'Block 1,983,702', color: EP_COLORS.danger, id: 'pin-2046' },
];

const DECADES = [2010, 2020, 2030, 2040, 2050];

// ─── Component ───────────────────────────────────────────────────────

export default function CountdownTimeline({ scene, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    // Kill previous timeline
    tlRef.current?.kill();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tlRef.current = tl;

      if (scene === 10) {
        // ─ Scene 10: timeline enters, cursor sweeps ─
        tl.from('.tl-line', { scaleX: 0, transformOrigin: 'left', duration: 0.5, ease: 'power2.out' })
          .from('.tl-tick', { opacity: 0, y: 10, stagger: 0.04, duration: 0.2 }, '-=0.2')
          .from('.cursor', { scale: 0, duration: 0.2 })
          // Sweep 2010
          .to('.cursor', { left: yearToX(2010), duration: 0.6, ease: 'power2.inOut' })
          .from('#pin-2010', { y: -40, opacity: 0, duration: 0.25, ease: 'back.out(2)' })
          // Sweep 2012
          .to('.cursor', { left: yearToX(2012), duration: 0.5, ease: 'power2.inOut' }, '+=0.2')
          .from('#pin-2012', { y: -40, opacity: 0, duration: 0.25, ease: 'back.out(2)' })
          // Sweep 2025
          .to('.cursor', { left: yearToX(2025), duration: 0.8, ease: 'power2.inOut' }, '+=0.2')
          .from('#pin-2025', { y: -40, opacity: 0, duration: 0.25, ease: 'back.out(2)' })
          // Approach 2046 — slow, building tension
          .to('.cursor', { left: yearToX(2043), duration: 1.5, ease: 'power1.inOut' }, '+=0.3')
          .to('.cursor', { backgroundColor: EP_COLORS.danger, boxShadow: `0 0 40px ${EP_COLORS.danger}`, duration: 1.0 }, '-=1.0');

      } else if (scene === 11) {
        // ─ Scene 11: cursor hits 2046 — ALARM ─
        // Ensure cursor starts near 2046
        tl.set('.cursor', { left: yearToX(2043), backgroundColor: EP_COLORS.danger, boxShadow: `0 0 40px ${EP_COLORS.danger}` })
          // Final approach
          .to('.cursor', { left: yearToX(2046), duration: 0.4, ease: 'power3.in' })
          // Pin slam
          .from('#pin-2046', { y: -80, scale: 2, opacity: 0, duration: 0.15, ease: 'power3.in' })
          // Screen shake
          .to(containerRef.current, { x: 3, duration: 0.04, yoyo: true, repeat: 7 })
          .set(containerRef.current, { x: 0 })
          // Background flash
          .from('.danger-flash', { opacity: 0.6, duration: 0.1 })
          .to('.danger-flash', { opacity: 0, duration: 0.3 })
          // "COLLISION POSSIBLE" text
          .from('.collision-text', { opacity: 0, scale: 1.3, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.2')
          // Detail box
          .from('.detail-box', { scale: 0.8, opacity: 0, duration: 0.4, ease: 'power2.out' }, '+=0.3')
          // Arrow draws
          .from('.detail-arrow', { strokeDashoffset: 200, duration: 0.6, ease: 'power2.out' }, '-=0.1')
          // Parsed height label
          .from('.parsed-label', { opacity: 0, x: 20, duration: 0.3 }, '-=0.2')
          // Alarm pulse starts (CSS handles the loop)
          .to('#pin-2046 .alarm-ring', { opacity: 1, duration: 0.1 });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [scene, active]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: 1600,
        height: 400,
        margin: '0 auto',
      }}
    >
      {/* Danger flash overlay */}
      <div
        className="danger-flash"
        style={{
          position: 'absolute', inset: 0, opacity: 0,
          background: EP_COLORS.dangerGlow, pointerEvents: 'none', zIndex: 20,
        }}
      />

      {/* SVG: line + ticks */}
      <svg
        width={1600} height={400}
        style={{ position: 'absolute', top: 0, left: 0 }}
        viewBox="0 0 1600 400"
      >
        {/* Main line */}
        <line
          className="tl-line"
          x1={LINE_X1} y1={LINE_Y} x2={LINE_X2} y2={LINE_Y}
          stroke={EP_COLORS.muted} strokeWidth={2}
        />
        {/* Decade ticks + labels */}
        {DECADES.map(yr => (
          <g key={yr} className="tl-tick">
            <line
              x1={yearToX(yr)} y1={LINE_Y - 10} x2={yearToX(yr)} y2={LINE_Y + 10}
              stroke={EP_COLORS.textDim} strokeWidth={1}
            />
            <text
              x={yearToX(yr)} y={LINE_Y + 28}
              textAnchor="middle"
              fill={EP_COLORS.textDim}
              fontSize={13}
              fontFamily='"JetBrains Mono",monospace'
            >
              {yr}
            </text>
          </g>
        ))}

        {/* Detail arrow (scene 11) */}
        <path
          className="detail-arrow"
          d={`M ${yearToX(2046)} ${LINE_Y - 60} Q ${yearToX(2046) - 100} ${LINE_Y - 120} ${yearToX(2046) - 200} ${LINE_Y - 130}`}
          fill="none"
          stroke={EP_COLORS.accent}
          strokeWidth={1.5}
          strokeDasharray={200}
          strokeDashoffset={0}
          markerEnd="none"
          opacity={scene >= 11 ? 1 : 0}
        />
      </svg>

      {/* Cursor */}
      <div
        className="cursor"
        style={{
          position: 'absolute',
          left: yearToX(YEAR_MIN),
          top: LINE_Y - 8,
          width: 16, height: 16,
          borderRadius: '50%',
          backgroundColor: EP_COLORS.accent,
          boxShadow: `0 0 20px ${EP_COLORS.accent}`,
          transform: 'translateX(-8px)',
          zIndex: 10,
        }}
      />

      {/* Pins */}
      {PINS.map(pin => (
        <div
          key={pin.id}
          id={pin.id}
          style={{
            position: 'absolute',
            left: yearToX(pin.year),
            top: LINE_Y - 50,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0,
          }}
        >
          {/* Pin head */}
          <div style={{
            width: pin.id === 'pin-2046' ? 16 : 10,
            height: pin.id === 'pin-2046' ? 16 : 10,
            borderRadius: '50%',
            backgroundColor: pin.color,
            boxShadow: `0 0 10px ${pin.color}`,
            position: 'relative',
          }}>
            {/* Alarm ring (2046 only) */}
            {pin.id === 'pin-2046' && (
              <div
                className="alarm-ring"
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: `2px solid ${EP_COLORS.danger}`,
                  opacity: 0,
                  animation: 'alarmPulse 1.5s ease-out infinite',
                }}
              />
            )}
          </div>
          {/* Pin stem */}
          <div style={{ width: 2, height: 30, backgroundColor: pin.color }} />
          {/* Pin label */}
          <span style={{
            color: pin.color,
            fontSize: 11,
            fontFamily: '"JetBrains Mono",monospace',
            marginTop: 4,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            {pin.label}
          </span>
        </div>
      ))}

      {/* "COLLISION POSSIBLE" glitch text (scene 11) */}
      {scene >= 11 && (
        <div
          className="collision-text"
          style={{
            position: 'absolute',
            left: '50%', top: LINE_Y + 60,
            transform: 'translateX(-50%)',
            fontFamily: 'Montserrat,sans-serif',
            fontWeight: 700,
            fontSize: 38,
            color: EP_COLORS.danger,
            textShadow: `0 0 30px ${EP_COLORS.dangerGlow}`,
            letterSpacing: 2,
            opacity: 0,
            zIndex: 15,
          }}
        >
          COLLISION POSSIBLE
        </div>
      )}

      {/* Detail box (scene 11) */}
      {scene >= 11 && (
        <div
          className="detail-box"
          style={{
            position: 'absolute',
            left: yearToX(2046) - 420,
            top: LINE_Y - 170,
            width: 380,
            padding: '14px 18px',
            backgroundColor: EP_COLORS.bgPanel,
            border: `1px solid ${EP_COLORS.danger}`,
            borderRadius: 8,
            opacity: 0,
            zIndex: 15,
          }}
        >
          <div style={{ color: EP_COLORS.textDim, fontSize: 13, fontFamily: '"JetBrains Mono",monospace' }}>
            Block 164,384 scriptSig:
          </div>
          <div style={{ color: EP_COLORS.danger, fontSize: 20, fontFamily: '"JetBrains Mono",monospace', marginTop: 6 }}>
            04 96 1B 1E
          </div>
          <div className="parsed-label" style={{ color: EP_COLORS.accent, fontSize: 16, fontFamily: '"JetBrains Mono",monospace', marginTop: 8, opacity: 0 }}>
            → Parsed as height: 1,983,702
          </div>
        </div>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes alarmPulse {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
