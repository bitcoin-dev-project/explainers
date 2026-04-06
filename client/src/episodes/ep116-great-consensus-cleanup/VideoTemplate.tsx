import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useVideoPlayer,
  DevControls,
  morph,
  sceneRange,
  createThemedCE,
} from '@/lib/video';
import ConsoleCanvas from './ConsoleCanvas';
import DifficultyStaircase from './DifficultyStaircase';
import HashingHeatmap from './HashingHeatmap';
import DualInterpretation from './DualInterpretation';
import UTXOOverwrite from './UTXOOverwrite';
import {
  EP_COLORS,
  EP_SPRINGS,
  SCENE_DURATIONS,
  CE_THEME,
  getBugStatuses,
  getActiveBugIndex,
  getProgress,
} from './constants';

const ECE = createThemedCE(CE_THEME);

// Console width morph: full-width (scene 1) → sidebar (2-21) → center (22) → ghosted (23)
function consoleWidth(s: number): number {
  if (s <= 0) return 1920;
  if (s <= 21) return 320;
  if (s <= 22) return 800;
  return 800;
}

function consoleLeft(s: number): number {
  if (s <= 0) return 0;
  if (s <= 21) return 0;
  return 560; // centered in 1920
}

function consoleOpacity(s: number): number {
  if (s >= 23) return 0.15;
  return 1;
}

// Determine DifficultyStaircase mode
function getStaircaseMode(s: number) {
  if (s === 4) return 'intro' as const;
  if (s === 5) return 'collapse' as const;
  if (s === 6) return 'flood' as const;
  if (s === 7) return 'fix' as const;
  return 'hidden' as const;
}

// Determine HashingHeatmap mode
function getHeatmapMode(s: number) {
  if (s === 9) return 'linear' as const;
  if (s === 10) return 'quadratic' as const;
  if (s === 11) return 'capped' as const;
  return 'hidden' as const;
}

// Determine DualInterpretation mode
function getDualMode(s: number) {
  if (s === 13) return 'tree' as const;
  if (s === 14) return 'txbar' as const;
  if (s === 15) return 'morph' as const;
  if (s === 16) return 'spv' as const;
  if (s === 17) return 'banned' as const;
  return 'hidden' as const;
}

// Determine UTXOOverwrite mode
function getUTXOMode(s: number) {
  if (s === 18) return 'context' as const;
  if (s === 19) return 'expiration' as const;
  if (s === 20) return 'impact' as const;
  if (s === 21) return 'fix' as const;
  return 'hidden' as const;
}

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;
  const containerRef = useRef<HTMLDivElement>(null);

  const bugStatuses = getBugStatuses(s);
  const activeBugIndex = getActiveBugIndex(s);
  const progress = getProgress(s);

  const bgColor = s === 15 ? EP_COLORS.bgHighlight : EP_COLORS.bg;

  return (
    <div
      ref={containerRef}
      data-video="ep116"
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: bgColor, transition: 'background-color 0.5s' }}
    >
      {/* ═══════════════ CONSOLE CANVAS (persistent) ═══════════════ */}
      <motion.div
        {...morph(s, {
          0: { left: 0, width: 1920, opacity: 1 },
          1: { left: 0, width: 320, opacity: 1 },
          22: { left: 560, width: 800, opacity: 1 },
          23: { left: 560, width: 800, opacity: 0.15 },
        })}
        style={{
          position: 'absolute',
          top: 0,
          height: '100vh',
          zIndex: 10,
        }}
      >
        <ConsoleCanvas
          scene={s}
          bugStatuses={bugStatuses}
          activeBugIndex={activeBugIndex}
          progress={progress}
          width={consoleWidth(s)}
        />
      </motion.div>

      {/* ═══════════════ TITLE CARD (Scene 1) ═══════════════ */}
      <ECE s={s} enter={0} exit={1} delay={0.4}>
        <div style={{
          position: 'absolute',
          top: '38vh',
          left: '50vw',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 20,
        }}>
          <motion.h1
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...EP_SPRINGS.enter, delay: 0.3 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '64px',
              fontWeight: 'bold',
              color: EP_COLORS.text,
              lineHeight: 1.1,
            }}
          >
            The Great Consensus Cleanup
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '32px',
              color: EP_COLORS.accent,
              marginTop: '12px',
            }}
          >
            BIP 54
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              color: EP_COLORS.textMuted,
              marginTop: '16px',
            }}
          >
            4 bugs. 4 fixes. 1 soft fork.
          </motion.div>
        </div>
      </ECE>

      {/* ═══════════════ ACT STAGE (right side when sidebar active) ═══════════════ */}
      <div
        style={{
          position: 'absolute',
          left: s <= 0 || s >= 22 ? 0 : '320px',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
        }}
      >
        {/* ── Scene 2: Familiar Ground ── */}
        <ECE s={s} enter={1} exit={2} delay={0.3}>
          <div style={{
            position: 'absolute',
            top: '5vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-body)',
            fontSize: '24px',
            color: EP_COLORS.text,
            textAlign: 'center',
            maxWidth: '80%',
          }}>
            Every 2,016 blocks, Bitcoin adjusts difficulty.
          </div>
        </ECE>

        {sceneRange(s, 1, 3) && (
          <div style={{ position: 'absolute', top: '20vh', left: '5%', display: 'flex', gap: '16px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`block-${i}`}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, ...EP_SPRINGS.enter }}
                style={{
                  width: '120px',
                  height: '72px',
                  background: EP_COLORS.bgAlt,
                  border: `1px solid ${EP_COLORS.statusDim}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: EP_COLORS.textMuted,
                }}
              >
                #{(840001 + i).toLocaleString()}
              </motion.div>
            ))}
          </div>
        )}

        {/* Difficulty label */}
        <ECE s={s} enter={1} exit={2} delay={1.2}>
          <div style={{
            position: 'absolute',
            top: '55vh',
            left: '5%',
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            color: EP_COLORS.text,
          }}>
            <span style={{ color: EP_COLORS.textMuted }}>Difficulty: </span>83.13T
            <div style={{ fontSize: '13px', color: EP_COLORS.textMuted, marginTop: 4 }}>
              Target: 1 block every 10 minutes
            </div>
          </div>
        </ECE>

        {/* ── Scene 3: Non-Standard ≠ Invalid ── */}
        <ECE s={s} enter={2} exit={3} delay={0.2}>
          <div style={{
            position: 'absolute',
            top: '6vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-body)',
            fontSize: '22px',
            color: EP_COLORS.text,
            textAlign: 'center',
          }}>
            Bitcoin Core blocks all four attacks...
          </div>
        </ECE>

        {sceneRange(s, 2, 4) && (
          <div style={{
            position: 'absolute',
            top: '30vh',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}>
            {/* Shield */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <svg width="160" height="190" viewBox="0 0 160 190">
                <motion.path
                  d="M80 10 L150 50 L150 110 C150 150 120 175 80 185 C40 175 10 150 10 110 L10 50 Z"
                  fill="none"
                  stroke={EP_COLORS.statusGreen}
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
                <text x="80" y="105" textAnchor="middle" fill={EP_COLORS.statusGreen}
                  fontFamily="var(--font-body)" fontSize="16">
                  Relay Policy
                </text>
              </svg>
            </motion.div>

            {/* Crack & split labels */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: EP_COLORS.statusGreen, fontSize: 16 }}>Policy</span>
              <span style={{ color: EP_COLORS.actCoinbase, fontSize: 28, fontWeight: 'bold' }}>≠</span>
              <span style={{ color: EP_COLORS.actCoinbase, fontSize: 16 }}>Consensus</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8 }}
              style={{
                marginTop: '12px',
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                color: EP_COLORS.statusRed,
              }}
            >
              ...but policy is a suggestion. Consensus is law.
            </motion.div>
          </div>
        )}

        {/* ═══════ ACT 1: TIMEWARP (scenes 4-7) ═══════ */}

        {/* Scene headings for Act 1 */}
        <ECE s={s} enter={3} exit={5} delay={0.2}>
          <div style={headingStyle}>
            The difficulty window measures 2,015 intervals, not 2,016.
          </div>
        </ECE>

        <ECE s={s} enter={4} exit={6} delay={0.2}>
          <div style={headingStyle}>
            A majority miner can set false timestamps.
          </div>
        </ECE>

        <ECE s={s} enter={5} exit={7} delay={0.2}>
          <div style={headingStyle}>
            Difficulty 1 means mass block production.
          </div>
        </ECE>

        <ECE s={s} enter={6} exit={8} delay={0.2}>
          <div style={headingStyle}>
            Fix: constrain timestamps at period boundaries.
          </div>
        </ECE>

        {/* DifficultyStaircase */}
        {sceneRange(s, 3, 8) && (
          <div style={{ position: 'absolute', top: '10vh', left: '3%', right: '3%', bottom: '5vh' }}>
            <DifficultyStaircase mode={getStaircaseMode(s)} scene={s} />
          </div>
        )}

        {/* Act speed + timer labels for scene 6 */}
        {sceneRange(s, 5, 7) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              position: 'absolute',
              top: '35vh',
              right: '8%',
              textAlign: 'right',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              color: EP_COLORS.actTimewarp,
            }}>
              ~6 blocks / second
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              color: EP_COLORS.statusRed,
              marginTop: 8,
            }}>
              40 days to collapse
            </div>
          </motion.div>
        )}

        {/* ═══════ ACT BREAK 1→2 (Scene 8) ═══════ */}
        <ECE s={s} enter={7} exit={8} delay={0.3}>
          <div style={{
            position: 'absolute',
            top: '45vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            color: EP_COLORS.actQuadratic,
            opacity: 0.8,
          }}>
            ACT 2
          </div>
        </ECE>

        {/* ═══════ ACT 2: QUADRATIC HASHING (scenes 9-11) ═══════ */}

        <ECE s={s} enter={8} exit={10} delay={0.2}>
          <div style={headingStyle}>
            Every input hashes the entire transaction for signature checks.
          </div>
        </ECE>

        <ECE s={s} enter={9} exit={11} delay={0.2}>
          <div style={headingStyle}>
            One crafted transaction with maximum inputs...
          </div>
        </ECE>

        <ECE s={s} enter={10} exit={12} delay={0.2}>
          <div style={headingStyle}>
            Fix: cap legacy transactions at 2,500 sigops.
          </div>
        </ECE>

        {/* HashingHeatmap */}
        {sceneRange(s, 8, 12) && (
          <div style={{ position: 'absolute', top: '10vh', left: '3%', width: '600px', height: '600px' }}>
            <HashingHeatmap
              mode={getHeatmapMode(s)}
              scene={s}
              width={600}
              height={600}
            />
          </div>
        )}

        {/* ═══════ ACT BREAK 2→3 (Scene 12) ═══════ */}
        <ECE s={s} enter={11} exit={12} delay={0.3}>
          <div style={{
            position: 'absolute',
            top: '45vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            color: EP_COLORS.actMerkle,
            opacity: 0.8,
          }}>
            ACT 3
          </div>
        </ECE>

        {/* ═══════ ACT 3: 64-BYTE TX (scenes 13-17) ═══════ */}

        <ECE s={s} enter={12} exit={14} delay={0.2}>
          <div style={headingStyle}>
            A block's Merkle tree proves which transactions are inside.
          </div>
        </ECE>

        <ECE s={s} enter={13} exit={15} delay={0.2}>
          <div style={headingStyle}>
            A 64-byte transaction exists.
          </div>
        </ECE>

        {/* HIGHLIGHT heading for scene 15 */}
        <ECE s={s} enter={14} exit={16} delay={0.2}>
          <div style={{
            ...headingStyle,
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 'bold',
            color: EP_COLORS.highlight,
          }}>
            Same bytes. Two interpretations.
          </div>
        </ECE>

        <ECE s={s} enter={15} exit={17} delay={0.2}>
          <div style={headingStyle}>
            An attacker crafts a fake Merkle proof.
          </div>
        </ECE>

        <ECE s={s} enter={16} exit={18} delay={0.2}>
          <div style={headingStyle}>
            Fix: ban transactions that serialize to exactly 64 bytes.
          </div>
        </ECE>

        {/* Question for scene 13 */}
        <ECE s={s} enter={12} exit={14} delay={2.0}>
          <div style={{
            position: 'absolute',
            bottom: '15vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: EP_COLORS.highlight,
            textAlign: 'center',
          }}>
            What if a transaction is also exactly 64 bytes?
          </div>
        </ECE>

        {/* DualInterpretation */}
        {sceneRange(s, 12, 18) && (
          <div style={{ position: 'absolute', top: '8vh', left: '0', right: '0', bottom: '5vh' }}>
            <DualInterpretation mode={getDualMode(s)} scene={s} />
          </div>
        )}

        {/* ═══════ ACT 4: COINBASE (scenes 18-21) ═══════ */}

        {/* Act break label */}
        <ECE s={s} enter={17} exit={18} delay={0.2}>
          <div style={{
            position: 'absolute',
            top: '45vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            color: EP_COLORS.actCoinbase,
            opacity: 0.8,
          }}>
            ACT 4
          </div>
        </ECE>

        <ECE s={s} enter={17} exit={19} delay={0.8}>
          <div style={headingStyle}>
            BIP 34 made each coinbase transaction unique — by embedding block height.
          </div>
        </ECE>

        <ECE s={s} enter={18} exit={20} delay={0.2}>
          <div style={headingStyle}>
            But BIP 34's encoding trick has an expiration date.
          </div>
        </ECE>

        <ECE s={s} enter={19} exit={21} delay={0.1}>
          <div style={{
            ...headingStyle,
            fontFamily: 'var(--font-display)',
            fontWeight: 'bold',
            color: EP_COLORS.statusRed,
          }}>
            This already happened.
          </div>
        </ECE>

        <ECE s={s} enter={20} exit={22} delay={0.2}>
          <div style={headingStyle}>
            Fix: require nLockTime = block height − 1.
          </div>
        </ECE>

        {/* UTXOOverwrite */}
        {sceneRange(s, 17, 22) && (
          <div style={{ position: 'absolute', top: '10vh', left: '0', right: '0', bottom: '5vh' }}>
            <UTXOOverwrite mode={getUTXOMode(s)} scene={s} />
          </div>
        )}
      </div>

      {/* ═══════════════ RESOLUTION (scenes 22-23) ═══════════════ */}

      {/* Scene 22: One Soft Fork */}
      <ECE s={s} enter={21} exit={23} delay={0.5}>
        <div style={{
          position: 'absolute',
          top: '8vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 20,
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 'bold',
            color: EP_COLORS.text,
          }}>
            Four bugs. Four fixes. One soft fork.
          </div>
        </div>
      </ECE>

      {/* Fix names next to console rows in scene 22 */}
      {sceneRange(s, 21, 23) && (
        <div style={{
          position: 'absolute',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minWidth: '400px',
        }}>
          {[
            { name: 'Timestamp constraint', color: EP_COLORS.actTimewarp, delay: 1.0 },
            { name: 'Sigop cap', color: EP_COLORS.actQuadratic, delay: 1.3 },
            { name: '64-byte ban', color: EP_COLORS.actMerkle, delay: 1.6 },
            { name: 'nLockTime uniqueness', color: EP_COLORS.statusGreen, delay: 1.9 },
          ].map((fix) => (
            <motion.div
              key={fix.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: fix.delay, ...EP_SPRINGS.enter }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '16px',
                color: fix.color,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: EP_COLORS.statusGreen }}>✓</span>
              {fix.name}
            </motion.div>
          ))}
        </div>
      )}

      {/* BIP 54 badge */}
      <ECE s={s} enter={21} exit={23} delay={2.5}>
        <div style={{
          position: 'absolute',
          bottom: '22vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 20,
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '44px',
              fontWeight: 'bold',
              color: EP_COLORS.accent,
            }}
          >
            BIP 54
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: EP_COLORS.textMuted,
              marginTop: 8,
            }}
          >
            Corallo 2019 → Poinsot 2024 → Merged 2025
          </motion.div>
        </div>
      </ECE>

      <ECE s={s} enter={21} exit={23} delay={3.5}>
        <div style={{
          position: 'absolute',
          bottom: '12vh',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: EP_COLORS.text,
          zIndex: 20,
        }}>
          The first consensus cleanup since Taproot.
        </div>
      </ECE>

      {/* Scene 23: CTA */}
      <ECE s={s} enter={22} exit={23} delay={0.3}>
        <div style={{
          position: 'absolute',
          top: '40vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 25,
        }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '36px',
              fontWeight: 'bold',
              color: EP_COLORS.accent,
            }}
          >
            Follow @bitcoin_devs
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: EP_COLORS.textMuted,
              marginTop: '16px',
            }}
          >
            More Bitcoin deep-dives →
          </motion.div>
        </div>
      </ECE>

      {/* Fade to black on final scene end */}
      {s >= 22 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: s >= 23 ? 1 : 0 }}
          transition={{ duration: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'black',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      )}

      <DevControls player={player} />
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  position: 'absolute',
  top: '4vh',
  left: '50%',
  transform: 'translateX(-50%)',
  fontFamily: 'var(--font-body)',
  fontSize: '22px',
  color: EP_COLORS.text,
  textAlign: 'center',
  maxWidth: '85%',
  lineHeight: 1.3,
};
