import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { EP_COLORS, EP_SPRINGS } from './constants';

type UTXOMode = 'context' | 'expiration' | 'impact' | 'fix' | 'hidden';

interface UTXOOverwriteProps {
  mode: UTXOMode;
  scene: number;
}

const FONT_MONO = 'var(--font-mono)';

interface UTXOBox {
  label: string;
  block: string;
  btc: string;
  locktime?: string;
}

const UTXO_BOXES: UTXOBox[] = [
  { label: 'Block 91,722', block: '91,722', btc: '50 BTC' },
  { label: 'Block 100,000', block: '100,000', btc: '50 BTC' },
  { label: 'Block 200,000', block: '200,000', btc: '25 BTC' },
];

const FIX_BOXES: UTXOBox[] = [
  { label: 'Block 91,722', block: '91,722', btc: '50 BTC', locktime: '91,721' },
  { label: 'Block 100,000', block: '100,000', btc: '50 BTC', locktime: '99,999' },
  { label: 'Block 200,000', block: '200,000', btc: '25 BTC', locktime: '199,999' },
];

interface Fragment {
  id: number;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  size: number;
}

export default function UTXOOverwrite({ mode, scene }: UTXOOverwriteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [showDestroyed, setShowDestroyed] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    setFragments([]);
    setShowDestroyed(false);
    setShowFlash(false);

    const tl = gsap.timeline();
    tlRef.current = tl;

    if (mode === 'hidden') return;

    const boxes = el.querySelectorAll('.utxo-box');
    const dupBlock = el.querySelector('.dup-block');
    const timeline = el.querySelector('.timeline-bar');
    const threatCount = el.querySelector('.threat-count');

    if (mode === 'context') {
      tl.fromTo(boxes, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.12,
        ease: 'power3.out',
      }, 0.3);

      // Highlight height bytes
      const heightFields = el.querySelectorAll('.height-field');
      tl.to(heightFields, {
        color: EP_COLORS.highlight,
        textShadow: `0 0 8px ${EP_COLORS.highlight}60`,
        duration: 0.4,
        stagger: 0.2,
      }, 2.5);
    }

    if (mode === 'expiration') {
      tl.set(boxes, { opacity: 0.5, scale: 0.85 });

      // Timeline draws in
      if (timeline) {
        tl.fromTo(timeline, { scaleX: 0 }, {
          scaleX: 1, duration: 1.0, ease: 'power3.out',
          transformOrigin: 'left center',
        }, 0.3);
      }

      // Threat counter
      if (threatCount) {
        const counter = { val: 0 };
        tl.to(counter, {
          val: 189023,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            if (threatCount) {
              threatCount.textContent = Math.round(counter.val).toLocaleString();
            }
          },
        }, 2.0);
      }
    }

    if (mode === 'impact') {
      tl.set(boxes, { opacity: 1, scale: 1 });

      // Highlight box 1
      tl.to(boxes[0], {
        scale: 1.3,
        boxShadow: `0 0 20px ${EP_COLORS.highlight}60`,
        duration: 0.4,
      }, 0.3);

      // Duplicate slides in
      if (dupBlock) {
        tl.fromTo(dupBlock, { opacity: 0, x: 400 }, {
          opacity: 1, x: 0, duration: 0.5, ease: 'power3.out',
        }, 1.0);
      }

      // IMPACT at 2.5s
      tl.call(() => {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 80);

        // Generate fragments from box 1 position
        const newFragments: Fragment[] = [];
        for (let i = 0; i < 12; i++) {
          newFragments.push({
            id: i,
            x: 0,
            y: 0,
            rotation: Math.random() * 360,
            vx: (Math.random() - 0.5) * 600,
            vy: -100 - Math.random() * 400,
            size: 8 + Math.random() * 16,
          });
        }
        setFragments(newFragments);
        setShowDestroyed(true);
      }, [], 2.3);

      // Screen shake
      tl.to(el, {
        x: 5, duration: 0.05, yoyo: true, repeat: 11,
        ease: 'power1.inOut',
      }, 2.3);

      // Hide box 1 after impact
      tl.to(boxes[0], {
        opacity: 0, scale: 0, duration: 0.1,
      }, 2.3);
    }

    if (mode === 'fix') {
      // Calm rebuild
      const fixBoxes = el.querySelectorAll('.fix-box');
      tl.fromTo(fixBoxes, { opacity: 0, y: 15 }, {
        opacity: 1, y: 0, duration: 0.5,
        stagger: 0.1, ease: 'power2.out',
      }, 0.3);

      // Locktime fields glow green
      const ltFields = el.querySelectorAll('.locktime-field');
      tl.to(ltFields, {
        backgroundColor: EP_COLORS.statusGreen + '30',
        duration: 0.4,
        stagger: 0.2,
      }, 1.0);
    }

    return () => {
      tl.kill();
    };
  }, [mode, scene]);

  if (mode === 'hidden') return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        fontFamily: FONT_MONO,
      }}
    >
      {/* White flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'white',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* UTXO boxes (context + impact) */}
      {(mode === 'context' || mode === 'impact' || mode === 'expiration') && (
        <div style={{
          display: 'flex',
          gap: '24px',
          position: 'absolute',
          top: mode === 'expiration' ? '40px' : '160px',
          left: '60px',
        }}>
          {UTXO_BOXES.map((box, i) => (
            <div
              key={box.block}
              className="utxo-box"
              style={{
                width: '180px',
                height: '80px',
                background: EP_COLORS.bgAlt,
                border: `1px solid ${EP_COLORS.textMuted}40`,
                borderRadius: 6,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 4,
                opacity: 0,
              }}
            >
              <span style={{ fontSize: 11, color: EP_COLORS.textMuted }}>
                {box.label} — Coinbase
              </span>
              <span className="height-field" style={{
                fontSize: 16, fontWeight: 'bold', color: EP_COLORS.text,
              }}>
                {box.btc}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate block (impact mode) */}
      {mode === 'impact' && (
        <div
          className="dup-block"
          style={{
            position: 'absolute',
            top: '300px',
            right: '60px',
            width: '200px',
            height: '80px',
            background: EP_COLORS.bgAlt,
            border: `2px solid ${EP_COLORS.actCoinbase}`,
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
            opacity: 0,
          }}
        >
          <span style={{ fontSize: 11, color: EP_COLORS.actCoinbase, fontWeight: 'bold' }}>
            Block 91,880 — SAME TXID
          </span>
          <span style={{ fontSize: 10, color: EP_COLORS.statusRed }}>
            Overwrites UTXO entry
          </span>
        </div>
      )}

      {/* Shatter fragments */}
      {fragments.map((f) => (
        <motion.div
          key={f.id}
          initial={{
            x: 120,
            y: 200,
            rotate: 0,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: 120 + f.vx,
            y: 200 + f.vy,
            rotate: f.rotation,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: f.size,
            height: f.size,
            background: EP_COLORS.bgAlt,
            border: `1px solid ${EP_COLORS.actCoinbase}60`,
            borderRadius: 2,
            zIndex: 40,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Destroyed text */}
      <AnimatePresence>
        {showDestroyed && mode === 'impact' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={EP_SPRINGS.coinbaseShatter}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 30,
            }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 'bold',
              color: EP_COLORS.actCoinbase,
            }}>
              100 BTC DESTROYED
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 8,
                fontSize: 14,
                color: EP_COLORS.textMuted,
              }}
            >
              Blocks 91,722 & 91,880
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expiration timeline */}
      {mode === 'expiration' && (
        <div style={{ position: 'absolute', top: '200px', left: '60px', right: '60px' }}>
          <div
            className="timeline-bar"
            style={{
              width: '100%',
              height: 3,
              background: EP_COLORS.textMuted + '60',
              borderRadius: 2,
              transformOrigin: 'left center',
              position: 'relative',
            }}
          >
            {/* Markers */}
            {[
              { label: '2012 (BIP 34)', pos: '5%' },
              { label: 'Today', pos: '45%' },
              { label: '~2047', pos: '90%' },
            ].map((marker) => (
              <div
                key={marker.label}
                style={{
                  position: 'absolute',
                  left: marker.pos,
                  top: -20,
                  fontSize: 11,
                  color: EP_COLORS.textMuted,
                  whiteSpace: 'nowrap',
                  transform: 'translateX(-50%)',
                }}
              >
                {marker.label}
              </div>
            ))}

            {/* Warning at 2047 */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                position: 'absolute',
                right: '8%',
                top: 10,
                fontSize: 12,
                color: EP_COLORS.actQuadratic,
                whiteSpace: 'nowrap',
              }}
            >
              ⚠ Block 1,983,702
            </motion.div>
          </div>

          {/* Threat counter */}
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <span
              className="threat-count"
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: EP_COLORS.actCoinbase,
              }}
            >
              0
            </span>
            <div style={{ fontSize: 13, color: EP_COLORS.textMuted, marginTop: 4 }}>
              coinbases that can be duplicated
            </div>
          </div>
        </div>
      )}

      {/* Fix mode boxes */}
      {mode === 'fix' && (
        <div style={{
          display: 'flex',
          gap: '24px',
          position: 'absolute',
          top: '140px',
          left: '60px',
        }}>
          {FIX_BOXES.map((box) => (
            <div
              key={box.block}
              className="fix-box"
              style={{
                width: '180px',
                padding: '10px 12px',
                background: EP_COLORS.bgAlt,
                border: `1px solid ${EP_COLORS.textMuted}40`,
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: 0,
              }}
            >
              <span style={{ fontSize: 11, color: EP_COLORS.textMuted }}>
                {box.label} — Coinbase
              </span>
              <span style={{ fontSize: 14, fontWeight: 'bold', color: EP_COLORS.text }}>
                {box.btc}
              </span>
              <div
                className="locktime-field"
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  color: EP_COLORS.statusGreen,
                  background: 'transparent',
                  transition: 'background 0.4s',
                }}
              >
                nLockTime: {box.locktime}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guarantee label */}
      {mode === 'fix' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          style={{
            position: 'absolute',
            bottom: '200px',
            left: '60px',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: EP_COLORS.statusGreen,
          }}
        >
          Every coinbase permanently unique.
        </motion.div>
      )}
    </div>
  );
}
