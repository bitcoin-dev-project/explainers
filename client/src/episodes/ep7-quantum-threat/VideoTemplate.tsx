import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useVideoPlayer, DevControls, morph, Camera, sceneRange,
  createThemedCE, useSceneGSAP,
} from '@/lib/video';
import {
  EP_COLORS, EP_SPRINGS, EP7_CE_THEME, SCENE_DURATIONS,
  ZONES, CAMERA_SHOTS, type CurveMode,
} from './constants';
import CurveCanvas from './CurveCanvas';
import RaceCanvas from './RaceCanvas';
import ResourceChart from './ResourceChart';
import VaultGrid from './VaultGrid';
import SupplyChart from './SupplyChart';
import ShieldStack from './ShieldStack';
import DormantCoins from './DormantCoins';
import QuantumParticles from './QuantumParticles';

const ECE = createThemedCE(EP7_CE_THEME);

// ── Caption positions per act ──
const ACT1_POS: React.CSSProperties = { position: 'absolute', top: '8vh', left: '5vw', maxWidth: '55vw' };
const ACT2_POS: React.CSSProperties = { position: 'absolute', bottom: '8vh', right: '5vw', textAlign: 'right', maxWidth: '55vw' };
const ACT3_POS: React.CSSProperties = { position: 'absolute', top: '8vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', maxWidth: '55vw' };

// ── Font shortcuts ──
const DISPLAY = '"Montserrat", sans-serif';
const MONO = '"JetBrains Mono", monospace';
const BODY = '"Quicksand", sans-serif';

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  // Zone A inline refs
  const zoneARef = useRef<HTMLDivElement>(null);
  // Zone B inline refs
  const zoneBRef = useRef<HTMLDivElement>(null);
  // Zone D inline refs
  const zoneDRef = useRef<HTMLDivElement>(null);
  // Zone E inline refs
  const zoneERef = useRef<HTMLDivElement>(null);

  // ── CurveCanvas mode from scene ──
  const curveMode: CurveMode = useMemo(() => {
    if (s <= 1) return 'IDLE';
    if (s === 2) return 'DRAW';
    if (s === 3) return 'IDLE';
    if (s === 4) return 'POINT_ADD';
    if (s === 5) return 'MULTIPLY';
    if (s === 6 || s === 7) return 'TRAPDOOR';
    if (s >= 8 && s <= 28) return 'IDLE';
    if (s === 29) return 'LATTICE';
    return 'IDLE';
  }, [s]);

  // ── Zone A GSAP: tx flow (scene 1), ECDLP card (scene 7), mining bars (scene 8) ──
  useSceneGSAP(zoneARef, s, {
    1: (tl) => {
      tl.from('.tx-box', { opacity: 0, x: -40, stagger: 0.3, duration: 0.5, ease: 'power3.out' })
        .from('.tx-arrow', { scaleX: 0, stagger: 0.2, duration: 0.3 }, '-=0.6')
        .to('.tx-box', { borderColor: EP_COLORS.goldBright, duration: 0.3, yoyo: true, repeat: 1 }, '+=0.3');
    },
    7: (tl) => {
      tl.from('.ecdlp-card', { opacity: 0, scale: 0.8, filter: 'blur(8px)', duration: 0.6, ease: 'power3.out' })
        .from('.ecdlp-row', { opacity: 0, x: -15, stagger: 0.2, duration: 0.3 });
    },
    8: (tl) => {
      tl.from('.mining-bar-asic', { scaleY: 0, duration: 0.6, ease: 'power3.out' })
        .from('.mining-bar-quantum', { scaleY: 0, duration: 0.4 }, '-=0.3')
        .from('.mining-gap-label', { opacity: 0, x: -20, duration: 0.4 }, '+=0.2')
        .from('.mining-note', { opacity: 0, duration: 0.3 });
    },
  });

  // ── Zone B GSAP: quantum comparison (scenes 10-11) ──
  useSceneGSAP(zoneBRef, s, {
    10: (tl) => {
      tl.from('.qc-divider', { scaleY: 0, duration: 0.3 })
        .from('.qc-classical-label', { opacity: 0, y: -15, duration: 0.3 })
        .from('.qc-quantum-label', { opacity: 0, y: -15, duration: 0.3 }, '-=0.2')
        .from('.qc-classical-dot', { scale: 0, stagger: 0.4, duration: 0.3 }, '+=0.2')
        .from('.qc-quantum-dot', { scale: 0, opacity: 0, stagger: 0.03, duration: 0.15 }, '<');
    },
    11: (tl) => {
      tl.to('.qc-classical-x', { opacity: 1, duration: 0.2 })
        .from('.qc-classical-time', { opacity: 0, duration: 0.3 })
        .from('.qc-flood-burst', { scale: 0, opacity: 0, stagger: 0.02, duration: 0.1 }, '+=0.3');
    },
  });

  // ── Zone D GSAP: address reuse (scene 19), total exposure (scene 20), clocks (scene 21) ──
  useSceneGSAP(zoneDRef, s, {
    19: (tl) => {
      tl.from('.ar-shield', { scale: 0.9, opacity: 0, duration: 0.5 })
        .to('.ar-shield', { opacity: 0, scale: 0.5, duration: 0.8 }, '+=1')
        .from('.ar-exposed', { opacity: 0, scale: 1.5, duration: 0.4, ease: 'power4.out' })
        .from('.ar-target', { opacity: 0, scale: 2, duration: 0.3 }, '-=0.2')
        .from('.ar-warning', { opacity: 0, y: 10, duration: 0.3 });
    },
    20: (tl) => {
      tl.from('.te-number', { scale: 3, opacity: 0, duration: 0.15, ease: 'power4.out' })
        .fromTo('.te-container', { x: 0 }, { x: 5, duration: 0.05, yoyo: true, repeat: 5 })
        .from('.te-fraction', { opacity: 0, duration: 0.3 }, '+=0.3')
        .from('.te-bar-fill', { scaleX: 0, duration: 0.5, ease: 'power2.out' })
        .from('.te-breakdown', { opacity: 0, y: 5, stagger: 0.15, duration: 0.3 });
    },
    21: (tl) => {
      tl.from('.clock-panel', { opacity: 0, y: 20, stagger: 0.3, duration: 0.4 })
        .from('.clock-detail', { opacity: 0, x: -10, stagger: 0.1, duration: 0.25 })
        .from('.clock-bridge', { opacity: 0, duration: 0.3 }, '+=0.3');
    },
  });

  // ── Zone E GSAP: ZK disclosure (scene 28) ──
  useSceneGSAP(zoneERef, s, {
    28: (tl) => {
      tl.from('.zk-step', { opacity: 0, x: -20, stagger: 0.4, duration: 0.35, ease: 'power3.out' })
        .from('.zk-arrow', { scaleX: 0, stagger: 0.3, duration: 0.2 }, '-=1.2')
        .from('.zk-verified', { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(2)' })
        .from('.zk-annotation', { opacity: 0, y: 10, duration: 0.3 });
    },
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: EP_COLORS.bg }}
      data-video="ep7-quantum"
    >
      {/* ══════════ CAMERA CANVAS ══════════ */}
      <Camera
        scene={s}
        shots={CAMERA_SHOTS}
        width="400vw"
        height="550vh"
        zones={ZONES}
        transition={EP_SPRINGS.camera}
      >
        {/* ── ZONE A: ECC Foundations (5vw, 5vh) ── */}
        <CurveCanvas
          mode={curveMode}
          scene={s}
          style={{ position: 'absolute', left: '5vw', top: '5vh', width: '105vw', height: '80vh' }}
        />

        <div ref={zoneARef} style={{ position: 'absolute', left: '5vw', top: '5vh', width: '105vw', height: '80vh' }}>
          {/* Scene 1: Tx flow diagram */}
          <motion.div {...morph(s, {
            0: { opacity: 0 },
            1: { opacity: 1 },
            2: { opacity: 0 },
          })} style={{
            position: 'absolute', top: '30vh', left: '15vw',
            display: 'flex', alignItems: 'center', gap: '2vw',
          }}>
            {[
              { label: 'Private Key', sub: 'k = ???', icon: '🔑' },
              { label: 'Signature', sub: 'sig(k, msg)', icon: '✍' },
              { label: 'Broadcast', sub: '→ mempool', icon: '📡' },
            ].map((box, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
                <div className="tx-box" style={{
                  padding: '1.5vh 2vw', background: EP_COLORS.bgAlt,
                  border: `1px solid ${EP_COLORS.gold}`, borderRadius: '8px',
                  textAlign: 'center', minWidth: '12vw',
                }}>
                  <div style={{ fontSize: '2vw', marginBottom: '0.3vh' }}>{box.icon}</div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.3vw', color: EP_COLORS.text }}>{box.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.goldBright }}>{box.sub}</div>
                </div>
                {i < 2 && (
                  <div className="tx-arrow" style={{
                    width: '3vw', height: '2px',
                    background: EP_COLORS.gold,
                    transformOrigin: 'left',
                  }} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Scene 3: Private key label "k = 7" */}
          <motion.div {...morph(s, {
            0: { opacity: 0, scale: 0.8 },
            3: { opacity: 1, scale: 1 },
            4: { opacity: 1, scale: 1 },
            5: { opacity: 0 },
          })} style={{
            position: 'absolute', top: '12vh', left: '35vw',
            fontFamily: MONO, fontSize: '3.5vw', fontWeight: 700,
            color: EP_COLORS.goldBright,
            textShadow: `0 0 15px ${EP_COLORS.gold}`,
          }}>
            k = 7
          </motion.div>

          {/* Scene 7: ECDLP summary card */}
          <motion.div {...morph(s, {
            0: { opacity: 0, scale: 0.8 },
            7: { opacity: 1, scale: 1 },
            8: { opacity: 0, scale: 0.95 },
          })} style={{ position: 'absolute', top: '20vh', left: '30vw' }}>
            <div className="ecdlp-card" style={{
              background: EP_COLORS.bgAlt, border: `1px solid ${EP_COLORS.gold}`,
              borderRadius: '12px', padding: '2vh 2.5vw', minWidth: '22vw',
            }}>
              <div className="ecdlp-row" style={{ fontFamily: MONO, fontSize: '1.3vw', color: EP_COLORS.gold, marginBottom: '0.8vh' }}>
                → Forward: k × G = P <span style={{ color: EP_COLORS.safe }}>✓</span>
              </div>
              <div className="ecdlp-row" style={{ fontFamily: MONO, fontSize: '1.3vw', color: EP_COLORS.textDim, marginBottom: '1vh' }}>
                ← Reverse: P → k = ??? <span style={{ color: EP_COLORS.danger }}>✗</span>
              </div>
              <hr style={{ border: 'none', borderTop: `1px solid ${EP_COLORS.border}`, margin: '0.5vh 0' }} />
              <div className="ecdlp-row" style={{ fontFamily: MONO, fontSize: '2vw', fontWeight: 700, color: EP_COLORS.goldBright, textAlign: 'center' }}>ECDLP</div>
              <div className="ecdlp-row" style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.textDim, textAlign: 'center' }}>
                Elliptic Curve Discrete Logarithm Problem
              </div>
              <div className="ecdlp-row" style={{ fontFamily: MONO, fontSize: '1.1vw', color: EP_COLORS.danger, textAlign: 'center', marginTop: '0.5vh' }}>
                Brute force: ~2¹²⁸ operations
              </div>
            </div>
          </motion.div>

          {/* Scene 8: Mining comparison bars */}
          <motion.div {...morph(s, {
            0: { opacity: 0 },
            8: { opacity: 1 },
            9: { opacity: 0 },
          })} style={{
            position: 'absolute', top: '15vh', left: '70vw',
            display: 'flex', gap: '3vw', alignItems: 'flex-end',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="mining-bar-asic" style={{
                width: '4vw', height: '25vh', background: EP_COLORS.gold,
                borderRadius: '4px 4px 0 0', transformOrigin: 'bottom',
              }} />
              <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.gold, marginTop: '0.5vh' }}>ASIC</div>
              <div style={{ fontFamily: MONO, fontSize: '0.8vw', color: EP_COLORS.textDim }}>110 TH/s</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="mining-bar-quantum" style={{
                width: '4vw', height: '0.2vh', background: EP_COLORS.quantum,
                borderRadius: '4px 4px 0 0', transformOrigin: 'bottom',
              }} />
              <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.quantum, marginTop: '0.5vh' }}>Quantum</div>
              <div style={{ fontFamily: MONO, fontSize: '0.8vw', color: EP_COLORS.textDim }}>~0.25 TH/s</div>
            </div>
            <div>
              <div className="mining-gap-label" style={{ fontFamily: MONO, fontSize: '1.2vw', color: EP_COLORS.danger }}>
                10+ orders of magnitude gap
              </div>
              <div className="mining-note" style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.textDim, marginTop: '0.3vh' }}>
                Grover: only √ speedup<br />Error correction eats the rest
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── ZONE B: Quantum Attack (160vw, 5vh) ── */}
        <div ref={zoneBRef} style={{ position: 'absolute', left: '165vw', top: '10vh', width: '125vw', height: '70vh' }}>
          {/* Scenes 10-11: Classical vs Quantum comparison */}
          <div style={{ display: 'flex', gap: '5vw', position: 'absolute', top: 0, left: 0, width: '100%', height: '50vh' }}>
            {/* Classical side */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div className="qc-classical-label" style={{
                fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.6vw',
                color: EP_COLORS.gold, marginBottom: '1vh', textAlign: 'center',
              }}>Classical Computer</div>
              {/* Single stepping dot */}
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="qc-classical-dot" style={{
                  position: 'absolute', left: `${10 + i * 15}%`, top: `${30 + Math.sin(i) * 10}%`,
                  width: '1.2vw', height: '1.2vw', borderRadius: '50%',
                  background: EP_COLORS.gold, opacity: 0.7,
                }} />
              ))}
              <div style={{
                fontFamily: MONO, fontSize: '1.1vw', color: EP_COLORS.gold,
                position: 'absolute', bottom: '15%', left: '10%',
              }}>1 path at a time</div>
              {/* Red X for scene 11 */}
              <div className="qc-classical-x" style={{
                position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '5vw', color: EP_COLORS.danger, opacity: 0,
              }}>✗</div>
              <div className="qc-classical-time" style={{
                position: 'absolute', bottom: '5%', left: '10%',
                fontFamily: MONO, fontSize: '1.1vw', color: EP_COLORS.textDim, opacity: 0,
              }}>Classical: 2¹²⁸ years</div>
            </div>

            {/* Divider */}
            <div className="qc-divider" style={{
              width: '2px', background: EP_COLORS.border,
              transformOrigin: 'top', alignSelf: 'stretch',
            }} />

            {/* Quantum side */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div className="qc-quantum-label" style={{
                fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.8vw',
                color: EP_COLORS.quantum, marginBottom: '1vh', textAlign: 'center',
              }}>Shor&apos;s Algorithm</div>
              {/* Blue particles */}
              {Array.from({ length: 40 }, (_, i) => (
                <div key={i} className="qc-quantum-dot" style={{
                  position: 'absolute',
                  left: `${5 + Math.random() * 85}%`,
                  top: `${20 + Math.random() * 60}%`,
                  width: `${0.5 + Math.random() * 0.8}vw`,
                  height: `${0.5 + Math.random() * 0.8}vw`,
                  borderRadius: '50%',
                  background: EP_COLORS.quantumBright,
                  boxShadow: `0 0 6px ${EP_COLORS.quantum}`,
                  opacity: 0,
                }} />
              ))}
              {/* Flood burst particles for scene 11 */}
              {Array.from({ length: 60 }, (_, i) => (
                <div key={`burst-${i}`} className="qc-flood-burst" style={{
                  position: 'absolute',
                  left: `${Math.random() * 90 + 5}%`,
                  top: `${Math.random() * 70 + 15}%`,
                  width: `${0.3 + Math.random() * 0.5}vw`,
                  height: `${0.3 + Math.random() * 0.5}vw`,
                  borderRadius: '50%',
                  background: EP_COLORS.quantumBright,
                  boxShadow: `0 0 4px ${EP_COLORS.quantum}`,
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Resource + trend charts */}
        <ResourceChart scene={s} style={{ position: 'absolute', left: '185vw', top: '35vh' }} />

        {/* ── ZONE C: Attack Scenarios (75vw, 125vh) ── */}
        <RaceCanvas scene={s} style={{ position: 'absolute', left: '80vw', top: '205vh' }} />

        {/* At-rest UTXO boxes (scene 15) */}
        <motion.div {...morph(s, {
          0: { opacity: 0 },
          15: { opacity: 1 },
          17: { opacity: 0.3 },
        })} style={{ position: 'absolute', left: '80vw', top: '215vh', display: 'flex', gap: '3vw' }}>
          {/* P2PK box */}
          <div style={{
            padding: '1.5vh 2vw', background: EP_COLORS.bgSurface,
            border: `1px solid ${EP_COLORS.gold}`, borderRadius: '8px', minWidth: '20vw',
          }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.2vw', color: EP_COLORS.gold }}>P2PK Output (2009)</div>
            <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.danger, marginTop: '0.5vh',
              animation: 'ep7-pulse-red 2s ease-in-out infinite',
              textShadow: `0 0 8px ${EP_COLORS.danger}40`,
            }}>
              Public Key: 04a1b2c3d4e5f6...
            </div>
            <div style={{ fontFamily: MONO, fontSize: '1.1vw', color: EP_COLORS.goldBright, marginTop: '0.3vh' }}>BTC: 50.0</div>
            <div style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.danger, marginTop: '0.5vh' }}>
              Public key visible since 2009 — no time limit
            </div>
          </div>
          {/* P2PKH box */}
          <div style={{
            padding: '1.5vh 2vw', background: EP_COLORS.bgSurface,
            border: `1px solid ${EP_COLORS.safe}`, borderRadius: '8px', minWidth: '20vw',
          }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.2vw', color: EP_COLORS.text }}>P2PKH Output (2015)</div>
            <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.safe, marginTop: '0.5vh' }}>
              Hash: 1A1zP1eP5QGefi2...
            </div>
            <div style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.safe, marginTop: '0.5vh' }}>
              Hidden behind hash ✓
            </div>
          </div>
        </motion.div>

        <SupplyChart scene={s} style={{ position: 'absolute', left: '100vw', top: '230vh' }} />
        <VaultGrid scene={s} style={{ position: 'absolute', left: '135vw', top: '215vh' }} />

        {/* ── ZONE D: Taproot Twist + Exposure (5vw, 240vh) ── */}
        <div ref={zoneDRef} style={{ position: 'absolute', left: '5vw', top: '405vh', width: '115vw', height: '65vh' }}>
          {/* Scene 19: Address reuse */}
          <motion.div {...morph(s, {
            0: { opacity: 0 },
            19: { opacity: 1 },
            20: { opacity: 0 },
          })} style={{ position: 'absolute', top: '5vh', left: '5vw' }}>
            {/* Shield */}
            <div className="ar-shield" style={{
              display: 'inline-block', padding: '1.5vh 2vw',
              border: `3px solid ${EP_COLORS.safe}`, borderRadius: '12px',
              background: `${EP_COLORS.safe}15`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: '1.2vw', color: EP_COLORS.textDim }}>02a1b2c3d4e5...</div>
              <div style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.safe, marginTop: '0.3vh' }}>HASH160 protection</div>
            </div>
            {/* Exposed key */}
            <div className="ar-exposed" style={{
              marginTop: '2vh', padding: '1.5vh 2vw',
              border: `3px solid ${EP_COLORS.danger}`, borderRadius: '12px',
              background: `${EP_COLORS.danger}15`, opacity: 0, display: 'inline-block',
            }}>
              <div style={{ fontFamily: MONO, fontSize: '1.2vw', color: EP_COLORS.danger }}>02a1b2c3d4e5...</div>
              <div style={{ fontFamily: MONO, fontSize: '0.9vw', color: EP_COLORS.danger }}>Public key EXPOSED</div>
            </div>
            <div className="ar-target" style={{
              position: 'absolute', right: '-3vw', top: '60%',
              fontSize: '3vw', opacity: 0,
            }}>🎯</div>
            <div className="ar-warning" style={{
              fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.warning, marginTop: '1vh', opacity: 0,
            }}>12.5 BTC still at this address — now vulnerable</div>
          </motion.div>

          {/* Scene 20: Total exposure */}
          <motion.div className="te-container" {...morph(s, {
            0: { opacity: 0 },
            20: { opacity: 1 },
            21: { opacity: 1 },
            22: { opacity: 0.2 },
          })} style={{ position: 'absolute', top: '5vh', left: '25vw' }}>
            <div className="te-number" style={{
              fontFamily: MONO, fontSize: '8vw', fontWeight: 700,
              color: EP_COLORS.danger,
              textShadow: `0 0 30px ${EP_COLORS.danger}60`,
            }}>6,900,000 BTC</div>
            <div className="te-fraction" style={{
              fontFamily: MONO, fontSize: '2vw', color: EP_COLORS.textDim, marginTop: '1vh',
            }}>6.9M / 19.8M total BTC</div>
            {/* Fraction bar */}
            <div style={{
              width: '35vw', height: '2vh', background: EP_COLORS.bgSurface,
              borderRadius: '4px', marginTop: '1vh', overflow: 'hidden',
            }}>
              <div className="te-bar-fill" style={{
                width: '35%', height: '100%', background: EP_COLORS.danger,
                transformOrigin: 'left',
              }} />
            </div>
            <div style={{
              fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.4vw',
              color: EP_COLORS.warning, marginTop: '0.5vh',
            }}>~35% of all bitcoin ever mined</div>
            <div style={{ display: 'flex', gap: '2vw', marginTop: '0.5vh' }}>
              {['P2PK: 1.7M', 'P2TR: 2.8M', 'Reused: 2.4M'].map((t, i) => (
                <span key={i} className="te-breakdown" style={{
                  fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.textDim,
                }}>{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Scene 21: Fast vs Slow Clock */}
          <motion.div {...morph(s, {
            0: { opacity: 0 },
            21: { opacity: 1 },
            22: { opacity: 0 },
          })} style={{
            position: 'absolute', top: '5vh', left: '65vw',
            display: 'flex', gap: '3vw',
          }}>
            {/* Fast clock */}
            <div className="clock-panel" style={{
              padding: '2vh 2vw', background: EP_COLORS.bgSurface,
              borderRadius: '12px', minWidth: '18vw', textAlign: 'center',
            }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.quantum }}>
                Fast-Clock CRQC
              </div>
              <div style={{
                width: '5vw', height: '5vw', margin: '1vh auto',
                border: `2px solid ${EP_COLORS.quantum}`, borderRadius: '50%',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', bottom: '50%', left: '50%',
                  width: '2px', height: '40%', background: EP_COLORS.quantumBright,
                  transformOrigin: 'bottom center',
                  animation: 'ep7-fast-clock 0.5s linear infinite',
                }} />
              </div>
              {[
                { text: 'Superconducting / Photonic', color: EP_COLORS.textDim },
                { text: 'Gate time: ~10 ns', color: EP_COLORS.quantum },
                { text: 'Attack: ~9 minutes', color: EP_COLORS.danger },
                { text: 'Enables: ON-SPEND', color: EP_COLORS.danger },
              ].map((line, i) => (
                <div key={i} className="clock-detail" style={{
                  fontFamily: MONO, fontSize: '1vw', color: line.color, marginTop: '0.3vh',
                }}>{line.text}</div>
              ))}
            </div>

            {/* Slow clock */}
            <div className="clock-panel" style={{
              padding: '2vh 2vw', background: EP_COLORS.bgSurface,
              borderRadius: '12px', minWidth: '18vw', textAlign: 'center',
            }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.4vw', color: EP_COLORS.quantumDim }}>
                Slow-Clock CRQC
              </div>
              <div style={{
                width: '5vw', height: '5vw', margin: '1vh auto',
                border: `2px solid ${EP_COLORS.quantumDim}`, borderRadius: '50%',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', bottom: '50%', left: '50%',
                  width: '2px', height: '40%', background: EP_COLORS.quantumDim,
                  transformOrigin: 'bottom center',
                  animation: 'ep7-slow-clock 5s linear infinite',
                }} />
              </div>
              {[
                { text: 'Neutral Atom / Ion Trap', color: EP_COLORS.textDim },
                { text: 'Gate time: ~100 μs', color: EP_COLORS.textDim },
                { text: 'Attack: hours to days', color: EP_COLORS.warning },
                { text: 'Enables: AT-REST only', color: EP_COLORS.warning },
              ].map((line, i) => (
                <div key={i} className="clock-detail" style={{
                  fontFamily: MONO, fontSize: '1vw', color: line.color, marginTop: '0.3vh',
                }}>{line.text}</div>
              ))}
            </div>

            <div className="clock-bridge" style={{
              position: 'absolute', bottom: '-3vh', left: '50%', transform: 'translateX(-50%)',
              fontFamily: MONO, fontSize: '1.2vw', color: EP_COLORS.text, textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>Which arrives first determines the threat model</div>
          </motion.div>
        </div>

        {/* ── ZONE E: Fix It (160vw, 245vh) ── */}
        <ShieldStack scene={s} style={{ position: 'absolute', left: '165vw', top: '410vh' }} />
        <DormantCoins scene={s} style={{ position: 'absolute', left: '200vw', top: '430vh' }} />

        {/* ZK Disclosure pipeline (scene 28) */}
        <div ref={zoneERef} style={{ position: 'absolute', left: '230vw', top: '422vh', width: '65vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            {[
              { label: 'Secret Circuit', sub: 'Quantum attack', border: EP_COLORS.danger, icon: '🔒' },
              { label: 'SHA-256 Hash', sub: 'Commitment', border: EP_COLORS.gold, icon: '' },
              { label: 'SP1 zkVM', sub: 'Verify', border: EP_COLORS.safe, icon: '' },
              { label: '9,000 Tests', sub: 'Fuzz', border: EP_COLORS.safe, icon: '✓' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                <div className="zk-step" style={{
                  padding: '1vh 1.2vw', background: EP_COLORS.bgSurface,
                  border: `2px solid ${step.border}`, borderRadius: '8px',
                  textAlign: 'center', minWidth: '10vw',
                }}>
                  {step.icon && <div style={{ fontSize: '1.5vw' }}>{step.icon}</div>}
                  <div style={{ fontFamily: MONO, fontSize: '1vw', color: EP_COLORS.text }}>{step.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: '0.8vw', color: EP_COLORS.textDim }}>{step.sub}</div>
                </div>
                {i < 3 && (
                  <div className="zk-arrow" style={{
                    width: '2vw', height: '2px', background: EP_COLORS.safe,
                    transformOrigin: 'left',
                  }} />
                )}
              </div>
            ))}

            {/* VERIFIED */}
            <div className="zk-verified" style={{
              fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.8vw',
              color: EP_COLORS.safeBright,
              textShadow: `0 0 10px ${EP_COLORS.safe}`,
              marginLeft: '1vw',
            }}>VERIFIED</div>
          </div>

          <div className="zk-annotation" style={{
            fontFamily: MONO, fontSize: '1.1vw', color: EP_COLORS.textDim,
            textAlign: 'center', marginTop: '1.5vh',
          }}>Proved the threat is real. Never revealed the weapon.</div>
        </div>

        {/* Ambient particles */}
        <QuantumParticles scene={s} />
      </Camera>

      {/* ══════════ SCREEN-SPACE CAPTIONS ══════════ */}

      {/* ACT I: Scenes 0-9 */}
      <ECE s={s} enter={0} exit={1} style={ACT1_POS}>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '5vw', color: EP_COLORS.text, margin: 0 }}>
          The Quantum Threat to Bitcoin
        </h1>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.textDim, marginTop: '1vh' }}>
          How close are quantum computers?
        </p>
      </ECE>

      <ECE s={s} enter={1} exit={2} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Every transaction proves you own your coins
        </p>
      </ECE>

      <ECE s={s} enter={2} exit={3} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          That proof relies on elliptic curve math
        </p>
      </ECE>

      <ECE s={s} enter={3} exit={4} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Pick a number. That&apos;s your private key.
        </p>
      </ECE>

      <ECE s={s} enter={4} exit={5} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Multiply k times G. That&apos;s your public key.
        </p>
      </ECE>

      <ECE s={s} enter={5} exit={6} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          256 additions later... trivial for any laptop
        </p>
      </ECE>

      <ECE s={s} enter={6} exit={7} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Now reverse it. Given P, find k.
        </p>
      </ECE>

      <ECE s={s} enter={7} exit={8} style={ACT1_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          A trapdoor: easy forward, impossible backward
        </p>
      </ECE>

      <ECE s={s} enter={8} exit={9} style={{ ...ACT2_POS }}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          What about mining? Grover gives only a square root
        </p>
      </ECE>

      <ECE s={s} enter={9} exit={10} style={{ position: 'absolute', top: '40vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '2.5vw', color: EP_COLORS.text }}>
          Mining is safe. <motion.span
            animate={s === 9 ? { scale: [1, 1.1, 1], color: [EP_COLORS.text, EP_COLORS.warning, EP_COLORS.text] } : {}}
            transition={{ duration: 0.5, delay: 2 }}
          >Signatures</motion.span> are the target.
        </p>
      </ECE>

      {/* ACT II: Scenes 10-21 */}
      <ECE s={s} enter={10} exit={11} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Enter: Shor&apos;s algorithm
        </p>
      </ECE>

      <ECE s={s} enter={11} exit={12} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          A quantum computer tries all paths at once
        </p>
      </ECE>

      <ECE s={s} enter={12} exit={13} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Google: only 1,200 qubits to break Bitcoin&apos;s curve
        </p>
      </ECE>

      <ECE s={s} enter={13} exit={14} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Attacks always get better
        </p>
      </ECE>

      {/* ★ HIGHLIGHT */}
      <ECE s={s} enter={14} exit={15} style={ACT2_POS}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '3vw', color: EP_COLORS.danger }}>
          The 9-Minute Race
        </p>
      </ECE>

      <ECE s={s} enter={15} exit={16} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          At rest: some keys are already exposed on-chain
        </p>
      </ECE>

      <ECE s={s} enter={16} exit={17} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          1.7 million BTC in old P2PK scripts
        </p>
      </ECE>

      <ECE s={s} enter={17} exit={18} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          The full vulnerability map
        </p>
      </ECE>

      {/* ★ TWIST */}
      <ECE s={s} enter={18} exit={19} style={ACT2_POS}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '2.4vw', color: EP_COLORS.text }}>
          Wait — Taproot made it <span style={{ color: EP_COLORS.danger }}>worse</span>?
        </p>
      </ECE>

      <ECE s={s} enter={19} exit={20} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          Reuse an address? Your hash protection is gone.
        </p>
      </ECE>

      <ECE s={s} enter={20} exit={21} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          ~6.9 million BTC at risk across all types
        </p>
      </ECE>

      <ECE s={s} enter={21} exit={22} style={ACT2_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          Two types of quantum computer. Two timescales.
        </p>
      </ECE>

      {/* ACT III: Scenes 22-29 */}
      <ECE s={s} enter={22} exit={23} style={{ position: 'absolute', top: '40vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '4.5vw', color: EP_COLORS.safe }}>
          Fixable.
        </p>
      </ECE>

      <ECE s={s} enter={23} exit={24} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Three things you can do right now
        </p>
      </ECE>

      <ECE s={s} enter={24} exit={25} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          BIP-360: a quantum-safe address type
        </p>
      </ECE>

      <ECE s={s} enter={25} exit={26} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          The long game: post-quantum cryptography
        </p>
      </ECE>

      <ECE s={s} enter={26} exit={27} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          But 1.7M BTC can never be migrated
        </p>
      </ECE>

      <ECE s={s} enter={27} exit={28} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2.2vw', color: EP_COLORS.text }}>
          Three options, none of them clean
        </p>
      </ECE>

      <ECE s={s} enter={28} exit={29} style={ACT3_POS}>
        <p style={{ fontFamily: BODY, fontSize: '2vw', color: EP_COLORS.text }}>
          Google proved the threat without giving away the weapon
        </p>
      </ECE>

      {/* Scene 29: Final reveal CTA */}
      <ECE s={s} enter={29} exit={30} style={{ position: 'absolute', top: '35vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '2.8vw', color: EP_COLORS.text }}>
          The clock is ticking.
        </p>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '2.2vw', color: EP_COLORS.safe, marginTop: '1vh' }}>
          Follow @bitcoin_devs
        </p>
        <div style={{
          width: '15vw', height: '3px', background: '#EB5234',
          margin: '1.5vh auto 0',
        }} />
      </ECE>

      <DevControls player={player} />

      <style>{`
        @keyframes ep7-fast-clock {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ep7-slow-clock {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ep7-pulse-red {
          0%, 100% { text-shadow: 0 0 4px rgba(239,68,68,0.3); }
          50% { text-shadow: 0 0 12px rgba(239,68,68,0.6); }
        }
      `}</style>
    </div>
  );
}
