/**
 * CallbackPanel — morph() + CSS for Act 3
 *
 * Two 1-scene callbacks referencing EP5 and EP6:
 * Scene 10: 64-byte TX ambiguity → banned
 * Scene 11: Duplicate coinbase TXID → nLockTime fix
 */
import { motion } from 'framer-motion';
import { morph } from '@/lib/video';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

const HEX_SAMPLE = '01000000 01000000 00000000 00000000 00000000 00000000 00000000 00000000';

export default function CallbackPanel({ scene, style }: Props) {
  const is64Byte = scene <= 10;

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'column', gap: '6vh' }}>
      {/* ─── 64-Byte TX Panel (top half of Zone D) ─── */}
      <div style={{
        position: 'relative', padding: '3vh 3vw',
        background: EP_COLORS.bgAlt + '80', borderRadius: '1vw',
        minHeight: '30vh',
      }}>
        {/* Hex strip with dual-color pulse */}
        <motion.div
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '1.1vw',
            letterSpacing: '0.05em', textAlign: 'center',
            padding: '1.5vh 1vw', borderRadius: '0.5vw',
            border: `1px solid ${EP_COLORS.muted}40`,
          }}
          {...morph(scene, {
            0: { color: EP_COLORS.text, background: EP_COLORS.bg },
            10: { color: EP_COLORS.text, background: EP_COLORS.bg },
          })}
        >
          {HEX_SAMPLE}
        </motion.div>

        {/* Interpretation labels */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8vw', marginTop: '2vh' }}>
          <motion.div
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2vw' }}
            {...morph(scene, {
              0: { opacity: 0 },
              10: { opacity: 1, color: EP_COLORS.accentAlt },
            })}
          >
            As a transaction →
          </motion.div>
          <motion.div
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2vw' }}
            {...morph(scene, {
              0: { opacity: 0 },
              10: { opacity: 1, color: EP_COLORS.timestamp },
            })}
          >
            As a Merkle node →
          </motion.div>
        </div>

        {/* Color pulse indicator */}
        <div style={{
          display: 'flex', gap: '1vw', marginTop: '1.5vh', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '0.9vw', color: EP_COLORS.muted,
        }}>
          <span style={{ color: EP_COLORS.accentAlt }}>■ transaction</span>
          <span style={{ color: EP_COLORS.timestamp }}>■ Merkle node</span>
          <span>← same bytes, two meanings</span>
        </div>

        {/* Red X stamp */}
        <motion.div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            fontSize: '8vw', fontWeight: 'bold',
            color: EP_COLORS.accent,
            pointerEvents: 'none',
          }}
          {...morph(scene, {
            0: { opacity: 0, scale: 0, x: '-50%', y: '-50%', rotate: -10 },
            10: { opacity: 0.85, scale: 1, x: '-50%', y: '-50%', rotate: 0 },
          })}
          transition={EP_SPRINGS.attack}
        >
          ✗
        </motion.div>

        {/* Ban label */}
        <motion.div
          style={{
            marginTop: '2vh', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '1.3vw',
          }}
          {...morph(scene, {
            0: { opacity: 0, color: EP_COLORS.muted },
            10: { opacity: 1, color: EP_COLORS.fix },
          })}
        >
          Banned. No legitimate tx needs 64 bytes.
        </motion.div>

        {/* EP5 link */}
        <motion.div
          style={{
            marginTop: '1vh', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '0.9vw',
            color: EP_COLORS.muted,
          }}
          {...morph(scene, { 0: { opacity: 0 }, 10: { opacity: 0.7 } })}
        >
          Deep dive → EP5
        </motion.div>
      </div>

      {/* ─── Duplicate Coinbase Panel (bottom half of Zone D) ─── */}
      <div style={{
        position: 'relative', padding: '3vh 3vw',
        background: EP_COLORS.bgAlt + '80', borderRadius: '1vw',
        minHeight: '30vh',
      }}>
        {/* Two block icons with matching TXIDs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6vw', alignItems: 'center' }}>
          {/* Block A */}
          <motion.div
            style={{
              width: '12vw', padding: '2vh 1vw',
              background: EP_COLORS.bg, borderRadius: '0.5vw',
              border: `1px solid ${EP_COLORS.difficulty}60`,
              textAlign: 'center',
            }}
            {...morph(scene, {
              0: { opacity: 0, x: -30 },
              11: { opacity: 1, x: 0 },
            })}
          >
            <div style={{ color: EP_COLORS.difficulty, fontSize: '0.9vw', fontFamily: 'var(--font-mono)', marginBottom: '0.5vh' }}>
              Block 91,722
            </div>
            <div style={{ color: EP_COLORS.accentAlt, fontSize: '1vw', fontFamily: 'var(--font-mono)' }}>
              e3bf3d07...
            </div>
            {/* UTXO entry that fades */}
            <motion.div
              style={{
                marginTop: '1vh', padding: '0.5vh', borderRadius: '0.3vw',
                background: EP_COLORS.difficulty + '20', fontSize: '0.8vw',
                fontFamily: 'var(--font-mono)', color: EP_COLORS.text,
              }}
              {...morph(scene, {
                0: { opacity: 0.8 },
                11: { opacity: 0.15 },
              })}
            >
              UTXO: 50 BTC
            </motion.div>
          </motion.div>

          {/* Arrow: overwrites */}
          <motion.div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '1.1vw',
            }}
            {...morph(scene, {
              0: { opacity: 0 },
              11: { opacity: 1, color: EP_COLORS.accent },
            })}
          >
            <div>←── Overwrites! ──→</div>
            <div style={{ color: EP_COLORS.accent, fontWeight: 'bold', marginTop: '0.5vh' }}>
              100 BTC lost
            </div>
          </motion.div>

          {/* Block B */}
          <motion.div
            style={{
              width: '12vw', padding: '2vh 1vw',
              background: EP_COLORS.bg, borderRadius: '0.5vw',
              border: `1px solid ${EP_COLORS.accent}60`,
              textAlign: 'center',
            }}
            {...morph(scene, {
              0: { opacity: 0, x: 30 },
              11: { opacity: 1, x: 0 },
            })}
          >
            <div style={{ color: EP_COLORS.accent, fontSize: '0.9vw', fontFamily: 'var(--font-mono)', marginBottom: '0.5vh' }}>
              Block 91,880
            </div>
            <motion.div
              style={{ fontSize: '1vw', fontFamily: 'var(--font-mono)' }}
              {...morph(scene, {
                0: { color: EP_COLORS.accentAlt },
                11: { color: EP_COLORS.accentAlt },
              })}
            >
              e3bf3d07...
            </motion.div>
          </motion.div>
        </div>

        {/* Fix: nLockTime */}
        <motion.div
          style={{
            marginTop: '3vh', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '1.4vw',
            padding: '1vh 2vw', borderRadius: '0.5vw',
            border: `1px solid ${EP_COLORS.fix}60`,
            background: EP_COLORS.fix + '10',
          }}
          {...morph(scene, {
            0: { opacity: 0, y: 10 },
            11: { opacity: 1, y: 0, color: EP_COLORS.fix },
          })}
        >
          Fix: nLockTime = height - 1 → Unique forever.
        </motion.div>

        {/* EP6 link */}
        <motion.div
          style={{
            marginTop: '1vh', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '0.9vw',
            color: EP_COLORS.muted,
          }}
          {...morph(scene, { 0: { opacity: 0 }, 11: { opacity: 0.7 } })}
        >
          Deep dive → EP6
        </motion.div>
      </div>
    </div>
  );
}
