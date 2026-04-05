/**
 * EP6: The Duplicate Transaction Bug — "The Doppelgänger"
 *
 * How Bitcoin allowed two different coinbase transactions to have the same txid,
 * why BIP 30 and BIP 34 tried to fix it, and how BIP 54 finishes the job.
 *
 * Visual concept: Twin CoinbaseCards — bilateral mirror layout.
 * One solid (ice blue), one ghost (translucent crimson). When they overlap,
 * the UTXO set corrupts. When nLockTime makes them different, the mirror breaks.
 *
 * 19 scenes, ~156s without voiceover, ~230s with voiceover.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer, useEpisodeAudioExport, DevControls, CE, morph } from '@/lib/video';
import { CoinbaseCard } from './CoinbaseCard';
import type { CardFieldData } from './CoinbaseCard';
import { HashComputation } from './HashComputation';
import { CollisionEffect, getShakeStyle } from './CollisionEffect';
import { MirrorLine } from './MirrorLine';
import { UTXOEntry } from './UTXOEntry';
import { TimelineStrip } from './TimelineStrip';
import type { TimelineEvent } from './TimelineStrip';
import { C, EP, F } from './constants';

// ─── Audio ───────────────────────────────────────────────────────────
// Continuous voiceover. Run `node scripts/generate-voiceover-ep6.mjs`
// then replace these estimates with actual values from the script output.

const FULL_AUDIO = '/audio/ep6-duplicate-txid/full.mp3';

const SCENE_START_TIMES = [
  0.00, 7.34, 17.52, 33.12, 51.57, 68.53, 84.68, 97.95, 108.90, 132.39, 154.43, 175.32, 196.58, 207.10, 241.59, 252.46, 279.77, 293.15, 311.98,
];

const SCENE_DURATIONS: Record<string, number> = {
  scene1: 7340,    // 0: @0.0s, audio 7.3s
  scene2: 10180,   // 1: @7.3s, audio 10.2s
  scene3: 15600,   // 2: @17.5s, audio 15.6s
  scene4: 18450,   // 3: @33.1s, audio 18.4s
  scene5: 16960,   // 4: @51.6s, audio 17.0s
  scene6: 16150,   // 5: @68.5s, audio 16.1s
  scene7: 13270,   // 6: @84.7s, audio 13.3s
  scene8: 10950,   // 7: @98.0s, audio 10.9s
  scene9: 23490,   // 8: @108.9s, audio 23.5s
  scene10: 22040,  // 9: @132.4s, audio 22.0s
  scene11: 20890,  // 10: @154.4s, audio 20.9s
  scene12: 21260,  // 11: @175.3s, audio 21.3s
  scene13: 10520,  // 12: @196.6s, audio 10.5s
  scene14: 34490,  // 13: @207.1s, audio 34.5s
  scene15: 10870,  // 14: @241.6s, audio 10.9s
  scene16: 27310,  // 15: @252.5s, audio 27.3s
  scene17: 13380,  // 16: @279.8s, audio 13.4s
  scene18: 18830,  // 17: @293.1s, audio 18.8s
  scene19: 6833,   // 18: @312.0s, audio 4.8s
};

// ─── Real Transaction Data ───────────────────────────────────────────

const REAL_TXID = 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468';
const REAL_TXID_SHORT = 'e3bf3d07d4b0...';
const REAL_TXID2_SHORT = 'd5d27987d2a3...';
const ALT_TXID_SHORT = '7a4c1b92f803...';

// ─── Field Configurations ────────────────────────────────────────────

const FIELDS_BASIC: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)', highlight: true, highlightColor: C.primary, annotation: 'no input to reference' },
  { label: 'Output', value: '50 BTC \u2192 1A1zP1eP5QGefi2...' },
];

const FIELDS_FULL: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)' },
  { label: 'ScriptSig', value: '0456720E1B00', highlight: true, highlightColor: C.primary, annotation: 'miner picks this' },
  { label: 'Output', value: '50 BTC \u2192 1A1zP1eP5QGefi2...', annotation: 'miner picks this' },
  { label: 'nLockTime', value: '00000000', annotation: 'always zero' },
];

const FIELDS_BILATERAL: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)' },
  { label: 'ScriptSig', value: '0456720E1B00' },
  { label: 'Output', value: '50 BTC \u2192 1A1z...' },
  { label: 'nLockTime', value: '00000000' },
];

const FIELDS_BIP34: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)', dimmed: true },
  { label: 'ScriptSig', value: '03 7c7903...', highlight: true, highlightColor: C.fixGold, annotation: 'height = 227,836' },
  { label: 'Output', value: '50 BTC \u2192 1A1z...', dimmed: true },
  { label: 'nLockTime', value: '00000000', dimmed: true },
];

const FIELDS_BIP34_ALT: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)', dimmed: true },
  { label: 'ScriptSig', value: '03 7d7903...', highlight: true, highlightColor: C.iceBlue, annotation: 'height = 227,837' },
  { label: 'Output', value: '50 BTC \u2192 1A1z...', dimmed: true },
  { label: 'nLockTime', value: '00000000', dimmed: true },
];

const FIELDS_TIMEBOMB: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)', dimmed: true },
  { label: 'ScriptSig', value: '03 86501E...', highlight: true, highlightColor: C.fixGold, annotation: 'encodes height 1,983,702!' },
  { label: 'Output', value: '170 BTC \u2192 7 addresses', dimmed: true },
  { label: 'nLockTime', value: '00000000', dimmed: true },
];

const FIELDS_TIMEBOMB_CLONE: CardFieldData[] = [
  { label: 'Input', value: '0000...0000 (null)', dimmed: true },
  { label: 'ScriptSig', value: '03 86501E...', highlight: true, highlightColor: C.ghostCrimson },
  { label: 'Output', value: '170 BTC \u2192 7 addresses', dimmed: true },
  { label: 'nLockTime', value: '00000000', dimmed: true },
];

const FIELDS_BIP54: CardFieldData[] = [
  { label: 'Input', value: '0000...0000', dimmed: true },
  { label: 'ScriptSig', value: '03 7c7903...', dimmed: true },
  { label: 'Output', value: '50 BTC \u2192 ...', dimmed: true },
  { label: 'nLockTime', value: '0007A11F', highlight: true, highlightColor: C.fixGold, annotation: 'height \u2212 1' },
];

const FIELDS_HIGHLIGHT_OLD: CardFieldData[] = [
  { label: 'Input', value: '0000...0000', dimmed: true },
  { label: 'ScriptSig', value: '03 7c7903...', dimmed: true },
  { label: 'Output', value: '50 BTC \u2192 ...', dimmed: true },
  { label: 'nLockTime', value: '00000000', highlight: true, highlightColor: C.iceBlue },
];

const FIELDS_HIGHLIGHT_NEW: CardFieldData[] = [
  { label: 'Input', value: '0000...0000', dimmed: true },
  { label: 'ScriptSig', value: '03 7c7903...', dimmed: true },
  { label: 'Output', value: '50 BTC \u2192 ...', dimmed: true },
  { label: 'nLockTime', value: '0007A11F', highlight: true, highlightColor: C.fixGold },
];

// ─── Timeline Events ─────────────────────────────────────────────────

const TIMELINE_EVENTS: TimelineEvent[] = [
  { year: '2010', label: 'Bug found', color: C.ghostCrimson },
  { year: '2012', label: 'BIP 30', sublabel: 'band-aid', color: C.amber },
  { year: '2013', label: 'BIP 34', sublabel: '"the fix"', color: C.amber },
  { year: '2015', label: 'Checks removed', color: C.ghostCrimson },
  { year: '2018', label: 'Edge case found', color: C.ghostCrimson },
  { year: '2025', label: 'BIP 54', sublabel: 'real fix', color: C.fixGold, emphasized: true },
  { year: '2046', label: 'Defused', color: C.green },
];

// ─── Inline Helpers ──────────────────────────────────────────────────

function Heading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display,
      color: C.text, textAlign: 'center', maxWidth: '60vw', lineHeight: 1.3, ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.primary, delay = 0 }: { children: React.ReactNode; color?: string; delay?: number }) {
  return (
    <motion.span
      style={{
        display: 'inline-block', padding: '0.3vh 0.8vw', borderRadius: '0.3vw',
        backgroundColor: `${color}15`, border: `0.08vw solid ${color}40`,
        fontSize: '0.8vw', fontWeight: 700, fontFamily: F.display,
        color, textTransform: 'uppercase', letterSpacing: '0.06vw',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...EP.pop }}
    >
      {children}
    </motion.span>
  );
}

/** Simple tx card preview (scenes 1-3, before CoinbaseCard is introduced) */
function TxPreviewCard({ txid, delay = 0 }: { txid: string; delay?: number }) {
  return (
    <motion.div
      style={{
        padding: '2vh 2.5vw', borderRadius: '0.6vw',
        border: `0.1vw solid ${C.iceBlue}40`, backgroundColor: C.bgCard,
        boxShadow: `0 0.15vw 0.6vw rgba(0,0,0,0.06)`,
        display: 'flex', flexDirection: 'column', gap: '0.8vh', alignItems: 'center',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...EP.reveal }}
    >
      <span style={{ fontSize: '0.65vw', fontWeight: 700, fontFamily: F.display, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06vw' }}>
        Transaction
      </span>
      <span style={{ fontSize: '1vw', fontFamily: F.mono, color: C.text, fontWeight: 600 }}>
        {txid}
      </span>
      <motion.span
        style={{ fontSize: '0.6vw', fontFamily: F.body, color: C.iceBlue, fontWeight: 600 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.8 }}
      >
        txid
      </motion.span>
    </motion.div>
  );
}

/** Historical data row for Scene 9 */
function HistoryRow({ blocks, txid, loss, delay = 0 }: { blocks: string; txid: string; loss: string; delay?: number }) {
  return (
    <motion.div
      style={{
        display: 'flex', alignItems: 'center', gap: '1.5vw',
        padding: '1vh 1.5vw', borderRadius: '0.4vw',
        backgroundColor: `${C.ghostCrimsonFaint}`, border: `0.06vw solid ${C.ghostCrimson}20`,
      }}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...EP.reveal }}
    >
      <span style={{ fontSize: '0.8vw', fontFamily: F.mono, color: C.text, fontWeight: 600, minWidth: '18vw' }}>{blocks}</span>
      <span style={{ fontSize: '0.7vw', fontFamily: F.mono, color: C.textMuted }}>{txid}</span>
      <span style={{ fontSize: '0.85vw', fontFamily: F.mono, color: C.ghostCrimson, fontWeight: 700, marginLeft: 'auto' }}>{loss}</span>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════

export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  useEpisodeAudioExport({
    kind: 'continuous',
    src: FULL_AUDIO,
    sceneStartTimes: SCENE_START_TIMES,
  });

  // ── Audio playback (one continuous file) ─────────────────────────
  // Audio starts ~400ms after scene enters. Seeks on non-sequential nav.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSceneRef = useRef(-1);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(FULL_AUDIO);
    }
    const audio = audioRef.current;
    const prev = prevSceneRef.current;

    // Sequential advance: let audio continue naturally
    // Non-sequential jump (click, prev, loop): seek to scene start
    if (prev === -1 || s !== prev + 1) {
      audio.currentTime = SCENE_START_TIMES[s] ?? 0;
    }
    audio.play().catch(() => {});
    prevSceneRef.current = s;
  }, [s]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Collision state ──────────────────────────────────────────────
  const [collisionActive, setCollisionActive] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [utxoStatus, setUtxoStatus] = useState<'active' | 'overwritten' | 'gone'>('active');
  const collisionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear previous timers
    collisionTimers.current.forEach(clearTimeout);
    collisionTimers.current = [];

    if (s === 8) {
      // Scene 8 (Storyboard Scene 9): COLLISION
      setUtxoStatus('active');
      const t1 = setTimeout(() => { setCollisionActive(true); setShaking(true); }, 2200);
      const t2 = setTimeout(() => setCollisionActive(false), 2800);
      const t3 = setTimeout(() => setShaking(false), 2550);
      const t4 = setTimeout(() => setUtxoStatus('overwritten'), 2600);
      const t5 = setTimeout(() => setUtxoStatus('gone'), 3400);
      collisionTimers.current = [t1, t2, t3, t4, t5];
    } else {
      setCollisionActive(false);
      setShaking(false);
    }
  }, [s]);

  // ── Mirror line state ────────────────────────────────────────────
  const mirrorState = (() => {
    if (s >= 6 && s <= 7) return 'pulse' as const;
    if (s === 8) return 'pulse' as const;
    if (s === 14) return 'pulse' as const;
    if (s === 16) return 'shatter' as const;
    return 'hidden' as const;
  })();

  const mirrorColor = s === 14
    ? `${C.ghostCrimson}60`
    : s === 16
      ? `${C.fixGold}50`
      : 'rgba(255,255,255,0.4)';

  return (
    <motion.div
      data-video="ep6"
      className="w-full h-screen overflow-hidden relative"
      style={shaking ? getShakeStyle(true) : {}}
      {...morph(s, {
        0:  { backgroundColor: C.bgLight },
        16: { backgroundColor: '#F5EDD8' },  // warmer for highlight scene
        17: { backgroundColor: C.bgLight },
      }, { duration: 0.8 })}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 0 — Title                                           */}
      {/* Audio: "Bitcoin's identity crisis — a duplicate            */}
      {/*   transaction bug that took fifteen years to truly fix."   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={0} exit={1} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[1.5vh]">
        <motion.h1
          style={{ fontSize: '3.2vw', fontWeight: 700, fontFamily: F.display, color: C.text, textAlign: 'center' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...EP.reveal }}
        >
          Bitcoin&apos;s Identity Crisis
        </motion.h1>
        <motion.p
          style={{ fontSize: '1.2vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          The Duplicate Transaction Bug
        </motion.p>
        {/* Fleeting mirror line foreshadow */}
        <motion.div
          style={{
            position: 'absolute', left: '50%', top: '30%', bottom: '30%',
            width: '0.06vw', backgroundColor: C.iceBlue, transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0.25, 0], scaleY: [0, 1, 1] }}
          transition={{ delay: 1.5, duration: 1.5, times: [0, 0.3, 1] }}
        />
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 1 — Every transaction gets a unique ID               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={1} exit={2} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <Heading>Every Bitcoin transaction has a unique fingerprint</Heading>
      </CE>
      <CE s={s} enter={1} exit={2} delay={0.6}
        className="absolute top-[35vh] left-0 right-0 flex justify-center">
        <TxPreviewCard txid="a1b2c3d4 e5f67890 abcdef01 2345..." delay={0.6} />
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 2 — The txid is a hash of bytes                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={2} exit={4} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <Heading>The txid is a hash of the transaction&apos;s raw bytes</Heading>
      </CE>
      <CE s={s} enter={2} exit={4} delay={0.5}
        className="absolute top-[38vh] left-0 right-0 flex justify-center">
        <HashComputation
          bytes="01000000 01 7b1eab e3d8..."
          result="a1b2c3d4e5f6..."
          bytesLabel="Raw bytes"
          delay={0.5}
        />
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 3 — Same bytes = same hash = same txid              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={3} exit={4} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <Heading style={{ color: C.ghostCrimson }}>Same bytes &rarr; same hash &rarr; same txid</Heading>
      </CE>
      {/* Second hash computation (duplicate) */}
      <CE s={s} enter={3} exit={4} delay={0.5}
        className="absolute top-[55vh] left-0 right-0 flex justify-center">
        <HashComputation
          bytes="01000000 01 7b1eab e3d8..."
          result="a1b2c3d4e5f6..."
          bytesLabel="Same bytes"
          delay={0.5}
          accentColor={C.ghostCrimson}
        />
      </CE>
      {/* "But there's one exception..." */}
      <CE s={s} enter={3} exit={4} delay={2.5}
        className="absolute top-[76vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.9vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          Regular transactions can&apos;t collide &mdash; each references unique inputs.
        </motion.span>
      </CE>
      <CE s={s} enter={3} exit={4} delay={3.5}
        className="absolute top-[81vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '1.1vw', fontFamily: F.body, color: C.primary, fontWeight: 600 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          But there&apos;s one exception...
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 4 — Meet the coinbase transaction                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={4} exit={5} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex justify-center">
        <Heading>The first transaction in every block. Created by the miner.</Heading>
      </CE>
      <CE s={s} enter={4} exit={5} delay={0.5}
        className="absolute top-[25vh] left-0 right-0 flex justify-center">
        <CoinbaseCard
          blockNumber={91722}
          fields={FIELDS_BASIC}
          delay={0.5}
        />
      </CE>
      <CE s={s} enter={4} exit={5} delay={2.0}
        className="absolute top-[62vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.9vw', fontFamily: F.body, color: C.primary, fontWeight: 500 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 2.0 }}
        >
          No input to reference. Coins created from nothing.
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 5 — The miner controls every byte                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={5} exit={6} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex justify-center">
        <Heading>The miner controls every single field</Heading>
      </CE>
      <CE s={s} enter={5} exit={6} delay={0.5}
        className="absolute top-[22vh] left-0 right-0 flex justify-center">
        <CoinbaseCard
          blockNumber={91722}
          fields={FIELDS_FULL}
          delay={0.5}
        />
      </CE>
      {/* Chekhov's gun takeaway */}
      <CE s={s} enter={5} exit={6} delay={3.5}
        className="absolute top-[72vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '1.1vw', fontFamily: F.body, color: C.text, fontWeight: 500 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          Same miner. Same data. <span style={{ fontWeight: 700 }}>Same bytes.</span>
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 6 — The Doppelgänger appears [SIGNATURE]            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={6} exit={9} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex justify-center">
        <Heading>
          {s === 6 && 'What if the same miner builds the exact same coinbase?'}
          {s === 7 && (
            <span style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh', alignItems: 'center' }}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Identical bytes.
              </motion.span>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
                Identical hash.
              </motion.span>
              <motion.span
                style={{ color: C.ghostCrimson, fontWeight: 700 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
              >
                Identical txid.
              </motion.span>
            </span>
          )}
          {s === 8 && 'The UTXO set only has one slot per txid'}
        </Heading>
      </CE>

      {/* Left card — original (ice blue) */}
      <CE s={s} enter={6} exit={9} delay={0.5}
        className="absolute" style={{ top: '25vh', left: '5vw' }}>
        <motion.div
          {...morph(s, {
            6: { x: 0 },
            8: { x: '12vw' }, // slide toward center for collision
          })}
        >
          <CoinbaseCard
            variant="solid"
            blockNumber={91722}
            fields={FIELDS_BILATERAL}
            compact
            showTxid={s >= 7}
            txid={REAL_TXID_SHORT}
            delay={0.5}
          />
        </motion.div>
      </CE>

      {/* Right card — ghost (crimson doppelgänger) */}
      <CE s={s} enter={6} exit={9} delay={1.2}
        className="absolute" style={{ top: '25vh', right: '5vw' }}>
        <motion.div
          {...morph(s, {
            6: { x: 0, opacity: 0.6 },
            7: { x: 0, opacity: 1 },
            8: { x: '-12vw', opacity: 1 }, // slide toward center
          })}
        >
          <CoinbaseCard
            variant="ghost"
            blockNumber={91880}
            fields={FIELDS_BILATERAL}
            compact
            showTxid={s >= 7}
            txid={REAL_TXID_SHORT}
            delay={1.2}
          />
        </motion.div>
      </CE>

      {/* Hash computations below cards (scene 7) */}
      <CE s={s} enter={7} exit={9} delay={0.8}
        className="absolute top-[68vh] left-0 right-0 flex justify-center gap-[8vw]">
        <HashComputation bytes="01000000..." result={REAL_TXID_SHORT} compact delay={0.8} />
        <HashComputation bytes="01000000..." result={REAL_TXID_SHORT} compact delay={1.0} accentColor={C.ghostCrimson} />
      </CE>

      {/* UTXO Entry (scene 8 — collision target) */}
      <CE s={s} enter={8} exit={9} delay={0.3}
        className="absolute top-[70vh] left-0 right-0 flex justify-center">
        <UTXOEntry
          txid={REAL_TXID_SHORT}
          value="50 BTC"
          block={utxoStatus === 'overwritten' || utxoStatus === 'gone' ? '91,880' : '91,722'}
          status={utxoStatus}
          delay={0.3}
        />
      </CE>

      {/* −50 BTC counter (scene 8, after collision) */}
      <CE s={s} enter={8} exit={9} delay={3.8}
        className="absolute top-[82vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '1.8vw', fontWeight: 700, fontFamily: F.mono, color: C.ghostCrimson }}
          initial={{ opacity: 0, y: -20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 3.8, ...EP.heavy }}
        >
          &minus;50 BTC
        </motion.span>
      </CE>

      {/* "Gone forever" text */}
      <CE s={s} enter={8} exit={9} delay={5.0}
        className="absolute top-[88vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.85vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.0 }}
        >
          The original coins are gone. Forever.
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 9 — This actually happened                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={9} exit={10} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex flex-col items-center gap-[0.5vh]">
        <motion.span
          style={{ fontSize: '1.2vw', fontFamily: F.display, color: C.textMuted, fontWeight: 500 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          November 2010
        </motion.span>
        <motion.span
          style={{ fontSize: '1.8vw', fontFamily: F.display, color: C.text, fontWeight: 700 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          This happened. <span style={{ color: C.primary }}>Twice.</span>
        </motion.span>
      </CE>
      <CE s={s} enter={9} exit={10} delay={1.5}
        className="absolute top-[30vh] left-0 right-0 flex flex-col items-center gap-[1.5vh] px-[15vw]">
        <HistoryRow blocks="Block 91,722 \u2192 Block 91,880" txid={REAL_TXID_SHORT} loss="\u221250 BTC" delay={1.5} />
        <HistoryRow blocks="Block 91,812 \u2192 Block 91,842" txid={REAL_TXID2_SHORT} loss="\u221250 BTC" delay={2.3} />
        <motion.div
          style={{
            fontSize: '1.6vw', fontFamily: F.mono, fontWeight: 700, color: C.ghostCrimson,
            marginTop: '1vh', textAlign: 'center',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.0, ...EP.pop }}
        >
          Total: &minus;100 BTC
        </motion.div>
      </CE>
      <CE s={s} enter={9} exit={10} delay={4.0}
        className="absolute top-[72vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.9vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.0 }}
        >
          100 BTC erased from Bitcoin&apos;s supply. Permanently.
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 10 — Fix #1: BIP 30                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={10} exit={11} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex flex-col items-center gap-[1vh]">
        <Badge color={C.primary} delay={0.3}>Fix #1</Badge>
        <Heading>Check the database before writing</Heading>
      </CE>
      <CE s={s} enter={10} exit={11} delay={0.8}
        className="absolute top-[30vh] left-0 right-0 flex items-center justify-center gap-[3vw]">
        {/* Simplified guard concept */}
        <CoinbaseCard blockNumber="N" fields={[
          { label: 'ScriptSig', value: '...' },
          { label: 'Output', value: '50 BTC \u2192 ...' },
        ]} compact delay={0.8} />
        <motion.div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh',
            padding: '2vh 1.5vw', borderRadius: '0.5vw',
            border: `0.1vw solid ${C.primary}40`, backgroundColor: `${C.primary}08`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, ...EP.pop }}
        >
          <span style={{ fontSize: '2vw' }}>🔍</span>
          <span style={{ fontSize: '0.7vw', fontFamily: F.display, color: C.primary, fontWeight: 600 }}>
            BIP 30 Check
          </span>
          <motion.span
            style={{ fontSize: '1.2vw', color: C.green }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
          >
            ✓
          </motion.span>
        </motion.div>
        <UTXOEntry txid="..." value="50 BTC" block="N" status="active" delay={2.4} style={{ minWidth: '22vw' }} />
      </CE>
      {/* SLOW badge */}
      <CE s={s} enter={10} exit={11} delay={3.0}
        className="absolute top-[62vh] left-0 right-0 flex flex-col items-center gap-[0.8vh]">
        <Badge color={C.ghostCrimson} delay={3.0}>⏱ SLOW</Badge>
        <motion.span
          style={{ fontSize: '0.85vw', fontFamily: F.body, color: C.textMuted, textAlign: 'center', maxWidth: '40vw' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}
        >
          Must scan the entire UTXO set. Every block. Expensive.
        </motion.span>
      </CE>
      <CE s={s} enter={10} exit={11} delay={4.0}
        className="absolute top-[76vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.7vw', fontFamily: F.body, color: C.textMuted, fontStyle: 'italic' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 4.0 }}
        >
          BIP 30 &mdash; Pieter Wuille, 2012
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 11 — Fix #2: BIP 34                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={11} exit={12} delay={0.3}
        className="absolute top-[10vh] left-0 right-0 flex flex-col items-center gap-[1vh]">
        <Badge color={C.primary} delay={0.3}>Fix #2</Badge>
        <Heading>Force the block height into every coinbase</Heading>
      </CE>
      {/* Two mini cards showing different heights */}
      <CE s={s} enter={11} exit={12} delay={0.5}
        className="absolute top-[25vh] left-0 right-0 flex items-start justify-center gap-[4vw]">
        <CoinbaseCard
          blockNumber="227,836"
          fields={FIELDS_BIP34}
          compact
          delay={0.5}
        />
        <CoinbaseCard
          blockNumber="227,837"
          fields={FIELDS_BIP34_ALT}
          compact
          delay={0.8}
          accentColor={C.iceBlue}
        />
      </CE>
      {/* Explanation */}
      <CE s={s} enter={11} exit={12} delay={2.5}
        className="absolute top-[66vh] left-0 right-0 flex flex-col items-center gap-[0.6vh]">
        <motion.span
          style={{ fontSize: '1vw', fontFamily: F.body, color: C.text, fontWeight: 500 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
        >
          Different heights &rarr; different bytes &rarr; <span style={{ fontWeight: 700, color: C.green }}>different txids</span>
        </motion.span>
        <motion.span
          style={{ fontSize: '0.85vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
        >
          BIP 30 check? <span style={{ textDecoration: 'line-through' }}>No longer needed.</span>
        </motion.span>
      </CE>
      <CE s={s} enter={11} exit={12} delay={4.5}
        className="absolute top-[78vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.7vw', fontFamily: F.body, color: C.textMuted, fontStyle: 'italic' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 4.5 }}
        >
          BIP 34 &mdash; Gavin Andresen, 2013
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 12 — "Fixed." (False confidence)                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={12} exit={13} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[1.5vh]">
        {/* Big checkmark */}
        <motion.span
          style={{ fontSize: '5vw', color: C.green }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [1, 1, 0.6, 1], scale: [0, 1.2, 1, 1] }}
          transition={{
            delay: 0.3,
            duration: 3,
            times: [0, 0.15, 0.75, 0.78],
            type: 'spring', stiffness: 300, damping: 15,
          }}
        >
          ✓
        </motion.span>
        <motion.span
          style={{ fontSize: '2.5vw', fontWeight: 700, fontFamily: F.display, color: C.green }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          FIXED
        </motion.span>
        <motion.span
          style={{ fontSize: '0.85vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          2015 &mdash; BIP 30 checks removed from Bitcoin Core
        </motion.span>
        {/* "...or was it?" */}
        <motion.span
          style={{
            fontSize: '1.1vw', fontFamily: F.body, color: C.ghostCrimson,
            fontStyle: 'italic', marginTop: '3vh',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0, duration: 0.6 }}
        >
          ...or was it?
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 13 — The time bomb: Block 164,384                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={13} exit={14} delay={0.3}
        className="absolute top-[8vh] left-0 right-0 flex justify-center">
        <Heading>One block from 2012 hid a dangerous coincidence</Heading>
      </CE>
      <CE s={s} enter={13} exit={14} delay={0.6}
        className="absolute top-[20vh] left-0 right-0 flex justify-center">
        <CoinbaseCard
          variant="solid"
          accentColor={C.ghostCrimson}
          blockNumber="164,384"
          blockLabel="January 2012"
          fields={FIELDS_TIMEBOMB}
          delay={0.6}
        />
      </CE>
      {/* "Before BIP 34!" callout */}
      <CE s={s} enter={13} exit={14} delay={3.5}
        className="absolute top-[58vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.9vw', fontFamily: F.body, color: C.ghostCrimson, fontWeight: 600 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
        >
          Mined before BIP 34 was even proposed!
        </motion.span>
      </CE>
      {/* Countdown bar */}
      <CE s={s} enter={13} exit={15} delay={4.2}
        className="absolute top-[65vh] left-0 right-0 flex flex-col items-center gap-[0.8vh]">
        <motion.div
          style={{
            width: '40vw', height: '1.5vh', borderRadius: '0.3vw',
            backgroundColor: `${C.amber}15`, border: `0.06vw solid ${C.amber}30`,
            overflow: 'hidden',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2 }}
        >
          <motion.div
            style={{
              height: '100%', borderRadius: '0.3vw',
              background: `linear-gradient(90deg, ${C.amber}40, ${C.amber}80)`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: '80%' }}
            transition={{ delay: 4.5, duration: 1.5, ease: 'easeOut' }}
          />
        </motion.div>
        <motion.span
          style={{ fontSize: '0.8vw', fontFamily: F.mono, fontWeight: 600 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, color: [C.amber, C.ghostCrimson, C.amber] }}
          transition={{
            opacity: { delay: 4.8 },
            color: { delay: 5.0, duration: 2, repeat: Infinity },
          }}
        >
          Block 1,983,702 &rarr; ~January 2046
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 14 — The Doppelgänger returns [SIGNATURE]           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={14} exit={15} delay={0.3}
        className="absolute top-[8vh] left-0 right-0 flex justify-center">
        <Heading>At block 1,983,702 a miner could recreate the doppelg&auml;nger</Heading>
      </CE>
      {/* Left card — block 164,384 (2012) */}
      <CE s={s} enter={14} exit={15} delay={0.3}
        className="absolute" style={{ top: '22vh', left: '5vw' }}>
        <CoinbaseCard
          variant="solid"
          accentColor={C.ghostCrimson}
          blockNumber="164,384"
          blockLabel="January 2012"
          fields={FIELDS_TIMEBOMB}
          compact
          delay={0.3}
        />
      </CE>
      {/* Right card — block 1,983,702 (2046) — ghost doppelgänger */}
      <CE s={s} enter={14} exit={15} delay={1.2}
        className="absolute" style={{ top: '22vh', right: '5vw' }}>
        <CoinbaseCard
          variant="ghost"
          blockNumber="1,983,702"
          blockLabel="~January 2046"
          fields={FIELDS_TIMEBOMB_CLONE}
          compact
          showTxid
          txid="identical txid!"
          delay={1.2}
        />
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 15 — Fix #3: BIP 54 — Lock the nLockTime           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={15} exit={16} delay={0.3}
        className="absolute top-[8vh] left-0 right-0 flex flex-col items-center gap-[1vh]">
        <Badge color={C.fixGold} delay={0.3}>Fix #3</Badge>
        <Heading>Set nLockTime to the block height</Heading>
      </CE>
      <CE s={s} enter={15} exit={16} delay={0.8}
        className="absolute top-[22vh] left-0 right-0 flex justify-center">
        <CoinbaseCard
          blockNumber="500,000"
          fields={FIELDS_BIP54}
          delay={0.8}
        />
      </CE>
      {/* Before/After comparison */}
      <CE s={s} enter={15} exit={16} delay={3.3}
        className="absolute top-[60vh] left-0 right-0 flex flex-col items-center gap-[0.8vh]">
        <motion.div
          style={{ display: 'flex', gap: '3vw', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.3 }}
        >
          <span style={{ fontSize: '0.85vw', fontFamily: F.mono, color: C.iceBlue }}>Before: nLockTime = 0</span>
          <span style={{ fontSize: '0.85vw', fontFamily: F.mono, color: C.fixGold, fontWeight: 700 }}>After: nLockTime = height &minus; 1</span>
        </motion.div>
        <motion.span
          style={{ fontSize: '1.2vw', fontFamily: F.body, color: C.text, fontWeight: 600, marginTop: '1vh' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.2, ...EP.pop }}
        >
          They can <span style={{ color: C.fixGold, fontWeight: 700, fontSize: '1.4vw' }}>NEVER</span> be byte-identical.
        </motion.span>
      </CE>
      <CE s={s} enter={15} exit={16} delay={5.0}
        className="absolute top-[78vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '0.7vw', fontFamily: F.body, color: C.textMuted, fontStyle: 'italic' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 5.0 }}
        >
          BIP 54 &mdash; Antoine Poinsot, 2025
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 16 — The Mirror Breaks [HIGHLIGHT]                  */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* Left card — pre-BIP54 (old, ice blue nLockTime) */}
      <CE s={s} enter={16} exit={17} delay={0.3}
        className="absolute" style={{ top: '22vh', left: '5vw' }}>
        <CoinbaseCard
          variant="solid"
          blockNumber="500,000"
          blockLabel="pre-BIP 54"
          fields={FIELDS_HIGHLIGHT_OLD}
          compact
          showTxid
          txid={REAL_TXID_SHORT}
          delay={0.3}
        />
      </CE>
      {/* Right card — post-BIP54 (fix gold nLockTime) */}
      <CE s={s} enter={16} exit={17} delay={0.5}
        className="absolute" style={{ top: '22vh', right: '5vw' }}>
        <CoinbaseCard
          variant="solid"
          accentColor={C.fixGold}
          blockNumber="500,000"
          blockLabel="post-BIP 54"
          fields={FIELDS_HIGHLIGHT_NEW}
          compact
          showTxid
          txid={ALT_TXID_SHORT}
          delay={0.5}
        />
      </CE>

      {/* Hash computations below cards */}
      <CE s={s} enter={16} exit={17} delay={2.5}
        className="absolute top-[66vh] left-0 right-0 flex justify-center gap-[6vw]">
        <HashComputation bytes="...00000000" result={REAL_TXID_SHORT} compact delay={2.5} />
        <HashComputation bytes="...0007A11F" result={ALT_TXID_SHORT} compact delay={2.8} accentColor={C.fixGold} />
      </CE>

      {/* Heading — the payoff line */}
      <CE s={s} enter={16} exit={17} delay={4.5}
        className="absolute top-[82vh] left-0 right-0 flex justify-center">
        <motion.div style={{
          fontSize: '1.4vw', fontFamily: F.display, fontWeight: 600, color: C.text, textAlign: 'center',
        }}>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5 }}>
            A dormant field.{' '}
          </motion.span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.0 }}>
            15 years unused.{' '}
          </motion.span>
          <motion.span
            style={{ color: C.fixGold, fontWeight: 700 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }}
          >
            The answer was there all along.
          </motion.span>
        </motion.div>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 17 — 15-year timeline                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={17} exit={18} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <Heading>One bug. Three fixes. Fifteen years.</Heading>
      </CE>
      <CE s={s} enter={17} exit={18} delay={0.5}
        className="absolute top-[35vh] left-0 right-0 flex justify-center">
        <TimelineStrip events={TIMELINE_EVENTS} delay={0.5} />
      </CE>
      <CE s={s} enter={17} exit={18} delay={4.5}
        className="absolute top-[72vh] left-0 right-0 flex justify-center">
        <motion.span
          style={{ fontSize: '1vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5 }}
        >
          Part of the <span style={{ fontWeight: 600, color: C.text }}>Great Consensus Cleanup</span> (BIP 54)
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCENE 18 — CTA                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CE s={s} enter={18} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh]">
        <motion.span
          style={{ fontSize: '2vw', fontWeight: 700, fontFamily: F.display, color: C.primary }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...EP.reveal }}
        >
          Follow @bitcoin_devs
        </motion.span>
        <motion.span
          style={{ fontSize: '1vw', fontFamily: F.body, color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          Next in the series: The Timewarp Attack
        </motion.span>
      </CE>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* OVERLAYS — MirrorLine + CollisionEffect                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <MirrorLine
        state={mirrorState}
        color={mirrorColor}
        delay={s === 6 ? 0.8 : s === 14 ? 0.5 : s === 16 ? 3.8 : 0}
        height={s === 16 ? '50vh' : '45vh'}
      />
      <CollisionEffect active={collisionActive} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DEV CONTROLS                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <DevControls player={player} />
    </motion.div>
  );
}
