/**
 * PatchViz — The Three Fixes Visual for EP7
 *
 * Visual representation of BIP 30, BIP 34, and BIP 54.
 * Each fix has its own distinct animation style:
 *  - BIP 30: Horizontal cyan scan beam
 *  - BIP 34: Height number stamping into coinbase
 *  - BIP 54: SVG lock mechanism (nLockTime dial + nSequence toggle)
 *
 * Driven by GSAP timelines. Uses morph() for transitions between fix states.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneGSAP, morph } from '@/lib/video';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface PatchVizProps {
  scene: number;
}

// ─── BIP 30: The Scan ────────────────────────────────────────────
function BIP30Scan({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, active ? 1 : 0, {
    1: (tl) => {
      tl.from('.scan-label', {
        opacity: 0,
        y: -15,
        duration: 0.5,
        ease: 'power2.out',
      })
        .from('.scan-bar', {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.6,
          ease: 'power2.out',
        }, '-=0.2')
        .to('.scan-bar', {
          x: '120%',
          duration: 2.5,
          ease: 'power1.inOut',
          repeat: -1,
        });
    },
  });

  if (!active) return null;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2vh' }}>
      {/* BIP label */}
      <div className="scan-label" style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5vh',
            fontWeight: 800,
            color: EP_COLORS.fix,
            letterSpacing: '0.05em',
          }}
        >
          BIP 30
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.8vh',
            color: EP_COLORS.muted,
          }}
        >
          2012
        </span>
      </div>

      {/* Scan visualization — simplified UTXO rows with beam */}
      <div
        style={{
          position: 'relative',
          width: '40vw',
          padding: '2vh 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8vh',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '3vh',
              borderRadius: '0.4vh',
              background: EP_COLORS.bgAlt,
              border: `1px solid ${EP_COLORS.muted}20`,
            }}
          />
        ))}

        {/* Scan beam */}
        <div
          className="scan-bar"
          style={{
            position: 'absolute',
            top: 0,
            left: '-10%',
            width: '10%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${EP_COLORS.fix}50, ${EP_COLORS.fix}70, ${EP_COLORS.fix}50, transparent)`,
            borderRadius: '1vw',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Description */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.6vh',
          color: EP_COLORS.text,
          textAlign: 'center',
          maxWidth: '35vw',
        }}
      >
        Scan every TXID before accepting
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.3vh',
          color: EP_COLORS.muted,
        }}
      >
        O(n) per block — expensive
      </span>
    </div>
  );
}

// ─── BIP 34: The Stamp ───────────────────────────────────────────
function BIP34Stamp({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, active ? 1 : 0, {
    1: (tl) => {
      tl.from('.stamp-label', {
        opacity: 0,
        y: -15,
        duration: 0.5,
        ease: 'power2.out',
      })
        .from('.coinbase-field', {
          opacity: 0,
          scale: 0.9,
          duration: 0.4,
          ease: 'power2.out',
        })
        // Height number slams in from above
        .from('.height-stamp', {
          y: -80,
          scale: 2,
          opacity: 0,
          duration: 0.3,
          ease: 'power4.in',
        }, '+=0.3')
        .to('.height-stamp', {
          scale: 1,
          duration: 0.2,
          ease: 'elastic.out(1, 0.4)',
        })
        // Flash on the field
        .to('.coinbase-field', {
          boxShadow: `0 0 30px ${EP_COLORS.fix}50`,
          duration: 0.15,
        })
        .to('.coinbase-field', {
          boxShadow: `0 0 10px ${EP_COLORS.fix}20`,
          duration: 0.5,
        });
    },
  });

  if (!active) return null;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2vh' }}>
      <div className="stamp-label" style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5vh',
            fontWeight: 800,
            color: EP_COLORS.fix,
            letterSpacing: '0.05em',
          }}
        >
          BIP 34
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.8vh',
            color: EP_COLORS.muted,
          }}
        >
          2013
        </span>
      </div>

      {/* Coinbase scriptSig field */}
      <div
        className="coinbase-field"
        style={{
          width: '40vw',
          padding: '3vh 3vw',
          borderRadius: '1vh',
          background: EP_COLORS.bgAlt,
          border: `2px solid ${EP_COLORS.fix}40`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5vh',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.3vh',
            color: EP_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          coinbase scriptSig
        </span>

        {/* The height number stamps in */}
        <div
          className="height-stamp"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '5vh',
            fontWeight: 800,
            color: EP_COLORS.fix,
            letterSpacing: '0.1em',
            textShadow: `0 0 15px ${EP_COLORS.fix}40`,
          }}
        >
          03 96 65 01
        </div>

        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.4vh',
            color: EP_COLORS.muted,
          }}
        >
          = height 91,542 (little-endian)
        </span>
      </div>

      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.6vh',
          color: EP_COLORS.text,
          textAlign: 'center',
          maxWidth: '35vw',
        }}
      >
        Embed block height — unique input = unique hash
      </span>
    </div>
  );
}

// ─── BIP 54: The Lock ────────────────────────────────────────────
function BIP54Lock({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, active ? 1 : 0, {
    1: (tl) => {
      tl.from('.lock-label', {
        opacity: 0,
        y: -15,
        duration: 0.5,
        ease: 'power2.out',
      })
        // Lock body appears
        .from('.lock-body', {
          opacity: 0,
          scale: 0.8,
          duration: 0.5,
          ease: 'back.out(1.5)',
        })
        // nLockTime dial turns
        .from('.dial-indicator', {
          rotation: -180,
          transformOrigin: '50% 100%',
          duration: 1.2,
          ease: 'power3.inOut',
        }, '+=0.3')
        // nSequence toggle flips
        .to('.toggle-switch', {
          x: 30,
          duration: 0.3,
          ease: 'power4.out',
        }, '-=0.4')
        .to('.toggle-bg', {
          fill: EP_COLORS.fix,
          duration: 0.3,
        }, '<')
        // Lock shackle closes
        .to('.lock-shackle', {
          y: 0,
          duration: 0.2,
          ease: 'power4.in',
        }, '+=0.2')
        // Satisfying snap — scale bounce
        .to('.lock-svg', {
          scale: 1.08,
          duration: 0.1,
          ease: 'power4.out',
        })
        .to('.lock-svg', {
          scale: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.3)',
        })
        // Glow pulse
        .to('.lock-body', {
          boxShadow: `0 0 40px ${EP_COLORS.fix}60, 0 0 80px ${EP_COLORS.fix}30`,
          duration: 0.3,
        })
        .to('.lock-body', {
          boxShadow: `0 0 15px ${EP_COLORS.fix}30`,
          duration: 0.8,
        });
    },
  });

  if (!active) return null;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2vh' }}>
      <div className="lock-label" style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5vh',
            fontWeight: 800,
            color: EP_COLORS.fix,
            letterSpacing: '0.05em',
          }}
        >
          BIP 54
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.8vh',
            color: EP_COLORS.muted,
          }}
        >
          2025
        </span>
      </div>

      {/* Lock visualization */}
      <div
        className="lock-body"
        style={{
          width: '35vw',
          padding: '3vh 3vw',
          borderRadius: '1.5vh',
          background: EP_COLORS.bgAlt,
          border: `2px solid ${EP_COLORS.fix}40`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3vh',
        }}
      >
        {/* SVG Lock icon */}
        <svg
          className="lock-svg"
          width="10vw"
          height="12vh"
          viewBox="0 0 120 150"
          style={{ overflow: 'visible' }}
        >
          {/* Lock body */}
          <rect
            x="15"
            y="65"
            width="90"
            height="75"
            rx="8"
            fill={EP_COLORS.bgAlt}
            stroke={EP_COLORS.fix}
            strokeWidth="3"
          />

          {/* Shackle (starts open, GSAP closes it) */}
          <path
            className="lock-shackle"
            d="M 35 65 L 35 40 C 35 20, 85 20, 85 40 L 85 65"
            fill="none"
            stroke={EP_COLORS.fix}
            strokeWidth="6"
            strokeLinecap="round"
            style={{ transform: 'translateY(-15px)' }} // starts open
          />

          {/* Keyhole */}
          <circle cx="60" cy="95" r="8" fill={EP_COLORS.fix + '60'} />
          <rect x="57" y="95" width="6" height="18" rx="2" fill={EP_COLORS.fix + '60'} />

          {/* Dial indicator for nLockTime */}
          <g className="dial-indicator" style={{ transformOrigin: '60px 95px' }}>
            <line
              x1="60"
              y1="95"
              x2="60"
              y2="72"
              stroke={EP_COLORS.highlight}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="60" cy="72" r="3" fill={EP_COLORS.highlight} />
          </g>
        </svg>

        {/* Two fields side by side */}
        <div style={{ display: 'flex', gap: '2vw', width: '100%', justifyContent: 'center' }}>
          {/* nLockTime */}
          <div
            style={{
              flex: 1,
              padding: '1.5vh 1.5vw',
              borderRadius: '0.8vh',
              background: EP_COLORS.bg,
              border: `1px solid ${EP_COLORS.fix}30`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.8vh',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.2vh',
                color: EP_COLORS.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              nLockTime
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.2vh',
                fontWeight: 700,
                color: EP_COLORS.fix,
              }}
            >
              height - 1
            </span>
          </div>

          {/* nSequence toggle */}
          <div
            style={{
              flex: 1,
              padding: '1.5vh 1.5vw',
              borderRadius: '0.8vh',
              background: EP_COLORS.bg,
              border: `1px solid ${EP_COLORS.fix}30`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.8vh',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.2vh',
                color: EP_COLORS.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              nSequence
            </span>
            {/* Toggle switch */}
            <svg width="6vw" height="2.5vh" viewBox="0 0 80 25">
              <rect
                className="toggle-bg"
                x="0"
                y="0"
                width="80"
                height="25"
                rx="12.5"
                fill={EP_COLORS.muted + '40'}
              />
              <circle
                className="toggle-switch"
                cx="15"
                cy="12.5"
                r="9"
                fill={EP_COLORS.text}
              />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.3vh',
                color: EP_COLORS.fix,
                fontWeight: 600,
              }}
            >
              ≠ 0xFFFFFFFF
            </span>
          </div>
        </div>
      </div>

      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.6vh',
          color: EP_COLORS.text,
          textAlign: 'center',
          maxWidth: '35vw',
        }}
      >
        Forces each coinbase to reference its own block height
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.3vh',
          color: EP_COLORS.match,
        }}
      >
        Permanent — no exceptions, no loopholes
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function PatchViz({ scene }: PatchVizProps) {
  const showBIP30 = scene >= 10 && scene < 11;
  const showBIP34 = scene >= 11 && scene < 14;
  const showBIP54 = scene >= 14;

  // Determine which fix is active for morph transitions
  const fixPhase = scene >= 14 ? 2 : scene >= 11 ? 1 : scene >= 10 ? 0 : -1;

  if (fixPhase < 0) return null;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '210vw',
        top: '40vh',
        width: '75vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      {...morph(scene, {
        10: { opacity: 1, y: 0 },
        15: { opacity: 1, y: '-5vh' }, // shift up slightly for BIP 54
      })}
      transition={EP_SPRINGS.fix}
    >
      <BIP30Scan active={showBIP30} />
      <BIP34Stamp active={showBIP34} />
      <BIP54Lock active={showBIP54} />
    </motion.div>
  );
}
