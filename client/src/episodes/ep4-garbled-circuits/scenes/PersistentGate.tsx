import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

/* ── Color constants ── */
const ALICE = '#F1760D';
const BOB   = '#264653';
const MUTED = '#595959';

/* ── Table row type ── */
interface TRow { a: string; b: string; out: string; highlight?: boolean; encrypted?: boolean; dimmed?: boolean }

/* ── Per-scene gate state ── */
interface GateCfg {
  dark: boolean;
  step: number | null;
  aliceLabel: string;
  bobLabel: string;
  table: TRow[] | null;
  shield: boolean;
  activeWire: 'alice' | 'bob' | 'both' | null;
  outputLabel: string;
}

/* Scene indices 6–15 */
const CONFIGS: Record<number, GateCfg> = {
  6:  { dark: true,  step: null, aliceLabel: '',            bobLabel: '',              table: null, shield: false, activeWire: null,    outputLabel: '?' },
  7:  { dark: true,  step: null, aliceLabel: '',            bobLabel: '',              table: null, shield: false, activeWire: 'both',  outputLabel: '?' },
  8:  { dark: false, step: 1,    aliceLabel: '0 / 1',       bobLabel: '0 / 1',         table: [
        { a: '0', b: '0', out: 'No' },
        { a: '0', b: '1', out: 'No' },
        { a: '1', b: '0', out: 'No' },
        { a: '1', b: '1', out: 'Yes', highlight: true },
      ], shield: false, activeWire: 'alice', outputLabel: '0 / 1' },
  9:  { dark: false, step: 2,    aliceLabel: 'Ka₀ / Ka₁',   bobLabel: 'Kb₀ / Kb₁',    table: null, shield: false, activeWire: 'alice', outputLabel: 'Enc(?)' },
  10: { dark: false, step: 2,    aliceLabel: 'Ka₀ / Ka₁',   bobLabel: 'Kb₀ / Kb₁',    table: [
        { a: 'Ka₀', b: 'Kb₀', out: 'Enc(0)', encrypted: true },
        { a: 'Ka₀', b: 'Kb₁', out: 'Enc(0)', encrypted: true },
        { a: 'Ka₁', b: 'Kb₀', out: 'Enc(0)', encrypted: true },
        { a: 'Ka₁', b: 'Kb₁', out: 'Enc(1)', encrypted: true, highlight: true },
      ], shield: false, activeWire: 'alice', outputLabel: 'Enc(?)' },
  11: { dark: false, step: 3,    aliceLabel: 'Ka₀ / Ka₁',   bobLabel: 'Kb₀ / Kb₁',    table: [
        { a: 'Ka₁', b: 'Kb₀', out: 'Enc(0)', encrypted: true },
        { a: 'Ka₁', b: 'Kb₁', out: 'Enc(1)', encrypted: true, highlight: true },
        { a: 'Ka₀', b: 'Kb₀', out: 'Enc(0)', encrypted: true },
        { a: 'Ka₀', b: 'Kb₁', out: 'Enc(0)', encrypted: true },
      ], shield: false, activeWire: 'alice', outputLabel: 'Enc(?)' },
  12: { dark: false, step: 4,    aliceLabel: 'Ka₀ / Ka₁',   bobLabel: 'Kb₀ / Kb₁  ??', table: [
        { a: 'Ka₁', b: 'Kb₀', out: 'Enc(0)', encrypted: true, dimmed: true },
        { a: 'Ka₁', b: 'Kb₁', out: 'Enc(1)', encrypted: true, dimmed: true },
        { a: 'Ka₀', b: 'Kb₀', out: 'Enc(0)', encrypted: true, dimmed: true },
        { a: 'Ka₀', b: 'Kb₁', out: 'Enc(0)', encrypted: true, dimmed: true },
      ], shield: false, activeWire: 'both', outputLabel: 'Enc(?)' },
  13: { dark: false, step: 5,    aliceLabel: 'Ka₁  ✓',       bobLabel: 'Kb₁  ✓',        table: [
        { a: 'Ka₁', b: 'Kb₀', out: 'Enc(0)', encrypted: true, dimmed: true },
        { a: 'Ka₁', b: 'Kb₁', out: 'Enc(1)', encrypted: true, dimmed: true },
        { a: 'Ka₀', b: 'Kb₀', out: 'Enc(0)', encrypted: true, dimmed: true },
        { a: 'Ka₀', b: 'Kb₁', out: 'Enc(0)', encrypted: true, dimmed: true },
      ], shield: false, activeWire: 'bob', outputLabel: '?' },
  14: { dark: false, step: 5,    aliceLabel: 'Ka₁  ✓',       bobLabel: 'Kb₁  ✓',        table: [
        { a: 'Ka₁', b: 'Kb₀', out: '🔒', encrypted: true, dimmed: true },
        { a: 'Ka₁', b: 'Kb₁', out: '1  ✓', highlight: true },
        { a: 'Ka₀', b: 'Kb₀', out: '🔒', encrypted: true, dimmed: true },
        { a: 'Ka₀', b: 'Kb₁', out: '🔒', encrypted: true, dimmed: true },
      ], shield: false, activeWire: 'bob', outputLabel: '1 ✓' },
  15: { dark: false, step: null, aliceLabel: '',              bobLabel: '',               table: null, shield: true, activeWire: null, outputLabel: '' },
};

function getFallback(): GateCfg {
  return { dark: false, step: null, aliceLabel: '', bobLabel: '', table: null, shield: false, activeWire: null, outputLabel: '' };
}

/* ── Lock icon (tiny) ── */
function Lock({ c }: { c: string }) {
  return (
    <svg width="0.7vw" height="0.85vw" viewBox="0 0 14 18" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="7" width="12" height="10" rx="2" fill={c} />
      <path d="M4,7 V5 A3,3 0 0,1 10,5 V7" stroke={c} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/* ── Glow filter for active wires ── */
function GlowFilter({ id, color }: { id: string; color: string }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
      <feFlood floodColor={color} floodOpacity="0.6" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/* ── Row with flash highlight on content change ── */
function GateRow({ row }: { row: TRow }) {
  const [flashKey, setFlashKey] = useState(0);
  const prevRef = useRef('');
  const contentId = `${row.a}|${row.b}|${row.out}|${row.dimmed ?? ''}|${row.highlight ?? ''}`;

  useEffect(() => {
    if (prevRef.current && prevRef.current !== contentId) {
      setFlashKey(k => k + 1);
    }
    prevRef.current = contentId;
  }, [contentId]);

  const accent = row.highlight ? ALICE : MUTED;

  return (
    <motion.div
      className="relative flex items-center gap-[0.35vw] px-[0.5vw] py-[0.3vh] rounded-[0.2vw] text-[0.75vw] font-bold overflow-hidden"
      style={{ fontFamily: 'var(--font-mono)', border: '1px solid' }}
      animate={{
        backgroundColor: row.highlight ? 'rgba(241,118,13,0.12)' : 'rgba(0,0,0,0.03)',
        borderColor: row.highlight ? 'rgba(241,118,13,0.4)' : 'transparent',
        opacity: row.dimmed ? 0.3 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      {flashKey > 0 && (
        <motion.div
          key={flashKey}
          className="absolute inset-0 rounded-[0.2vw] pointer-events-none z-10"
          initial={{ backgroundColor: 'rgba(241,118,13,0.4)' }}
          animate={{ backgroundColor: 'rgba(241,118,13,0)' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      <span style={{ color: ALICE, minWidth: '3.2vw', display: 'inline-block' }}>{row.a}</span>
      <span style={{ color: BOB,   minWidth: '3.2vw', display: 'inline-block' }}>{row.b}</span>
      <span style={{ color: MUTED }}>→</span>
      {row.encrypted && <Lock c={accent} />}
      <span style={{ color: accent }}>{row.out}</span>
    </motion.div>
  );
}

/* ── Component ── */
export function PersistentGate({ sceneIndex }: { sceneIndex: number }) {
  const cfg = CONFIGS[sceneIndex] ?? getFallback();

  const aliceActive = cfg.activeWire === 'alice' || cfg.activeWire === 'both';
  const bobActive   = cfg.activeWire === 'bob'   || cfg.activeWire === 'both';

  /* Theme-dependent colours */
  const panelBg   = cfg.dark ? '#1C1C1C' : '#ECD4B5';
  const border    = cfg.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const gateFill  = cfg.dark ? 'rgba(241,118,13,0.1)' : '#ECD4B5';
  const gateStk   = cfg.dark ? 'rgba(255,255,255,0.45)' : '#1C1C1C';
  const andTxt    = cfg.dark ? '#ffffff' : '#1C1C1C';
  /* Wires always visible; active = thicker + glow */
  const aliceWireWidth = aliceActive ? 5 : 4;
  const bobWireWidth   = bobActive   ? 5 : 4;
  /* Use visible wire colors on any background */
  const aliceWireColor = ALICE;
  const bobWireColor   = cfg.dark ? '#4A8A9E' : '#1A5A6E';

  return (
    <motion.div
      className="w-[30vw] h-full flex flex-col items-center justify-center gap-[1.5vh] shrink-0"
      animate={{ backgroundColor: panelBg, borderColor: border }}
      style={{ borderLeft: '1px solid' }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Gate SVG ── */}
      <svg viewBox="0 0 300 220" width="22vw" style={{ overflow: 'visible' }}>
        <defs>
          <GlowFilter id="glow-alice" color={ALICE} />
          <GlowFilter id="glow-bob" color={bobWireColor} />
        </defs>

        {/* ── Alice input ── */}
        <text x="8" y="55" fill={cfg.dark ? '#fff' : ALICE} fontSize="16" fontWeight="bold" fontFamily="var(--font-display)">Alice</text>
        <motion.line
          x1="10" y1="80" x2="100" y2="80"
          stroke={aliceWireColor}
          strokeLinecap="round"
          animate={{ strokeWidth: aliceWireWidth }}
          transition={{ duration: 0.3 }}
          filter={aliceActive ? 'url(#glow-alice)' : undefined}
        />

        {/* ── Bob input ── */}
        <text x="18" y="130" fill={cfg.dark ? '#fff' : BOB} fontSize="16" fontWeight="bold" fontFamily="var(--font-display)">Bob</text>
        <motion.line
          x1="10" y1="148" x2="100" y2="148"
          stroke={bobWireColor}
          strokeLinecap="round"
          animate={{ strokeWidth: bobWireWidth }}
          transition={{ duration: 0.3 }}
          filter={bobActive ? 'url(#glow-bob)' : undefined}
        />

        {/* ── Gate body ── */}
        <motion.path
          d="M100,25 L100,200 L170,200 A87.5,87.5 0 0,0 170,25 Z"
          strokeWidth="3"
          animate={{
            fill: gateFill,
            stroke: gateStk,
            filter: cfg.activeWire ? 'drop-shadow(0 0 8px rgba(241,118,13,0.12))' : 'none',
          }}
          transition={{ duration: 0.5 }}
        />
        <motion.text
          x="158" y="118" textAnchor="middle" fontSize="22" fontWeight="bold" fontFamily="var(--font-mono)"
          animate={{
            fill: andTxt,
            opacity: cfg.activeWire ? [1, 0.7, 1] : 1,
          }}
          transition={{
            fill: { duration: 0.5 },
            opacity: cfg.activeWire ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 },
          }}
        >AND</motion.text>

        {/* ── Output wire ── */}
        <line
          x1="257" y1="112" x2="295" y2="112"
          stroke={gateStk}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Output label (animated) */}
        <AnimatePresence mode="wait">
          {cfg.outputLabel ? (
            <motion.text
              key={cfg.outputLabel}
              x="276" y="98" fontSize="11" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle"
              fill={cfg.outputLabel.includes('✓') ? ALICE : (cfg.dark ? 'rgba(255,255,255,0.5)' : MUTED)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {cfg.outputLabel}
            </motion.text>
          ) : (
            <text
              key="out-default"
              x="268" y="98" fontSize="12" fontFamily="var(--font-display)" fontWeight="bold"
              fill={cfg.dark ? 'rgba(255,255,255,0.5)' : MUTED}
            >Out</text>
          )}
        </AnimatePresence>

        {/* ── Alice wire label (animated) ── */}
        <AnimatePresence mode="wait">
          {cfg.aliceLabel && (
            <motion.text
              key={cfg.aliceLabel}
              x="10" y="72" fontSize="11" fontWeight="bold" fontFamily="var(--font-mono)" fill={aliceWireColor}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {cfg.aliceLabel}
            </motion.text>
          )}
        </AnimatePresence>

        {/* ── Bob wire label (animated) ── */}
        <AnimatePresence mode="wait">
          {cfg.bobLabel && (
            <motion.text
              key={cfg.bobLabel}
              x="10" y="168" fontSize="11" fontWeight="bold" fontFamily="var(--font-mono)" fill={bobWireColor}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {cfg.bobLabel}
            </motion.text>
          )}
        </AnimatePresence>
      </svg>

      {/* ── Content below gate: truth table OR shield ── */}
      <div className="w-[24vw] min-h-[10vh] flex items-start justify-center">
        <AnimatePresence mode="wait">
          {cfg.table && (
            <motion.div
              key="table"
              className="flex flex-col gap-[0.35vh] w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {cfg.table.map((r, i) => (
                <GateRow key={i} row={r} />
              ))}
            </motion.div>
          )}

          {cfg.shield && (
            <motion.div
              key="shield"
              className="flex flex-col items-center gap-[0.5vh]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
            >
              <svg width="4vw" height="5vw" viewBox="0 0 60 75" fill="none">
                <path
                  d="M30,5 L52,18 L52,42 Q52,65 30,72 Q8,65 8,42 L8,18 Z"
                  fill="rgba(241,118,13,0.12)"
                  stroke={ALICE}
                  strokeWidth="2.5"
                />
                <path d="M20,38 L27,46 L42,28" stroke={ALICE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="text-[0.8vw] font-bold" style={{ color: ALICE, fontFamily: 'var(--font-mono)' }}>Private</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
