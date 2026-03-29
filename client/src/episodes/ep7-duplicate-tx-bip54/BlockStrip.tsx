/**
 * BlockStrip — Opening Act Visual for EP7
 *
 * Horizontal chain of simplified blocks for the blockchain overview.
 * Camera zooms into one block to reveal the coinbase TX inside.
 *
 * Animation: GSAP stagger for block entrance, CSS stroke-dashoffset for arrows.
 * NOT built with DiagramBox — pure custom SVG + divs.
 */

import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

interface BlockStripProps {
  scene: number;
}

// ─── Block data ──────────────────────────────────────────────────
const BLOCKS = [
  { height: 91718, label: '91,718' },
  { height: 91719, label: '91,719' },
  { height: 91720, label: '91,720' },
  { height: 91721, label: '91,721' },
  { height: 91722, label: '91,722', highlight: true },
  { height: 91723, label: '91,723' },
  { height: 91724, label: '91,724' },
];

const BLOCK_W = '9vw';
const BLOCK_H = '14vh';
const GAP = '2.5vw';

export default function BlockStrip({ scene }: BlockStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const showStrip = scene >= 1 && scene < 10;
  const showInternals = scene >= 2; // Zoom reveals coinbase inside block 91,722
  const showTxid = scene >= 3;

  // ─── GSAP Animations ───────────────────────────────────────────
  useSceneGSAP(containerRef, scene, {
    // Scene 1: Blocks stagger in from left
    1: (tl) => {
      tl.from('.block-rect', {
        opacity: 0,
        x: -60,
        scale: 0.8,
        stagger: 0.1,
        duration: 0.5,
        ease: 'back.out(1.4)',
      })
        .from('.block-arrow', {
          strokeDashoffset: 40,
          opacity: 0,
          stagger: 0.08,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.3')
        .from('.block-label', {
          opacity: 0,
          y: 8,
          stagger: 0.08,
          duration: 0.3,
          ease: 'power2.out',
        }, '-=0.3');
    },

    // Scene 2: Highlight block 91,722
    2: (tl) => {
      tl.to('.block-highlight', {
        borderColor: EP_COLORS.accent,
        boxShadow: `0 0 25px ${EP_COLORS.accent}50, inset 0 0 15px ${EP_COLORS.accent}15`,
        duration: 0.6,
        ease: 'power2.inOut',
      })
        // Reveal internal structure (coinbase TX)
        .from('.coinbase-inner', {
          opacity: 0,
          scale: 0.8,
          duration: 0.5,
          ease: 'back.out(1.5)',
        }, '+=0.2');
    },

    // Scene 3: TXID forms character by character
    3: (tl) => {
      tl.from('.txid-char', {
        opacity: 0,
        y: -5,
        stagger: 0.02,
        duration: 0.1,
        ease: 'none',
      })
        .from('.txid-label', {
          opacity: 0,
          x: -10,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.2');
    },

    // Scene 4: Ominous red pulse on the question "what if two match?"
    4: (tl) => {
      tl.to('.block-highlight', {
        boxShadow: `0 0 35px ${EP_COLORS.danger}50, inset 0 0 20px ${EP_COLORS.danger}20`,
        borderColor: EP_COLORS.danger,
        duration: 0.8,
        ease: 'power2.inOut',
      })
        .to('.block-highlight', {
          boxShadow: `0 0 15px ${EP_COLORS.danger}30`,
          duration: 1.0,
          ease: 'power2.inOut',
        })
        .to('.block-highlight', {
          boxShadow: `0 0 35px ${EP_COLORS.danger}50, inset 0 0 20px ${EP_COLORS.danger}20`,
          duration: 0.8,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        });
    },
  });

  // CSS for arrow stroke animation
  const arrowCSS = `
    @keyframes draw-arrow {
      from { stroke-dashoffset: 40; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes block-idle-glow {
      0%, 100% { box-shadow: 0 0 10px ${EP_COLORS.accent}20; }
      50% { box-shadow: 0 0 20px ${EP_COLORS.accent}35; }
    }
  `;

  if (!showStrip) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '5vw',
        top: '25vh',
        display: 'flex',
        alignItems: 'center',
        gap: GAP,
      }}
    >
      <style>{arrowCSS}</style>

      {BLOCKS.map((block, i) => (
        <div key={block.height} style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
          {/* Block */}
          <div
            className={`block-rect ${block.highlight ? 'block-highlight' : ''}`}
            style={{
              width: BLOCK_W,
              height: BLOCK_H,
              borderRadius: '1vh',
              background: block.highlight
                ? `linear-gradient(135deg, ${EP_COLORS.bgAlt}, ${EP_COLORS.bg})`
                : EP_COLORS.bgAlt,
              border: `2px solid ${block.highlight ? EP_COLORS.accent + '60' : EP_COLORS.muted + '30'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Block number */}
            <span
              className="block-label"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5vh',
                color: block.highlight ? EP_COLORS.accent : EP_COLORS.muted,
                fontWeight: block.highlight ? 700 : 400,
                position: 'absolute',
                top: '1vh',
              }}
            >
              #{block.label}
            </span>

            {/* Coinbase TX internal — revealed on zoom */}
            {block.highlight && showInternals && (
              <div
                className="coinbase-inner"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5vh',
                  marginTop: '2vh',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1.2vh',
                    color: EP_COLORS.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Coinbase TX
                </span>
                <div
                  style={{
                    padding: '0.5vh 0.8vw',
                    borderRadius: '0.4vh',
                    background: EP_COLORS.accent + '15',
                    border: `1px solid ${EP_COLORS.accent}40`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.1vh',
                      color: EP_COLORS.accent,
                      fontWeight: 600,
                    }}
                  >
                    50 BTC
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Arrow between blocks */}
          {i < BLOCKS.length - 1 && (
            <svg
              width="2.5vw"
              height="2vh"
              viewBox="0 0 40 16"
              style={{ overflow: 'visible', flexShrink: 0 }}
            >
              <line
                className="block-arrow"
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                stroke={EP_COLORS.muted + '60'}
                strokeWidth="2"
                strokeDasharray="40"
                strokeDashoffset="0"
              />
              <polygon
                className="block-arrow"
                points="30,3 40,8 30,13"
                fill={EP_COLORS.muted + '60'}
              />
            </svg>
          )}
        </div>
      ))}

      {/* TXID formation — positioned below the highlighted block */}
      {showTxid && (
        <div
          style={{
            position: 'absolute',
            top: `calc(${BLOCK_H} + 4vh)`,
            left: `calc(4 * (${BLOCK_W} + ${GAP} + 2.5vw + ${GAP}))`, // Under block 91,722 (index 4): each slot = block + inner_gap + arrow + container_gap
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1vh',
          }}
        >
          <span
            className="txid-label"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.3vh',
              color: EP_COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            TXID
          </span>
          <div style={{ display: 'flex', gap: 0 }}>
            {'e3bf3d07d4b0'.split('').map((c, i) => (
              <span
                key={i}
                className="txid-char"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.6vh',
                  fontWeight: 600,
                  color: EP_COLORS.highlight,
                  width: '1.2vw',
                  textAlign: 'center',
                }}
              >
                {c}
              </span>
            ))}
            <span
              className="txid-char"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.6vh',
                color: EP_COLORS.muted,
              }}
            >
              ...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
