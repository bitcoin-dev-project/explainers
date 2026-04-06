import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EP_COLORS, EP_SPRINGS } from './constants';

type DualMode = 'tree' | 'txbar' | 'sidebyside' | 'morph' | 'spv' | 'banned' | 'hidden';

interface DualInterpretationProps {
  mode: DualMode;
  scene: number;
}

const BAR_W = 640;
const BAR_H = 72;
const FONT_MONO = 'var(--font-mono)';

// TX field definitions (64 bytes total)
const TX_FIELDS = [
  { label: 'version', bytes: 4, color: '#A78BFA' },
  { label: 'txin_count', bytes: 1, color: '#F59E0B' },
  { label: 'txin', bytes: 41, color: '#F59E0B' },
  { label: 'txout_count', bytes: 1, color: '#2DD4BF' },
  { label: 'txout', bytes: 9, color: '#2DD4BF' },
  { label: 'locktime', bytes: 4, color: '#94A3B8' },
];

// Merkle node fields (64 bytes total)
const MERKLE_FIELDS = [
  { label: 'H_left (32B)', bytes: 32, color: '#2DD4BF' },
  { label: 'H_right (32B)', bytes: 32, color: '#1a9e8f' },
];

function fieldWidths(fields: typeof TX_FIELDS, totalW: number) {
  const totalBytes = fields.reduce((s, f) => s + f.bytes, 0);
  return fields.map(f => (f.bytes / totalBytes) * totalW);
}

const TX_HEX = ['02000000', '01', '00..00 ffffffff 00', '01', '00..00 00', '00000000'];

export default function DualInterpretation({ mode, scene }: DualInterpretationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [morphPhase, setMorphPhase] = useState<'tx' | 'merkle' | 'tx2'>('tx');
  const [shimmer, setShimmer] = useState(false);

  // Drive morph animation phases when in morph mode
  useEffect(() => {
    if (mode !== 'morph') {
      setMorphPhase('tx');
      setShimmer(false);
      return;
    }

    // Phase 1: show TX (0-1.5s), morph to merkle (1.5-4s), hold (4-5s),
    // morph back to tx (5-7.5s), hold (7.5-8s), show both labels (8s+)
    setMorphPhase('tx');
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setMorphPhase('merkle'), 1500));
    timers.push(setTimeout(() => setMorphPhase('tx2'), 5000));
    timers.push(setTimeout(() => setShimmer(true), 8500));

    return () => timers.forEach(clearTimeout);
  }, [mode]);

  if (mode === 'hidden') return null;

  const txWidths = fieldWidths(TX_FIELDS, BAR_W);
  const merkleWidths = fieldWidths(MERKLE_FIELDS, BAR_W);

  // Current field display based on morph phase
  const showMerkle = morphPhase === 'merkle';
  const currentFields = showMerkle ? MERKLE_FIELDS : TX_FIELDS;
  const currentWidths = showMerkle ? merkleWidths : txWidths;

  const renderBar = (
    fields: typeof TX_FIELDS,
    widths: number[],
    yOffset: number,
    label?: string,
    labelColor?: string,
    showHex?: boolean,
    isBanned?: boolean,
  ) => {
    let x = 0;
    return (
      <div style={{ position: 'relative', width: BAR_W, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            width: BAR_W,
            height: BAR_H,
            border: `1px solid ${EP_COLORS.textMuted}40`,
            borderRadius: 6,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {fields.map((field, i) => {
            const w = widths[i];
            const prevX = x;
            x += w;
            return (
              <div
                key={`${field.label}-${i}`}
                style={{
                  width: w,
                  height: BAR_H,
                  background: field.color + '20',
                  borderRight: i < fields.length - 1 ? `1px solid ${field.color}50` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 4px',
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: w < 40 ? 7 : 9,
                  color: field.color,
                  fontFamily: FONT_MONO,
                  textAlign: 'center',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}>
                  {field.label}
                </span>
                {showHex && TX_HEX[i] && (
                  <span style={{
                    fontSize: 7,
                    color: EP_COLORS.text + 'aa',
                    fontFamily: FONT_MONO,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}>
                    {TX_HEX[i]}
                  </span>
                )}
              </div>
            );
          })}

          {/* Shimmer overlay */}
          {shimmer && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent 0%, ${EP_COLORS.highlight}15 50%, transparent 100%)`,
              animation: 'shimmerSweep 2s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Byte count label */}
        <div style={{
          position: 'absolute',
          right: -120,
          top: BAR_H / 2 - 10,
          fontFamily: FONT_MONO,
          fontSize: 14,
          fontWeight: 'bold',
          color: EP_COLORS.highlight,
        }}>
          = 64 bytes
        </div>

        {/* Type label below */}
        {label && (
          <div style={{
            textAlign: 'center',
            marginTop: 8,
            fontFamily: FONT_MONO,
            fontSize: 14,
            color: labelColor || EP_COLORS.text,
          }}>
            {label}
          </div>
        )}

        {/* Ban stamp */}
        {isBanned && (
          <motion.div
            initial={{ opacity: 0, scale: 2, rotate: -15 }}
            animate={{ opacity: 0.85, scale: 1, rotate: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: -10,
              left: BAR_W / 2 - 80,
              width: 160,
              height: 60,
              border: `4px solid ${EP_COLORS.actCoinbase}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 'bold',
              color: EP_COLORS.actCoinbase,
              background: `${EP_COLORS.actCoinbase}15`,
            }}
          >
            BANNED
          </motion.div>
        )}
      </div>
    );
  };

  // Merkle tree for refresher scene
  const renderMerkleTree = () => (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Leaf nodes */}
      {['TX₁', 'TX₂', 'TX₃', 'TX₄'].map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.15, ...EP_SPRINGS.enter }}
          style={{
            position: 'absolute',
            left: `${80 + i * 140}px`,
            bottom: '80px',
            width: '60px',
            height: '40px',
            background: EP_COLORS.bgAlt,
            border: `1px solid ${EP_COLORS.actMerkle}50`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: EP_COLORS.actMerkle,
          }}
        >
          {label}
        </motion.div>
      ))}

      {/* Internal nodes */}
      {['H(TX₁|TX₂)', 'H(TX₃|TX₄)'].map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 + i * 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            position: 'absolute',
            left: `${120 + i * 280}px`,
            bottom: '180px',
            width: '100px',
            height: '40px',
            background: EP_COLORS.bgAlt,
            border: `1px solid ${EP_COLORS.actMerkle}40`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: EP_COLORS.textMuted,
          }}
        >
          {label}
        </motion.div>
      ))}

      {/* Root node */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'absolute',
          left: '250px',
          bottom: '290px',
          width: '100px',
          height: '44px',
          background: EP_COLORS.bgAlt,
          border: `2px solid ${EP_COLORS.actMerkle}`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: EP_COLORS.actMerkle,
          fontWeight: 'bold',
        }}
      >
        Merkle Root
      </motion.div>

      {/* Node detail label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.0 }}
        style={{
          position: 'absolute',
          left: '120px',
          bottom: '140px',
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: EP_COLORS.actMerkle,
        }}
      >
        64 bytes: H_left (32B) | H_right (32B)
      </motion.div>

      {/* Connecting lines (simplified as SVG) */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Leaf to internal lines */}
        <motion.line x1="110" y1="960" x2="170" y2="870" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.0, duration: 0.4 }} />
        <motion.line x1="250" y1="960" x2="170" y2="870" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.0, duration: 0.4 }} />
        <motion.line x1="390" y1="960" x2="450" y2="870" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.1, duration: 0.4 }} />
        <motion.line x1="530" y1="960" x2="450" y2="870" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.1, duration: 0.4 }} />
        {/* Internal to root */}
        <motion.line x1="170" y1="860" x2="300" y2="770" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.6, duration: 0.4 }} />
        <motion.line x1="450" y1="860" x2="300" y2="770" stroke={EP_COLORS.textMuted + '40'} strokeWidth={1}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.6, duration: 0.4 }} />
      </svg>
    </div>
  );

  // SPV forgery scene
  const renderSPV = () => (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Bar at top */}
      <div style={{ position: 'absolute', top: '60px', left: '50px' }}>
        {renderBar(TX_FIELDS, txWidths, 0)}
      </div>

      {/* SPV client icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'absolute',
          right: '80px',
          top: '250px',
          width: '100px',
          height: '140px',
          background: EP_COLORS.bgAlt,
          border: `2px solid ${EP_COLORS.textMuted}60`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 28 }}>📱</div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: EP_COLORS.textMuted }}>
          SPV Client
        </span>

        {/* Valid then invalid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
          style={{
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          <motion.span
            animate={{ color: [EP_COLORS.actMerkle, EP_COLORS.statusRed] }}
            transition={{ delay: 3.0, duration: 0.3 }}
          >
            ✓ Valid
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Forged proof arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{
          position: 'absolute',
          left: '350px',
          top: '200px',
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: EP_COLORS.statusRed,
        }}
      >
        Forged proof: "TX exists in block" →
      </motion.div>

      {/* Cost label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        style={{
          position: 'absolute',
          left: '200px',
          top: '280px',
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: EP_COLORS.actQuadratic,
        }}
      >
        Cost: ~70 bits of grinding ≈ $1-10M
      </motion.div>

      {/* False label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
        style={{
          position: 'absolute',
          left: '200px',
          top: '320px',
          fontFamily: FONT_MONO,
          fontSize: 14,
          color: EP_COLORS.statusRed,
        }}
      >
        But the transaction never existed.
      </motion.div>
    </div>
  );

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
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {mode === 'tree' && renderMerkleTree()}

      {mode === 'txbar' && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {renderBar(TX_FIELDS, txWidths, 0, undefined, undefined, true)}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.0 }}
            style={{ marginTop: 40 }}
          >
            {renderBar(MERKLE_FIELDS, merkleWidths, 0, 'Merkle Node', EP_COLORS.actMerkle)}
          </motion.div>
        </div>
      )}

      {mode === 'morph' && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <motion.div
            animate={{
              borderColor: showMerkle ? EP_COLORS.actMerkle : EP_COLORS.actTimewarp,
            }}
            transition={EP_SPRINGS.merkleMorph}
            style={{
              display: 'flex',
              width: BAR_W,
              height: BAR_H,
              borderWidth: 2,
              borderStyle: 'solid',
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {currentFields.map((field, i) => {
              const w = currentWidths[i];
              return (
                <motion.div
                  key={`morph-${showMerkle ? 'm' : 't'}-${i}`}
                  layout
                  initial={false}
                  animate={{
                    width: w,
                    backgroundColor: field.color + '20',
                  }}
                  transition={EP_SPRINGS.merkleMorph}
                  style={{
                    height: BAR_H,
                    borderRight: i < currentFields.length - 1 ? `1px solid ${field.color}50` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={field.label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        fontSize: w < 60 ? 8 : 10,
                        color: field.color,
                        fontFamily: FONT_MONO,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {field.label}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {shimmer && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${EP_COLORS.highlight}15 50%, transparent 100%)`,
                animation: 'shimmerSweep 2s ease-in-out infinite',
              }} />
            )}
          </motion.div>

          {/* Byte count */}
          <div style={{
            position: 'absolute',
            right: -120,
            top: BAR_H / 2 - 10,
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 'bold',
            color: EP_COLORS.highlight,
          }}>
            = 64 bytes
          </div>

          {/* Phase labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingInline: 20,
          }}>
            <motion.span
              animate={{ opacity: morphPhase === 'tx2' || shimmer ? 1 : 0 }}
              style={{ fontSize: 14, color: EP_COLORS.actQuadratic }}
            >
              Transaction
            </motion.span>
            <motion.span
              animate={{ opacity: shimmer ? 1 : 0, scale: shimmer ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: EP_COLORS.highlight,
              }}
            >
              ≡
            </motion.span>
            <motion.span
              animate={{ opacity: morphPhase === 'merkle' || shimmer ? 1 : 0 }}
              style={{ fontSize: 14, color: EP_COLORS.actMerkle }}
            >
              Merkle Node
            </motion.span>
          </div>
        </div>
      )}

      {mode === 'spv' && renderSPV()}

      {mode === 'banned' && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {renderBar(TX_FIELDS, txWidths, 0, undefined, undefined, false, true)}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            style={{
              textAlign: 'center',
              marginTop: 30,
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: EP_COLORS.textMuted,
            }}
          >
            No valid use case for 64-byte transactions.
          </motion.div>
        </div>
      )}
    </div>
  );
}
