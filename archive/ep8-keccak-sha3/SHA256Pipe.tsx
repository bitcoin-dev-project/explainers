/**
 * SHA256Pipe — Act 1 visual: Merkle-Damgård pipeline.
 *
 * A horizontal chain of compression boxes connected by pipes.
 * Data flows left→right, IV enters from the left, hash exits right.
 * In "attack" mode, red blocks snap onto the end — the attacker
 * extends the pipe without knowing the original input.
 *
 * Uses SVG + GSAP for choreographed path drawing and data flow.
 */

import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, PIPE_BLOCKS, ATTACK_BLOCKS } from './constants';

interface SHA256PipeProps {
  scene: number;
  /** Show the attack extension blocks */
  showAttack?: boolean;
  /** Mini mode for comparison view */
  mini?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Layout constants
const BOX_W = 80;
const BOX_H = 60;
const PIPE_LEN = 50;
const GAP = 10;
const SLOT = BOX_W + PIPE_LEN + GAP;
const IV_W = 60;
const PAD = 30;

export default function SHA256Pipe({
  scene,
  showAttack = false,
  mini = false,
  className,
  style,
}: SHA256PipeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const allBlocks = useMemo(() => {
    const blocks = [...PIPE_BLOCKS];
    if (showAttack) blocks.push(...ATTACK_BLOCKS);
    return blocks;
  }, [showAttack]);

  const totalW = IV_W + GAP + allBlocks.length * SLOT + PAD * 2;
  const totalH = BOX_H + 80;
  const cy = totalH / 2;
  const scaleFactor = mini ? 0.55 : 1;

  // GSAP choreography
  useSceneGSAP(containerRef, scene, {
    1: (tl) => {
      // Pipeline builds left→right
      tl.from('.pipe-iv', { opacity: 0, x: -30, duration: 0.6, ease: 'power3.out' })
        .from('.pipe-box', {
          opacity: 0,
          scale: 0.5,
          stagger: 0.2,
          duration: 0.5,
          ease: 'back.out(1.7)',
        }, '-=0.3')
        .from('.pipe-connector', {
          scaleX: 0,
          transformOrigin: 'left center',
          stagger: 0.15,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=1')
        .from('.pipe-output', { opacity: 0, x: 20, duration: 0.5 }, '-=0.2');
    },
    2: (tl) => {
      // Data flows through — highlight each box in sequence
      tl.to('.pipe-box', {
        borderColor: EP_COLORS.rate,
        stagger: 0.3,
        duration: 0.15,
        ease: 'power2.in',
      })
        .to('.pipe-box', {
          borderColor: EP_COLORS.muted,
          stagger: 0.3,
          duration: 0.4,
          ease: 'power2.out',
        }, '+=0.1')
        .to('.pipe-flow', {
          opacity: 1,
          stagger: 0.25,
          duration: 0.2,
        }, 0)
        .to('.pipe-flow', {
          x: PIPE_LEN + BOX_W,
          stagger: 0.25,
          duration: 0.6,
          ease: 'power1.inOut',
        }, 0.1);
    },
    3: (tl) => {
      // Highlight the output — it's the internal state!
      tl.to('.pipe-output-hash', {
        color: EP_COLORS.highlight,
        scale: 1.15,
        duration: 0.4,
        ease: 'power2.out',
      })
        .to('.pipe-output-box', {
          boxShadow: `0 0 20px ${EP_COLORS.highlight}40`,
          duration: 0.5,
        }, '-=0.2')
        .from('.state-label', {
          opacity: 0,
          y: 15,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.2');
    },
    4: (tl) => {
      // ATTACK — red blocks snap on
      if (!showAttack) return;
      tl.from('.attack-block', {
        opacity: 0,
        x: 60,
        scale: 0.3,
        stagger: 0.15,
        duration: 0.3,
        ease: 'power4.out',
      })
        .to('.pipe-container', {
          x: -40,
          duration: 0.6,
          ease: 'power2.inOut',
        }, 0)
        .from('.attack-connector', {
          scaleX: 0,
          transformOrigin: 'left center',
          stagger: 0.12,
          duration: 0.25,
          ease: 'power2.out',
        }, '-=0.3')
        // Shake on impact
        .to('.pipe-container', {
          x: -38,
          duration: 0.05,
          ease: 'none',
          yoyo: true,
          repeat: 5,
        }, '-=0.1');
    },
  });

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      <div className="pipe-container" style={{ position: 'relative', width: totalW, height: totalH }}>
        <svg
          width={totalW}
          height={totalH}
          viewBox={`0 0 ${totalW} ${totalH}`}
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
        >
          {/* Connectors between boxes */}
          {allBlocks.map((_, i) => {
            const x = PAD + IV_W + GAP + i * SLOT + BOX_W;
            const isAttack = i >= PIPE_BLOCKS.length;
            return (
              <rect
                key={`conn-${i}`}
                className={isAttack ? 'attack-connector' : 'pipe-connector'}
                x={x}
                y={cy - 3}
                width={PIPE_LEN}
                height={6}
                rx={3}
                fill={isAttack ? EP_COLORS.danger + '80' : EP_COLORS.pipe + '60'}
              />
            );
          })}

          {/* Data flow dots (scene 2 animation) */}
          {PIPE_BLOCKS.map((_, i) => {
            const x = PAD + IV_W + GAP + i * SLOT;
            return (
              <circle
                key={`flow-${i}`}
                className="pipe-flow"
                cx={x}
                cy={cy}
                r={4}
                fill={EP_COLORS.rateGlow}
                opacity={0}
              />
            );
          })}
        </svg>

        {/* IV block */}
        <div
          className="pipe-iv"
          style={{
            position: 'absolute',
            left: PAD,
            top: cy - BOX_H / 2,
            width: IV_W,
            height: BOX_H,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${EP_COLORS.bgAlt}, ${EP_COLORS.capacity})`,
            border: `1.5px solid ${EP_COLORS.muted}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: EP_COLORS.muted,
            letterSpacing: 1,
          }}>IV</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: EP_COLORS.muted + '80',
            marginTop: 2,
          }}>256 bit</span>
        </div>

        {/* Compression boxes */}
        {allBlocks.map((block, i) => {
          const x = PAD + IV_W + GAP + i * SLOT;
          const isAttack = i >= PIPE_BLOCKS.length;
          return (
            <motion.div
              key={`box-${i}`}
              className={isAttack ? 'attack-block' : 'pipe-box'}
              style={{
                position: 'absolute',
                left: x,
                top: cy - BOX_H / 2,
                width: BOX_W,
                height: BOX_H,
                borderRadius: 8,
                background: isAttack
                  ? `linear-gradient(135deg, ${EP_COLORS.danger}20, ${EP_COLORS.danger}10)`
                  : `linear-gradient(135deg, ${EP_COLORS.bgAlt}, ${EP_COLORS.bg})`,
                border: `1.5px solid ${isAttack ? EP_COLORS.danger + '60' : EP_COLORS.muted + '40'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxShadow: isAttack ? `0 0 12px ${EP_COLORS.danger}30` : 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                color: isAttack ? EP_COLORS.danger : EP_COLORS.text,
              }}>
                {block.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: EP_COLORS.muted,
                marginTop: 2,
              }}>
                {isAttack ? 'FORGED' : 'f(H,M)'}
              </span>
            </motion.div>
          );
        })}

        {/* Output hash */}
        <div
          className="pipe-output"
          style={{
            position: 'absolute',
            left: PAD + IV_W + GAP + (showAttack ? allBlocks.length : PIPE_BLOCKS.length) * SLOT - PIPE_LEN,
            top: cy - BOX_H / 2 - 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="pipe-output-box"
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              background: EP_COLORS.bgAlt,
              border: `1px solid ${EP_COLORS.highlight}40`,
            }}
          >
            <span
              className="pipe-output-hash"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: EP_COLORS.text,
                letterSpacing: 0.5,
              }}
            >
              H(M) = a7f3b2...
            </span>
          </div>
          <span
            className="state-label"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: EP_COLORS.danger,
              marginTop: 4,
              opacity: 0,
            }}
          >
            output = internal state
          </span>
        </div>
      </div>
    </div>
  );
}
