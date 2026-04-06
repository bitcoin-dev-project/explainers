// VideoTemplate.tsx — EP112: Duplicate Coinbase Transactions
// 19 scenes (~2:26) — forensic byte autopsy of coinbase uniqueness.
// Act 1 (0-6): The incident. Act 2 (7-11): The false fix. Act 3 (12-18): The real fix.

import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  useVideoPlayer, DevControls, CE, morph, sceneRange,
  createThemedCE, useSceneGSAP,
} from '@/lib/video';
import ByteStripCanvas, { type StripMode } from './ByteStripCanvas';
import CountdownTimeline from './CountdownTimeline';
import FieldContrast from './FieldContrast';
import {
  EP_COLORS, EP_SPRINGS, SCENE_DURATIONS, EP112_CE_THEME,
  BIP54_LOCKTIME_HEX, EXAMPLE_TXID,
} from './constants';

// ─── Themed CE ───────────────────────────────────────────────────────

const ECE = createThemedCE(EP112_CE_THEME);

// ─── Strip mode from scene ───────────────────────────────────────────

function stripMode(s: number): StripMode {
  if (s === 2) return 'anatomy';
  if (s === 3) return 'miner';
  if (s === 4) return 'duplicate';
  if (s === 5) return 'overwrite';
  if (s === 6) return 'aftermath';
  if (s === 7) return 'normal';
  if (s >= 8 && s <= 11) return 'zoom-scriptsig';
  if (s === 12) return 'split-highlight';
  if (s === 16) return 'fixed';
  return 'hidden';
}

// ─── Byte rain chars for title ───────────────────────────────────────

function ByteRain() {
  const chars = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      char: Math.floor(Math.random() * 16).toString(16).toUpperCase(),
      left: `${(i / 45) * 100}%`,
      delay: `${Math.random() * 4}s`,
      speed: `${3 + Math.random() * 5}s`,
    })), [],
  );
  return (
    <>
      <style>{`
        @keyframes bytefall {
          from { transform: translateY(-20px); }
          to   { transform: translateY(110vh); }
        }
      `}</style>
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            top: -20,
            color: EP_COLORS.muted,
            opacity: 0.15,
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 14,
            animation: `bytefall ${c.speed} linear infinite`,
            animationDelay: c.delay,
            pointerEvents: 'none',
          }}
        >
          {c.char}
        </span>
      ))}
    </>
  );
}

// ─── Main Template ───────────────────────────────────────────────────

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const counterVal = useRef({ v: 100 });

  // ── GSAP choreography per scene ──
  useSceneGSAP(rootRef, s, {
    // Scene 1: block container
    1: (tl) => {
      tl.from('.block-rect', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from('.tx-row', { x: -30, opacity: 0, stagger: 0.1, duration: 0.2 })
        .to('.tx-row-0', { borderColor: EP_COLORS.accent, backgroundColor: EP_COLORS.byte, duration: 0.3 })
        .from('.coinbase-label', { opacity: 0, x: 20, duration: 0.3 });
    },
    // Scene 5: BTC counter
    5: (tl) => {
      counterVal.current.v = 100;
      tl.to(counterVal.current, {
        v: 0, duration: 2, delay: 2.5, snap: { v: 1 },
        ease: 'power2.in',
        onUpdate: () => {
          if (counterRef.current) {
            const v = Math.round(counterVal.current.v);
            counterRef.current.textContent = `${v} BTC`;
            counterRef.current.style.color = v > 50 ? EP_COLORS.success : EP_COLORS.danger;
          }
        },
      });
    },
    // Scene 7: BIP-30 band-aid
    7: (tl) => {
      tl.from('.bip30-badge', { scale: 0, rotation: -15, duration: 0.2, ease: 'back.out(3)' })
        .from('.bip30-rule', { opacity: 0, x: 30, duration: 0.3 })
        .from('.bandaid-stamp', { scale: 3, opacity: 0, rotation: -20, duration: 0.2 }, '+=0.8');
    },
    // Scene 8: BIP-34 height injection
    8: (tl) => {
      tl.from('.bip34-badge', { x: -80, opacity: 0, duration: 0.3 })
        .from('.height-bytes .hb', { opacity: 0, scale: 0.5, stagger: 0.15, duration: 0.3, ease: 'back.out(2)' }, '+=0.4');
    },
    // Scene 9: false confidence — checkmark
    9: (tl) => {
      tl.from('.big-check', { scale: 0, duration: 0.3, ease: 'back.out(3)' })
        .to('.big-check', { color: EP_COLORS.muted, duration: 0.5 }, '+=1.5')
        .from('.crack-line', { scaleY: 0, duration: 0.2 }, '-=0.5')
        .to('.big-check', { scale: 0, rotation: 45, opacity: 0, duration: 0.4, ease: 'power3.in' }, '+=0.5');
    },
    // Scene 15: proof column
    15: (tl) => {
      tl.from('.proof-row', { x: -30, opacity: 0, stagger: 0.15, duration: 0.3 })
        .from('.gold-col-highlight', { scaleY: 0, transformOrigin: 'top', duration: 0.5 }, '+=0.3')
        .from('.neq-line', { opacity: 0, stagger: 0.1, duration: 0.2 }, '+=0.2');
    },
    // Scene 17: three-column summary
    17: (tl) => {
      tl.from('.summary-card', { y: 60, opacity: 0, stagger: 0.15, duration: 0.4, ease: 'power2.out' })
        .from('.summary-line', { scaleX: 0, transformOrigin: 'left', duration: 0.5 }, '+=0.2')
        .to('.summary-card-2', { scale: 1.05, boxShadow: `0 0 30px ${EP_COLORS.highlight}40`, duration: 0.4 }, '-=0.2');
    },
  });

  // ── Background warm shift for AHA scene (16) ──
  useEffect(() => {
    if (!rootRef.current) return;
    if (s === 16) {
      gsap.to(rootRef.current, { backgroundColor: EP_COLORS.bgWarm, duration: 0.6 });
    } else {
      gsap.to(rootRef.current, { backgroundColor: EP_COLORS.bg, duration: 0.4 });
    }
  }, [s]);

  // Whether to show the byte strip
  const showStrip = sceneRange(s, 2, 12) || s === 16;

  // Historical coinbase rows for scene 15
  const proofRows = [
    { block: '#1', locktime: '00 00 00 00', color: EP_COLORS.textDim },
    { block: '#91,722', locktime: '00 00 00 00', color: EP_COLORS.danger },
    { block: '#91,880', locktime: '00 00 00 00', color: EP_COLORS.danger },
    { block: '#164,384', locktime: '00 00 00 00', color: EP_COLORS.accent },
    { block: '#227,835', locktime: '00 00 00 00', color: EP_COLORS.textDim },
    { block: '#500,000', locktime: '00 00 00 00', color: EP_COLORS.textDim },
  ];

  return (
    <div
      ref={rootRef}
      data-video="ep112"
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: EP_COLORS.bg }}
    >
      {/* ═══════════ SCENE 0: Title Card ═══════════ */}
      {sceneRange(s, 0, 1) && <ByteRain />}

      <ECE s={s} enter={0} exit={1}>
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 64,
            color: EP_COLORS.text, letterSpacing: -1,
          }}>
            DUPLICATE COINBASE<br />TRANSACTIONS
          </h1>
          <p style={{
            fontFamily: 'Quicksand,sans-serif', fontSize: 24, color: EP_COLORS.textDim,
            marginTop: 16,
          }}>
            How identical transactions broke Bitcoin's ledger
          </p>
          <div style={{
            width: 200, height: 2, backgroundColor: '#EB5234',
            margin: '20px auto 0', animation: 'accentGrow 0.6s ease-out 1.4s both',
          }} />
        </div>
      </ECE>

      {/* ═══════════ SCENE 1: What's a Coinbase? ═══════════ */}
      {sceneRange(s, 1, 1) && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <div className="block-rect" style={{
            width: 460, padding: '16px 24px', backgroundColor: EP_COLORS.bgPanel,
            border: `2px solid ${EP_COLORS.accentAlt}`, borderRadius: 12, opacity: 0,
          }}>
            <div style={{
              fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 22,
              color: EP_COLORS.text, marginBottom: 12,
            }}>
              Block #91,722
            </div>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`tx-row tx-row-${i}`} style={{
                height: 36, borderRadius: 6, marginBottom: 6,
                backgroundColor: i === 0 ? EP_COLORS.byte : `${EP_COLORS.muted}30`,
                border: `1px solid ${i === 0 ? EP_COLORS.accent : 'transparent'}`,
                display: 'flex', alignItems: 'center', paddingLeft: 12,
                fontFamily: '"JetBrains Mono",monospace', fontSize: 13,
                color: i === 0 ? EP_COLORS.accent : EP_COLORS.muted,
                opacity: 0,
              }}>
                {i === 0 ? 'tx_0 (coinbase)' : `tx_${i}`}
              </div>
            ))}
            <span className="coinbase-label" style={{
              position: 'absolute', right: -120, top: 60,
              fontFamily: '"JetBrains Mono",monospace', fontSize: 18,
              color: EP_COLORS.accent, fontWeight: 700, opacity: 0,
            }}>
              COINBASE
            </span>
          </div>
        </div>
      )}

      <ECE s={s} enter={1} exit={2} delay={0.6}>
        <p style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
          textAlign: 'center', maxWidth: 600,
        }}>
          Every block starts with a special transaction: the coinbase.
        </p>
      </ECE>

      {/* ═══════════ ByteStripCanvas (scenes 2-12, 16) ═══════════ */}
      {showStrip && (
        <motion.div
          style={{ position: 'absolute', left: '50%', transformOrigin: 'center center' }}
          {...morph(s, {
            2:  { top: '50%', x: '-50%', y: '-50%', scale: 1 },
            4:  { top: '42%', x: '-50%', y: '-50%', scale: 1 },
            7:  { top: '20%', x: '-50%', y: '-50%', scale: 0.85 },
            8:  { top: '16%', x: '-50%', y: '-50%', scale: 0.85 },
            10: { top: '14%', x: '-50%', y: '-50%', scale: 0.65 },
            12: { top: '46%', x: '-50%', y: '-50%', scale: 1 },
            16: { top: '50%', x: '-50%', y: '-50%', scale: 1 },
          }, EP_SPRINGS.reveal)}
        >
          <ByteStripCanvas
            mode={stripMode(s)}
            scene={s}
            locktimeHex={s === 16 ? BIP54_LOCKTIME_HEX : undefined}
          />
        </motion.div>
      )}

      {/* ═══════════ SCENE 2: Anatomy labels ═══════════ */}
      <ECE s={s} enter={2} exit={3} delay={1.0}>
        <p style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          A coinbase transaction, byte by byte.
        </p>
      </ECE>

      {/* ═══════════ SCENE 3: Miner controls ═══════════ */}
      <ECE s={s} enter={3} exit={4} delay={0.5}>
        <p style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          The miner controls every byte.
        </p>
      </ECE>

      {/* ═══════════ SCENE 4: Duplicate — Red "=" + TXID ═══════════ */}
      {sceneRange(s, 4, 4) && (
        <>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={EP_SPRINGS.snap}
            style={{
              position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)',
              fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 52,
              color: EP_COLORS.danger, zIndex: 5,
            }}
          >
            =
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, ...EP_SPRINGS.reveal }}
            style={{
              position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
              fontFamily: '"JetBrains Mono",monospace', fontSize: 14, color: EP_COLORS.text,
              textAlign: 'center',
            }}
          >
            <span style={{ color: EP_COLORS.accent }}>TXID: </span>{EXAMPLE_TXID}
          </motion.div>
        </>
      )}

      <ECE s={s} enter={4} exit={5} delay={1.2}>
        <p style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          Same bytes in. Same hash out. Same TXID.
        </p>
      </ECE>

      {/* ═══════════ SCENE 5: Overwrite — UTXO + counter ═══════════ */}
      {sceneRange(s, 5, 5) && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            position: 'absolute', right: '4vw', top: '35%',
            width: 300, padding: 16, backgroundColor: EP_COLORS.bgPanel,
            border: `1px solid ${EP_COLORS.accentAlt}`, borderRadius: 10,
          }}
        >
          <div style={{
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16,
            color: EP_COLORS.text, marginBottom: 10,
          }}>
            UTXO SET
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 13, color: EP_COLORS.success,
            padding: '6px 0', borderBottom: `1px solid ${EP_COLORS.muted}40`,
          }}>
            d5ef...a31c &nbsp;|&nbsp; 50 BTC
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 13, color: EP_COLORS.danger,
            padding: '6px 0', textDecoration: 'line-through', opacity: 0.5,
          }}>
            d5ef...a31c &nbsp;|&nbsp; 50 BTC
          </div>
        </motion.div>
      )}

      {/* BTC Counter */}
      {sceneRange(s, 5, 5) && (
        <span
          ref={counterRef}
          style={{
            position: 'absolute', left: '8vw', top: '22%',
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 48,
            color: EP_COLORS.success,
          }}
        >
          100 BTC
        </span>
      )}

      <ECE s={s} enter={5} exit={6} delay={2.5}>
        <p style={{
          position: 'absolute', bottom: '8vh', left: '8vw',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 18, color: EP_COLORS.muted,
        }}>
          November 2010
        </p>
      </ECE>

      <ECE s={s} enter={5} exit={6} delay={3.0}>
        <p style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          The duplicate silently overwrote the original.
        </p>
      </ECE>

      {/* ═══════════ SCENE 6: Aftermath ═══════════ */}
      <ECE s={s} enter={6} exit={7} delay={0.3}>
        <p style={{
          position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 34,
          color: EP_COLORS.danger, textAlign: 'center',
        }}>
          Not stolen. Not locked. Erased.
        </p>
      </ECE>

      <ECE s={s} enter={6} exit={7} delay={1.0}>
        <p style={{
          position: 'absolute', bottom: '14%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 15, color: EP_COLORS.textDim,
        }}>
          Also breaks: Merkle proof uniqueness
        </p>
      </ECE>

      {/* ═══════════ SCENE 7: BIP-30 Band-Aid ═══════════ */}
      {sceneRange(s, 7, 7) && (
        <div style={{ position: 'absolute', left: '10vw', top: '50%', transform: 'translateY(-50%)' }}>
          <div className="bip30-badge" style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 8,
            backgroundColor: EP_COLORS.accent, color: '#fff',
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 22,
          }}>
            BIP-30
          </div>
          <p className="bip30-rule" style={{
            fontFamily: 'Quicksand,sans-serif', fontSize: 18, color: EP_COLORS.text,
            marginTop: 12, maxWidth: 320, opacity: 0,
          }}>
            Check UTXO set for every coinbase
          </p>
          <div className="bandaid-stamp" style={{
            position: 'absolute', top: -10, left: -10,
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 28,
            color: EP_COLORS.danger, transform: 'rotate(-18deg)',
            opacity: 0,
          }}>
            BAND-AID
          </div>
        </div>
      )}

      <ECE s={s} enter={7} exit={8} delay={1.5}>
        <p style={{
          position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.textDim,
        }}>
          A fix, but an expensive one.
        </p>
      </ECE>

      {/* ═══════════ SCENE 8: BIP-34 ═══════════ */}
      {sceneRange(s, 8, 9) && (
        <div className="bip34-badge" style={{
          position: 'absolute', left: '6vw', top: '12%',
          display: 'inline-block', padding: '8px 20px', borderRadius: 8,
          backgroundColor: EP_COLORS.success, color: '#fff',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 20,
          opacity: 0,
        }}>
          BIP-34
        </div>
      )}

      <ECE s={s} enter={8} exit={9} delay={0.3}>
        <p style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          2012: Encode the block height in scriptSig.
        </p>
      </ECE>

      {/* Height bytes injection visual */}
      {sceneRange(s, 8, 9) && (
        <div className="height-bytes" style={{
          position: 'absolute', left: '50%', top: '56%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {['03', '79', '83'].map((hex, i) => (
            <span key={i} className="hb" style={{
              display: 'inline-block', padding: '6px 10px', borderRadius: 6,
              backgroundColor: EP_COLORS.byte, border: `2px solid ${EP_COLORS.success}`,
              boxShadow: `0 0 12px ${EP_COLORS.success}50`,
              fontFamily: '"JetBrains Mono",monospace', fontSize: 18,
              color: EP_COLORS.success, opacity: 0,
            }}>
              {hex}
            </span>
          ))}
          <span style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 16,
            color: EP_COLORS.success, marginLeft: 12,
          }}>
            height = 227,835
          </span>
        </div>
      )}

      <ECE s={s} enter={8} exit={9} delay={1.5}>
        <p style={{
          position: 'absolute', top: '68%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 18, color: EP_COLORS.text,
        }}>
          Unique height → unique scriptSig → unique TXID
        </p>
      </ECE>

      {/* ═══════════ SCENE 9: False Confidence ═══════════ */}
      {sceneRange(s, 9, 9) && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <div className="big-check" style={{
            fontSize: 72, color: EP_COLORS.success, position: 'relative',
          }}>
            ✓
            <div className="crack-line" style={{
              position: 'absolute', top: 0, left: '50%', width: 2, height: '100%',
              backgroundColor: EP_COLORS.danger, transformOrigin: 'top', transform: 'scaleY(0)',
            }} />
          </div>
        </div>
      )}

      <ECE s={s} enter={9} exit={10} delay={0.2}>
        <p style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 30,
          color: EP_COLORS.text,
        }}>
          Problem solved?
        </p>
      </ECE>

      {/* ═══════════ SCENES 10-11: Countdown Timeline ═══════════ */}
      {sceneRange(s, 10, 11) && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', left: '50%', top: '38%',
            transform: 'translateX(-50%)',
          }}
        >
          <CountdownTimeline scene={s} active={sceneRange(s, 10, 11)} />
        </motion.div>
      )}

      <ECE s={s} enter={10} exit={11} delay={2.0}>
        <p style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 20, color: EP_COLORS.text,
        }}>
          Sixteen years of fixes. But BIP-34 has a secret.
        </p>
      </ECE>

      <ECE s={s} enter={11} exit={12} delay={3.0}>
        <p style={{
          position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 20, color: EP_COLORS.text,
        }}>
          A miner in 2011 accidentally planted a time bomb.
        </p>
      </ECE>

      {/* ═══════════ SCENE 12: The Wrong Field ═══════════ */}
      <ECE s={s} enter={12} exit={13} delay={0.5}>
        <p style={{
          position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 28,
          color: EP_COLORS.highlight,
        }}>
          The fix was in the wrong field.
        </p>
      </ECE>

      {/* ═══════════ SCENES 13-14: FieldContrast ═══════════ */}
      <FieldContrast scene={s} active={sceneRange(s, 13, 14)} />

      <ECE s={s} enter={13} exit={14} delay={1.0}>
        <p style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Quicksand,sans-serif', fontSize: 22, color: EP_COLORS.text,
        }}>
          Two very different places to put an ID.
        </p>
      </ECE>

      {/* ═══════════ SCENE 14: BIP-54 Rule ═══════════ */}
      {sceneRange(s, 14, 14) && (
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '8px 24px', borderRadius: 8,
            backgroundColor: EP_COLORS.accent, color: '#fff',
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 22,
            marginBottom: 16,
          }}>
            BIP-54
          </div>
          <p style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 22,
            color: EP_COLORS.highlight,
          }}>
            nLockTime = block height − 1
          </p>
        </div>
      )}

      {/* ═══════════ SCENE 15: Proof — Column of Zeros ═══════════ */}
      {sceneRange(s, 15, 15) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6vw',
        }}>
          {/* Left: historical coinbases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proofRows.map((row, i) => (
              <div key={i} className="proof-row" style={{
                display: 'flex', gap: 20, alignItems: 'center',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 16, opacity: 0,
              }}>
                <span style={{ color: row.color, minWidth: 120, textAlign: 'right' }}>
                  Block {row.block}
                </span>
                <span style={{
                  color: EP_COLORS.muted, padding: '4px 12px', borderRadius: 4,
                  backgroundColor: `${EP_COLORS.byte}`,
                }}>
                  {row.locktime}
                </span>
                {/* ≠ connector */}
                <span className="neq-line" style={{
                  color: EP_COLORS.danger, fontSize: 20, opacity: 0,
                }}>
                  ≠
                </span>
              </div>
            ))}
            {/* Gold column highlight */}
            <div className="gold-col-highlight" style={{
              position: 'absolute', left: 180, top: 0, width: 130, height: '100%',
              backgroundColor: `${EP_COLORS.highlight}10`,
              borderLeft: `2px solid ${EP_COLORS.highlight}30`,
              borderRight: `2px solid ${EP_COLORS.highlight}30`,
              pointerEvents: 'none',
              transform: 'scaleY(0)',
            }} />
          </div>

          {/* Right: BIP-54 value */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16,
              color: EP_COLORS.textDim,
            }}>
              Block #800,000
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {BIP54_LOCKTIME_HEX.map((hex, i) => (
                <span key={i} style={{
                  padding: '8px 14px', borderRadius: 6,
                  backgroundColor: EP_COLORS.byte,
                  border: `2px solid ${EP_COLORS.fieldLockTime}`,
                  boxShadow: `0 0 16px ${EP_COLORS.fieldLockTime}50`,
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 22,
                  color: EP_COLORS.fieldLockTime,
                }}>
                  {hex}
                </span>
              ))}
            </div>
            <span style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: 14,
              color: EP_COLORS.highlight,
            }}>
              nLockTime ≠ 0
            </span>
          </div>
        </div>
      )}

      <ECE s={s} enter={15} exit={16} delay={2.5}>
        <p style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 24,
          color: EP_COLORS.text,
        }}>
          Zero can never equal a block height.
        </p>
      </ECE>

      {/* ═══════════ SCENE 16: ★ Hiding in Plain Sight (AHA) ═══════════ */}
      <ECE s={s} enter={16} exit={17} delay={1.0}>
        <div style={{
          position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={EP_SPRINGS.aha}
            style={{
              fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 34,
              color: EP_COLORS.highlight,
            }}
          >
            The answer was hiding in plain sight for 16 years.
          </motion.p>
        </div>
      </ECE>

      {/* Gold radiating rings */}
      {s === 16 && (
        <div style={{
          position: 'absolute', top: '55%', right: '18%',
          pointerEvents: 'none',
        }}>
          {[0, 0.5, 1].map(delay => (
            <div key={delay} style={{
              position: 'absolute', width: 60, height: 60, borderRadius: '50%',
              border: `2px solid ${EP_COLORS.highlight}`,
              animation: `ahaRing 2s ease-out ${delay}s infinite`,
              transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>
      )}

      {/* Green checkmark (this one doesn't crack) */}
      {s === 16 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2.0, ...EP_SPRINGS.aha }}
          style={{
            position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
            fontSize: 56, color: EP_COLORS.success,
          }}
        >
          ✓
        </motion.div>
      )}

      {/* ═══════════ SCENE 17: Three Fixes Summary ═══════════ */}
      {sceneRange(s, 17, 17) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          {[
            { name: 'BIP-30', year: '2012', status: 'BAND-AID', statusColor: EP_COLORS.muted, icon: '🩹', sub: 'Expensive UTXO check', cardClass: 'summary-card summary-card-0' },
            { name: 'BIP-34', year: '2012', status: 'EXPIRES 2046', statusColor: EP_COLORS.danger, icon: '⏰', sub: 'scriptSig has a loophole', cardClass: 'summary-card summary-card-1' },
            { name: 'BIP-54', year: '2025', status: 'PERMANENT', statusColor: EP_COLORS.success, icon: '✓', sub: 'nLockTime = height − 1', cardClass: 'summary-card summary-card-2' },
          ].map((col, i) => (
            <div key={i} className={col.cardClass} style={{
              width: 380, padding: 28, borderRadius: 12,
              backgroundColor: EP_COLORS.bgPanel,
              border: `1px solid ${i === 2 ? EP_COLORS.highlight : EP_COLORS.muted}40`,
              textAlign: 'center', opacity: 0,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{col.icon}</div>
              <div style={{
                fontFamily: i === 2 ? 'Montserrat,sans-serif' : '"JetBrains Mono",monospace',
                fontWeight: 700, fontSize: 22,
                color: i === 2 ? EP_COLORS.highlight : EP_COLORS.textDim,
              }}>
                {col.name}
              </div>
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 14,
                color: EP_COLORS.textDim, marginTop: 4,
              }}>
                {col.year}
              </div>
              <div style={{
                fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16,
                color: col.statusColor, marginTop: 12,
              }}>
                {col.status}
              </div>
              <div style={{
                fontFamily: 'Quicksand,sans-serif', fontSize: 13,
                color: EP_COLORS.textDim, marginTop: 6,
              }}>
                {col.sub}
              </div>
            </div>
          ))}

          {/* Connecting timeline line */}
          <div className="summary-line" style={{
            position: 'absolute', top: '70%', left: '18%', width: '64%', height: 2,
            backgroundColor: EP_COLORS.muted, transform: 'scaleX(0)', transformOrigin: 'left',
          }} />
        </div>
      )}

      {/* ═══════════ SCENE 18: CTA ═══════════ */}
      <ECE s={s} enter={18} exit={19}>
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 40,
            color: EP_COLORS.text,
          }}>
            Follow @bitcoin_devs
          </p>
          <div style={{
            width: 200, height: 2, backgroundColor: '#EB5234',
            margin: '20px auto 0',
          }} />
          <p style={{
            fontFamily: 'Quicksand,sans-serif', fontSize: 18, color: EP_COLORS.textDim,
            marginTop: 20,
          }}>
            Part of the Great Consensus Cleanup series
          </p>
        </div>
      </ECE>

      {/* ═══════════ CSS Keyframes ═══════════ */}
      <style>{`
        @keyframes accentGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes ahaRing {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
        }
      `}</style>

      <DevControls player={player} />
    </div>
  );
}
