/**
 * HexRibbon — The Time Bomb Visual for EP7
 *
 * Horizontal strip of raw hex bytes from block 164,384's coinbase scriptSig.
 * GSAP highlights the critical 4 bytes that encode height 1,983,702.
 * CSS @keyframes countdown cycles through years 2012→2046.
 *
 * This is a CORE visual. Does NOT use CE. All animation is GSAP + CSS.
 */

import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import {
  EP_COLORS,
  TIMEBOMB_HEX,
  TIMEBOMB_CRITICAL_BYTES,
  TIMEBOMB_BLOCK,
  TIMEBOMB_HEIGHT,
  TIMEBOMB_YEAR,
} from './constants';

interface HexRibbonProps {
  scene: number;
}

// ─── Countdown component ─────────────────────────────────────────
function TimeBombCountdown({ active }: { active: boolean }) {
  const years = [2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040, 2044, 2046];
  const totalSteps = years.length;

  // CSS-only countdown animation
  const keyframes = `
    @keyframes countdown-tick {
      ${years
        .map(
          (_, i) => `
        ${(i / totalSteps) * 100}%, ${((i + 0.8) / totalSteps) * 100}% {
          content: '${years[i]}';
          ${i === totalSteps - 1 ? `color: ${EP_COLORS.danger}; text-shadow: 0 0 20px ${EP_COLORS.danger}80;` : ''}
        }
      `,
        )
        .join('')}
    }
    @keyframes countdown-bar {
      0% { width: 0%; background: ${EP_COLORS.accent}; }
      90% { background: ${EP_COLORS.accent}; }
      100% { width: 100%; background: ${EP_COLORS.danger}; }
    }
    @keyframes pulse-danger {
      0%, 100% { box-shadow: 0 0 15px ${EP_COLORS.danger}40; }
      50% { box-shadow: 0 0 30px ${EP_COLORS.danger}70, 0 0 60px ${EP_COLORS.danger}30; }
    }
    @keyframes byte-pulse {
      0%, 100% { box-shadow: 0 0 8px ${EP_COLORS.danger}50; }
      50% { box-shadow: 0 0 16px ${EP_COLORS.danger}80, 0 0 32px ${EP_COLORS.danger}40; }
    }
  `;

  if (!active) return null;

  return (
    <div
      className="countdown-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2vh',
        marginTop: '4vh',
      }}
    >
      <style>{keyframes}</style>

      {/* Year display */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '6vh',
          fontWeight: 800,
          color: EP_COLORS.highlight,
          letterSpacing: '0.1em',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            animation: active ? 'countdown-tick 5s steps(1) forwards' : 'none',
          }}
        >
          2012
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '30vw',
          height: '0.6vh',
          background: EP_COLORS.muted + '30',
          borderRadius: '0.3vh',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '0.3vh',
            animation: active ? 'countdown-bar 5s ease-in-out forwards' : 'none',
          }}
        />
      </div>

      {/* Caption */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.8vh',
          color: EP_COLORS.muted,
        }}
      >
        Block {TIMEBOMB_HEIGHT.toLocaleString()} ≈ January {TIMEBOMB_YEAR}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function HexRibbon({ scene }: HexRibbonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const showRibbon = scene >= 12;
  const showHighlight = scene >= 12;
  const showCountdown = scene >= 13;
  const isTimeBomb = scene >= 12; // HIGHLIGHT scene per director (scene 12 after merge)

  // ─── GSAP Scene Animations ──────────────────────────────────────
  useSceneGSAP(containerRef, scene, {
    // Scene 12: Hex bytes cascade in {/* HIGHLIGHT SCENE */}
    12: (tl) => {
      tl.from('.hex-cell', {
        opacity: 0,
        scale: 0.5,
        stagger: 0.025,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
        .from('.ribbon-header', {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.5')
        // Highlight critical bytes: muted → amber → red pulse
        .to('.hex-critical', {
          backgroundColor: EP_COLORS.accent + '30',
          color: EP_COLORS.accent,
          stagger: 0.15,
          duration: 0.3,
          ease: 'power2.out',
        }, '+=0.5')
        .to('.hex-critical', {
          backgroundColor: EP_COLORS.danger + '30',
          color: EP_COLORS.danger,
          stagger: 0.1,
          duration: 0.4,
          ease: 'power2.inOut',
        }, '+=0.3')
        // Annotation appears
        .from('.hex-annotation', {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.2');
    },

    // Scene 13: Countdown begins (CSS handles the animation)
    13: (tl) => {
      tl.to('.hex-critical', {
        scale: 1.15,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      })
        .from('.countdown-container', {
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: 'power2.out',
        }, '+=0.2');
    },
  });

  if (!showRibbon) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '210vw',
        top: '8vh',
        width: '75vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div
        className="ribbon-header"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '1.5vw',
          marginBottom: '3vh',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.8vh',
            fontWeight: 700,
            color: EP_COLORS.text,
            letterSpacing: '0.08em',
          }}
        >
          Block {TIMEBOMB_BLOCK.toLocaleString()}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4vh',
            color: EP_COLORS.muted,
          }}
        >
          coinbase scriptSig
        </span>
      </div>

      {/* Hex grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)',
          gap: '0.5vw',
          padding: '2vh 2vw',
          background: EP_COLORS.bgAlt + '80',
          borderRadius: '1vh',
          border: `1px solid ${EP_COLORS.muted}22`,
        }}
      >
        {TIMEBOMB_HEX.map((byte, i) => {
          const isCritical = TIMEBOMB_CRITICAL_BYTES.includes(i as 0 | 1 | 2 | 3);
          return (
            <div
              key={i}
              className={`hex-cell ${isCritical ? 'hex-critical' : ''}`}
              style={{
                width: '3.5vw',
                height: '4vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.8vh',
                fontWeight: isCritical ? 700 : 400,
                color: isCritical ? EP_COLORS.accent : EP_COLORS.muted,
                background: isCritical ? EP_COLORS.accent + '10' : 'transparent',
                borderRadius: '0.4vh',
                border: `1px solid ${isCritical ? EP_COLORS.accent + '40' : EP_COLORS.muted + '15'}`,
                ...(isTimeBomb && isCritical
                  ? { animation: 'byte-pulse 1.5s ease-in-out infinite' }
                  : {}),
              }}
            >
              {byte}
            </div>
          );
        })}
      </div>

      {/* Annotation bracket pointing to critical bytes */}
      {showHighlight && (
        <div
          className="hex-annotation"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '2vh',
            gap: '0.5vh',
          }}
        >
          {/* Bracket line */}
          <svg width="16vw" height="2vh" viewBox="0 0 200 20" style={{ overflow: 'visible' }}>
            <path
              d="M 20 0 L 20 12 L 100 12 L 100 20 L 100 12 L 180 12 L 180 0"
              fill="none"
              stroke={EP_COLORS.danger}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Label */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.6vh',
              color: EP_COLORS.danger,
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            height: {TIMEBOMB_HEIGHT.toLocaleString()}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.4vh',
              color: EP_COLORS.muted,
            }}
          >
            Accidentally encodes a future block height
          </span>
        </div>
      )}

      {/* Countdown */}
      <TimeBombCountdown active={showCountdown} />
    </div>
  );
}
