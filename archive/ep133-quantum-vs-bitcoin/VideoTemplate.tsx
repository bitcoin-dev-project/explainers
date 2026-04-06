import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useVideoPlayer, DevControls, morph, sceneRange, createThemedCE } from '@/lib/video';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, EP_SPRINGS, EP_CE_THEME, SCENE_DURATIONS } from './constants';
import RaceCanvas from './RaceCanvas';
import type { RaceMode } from './RaceCanvas';
import ECCCanvas from './ECCCanvas';
import type { ECCMode } from './ECCCanvas';
import VulnerabilityTimeline from './VulnerabilityTimeline';
import ResourceChart from './ResourceChart';
import SupplyChart from './SupplyChart';
import DormantVault from './DormantVault';
import ShieldStack from './ShieldStack';
import CrackEffect from './CrackEffect';

const ECE = createThemedCE(EP_CE_THEME);

// ─── Ambient Dot Grid Background ───────────────────────────────────
function DotGrid({ pulseRate }: { pulseRate: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(${EP_COLORS.line} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.3,
        animation: `dotPulse ${1 / pulseRate}s ease-in-out infinite`,
      }}
    />
  );
}

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  const gsapRef = useRef<HTMLDivElement>(null);

  // ─── Derived state per scene ──────────────────────────────
  const getRaceMode = (): RaceMode => {
    if (s === 0) return 'hook';
    if (s === 1 || (s >= 2 && s <= 15)) return 'dormant';
    if (s === 16) return 'explained';
    if (s === 17) return 'fullRace';
    return 'dormant';
  };

  const getECCMode = (): ECCMode => {
    if (s === 4) return 'curveDraw';
    if (s === 5) return 'pointAdd';
    if (s === 6) return 'scalarMult';
    if (s === 7 || s === 8 || s === 12) return 'finiteField';
    return 'curveDraw';
  };

  const getECCProgress = (): number => {
    // Progress ramps up across the scene duration
    if (s === 4) return 1;
    if (s === 5) return 1;
    if (s === 6) return 1;
    if (s === 7) return 1;
    if (s === 8) return 0.7; // partial for brute force overlay
    if (s === 12) return 1;
    return 0;
  };

  const getPulseRate = (): number => {
    if (s <= 10) return 0.5;
    if (s <= 22) return 1;
    return 0.3;
  };

  const getBgColor = (): string => {
    if (s === 10 || s === 15 || s === 24) return EP_COLORS.bg;
    if (s === 21) return '#0f0508'; // deep red-black for highlight
    if (s === 29) return '#050508'; // darkest for dormant coins
    return EP_COLORS.bg;
  };

  // ─── GSAP choreography ──────────────────────────────────
  useSceneGSAP(gsapRef, s, {
    // Scene 2: Title card
    1: (tl) => {
      tl.from('.title-main', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' })
        .from('.title-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.title-rewind', { opacity: 0, duration: 0.4 }, '-=0.2');
    },
    // Scene 3: Bit grid
    2: (tl) => {
      tl.from('.bit-cell', {
        opacity: 0, scale: 0.5,
        stagger: 0.008, duration: 0.15,
        ease: 'back.out(1.7)',
      })
        .from('.hex-string', { opacity: 0, duration: 0.5 }, '-=0.5');
    },
    // Scene 4: Key pair
    3: (tl) => {
      tl.from('.key-priv', { scale: 0, duration: 0.4, ease: 'back.out(2)' })
        .from('.key-arrow', { scaleX: 0, transformOrigin: 'left center', duration: 0.6 }, '-=0.1')
        .from('.key-pub', { scale: 0, duration: 0.4, ease: 'back.out(2)' }, '-=0.2')
        .from('.key-reverse', { opacity: 0, x: 30, duration: 0.3 }, '+=0.3');
    },
    // Scene 11: Punch 1 crack
    10: (tl) => {
      tl.from('.punch-text', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from('.punch-sub', { opacity: 0, y: 10, duration: 0.3 }, '+=0.8');
    },
    // Scene 12: Classical vs Quantum
    11: (tl) => {
      tl.from('.classical-bit', { scale: 0, duration: 0.3, ease: 'back.out(2)' })
        .from('.qubit-vis', { scale: 0, duration: 0.3, ease: 'back.out(2)' }, '-=0.1')
        .from('.qubit-cascade span', { opacity: 0, y: 10, stagger: 0.15 }, '+=0.5');
    },
    // Scene 14: Resource chart
    13: (tl) => {
      tl.from('.chart-title', { opacity: 0, y: 15, duration: 0.4 });
    },
    // Scene 15: Physical qubits comparison
    14: (tl) => {
      tl.from('.chip-old', { x: -100, opacity: 0, duration: 0.5 })
        .from('.chip-new', { x: 100, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.chip-arrow', { scale: 0, opacity: 0, duration: 0.3 }, '-=0.2');
    },
    // Scene 16: Punch 2
    15: (tl) => {
      tl.from('.punch2-text', { scale: 0.95, opacity: 0, duration: 0.4 })
        .to('.punch2-strike', { scaleX: 1, duration: 0.3, ease: 'power2.in' }, '+=0.8')
        .from('.punch2-replace', { scale: 0.5, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, '+=0.2');
    },
    // Scene 17: On-spend attack steps
    16: (tl) => {
      tl.from('.attack-step', { opacity: 0, x: -20, stagger: 0.5, duration: 0.4 });
    },
    // Scene 19: Attack triptych
    18: (tl) => {
      tl.from('.triptych-panel', { y: 80, opacity: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out' });
    },
    // Scene 24: PoW safety
    23: (tl) => {
      tl.from('.pow-grover', { opacity: 0, scale: 0.8, duration: 0.5 })
        .from('.pow-bars .bar', { scaleX: 0, transformOrigin: 'left center', stagger: 0.3, duration: 0.5 }, '+=0.3');
    },
    // Scene 26: ZK disclosure
    25: (tl) => {
      tl.from('.zk-left', { x: -60, opacity: 0, duration: 0.5 })
        .from('.zk-right', { x: 60, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.zk-step', { opacity: 0, x: 10, stagger: 0.4, duration: 0.3 }, '+=0.2');
    },
    // Scene 31: Governance triptych
    30: (tl) => {
      tl.from('.gov-panel', { y: 80, opacity: 0, stagger: 0.15, duration: 0.5 })
        .from('.gov-question', { scale: 0, duration: 0.4, ease: 'back.out(2)' }, '+=0.3');
    },
    // Scene 32: Urgency timeline
    31: (tl) => {
      tl.from('.urgency-line', { scaleX: 0, transformOrigin: 'left center', duration: 0.6 })
        .from('.urgency-node', { scale: 0, stagger: 0.3, duration: 0.3, ease: 'back.out(2)' });
    },
    // Scene 33: CTA
    32: (tl) => {
      tl.from('.cta-card', { scale: 0.9, opacity: 0, duration: 0.5 })
        .from('.cta-line', { opacity: 0, y: 10, stagger: 0.15, duration: 0.3 });
    },
  });

  return (
    <div
      data-video="ep133"
      ref={gsapRef}
      className="w-full h-screen overflow-hidden relative"
      style={{
        backgroundColor: getBgColor(),
        fontFamily: "'Quicksand', sans-serif",
        transition: 'background-color 0.5s',
      }}
    >
      {/* Ambient dot grid */}
      <DotGrid pulseRate={getPulseRate()} />

      {/* ═══════════════════════════════════════════════════════
          SCENE 1: Cold Open — The Race (8s)
         ═══════════════════════════════════════════════════════ */}
      {sceneRange(s, 0, 2) && (
        <motion.div
          {...morph(s, {
            0: { scale: 1, x: 0, y: 0, opacity: 1 },
            1: { scale: 0.3, x: 500, y: -300, opacity: 0.2 },
          })}
          style={{ position: 'absolute', inset: 0 }}
        >
          <RaceCanvas mode={getRaceMode()} />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 2: Rewind — Title Card (7s)
         ═══════════════════════════════════════════════════════ */}
      {s === 1 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="title-main" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '3.5vw', color: EP_COLORS.text, margin: 0 }}>
            Google's Quantum Threat to Bitcoin
          </h1>
          <p className="title-sub" style={{ fontSize: '1.8vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>
            How 1,200 qubits could break your keys
          </p>
          <p className="title-rewind" style={{ fontSize: '1.3vw', color: EP_COLORS.textDim, fontStyle: 'italic', marginTop: '3vh' }}>
            Let's rewind.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 3: What Is a Private Key? (7s)
         ═══════════════════════════════════════════════════════ */}
      {s === 2 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ECE s={s} enter={2} delay={0.2}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.1vw', color: EP_COLORS.textMuted, letterSpacing: '4px', textTransform: 'uppercase' }}>
              YOUR PRIVATE KEY
            </div>
          </ECE>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1.1vw)', gap: '2px', marginTop: '2vh' }}>
            {Array.from({ length: 256 }, (_, i) => (
              <div key={i} className="bit-cell" style={{
                width: '1.1vw', height: '1.1vw',
                background: Math.random() > 0.5 ? EP_COLORS.text : EP_COLORS.line,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55vw', fontFamily: "'JetBrains Mono', monospace",
                color: Math.random() > 0.5 ? EP_COLORS.bg : EP_COLORS.textDim,
              }}>
                {Math.random() > 0.5 ? '1' : '0'}
              </div>
            ))}
          </div>
          <div className="hex-string" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.2vw', color: EP_COLORS.text, marginTop: '2vh' }}>
            0x7f4e...a3b1
          </div>
          <ECE s={s} enter={2} delay={0.8}>
            <p style={{ fontSize: '1.5vw', color: EP_COLORS.textMuted, marginTop: '1.5vh' }}>
              256 random bits. Your secret.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 4: What Is a Public Key? (7s)
         ═══════════════════════════════════════════════════════ */}
      {s === 3 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Private key dot */}
          <div className="key-priv" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '2.5vh', height: '2.5vh', borderRadius: '50%',
              background: EP_COLORS.text,
              boxShadow: `0 0 20px ${EP_COLORS.lineBright}`,
            }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>
              Private Key (k)
            </span>
          </div>

          {/* Arrow */}
          <div className="key-arrow" style={{ margin: '0 3vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.textDim, fontStyle: 'italic', marginBottom: '0.5vh' }}>
              one-way trapdoor function
            </span>
            <div style={{ width: '20vw', height: '2px', background: EP_COLORS.lineBright, position: 'relative' }}>
              <div style={{ position: 'absolute', right: -6, top: -5, width: 0, height: 0, borderLeft: `12px solid ${EP_COLORS.lineBright}`, borderTop: '6px solid transparent', borderBottom: '6px solid transparent' }} />
            </div>
          </div>

          {/* Public key dot */}
          <div className="key-pub" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '3vh', height: '3vh', borderRadius: '50%',
              background: EP_COLORS.text,
              boxShadow: `0 0 30px ${EP_COLORS.lineBright}`,
            }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>
              Public Key (P)
            </span>
          </div>

          {/* Reverse attempt X */}
          <div className="key-reverse" style={{ position: 'absolute', top: '55%', left: '42%' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2vw', color: EP_COLORS.accent }}>✗</span>
          </div>

          <ECE s={s} enter={3} delay={0.8} style={{ position: 'absolute', bottom: '22vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.5vw', color: EP_COLORS.text, textAlign: 'center' }}>
              Easy to compute forward. Impossible to reverse.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENES 5-8: ECCCanvas (curve → point add → scalar mult → finite field)
         ═══════════════════════════════════════════════════════ */}
      {sceneRange(s, 4, 9) && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ECCCanvas
            mode={getECCMode()}
            progress={getECCProgress()}
          />

          {/* Scene 5: Equation label */}
          {s === 4 && (
            <ECE s={s} enter={4} delay={0.5} style={{ position: 'absolute', top: '8vh', right: '12vw' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.5vw', color: EP_COLORS.text }}>
                y² = x³ + 7
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>
                secp256k1
              </div>
            </ECE>
          )}

          {/* Scene 5 caption */}
          {s === 4 && (
            <ECE s={s} enter={4} delay={1} style={{ position: 'absolute', bottom: '10vh', left: '50%', transform: 'translateX(-50%)' }}>
              <p style={{ fontSize: '1.3vw', color: EP_COLORS.textMuted }}>Every Bitcoin key starts here.</p>
            </ECE>
          )}

          {/* Scene 6: Step labels */}
          {s === 5 && (
            <ECE s={s} enter={5} delay={0.3} style={{ position: 'absolute', top: '6vh', left: '6vw' }}>
              <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '1.1vw', color: EP_COLORS.textMuted }}>
                Point addition: the building block of ECC.
              </p>
            </ECE>
          )}

          {/* Scene 7: Scalar mult captions */}
          {s === 6 && (
            <>
              <ECE s={s} enter={6} delay={0.3} style={{ position: 'absolute', top: '6vh', left: '50%', transform: 'translateX(-50%)' }}>
                <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>
                  Multiply the point by your private key...
                </p>
              </ECE>
              <ECE s={s} enter={6} delay={1.5} style={{ position: 'absolute', bottom: '12vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2vw', color: EP_COLORS.textMuted }}>Easy: P × k → Public Key</p>
                <p style={{ fontSize: '1.2vw', color: EP_COLORS.accentDim, marginTop: '0.5vh' }}>Hard: Public Key → k ???</p>
              </ECE>
            </>
          )}

          {/* Scene 8: Finite field captions */}
          {s === 7 && (
            <>
              <ECE s={s} enter={7} delay={0.3} style={{ position: 'absolute', top: '6vh', left: '50%', transform: 'translateX(-50%)' }}>
                <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>
                  But Bitcoin doesn't use a smooth curve...
                </p>
              </ECE>
              <ECE s={s} enter={7} delay={1.5} style={{ position: 'absolute', top: '6vh', left: '50%', transform: 'translateX(-50%)' }}>
                <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>
                  It uses a finite field. Discrete points. No curve to trace.
                </p>
              </ECE>
            </>
          )}

          {/* Scene 9: Brute force overlay */}
          {s === 8 && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={EP_SPRINGS.dataReveal}
              style={{
                position: 'absolute', right: '6vw', top: '20vh',
                background: EP_COLORS.bgPanel, padding: '3vh 3vw', borderRadius: 8,
                maxWidth: '35vw',
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.8vw', color: EP_COLORS.text }}>
                2<sup>256</sup> possible private keys
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>
                = 1.16 × 10<sup>77</sup>
              </div>
              <div style={{ fontSize: '1.1vw', color: EP_COLORS.textDim, marginTop: '1.5vh' }}>
                At 1 billion checks/second:
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2vw', color: EP_COLORS.text, marginTop: '0.5vh' }}>
                3.7 × 10<sup>60</sup> years
              </div>
              <div style={{ marginTop: '1.5vh', display: 'flex', alignItems: 'center', gap: '1vw' }}>
                <div style={{ height: 6, width: '4vw', background: EP_COLORS.textDim, borderRadius: 3 }}>
                  <span style={{ fontSize: '0.7vw', color: EP_COLORS.textDim, position: 'relative', top: 10 }}>Age of universe: 1.38 × 10¹⁰ yrs</span>
                </div>
              </div>
              <ECE s={s} enter={8} delay={1} style={{ marginTop: '2vh' }}>
                <p style={{ fontSize: '1.3vw', color: EP_COLORS.textMuted }}>No shortcut exists. Only brute force.</p>
              </ECE>
            </motion.div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 10: Script Types — First Foreshadowing (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 9 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VulnerabilityTimeline mode="simple" progress={1} />
          <ECE s={s} enter={9} delay={1} style={{ position: 'absolute', bottom: '15vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>
              The fix was simple: hash the public key.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 11: PUNCH 1 — "Not quite" (6s)
         ═══════════════════════════════════════════════════════ */}
      {s === 10 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
          <div className="punch-text" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2.2vw', color: EP_COLORS.text, position: 'relative' }}>
            Bitcoin uses strong cryptography.
            <CrackEffect active={s === 10} width={800} height={60} style={{ top: -10, left: -100 }} />
          </div>
          <div className="punch-sub" style={{ fontSize: '1.5vw', color: EP_COLORS.textMuted, marginTop: '1.5vh' }}>
            So it must be quantum-safe.
          </div>
          <ECE s={s} enter={10} delay={1.5}>
            <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '1.7vw', color: EP_COLORS.accent, marginTop: '3vh' }}>
              Not quite.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 12: Enter Quantum Computing (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 11 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8vw' }}>
          {/* Classical bit */}
          <div className="classical-bit" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '8vw', height: '8vw', borderRadius: '50%',
              background: EP_COLORS.text, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2.5vw', color: EP_COLORS.bg }}>0</span>
              </div>
              <div style={{ position: 'absolute', left: '50%', width: '1px', height: '100%', background: EP_COLORS.bg }} />
              <div style={{ position: 'absolute', right: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2.5vw', color: EP_COLORS.bg }}>1</span>
              </div>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '1.5vh' }}>Classical Bit</span>
            <span style={{ fontSize: '0.9vw', color: EP_COLORS.textDim, marginTop: '0.3vh' }}>Definitely 0 or 1</span>
          </div>

          {/* vs */}
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.3vw', color: EP_COLORS.textDim }}>vs</span>

          {/* Qubit */}
          <div className="qubit-vis" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '8vw', height: '8vw', borderRadius: '50%',
              background: `radial-gradient(circle, ${EP_COLORS.bgPanel}, ${EP_COLORS.bg})`,
              border: `2px solid ${EP_COLORS.lineBright}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'qubitSpin 2s linear infinite',
              boxShadow: `0 0 20px ${EP_COLORS.accentGlow}`,
            }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2vw', color: EP_COLORS.text }}>0 + 1</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.text, marginTop: '1.5vh' }}>Qubit</span>
            <span style={{ fontSize: '0.9vw', color: EP_COLORS.accent, marginTop: '0.3vh' }}>0 AND 1 simultaneously</span>
          </div>

          {/* Cascade */}
          <div className="qubit-cascade" style={{ position: 'absolute', bottom: '18vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <ECE s={s} enter={11} delay={1}>
              <p style={{ fontSize: '1.5vw', color: EP_COLORS.text }}>Superposition: both states at once.</p>
            </ECE>
            <ECE s={s} enter={11} delay={1.5}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.textMuted, marginTop: '1.5vh', display: 'flex', flexDirection: 'column', gap: '0.3vh' }}>
                {['1 qubit → 2 states', '2 qubits → 4 states', '10 qubits → 1,024 states'].map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
                <span style={{ color: EP_COLORS.accent }}>256 qubits → 2²⁵⁶ states</span>
              </div>
            </ECE>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 13: Shor's Algorithm (10s)
         ═══════════════════════════════════════════════════════ */}
      {s === 12 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ECCCanvas
            mode="finiteField"
            progress={1}
            quantumSweep={true}
            highlightFound={true}
          />
          <ECE s={s} enter={12} delay={0.3} style={{ position: 'absolute', top: '5vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.textMuted }}>Classical approach: check one point at a time.</p>
          </ECE>
          <ECE s={s} enter={12} delay={2} style={{ position: 'absolute', top: '5vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.accent }}>Shor's algorithm: test ALL points at once.</p>
          </ECE>
          <ECE s={s} enter={12} delay={3.5} style={{ position: 'absolute', bottom: '10vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.4vw', color: EP_COLORS.text }}>Exponential speedup. The trapdoor is broken.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 14: Google's Resource Estimate (10s)
         ═══════════════════════════════════════════════════════ */}
      {s === 13 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div className="chart-title" style={{
            position: 'absolute', top: '4vh', left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.3vw', color: EP_COLORS.text,
          }}>
            Logical Resources to Break 256-bit ECDLP
          </div>
          <ResourceChart variant="scatter" progress={1} />
          <ECE s={s} enter={13} delay={2} style={{ position: 'absolute', bottom: '6vh', right: '8vw' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.textMuted }}>~20× reduction</span>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 15: Physical Qubits (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 14 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8vw' }}>
          {/* Old estimate chip */}
          <div className="chip-old" style={{
            width: '26vw', height: '16vw',
            background: `repeating-radial-gradient(${EP_COLORS.line} 1px, transparent 2px)`,
            backgroundSize: '6px 6px',
            border: `1px solid ${EP_COLORS.line}`,
            borderRadius: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textDim }}>Previous estimate</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.4vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>10M+ physical qubits</span>
          </div>

          {/* Arrow */}
          <div className="chip-arrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '3vw', color: EP_COLORS.text }}>20×</span>
            <span style={{ fontSize: '1vw', color: EP_COLORS.textDim }}>smaller</span>
          </div>

          {/* New estimate chip */}
          <div className="chip-new" style={{
            width: '7vw', height: '4.5vw',
            background: `repeating-radial-gradient(${EP_COLORS.accent} 1px, transparent 2px)`,
            backgroundSize: '6px 6px',
            border: `2px solid ${EP_COLORS.accent}`,
            borderRadius: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${EP_COLORS.accentGlow}`,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.2vw', color: EP_COLORS.accent, fontWeight: 'bold' }}>&lt;500K</span>
          </div>

          <ECE s={s} enter={14} delay={1} style={{ position: 'absolute', bottom: '14vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>Fewer than 500,000 physical qubits.</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1vw', color: EP_COLORS.accent, marginTop: '0.8vh' }}>Runtime: ~9 minutes from primed state.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 16: PUNCH 2 — "<500K" (6s)
         ═══════════════════════════════════════════════════════ */}
      {s === 15 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
          <div className="punch2-text" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2vw', color: EP_COLORS.text, position: 'relative' }}>
            But you'd need <span style={{ position: 'relative' }}>millions<div className="punch2-strike" style={{
              position: 'absolute', top: '50%', left: -4, right: -4, height: 3,
              background: EP_COLORS.accent, transform: 'scaleX(0)', transformOrigin: 'left',
            }} /></span> of qubits...
            <CrackEffect active={s === 15} width={700} height={50} style={{ top: -5, left: -50 }} />
          </div>
          <div className="punch2-replace" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2.5vw', color: EP_COLORS.accent, marginTop: '2vh' }}>
            &lt;500,000
          </div>
          <ECE s={s} enter={15} delay={1.5}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.textMuted, marginTop: '2vh' }}>The safety margin just evaporated.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 17: The On-Spend Attack (11s)
         ═══════════════════════════════════════════════════════ */}
      {s === 16 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {/* Left: Attack steps */}
          <div style={{ width: '40%', padding: '6vh 3vw', display: 'flex', flexDirection: 'column', gap: '2vh' }}>
            {[
              '1. You broadcast a transaction',
              '2. Your public key is now visible',
              '3. The race begins',
              '4. Attacker forges a transaction',
            ].map((step, i) => (
              <div key={i} className="attack-step" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw',
                color: i === 3 ? EP_COLORS.accent : EP_COLORS.textMuted,
                padding: '1vh 1vw',
                borderLeft: `2px solid ${i === 3 ? EP_COLORS.accent : EP_COLORS.line}`,
              }}>
                {step}
              </div>
            ))}
            <ECE s={s} enter={16} delay={3} style={{ marginTop: '2vh' }}>
              <p style={{ fontSize: '1.2vw', color: EP_COLORS.accent }}>
                Your funds are stolen before your block confirms.
              </p>
            </ECE>
          </div>
          {/* Right: RaceCanvas */}
          <div style={{ width: '60%', position: 'relative' }}>
            <RaceCanvas mode="explained" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 18: 41% Success Rate (10s)
         ═══════════════════════════════════════════════════════ */}
      {s === 17 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <RaceCanvas mode="fullRace" />
          <ECE s={s} enter={17} delay={0.3} style={{ position: 'absolute', top: '5vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>How often does the quantum attacker win?</p>
          </ECE>
          <ECE s={s} enter={17} delay={4} style={{ position: 'absolute', bottom: '8vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.7vw', color: EP_COLORS.accent }}>~41% success probability</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 19: Attack Type Comparison (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 18 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2vw', padding: '0 4vw' }}>
          {[
            { title: 'On-Spend Attack', color: EP_COLORS.accent, stats: ['Race the block: ~9 min', 'Success rate: ~41%', 'Target: any active TX'], icon: '⏱' },
            { title: 'At-Rest Attack', color: EP_COLORS.accent, stats: ['Unlimited time', 'Target: exposed public keys', '1.7M+ BTC at risk'], icon: '🎯' },
            { title: 'On-Setup Attack', color: EP_COLORS.dormant, stats: ['One-time backdoor', 'Bitcoin: IMMUNE ✓', 'No trusted setup'], icon: '🏭', muted: true },
          ].map((panel, i) => (
            <div key={i} className="triptych-panel" style={{
              flex: 1, background: panel.muted ? EP_COLORS.bgAlt : EP_COLORS.bgPanel,
              borderTop: `4px solid ${panel.color}`,
              borderRadius: 8, padding: '3vh 2vw',
              opacity: panel.muted ? 0.6 : 1,
            }}>
              <div style={{ fontSize: '2vw', textAlign: 'center', marginBottom: '1.5vh' }}>{panel.icon}</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.2vw', color: panel.muted ? EP_COLORS.textDim : panel.color, textAlign: 'center', marginBottom: '1.5vh' }}>
                {panel.title}
              </div>
              {panel.stats.map((stat, j) => (
                <div key={j} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw',
                  color: panel.muted ? EP_COLORS.textDim : (j === 2 && i === 1 ? EP_COLORS.accent : EP_COLORS.textMuted),
                  marginBottom: '0.6vh',
                  fontWeight: stat.includes('IMMUNE') || stat.includes('41%') || stat.includes('1.7M') ? 'bold' : 'normal',
                }}>
                  {stat}
                </div>
              ))}
            </div>
          ))}
          <ECE s={s} enter={18} delay={2} style={{ position: 'absolute', bottom: '8vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.textMuted }}>Two real threats. One that doesn't apply.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 20: Which Bitcoin Is Vulnerable? (10s)
         ═══════════════════════════════════════════════════════ */}
      {s === 19 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ECE s={s} enter={19} delay={0.2} style={{ position: 'absolute', top: '3vh', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.2vw', color: EP_COLORS.text }}>
              BTC Supply by Script Type
            </div>
          </ECE>
          <SupplyChart progress={1} showVulnerable={true} />
          <ECE s={s} enter={19} delay={2} style={{ position: 'absolute', top: '12vh', right: '6vw', textAlign: 'right' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '2vw', color: EP_COLORS.accent }}>
              ~6.9M BTC vulnerable
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>
              (~$690B at $100K/BTC)
            </div>
          </ECE>
          <ECE s={s} enter={19} delay={1.5} style={{ position: 'absolute', bottom: '20vh', left: '8vw' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.accent }}>
              1.7M BTC in P2PK — incl. Satoshi era mining rewards
            </div>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 21: PUNCH 3 setup — "Modern addresses" (7s)
         ═══════════════════════════════════════════════════════ */}
      {s === 20 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.7vw', color: EP_COLORS.text, position: 'relative', marginBottom: '6vh' }}>
            At least modern addresses hide the public key.
            <CrackEffect active={s === 20} width={800} height={50} style={{ top: -5, left: -100 }} />
          </div>
          <div style={{ width: '80vw', height: '30vh' }}>
            <VulnerabilityTimeline mode="full" progress={0.85} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 22: ★ HIGHLIGHT — The Taproot Irony (10s)
         ═══════════════════════════════════════════════════════ */}
      {s === 21 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#0f0508',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* {HIGHLIGHT SCENE} */}
          <div style={{ width: '85vw', height: '35vh' }}>
            <VulnerabilityTimeline
              mode="full"
              progress={1}
              showConnector={true}
              flash={true}
            />
          </div>
          <ECE s={s} enter={21} delay={1.5} style={{ marginTop: '3vh', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.6vw', color: EP_COLORS.text }}>
              Bitcoin's newest upgrade re-introduced its oldest vulnerability.
            </p>
          </ECE>
          <ECE s={s} enter={21} delay={2.2} style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.2vw', color: EP_COLORS.accent, marginTop: '1vh' }}>
              Taproot (2021) = P2PK (2009)
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 23: Fast-Clock vs Slow-Clock (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 22 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {/* Divider */}
          <div style={{ position: 'absolute', left: '50%', top: '10vh', bottom: '10vh', width: 1, background: EP_COLORS.line }} />

          {/* Left: Fast-clock */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4vw' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.2vw', color: EP_COLORS.text }}>Fast-Clock CRQC</div>
            <div style={{
              width: '4vw', height: '4vw', borderRadius: 6,
              background: `repeating-linear-gradient(45deg, ${EP_COLORS.line}, ${EP_COLORS.line} 2px, transparent 2px, transparent 6px)`,
              border: `1px solid ${EP_COLORS.lineBright}`,
              margin: '2vh 0',
              animation: 'fastPulse 0.5s ease-in-out infinite',
            }} />
            {['Superconducting / Photonic', 'Gate speed: fast (μs)', 'Runtime: minutes'].map((line, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.textMuted, marginBottom: '0.4vh' }}>{line}</div>
            ))}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.accent, marginTop: '0.5vh', textDecoration: 'underline' }}>
              Enables: on-spend + at-rest
            </div>
          </div>

          {/* Right: Slow-clock */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4vw' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.2vw', color: EP_COLORS.textMuted }}>Slow-Clock CRQC</div>
            <div style={{
              width: '4vw', height: '4vw', borderRadius: 6,
              background: `repeating-linear-gradient(0deg, ${EP_COLORS.line}, ${EP_COLORS.line} 2px, transparent 2px, transparent 8px)`,
              border: `1px solid ${EP_COLORS.line}`,
              margin: '2vh 0',
              animation: 'slowPulse 3s ease-in-out infinite',
            }} />
            {['Neutral Atom / Ion Trap', 'Gate speed: slow (ms)', 'Runtime: hours to days'].map((line, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.textDim, marginBottom: '0.4vh' }}>{line}</div>
            ))}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>
              Enables: at-rest only
            </div>
          </div>

          <ECE s={s} enter={22} delay={1.5} style={{ position: 'absolute', bottom: '10vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>Which arrives first determines who's at risk first.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 24: Why Proof-of-Work Is Safe (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 23 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ECE s={s} enter={23} delay={0.2}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.5vw', color: EP_COLORS.text }}>What about mining?</div>
          </ECE>
          <div className="pow-grover" style={{ marginTop: '3vh', textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3vw', color: EP_COLORS.textMuted }}>
              Grover's algorithm: √N speedup
            </div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '4vw', color: EP_COLORS.text, marginTop: '1vh', textDecoration: 'line-through', textDecorationColor: EP_COLORS.textDim }}>
              √N
            </div>
            <ECE s={s} enter={23} delay={0.8}>
              <p style={{ fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>But error correction eats the speedup</p>
            </ECE>
          </div>

          <div className="pow-bars" style={{ marginTop: '3vh', width: '50vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw', marginBottom: '1vh' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.textMuted, width: '12vw', textAlign: 'right' }}>Quantum miner</span>
              <div className="bar" style={{ height: 6, width: '0.5vw', background: EP_COLORS.textMuted, borderRadius: 3 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.textMuted }}>0.25 TH/s</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.text, width: '12vw', textAlign: 'right' }}>ASIC S19 Pro</span>
              <div className="bar" style={{ height: 6, width: '25vw', background: EP_COLORS.text, borderRadius: 3 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw', color: EP_COLORS.text }}>110 TH/s</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textDim, textAlign: 'center', marginTop: '1vh' }}>440× weaker</div>
          </div>

          <ECE s={s} enter={23} delay={2}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.textMuted, marginTop: '2vh' }}>Quantum mining isn't a real threat.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 25: PUNCH 4 — "Just migrate" (6s)
         ═══════════════════════════════════════════════════════ */}
      {s === 24 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.7vw', color: EP_COLORS.text, position: 'relative' }}>
            We can just migrate to quantum-resistant addresses.
            <CrackEffect active={s === 24} width={900} height={50} style={{ top: -5, left: -50 }} />
          </div>
          <ECE s={s} enter={24} delay={1.2}>
            <p style={{ fontSize: '1.5vw', color: EP_COLORS.accent, marginTop: '3vh' }}>Not everyone can migrate.</p>
          </ECE>
          <ECE s={s} enter={24} delay={1.8}>
            <p style={{ fontSize: '1.1vw', color: EP_COLORS.textMuted, marginTop: '1vh' }}>Some keys are lost forever.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 26: Responsible Disclosure (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 25 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4vw' }}>
          {/* Left: Locked blueprint */}
          <div className="zk-left" style={{
            width: '32vw', height: '28vh',
            background: EP_COLORS.bgPanel,
            border: `1px solid ${EP_COLORS.line}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Circuit pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(${EP_COLORS.line} 1px, transparent 1px),
                linear-gradient(90deg, ${EP_COLORS.line} 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }} />
            <div style={{ fontSize: '5vw', opacity: 0.8 }}>🔒</div>
            <div style={{
              position: 'absolute', top: '30%', left: '20%',
              fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.5vw',
              color: EP_COLORS.textDim, transform: 'rotate(-15deg)',
              letterSpacing: '6px', opacity: 0.5,
            }}>
              CLASSIFIED
            </div>
            <div style={{ position: 'absolute', top: '1.5vh', left: '1.5vw', fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.1vw', color: EP_COLORS.textMuted }}>
              The Circuit
            </div>
          </div>

          {/* Connection */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '6vw', height: 1, borderTop: `2px dashed ${EP_COLORS.textMuted}` }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>zero-knowledge proof</span>
          </div>

          {/* Right: Verification */}
          <div className="zk-right" style={{
            width: '32vw', padding: '3vh 2vw',
            background: EP_COLORS.bgPanel,
            border: `1px solid ${EP_COLORS.line}`,
            borderRadius: 8,
          }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.1vw', color: EP_COLORS.text, marginBottom: '2vh' }}>
              The Proof
            </div>
            {[
              '✓ We have a circuit',
              '✓ It correctly computes point addition on secp256k1',
              '✓ Verified on 9,000 random inputs',
            ].map((step, i) => (
              <div key={i} className="zk-step" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85vw',
                color: EP_COLORS.textMuted, marginBottom: '0.8vh',
              }}>
                {step}
              </div>
            ))}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75vw', color: EP_COLORS.textDim, marginTop: '1.5vh' }}>
              SP1 zkVM + Groth16 SNARK
            </div>
          </div>

          <ECE s={s} enter={25} delay={2} style={{ position: 'absolute', bottom: '10vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text }}>Prove the threat is real without giving the weapon away.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 27: Resource Reduction Trend (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 26 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ECE s={s} enter={26} delay={0.2} style={{ position: 'absolute', top: '4vh', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.1vw', color: EP_COLORS.text }}>
              Physical Qubits to Break RSA-2048 (Over Time)
            </div>
          </ECE>
          <ResourceChart variant="trend" progress={1} />
          <ECE s={s} enter={26} delay={1.5} style={{ position: 'absolute', bottom: '14vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.accent }}>Attacks always get better.</p>
          </ECE>
          <ECE s={s} enter={26} delay={2.5} style={{ position: 'absolute', bottom: '9vh', left: '50%', transform: 'translateX(-50%)' }}>
            <p style={{ fontSize: '1vw', color: EP_COLORS.textMuted }}>This pattern holds for ECDLP too.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 28: BIP-360 P2MR (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 27 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '85vw', height: '35vh' }}>
            <VulnerabilityTimeline
              mode="extended"
              progress={1}
              showP2MR={true}
            />
          </div>
          <ECE s={s} enter={27} delay={1} style={{ textAlign: 'center', marginTop: '2vh' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1vw', color: EP_COLORS.textMuted }}>BIP-360: Pay-to-Merkle-Root</div>
            <div style={{ fontSize: '1vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>Key hidden behind Merkle root again.</div>
          </ECE>
          <ECE s={s} enter={27} delay={2} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.accent, marginTop: '1vh' }}>
              Fixes at-rest attacks only. On-spend still vulnerable.
            </div>
          </ECE>
          <ECE s={s} enter={27} delay={2.5} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text, marginTop: '1.5vh' }}>A patch, not a cure.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 29: Immediate Mitigations (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 28 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ECE s={s} enter={28} delay={0.2}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.3vw', color: EP_COLORS.text, marginBottom: '3vh' }}>
              What you can do NOW
            </div>
          </ECE>
          <ShieldStack visible={4} />
          <ECE s={s} enter={28} delay={2.5} style={{ marginTop: '3vh' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.textMuted }}>
              Intermediate steps. The real fix is post-quantum cryptography.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 30: THE DORMANT COIN PROBLEM (11s)
         ═══════════════════════════════════════════════════════ */}
      {s === 29 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#050508',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold',
              fontSize: '4vw', color: EP_COLORS.accent,
              marginBottom: '3vh',
            }}
          >
            1,700,000 BTC
          </motion.div>

          <DormantVault active={s === 29} />

          <ECE s={s} enter={29} delay={3} style={{ textAlign: 'center', marginTop: '3vh' }}>
            <p style={{ fontSize: '1.5vw', color: EP_COLORS.text }}>
              These keys are <strong>LOST</strong>.
            </p>
          </ECE>
          <ECE s={s} enter={29} delay={3.5} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.textMuted, marginTop: '0.5vh' }}>
              No owner can migrate them. No software update helps.
            </p>
          </ECE>
          <ECE s={s} enter={29} delay={4.2} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2vw', color: EP_COLORS.accentDim, marginTop: '0.5vh' }}>
              Including Satoshi's ~1.1 million bitcoin.
            </p>
          </ECE>
          <ECE s={s} enter={29} delay={5} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.1vw', color: EP_COLORS.textDim, marginTop: '1.5vh' }}>
              They will sit there until a quantum computer takes them.
            </p>
          </ECE>

          <CrackEffect
            active={s === 29}
            width={600}
            height={80}
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 31: PUNCH 5 — Governance Triptych (9s)
         ═══════════════════════════════════════════════════════ */}
      {s === 30 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ECE s={s} enter={30} delay={0.2}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.5vw', color: EP_COLORS.text, marginBottom: '3vh' }}>
              The real problem isn't cryptography.
            </div>
          </ECE>

          <div style={{ display: 'flex', gap: '1.2vw', padding: '0 6vw' }}>
            {[
              { title: 'Do Nothing', icon: '🤷', desc: 'Let quantum attackers take the coins.', risk: '$170B+ seized by unknown actors', color: EP_COLORS.dormant },
              { title: 'Burn', icon: '🔥', desc: 'Destroy 1.7M BTC by protocol change.', risk: 'Confiscation precedent, supply shock', color: EP_COLORS.accent },
              { title: 'Digital Salvage', icon: '⚓', desc: 'Regulated recovery, like sunken treasure.', risk: 'Legal complexity, centralization', color: EP_COLORS.safe },
            ].map((option, i) => (
              <div key={i} className="gov-panel" style={{
                flex: 1, background: EP_COLORS.bgPanel,
                borderTop: `4px solid ${option.color}`,
                borderRadius: 8, padding: '2.5vh 2vw',
              }}>
                <div style={{ fontSize: '2.5vw', textAlign: 'center', marginBottom: '1vh' }}>{option.icon}</div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1.1vw', color: EP_COLORS.text, textAlign: 'center', marginBottom: '1vh' }}>
                  {option.title}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8vw', color: EP_COLORS.textMuted, marginBottom: '0.8vh' }}>
                  {option.desc}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7vw', color: EP_COLORS.textDim }}>
                  Risks: {option.risk}
                </div>
              </div>
            ))}
          </div>

          <div className="gov-question" style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold',
            fontSize: '5vw', color: EP_COLORS.textDim, marginTop: '2vh',
          }}>
            ?
          </div>
          <ECE s={s} enter={30} delay={2}>
            <p style={{ fontSize: '1.5vw', color: EP_COLORS.text, marginTop: '1vh' }}>The real problem is governance.</p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 32: The Urgency (8s)
         ═══════════════════════════════════════════════════════ */}
      {s === 31 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Timeline */}
          <div style={{ position: 'relative', width: '70vw', height: '20vh' }}>
            <div className="urgency-line" style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: 2, background: EP_COLORS.lineBright,
            }} />

            {/* TODAY node */}
            <div className="urgency-node" style={{ position: 'absolute', left: '10%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={{
                width: '2vw', height: '2vw', borderRadius: '50%',
                background: EP_COLORS.text,
              }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9vw', color: EP_COLORS.textMuted, textAlign: 'center', marginTop: '1vh' }}>
                2026
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold', fontSize: '1vw', color: EP_COLORS.text, textAlign: 'center', marginTop: '0.3vh' }}>
                TODAY
              </div>
            </div>

            {/* Preparation window label */}
            <ECE s={s} enter={31} delay={0.5} style={{ position: 'absolute', left: '35%', top: '20%' }}>
              <span style={{ fontSize: '0.9vw', color: EP_COLORS.textMuted }}>Preparation window</span>
            </ECE>

            {/* CRQC node */}
            <div className="urgency-node" style={{ position: 'absolute', left: '70%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={{
                width: '2vw', height: '2vw', borderRadius: '50%',
                border: `2px dashed ${EP_COLORS.accent}`,
                background: 'transparent',
              }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1vw', color: EP_COLORS.accent, textAlign: 'center', marginTop: '1vh' }}>
                ???
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.9vw', color: EP_COLORS.textMuted, textAlign: 'center', marginTop: '0.3vh' }}>
                First CRQC
              </div>
            </div>

            {/* Unknown timeline brace */}
            <ECE s={s} enter={31} delay={1} style={{ position: 'absolute', left: '50%', top: '8%', transform: 'translateX(-50%)' }}>
              <span style={{ fontSize: '0.8vw', color: EP_COLORS.textDim }}>Unknown timeline</span>
            </ECE>
          </div>

          <ECE s={s} enter={31} delay={1.5}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold',
              fontSize: '1.1vw', color: EP_COLORS.accent, marginTop: '2vh',
            }}>
              ← Migration must START now.
            </div>
          </ECE>
          <ECE s={s} enter={31} delay={2}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75vw', color: EP_COLORS.textDim }}>
              Google's migration deadline: 2029
            </span>
          </ECE>
          <ECE s={s} enter={31} delay={2.5}>
            <p style={{ fontSize: '1.3vw', color: EP_COLORS.text, marginTop: '2vh' }}>
              The window is closing. The migration starts now.
            </p>
          </ECE>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCENE 33: CTA (6s)
         ═══════════════════════════════════════════════════════ */}
      {s === 32 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cta-card" style={{
            background: EP_COLORS.bgPanel,
            border: `1px solid ${EP_COLORS.line}`,
            borderRadius: 12,
            padding: '5vh 5vw',
            textAlign: 'center',
          }}>
            <div className="cta-line" style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 'bold',
              fontSize: '1.7vw', color: EP_COLORS.text,
            }}>
              Follow @bitcoin_devs
            </div>
            <div className="cta-line" style={{
              fontSize: '1.2vw', color: EP_COLORS.textMuted, marginTop: '1.5vh',
            }}>
              Read the paper
            </div>
            <div className="cta-line" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1vw', color: EP_COLORS.textMuted,
              textDecoration: 'underline', marginTop: '0.5vh',
            }}>
              arxiv.org/abs/2603.28846
            </div>
            <div style={{
              width: '12vw', height: 1,
              background: EP_COLORS.line,
              margin: '2vh auto',
            }} />
            <div className="cta-line" style={{
              fontSize: '1.2vw', color: EP_COLORS.textDim,
            }}>
              Next: How Post-Quantum Signatures Work
            </div>
          </div>
        </div>
      )}

      {/* Global CSS animations */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes qubitSpin {
          0% { transform: perspective(400px) rotateY(0deg); }
          100% { transform: perspective(400px) rotateY(360deg); }
        }
        @keyframes fastPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes slowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <DevControls player={player} />
    </div>
  );
}
