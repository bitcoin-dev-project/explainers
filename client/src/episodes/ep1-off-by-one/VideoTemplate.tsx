import { useVideoPlayer, useEpisodeAudioExport, DevControls, CE, morph } from '@/lib/video';
import { springs } from '@/lib/video/animations';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ── Episode-local springs (mathematical precision mood) ─────── */
const ep1Springs = {
  precise: { type: 'spring' as const, stiffness: 130, damping: 28 },
  reveal: { type: 'spring' as const, stiffness: 250, damping: 25 },
  dramatic: { type: 'spring' as const, stiffness: 350, damping: 18 },
};

/* ── Shorthand aliases ───────────────────────────────────────── */
const F = {
  display: 'var(--font-display)' as const,
  mono: 'var(--font-mono)' as const,
};
const C = {
  primary: 'var(--color-primary)',
  text: 'var(--color-text-primary)',
  muted: 'var(--color-text-muted)',
  secondary: 'var(--color-secondary)',
  bgMuted: 'var(--color-bg-muted)',
  bgDark: 'var(--color-bg-dark)',
  error: '#E74C3C',
};

/* ── Block component ─────────────────────────────────────────── */
function Block({
  label,
  variant = 'default',
  delay = 0,
  size = 'md',
}: {
  label: string;
  variant?: 'default' | 'highlight' | 'error' | 'muted';
  delay?: number;
  size?: 'sm' | 'md';
}) {
  const styles = {
    default: { bg: C.bgMuted, border: 'rgba(32,30,30,0.15)', color: C.text, op: 1 },
    highlight: { bg: 'rgba(235,82,52,0.15)', border: C.primary, color: C.primary, op: 1 },
    error: { bg: C.error, border: C.error, color: '#fff', op: 1 },
    muted: { bg: C.bgDark, border: 'rgba(32,30,30,0.1)', color: C.muted, op: 0.4 },
  };
  const s = styles[variant];
  const d = size === 'sm'
    ? { w: '3.2vw', h: '3.2vw', fs: '0.85vw' }
    : { w: '4.5vw', h: '4.5vw', fs: '1.1vw' };

  return (
    <motion.div
      style={{
        width: d.w, height: d.h, borderRadius: '0.4vw',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: d.fs, fontWeight: 700, fontFamily: F.mono,
        backgroundColor: s.bg, border: `0.15vw solid ${s.border}`,
        color: s.color, boxShadow: '0 0.15vw 0.5vw rgba(32,30,30,0.08)',
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: s.op, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
    >
      {label}
    </motion.div>
  );
}

/* ── Connector ───────────────────────────────────────────────── */
function Conn({ delay = 0, color, muted }: { delay?: number; color?: string; muted?: boolean }) {
  return (
    <motion.div
      style={{
        width: '1.5vw', height: '0.18vw', margin: '0 0.05vw',
        backgroundColor: color || C.muted,
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1, opacity: muted ? 0.35 : 1 }}
      transition={{ delay, duration: 0.25 }}
    />
  );
}

/* ── Interval marker (fencepost scene) ───────────────────────── */
function Interval({ delay, label }: { delay: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <motion.div
        style={{ width: '4vw', height: '0.22vw', backgroundColor: C.secondary }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay, duration: 0.3 }}
      />
      <motion.span
        style={{
          position: 'absolute', top: '1.2vh',
          fontSize: '0.9vw', fontWeight: 700, fontFamily: F.mono,
          color: C.secondary, width: '2vw', height: '2vw',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `0.12vw solid ${C.secondary}`, backgroundColor: 'rgba(57,107,235,0.08)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.15, ...springs.bouncy }}
      >
        {label}
      </motion.span>
    </div>
  );
}

/* ── Scene durations (from continuous voiceover — alignment-based timestamps) ── */
const SCENE_DURATIONS = {
  scene1: 7660,     // 0: @0.0s, audio 7.7s — Title
  scene2: 14710,    // 1: @7.7s, audio 14.7s — Epochs
  scene3: 12560,    // 2: @22.4s, audio 12.6s — Retarget period
  scene4: 12730,    // 3: @34.9s, audio 12.7s — Quiz
  scene5: 12220,    // 4: @47.7s, audio 12.2s — 14 days calc
  scene6: 6710,     // 5: @59.9s, audio 6.7s — "But is it really?"
  scene7: 12900,    // 6: @66.6s, audio 12.9s — Fencepost
  scene8: 9080,     // 7: @79.5s, audio 9.1s — Bitcoin asks
  scene9: 14140,    // 8: @88.6s, audio 14.1s — Correct measurement
  scene10: 20800,   // 9: @102.7s, audio 20.8s — The bug
  scene11: 16110,   // 10: @123.5s, audio 16.1s — Math
  scene12: 16770,   // 11: @139.6s, audio 16.8s — Days comparison
  scene13: 13530,   // 12: @156.4s, audio 13.5s — +0.05% bias (HIGHLIGHT)
  scene14: 13240,   // 13: @169.9s, audio 13.2s — Quiz reveal
  scene15: 9194,    // 14: @183.2s, audio 7.2s — CTA
};
// Total: 190.4s ≈ 3:10

/* ── Audio (one continuous file) ── */
const FULL_AUDIO = '/audio/ep1-off-by-one/full.mp3';
const SCENE_START_TIMES = [
  0.00, 7.66, 22.37, 34.93, 47.66, 59.88,
  66.59, 79.49, 88.57, 102.71, 123.51,
  139.62, 156.39, 169.92, 183.16,
];

/* ═════════════════════════════════════════════════════════════════
   VideoTemplate — single-canvas architecture
   ═════════════════════════════════════════════════════════════════ */
export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  useEpisodeAudioExport({
    kind: 'continuous',
    src: FULL_AUDIO,
    sceneStartTimes: SCENE_START_TIMES,
  });

  /* Quiz reveal state for scene 13 */
  const [quizRevealed, setQuizRevealed] = useState(false);
  useEffect(() => {
    if (s === 13) {
      const t = setTimeout(() => setQuizRevealed(true), 3000);
      return () => clearTimeout(t);
    }
    setQuizRevealed(false);
  }, [s]);

  /* ── Audio playback (one continuous file) ─────────────────────── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSceneRef = useRef(-1);

  // Play continuous audio — only seek on manual (non-sequential) navigation
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(FULL_AUDIO);
    }
    const audio = audioRef.current;
    const prev = prevSceneRef.current;

    // Sequential advance (auto or next-button): let audio continue naturally
    // Non-sequential jump (click on timeline, prev-button, loop): seek
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

  return (
    <motion.div
      data-video="ep1"
      className="w-full h-screen overflow-hidden relative"
      {...morph(s, {
        0: { backgroundColor: '#EB5234' },
        1: { backgroundColor: '#EFE9DE' },
        12: { backgroundColor: '#201E1E' },
        13: { backgroundColor: '#EFE9DE' },
        14: { backgroundColor: '#EB5234' },
      }, { duration: 0.6 })}
    >

      {/* ═══════════════════ SCENE 0: TITLE ════════════════════════ */}
      <CE s={s} enter={0} exit={1}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh]">
        <motion.span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.5vh 1.5vw', borderRadius: '2vw',
            backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: '1.1vw', fontWeight: 700, fontFamily: F.mono,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            border: '0.12vw solid rgba(255,255,255,0.4)',
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...springs.bouncy }}
        >
          Episode 1
        </motion.span>
        <motion.h1
          style={{
            fontSize: '7vw', fontWeight: 700, lineHeight: 1,
            textAlign: 'center', fontFamily: F.display, color: C.text,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, ...ep1Springs.reveal }}
        >
          Satoshi's<br />Off-By-One<br />Error
        </motion.h1>
      </CE>

      {/* ═══════════════════ SCENE 1: EPOCHS ═══════════════════════ */}
      {/* Voice: "Every 2016 blocks, Bitcoin recalculates..." (~0.4s)
               "If blocks came too fast, difficulty goes up" (~3.5s)
               "At each boundary, the network retargets" (~7s) */}
      <CE s={s} enter={1} exit={2}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        {/* "Every 2016 blocks" @ ~0s audio → 0.4s */}
        <motion.h2
          style={{
            fontSize: '3vw', fontWeight: 600, textAlign: 'center',
            lineHeight: 1.2, fontFamily: F.display, color: C.text,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Every <span style={{ color: C.primary }}>2016 blocks</span>,<br />
          Bitcoin adjusts difficulty
        </motion.h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginTop: '2vh' }}>
          {/* Epoch 1 — "recalculates its mining difficulty" @ ~2s audio → 2.4s */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
          >
            <motion.span
              style={{
                fontSize: '1vw', fontWeight: 700, letterSpacing: '0.1vw',
                textTransform: 'uppercase', padding: '0.3vh 1vw', borderRadius: '2vw',
                color: C.secondary, border: `0.15vw solid ${C.secondary}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
            >
              Epoch 1
            </motion.span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Block label="0" size="sm" delay={2.4} />
              <Conn delay={2.6} />
              <Block label="1" size="sm" delay={2.7} />
              <Conn delay={2.9} />
              <motion.span
                style={{ fontSize: '1.2vw', margin: '0 0.4vw', fontWeight: 700, color: C.muted }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.0 }}
              >···</motion.span>
              <Conn delay={3.1} />
              <Block label="2015" size="sm" delay={3.2} />
            </div>
          </motion.div>

          {/* Retarget boundary — "At each boundary, the network retargets" @ ~7s audio → 7.4s */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 5.0, ...springs.bouncy }}
          >
            <div
              style={{
                padding: '0.5vh 0.8vw', borderRadius: '0.3vw', fontSize: '0.9vw',
                fontWeight: 700, backgroundColor: C.primary, color: '#fff', fontFamily: F.mono,
              }}
            >
              Retarget
            </div>
            <svg width="0.8vw" height="2vh" viewBox="0 0 10 20">
              <path d="M5 0 L5 14 L2 11 M5 14 L8 11" stroke={C.primary} strokeWidth="2" fill="none" />
            </svg>
          </motion.div>

          {/* Epoch 2 — "difficulty goes up/down" @ ~4.5s audio → 4.9s */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }}
          >
            <motion.span
              style={{
                fontSize: '1vw', fontWeight: 700, letterSpacing: '0.1vw',
                textTransform: 'uppercase', padding: '0.3vh 1vw', borderRadius: '2vw',
                color: C.secondary, border: `0.15vw solid ${C.secondary}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.7 }}
            >
              Epoch 2
            </motion.span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Block label="2016" size="sm" variant="highlight" delay={5.9} />
              <Conn delay={6.1} />
              <Block label="2017" size="sm" delay={6.2} />
              <Conn delay={6.4} />
              <motion.span
                style={{ fontSize: '1.2vw', margin: '0 0.4vw', fontWeight: 700, color: C.muted }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.5 }}
              >···</motion.span>
              <Conn delay={6.6} />
              <Block label="4031" size="sm" delay={6.7} />
            </div>
          </motion.div>
        </div>

        {/* "the network retargets" @ ~8s audio → 8.4s */}
        <motion.p
          style={{ fontSize: '1.4vw', fontWeight: 600, textAlign: 'center', marginTop: '1vh', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 8.4 }}
        >
          At each boundary, Bitcoin recalculates difficulty
        </motion.p>
      </CE>

      {/* ═══════════════ SCENE 2: RETARGET PERIOD ══════════════════ */}
      <CE s={s} enter={2} exit={3}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          This cycle of 2016 blocks is called
        </motion.p>

        <motion.h2
          style={{ fontSize: '3.5vw', fontWeight: 600, textAlign: 'center', fontFamily: F.display, color: C.primary }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, ...springs.bouncy }}
        >
          A Retarget Period
        </motion.h2>

        {/* Block range visual */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '1vw', marginTop: '2vh' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
        >
          <motion.div
            style={{
              padding: '0.8vh 1.2vw', borderRadius: '0.3vw', fontSize: '1.2vw',
              fontWeight: 700, fontFamily: F.mono, backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
              boxShadow: '0 0.15vw 0.5vw rgba(32,30,30,0.08)',
            }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
          >
            Block 0
          </motion.div>
          <motion.div
            style={{ display: 'flex', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
          >
            <div style={{ width: '2vw', height: '0.25vw', backgroundColor: C.primary }} />
            <span style={{ fontSize: '1.2vw', margin: '0 0.5vw', fontWeight: 700, color: C.muted }}>···</span>
            <div style={{ width: '2vw', height: '0.25vw', backgroundColor: C.primary }} />
          </motion.div>
          <motion.div
            style={{
              padding: '0.8vh 1.2vw', borderRadius: '0.3vw', fontSize: '1.2vw',
              fontWeight: 700, fontFamily: F.mono, backgroundColor: 'rgba(235,82,52,0.15)',
              border: `0.15vw solid ${C.primary}`, color: C.primary,
              boxShadow: '0 0.15vw 0.5vw rgba(32,30,30,0.08)',
            }}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8 }}
          >
            Block 2015
          </motion.div>
        </motion.div>

        {/* Brace */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
        >
          <svg width="25vw" height="2.5vh" viewBox="0 0 250 25" fill="none" style={{ overflow: 'visible' }}>
            <motion.path
              d="M 10 5 Q 10 20, 125 20 Q 240 20, 240 5"
              stroke={C.primary} strokeWidth="2.5" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 3.6, duration: 0.5, ease: 'circOut' }}
            />
          </svg>
          <motion.span
            style={{ fontSize: '1.4vw', fontWeight: 700, marginTop: '0.5vh', fontFamily: F.mono, color: C.primary }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.2 }}
          >
            2016 blocks
          </motion.span>
        </motion.div>

        <motion.p
          style={{ fontSize: '1.3vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.0 }}
        >
          But how long should this take?
        </motion.p>
      </CE>

      {/* ════════════════════ SCENE 3: QUIZ ════════════════════════ */}
      <CE s={s} enter={3} exit={4}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Quick question...
        </motion.p>

        <motion.h2
          style={{ fontSize: '2.8vw', fontWeight: 600, textAlign: 'center', fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          How long does a retarget period take?
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh', width: '40vw', marginTop: '2vh' }}>
          {/* Option A */}
          <motion.div
            style={{
              borderRadius: '0.5vw', padding: '1.5vh 2vw', display: 'flex',
              alignItems: 'center', gap: '1vw', backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <div style={{
              width: '2.5vw', height: '2.5vw', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2vw',
              fontWeight: 700, border: '0.15vw solid rgba(32,30,30,0.2)', fontFamily: F.mono,
            }}>A</div>
            <span style={{ fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display }}>
              Exactly 2 weeks
            </span>
          </motion.div>

          {/* Option B */}
          <motion.div
            style={{
              borderRadius: '0.5vw', padding: '1.5vh 2vw', display: 'flex',
              alignItems: 'center', gap: '1vw', backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            <div style={{
              width: '2.5vw', height: '2.5vw', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2vw',
              fontWeight: 700, border: '0.15vw solid rgba(32,30,30,0.2)', fontFamily: F.mono,
            }}>B</div>
            <span style={{ fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display }}>
              2 weeks minus 10 minutes
            </span>
          </motion.div>
        </div>

        <motion.p
          style={{ fontSize: '1.6vw', fontStyle: 'italic', marginTop: '2vh', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
        >
          Let's find out...
        </motion.p>
      </CE>

      {/* ═══════════════ SCENE 4: 14 DAYS CALC ════════════════════ */}
      <CE s={s} enter={4} exit={5}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Each block takes about 10 minutes
        </motion.p>

        {/* Block chain with 10-min marker */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Block label="0" delay={0.6} />
          {/* 10 min measurement */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <motion.div
              style={{ width: '5vw', height: '0.3vw', margin: '0 0.1vw', backgroundColor: C.primary }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            />
            <motion.div
              style={{
                position: 'absolute', top: '-4.5vh', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.4 }}
            >
              <span style={{
                fontSize: '1.1vw', fontWeight: 700, whiteSpace: 'nowrap',
                padding: '0.2vh 0.6vw', borderRadius: '0.2vw',
                color: '#fff', backgroundColor: C.primary, fontFamily: F.mono,
              }}>10 min</span>
              <svg width="1vw" height="1vh" viewBox="0 0 10 8" style={{ overflow: 'visible' }}>
                <path d="M1 0 L5 7 L9 0" fill={C.primary} />
              </svg>
            </motion.div>
          </div>
          <Block label="1" delay={0.8} />
          <Conn delay={1.5} />
          <Block label="2" delay={1.6} />
          <Conn delay={1.8} />
          <motion.span
            style={{ fontSize: '1.8vw', margin: '0 0.6vw', fontWeight: 700, letterSpacing: '0.2vw', color: C.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
          >· · ·</motion.span>
          <Conn delay={2.2} />
          <Block label="2015" variant="highlight" delay={2.4} />
        </div>

        {/* Brace */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}
        >
          <svg width="42vw" height="3.5vh" viewBox="0 0 420 35" fill="none" style={{ overflow: 'visible' }}>
            <motion.path
              d="M 10 5 Q 10 25, 210 25 Q 410 25, 410 5"
              stroke={C.secondary} strokeWidth="2.5" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 3.3, duration: 0.6, ease: 'circOut' }}
            />
            <motion.line
              x1="210" y1="25" x2="210" y2="35"
              stroke={C.secondary} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 3.8, duration: 0.3 }}
            />
          </svg>
        </motion.div>

        <motion.div
          style={{ fontSize: '2.8vw', fontWeight: 600, fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.2, ...springs.bouncy }}
        >
          2016 × 10 min = <span style={{ color: C.secondary }}>14 Days</span>
        </motion.div>
      </CE>

      {/* ════════════ SCENE 5: "BUT IS IT REALLY?" ════════════════ */}
      <CE s={s} enter={5} exit={6}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.h2
          style={{ fontSize: '3.2vw', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          But is it <span style={{ color: C.error }}>really</span> 14 days?
        </motion.h2>

        <motion.p
          style={{ fontSize: '1.8vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          Let's look at how Bitcoin measures time...
        </motion.p>
      </CE>

      {/* ═══════════════ SCENE 6: FENCEPOST INSIGHT ═══════════════ */}
      {/* Voice: "Here's the key" (~0s) "Time is measured in the gaps" (~1s)
               "Five blocks, four gaps" (~4s) "Like fence posts" (~5.5s) */}
      <CE s={s} enter={6} exit={7}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        {/* "Time is measured in gaps between blocks" @ ~1s audio → 1.4s */}
        <motion.p
          style={{ fontSize: '1.8vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          Time is measured in gaps between blocks
        </motion.p>

        {/* Blocks build up as narrator describes — "not the blocks themselves" @ ~2.5s */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', marginTop: '2vh' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <Block label="B0" delay={1.8} />
          <Interval delay={2.3} label="1" />
          <Block label="B1" delay={2.6} />
          <Interval delay={3.1} label="2" />
          <Block label="B2" delay={3.4} />
          <Interval delay={3.9} label="3" />
          <Block label="B3" delay={4.2} />
          <Interval delay={4.7} label="4" />
          <Block label="B4" delay={5.0} />
        </motion.div>

        {/* "Five blocks, four gaps" @ ~4.5s audio → callout @ 6.5s */}
        <motion.div
          style={{ fontSize: '2.2vw', fontWeight: 600, marginTop: '4vh', fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6.5, ...ep1Springs.reveal }}
        >
          <span style={{ color: C.primary }}>5</span> blocks ={' '}
          <span style={{ color: C.secondary }}>4</span> intervals
        </motion.div>
      </CE>

      {/* ═══════════════ SCENE 7: BITCOIN ASKS ════════════════════ */}
      <CE s={s} enter={7} exit={8}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          To adjust difficulty, Bitcoin asks:
        </motion.p>

        <motion.h2
          style={{ fontSize: '2.8vw', fontWeight: 600, textAlign: 'center', fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          How long did the last epoch take?
        </motion.h2>

        {/* Two epochs — Epoch 1 faded, Epoch 2 prominent */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2vh' }}>
          <motion.div
            style={{ display: 'flex', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1.5 }}
          >
            <Block label="0" variant="muted" delay={1.6} />
            <Conn delay={1.8} muted />
            <motion.span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted }}>···</motion.span>
            <Conn delay={1.9} muted />
            <Block label="2015" variant="muted" delay={2.0} />
          </motion.div>

          <Conn delay={2.2} />

          <motion.div
            style={{ display: 'flex', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
          >
            <Block label="2016" variant="highlight" delay={2.5} />
            <Conn delay={2.7} />
            <motion.span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted }}>···</motion.span>
            <Conn delay={2.8} />
            <Block label="4031" variant="highlight" delay={2.9} />
          </motion.div>
        </div>

        <motion.p
          style={{ fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.8 }}
        >
          It compares two block timestamps to find out
        </motion.p>
      </CE>

      {/* ═══════════ SCENE 8: CORRECT MEASUREMENT ════════════════ */}
      <CE s={s} enter={8} exit={9}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          The correct measurement
        </motion.p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
          {/* Epoch 1 (muted) with START block */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            <motion.span
              style={{
                fontSize: '0.9vw', fontWeight: 700, letterSpacing: '0.08vw', textTransform: 'uppercase',
                padding: '0.2vh 0.8vw', borderRadius: '2vw',
                color: C.muted, border: `0.12vw solid ${C.muted}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.5 }}
            >Epoch 1</motion.span>
            <motion.div
              style={{
                display: 'flex', alignItems: 'center', padding: '1vh 1vw',
                borderRadius: '0.5vw', border: `0.15vw dashed ${C.muted}`, opacity: 0.5,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.6 }}
            >
              <Block label="0" variant="muted" delay={0.6} />
              <Conn delay={0.8} muted />
              <motion.span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted, opacity: 0.35 }}>···</motion.span>
              <Conn delay={0.9} muted />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <Block label="2015" variant="highlight" delay={1.0} />
                <motion.span
                  style={{
                    fontSize: '0.9vw', fontWeight: 700, padding: '0.2vh 0.5vw',
                    borderRadius: '0.2vw', backgroundColor: C.primary, color: '#fff', fontFamily: F.mono,
                  }}
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >START</motion.span>
              </div>
            </motion.div>
          </motion.div>

          {/* Arrow between */}
          <motion.div
            style={{ display: 'flex', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
          >
            <div style={{ width: '2vw', height: '0.3vw', backgroundColor: C.primary }} />
            <span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted }}>···</span>
            <div style={{ width: '2vw', height: '0.3vw', backgroundColor: C.primary }} />
          </motion.div>

          {/* Epoch 2 with END block */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          >
            <motion.span
              style={{
                fontSize: '0.9vw', fontWeight: 700, letterSpacing: '0.08vw', textTransform: 'uppercase',
                padding: '0.2vh 0.8vw', borderRadius: '2vw',
                color: C.primary, border: `0.12vw solid ${C.primary}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
            >Epoch 2</motion.span>
            <motion.div
              style={{
                display: 'flex', alignItems: 'center', padding: '1vh 1vw',
                borderRadius: '0.5vw', border: `0.15vw dashed ${C.primary}`,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
            >
              <Block label="2016" delay={2.0} />
              <Conn delay={2.2} />
              <motion.span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted }}>···</motion.span>
              <Conn delay={2.3} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <Block label="4031" variant="highlight" delay={2.2} />
                <motion.span
                  style={{
                    fontSize: '0.9vw', fontWeight: 700, padding: '0.2vh 0.5vw',
                    borderRadius: '0.2vw', backgroundColor: C.primary, color: '#fff', fontFamily: F.mono,
                  }}
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5 }}
                >END</motion.span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Calculation */}
        <motion.div
          style={{ fontSize: '1.8vw', fontWeight: 600, fontFamily: F.mono, color: C.text }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}
        >
          time(<span style={{ color: C.primary }}>4031</span>) − time(<span style={{ color: C.primary }}>2015</span>)
        </motion.div>

        <motion.div
          style={{ fontSize: '2.2vw', fontWeight: 600, fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.2, ...springs.snappy }}
        >
          = <span style={{ color: C.primary }}>2016</span> intervals ✓
        </motion.div>
      </CE>

      {/* ═══════════════ SCENE 9: THE BUG ═════════════════════════ */}
      {/* Voice: "But Satoshi's code does something different" (~0s)
               "It subtracts 2015 instead of 2016" (~3s)
               "starts measuring from block 2016, not 2015" (~6s)
               "The gap between the two epochs is never counted" (~10s)
               "One interval, lost. That's the off-by-one error." (~14s)
         Audio: 20.8s total */}
      <CE s={s} enter={9} exit={10}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5vh]">
        {/* "But Satoshi's code does something different" @ ~0s */}
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          But Satoshi's code does this
        </motion.p>

        {/* Code snippet — "It subtracts 2015" @ ~3s audio → 3.4s */}
        <motion.div
          style={{
            borderRadius: '0.5vw', padding: '1.8vh 2.5vw',
            backgroundColor: C.text, border: '0.15vw solid rgba(58,58,58,0.5)',
          }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div style={{ fontSize: '1.2vw', fontFamily: F.mono, color: '#F6F0E6' }}>
            <span style={{ color: '#6F7DC1' }}>int</span> nHeightFirst = pindexLast-&gt;nHeight −{' '}
            <motion.span
              style={{
                padding: '0.2vh 0.4vw', borderRadius: '0.2vw', fontWeight: 700,
              }}
              initial={{ backgroundColor: 'transparent', color: '#F6F0E6' }}
              animate={{ backgroundColor: C.error, color: '#fff' }}
              transition={{ delay: 3.4, duration: 0.6 }}
            >
              2015
            </motion.span>
            ;
          </div>
        </motion.div>

        {/* Block diagram — "starts measuring from block 2016" @ ~6s audio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
          {/* Epoch 1 — ghosted */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.0 }}
          >
            <motion.span
              style={{
                fontSize: '0.9vw', fontWeight: 700, letterSpacing: '0.08vw',
                textTransform: 'uppercase', padding: '0.2vh 0.8vw', borderRadius: '2vw',
                color: C.muted, border: `0.12vw solid ${C.muted}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 5.0 }}
            >Epoch 1</motion.span>
            <motion.div
              style={{
                display: 'flex', alignItems: 'center', padding: '0.8vh 0.8vw',
                borderRadius: '0.5vw', border: `0.15vw dashed ${C.muted}`,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 5.2 }}
            >
              <Block label="2015" variant="muted" delay={5.3} />
            </motion.div>
          </motion.div>

          <Conn delay={5.8} muted />

          {/* Epoch 2 — error highlighted — "from block 2016" @ ~7s */}
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.0 }}
          >
            <motion.span
              style={{
                fontSize: '0.9vw', fontWeight: 700, letterSpacing: '0.08vw',
                textTransform: 'uppercase', padding: '0.2vh 0.8vw', borderRadius: '2vw',
                color: C.error, border: `0.12vw solid ${C.error}`, fontFamily: F.mono,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.0 }}
            >Epoch 2</motion.span>
            <motion.div
              style={{
                display: 'flex', alignItems: 'center', padding: '0.8vh 0.8vw',
                borderRadius: '0.5vw', border: `0.15vw dashed ${C.error}`,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.2 }}
            >
              {/* START at 2016 (WRONG) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <motion.span
                  style={{
                    fontSize: '0.85vw', fontWeight: 700, padding: '0.2vh 0.5vw',
                    borderRadius: '0.2vw', backgroundColor: C.error, color: '#fff', fontFamily: F.mono,
                  }}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 7.0 }}
                >START</motion.span>
                <Block label="2016" variant="error" delay={6.4} />
              </div>

              <motion.div
                style={{ display: 'flex', alignItems: 'center', margin: '0 0.3vw' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 7.5 }}
              >
                <div style={{ width: '2vw', height: '0.3vw', backgroundColor: C.error }} />
                <span style={{ fontSize: '1vw', margin: '0 0.3vw', color: C.muted }}>···</span>
                <div style={{ width: '2vw', height: '0.3vw', backgroundColor: C.error }} />
              </motion.div>

              {/* END at 4031 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <motion.span
                  style={{
                    fontSize: '0.85vw', fontWeight: 700, padding: '0.2vh 0.5vw',
                    borderRadius: '0.2vw', backgroundColor: C.error, color: '#fff', fontFamily: F.mono,
                  }}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 8.5 }}
                >END</motion.span>
                <Block label="4031" variant="error" delay={8.0} />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* "The gap between the two epochs is never counted" @ ~10s audio */}
        <motion.div
          style={{ fontSize: '1.8vw', fontWeight: 600, fontFamily: F.mono, color: C.text }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 10.4 }}
        >
          time(<span style={{ color: C.error }}>4031</span>) − time(<span style={{ color: C.error }}>2016</span>)
        </motion.div>

        {/* "One interval, lost" @ ~14s audio → 14.4s */}
        <motion.div
          style={{ fontSize: '2vw', fontWeight: 600, fontFamily: F.display, color: C.error }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 12.0, ...springs.snappy }}
        >
          = Only 2015 intervals (one short!)
        </motion.div>

        {/* "That's the off-by-one error" @ ~16s audio → 16.4s */}
        <motion.p
          style={{ fontSize: '1.3vw', fontWeight: 600, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 14.5 }}
        >
          It skips Block 2015 → the gap between epochs is never measured
        </motion.p>
      </CE>

      {/* ═══════════════ SCENE 10: THE MATH ══════════════════════ */}
      <CE s={s} enter={10} exit={11}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Let's do the math
        </motion.p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3vh' }}>
          <motion.div
            style={{ fontSize: '2.2vw', fontWeight: 600, fontFamily: F.mono, color: C.text }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <span style={{ color: C.error }}>2015</span> × 10 min ={' '}
            <span style={{ color: C.error }}>20,150</span> min
          </motion.div>

          <motion.div
            style={{ fontSize: '2.2vw', fontWeight: 600, fontFamily: F.mono, color: C.muted }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >vs</motion.div>

          <motion.div
            style={{ fontSize: '2.2vw', fontWeight: 600, fontFamily: F.mono, color: C.text }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8, duration: 0.5 }}
          >
            <span style={{ color: C.secondary }}>2016</span> × 10 min ={' '}
            <span style={{ color: C.secondary }}>20,160</span> min
          </motion.div>
        </div>

        <motion.div
          style={{ fontSize: '2vw', fontWeight: 600, marginTop: '2vh', fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.0, ...springs.snappy }}
        >
          A difference of <span style={{ color: C.primary }}>10 minutes</span>
        </motion.div>
      </CE>

      {/* ═══════════ SCENE 11: DAYS COMPARISON CARDS ═════════════ */}
      <CE s={s} enter={11} exit={12}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Converting to days
        </motion.p>

        {/* Side-by-side cards */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '3vw' }}>
          {/* Measured card */}
          <motion.div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh',
              padding: '2.5vh 2.5vw', borderRadius: '0.5vw', backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
              boxShadow: '0 0.2vw 0.8vw rgba(32,30,30,0.08)',
            }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <span style={{ fontSize: '1.1vw', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1vw', color: C.muted }}>
              Measured
            </span>
            <span style={{ fontSize: '1.2vw', fontFamily: F.mono, color: C.muted }}>
              2015 × 10 min
            </span>
            <motion.span
              style={{ fontSize: '3.5vw', fontWeight: 700, lineHeight: 1, fontFamily: F.display, color: C.error }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, ...springs.snappy }}
            >
              13.993
            </motion.span>
            <span style={{ fontSize: '1.3vw', fontWeight: 600, color: C.text }}>days</span>
          </motion.div>

          {/* VS */}
          <motion.div
            style={{ display: 'flex', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
          >
            <span style={{ fontSize: '1.5vw', fontWeight: 600, color: C.muted }}>vs</span>
          </motion.div>

          {/* Expected card */}
          <motion.div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh',
              padding: '2.5vh 2.5vw', borderRadius: '0.5vw', backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
              boxShadow: '0 0.2vw 0.8vw rgba(32,30,30,0.08)',
            }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.5 }}
          >
            <span style={{ fontSize: '1.1vw', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1vw', color: C.muted }}>
              Expected
            </span>
            <span style={{ fontSize: '1.2vw', fontFamily: F.mono, color: C.muted }}>
              2016 × 10 min
            </span>
            <motion.span
              style={{ fontSize: '3.5vw', fontWeight: 700, lineHeight: 1, fontFamily: F.display, color: C.primary }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.0, ...springs.snappy }}
            >
              14.000
            </motion.span>
            <span style={{ fontSize: '1.3vw', fontWeight: 600, color: C.text }}>days</span>
          </motion.div>
        </div>

        {/* Difference callout */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', marginTop: '1vh' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.0, duration: 0.5 }}
        >
          <motion.div
            style={{
              padding: '1vh 2vw', borderRadius: '0.4vw', fontSize: '1.8vw', fontWeight: 600,
              backgroundColor: C.error, color: '#fff', fontFamily: F.display,
            }}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            transition={{ delay: 4.2, ...springs.bouncy }}
          >
            10 minutes short!
          </motion.div>

          <motion.p
            style={{ fontSize: '1.3vw', color: C.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.0 }}
          >
            Bitcoin thinks blocks came slightly too fast
          </motion.p>
        </motion.div>
      </CE>

      {/* ═══════ SCENE 12: HIGHLIGHT — +0.05% BIAS ═══════════════ */}
      {/* HIGHLIGHT SCENE — dark background for dramatic impact
          Voice: "Ten minutes out of twenty thousand one hundred sixty" (~0s)
                 "plus zero point zero five percent upward bias" (~3.5s)
                 "Every two weeks. Baked in since the genesis block." (~6s) */}
      <CE s={s} enter={12} exit={13}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        {/* "Ten minutes out of..." @ ~0s audio → 0.4s */}
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: 'rgba(246,240,230,0.5)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Every epoch loses 10 minutes
        </motion.p>

        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
        >
          {/* "10 min out of 20,160" @ ~1s audio → 1.4s */}
          <motion.div
            style={{ fontSize: '2vw', fontWeight: 600, fontFamily: F.mono, color: 'rgba(246,240,230,0.7)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <span style={{ color: C.error }}>10</span> min missing out of{' '}
            <span style={{ color: C.primary }}>20,160</span> min
          </motion.div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          style={{ fontSize: '2vw', color: 'rgba(246,240,230,0.3)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
        >↓</motion.div>

        {/* "plus zero point zero five percent" @ ~3.5s audio → 3.9s */}
        <motion.div
          style={{ fontSize: '8vw', fontWeight: 700, lineHeight: 1, color: C.error, fontFamily: F.display }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.9, ...ep1Springs.dramatic }}
        >
          +0.05%
        </motion.div>

        {/* "upward bias on difficulty" @ ~5s audio → 5.4s */}
        <motion.h2
          style={{ fontSize: '2.2vw', fontWeight: 600, fontFamily: F.display, color: '#F6F0E6' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5.4, ...ep1Springs.precise }}
        >
          Upward Difficulty Bias
        </motion.h2>

        {/* "Every two weeks. Baked in since the genesis block." @ ~6.5s audio → 6.9s */}
        <motion.p
          style={{ fontSize: '1.2vw', color: 'rgba(246,240,230,0.4)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.9 }}
        >
          Difficulty is pushed slightly higher every 2 weeks
        </motion.p>
      </CE>

      {/* ═══════════ SCENE 13: QUIZ ANSWER REVEAL ════════════════ */}
      <CE s={s} enter={13} exit={14}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <motion.p
          style={{ fontSize: '1.5vw', fontFamily: F.display, color: C.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Remember our question?
        </motion.p>

        <motion.h2
          style={{ fontSize: '2.8vw', fontWeight: 600, textAlign: 'center', fontFamily: F.display, color: C.text }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          How long is a retarget period?
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh', width: '40vw', marginTop: '2vh' }}>
          {/* Option A — dims after reveal */}
          <motion.div
            style={{
              borderRadius: '0.5vw', padding: '1.5vh 2vw', display: 'flex',
              alignItems: 'center', gap: '1vw', backgroundColor: C.bgMuted,
              border: '0.15vw solid rgba(32,30,30,0.15)',
              opacity: quizRevealed ? 0.4 : 1,
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: quizRevealed ? 0.4 : 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <div style={{
              width: '2.5vw', height: '2.5vw', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2vw',
              fontWeight: 700, border: '0.15vw solid rgba(32,30,30,0.2)', fontFamily: F.mono,
            }}>A</div>
            <span style={{ fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display }}>
              Exactly 2 weeks
            </span>
          </motion.div>

          {/* Option B — highlights after reveal */}
          <motion.div
            style={{
              borderRadius: '0.5vw', padding: '1.5vh 2vw', display: 'flex',
              alignItems: 'center', gap: '1vw', position: 'relative',
              backgroundColor: quizRevealed ? C.primary : C.bgMuted,
              border: quizRevealed
                ? `0.2vw solid ${C.text}`
                : '0.15vw solid rgba(32,30,30,0.15)',
              boxShadow: quizRevealed
                ? '0 0.3vw 1.2vw rgba(235,82,52,0.25)'
                : 'none',
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            <div style={{
              width: '2.5vw', height: '2.5vw', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2vw',
              fontWeight: 700, fontFamily: F.mono,
              border: `0.15vw solid ${quizRevealed ? C.text : 'rgba(32,30,30,0.2)'}`,
              backgroundColor: quizRevealed ? C.text : 'transparent',
              color: quizRevealed ? C.primary : C.text,
            }}>B</div>
            <span style={{ fontSize: '1.6vw', fontWeight: 600, fontFamily: F.display }}>
              2 weeks minus 10 minutes
            </span>

            {quizRevealed && (
              <motion.span
                style={{ position: 'absolute', right: '1.5vw', fontSize: '2vw', fontWeight: 700, color: C.text }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.bouncy}
              >✓</motion.span>
            )}
          </motion.div>
        </div>

        {quizRevealed && (
          <motion.p
            style={{ fontSize: '1.3vw', fontFamily: F.mono, color: C.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            2015 × 10 = 20,150 min = 13 days 23h 50m
          </motion.p>
        )}
      </CE>

      {/* ═══════════════════ SCENE 14: CTA ═════════════════════════ */}
      <CE s={s} enter={14}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        {/* Next post teaser */}
        <motion.p
          style={{ fontSize: '1.4vw', fontFamily: F.display, color: 'rgba(255,255,255,0.7)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Next post
        </motion.p>

        <motion.h2
          style={{
            fontSize: '2.5vw', fontWeight: 600, textAlign: 'center',
            lineHeight: 1.2, maxWidth: '50vw', fontFamily: F.display, color: '#fff',
          }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          How the Consensus Cleanup soft fork<br />
          fixes the TimeWarp Attack
        </motion.h2>

        {/* Divider */}
        <motion.div
          style={{ width: '8vw', height: '0.25vw', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.4)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 2.0, duration: 0.5 }}
        />

        {/* Follow CTA */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          <motion.div
            style={{
              padding: '1.5vh 2.5vw', borderRadius: '0.5vw', fontSize: '2vw', fontWeight: 600,
              backgroundColor: '#fff', color: C.primary, fontFamily: F.display,
              boxShadow: '0 0.3vw 1vw rgba(0,0,0,0.15)',
            }}
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            transition={{ delay: 2.8, ...springs.bouncy }}
          >
            Follow @bitcoin_devs
          </motion.div>

          <motion.p
            style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.6)', fontFamily: F.display }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
          >
            for more Bitcoin technical breakdowns
          </motion.p>
        </motion.div>
      </CE>

      <DevControls player={player} />
    </motion.div>
  );
}
