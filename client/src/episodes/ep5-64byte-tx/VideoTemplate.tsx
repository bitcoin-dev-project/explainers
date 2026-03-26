/**
 * Episode 4 — The 64-Byte Transaction Bug (v4 — two-tx attack + TXID grinding)
 *
 * Changes from v3:
 *   - NEW scene 7: "The Two Transactions" — real 64B tx + fake payment tx setup
 *   - NEW scene 8: "TXID Collision / Grinding" — grinding attempts table
 *   - All subsequent scenes shifted +2
 *   - REWRITE scene 12: SPV Fooled + stolen PoW + concrete 5 BTC
 *   - REWRITE scene 13: Feasibility — field-by-field last-32-bytes breakdown
 *   - 16 scenes, ~139s total (was 14 scenes, 115s)
 *
 * LAYOUT ZONES:
 *   top-[12vh]      → Heading
 *   top-[22vh]      → Tree SVG (fills to ~52vh)
 *   top-[62vh]      → Content (ByteBars, cards)
 *
 * Tree visible: scenes 1-10 (enter={1} exit={11}), fades out during scenes 7-8
 * Dark bg: scenes 10-12
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer, DevControls, CE } from '@/lib/video';
import { springs } from '@/lib/video/animations';
import { Badge, HighlightBox, Arrow } from '@/lib/video/diagrams';

// ─── Springs ─────────────────────────────────────────────────────
const dangerSpring = { type: 'spring' as const, stiffness: 500, damping: 20 };
const preciseSpring = { type: 'spring' as const, stiffness: 150, damping: 28 };

// ─── Colors ──────────────────────────────────────────────────────
const C = {
  danger: '#EB5234',      // BDP Orange (primary) — used for attacks/danger
  dangerDark: '#C0392B',
  fix: '#0E9158',          // BDP Green
  nodeA: '#396BEB',        // BDP Blue
  nodeB: '#7762B9',        // BDP Purple
  proofOrange: '#EB9B34',  // BDP Yellow — proof highlights
  darkBg: '#1A0F0A',
  fixBg: '#8CB4A3',        // BDP Light Green
  collision: '#EB5234',    // BDP Orange
  freeChoice: '#0E9158',   // BDP Green
  manipulable: '#EB9B34',  // BDP Yellow
};

// ─── Durations (from continuous voiceover — alignment-based timestamps) ──
// Single ElevenLabs generation → natural pauses between scenes, no hard stops.
const SCENE_DURATIONS = {
  scene1: 9240,    // 0: @0.0s, audio 9.2s
  scene2: 12520,   // 1: @9.2s, audio 12.5s
  scene3: 11210,   // 2: @21.8s, audio 11.2s
  scene4: 14760,   // 3: @33.0s, audio 14.8s
  scene5: 17550,   // 4: @47.7s, audio 17.6s
  scene6: 15900,   // 5: @65.3s, audio 15.9s
  scene7: 15980,   // 6: @81.2s, audio 16.0s
  scene8: 31520,   // 7: @97.2s, audio 31.5s
  scene9: 24430,   // 8: @128.7s, audio 24.4s
  scene10: 13360,  // 9: @153.1s, audio 13.4s
  scene11: 27780,  // 10: @166.5s, audio 27.8s
  scene12: 20170,  // 11: @194.3s, audio 20.2s
  scene13: 27410,  // 12: @214.4s, audio 27.4s
  scene14: 31010,  // 13: @241.8s, audio 31.0s
  scene15: 10340,  // 14: @272.8s, audio 10.3s
  scene16: 6980,   // 15: @283.2s, audio 5.0s
};
// Total: 288.2s ≈ 4:48 (1.2x FFmpeg speedup)

// ─── Audio (one continuous file — 1.2x atempo) ──
const FULL_AUDIO = '/audio/ep5-64byte-tx/full.mp3';
const SCENE_START_TIMES = [
  0.00, 9.24, 21.76, 32.97, 47.73, 65.28, 81.18, 97.16,
  128.68, 153.11, 166.47, 194.25, 214.42, 241.83, 272.84, 283.18,
];

// ─── Tree layout (center-based coordinates) ──────────────────────
// All x,y = CENTER of the node. This is the single source of truth.
const NW = 90;   // node width
const NH = 36;   // node height

const T = {
  // Leaves (bottom row)
  tx1:  { x: 120, y: 200 },
  tx2:  { x: 280, y: 200 },
  tx3:  { x: 440, y: 200 },
  tx4:  { x: 600, y: 200 },
  // Inner nodes (middle row)
  h12:  { x: 200, y: 110 },
  h34:  { x: 520, y: 110 },
  // Root (top)
  root: { x: 360, y: 24 },
};

// Edges: [parentKey, childKey]
const EDGES: [keyof typeof T, keyof typeof T][] = [
  ['h12', 'tx1'], ['h12', 'tx2'],
  ['h34', 'tx3'], ['h34', 'tx4'],
  ['root', 'h12'], ['root', 'h34'],
];

// ─── Inline SVG helpers ──────────────────────────────────────────

/** A single tree node: rect + text, fully animatable */
function TNode({ x, y, label, delay = 0, fill, stroke, text, w = NW, h = NH, strokeDash, strokeWidth = 1.5, fontSize: fs = 14 }: {
  x: number; y: number; label: string; delay?: number;
  fill: string; stroke: string; text: string;
  w?: number; h?: number; strokeDash?: string; strokeWidth?: number; fontSize?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <motion.rect
        x={x - w / 2} y={y - h / 2} width={w} height={h} rx={5}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        animate={{ fill, stroke }}
        transition={{ duration: 0.4 }}
      />
      <motion.text
        x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={fs} fontFamily="var(--font-mono)" fontWeight={600}
        animate={{ fill: text }}
        transition={{ duration: 0.4 }}
      >{label}</motion.text>
    </motion.g>
  );
}

/** A straight edge from parent bottom-center to child top-center */
function TEdge({ parent, child, delay = 0, color, width = 1.5, nh = NH }: {
  parent: { x: number; y: number }; child: { x: number; y: number };
  delay?: number; color: string; width?: number; nh?: number;
}) {
  return (
    <motion.line
      x1={parent.x} y1={parent.y + nh / 2}
      x2={child.x} y2={child.y - nh / 2}
      stroke={color} strokeWidth={width} strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: 'circOut' }}
    />
  );
}

/** Proof path: thicker colored lines along existing edge routes */
function ProofPath({ path, delay = 0, color = C.proofOrange, dashed = false }: {
  path: (keyof typeof T)[]; delay?: number; color?: string; dashed?: boolean;
}) {
  return (
    <g>
      {path.map((key, i) => {
        if (i === 0) return null;
        const parent = T[path[i]];
        const child = T[path[i - 1]];
        return (
          <motion.line key={i}
            x1={parent.x} y1={parent.y + NH / 2}
            x2={child.x} y2={child.y - NH / 2}
            stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={dashed ? '8 4' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ delay: delay + (i - 1) * 0.3, duration: 0.5, ease: 'easeOut' }}
          />
        );
      })}
    </g>
  );
}

// ─── ByteBar ─────────────────────────────────────────────────────

interface ByteSegment { label: string; bytes: number; color: string }

function ByteBar({
  segments, delay = 0, label, width = '50vw', dark = false, segmentOpacity,
}: {
  segments: ByteSegment[]; delay?: number; label?: string; width?: string; dark?: boolean;
  segmentOpacity?: number[];
}) {
  const total = segments.reduce((s, seg) => s + seg.bytes, 0);
  const txt = dark ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)';
  const bdr = dark ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,28,0.12)';

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh', alignItems: 'center' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...preciseSpring }}
    >
      {label && (
        <motion.span
          style={{ fontSize: '1vw', fontWeight: 600, color: txt, fontFamily: 'var(--font-mono)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >{label}</motion.span>
      )}
      <div style={{
        display: 'flex', height: '4.2vh', borderRadius: '0.4vw', overflow: 'hidden',
        border: `0.12vw solid ${bdr}`, width,
      }}>
        {segments.map((seg, i) => {
          const op = segmentOpacity?.[i] ?? 1;
          return (
          <motion.div key={i} style={{
            flex: seg.bytes / total, backgroundColor: `${seg.color}20`,
            borderLeft: i > 0 ? `0.12vw solid ${bdr}` : undefined,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '0.2vh 0.2vw',
          }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: op }}
            transition={{
              scaleX: { delay: delay + 0.3 + i * 0.08, duration: 0.35, ease: 'circOut' },
              opacity: { duration: 0.6, ease: 'easeInOut' },
            }}
          >
            <span style={{
              fontSize: seg.bytes < 5 ? '0.6vw' : '0.8vw', fontWeight: 600,
              color: seg.color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
            }}>{seg.label}</span>
            <span style={{
              fontSize: '0.55vw', color: seg.color, fontFamily: 'var(--font-mono)', opacity: 0.7,
            }}>{seg.bytes}B</span>
          </motion.div>
          );
        })}
      </div>
      <motion.div style={{
        display: 'flex', justifyContent: 'space-between', width,
        fontSize: '0.65vw', fontFamily: 'var(--font-mono)', color: txt,
      }}
        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
        transition={{ delay: delay + 0.7 }}
      >
        <span>0</span><span>32</span><span>{total} bytes</span>
      </motion.div>
    </motion.div>
  );
}

// ─── SplittingNode ───────────────────────────────────────────────
// The node "cracks open" into two fake children below it

function SplittingNode({ x, y, active, delay = 0 }: {
  x: number; y: number; active: boolean; delay?: number;
}) {
  const fakeY = y + 80;
  const spread = 75;
  return (
    <AnimatePresence>
      {active && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Left dashed connector — first 32B = some hash */}
          <motion.line
            x1={x} y1={y + NH / 2} x2={x - spread} y2={fakeY - NH / 2}
            stroke={C.danger} strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: delay + 0.3, duration: 0.5 }}
          />
          <motion.rect
            x={x - spread - 38} y={fakeY - NH / 2} width={76} height={NH} rx={5}
            fill={`${C.danger}20`} stroke={C.danger} strokeWidth={2} strokeDasharray="4 2"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.7, ...dangerSpring }}
            style={{ transformOrigin: `${x - spread}px ${fakeY}px` }}
          />
          <motion.text
            x={x - spread} y={fakeY + 1} textAnchor="middle" dominantBaseline="middle"
            fill={C.danger} fontSize={11} fontFamily="var(--font-mono)" fontWeight={700}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.9 }}
          >H(?)</motion.text>

          {/* Right dashed connector — last 32B = fake tx TXID */}
          <motion.line
            x1={x} y1={y + NH / 2} x2={x + spread} y2={fakeY - NH / 2}
            stroke={C.danger} strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: delay + 0.5, duration: 0.5 }}
          />
          <motion.rect
            x={x + spread - 38} y={fakeY - NH / 2} width={76} height={NH} rx={5}
            fill={`${C.danger}20`} stroke={C.danger} strokeWidth={2} strokeDasharray="4 2"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 1.0, ...dangerSpring }}
            style={{ transformOrigin: `${x + spread}px ${fakeY}px` }}
          />
          <motion.text
            x={x + spread} y={fakeY + 1} textAnchor="middle" dominantBaseline="middle"
            fill={C.danger} fontSize={11} fontFamily="var(--font-mono)" fontWeight={700}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: delay + 1.2 }}
          >FAKE</motion.text>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

// ─── TwoViewTrees ────────────────────────────────────────────────
// Side-by-side mini Merkle trees: "Reality" vs "Alice's Lie"

function TwoViewTrees({ delay = 0 }: { delay?: number }) {
  const mNW = 68;  // mini node width
  const mNH = 24;  // mini node height
  const mFS = 11;  // mini font size

  // Dark-mode node styles
  const dNode = { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.8)' };
  const aNode = { fill: 'rgba(119,98,185,0.08)', stroke: '#7762B9', text: '#7762B9' };
  const pNode = { fill: 'rgba(235,82,52,0.1)', stroke: '#EB5234', text: '#EB5234' };

  // Left tree coordinates ("Reality") — standard 3-level Merkle tree
  const L = {
    root: { x: 140, y: 22 },
    h12:  { x: 72,  y: 80 },
    h34:  { x: 208, y: 80 },
    tx1:  { x: 38,  y: 140 },
    tx2:  { x: 106, y: 140 },
    tx64: { x: 174, y: 140 },
    tx4:  { x: 242, y: 140 },
  };

  // Right tree coordinates ("Alice's Lie") — 4-level with fake children
  const R = {
    root:  { x: 140, y: 22 },
    h12:   { x: 72,  y: 72 },
    h34:   { x: 208, y: 72 },
    tx1:   { x: 38,  y: 124 },
    tx2:   { x: 106, y: 124 },
    tx64:  { x: 174, y: 124 },
    tx4:   { x: 242, y: 124 },
    fake1: { x: 148, y: 182 },
    fake2: { x: 200, y: 182 },
  };

  const edgeC = 'rgba(255,255,255,0.15)';

  return (
    <motion.div
      style={{ display: 'flex', gap: '3vw', alignItems: 'flex-start', justifyContent: 'center' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {/* Left: Reality — builds from ~1s */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.3, ...preciseSpring }}
      >
        <motion.span style={{
          fontSize: '1vw', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5 }}
        >Reality</motion.span>
        <svg width="28vw" height="22vh" viewBox="0 0 280 170" fill="none" style={{ overflow: 'visible' }}>
          {/* Edges */}
          <TEdge parent={L.root} child={L.h12}  delay={delay + 1.0} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={L.root} child={L.h34}  delay={delay + 1.1} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={L.h12}  child={L.tx1}  delay={delay + 1.2} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={L.h12}  child={L.tx2}  delay={delay + 1.3} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={L.h34}  child={L.tx64} delay={delay + 1.4} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={L.h34}  child={L.tx4}  delay={delay + 1.5} color={edgeC} width={1} nh={mNH} />
          {/* Nodes */}
          <TNode {...L.tx1}  label="Tx₁"    delay={delay + 1.0} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...L.tx2}  label="Tx₂"    delay={delay + 1.1} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...L.tx64} label="Tx₆₄"   delay={delay + 1.2} {...pNode} w={mNW} h={mNH} fontSize={mFS} strokeWidth={2} />
          <TNode {...L.tx4}  label="Tx₄"    delay={delay + 1.3} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...L.h12}  label="H(1,2)" delay={delay + 1.8} {...aNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...L.h34}  label="H(3,4)" delay={delay + 1.9} {...aNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...L.root} label="Root"    delay={delay + 2.2} {...pNode} w={mNW} h={mNH} fontSize={mFS} />
        </svg>
      </motion.div>

      {/* Center: "same root hash" @ 16.7s */}
      <motion.div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.3vh', paddingTop: '6vh',
      }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 16.7, ...dangerSpring }}
      >
        <span style={{ fontSize: '1.1vw', fontWeight: 700, color: C.danger, fontFamily: 'var(--font-mono)' }}>same</span>
        <span style={{ fontSize: '1.1vw', fontWeight: 700, color: C.danger, fontFamily: 'var(--font-mono)' }}>root</span>
      </motion.div>

      {/* Right: Alice's Lie — "Alice can construct" @ 7.5s */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 7.5, ...preciseSpring }}
      >
        <motion.span style={{
          fontSize: '1vw', fontWeight: 600, color: C.danger,
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 7.8 }}
        >Alice's Lie</motion.span>
        <svg width="28vw" height="28vh" viewBox="0 0 280 210" fill="none" style={{ overflow: 'visible' }}>
          {/* Edges */}
          <TEdge parent={R.root} child={R.h12}  delay={8.0} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={R.root} child={R.h34}  delay={8.1} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={R.h12}  child={R.tx1}  delay={8.2} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={R.h12}  child={R.tx2}  delay={8.3} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={R.h34}  child={R.tx64} delay={8.4} color={edgeC} width={1} nh={mNH} />
          <TEdge parent={R.h34}  child={R.tx4}  delay={8.5} color={edgeC} width={1} nh={mNH} />
          {/* Dashed red connectors to fake children — "fake five B.T.C." @ 12.2s */}
          <motion.line
            x1={R.tx64.x} y1={R.tx64.y + mNH / 2} x2={R.fake1.x} y2={R.fake1.y - mNH / 2}
            stroke={C.danger} strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: 12.2, duration: 0.5 }}
          />
          <motion.line
            x1={R.tx64.x} y1={R.tx64.y + mNH / 2} x2={R.fake2.x} y2={R.fake2.y - mNH / 2}
            stroke={C.danger} strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: 12.5, duration: 0.5 }}
          />
          {/* Nodes */}
          <TNode {...R.tx1}  label="Tx₁"    delay={8.0} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...R.tx2}  label="Tx₂"    delay={8.1} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...R.tx64} label="Tx₆₄"   delay={8.2} {...{ fill: `${C.danger}15`, stroke: C.danger, text: C.danger }} w={mNW} h={mNH} fontSize={mFS} strokeWidth={2} />
          <TNode {...R.tx4}  label="Tx₄"    delay={8.3} {...dNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...R.h12}  label="H(1,2)" delay={8.8} {...aNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...R.h34}  label="H(3,4)" delay={8.9} {...aNode} w={mNW} h={mNH} fontSize={mFS} />
          <TNode {...R.root} label="Root"    delay={9.2} {...pNode} w={mNW} h={mNH} fontSize={mFS} />
          {/* Fake children nodes (dashed borders) — "fake five B.T.C." @ 12.2s */}
          <motion.rect
            x={R.fake1.x - mNW / 2} y={R.fake1.y - mNH / 2} width={mNW} height={mNH} rx={4}
            fill={`${C.danger}15`} stroke={C.danger} strokeWidth={2} strokeDasharray="4 2"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 13.0, ...dangerSpring }}
            style={{ transformOrigin: `${R.fake1.x}px ${R.fake1.y}px` }}
          />
          <motion.text
            x={R.fake1.x} y={R.fake1.y + 1} textAnchor="middle" dominantBaseline="middle"
            fill={C.danger} fontSize={9} fontFamily="var(--font-mono)" fontWeight={700}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 13.2 }}
          >H(?)</motion.text>
          <motion.rect
            x={R.fake2.x - mNW / 2} y={R.fake2.y - mNH / 2} width={mNW} height={mNH} rx={4}
            fill={`${C.danger}15`} stroke={C.danger} strokeWidth={2} strokeDasharray="4 2"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 13.4, ...dangerSpring }}
            style={{ transformOrigin: `${R.fake2.x}px ${R.fake2.y}px` }}
          />
          <motion.text
            x={R.fake2.x} y={R.fake2.y + 1} textAnchor="middle" dominantBaseline="middle"
            fill={C.danger} fontSize={9} fontFamily="var(--font-mono)" fontWeight={700}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 13.6 }}
          >FAKE</motion.text>
          {/* Pulsing red outline around Alice's tree */}
          <motion.rect
            x={-6} y={-6} width={292} height={222} rx={8}
            fill="none" stroke={C.danger} strokeWidth={1.5} strokeDasharray="8 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ delay: 14.0, repeat: Infinity, duration: 2 }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════
export default function VideoTemplate() {
  const player = useVideoPlayer({ durations: SCENE_DURATIONS });
  const s = player.currentScene;

  const isDark = s >= 10 && s <= 12;
  const bgColor = isDark ? C.darkBg : s === 14 ? C.fixBg : 'var(--color-bg-light)';
  const edgeColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(28,28,28,0.25)';
  const headingColor = isDark ? '#FFF' : 'var(--color-text-primary)';

  // Node styles per scene (updated dark-mode colors to BDP brand)
  const defaultNode = isDark
    ? { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.85)' }
    : { fill: 'var(--color-bg-muted)', stroke: 'rgba(28,28,28,0.15)', text: 'var(--color-text-primary)' };
  const accentNode = isDark
    ? { fill: 'rgba(119,98,185,0.08)', stroke: '#7762B9', text: '#7762B9' }
    : { fill: 'rgba(111,125,193,0.08)', stroke: 'var(--color-secondary)', text: 'var(--color-secondary)' };
  const primaryNode = isDark
    ? { fill: 'rgba(235,82,52,0.1)', stroke: '#EB5234', text: '#EB5234' }
    : { fill: 'rgba(231,127,50,0.1)', stroke: 'var(--color-primary)', text: 'var(--color-primary)' };
  const dangerNode = { fill: 'rgba(235,82,52,0.08)', stroke: '#EB5234', text: '#EB5234' };

  // Tx3 morphs to Tx64 at scene 9 (Alice crafts — was scene 7)
  const tx3Style = s >= 9 ? dangerNode : defaultNode;
  const tx3Label = s >= 9 ? 'Tx₆₄' : 'Tx₃';

  // Tree shifts left for SPV panel (scene 6)
  const treeX = s === 6 ? -200 : 0;
  const treeScale = s === 6 ? 0.82 : 1;

  // ─── Smart tree opacity (dim irrelevant nodes per scene) ───
  // Guides the viewer's eye to what the narrator is discussing.
  const nodeOp = (node: string): number => {
    if (s === 1) return 1; // tree builds — all visible
    if (s === 2 || s === 6) { // proof path: Tx₁→H(1,2)→Root
      if (['tx1', 'h12', 'root'].includes(node)) return 1;
      if (['tx2', 'h34'].includes(node)) return 0.7; // siblings (context)
      return 0.25; // tx3, tx4
    }
    if (s === 3) { // "inside a parent node" — focus on H(1,2) + children
      if (['tx1', 'tx2', 'h12'].includes(node)) return 1;
      return 0.2;
    }
    if (s === 4) return 0.3; // tree is background, ByteBar is focus
    if (s === 5) return 0.2; // tree is background, comparison is focus
    if (s === 9) { // Alice mines — focus on Tx₆₄
      if (node === 'tx3') return 1;
      if (['h34', 'root'].includes(node)) return 0.6;
      return 0.3;
    }
    if (s === 10) return 0.35; // HIGHLIGHT — SplittingNode is the star
    return 1;
  };
  const edgeOp = (parent: string, child: string): number =>
    Math.min(nodeOp(parent), nodeOp(child));

  // ─── Audio playback (one continuous file) ───
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

  // ─── Scene 13 ByteBar dimming — dim non-collision fields when legend appears ───
  // "eight bytes are constrained" @ 8.7s → dim manipulable + free segments
  const [s13Dimmed, setS13Dimmed] = useState(false);
  useEffect(() => {
    if (s === 13) {
      const timer = setTimeout(() => setS13Dimmed(true), 8700);
      return () => clearTimeout(timer);
    }
    setS13Dimmed(false);
  }, [s]);

  // Segment indices: 0=TXID tail(collision), 1=idx(manip), 2=sigSz(collision),
  // 3=Seq(free), 4=outCnt(collision), 5=value(manip), 6=scrSz(collision),
  // 7=Script(free), 8=lock(manip)
  const s13SegOpacity = s13Dimmed
    ? [1, 0.25, 1, 0.25, 1, 0.25, 1, 0.25, 0.25]
    : undefined;

  return (
    <div data-video="ep5" className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: bgColor, transition: 'background-color 0.8s ease', fontFamily: 'var(--font-display)' }}>

      {/* ═══════ SCENE 0: Title ═══════ */}
      <CE s={s} enter={0} exit={1} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh]">
        <Badge delay={0.4} variant="danger" size="md">Episode 4</Badge>
        <motion.h1 style={{
          fontSize: '4.5vw', fontWeight: 700, color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)', textAlign: 'center', lineHeight: 1.1,
        }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ...dangerSpring }}
        >The 64-Byte Transaction Bug</motion.h1>
        <motion.p style={{ fontSize: '1.6vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.3 }}
        >Consensus Cleanup • BIP 54</motion.p>
      </CE>

      {/* ═══════ PERSISTENT MERKLE TREE (scenes 1-10, fades out during 7-8) ═══════ */}
      <CE s={s} enter={1} exit={11} delay={0.3}
        className="absolute top-[22vh] left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.svg
          width="65vw" height="38vh" viewBox="0 0 720 300" fill="none"
          style={{ overflow: 'visible' }}
          animate={{ x: treeX, scale: treeScale, opacity: (s === 7 || s === 8) ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 25 }}
        >
          {/* ── LAYER 1: Proof paths (behind everything) ── */}

          {/* Orange proof path: Tx₁ → H(1,2) → Root (scenes 2, 6) */}
          {/* s=2: "block header" @ 8.8s | s=6: "Merkle proofs" @ 8.5s */}
          <AnimatePresence>
            {(s === 2 || s === 6) && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProofPath
                  path={['tx1', 'h12', 'root']}
                  delay={s === 2 ? 7.5 : 8.5} color={C.proofOrange}
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Red fake proof path (scene 10) — HIGHLIGHT */}
          {/* "extra level" @ 19.7s */}
          <AnimatePresence>
            {s === 10 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProofPath
                  path={['tx3', 'h34', 'root']}
                  delay={19.7} color={C.danger} dashed
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── LAYER 2: Edges (straight lines) ── */}
          {/* "hashed together" @ 7.7s */}
          {EDGES.map(([parentKey, childKey], i) => (
            <motion.g key={`edge-${parentKey}-${childKey}`}
              animate={{ opacity: edgeOp(parentKey, childKey) }}
              transition={{ duration: 0.6 }}>
              <TEdge
                parent={T[parentKey]}
                child={T[childKey]}
                delay={7.7 + i * 0.3}
                color={edgeColor}
              />
            </motion.g>
          ))}

          {/* ── LAYER 3: Nodes (on top of lines) — smart opacity per scene ── */}
          {/* "leaves" @ 6.2s */}
          <motion.g animate={{ opacity: nodeOp('tx1') }} transition={{ duration: 0.6 }}>
            <TNode {...T.tx1} label="Tx₁" delay={6.2} {...defaultNode} />
          </motion.g>
          <motion.g animate={{ opacity: nodeOp('tx2') }} transition={{ duration: 0.6 }}>
            <TNode {...T.tx2} label="Tx₂" delay={6.5} {...defaultNode} />
          </motion.g>
          <motion.g animate={{ opacity: nodeOp('tx3') }} transition={{ duration: 0.6 }}>
            <TNode {...T.tx3} label={tx3Label} delay={6.8} {...tx3Style} />
          </motion.g>
          <motion.g animate={{ opacity: nodeOp('tx4') }} transition={{ duration: 0.6 }}>
            <TNode {...T.tx4} label="Tx₄" delay={7.1} {...defaultNode} />
          </motion.g>
          {/* "hashed together" @ 7.7s → parents appear after edges */}
          <motion.g animate={{ opacity: nodeOp('h12') }} transition={{ duration: 0.6 }}>
            <TNode {...T.h12} label="H(1,2)" delay={8.8} {...accentNode} />
          </motion.g>
          <motion.g animate={{ opacity: nodeOp('h34') }} transition={{ duration: 0.6 }}>
            <TNode {...T.h34} label="H(3,4)" delay={9.1} {...accentNode} />
          </motion.g>
          {/* "single root hash" @ 10.2s */}
          <motion.g animate={{ opacity: nodeOp('root') }} transition={{ duration: 0.6 }}>
            <TNode {...T.root} label="Root" delay={10.2} {...primaryNode} />
          </motion.g>

          {/* ── LAYER 4: Overlays ── */}

          {/* "64B" badge on Tx₆₄ (scenes 9-10) */}
          <AnimatePresence>
            {s >= 9 && s <= 10 && (
              <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }} transition={{ delay: 0.3, ...dangerSpring }}>
                <motion.rect
                  x={T.tx3.x + NW / 2 + 4} y={T.tx3.y - 10} width={30} height={18} rx={9}
                  fill={C.danger}
                />
                <motion.text
                  x={T.tx3.x + NW / 2 + 19} y={T.tx3.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize={9} fontFamily="var(--font-mono)" fontWeight={700}
                >64B</motion.text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Highlight box on H(1,2) — scenes 3-4 */}
          {/* "concatenate two child" @ 3.4s → highlight appears early */}
          <AnimatePresence>
            {s >= 3 && s <= 4 && (
              <motion.rect
                x={T.h12.x - NW / 2 - 10} y={T.h12.y - NH / 2 - 10}
                width={NW + 20} height={NH + 20} rx={7}
                fill="none" stroke={s === 4 ? C.danger : C.nodeA}
                strokeWidth={2.5} strokeDasharray="6 3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{
                  opacity: { repeat: Infinity, duration: 2 },
                  scale: { delay: 1.5, ...dangerSpring },
                }}
                style={{ transformOrigin: `${T.h12.x}px ${T.h12.y}px` }}
              />
            )}
          </AnimatePresence>

          {/* Dimming overlays on Tx₃, Tx₄ during scene 2 — before "sibling hashes" @ 3.9s */}
          <AnimatePresence>
            {s === 2 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ delay: 1.5 }}
              >
                <motion.rect
                  x={T.tx3.x - NW / 2 - 2} y={T.tx3.y - NH / 2 - 2}
                  width={NW + 4} height={NH + 4} rx={6}
                  fill="var(--color-bg-light)" opacity={0.6}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                />
                <motion.rect
                  x={T.tx4.x - NW / 2 - 2} y={T.tx4.y - NH / 2 - 2}
                  width={NW + 4} height={NH + 4} rx={6}
                  fill="var(--color-bg-light)" opacity={0.6}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                  transition={{ delay: 2.0, duration: 0.5 }}
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Sibling highlights + labels for proof scene (2) */}
          {/* "sibling hashes" @ 3.9s */}
          <AnimatePresence>
            {s === 2 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Orange highlight outline on Tx₂ */}
                <motion.rect
                  x={T.tx2.x - NW / 2 - 5} y={T.tx2.y - NH / 2 - 5}
                  width={NW + 10} height={NH + 10} rx={7}
                  fill="none" stroke={C.proofOrange} strokeWidth={2}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                  transition={{ delay: 3.9 }}
                />
                {/* sibling ① pill below Tx₂ */}
                <motion.rect
                  x={T.tx2.x - 42} y={T.tx2.y + NH / 2 + 10}
                  width={84} height={22} rx={11}
                  fill={`${C.proofOrange}20`} stroke={C.proofOrange} strokeWidth={1}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 4.3 }}
                />
                <motion.text x={T.tx2.x} y={T.tx2.y + NH / 2 + 23} textAnchor="middle"
                  dominantBaseline="middle"
                  fill={C.proofOrange} fontSize={12} fontFamily="var(--font-mono)" fontWeight={700}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.3 }}
                >sibling ①</motion.text>

                {/* Orange highlight outline on H(3,4) */}
                <motion.rect
                  x={T.h34.x - NW / 2 - 5} y={T.h34.y - NH / 2 - 5}
                  width={NW + 10} height={NH + 10} rx={7}
                  fill="none" stroke={C.proofOrange} strokeWidth={2}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                  transition={{ delay: 5.0 }}
                />
                {/* sibling ② pill to the right of H(3,4) */}
                <motion.rect
                  x={T.h34.x + NW / 2 + 8} y={T.h34.y - 11}
                  width={84} height={22} rx={11}
                  fill={`${C.proofOrange}20`} stroke={C.proofOrange} strokeWidth={1}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 5.4 }}
                />
                <motion.text x={T.h34.x + NW / 2 + 50} y={T.h34.y + 1} textAnchor="middle"
                  dominantBaseline="middle"
                  fill={C.proofOrange} fontSize={12} fontFamily="var(--font-mono)" fontWeight={700}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.4 }}
                >sibling ②</motion.text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Pulsing glow on Tx₆₄ during HIGHLIGHT scene (10) */}
          {/* "sixty-four bytes long" @ 4.9s */}
          <AnimatePresence>
            {s === 10 && (
              <motion.rect
                x={T.tx3.x - NW / 2 - 6} y={T.tx3.y - NH / 2 - 6}
                width={NW + 12} height={NH + 12} rx={6}
                fill="none" stroke={C.danger} strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ opacity: { repeat: 3, duration: 1.5, delay: 4.9 } }}
                style={{ transformOrigin: `${T.tx3.x}px ${T.tx3.y}px` }}
              />
            )}
          </AnimatePresence>

          {/* "SHA-256 sees 64 bytes" annotation — between "sixty-four bytes long" @ 4.9s and "splits open" @ 16.0s */}
          <AnimatePresence>
            {s === 10 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Arrow from annotation to Tx₆₄ */}
                <motion.line
                  x1={T.tx3.x + NW / 2 + 50} y1={T.tx3.y + 12}
                  x2={T.tx3.x + NW / 2 + 8} y2={T.tx3.y + 2}
                  stroke={C.danger} strokeWidth={1.5} strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ delay: 9.0, duration: 0.3 }}
                />
                <motion.text
                  x={T.tx3.x + NW / 2 + 54} y={T.tx3.y + 18}
                  fill={C.danger} fontSize={11} fontFamily="var(--font-mono)" fontWeight={600}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 8.8 }}
                >SHA-256 sees 64B</motion.text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* SplittingNode — scene 10 HIGHLIGHT */}
          {/* "splits open" @ 16.0s */}
          <SplittingNode x={T.tx3.x} y={T.tx3.y} active={s === 10} delay={16.0} />
        </motion.svg>
      </CE>

      {/* ═══════ HEADINGS (one per scene, top-[12vh]) ═══════ */}

      {[
        { scene: 1, text: 'A block bundles transactions into a Merkle tree' },
        { scene: 2, text: 'A Merkle proof = the path from your tx to the root' },
        { scene: 4, text: 'A transaction can be crafted to be exactly 64 bytes', color: C.danger },
        { scene: 5, text: "SHA-256 sees 64 bytes. It doesn't know what they mean." },
        { scene: 6, text: 'Light wallets only check Merkle proofs' },
        { scene: 7, text: 'The attack requires two crafted transactions', color: C.danger },
        { scene: 8, text: 'Alice grinds until the TXIDs collide', color: C.danger },
        { scene: 9, text: 'Step 1: Alice mines her 64-byte transaction', color: C.danger },
      ].map(({ scene, text, color }) => (
        <CE key={scene} s={s} enter={scene} exit={scene + 1} delay={0.3}
          className="absolute top-[12vh] left-0 right-0 flex justify-center">
          <motion.h2 style={{
            fontSize: '2vw', fontWeight: 600, textAlign: 'center', maxWidth: '80vw',
            color: color ?? headingColor,
          }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springs.snappy }}
          >{text}</motion.h2>
        </CE>
      ))}

      {/* Scene 3 heading — equation style */}
      <CE s={s} enter={3} exit={4} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <motion.div style={{
          display: 'flex', alignItems: 'center', gap: '0.5vw',
          fontSize: '1.8vw', textAlign: 'center',
        }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.snappy }}
        >
          <span style={{ fontWeight: 500, color: headingColor }}>Each parent</span>
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '2vw' }}>=</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 500, color: C.proofOrange,
            padding: '0.3vh 0.8vw', borderRadius: '0.4vw',
            backgroundColor: `${C.proofOrange}10`, border: `0.08vw solid ${C.proofOrange}25`,
          }}>SHA-256</span>
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: C.nodeA }}>left child</span>
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '2vw' }}>‖</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: C.nodeB }}>right child</span>
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>)</span>
        </motion.div>
      </CE>

      {/* Scene 10 heading — HIGHLIGHT (dark bg, glow) */}
      <CE s={s} enter={10} exit={11} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <motion.h2 style={{
          fontSize: '2.2vw', fontWeight: 700, color: '#FFF', textAlign: 'center',
          textShadow: `0 0 40px ${C.danger}80`,
        }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...dangerSpring }}
        >Step 2: The leaf IS the inner node</motion.h2>
      </CE>

      {/* Scene 11 heading — Two Views */}
      <CE s={s} enter={11} exit={12} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <motion.h2 style={{ fontSize: '2vw', fontWeight: 600, color: '#FFF', textAlign: 'center' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.snappy }}
        >Same root hash, two completely different trees</motion.h2>
      </CE>

      {/* Scene 12 heading — SPV Fooled */}
      <CE s={s} enter={12} exit={13} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <motion.h2 style={{ fontSize: '2vw', fontWeight: 600, color: '#FFF', textAlign: 'center' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.snappy }}
        >Step 3: The light wallet is fooled</motion.h2>
      </CE>

      {/* Scene 13 heading — Feasibility */}
      <CE s={s} enter={13} exit={14} delay={0.3}
        className="absolute top-[12vh] left-0 right-0 flex justify-center">
        <motion.h2 style={{ fontSize: '2vw', fontWeight: 600, color: headingColor, textAlign: 'center' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.snappy }}
        >How feasible? Break down the last 32 bytes</motion.h2>
      </CE>

      {/* ═══════ SCENE 2: Proof verification steps ═══════ */}
      <CE s={s} enter={2} exit={3} delay={5.5}
        className="absolute top-[62vh] left-0 right-0 flex justify-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.8vh' }}>
          {/* "sibling hashes" @ 3.9s → step 1 appears around 5.5s */}
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.6vw' }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 5.5, ...preciseSpring }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: C.proofOrange, fontFamily: 'var(--font-mono)' }}>Step 1:</span>
            <span style={{ fontSize: '0.8vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Hash(Tx₁) ‖ Hash(Tx₂) → H(1,2)
            </span>
            <motion.span style={{ color: C.fix, fontSize: '1vw', fontWeight: 700 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 6.2, ...springs.bouncy }}
            >✓</motion.span>
          </motion.div>

          {/* "block header" @ 8.8s */}
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.6vw' }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 7.5, ...preciseSpring }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: C.proofOrange, fontFamily: 'var(--font-mono)' }}>Step 2:</span>
            <span style={{ fontSize: '0.8vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              H(1,2) ‖ H(3,4) → Root
            </span>
            <motion.span style={{ color: C.fix, fontSize: '1vw', fontWeight: 700 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 8.4, ...springs.bouncy }}
            >✓</motion.span>
          </motion.div>

          {/* "proof checks out" @ 9.6s */}
          <motion.div style={{
            display: 'flex', alignItems: 'center', gap: '0.5vw',
            padding: '0.4vh 0.8vw', borderRadius: '0.3vw',
            backgroundColor: `${C.fix}10`, border: `0.08vw solid ${C.fix}25`,
            marginTop: '0.3vh',
          }}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 9.6, ...preciseSpring }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: C.fix, fontFamily: 'var(--font-mono)' }}>
              Proof verified: path hashes to root
            </span>
            <motion.span style={{ color: C.fix, fontSize: '1.2vw', fontWeight: 700 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 10.0, ...springs.bouncy }}
            >✓</motion.span>
          </motion.div>
        </div>
      </CE>

      {/* ═══════ SCENE 3: Concatenation flow diagram ═══════ */}
      <CE s={s} enter={3} exit={4} delay={3.0}
        className="absolute top-[58vh] left-0 right-0 flex justify-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2vh' }}>
          {/* "concatenate two child" @ 3.4s */}
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.4, ...preciseSpring }}
          >
            <div style={{
              padding: '0.8vh 1.5vw', borderRadius: '0.4vw',
              backgroundColor: `${C.nodeA}15`, border: `0.1vw solid ${C.nodeA}40`,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.85vw', fontWeight: 600, color: C.nodeA, fontFamily: 'var(--font-mono)' }}>Hash(Tx₁)</span>
              <span style={{ fontSize: '0.6vw', color: C.nodeA, fontFamily: 'var(--font-mono)', opacity: 0.7, display: 'block' }}>32 bytes</span>
            </div>
            <motion.span style={{ fontSize: '1.5vw', fontWeight: 700, color: 'var(--color-text-muted)' }}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 5.0, ...preciseSpring }}
            >‖</motion.span>
            <div style={{
              padding: '0.8vh 1.5vw', borderRadius: '0.4vw',
              backgroundColor: `${C.nodeB}15`, border: `0.1vw solid ${C.nodeB}40`,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.85vw', fontWeight: 600, color: C.nodeB, fontFamily: 'var(--font-mono)' }}>Hash(Tx₂)</span>
              <span style={{ fontSize: '0.6vw', color: C.nodeB, fontFamily: 'var(--font-mono)', opacity: 0.7, display: 'block' }}>32 bytes</span>
            </div>
          </motion.div>

          {/* Arrow down — "sha two fifty six" @ 8.4s */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 7.5 }}
          >
            <svg width="2vw" height="3vh" viewBox="0 0 24 36">
              <motion.line x1={12} y1={0} x2={12} y2={26} stroke="var(--color-text-muted)" strokeWidth={2.5}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 7.6, duration: 0.3 }}
              />
              <motion.polygon points="5,24 12,36 19,24" fill="var(--color-text-muted)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 7.9 }}
              />
            </svg>
          </motion.div>

          {/* SHA-256 box */}
          <motion.div style={{
            padding: '0.8vh 2vw', borderRadius: '0.5vw',
            backgroundColor: `${C.proofOrange}15`, border: `0.12vw solid ${C.proofOrange}50`,
            display: 'flex', alignItems: 'center', gap: '0.8vw',
          }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 8.4, ...dangerSpring }}
          >
            <span style={{ fontSize: '1vw', fontWeight: 700, color: C.proofOrange, fontFamily: 'var(--font-mono)' }}>SHA-256</span>
            <span style={{ fontSize: '0.7vw', color: C.proofOrange, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>(64 bytes in)</span>
          </motion.div>

          {/* Arrow down to output */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 9.5 }}
          >
            <svg width="2vw" height="3vh" viewBox="0 0 24 36">
              <motion.line x1={12} y1={0} x2={12} y2={26} stroke="var(--color-text-muted)" strokeWidth={2.5}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 9.7, duration: 0.3 }}
              />
              <motion.polygon points="5,24 12,36 19,24" fill="var(--color-text-muted)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 10.0 }}
              />
            </svg>
          </motion.div>

          {/* Output node */}
          <motion.div style={{
            padding: '0.6vh 1.5vw', borderRadius: '0.4vw',
            backgroundColor: `${C.fix}12`, border: `0.1vw solid ${C.fix}40`,
          }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 10.0, ...preciseSpring }}
          >
            <span style={{ fontSize: '0.9vw', fontWeight: 600, color: C.fix, fontFamily: 'var(--font-mono)' }}>H(1,2)</span>
          </motion.div>

          {/* "exactly sixty-four bytes" @ 12.3s */}
          <motion.div style={{
            marginTop: '0.5vh', padding: '0.5vh 1.2vw', borderRadius: '2vw',
            backgroundColor: `${C.nodeA}12`, border: `0.1vw solid ${C.nodeA}30`,
          }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 12.3, ...springs.bouncy }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: C.nodeA, fontFamily: 'var(--font-mono)' }}>
              Input = exactly 64 bytes
            </span>
          </motion.div>
        </div>
      </CE>

      {/* ═══════ SCENE 4: ByteBar — transaction ═══════ */}
      {/* "crafted to be exactly" @ 3.1s */}
      <CE s={s} enter={4} exit={5} delay={3.1}
        className="absolute top-[62vh] left-0 right-0 flex justify-center">
        <ByteBar delay={3.1} label="Crafted 64-byte transaction" segments={[
          { label: 'ver', bytes: 4, color: C.proofOrange },
          { label: 'in', bytes: 1, color: C.nodeB },
          { label: 'prevTXID', bytes: 32, color: C.nodeA },
          { label: 'idx', bytes: 4, color: C.nodeB },
          { label: 'sizes', bytes: 2, color: C.nodeB },
          { label: 'value', bytes: 8, color: C.fix },
          { label: 'script', bytes: 9, color: C.fix },
          { label: 'lock', bytes: 4, color: C.proofOrange },
        ]} />
      </CE>

      {/* Scene 4: "Also 64 bytes!" callback badge — "matches the inner node" @ 15.3s */}
      <CE s={s} enter={4} exit={5} delay={12.3}
        className="absolute top-[78vh] left-0 right-0 flex justify-center">
        <motion.div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3vh',
          padding: '0.6vh 1.5vw', borderRadius: '0.5vw',
          backgroundColor: `${C.danger}10`, border: `0.12vw solid ${C.danger}30`,
        }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 12.3, ...dangerSpring }}
        >
          <span style={{ fontSize: '1.1vw', fontWeight: 700, color: C.danger, fontFamily: 'var(--font-mono)' }}>
            Also 64 bytes!
          </span>
          <span style={{ fontSize: '0.7vw', color: C.danger, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            Same size as an inner node input
          </span>
        </motion.div>
      </CE>

      {/* ═══════ SCENE 5: SHA-256 ambiguity — side-by-side ═══════ */}
      <CE s={s} enter={5} exit={6} delay={0.3}
        className="absolute top-[56vh] left-0 right-0 flex justify-center">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          {/* Left: Two stacked ByteBars */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2vh' }}>
            {/* "Inner node" @ 1.9s */}
            <ByteBar delay={1.9} label="Inner node:" width="34vw" segments={[
              { label: 'Hash_A', bytes: 32, color: C.nodeA },
              { label: 'Hash_B', bytes: 32, color: C.nodeB },
            ]} />

            {/* Bold "=" — appears after both bars visible, around 7s */}
            <motion.span style={{ fontSize: '2.2vw', fontWeight: 700, color: C.danger, lineHeight: 1 }}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 7.0, ...springs.bouncy }}
            >=</motion.span>

            {/* "Transaction" @ 4.3s */}
            <ByteBar delay={4.3} label="Transaction:" width="34vw" segments={[
              { label: 'ver', bytes: 4, color: C.proofOrange },
              { label: 'in', bytes: 1, color: C.nodeB },
              { label: 'prevTXID', bytes: 32, color: C.nodeA },
              { label: 'idx', bytes: 4, color: C.nodeB },
              { label: 'sizes', bytes: 2, color: C.nodeB },
              { label: 'value', bytes: 8, color: C.fix },
              { label: 'script', bytes: 9, color: C.fix },
              { label: 'lock', bytes: 4, color: C.proofOrange },
            ]} />
          </div>

          {/* Right: SHA-256 box with converging arrows */}
          {/* SHA-256 ambiguity — after both bars visible, around 8s */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 7.0, ...dangerSpring }}
          >
            {/* Converging arrows SVG */}
            <svg width="8vw" height="16vh" viewBox="0 0 100 180" fill="none" style={{ overflow: 'visible' }}>
              {/* Top arrow (from inner node bar) */}
              <motion.path
                d="M 0 30 Q 30 30, 50 75"
                stroke={C.nodeA} strokeWidth={2} fill="none" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ delay: 7.5, duration: 0.4 }}
              />
              {/* Bottom arrow (from tx bar) */}
              <motion.path
                d="M 0 150 Q 30 150, 50 105"
                stroke={C.proofOrange} strokeWidth={2} fill="none" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ delay: 7.7, duration: 0.4 }}
              />
              {/* SHA-256 box */}
              <motion.rect
                x={35} y={72} width={65} height={36} rx={6}
                fill={`${C.danger}15`} stroke={C.danger} strokeWidth={2}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 8.0, ...dangerSpring }}
                style={{ transformOrigin: '67px 90px' }}
              />
              <motion.text
                x={67} y={86} textAnchor="middle" dominantBaseline="middle"
                fill={C.danger} fontSize={11} fontFamily="var(--font-mono)" fontWeight={700}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 8.3 }}
              >SHA-256</motion.text>
              {/* Question mark */}
              <motion.text
                x={67} y={100} textAnchor="middle" dominantBaseline="middle"
                fill={C.danger} fontSize={9} fontFamily="var(--font-mono)" fontWeight={600}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 8.6 }}
              >which is it?</motion.text>
            </svg>
          </motion.div>
        </div>
      </CE>

      {/* "ambiguity is the bug" @ 14.2s */}
      <CE s={s} enter={5} exit={6} delay={14.2}
        className="absolute top-[82vh] left-0 right-0 flex justify-center">
        <HighlightBox delay={14.2} color={C.danger} padding="1.2vh 2.5vw">
          <span style={{ fontSize: '1.3vw', fontWeight: 600, color: C.danger }}>
            That ambiguity is the bug.
          </span>
        </HighlightBox>
      </CE>

      {/* ═══════ SCENE 6: SPV Panel (right side) ═══════ */}
      {/* "light wallets" @ 1.7s */}
      <CE s={s} enter={6} exit={7} delay={1.7}
        className="absolute right-[3vw] top-[22vh]" style={{ width: '27vw' }}>
        <motion.div style={{
          padding: '2.5vh 2vw', borderRadius: '1vw',
          backgroundColor: 'rgba(28,28,28,0.03)', border: '0.15vw solid rgba(28,28,28,0.1)',
          display: 'flex', flexDirection: 'column', gap: '2vh',
        }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7, ...springs.snappy }}
        >
          {/* "S.P.V." @ 3.2s */}
          <motion.span style={{
            fontSize: '1.3vw', fontWeight: 600, color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)', textAlign: 'center',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}
          >SPV Wallet</motion.span>

          {/* "Merkle proofs" @ 8.5s; "never see the full tree" @ 13.4s */}
          {[
            { n: '1.', t: 'Downloads only block headers', d: 5.5 },
            { n: '2.', t: 'Asks for Merkle proofs', d: 8.5 },
            { n: '3.', t: 'Verifies: path hashes to root?', d: 11.0 },
          ].map(({ n, t, d }) => (
            <motion.div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.7vw' }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: d, ...preciseSpring }}
            >
              <span style={{ color: 'var(--color-primary)', fontSize: '1.1vw', fontWeight: 600 }}>{n}</span>
              <span style={{ fontSize: '0.95vw', color: 'var(--color-text-muted)' }}>{t}</span>
            </motion.div>
          ))}
        </motion.div>
      </CE>

      {/* ═══════ SCENE 7: The Two Transactions — vertical diagram (NEW) ═══════ */}
      {/* Audio: 36.8s — "Here's how the attack works..." */}
      <CE s={s} enter={7} exit={8} delay={1.1}
        className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: '17vh' }}>

        {/* ── TOP PANEL: Valid Bitcoin Transaction (Main Chain) ── */}
        {/* "two transactions" @ 2.2s */}
        <motion.div style={{
          width: '78vw', padding: '1.5vh 1.8vw', borderRadius: '0.6vw',
          backgroundColor: 'rgba(28,28,28,0.03)', border: '0.1vw solid rgba(28,28,28,0.08)',
          display: 'flex', flexDirection: 'column', gap: '1.2vh',
        }}
          initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, ...preciseSpring }}
        >
          {/* "real transaction" label @ 3.8s */}
          <motion.span style={{
            fontSize: '0.8vw', fontWeight: 600, color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.8 }}
          >Valid Bitcoin Transaction (Main Chain)</motion.span>

          {/* Full 64B field row — "sixty-four byte transaction" @ 5.5s */}
          {/* PrevTXID split: 27B in left child, 5B overflow into right child */}
          <motion.div style={{
            display: 'flex', height: '4.5vh', borderRadius: '0.3vw', overflow: 'hidden',
            border: '0.1vw solid rgba(57,107,235,0.3)', position: 'relative',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }}
          >
            {[
              { label: 'Version', bytes: 4, flex: 4 },
              { label: 'In cnt', bytes: 1, flex: 2 },
              { label: 'prevTXID ↗', bytes: 27, flex: 13.5, isSplitLeft: true },
              { label: '↘ TXID', bytes: 5, flex: 2.5, isSplitRight: true },
              { label: 'Prev idx', bytes: 4, flex: 3.5 },
              { label: 'Sig sz', bytes: 1, flex: 2 },
              { label: 'Seq', bytes: 4, flex: 3.5 },
              { label: 'Out cnt', bytes: 1, flex: 2 },
              { label: 'Value', bytes: 8, flex: 5 },
              { label: 'Scr sz', bytes: 1, flex: 2 },
              { label: 'Script', bytes: 4, flex: 3.5 },
              { label: 'Lock', bytes: 4, flex: 4 },
            ].map((f: { label: string; bytes: number; flex: number; isSplitLeft?: boolean; isSplitRight?: boolean }, i: number) => (
              <motion.div key={i} style={{
                flex: f.flex, backgroundColor: `${C.nodeA}18`,
                borderLeft: i > 0 ? `0.08vw solid ${C.nodeA}30` : undefined,
                borderRight: f.isSplitLeft ? `0.18vw dashed ${C.danger}` : undefined,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '0 0.15vw', minWidth: 0,
              }}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 5.5 + i * 0.05, duration: 0.25, ease: 'circOut' }}
              >
                <span style={{
                  fontSize: f.flex > 4 ? '0.6vw' : '0.5vw', fontWeight: 600,
                  color: (f.isSplitLeft || f.isSplitRight) ? C.danger : C.nodeA,
                  fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                }}>{f.label}</span>
                <span style={{
                  fontSize: '0.45vw', color: (f.isSplitLeft || f.isSplitRight) ? C.danger : C.nodeA,
                  fontFamily: 'var(--font-mono)', opacity: 0.7,
                }}>{f.bytes}B</span>
              </motion.div>
            ))}
          </motion.div>

          {/* 32-byte boundary annotation */}
          <motion.div style={{
            display: 'flex', justifyContent: 'center', gap: '0.4vw', alignItems: 'center',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 9.2 }}
          >
            <span style={{ fontSize: '0.55vw', color: C.danger, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
              ↑ 32-byte boundary cuts through prevTXID
            </span>
          </motion.div>

          {/* Left/Right child split — progressive reveal synced to voiceover (1.2x speed) */}
          {/* "Its first thirty-two bytes = left child hash" @ ~10s audio → 10.1s delay */}
          {/* "its last thirty-two bytes = right child hash" @ ~13s audio → 13.3s delay */}
          <motion.div style={{
            display: 'flex', height: '3.5vh', borderRadius: '0.3vw', overflow: 'hidden',
            border: '0.1vw solid rgba(28,28,28,0.1)', position: 'relative',
          }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 10.1, ...preciseSpring }}
          >
            {/* Cells matching field row flex + borders + padding exactly — left/right animate separately */}
            {[
              { flex: 4, side: 'L' },
              { flex: 2, side: 'L' },
              { flex: 13.5, side: 'L', split: true },
              { flex: 2.5, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 4, side: 'R' },
            ].map((f, i) => (
              <motion.div key={i} style={{
                flex: f.flex,
                borderLeft: i > 0 ? `0.08vw solid transparent` : undefined,
                borderRight: f.split ? `0.18vw dashed ${C.danger}` : undefined,
                padding: '0 0.15vw', minWidth: 0,
              }}
                initial={{ backgroundColor: 'transparent' }}
                animate={{ backgroundColor: f.side === 'L' ? `${C.danger}12` : `${C.dangerDark}12` }}
                transition={{ delay: f.side === 'L' ? 10.1 : 13.3, duration: 0.4 }}
              />
            ))}
            {/* Overlay text labels — each side appears with its cells */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
              <motion.div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4vw' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 10.3 }}
              >
                <span style={{ fontSize: '0.7vw', fontWeight: 600, color: C.danger, fontFamily: 'var(--font-mono)' }}>← Left child hash</span>
                <span style={{ fontSize: '0.5vw', color: C.danger, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>32B</span>
              </motion.div>
              <motion.div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4vw' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 13.5 }}
              >
                <span style={{ fontSize: '0.7vw', fontWeight: 600, color: C.dangerDark, fontFamily: 'var(--font-mono)' }}>Right child hash →</span>
                <span style={{ fontSize: '0.5vw', color: C.dangerDark, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>32B</span>
              </motion.div>
            </div>
          </motion.div>

          {/* TXID bar — aligned to right child using same 12-cell flex layout */}
          <motion.div style={{
            display: 'flex', height: '3.8vh', borderRadius: '0.3vw', overflow: 'hidden',
            position: 'relative',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 23.7, ...preciseSpring }}
          >
            {/* Same 12-cell structure: left cells invisible, right cells = TXID bar */}
            {[
              { flex: 4, side: 'L' },
              { flex: 2, side: 'L' },
              { flex: 13.5, side: 'L', split: true },
              { flex: 2.5, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 5, side: 'R' },
              { flex: 2, side: 'R' },
              { flex: 3.5, side: 'R' },
              { flex: 4, side: 'R' },
            ].map((f, i) => (
              <div key={i} style={{
                flex: f.flex,
                backgroundColor: f.side === 'R' ? `${C.dangerDark}18` : 'transparent',
                borderLeft: i > 0 ? `0.08vw solid transparent` : undefined,
                borderRight: f.split ? `0.18vw solid transparent` : undefined,
                borderTop: f.side === 'R' ? `0.1vw solid ${C.dangerDark}50` : undefined,
                borderBottom: f.side === 'R' ? `0.1vw solid ${C.dangerDark}50` : undefined,
                padding: '0 0.15vw', minWidth: 0,
              }} />
            ))}
            {/* First right cell gets left border, last right cell gets right border radius */}
            {/* Overlay label */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none',
            }}>
              <div style={{ flex: 19.5 }} />
              <div style={{ flex: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5vw' }}>
                <span style={{ fontSize: '0.9vw', fontWeight: 700, color: C.dangerDark, fontFamily: 'var(--font-mono)' }}>
                  Fake TXID must match right child
                </span>
                <span style={{ fontSize: '0.7vw', color: C.dangerDark, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                  32B
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── ARROW: Hash — "transaction I.D." @ 23.9s ── */}
        <motion.div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2vh',
          padding: '0.8vh 0',
        }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 24.5 }}
        >
          <svg width="2.5vw" height="4vh" viewBox="0 0 30 50">
            <motion.line x1={15} y1={0} x2={15} y2={38} stroke="var(--color-text-muted)" strokeWidth={3}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 24.7, duration: 0.4 }}
            />
            <motion.polygon points="6,35 15,48 24,35" fill="var(--color-text-muted)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 25.1 }}
            />
          </svg>
          <span style={{ fontSize: '0.7vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Hash</span>
        </motion.div>

        {/* ── BOTTOM PANEL: Invalid Bitcoin Transaction ── */}
        {/* "second transaction" @ 16.7s */}
        <motion.div style={{
          width: '78vw', padding: '1.5vh 1.8vw', borderRadius: '0.6vw',
          backgroundColor: `${C.danger}06`, border: `0.1vw solid ${C.danger}20`,
          display: 'flex', flexDirection: 'column', gap: '1.2vh',
        }}
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 16.7, ...preciseSpring }}
        >
          <motion.span style={{
            fontSize: '0.8vw', fontWeight: 600, color: C.danger, fontFamily: 'var(--font-mono)',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 17.2 }}
          >Invalid Bitcoin Transaction (never mined — shown to SPV wallet)</motion.span>

          {/* Input → Outputs flow — "five B.T.C." @ 19.9s */}
          <motion.div style={{
            display: 'flex', alignItems: 'center', gap: '2vw', justifyContent: 'center',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 18.5 }}
          >
            {/* Input */}
            <motion.div style={{
              padding: '1vh 1.5vw', borderRadius: '0.4vw',
              backgroundColor: `${C.nodeA}15`, border: `0.1vw solid ${C.nodeA}30`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3vh',
            }}
              initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 18.5, ...preciseSpring }}
            >
              <span style={{ fontSize: '0.7vw', fontWeight: 600, color: C.nodeA, fontFamily: 'var(--font-mono)' }}>Fake tx input</span>
              <span style={{ fontSize: '0.9vw', fontWeight: 700, color: C.nodeA, fontFamily: 'var(--font-mono)' }}>5.002 BTC</span>
            </motion.div>

            {/* Arrow */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 19.2 }}>
              <svg width="3vw" height="2vh" viewBox="0 0 40 20">
                <motion.line x1={0} y1={10} x2={30} y2={10} stroke="var(--color-text-muted)" strokeWidth={2.5}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: 19.3, duration: 0.3 }}
                />
                <motion.polygon points="28,4 40,10 28,16" fill="var(--color-text-muted)"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 19.6 }}
                />
              </svg>
            </motion.div>

            {/* Outputs — "five B.T.C." @ 19.9s */}
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh' }}
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 19.9, ...preciseSpring }}
            >
              <div style={{
                padding: '0.8vh 1.5vw', borderRadius: '0.4vw',
                backgroundColor: `${C.danger}12`, border: `0.1vw solid ${C.danger}30`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2vw',
              }}>
                <span style={{ fontSize: '0.7vw', fontWeight: 600, color: C.danger, fontFamily: 'var(--font-mono)' }}>Bob (victim)</span>
                <span style={{ fontSize: '0.9vw', fontWeight: 700, color: C.danger, fontFamily: 'var(--font-mono)' }}>5 BTC</span>
              </div>
              <div style={{
                padding: '0.8vh 1.5vw', borderRadius: '0.4vw',
                backgroundColor: `${C.freeChoice}10`, border: `0.1vw solid ${C.freeChoice}25`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2vw',
              }}>
                <span style={{ fontSize: '0.7vw', fontWeight: 600, color: C.freeChoice, fontFamily: 'var(--font-mono)' }}>Change (grinding)</span>
                <span style={{ fontSize: '0.9vw', fontWeight: 700, color: C.freeChoice, fontFamily: 'var(--font-mono)' }}>0.001 BTC</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </CE>

      {/* ═══════ SCENE 8: TXID Collision / Grinding (NEW) ═══════ */}
      {/* Audio: 33.5s — "So how does Alice make the TXIDs match?..." */}
      <CE s={s} enter={8} exit={9} delay={1.7}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5vh]"
        style={{ paddingTop: '6vh' }}>

        {/* Target bar — @ 2.0s */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6vh' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, ...preciseSpring }}
        >
          <span style={{ fontSize: '0.8vw', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            Target: last 32B of real tx
          </span>
          <div style={{
            padding: '0.8vh 1.5vw', borderRadius: '0.4vw',
            backgroundColor: `${C.danger}10`, border: `0.12vw solid ${C.danger}30`,
          }}>
            <span style={{ fontSize: '0.9vw', fontFamily: 'var(--font-mono)', color: C.danger, fontWeight: 600, letterSpacing: '0.05em' }}>
              a4f2 8c91 3b7e 0a12 c5d9 ... d4c2 7e1b
            </span>
          </div>
        </motion.div>

        {/* Grinding attempts table — "changing the change address" @ 5.0s */}
        <motion.div style={{
          display: 'flex', flexDirection: 'column', gap: '0',
          borderRadius: '0.6vw', overflow: 'hidden',
          border: '0.1vw solid rgba(28,28,28,0.1)', width: '58vw',
        }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 5.0 }}
        >
          {/* Header row — @ 5.0s */}
          <motion.div style={{
            display: 'flex', padding: '0.8vh 1.2vw',
            backgroundColor: 'rgba(28,28,28,0.04)',
            borderBottom: '0.1vw solid rgba(28,28,28,0.08)',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.0 }}
          >
            <span style={{ flex: '0 0 5vw', fontSize: '0.7vw', fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>#</span>
            <span style={{ flex: 1, fontSize: '0.7vw', fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Change address</span>
            <span style={{ flex: 1, fontSize: '0.7vw', fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Resulting TXID</span>
            <span style={{ flex: '0 0 4vw', fontSize: '0.7vw', fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', textAlign: 'center' }}>Match?</span>
          </motion.div>

          {/* Failed attempt rows — @ 6.3s, 8.3s, 9.8s */}
          {[
            { n: '1', addr: '1A2b...3c4D', txid: '7f3e 91a2 ... 0b8c', delay: 6.3 },
            { n: '2', addr: '5E6f...7a8B', txid: 'c4d5 2e17 ... 3f1a', delay: 8.3 },
            { n: '3', addr: '9C0d...1e2F', txid: '2a9b 44c8 ... 5c1d', delay: 9.8 },
          ].map(({ n, addr, txid, delay: d }) => (
            <motion.div key={n} style={{
              display: 'flex', alignItems: 'center', padding: '0.7vh 1.2vw',
              borderBottom: '0.06vw solid rgba(28,28,28,0.06)',
            }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: d, ...preciseSpring }}
            >
              <span style={{ flex: '0 0 5vw', fontSize: '0.8vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{n}</span>
              <span style={{ flex: 1, fontSize: '0.8vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{addr}</span>
              <span style={{ flex: 1, fontSize: '0.8vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{txid}</span>
              <span style={{ flex: '0 0 4vw', fontSize: '1.2vw', textAlign: 'center', color: 'var(--color-text-muted)', opacity: 0.5 }}>✗</span>
            </motion.div>
          ))}

          {/* Ellipsis row — @ 12.8s */}
          <motion.div style={{
            display: 'flex', justifyContent: 'center', padding: '0.5vh 0',
            borderBottom: '0.06vw solid rgba(28,28,28,0.06)',
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 12.8 }}
          >
            <span style={{ fontSize: '1.2vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3em' }}>⋮</span>
          </motion.div>

          {/* Success row — @ 14.1s */}
          <motion.div style={{
            display: 'flex', alignItems: 'center', padding: '0.9vh 1.2vw',
            backgroundColor: `${C.fix}08`,
          }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 14.1, ...dangerSpring }}
          >
            <span style={{ flex: '0 0 5vw', fontSize: '0.8vw', color: C.fix, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>~2⁷⁰</span>
            <span style={{ flex: 1, fontSize: '0.8vw', color: C.fix, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>8A2c...4b5D</span>
            <span style={{ flex: 1, fontSize: '0.8vw', color: C.fix, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>a4f2 8c91 ... 7e1b</span>
            <motion.span style={{ flex: '0 0 4vw', fontSize: '1.4vw', textAlign: 'center', color: C.fix, fontWeight: 700 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 14.6, ...springs.bouncy }}
            >✓</motion.span>
          </motion.div>
        </motion.div>

        {/* Summary text @ 18.5s, "still expensive" @ 21.8s */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 18.5, ...preciseSpring }}
        >
          <span style={{ fontSize: '0.9vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            She tweaks the change address until the fake tx's TXID matches
          </span>
        </motion.div>
      </CE>

      {/* ═══════ SCENE 9: Alice (Attacker) character ═══════ */}
      {/* "Alice broadcasts" @ 1.2s */}
      <CE s={s} enter={9} exit={10} delay={0.6}
        className="absolute left-[3vw] top-[26vh]">
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, ...dangerSpring }}
        >
          <div style={{
            width: '6vw', height: '6vw', borderRadius: '50%', overflow: 'hidden',
            border: `0.2vw solid ${C.danger}`,
            boxShadow: `0 0 20px ${C.danger}30`,
          }}>
            <img src="/alice.png" alt="Alice" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '0.9vw', fontWeight: 600, color: C.danger }}>Alice (Attacker)</span>
        </motion.div>
      </CE>

      {/* ═══════ SCENE 10: HIGHLIGHT — Node splits (label below) ═══════ */}
      {/* "extra level" @ 19.7s */}
      <CE s={s} enter={10} exit={11} delay={19.7}
        className="absolute top-[72vh] left-0 right-0 flex justify-center">
        <motion.p style={{
          fontSize: '1.4vw', fontWeight: 600, color: C.danger, textAlign: 'center',
          textShadow: `0 0 20px ${C.danger}40`,
        }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 19.7 }}
        >The tree now has a fake extra level</motion.p>
      </CE>

      {/* ═══════ SCENE 11: Two Views — Reality vs Alice's Lie ═══════ */}
      {/* "two ways to read" @ 0.6s */}
      <CE s={s} enter={11} exit={12} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '6vh' }}>
        <TwoViewTrees delay={0.6} />
      </CE>

      {/* Scene 11: bottom text — "the whole trick" @ 18.6s */}
      <CE s={s} enter={11} exit={12} delay={18.6}
        className="absolute bottom-[6vh] left-0 right-0 flex justify-center">
        <motion.p style={{ fontSize: '1.1vw', color: C.danger, textAlign: 'center', fontWeight: 600 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 18.6 }}
        >Alice builds a Merkle proof from a fake child to the same root</motion.p>
      </CE>

      {/* ═══════ SCENE 12: SPV Fooled (REWRITTEN — stolen PoW + 5 BTC) ═══════ */}
      {/* Audio: 31.7s — "Step three. Alice sends this fake proof..." */}
      <CE s={s} enter={12} exit={13} delay={0.3}
        className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '8vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3vw' }}>
          {/* Alice (Attacker) — "fake proof" @ 2.0s */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vh' }}
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, ...dangerSpring }}
          >
            <div style={{
              width: '6.5vw', height: '6.5vw', borderRadius: '50%', overflow: 'hidden',
              border: `0.2vw solid ${C.danger}`,
              boxShadow: `0 0 20px ${C.danger}40`,
            }}>
              <img src="/alice.png" alt="Alice" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.9vw', fontWeight: 600, color: C.danger }}>Alice (Attacker)</span>
          </motion.div>

          {/* Arrow + annotations — "fake proof" @ 2.0s */}
          <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6vh' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
          >
            <span style={{ fontSize: '0.75vw', color: C.danger, fontFamily: 'var(--font-mono)' }}>sends fake proof</span>
            <Arrow delay={2.3} direction="right" length="7vw" color={C.danger} />
            {/* "using real miners' proof of work" — between checks and result */}
            <motion.span style={{
              fontSize: '0.65vw', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)',
              textAlign: 'center', maxWidth: '8vw', lineHeight: 1.3,
            }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 15.0 }}
            >using real miners' proof of work</motion.span>
          </motion.div>

          {/* SPV Wallet — appears around 3.5s */}
          <motion.div style={{
            padding: '2.5vh 2vw', borderRadius: '1vw',
            backgroundColor: 'rgba(255,255,255,0.05)', border: '0.15vw solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh', width: '20vw',
          }}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.5, ...springs.snappy }}
          >
            <span style={{ fontSize: '1.2vw', fontWeight: 600, color: '#FFF' }}>SPV Wallet</span>

            {/* Fake payment display — "five B.T.C." context */}
            <motion.div style={{
              padding: '0.8vh 1.2vw', borderRadius: '0.4vw', width: '100%',
              backgroundColor: `${C.danger}15`, border: `0.1vw solid ${C.danger}25`,
              textAlign: 'center',
            }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 4.5 }}
            >
              <span style={{ fontSize: '1.1vw', fontFamily: 'var(--font-mono)', color: C.danger, fontWeight: 700 }}>
                "5 BTC to Bob"
              </span>
            </motion.div>

            {/* "leaf hash to the parent" @ 6.0, "path reach the root" @ 8.8, "root match the block header" @ 11.4 */}
            {['Leaf hash ✓', 'Parent hash ✓', 'Root match ✓'].map((step, i) => (
              <motion.div key={i} style={{
                padding: '0.7vh 1vw', borderRadius: '0.4vw',
                backgroundColor: `${C.fix}15`, border: `0.1vw solid ${C.fix}30`,
                width: '100%', textAlign: 'center',
              }}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: [6.0, 8.8, 11.4][i], ...preciseSpring }}
              >
                <span style={{ fontSize: '0.9vw', fontFamily: 'var(--font-mono)', color: C.fix, fontWeight: 600 }}>{step}</span>
              </motion.div>
            ))}

            {/* "Every check passes" @ 18.6s */}
            <motion.div style={{ fontSize: '2.8vw', color: C.fix, lineHeight: 1, position: 'relative' }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 18.6, ...springs.bouncy }}
            >
              ✓
              {/* "never mined" @ 24.7s, "doesn't exist" @ 25.9s */}
              <motion.span style={{
                position: 'absolute', top: '-0.3vw', left: '0.2vw',
                fontSize: '3.5vw', fontWeight: 900, color: C.danger,
                textShadow: `0 0 20px ${C.danger}`,
              }}
                initial={{ scale: 3, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 24.7, ...dangerSpring }}
              >✗</motion.span>
            </motion.div>
          </motion.div>
        </div>
      </CE>

      {/* Scene 12: Result label — "doesn't exist" @ 25.9s */}
      <CE s={s} enter={12} exit={13} delay={25.9}
        className="absolute bottom-[6vh] left-0 right-0 flex justify-center">
        <HighlightBox delay={25.9} color={C.danger} dark padding="1.5vh 3vw">
          <span style={{ fontSize: '1.3vw', fontWeight: 600, color: '#FFF' }}>
            Light wallet accepts a fake 5 BTC payment
          </span>
        </HighlightBox>
      </CE>

      {/* ═══════ SCENE 13: Feasibility — field-by-field last 32B (REWRITTEN) ═══════ */}
      {/* Audio: 35.0s — "Now, you might ask — how feasible is this really?..." */}
      <CE s={s} enter={13} exit={14} delay={2.9}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5vh]"
        style={{ paddingTop: '6vh' }}>

        {/* Field-by-field ByteBar of last 32 bytes */}
        {/* "last thirty-two bytes" @ 3.9s */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.4, ...preciseSpring }}
        >
          <ByteBar delay={3.9} label="Last 32 bytes — field by field" width="60vw"
            segmentOpacity={s13SegOpacity}
            segments={[
            { label: 'TXID tail', bytes: 5, color: C.collision },
            { label: 'idx', bytes: 4, color: C.manipulable },
            { label: 'sigSz', bytes: 1, color: C.collision },
            { label: 'Seq', bytes: 4, color: C.freeChoice },
            { label: 'outCnt', bytes: 1, color: C.collision },
            { label: 'value', bytes: 8, color: C.manipulable },
            { label: 'scrSz', bytes: 1, color: C.collision },
            { label: 'Script', bytes: 4, color: C.freeChoice },
            { label: 'lock', bytes: 4, color: C.manipulable },
          ]} />

          {/* Color-coded legend — "eight bytes are constrained" @ 8.7s */}
          <motion.div style={{ display: 'flex', gap: '2.5vw', flexWrap: 'wrap', justifyContent: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 8.7 }}
          >
            {[
              { color: C.collision, label: 'Constrained — must match (collision bits)', bytes: '8B' },
              { color: C.manipulable, label: 'Manipulable — attacker controls', bytes: '16B' },
              { color: C.freeChoice, label: 'Free — any value works', bytes: '8B' },
            ].map((item, i) => (
              <motion.div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4vw' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 8.7 + i * 0.5 }}
              >
                <div style={{
                  width: '0.8vw', height: '0.8vw', borderRadius: '0.15vw',
                  backgroundColor: `${item.color}40`, border: `0.08vw solid ${item.color}`,
                }} />
                <span style={{ fontSize: '0.75vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.label} ({item.bytes})
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Feasibility cards — "twenty-four bytes" @ 16.6s, "seventy bits of work" @ 21.7s */}
        <div style={{ display: 'flex', gap: '4vw', alignItems: 'center' }}>
          <motion.div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh',
            padding: '2vh 2vw', borderRadius: '0.8vw',
            backgroundColor: 'rgba(28,28,28,0.03)', border: '0.12vw solid rgba(28,28,28,0.08)',
          }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 16.6, ...springs.snappy }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Full hash collision</span>
            <span style={{ fontSize: '2.5vw', fontWeight: 700, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.4 }}>
              2²⁵⁶</span>
            <span style={{ fontSize: '0.9vw', color: 'var(--color-text-muted)', opacity: 0.5 }}>impossible</span>
          </motion.div>

          <motion.span style={{ fontSize: '1.3vw', fontWeight: 700, color: 'var(--color-text-muted)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 18.0 }}
          >vs</motion.span>

          {/* "seventy bits of work" @ 21.7s */}
          <motion.div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh',
            padding: '2vh 2vw', borderRadius: '0.8vw',
            backgroundColor: `${C.danger}08`, border: `0.15vw solid ${C.danger}30`,
          }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 21.7, ...dangerSpring }}
          >
            <span style={{ fontSize: '0.8vw', fontWeight: 600, color: C.danger, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              ~70 collision bits</span>
            <span style={{ fontSize: '2.5vw', fontWeight: 700, color: C.danger, fontFamily: 'var(--font-mono)' }}>
              ~2⁷⁰</span>
            <span style={{ fontSize: '0.9vw', color: C.danger }}>expensive but feasible</span>
          </motion.div>
        </div>

        <motion.p style={{ fontSize: '0.9vw', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.6 }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 24.0 }}
        >CVE-2017-12842 — ~2⁷⁰ work to exploit</motion.p>
      </CE>

      {/* ═══════ SCENE 14: BIP 54 Fix ═══════ */}
      {/* Audio: 18.3s — "The fix? Beautifully simple..." */}
      <CE s={s} enter={14} exit={15} delay={1.1}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]">
        {/* "bip fifty-four" badge @ 2.0s */}
        <Badge delay={2.0} variant="success" size="md">BIP 54</Badge>
        {/* "ban all sixty-four" heading @ 3.3s */}
        <motion.h2 style={{ fontSize: '3vw', fontWeight: 700, color: C.fix, textAlign: 'center' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.3, ...springs.snappy }}
        >Ban all 64-byte transactions</motion.h2>
        {/* "Nothing breaks" card @ 5.5s */}
        <motion.div style={{
          display: 'flex', alignItems: 'center', gap: '1.5vw',
          padding: '2vh 3vw', borderRadius: '0.8vw',
          backgroundColor: `${C.fix}10`, border: `0.12vw solid ${C.fix}30`,
        }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 5.5, ...springs.bouncy }}
        >
          {/* checkmark @ 5.9s */}
          <motion.span style={{ fontSize: '2.5vw', lineHeight: 1 }}
            initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 5.9, ...springs.bouncy }}
          ><span style={{ color: C.fix }}>&#10003;</span></motion.span>
          <span style={{ fontSize: '1.4vw', fontWeight: 600, color: C.fix, fontFamily: 'var(--font-mono)' }}>
            Nothing breaks.
          </span>
        </motion.div>
        {/* "Consensus Cleanup" @ 8.3s */}
        <motion.p style={{ fontSize: '1.1vw', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '50vw' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 8.3 }}
        >Part of the Consensus Cleanup softfork</motion.p>
      </CE>

      {/* ═══════ SCENE 15: CTA ═══════ */}
      <CE s={s} enter={15} delay={0.3}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5vh]">
        {/* "bitcoin devs" @ 0.4s */}
        <motion.h2 style={{ fontSize: '2.8vw', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...springs.bouncy }}
        >Follow @bitcoin_devs</motion.h2>
        {/* "Next up" @ 2.3s */}
        <motion.p style={{ fontSize: '1.3vw', color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 2.3 }}
        >Next: Worst-Case Block Validation Time</motion.p>
      </CE>

      <DevControls player={player} />
    </div>
  );
}
