/**
 * BlockAnatomy — Act 1 intro visual.
 *
 * A stylized Bitcoin block that assembles piece by piece, then opens
 * to reveal transactions inside. One transaction expands to show
 * signature operations (inputs that each hash the whole tx).
 *
 * Driven by morph() + useSceneGSAP — NOT CE.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { morph, sceneRange } from '@/lib/video/canvas';
import { useSceneGSAP } from '@/lib/video/gsap-utils';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface BlockAnatomyProps {
  scene: number;
}

// Transaction rows inside the block
const TX_ROWS = [
  { id: 'tx1', hash: '7a3b1c...', inputs: 2, fee: '0.00012' },
  { id: 'tx2', hash: 'f91d4e...', inputs: 1, fee: '0.00008' },
  { id: 'tx3', hash: '2c8f07...', inputs: 3, fee: '0.00021' },
  { id: 'tx4', hash: 'b45e92...', inputs: 1, fee: '0.00005' },
  { id: 'tx5', hash: 'e83a6d...', inputs: 4, fee: '0.00034' },
];

// Signature operation dots for the expanded tx
const SIG_OPS = ['Input 0', 'Input 1', 'Input 2'];

export default function BlockAnatomy({ scene }: BlockAnatomyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP choreography for assembling and revealing
  useSceneGSAP(containerRef, scene, {
    // Scene 1: Block assembles
    1: (tl) => {
      tl.from('.block-header', {
        y: -40, opacity: 0, duration: 0.6, ease: 'power3.out',
      })
      .from('.block-body', {
        scaleY: 0, opacity: 0, duration: 0.8, ease: 'power2.out',
        transformOrigin: 'top center',
      }, '-=0.3')
      .from('.block-label', {
        opacity: 0, x: -15, duration: 0.4, ease: 'power2.out',
      }, '-=0.4');
    },
    // Scene 2: Open and reveal transactions, then highlight sig ops
    2: (tl) => {
      tl.from('.tx-row', {
        opacity: 0, x: -20, stagger: 0.1, duration: 0.4, ease: 'power2.out',
      })
      .to('.tx-highlight', {
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: EP_COLORS.cool,
        duration: 0.4,
      }, '+=0.3')
      .from('.sig-op', {
        opacity: 0, scale: 0.5, stagger: 0.15, duration: 0.3, ease: 'back.out(2)',
      }, '-=0.1')
      .from('.sig-arrow', {
        scaleX: 0, opacity: 0, stagger: 0.1, duration: 0.3, ease: 'power2.out',
        transformOrigin: 'left center',
      }, '-=0.3')
      .from('.sig-label', {
        opacity: 0, duration: 0.4,
      }, '-=0.2');
    },
  });

  const showBlock = sceneRange(scene, 1, 4);
  const showTxs = sceneRange(scene, 2, 4);
  const showSigs = sceneRange(scene, 2, 4);

  if (!showBlock) return null;

  return (
    <motion.div
      ref={containerRef}
      {...morph(scene, {
        1: { scale: 1, x: 0, y: 0 },
        2: { scale: 1, x: '-2vw', y: 0 },
        3: { scale: 0.85, x: '-5vw', y: '-3vh', opacity: 0.6 },
      })}
      style={{
        position: 'absolute',
        left: '8vw',
        top: '15vh',
        width: '38vw',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Block shell */}
      <div
        className="block-header"
        style={{
          background: `linear-gradient(135deg, ${EP_COLORS.surface}, ${EP_COLORS.bgGradient})`,
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: '8px 8px 0 0',
          padding: '1.2vh 1.5vw',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span className="block-label" style={{ color: EP_COLORS.text, fontSize: '1.5vw', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Block #841,204
        </span>
        <span style={{ color: EP_COLORS.textMuted, fontSize: '1vw' }}>
          3,248 transactions
        </span>
      </div>

      <div
        className="block-body"
        style={{
          background: EP_COLORS.surface,
          border: `1px solid rgba(255,255,255,0.06)`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '1vh 1vw',
          overflow: 'hidden',
        }}
      >
        {/* Transaction list */}
        {showTxs && TX_ROWS.map((tx, i) => (
          <div
            key={tx.id}
            className={`tx-row ${i === 2 ? 'tx-highlight' : ''}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6vh 0.8vw',
              marginBottom: '0.4vh',
              borderRadius: '4px',
              border: '1px solid transparent',
              background: i === 2 ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'background 0.3s, border-color 0.3s',
            }}
          >
            <span style={{ color: EP_COLORS.warm, fontSize: '0.9vw' }}>{tx.hash}</span>
            <span style={{ color: EP_COLORS.textMuted, fontSize: '0.8vw' }}>
              {tx.inputs} input{tx.inputs > 1 ? 's' : ''} / {tx.fee} BTC
            </span>
          </div>
        ))}

        {/* Signature operations expanded from highlighted tx */}
        {showSigs && (
          <div
            style={{
              marginTop: '1.5vh',
              marginLeft: '2vw',
              padding: '1vh 1vw',
              borderLeft: `2px solid ${EP_COLORS.cool}`,
            }}
          >
            <div className="sig-label" style={{ color: EP_COLORS.textMuted, fontSize: '0.8vw', marginBottom: '0.8vh' }}>
              Each input re-hashes the entire transaction:
            </div>
            {SIG_OPS.map((op, i) => (
              <div
                key={op}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8vw',
                  marginBottom: '0.6vh',
                }}
              >
                <div
                  className="sig-op"
                  style={{
                    width: '2.2vw',
                    height: '2.2vw',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${EP_COLORS.cool}, ${EP_COLORS.warm})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: EP_COLORS.textBright,
                    fontSize: '0.7vw',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {i}
                </div>
                <div
                  className="sig-arrow"
                  style={{
                    height: '2px',
                    width: '4vw',
                    background: `linear-gradient(to right, ${EP_COLORS.cool}, transparent)`,
                    flexShrink: 0,
                  }}
                />
                <span className="sig-op" style={{ color: EP_COLORS.text, fontSize: '0.8vw' }}>
                  SHA256(SHA256(tx_data))
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
