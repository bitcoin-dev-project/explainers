/**
 * EP12 — SHRINCS & SHRIMPS: Hash-Based Post-Quantum Signatures for Bitcoin
 * 20 scenes, ~2:50 runtime. Three acts: The Threat → Compression Sequence → Breakthrough.
 */
import { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  useVideoPlayer,
  DevControls,
  morph,
  sceneRange,
  createThemedCE,
  useSceneGSAP,
} from '@/lib/video';
import CompressionForge, {
  type ForgeMode,
  type ForgeScheme,
  type GhostOutline,
} from './CompressionForge';
import SizeGauge, { type GaugeEntry } from './SizeGauge';
import UTXOHistogram from './UTXOHistogram';
import ForkDiagram from './ForkDiagram';
import DeviceFanout from './DeviceFanout';
import {
  SCENE_DURATIONS,
  EP_COLORS,
  EP_SPRINGS,
  EP12_CE_THEME,
  SCHEME_COLORS,
  SCHEME_HEIGHTS,
} from './constants';

const ECE = createThemedCE(EP12_CE_THEME);

// ── Scene-to-Forge mapping ──────────────────────────────────────────

function getForgeScheme(s: number): ForgeScheme {
  if (s <= 5) return 'lamport';
  if (s <= 7) return 'wots';
  if (s <= 9) return 'xmss';
  if (s <= 12) return 'sphincs';
  return 'shrincs';
}

function getForgeMode(s: number): ForgeMode {
  // Build scenes: demonstrate. Break scenes: stress (auto-shatters).
  // Forge scenes: forge. Transition: idle.
  if (s === 3) return 'forge';      // pivot → assembles lamport
  if (s === 4) return 'demonstrate'; // lamport build
  if (s === 5) return 'stress';      // lamport break
  if (s === 6) return 'forge';       // wots forge
  if (s === 7) return 'stress';      // wots break
  if (s === 8) return 'forge';       // xmss forge
  if (s === 9) return 'stress';      // xmss break
  if (s === 10) return 'forge';      // sphincs forge
  if (s === 11) return 'stress';     // sphincs break (buckle)
  if (s === 12) return 'idle';       // transition beat
  if (s === 15) return 'resolve';    // shrincs resolve in fork scene
  return 'idle';
}

function getCrackStyle(s: number): 'vertical' | 'topdown' | 'buckle' {
  if (s === 9) return 'topdown';   // XMSS: top-down cascade
  if (s === 11) return 'buckle';   // SPHINCS+: growth buckle
  return 'vertical';                // Lamport/WOTS: vertical bisection
}

function getGhosts(s: number): GhostOutline[] {
  const out: GhostOutline[] = [];
  if (s >= 5)  out.push({ height: SCHEME_HEIGHTS.lamport * 0.45, color: SCHEME_COLORS.lamport, label: 'Lamport ~16KB' });
  if (s >= 7)  out.push({ height: SCHEME_HEIGHTS.wots * 0.45, color: SCHEME_COLORS.wots, label: 'WOTS ~2.5KB' });
  if (s >= 9)  out.push({ height: SCHEME_HEIGHTS.xmss * 0.45, color: SCHEME_COLORS.xmss, label: 'XMSS ~2.5KB' });
  if (s >= 11) out.push({ height: SCHEME_HEIGHTS.sphincs * 0.45, color: SCHEME_COLORS.sphincs, label: 'SLH-DSA 7,856B' });
  return out;
}

function getGaugeEntries(s: number): GaugeEntry[] {
  const entries: GaugeEntry[] = [];
  if (s >= 5)  entries.push({ key: 'lamport', label: 'Lamport', bytes: 16000, color: SCHEME_COLORS.lamport, active: s < 7 });
  if (s >= 7)  entries.push({ key: 'wots', label: 'WOTS', bytes: 2500, color: SCHEME_COLORS.wots, active: s < 9 });
  if (s >= 9)  entries.push({ key: 'xmss', label: 'XMSS', bytes: 2500, color: SCHEME_COLORS.xmss, active: s < 11 });
  if (s >= 11) entries.push({ key: 'sphincs', label: 'SLH-DSA', bytes: 7856, color: EP_COLORS.danger });
  return entries;
}

function getFullGaugeEntries(): GaugeEntry[] {
  return [
    { key: 'schnorr', label: 'Schnorr', bytes: 64, color: EP_COLORS.muted },
    { key: 'ecdsa', label: 'ECDSA', bytes: 72, color: EP_COLORS.muted },
    { key: 'shrincs', label: 'SHRINCS', bytes: 324, color: EP_COLORS.gold },
    { key: 'shrimps', label: 'SHRIMPS', bytes: 2564, color: EP_COLORS.accentAlt },
    { key: 'mldsa', label: 'ML-DSA (lattice)', bytes: 2420, color: `${EP_COLORS.muted}cc` },
    { key: 'sphincs', label: 'SLH-DSA', bytes: 7856, color: EP_COLORS.danger },
  ];
}

// ── Main Component ──────────────────────────────────────────────────

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  // GSAP container for Act 1 Schnorr block
  const act1Ref = useRef<HTMLDivElement>(null);
  useSceneGSAP(act1Ref, s, {
    1: (tl) => {
      tl.from('.schnorr-block', { scale: 0, duration: 0.6, ease: 'back.out(1.7)' })
        .from('.schnorr-label', { opacity: 0, y: 15, duration: 0.4 }, '-=0.3')
        .from('.schnorr-badge', { scale: 0, duration: 0.4, ease: 'back.out(2)' }, '-=0.2');
    },
    2: (tl) => {
      tl.to('.schnorr-block', { duration: 0.15, x: 5, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.3)
        .to('.schnorr-block', {
          opacity: 0, scale: 0.3, rotation: 8, duration: 0.8, ease: 'power3.in',
        }, 1.5)
        .to('.schnorr-label', { opacity: 0, y: 20, duration: 0.3 }, 1.0)
        .to('.schnorr-badge', { opacity: 0, y: 30, rotation: 15, duration: 0.5 }, 1.2);
    },
  });

  // Balanced vs unbalanced tree GSAP (scene 14)
  const treeRef = useRef<HTMLDivElement>(null);
  useSceneGSAP(treeRef, s, {
    14: (tl) => {
      // Balanced tree (left)
      tl.from('.bal-node', { scale: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' }, 0.3)
        .from('.bal-line', { strokeDashoffset: 100, duration: 0.4, stagger: 0.04 }, 0.4);
      // Unbalanced tree (right)
      tl.from('.unbal-node', { scale: 0, duration: 0.3, stagger: 0.06, ease: 'back.out(2)' }, 0.8)
        .from('.unbal-line', { strokeDashoffset: 100, duration: 0.4, stagger: 0.05 }, 0.9);
      // "1 node!" bounce
      tl.fromTo('.one-node-label',
        { scale: 0 },
        { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' }, 2.5);
    },
  });

  // Background gradient color shift
  const bgColor = s >= 13 && s <= 13
    ? `radial-gradient(ellipse at 50% 45%, ${EP_COLORS.gold}0d 0%, ${EP_COLORS.bg} 70%)`
    : s === 2
      ? `radial-gradient(ellipse at 50% 45%, ${EP_COLORS.danger}12 0%, ${EP_COLORS.bg} 70%)`
      : `radial-gradient(ellipse at 50% 45%, ${EP_COLORS.accent}08 0%, ${EP_COLORS.bg} 70%)`;

  const showForge = sceneRange(s, 3, 13);
  const showGauge = sceneRange(s, 5, 13);

  return (
    <div
      data-video="ep12"
      className="w-full h-screen overflow-hidden relative"
      style={{ background: bgColor, transition: 'background 0.8s' }}
    >
      {/* ════════════════════════ ACT 1: THE THREAT (scenes 0-3) ════════════════════════ */}

      {/* Scene 0 — Title */}
      <ECE s={s} enter={0} exit={1} delay={0.4}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '4.2vw',
            color: EP_COLORS.text, letterSpacing: '-0.02em',
          }}>
            SHRINCS &amp; SHRIMPS
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '1.6vw', color: EP_COLORS.textDim,
            marginTop: '1.5vh',
          }}>
            Hash-Based Post-Quantum Signatures for Bitcoin
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '2vw', color: EP_COLORS.gold,
            marginTop: '3vh',
            animation: 'goldPulse 2s ease-in-out infinite',
          }}>
            324 bytes
          </p>
        </div>
      </ECE>

      {/* Scenes 1-2 — Schnorr signature + quantum shatter */}
      {sceneRange(s, 1, 3) && (
        <div ref={act1Ref} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Schnorr block */}
          <div className="schnorr-block" style={{
            width: 340, padding: '20px 24px', borderRadius: 14,
            border: `2px solid ${EP_COLORS.accent}`,
            background: EP_COLORS.bgAlt,
            boxShadow: s === 1 ? `0 0 40px ${EP_COLORS.accent}30` : `0 0 40px ${EP_COLORS.danger}40`,
            transition: 'box-shadow 0.5s',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: EP_COLORS.text, lineHeight: 1.8 }}>
              <span style={{ color: EP_COLORS.textDim }}>r:</span> 79BE667EF9DCBBAC...<br />
              <span style={{ color: EP_COLORS.textDim }}>s:</span> 483ADA7726A3C465...
            </div>
          </div>

          {/* Label */}
          <div className="schnorr-label" style={{
            position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-body)', fontSize: 22, color: EP_COLORS.textDim,
          }}>
            Schnorr signature
          </div>

          {/* Size badge */}
          <div className="schnorr-badge" style={{
            position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 32, color: EP_COLORS.accent,
            padding: '8px 24px', borderRadius: 40,
            background: `${EP_COLORS.accent}15`,
          }}>
            64 bytes
          </div>

          {/* Shor's label (scene 2 only) */}
          {s === 2 && (
            <ECE s={s} enter={2} delay={0.3}>
              <div style={{
                position: 'absolute', top: '12%', left: 120,
                fontFamily: 'var(--font-mono)', fontSize: 20, color: EP_COLORS.danger,
              }}>
                Shor&apos;s algorithm
              </div>
            </ECE>
          )}
          {s === 2 && (
            <ECE s={s} enter={2} delay={1.5}>
              <div style={{
                position: 'absolute', top: '16%', left: 120,
                fontFamily: 'var(--font-body)', fontSize: 17, color: `${EP_COLORS.danger}cc`,
              }}>
                breaks elliptic curve math
              </div>
            </ECE>
          )}
        </div>
      )}

      {/* Scene 2 — "Every Bitcoin signature becomes forgeable" */}
      <ECE s={s} enter={2} exit={3} delay={3.0}>
        <div style={{
          position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-body)', fontSize: '1.4vw', color: EP_COLORS.danger,
          textAlign: 'center',
        }}>
          Every Bitcoin signature becomes forgeable.
        </div>
      </ECE>

      {/* Scene 3 — Hash function pivot question */}
      <ECE s={s} enter={3} exit={4} delay={0.5}>
        <div style={{
          position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.1vw',
          color: EP_COLORS.text, textAlign: 'center', maxWidth: '70vw',
        }}>
          What if we built signatures from hash functions alone?
        </div>
      </ECE>
      <ECE s={s} enter={3} exit={4} delay={1.5}>
        <div style={{
          position: 'absolute', left: '50%', top: '48%', transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-mono)', fontSize: '1vw', color: EP_COLORS.accent,
        }}>
          SHA-256
        </div>
      </ECE>

      {/* ════════════════════════ ACT 2: COMPRESSION SEQUENCE (scenes 3-12) ════════════════════════ */}

      {/* CompressionForge — left 65% during Act 2 */}
      {showForge && (
        <motion.div
          {...morph(s, {
            3: { left: '2%', top: '5%', width: '60%', height: '90%' },
            4: { left: '2%', top: '5%', width: '60%', height: '90%' },
          })}
          style={{ position: 'absolute' }}
        >
          <CompressionForge
            mode={getForgeMode(s)}
            scheme={getForgeScheme(s)}
            width={1100}
            height={900}
            ghosts={getGhosts(s)}
            crackStyle={getCrackStyle(s)}
          />
        </motion.div>
      )}

      {/* Scene captions for forge scenes */}
      {/* Scene 4: Lamport build */}
      <ECE s={s} enter={4} exit={5} delay={0.3}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5vw', color: EP_COLORS.text }}>
          One-Time Signatures from Hashes
        </div>
      </ECE>
      <ECE s={s} enter={4} exit={5} delay={0.8}>
        <div style={{ position: 'absolute', left: '4%', top: '8.5%', fontFamily: 'var(--font-mono)', fontSize: '0.7vw', color: EP_COLORS.textDim }}>
          sk → H(sk) = pk — reveal one preimage per bit
        </div>
      </ECE>
      <ECE s={s} enter={4} exit={5} delay={3.5}>
        <div style={{ position: 'absolute', left: '4%', bottom: '8%', fontFamily: 'var(--font-body)', fontSize: '1vw', color: EP_COLORS.textDim }}>
          Reveal one preimage per bit. Verifier hashes and checks.
        </div>
      </ECE>

      {/* Scene 5: Lamport break */}
      <ECE s={s} enter={5} exit={6} delay={0.3}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-body)', fontSize: '1.3vw', color: EP_COLORS.danger }}>
          Message #2 arrives...
        </div>
      </ECE>
      <ECE s={s} enter={5} exit={6} delay={1.5}>
        <div style={{ position: 'absolute', left: '15%', top: '45%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6vw', color: EP_COLORS.danger }}>
          ONE key. ONE signature. Ever.
        </div>
      </ECE>

      {/* Scene 6: WOTS build */}
      <ECE s={s} enter={6} exit={7} delay={0.5}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.text }}>
          Compress with hash chains
        </div>
      </ECE>
      <ECE s={s} enter={6} exit={7} delay={2.0}>
        <div style={{ position: 'absolute', left: '4%', bottom: '12%', fontFamily: 'var(--font-body)', fontSize: '0.95vw', color: EP_COLORS.chain }}>
          One chain per digit, not per bit
        </div>
      </ECE>
      <ECE s={s} enter={6} exit={7} delay={2.8}>
        <div style={{ position: 'absolute', left: '4%', bottom: '8%', fontFamily: 'var(--font-mono)', fontSize: '0.8vw', color: EP_COLORS.textDim }}>
          256 pairs → 67 chains (w=16)
        </div>
      </ECE>

      {/* Scene 7: WOTS break */}
      <ECE s={s} enter={7} exit={8} delay={0.2}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-body)', fontSize: '1.2vw', color: EP_COLORS.danger }}>
          Message #2
        </div>
      </ECE>
      <ECE s={s} enter={7} exit={8} delay={1.0}>
        <div style={{ position: 'absolute', left: '15%', top: '45%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.danger }}>
          Still one-time only.
        </div>
      </ECE>

      {/* Scene 8: XMSS build */}
      <ECE s={s} enter={8} exit={9} delay={0.5}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.text }}>
          A Merkle tree of one-time keys
        </div>
      </ECE>
      <ECE s={s} enter={8} exit={9} delay={1.8}>
        <div style={{ position: 'absolute', left: '4%', bottom: '8%', fontFamily: 'var(--font-body)', fontSize: '0.95vw', color: EP_COLORS.textDim }}>
          Sign with leaf #q, prove membership to root
        </div>
      </ECE>

      {/* Scene 9: XMSS break */}
      <ECE s={s} enter={9} exit={10} delay={1.5}>
        <div style={{ position: 'absolute', left: '15%', top: '45%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.danger }}>
          Must track state. Fixed capacity.
        </div>
      </ECE>

      {/* Scene 10: SPHINCS+ build */}
      <ECE s={s} enter={10} exit={11} delay={0.5}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.text }}>
          Stateless via hyper-tree
        </div>
      </ECE>
      <ECE s={s} enter={10} exit={11} delay={1.5}>
        <div style={{ position: 'absolute', left: '4%', bottom: '12%', fontFamily: 'var(--font-mono)', fontSize: '1vw', color: EP_COLORS.accent }}>
          ∞ stateless
        </div>
      </ECE>
      <ECE s={s} enter={10} exit={11} delay={2.5}>
        <div style={{ position: 'absolute', left: '4%', bottom: '8%', fontFamily: 'var(--font-body)', fontSize: '0.9vw', color: EP_COLORS.textDim }}>
          Hash of message selects the signing key — no state needed
        </div>
      </ECE>

      {/* Scene 11: SPHINCS+ break */}
      <ECE s={s} enter={11} exit={12} delay={0.3}>
        <div style={{ position: 'absolute', left: '4%', top: '4%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3vw', color: EP_COLORS.danger }}>
          But at what cost?
        </div>
      </ECE>
      <ECE s={s} enter={11} exit={12} delay={2.5}>
        <div style={{ position: 'absolute', left: '15%', top: '42%' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.danger }}>
            7,856 bytes.{' '}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.danger }}>
            Per.{' '}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.danger }}>
            Signature.
          </span>
        </div>
      </ECE>

      {/* Scene 12: Transition beat */}
      <ECE s={s} enter={12} exit={13} delay={0.5}>
        <div style={{
          position: 'absolute', left: '50%', top: '35%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)', fontSize: '1.4vw', color: EP_COLORS.stateless,
          textAlign: 'center',
        }}>
          We need stateless safety...
        </div>
      </ECE>
      <ECE s={s} enter={12} exit={13} delay={1.5}>
        <div style={{
          position: 'absolute', left: '50%', top: '42%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)', fontSize: '1.4vw', color: EP_COLORS.stateful,
          textAlign: 'center',
        }}>
          ...but stateful speed.
        </div>
      </ECE>

      {/* SizeGauge — right panel during Act 2 */}
      {showGauge && (
        <motion.div
          {...morph(s, {
            5: { right: '2%', top: '8%', width: '30%', opacity: 1 },
            12: { right: '2%', top: '8%', width: '30%', opacity: 0.5 },
          })}
          style={{ position: 'absolute', height: '80%' }}
        >
          <SizeGauge entries={getGaugeEntries(s)} />
        </motion.div>
      )}

      {/* ════════════════════════ ACT 3: THE BREAKTHROUGH (scenes 13-19) ════════════════════════ */}

      {/* Scene 13 — UTXO Histogram (HIGHLIGHT SCENE) */}
      {sceneRange(s, 13, 14) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, ${EP_COLORS.gold}0d 0%, transparent 70%)`,
        }}>
          <UTXOHistogram active={s === 13} />
          <ECE s={s} enter={13} exit={14} delay={3.0}>
            <div style={{
              position: 'absolute', left: '50%', top: '10%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.4vw',
              color: EP_COLORS.gold, textAlign: 'center',
            }}>
              Most UTXOs are spent exactly once.
            </div>
          </ECE>
          <ECE s={s} enter={13} exit={14} delay={4.5}>
            <div style={{
              position: 'absolute', left: '50%', top: '17%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-body)', fontSize: '1.3vw', color: EP_COLORS.text,
              textAlign: 'center',
            }}>
              What if we optimized for the common case?
            </div>
          </ECE>
        </div>
      )}

      {/* Scene 14 — Balanced vs Unbalanced Tree */}
      {sceneRange(s, 14, 15) && (
        <div ref={treeRef} style={{ position: 'absolute', inset: 0 }}>
          {/* Balanced tree (left) */}
          <div style={{ position: 'absolute', left: '8%', top: '10%', fontFamily: 'var(--font-body)', fontSize: '1.2vw', color: EP_COLORS.muted }}>
            Balanced XMSS
          </div>
          <svg viewBox="0 0 400 400" style={{ position: 'absolute', left: '5%', top: '15%', width: '40%', height: '65%' }}>
            {/* Balanced tree lines */}
            {[[200, 40, 100, 140], [200, 40, 300, 140], [100, 140, 50, 240], [100, 140, 150, 240], [300, 140, 250, 240], [300, 140, 350, 240],
              [50, 240, 25, 330], [50, 240, 75, 330], [150, 240, 125, 330], [150, 240, 175, 330],
              [250, 240, 225, 330], [250, 240, 275, 330], [350, 240, 325, 330], [350, 240, 375, 330],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={`bl-${i}`} className="bal-line"
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={EP_COLORS.muted} strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" />
            ))}
            {/* Balanced tree nodes */}
            {[[200, 40], [100, 140], [300, 140], [50, 240], [150, 240], [250, 240], [350, 240],
              [25, 330], [75, 330], [125, 330], [175, 330], [225, 330], [275, 330], [325, 330], [375, 330],
            ].map(([x, y], i) => (
              <circle key={`bn-${i}`} className="bal-node"
                cx={x} cy={y} r="14"
                fill={EP_COLORS.bgAlt} stroke={EP_COLORS.muted} strokeWidth="2" />
            ))}
            <text x="200" y="395" textAnchor="middle" fill={EP_COLORS.muted}
              fontFamily="var(--font-mono)" fontSize="16">
              3 nodes
            </text>
          </svg>

          {/* Unbalanced tree (right) */}
          <div style={{ position: 'absolute', right: '8%', top: '10%', fontFamily: 'var(--font-body)', fontSize: '1.2vw', color: EP_COLORS.accent, textAlign: 'right' }}>
            Unbalanced
          </div>
          <svg viewBox="0 0 400 400" style={{ position: 'absolute', right: '5%', top: '15%', width: '40%', height: '65%' }}>
            {/* Unbalanced tree: root → leaf1 at depth 1, chain going deeper */}
            <line className="unbal-line" x1="200" y1="40" x2="100" y2="140"
              stroke={EP_COLORS.gold} strokeWidth="2.5" strokeDasharray="100" strokeDashoffset="0" />
            <line className="unbal-line" x1="200" y1="40" x2="300" y2="140"
              stroke={EP_COLORS.accent} strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" />
            <line className="unbal-line" x1="300" y1="140" x2="250" y2="220"
              stroke={EP_COLORS.accent} strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" opacity="0.6" />
            <line className="unbal-line" x1="300" y1="140" x2="350" y2="220"
              stroke={EP_COLORS.accent} strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" opacity="0.5" />
            <line className="unbal-line" x1="350" y1="220" x2="320" y2="300"
              stroke={EP_COLORS.accent} strokeWidth="1.5" strokeDasharray="100" strokeDashoffset="0" opacity="0.4" />
            <line className="unbal-line" x1="350" y1="220" x2="380" y2="300"
              stroke={EP_COLORS.accent} strokeWidth="1.5" strokeDasharray="100" strokeDashoffset="0" opacity="0.3" />

            {/* Root */}
            <circle className="unbal-node" cx="200" cy="40" r="16"
              fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2.5" />
            <text x="200" y="45" textAnchor="middle" fill={EP_COLORS.text} fontSize="11" fontFamily="var(--font-mono)">pk</text>

            {/* Leaf 1 — gold, closest to root */}
            <circle className="unbal-node" cx="100" cy="140" r="16"
              fill={EP_COLORS.bgAlt} stroke={EP_COLORS.gold} strokeWidth="3" />
            <text x="100" y="145" textAnchor="middle" fill={EP_COLORS.gold} fontSize="11" fontFamily="var(--font-mono)">L1</text>

            {/* Deeper nodes */}
            <circle className="unbal-node" cx="300" cy="140" r="14" fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2" opacity="0.6" />
            <circle className="unbal-node" cx="250" cy="220" r="12" fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="1.5" opacity="0.4" />
            <circle className="unbal-node" cx="350" cy="220" r="12" fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="1.5" opacity="0.4" />
            <circle className="unbal-node" cx="320" cy="300" r="10" fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="1" opacity="0.3" />
            <circle className="unbal-node" cx="380" cy="300" r="10" fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="1" opacity="0.3" />

            {/* "1 node!" label — gold bounce */}
            <g className="one-node-label" style={{ transformOrigin: '200px 380px' }}>
              <text x="200" y="390" textAnchor="middle"
                fill={EP_COLORS.gold} fontFamily="var(--font-display)" fontWeight="700" fontSize="34">
                1 node!
              </text>
            </g>
          </svg>

          {/* Bottom caption */}
          <ECE s={s} enter={14} exit={15} delay={3.0}>
            <div style={{
              position: 'absolute', left: '50%', bottom: '5%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-body)', fontSize: '1.2vw', color: EP_COLORS.textDim,
              textAlign: 'center',
            }}>
              First signature = shortest proof
            </div>
          </ECE>
        </div>
      )}

      {/* Scene 15 — SHRINCS Fork Diagram */}
      {sceneRange(s, 15, 16) && (
        <ForkDiagram active={s === 15} />
      )}

      {/* Scene 16 — Full-viewport Size Comparison (THE payoff) */}
      {sceneRange(s, 16, 17) && (
        <div style={{ position: 'absolute', inset: 0, padding: '5vh 4vw' }}>
          <SizeGauge
            entries={getFullGaugeEntries()}
            fullViewport
            highlightKey="shrincs"
          />
          <ECE s={s} enter={16} exit={17} delay={4.5}>
            <div style={{
              position: 'absolute', left: '50%', bottom: '4%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5vw',
              color: EP_COLORS.text, textAlign: 'center',
            }}>
              Same security. Just SHA-256.
            </div>
          </ECE>
        </div>
      )}

      {/* Scene 17 — SHRIMPS multi-device */}
      {sceneRange(s, 17, 18) && (
        <DeviceFanout active={s === 17} />
      )}
      <ECE s={s} enter={17} exit={18} delay={3.5}>
        <div style={{
          position: 'absolute', left: '50%', bottom: '6%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)', fontSize: '1.2vw', color: EP_COLORS.text,
          textAlign: 'center',
        }}>
          Multi-device signing without a single point of failure.
        </div>
      </ECE>

      {/* Scene 18 — Key Facts */}
      {sceneRange(s, 18, 19) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4vh' }}>
            <ECE s={s} enter={18} exit={19} delay={0.4}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.accent }}>
                Built entirely on SHA-256
              </div>
            </ECE>
            <ECE s={s} enter={18} exit={19} delay={0.8}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.text }}>
                No new cryptographic assumptions
              </div>
            </ECE>
            <ECE s={s} enter={18} exit={19} delay={1.2}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.gold }}>
                Already live on Liquid
              </div>
            </ECE>
            <ECE s={s} enter={18} exit={19} delay={1.6}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8vw', color: EP_COLORS.textDim }}>
                Soft fork ready
              </div>
            </ECE>
            <ECE s={s} enter={18} exit={19} delay={2.2}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.1vw', color: EP_COLORS.textDim, marginTop: '4vh' }}>
                Kudinov &amp; Nick — Blockstream Research
              </div>
            </ECE>
          </div>
        </div>
      )}

      {/* Scene 19 — CTA */}
      {sceneRange(s, 19, 20) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ECE s={s} enter={19} delay={0.3}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '3vw', color: EP_COLORS.gold,
              animation: 'goldPulse 2s ease-in-out infinite',
            }}>
              324 bytes
            </div>
          </ECE>
          <ECE s={s} enter={19} delay={1.5}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '1.4vw', color: EP_COLORS.text,
              marginTop: '4vh',
            }}>
              Follow @bitcoin_devs
            </div>
          </ECE>
          <ECE s={s} enter={19} delay={2.0}>
            <div style={{
              width: 200, height: 3, borderRadius: 2,
              background: '#EB5234', marginTop: '2vh',
            }} />
          </ECE>
        </div>
      )}

      {/* Persistent "324 B" morph label — scenes 15→16→19 */}
      <motion.div
        {...morph(s, {
          15: { left: '28%', top: '52%', scale: 1, opacity: 0.9 },
          16: { left: '10%', top: '25%', scale: 0.7, opacity: 0.6 },
          17: { left: '50%', top: '50%', scale: 0, opacity: 0 },
          19: { left: '50%', top: '40%', scale: 1.2, opacity: 1 },
        })}
        style={{
          position: 'absolute', fontFamily: 'var(--font-mono)', fontSize: '1.8vw',
          color: EP_COLORS.gold, fontWeight: 700, pointerEvents: 'none',
          display: sceneRange(s, 15, 20) ? 'block' : 'none',
        }}
      />

      {/* Gold pulse animation */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { opacity: 0.8; text-shadow: 0 0 20px ${EP_COLORS.gold}40; }
          50% { opacity: 1; text-shadow: 0 0 40px ${EP_COLORS.gold}80; }
        }
      `}</style>

      <DevControls player={player} />
    </div>
  );
}
