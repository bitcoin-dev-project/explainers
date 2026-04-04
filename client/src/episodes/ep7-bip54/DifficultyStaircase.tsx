/**
 * DifficultyStaircase — Canvas 2D signature visual for EP7
 *
 * Simulates Bitcoin's difficulty adjustment across retarget periods.
 * 5 modes driven by scene: HEALTHY → BOUNDARY → ATTACK → COLLAPSE → FIXED
 *
 * Underlying model: difficulty recalculation (new_diff = old_diff × claimed_time / target_time)
 * Continuous life: particles flow, digits shimmer, step edges glow
 * Layered rendering: grid → plateaus → particles → timestamps → labels → fix overlay
 */
import { useRef, useEffect } from 'react';
import { EP_COLORS, COLLAPSE_SEQUENCE } from './constants';

// ─── Types ───────────────────────────────────────────────────────────
type Mode = 'HEALTHY' | 'BOUNDARY' | 'ATTACK' | 'COLLAPSE' | 'FIXED';

interface Particle {
  x: number;          // 0-1 along plateau
  yOff: number;       // Brownian jitter
  plateau: number;    // which plateau index
  speed: number;      // vx per ms
  radius: number;
  alpha: number;
}

interface PlateauState {
  height: number;      // current normalized height (0-1)
  targetHeight: number;
  r: number; g: number; b: number;
  tr: number; tg: number; tb: number;  // target color
  glowAlpha: number;
}

interface LabelEntry {
  text: string;
  x: number; y: number;       // normalized 0-1
  fontSize: number;            // in canvas units
  color: string;
  alpha: number;
  targetAlpha: number;
  font: string;                // 'mono' | 'display' | 'body'
  align?: CanvasTextAlign;
}

interface SimState {
  mode: Mode;
  prevMode: Mode;
  modeT: number;               // 0-1 transition progress
  modeStartMs: number;
  elapsedMs: number;
  particles: Particle[];
  plateaus: PlateauState[];
  labels: LabelEntry[];
  collapseStep: number;        // which plateau is currently collapsing
  collapseProgress: number;    // 0-1 per step
  fixProgress: number;         // 0-1 for the fix rebuild
  boundaryPulse: number;       // 0-2π cyclic
  spawnAccum: number;          // accumulated ms for particle spawning
  timestampDivergence: number; // 0-1 how far claimed time has diverged
  counterText: string;
  counterAlpha: number;
}

// ─── Constants ───────────────────────────────────────────────────────
const NUM_PLATEAUS = 8;
const MAX_PARTICLES = 220;
const HEALTHY_HEIGHT = 0.65;
const PLATEAU_WIDTH = 0.11;    // each plateau width in normalized coords
const PLATEAU_GAP = 0.005;
const PLATEAU_X_START = 0.04;
const PLATEAU_Y_BASE = 0.88;   // bottom of the staircase
const BOUNDARY_IDX = 3;        // junction between plateau 3 & 4
const LERP_SPEED = 0.003;      // per ms
const COLLAPSE_STEP_DELAY = 500; // ms between each plateau collapsing

const BLUE = { r: 59, g: 130, b: 246 };
const RED = { r: 239, g: 68, b: 68 };
const GREEN = { r: 34, g: 197, b: 94 };
const DARK = { r: 30, g: 41, b: 59 };

// ─── Helpers ─────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, Math.max(0, t)); }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function modeFromScene(scene: number): Mode {
  if (scene <= 2) return 'HEALTHY';
  if (scene === 3) return 'BOUNDARY';
  if (scene === 4) return 'ATTACK';
  if (scene === 5) return 'COLLAPSE';
  return 'FIXED';
}

function fontStr(font: string, size: number): string {
  switch (font) {
    case 'mono': return `${size}px "JetBrains Mono", monospace`;
    case 'display': return `bold ${size}px "Montserrat", sans-serif`;
    default: return `${size}px "Quicksand", sans-serif`;
  }
}

// ─── Initial state ───────────────────────────────────────────────────
function createInitialState(): SimState {
  const plateaus: PlateauState[] = [];
  for (let i = 0; i < NUM_PLATEAUS; i++) {
    // Slight variation in healthy height for visual interest
    const h = HEALTHY_HEIGHT + (Math.sin(i * 1.3) * 0.03);
    plateaus.push({
      height: h, targetHeight: h,
      r: BLUE.r, g: BLUE.g, b: BLUE.b,
      tr: BLUE.r, tg: BLUE.g, tb: BLUE.b,
      glowAlpha: 0,
    });
  }
  return {
    mode: 'HEALTHY', prevMode: 'HEALTHY',
    modeT: 1, modeStartMs: 0, elapsedMs: 0,
    particles: [], plateaus, labels: [],
    collapseStep: 0, collapseProgress: 0,
    fixProgress: 0, boundaryPulse: 0,
    spawnAccum: 0, timestampDivergence: 0,
    counterText: '', counterAlpha: 0,
  };
}

// ─── Plateau geometry ────────────────────────────────────────────────
function plateauRect(idx: number, height: number, cw: number, ch: number) {
  const x = (PLATEAU_X_START + idx * (PLATEAU_WIDTH + PLATEAU_GAP)) * cw;
  const w = PLATEAU_WIDTH * cw;
  const h = height * ch * 0.55;
  const y = PLATEAU_Y_BASE * ch - h;
  return { x, y, w, h };
}

// ─── Update simulation ──────────────────────────────────────────────
function updateSim(st: SimState, dt: number, cw: number, ch: number) {
  st.elapsedMs += dt;
  st.boundaryPulse += dt * 0.004;

  // Mode transition easing
  if (st.modeT < 1) {
    st.modeT = clamp(st.modeT + dt * 0.0015, 0, 1);
  }

  const t = LERP_SPEED * dt;

  // ── Update plateau heights & colors by mode ──
  const { mode } = st;

  if (mode === 'HEALTHY' || mode === 'BOUNDARY') {
    for (let i = 0; i < NUM_PLATEAUS; i++) {
      const baseH = HEALTHY_HEIGHT + Math.sin(i * 1.3) * 0.03;
      st.plateaus[i].targetHeight = baseH;
      st.plateaus[i].tr = BLUE.r;
      st.plateaus[i].tg = BLUE.g;
      st.plateaus[i].tb = BLUE.b;
    }
    st.timestampDivergence = lerp(st.timestampDivergence, 0, t * 2);
  }

  if (mode === 'ATTACK') {
    // First dropped plateau after the boundary
    for (let i = 0; i < NUM_PLATEAUS; i++) {
      if (i <= BOUNDARY_IDX) {
        st.plateaus[i].targetHeight = HEALTHY_HEIGHT + Math.sin(i * 1.3) * 0.03;
        st.plateaus[i].tr = BLUE.r; st.plateaus[i].tg = BLUE.g; st.plateaus[i].tb = BLUE.b;
      } else if (i === BOUNDARY_IDX + 1) {
        st.plateaus[i].targetHeight = HEALTHY_HEIGHT * 0.3;
        st.plateaus[i].tr = RED.r; st.plateaus[i].tg = RED.g; st.plateaus[i].tb = RED.b;
      } else {
        st.plateaus[i].targetHeight = HEALTHY_HEIGHT + Math.sin(i * 1.3) * 0.03;
        st.plateaus[i].tr = BLUE.r; st.plateaus[i].tg = BLUE.g; st.plateaus[i].tb = BLUE.b;
      }
    }
    st.timestampDivergence = lerp(st.timestampDivergence, 0.7, t * 1.5);
  }

  if (mode === 'COLLAPSE') {
    // Progressive collapse: each plateau drops in sequence
    const collapseElapsed = st.elapsedMs - st.modeStartMs;
    for (let i = 0; i < NUM_PLATEAUS; i++) {
      const delay = i * COLLAPSE_STEP_DELAY;
      if (collapseElapsed > delay) {
        const progress = clamp((collapseElapsed - delay) / 800, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        // Each successive plateau drops lower
        const dropFactor = Math.max(0.03, 1 - (i + 1) * 0.12);
        st.plateaus[i].targetHeight = HEALTHY_HEIGHT * dropFactor;
        st.plateaus[i].tr = lerp(BLUE.r, RED.r, eased);
        st.plateaus[i].tg = lerp(BLUE.g, RED.g, eased);
        st.plateaus[i].tb = lerp(BLUE.b, RED.b, eased);
      }
    }
    st.timestampDivergence = lerp(st.timestampDivergence, 1, t * 2);

    // Update counter text based on elapsed
    const seqIdx = Math.min(
      COLLAPSE_SEQUENCE.length - 1,
      Math.floor(collapseElapsed / (COLLAPSE_STEP_DELAY * 1.6))
    );
    st.counterText = COLLAPSE_SEQUENCE[seqIdx]?.label ?? '';
    st.counterAlpha = lerp(st.counterAlpha, 1, t * 3);
  } else {
    st.counterAlpha = lerp(st.counterAlpha, 0, t * 3);
  }

  if (mode === 'FIXED') {
    st.fixProgress = lerp(st.fixProgress, 1, t * 1.5);
    for (let i = 0; i < NUM_PLATEAUS; i++) {
      const rebuildDelay = i * 0.08;
      const progress = clamp(st.fixProgress - rebuildDelay, 0, 1);
      const baseH = HEALTHY_HEIGHT + Math.sin(i * 1.3) * 0.03;
      st.plateaus[i].targetHeight = lerp(st.plateaus[i].targetHeight, baseH, progress);
      st.plateaus[i].tr = lerp(st.plateaus[i].tr, GREEN.r, progress * t * 5);
      st.plateaus[i].tg = lerp(st.plateaus[i].tg, GREEN.g, progress * t * 5);
      st.plateaus[i].tb = lerp(st.plateaus[i].tb, GREEN.b, progress * t * 5);
    }
    st.timestampDivergence = lerp(st.timestampDivergence, 0, t * 2);
  }

  // Lerp plateau heights and colors toward targets
  for (const p of st.plateaus) {
    p.height = lerp(p.height, p.targetHeight, t * 2);
    p.r = lerp(p.r, p.tr, t * 2);
    p.g = lerp(p.g, p.tg, t * 2);
    p.b = lerp(p.b, p.tb, t * 2);
    // Glow pulses on step edges
    p.glowAlpha = 0.3 + 0.2 * Math.sin(st.elapsedMs * 0.003 + p.height * 10);
  }

  // ── Particles ──
  // Spawn rate depends on mode
  let spawnInterval = 300;
  if (mode === 'COLLAPSE') {
    const collapseElapsed = st.elapsedMs - st.modeStartMs;
    spawnInterval = Math.max(20, 300 - collapseElapsed * 0.05);
  } else if (mode === 'ATTACK') {
    spawnInterval = 200;
  }

  st.spawnAccum += dt;
  while (st.spawnAccum > spawnInterval && st.particles.length < MAX_PARTICLES) {
    st.spawnAccum -= spawnInterval;
    const pIdx = Math.floor(Math.random() * NUM_PLATEAUS);
    const speedMult = mode === 'COLLAPSE'
      ? 2 + (st.elapsedMs - st.modeStartMs) * 0.001
      : mode === 'ATTACK' ? 1.5 : 1;
    st.particles.push({
      x: 0,
      yOff: (Math.random() - 0.5) * 0.01,
      plateau: pIdx,
      speed: (0.0003 + Math.random() * 0.0002) * speedMult,
      radius: 2 + Math.random() * 2,
      alpha: 0.7 + Math.random() * 0.3,
    });
  }

  // Update particles
  for (let i = st.particles.length - 1; i >= 0; i--) {
    const p = st.particles[i];
    p.x += p.speed * dt;
    p.yOff += (Math.random() - 0.5) * 0.0003 * dt; // Brownian y-jitter
    p.yOff = clamp(p.yOff, -0.02, 0.02);
    if (p.x > 1.05) {
      st.particles.splice(i, 1);
    }
  }

  // Cap particles
  while (st.particles.length > MAX_PARTICLES) {
    st.particles.shift();
  }
}

// ─── Draw frame ──────────────────────────────────────────────────────
function drawFrame(ctx: CanvasRenderingContext2D, st: SimState, cw: number, ch: number) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw / dpr, ch / dpr);

  const W = cw / dpr;
  const H = ch / dpr;

  // ── Layer 0: Background grid ──
  ctx.strokeStyle = 'rgba(148,163,184,0.04)';
  ctx.lineWidth = 1;
  const gridSpacing = 40;
  const gridDrift = (st.elapsedMs * 0.005) % gridSpacing;
  for (let x = -gridSpacing + gridDrift; x < W; x += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -gridSpacing + gridDrift * 0.5; y < H; y += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Scanline overlay ──
  ctx.fillStyle = 'rgba(15,23,42,0.03)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }

  // ── Layer 1: Plateaus ──
  for (let i = 0; i < NUM_PLATEAUS; i++) {
    const p = st.plateaus[i];
    const rect = plateauRect(i, p.height, W, H);

    // Gradient fill
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, `rgb(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)})`);
    grad.addColorStop(1, `rgb(${Math.round(p.r * 0.3 + DARK.r * 0.7)},${Math.round(p.g * 0.3 + DARK.g * 0.7)},${Math.round(p.b * 0.3 + DARK.b * 0.7)})`);

    // Rounded top corners
    const cornerR = 4;
    ctx.beginPath();
    ctx.moveTo(rect.x + cornerR, rect.y);
    ctx.lineTo(rect.x + rect.w - cornerR, rect.y);
    ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + cornerR);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + cornerR);
    ctx.quadraticCurveTo(rect.x, rect.y, rect.x + cornerR, rect.y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Edge glow
    ctx.save();
    ctx.shadowColor = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},${p.glowAlpha})`;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},0.5)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Difficulty value label on each step
    const diffVal = Math.round(p.height * 100);
    ctx.font = fontStr('mono', 11);
    ctx.fillStyle = `rgba(241,245,249,${0.5 + p.glowAlpha * 0.3})`;
    ctx.textAlign = 'center';
    ctx.fillText(`${diffVal}`, rect.x + rect.w / 2, rect.y + 16);
  }

  // ── Layer 2: Particles ──
  for (const part of st.particles) {
    const plat = st.plateaus[part.plateau];
    if (!plat) continue;
    const rect = plateauRect(part.plateau, plat.height, W, H);
    const px = rect.x + part.x * rect.w;
    const py = rect.y + rect.h * 0.5 + part.yOff * H;

    ctx.save();
    ctx.shadowColor = `rgba(${Math.round(plat.r)},${Math.round(plat.g)},${Math.round(plat.b)},0.6)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, py, part.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(plat.r + 40)},${Math.round(plat.g + 40)},${Math.round(plat.b + 40)},${part.alpha})`;
    ctx.fill();
    ctx.restore();
  }

  // ── Layer 3: Timestamp tracks ──
  if (st.mode !== 'HEALTHY' || st.modeT < 1) {
    drawTimestampTracks(ctx, st, W, H);
  }
  // Show timestamps when camera is on Zone B (scenes 2-6)
  if (st.mode === 'HEALTHY') {
    drawTimestampTracks(ctx, st, W, H);
  }

  // ── Layer 4: Boundary highlight ──
  if (st.mode === 'BOUNDARY' || st.mode === 'ATTACK' || st.mode === 'COLLAPSE') {
    drawBoundaryBlock(ctx, st, W, H);
  }

  // ── Layer 5: Labels per mode ──
  drawModeLabels(ctx, st, W, H);

  // ── Layer 6: Fix overlay ──
  if (st.mode === 'FIXED' || st.fixProgress > 0.01) {
    drawFixOverlay(ctx, st, W, H);
  }
}

// ─── Timestamp tracks ────────────────────────────────────────────────
function drawTimestampTracks(ctx: CanvasRenderingContext2D, st: SimState, W: number, H: number) {
  const topY = PLATEAU_Y_BASE * H - HEALTHY_HEIGHT * H * 0.55 - 25;
  const botY = topY + 16;

  // Real time track (blue, straight)
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = EP_COLORS.difficulty + '80';
  ctx.lineWidth = 1.5;
  const startX = PLATEAU_X_START * W;
  const endX = (PLATEAU_X_START + NUM_PLATEAUS * (PLATEAU_WIDTH + PLATEAU_GAP)) * W;
  ctx.beginPath(); ctx.moveTo(startX, topY); ctx.lineTo(endX, topY); ctx.stroke();

  // Claimed time track (purple, may diverge)
  const divergeOffset = st.timestampDivergence * 60;
  ctx.strokeStyle = EP_COLORS.timestamp + '80';
  ctx.beginPath();
  ctx.moveTo(startX, botY);
  // In attack/collapse, the claimed track zigzags at boundaries
  for (let i = 0; i < NUM_PLATEAUS; i++) {
    const bx = (PLATEAU_X_START + (i + 1) * (PLATEAU_WIDTH + PLATEAU_GAP)) * W;
    if (i === BOUNDARY_IDX && st.timestampDivergence > 0.05) {
      // Jerk backward at boundary
      ctx.lineTo(bx - divergeOffset, botY + divergeOffset * 0.3);
      ctx.lineTo(bx, botY);
    } else {
      ctx.lineTo(bx, botY);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.font = fontStr('mono', 10);
  ctx.textAlign = 'left';
  ctx.fillStyle = EP_COLORS.difficulty + 'B0';
  ctx.fillText('Real time', startX, topY - 4);
  ctx.fillStyle = EP_COLORS.timestamp + 'B0';
  ctx.fillText('Claimed time', startX, botY + 14);
}

// ─── Boundary block highlight ────────────────────────────────────────
function drawBoundaryBlock(ctx: CanvasRenderingContext2D, st: SimState, W: number, H: number) {
  const p = st.plateaus[BOUNDARY_IDX];
  const rect = plateauRect(BOUNDARY_IDX, p.height, W, H);
  const bx = rect.x + rect.w;  // right edge of plateau = boundary
  const by = rect.y + rect.h * 0.3;
  const radius = 8 + 4 * Math.sin(st.boundaryPulse);

  // Dual-color block
  ctx.save();
  ctx.shadowColor = `rgba(239,68,68,${0.4 + 0.3 * Math.sin(st.boundaryPulse)})`;
  ctx.shadowBlur = 12 + 8 * Math.sin(st.boundaryPulse);

  // Left half — blue
  ctx.beginPath();
  ctx.arc(bx, by, radius, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fillStyle = EP_COLORS.difficulty;
  ctx.fill();

  // Right half — red
  ctx.beginPath();
  ctx.arc(bx, by, radius, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fillStyle = EP_COLORS.accent;
  ctx.fill();

  ctx.restore();

  // Dashed circle ring
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = EP_COLORS.accentAlt;
  const dashOff = st.elapsedMs * 0.02;
  ctx.lineDashOffset = dashOff;
  ctx.beginPath();
  ctx.arc(bx, by, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Labels
  const alpha = st.mode === 'BOUNDARY' ? 1 : 0.7;
  ctx.font = fontStr('mono', 11);
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(59,130,246,${alpha})`;
  ctx.fillText('Last block of Period N', bx, by - radius - 14);
  ctx.fillStyle = `rgba(239,68,68,${alpha})`;
  ctx.fillText('First block of Period N+1', bx, by + radius + 20);
}

// ─── Mode-specific labels ────────────────────────────────────────────
function drawModeLabels(ctx: CanvasRenderingContext2D, st: SimState, W: number, H: number) {
  const { mode } = st;

  if (mode === 'HEALTHY') {
    const firstRect = plateauRect(0, st.plateaus[0].height, W, H);
    ctx.font = fontStr('mono', 12);
    ctx.textAlign = 'left';
    ctx.fillStyle = EP_COLORS.text + 'D0';
    ctx.fillText('2,016 blocks per period', firstRect.x, firstRect.y - 8);
    ctx.textAlign = 'right';
    ctx.fillText('~2 weeks', firstRect.x + firstRect.w, firstRect.y - 8);

    // Junction label
    const jRect = plateauRect(2, st.plateaus[2].height, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = EP_COLORS.muted + 'C0';
    ctx.font = fontStr('mono', 10);
    ctx.fillText('Difficulty recalculates every period', jRect.x + jRect.w, PLATEAU_Y_BASE * H + 16);

    // Formula
    ctx.font = fontStr('mono', 12);
    ctx.textAlign = 'center';
    ctx.fillStyle = EP_COLORS.highlight;
    ctx.fillText('new_diff = old_diff × (time_elapsed / target_time)', W * 0.5, PLATEAU_Y_BASE * H + 40);
  }

  if (mode === 'ATTACK') {
    // Attacker label
    ctx.font = fontStr('display', 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = EP_COLORS.accent;
    ctx.fillText('⚠ 51% attacker', W * 0.95, 30);

    // Timestamp labels
    const p = st.plateaus[BOUNDARY_IDX];
    const rect = plateauRect(BOUNDARY_IDX, p.height, W, H);
    const bx = rect.x + rect.w;

    ctx.font = fontStr('mono', 11);
    ctx.textAlign = 'left';
    ctx.fillStyle = EP_COLORS.difficulty;
    ctx.fillText('Real: Jan 15, 2026', bx + 20, rect.y + 10);
    ctx.fillStyle = EP_COLORS.accent;
    ctx.fillText('Claimed: Dec 1, 2025', bx + 20, rect.y + 26);

    // Gap bracket
    ctx.strokeStyle = EP_COLORS.accent + 'CC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + 16, rect.y + 4);
    ctx.lineTo(bx + 16, rect.y + 28);
    ctx.stroke();
    ctx.font = fontStr('mono', 10);
    ctx.fillStyle = EP_COLORS.accent;
    ctx.fillText('46 days faked', bx + 24, rect.y + 44);

    // Dropped step label
    const droppedRect = plateauRect(BOUNDARY_IDX + 1, st.plateaus[BOUNDARY_IDX + 1].height, W, H);
    ctx.font = fontStr('mono', 11);
    ctx.textAlign = 'center';
    ctx.fillStyle = EP_COLORS.accent + 'E0';
    ctx.fillText('Period 202: difficulty ÷3.3', droppedRect.x + droppedRect.w / 2, droppedRect.y + droppedRect.h + 18);
  }

  if (mode === 'COLLAPSE') {
    // Climax labels
    const collapseElapsed = st.elapsedMs - st.modeStartMs;

    if (collapseElapsed > 3500) {
      ctx.font = fontStr('display', 32);
      ctx.textAlign = 'center';
      ctx.fillStyle = EP_COLORS.accent;
      ctx.save();
      ctx.shadowColor = EP_COLORS.accent + '60';
      ctx.shadowBlur = 20;
      ctx.fillText('6 blocks per second', W * 0.5, H * 0.2);
      ctx.restore();
    }
    if (collapseElapsed > 4500) {
      ctx.font = fontStr('display', 18);
      ctx.fillStyle = EP_COLORS.highlight;
      ctx.textAlign = 'center';
      ctx.fillText('All remaining BTC mined in ~40 days', W * 0.5, H * 0.2 + 40);
    }
  }
}

// ─── Fix overlay ─────────────────────────────────────────────────────
function drawFixOverlay(ctx: CanvasRenderingContext2D, st: SimState, W: number, H: number) {
  const progress = st.fixProgress;
  if (progress < 0.01) return;

  // Green constraint line at boundary
  const pRect = plateauRect(BOUNDARY_IDX, st.plateaus[BOUNDARY_IDX].height, W, H);
  const lineX1 = pRect.x + pRect.w - 10;
  const lineX2 = lineX1 + PLATEAU_WIDTH * W + 20;
  const lineY = pRect.y + 4;

  ctx.save();
  ctx.globalAlpha = progress;
  ctx.shadowColor = EP_COLORS.fix + '80';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = EP_COLORS.fix;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(lineX1, lineY);
  ctx.lineTo(lerp(lineX1, lineX2, progress), lineY);
  ctx.stroke();

  // Constraint label
  if (progress > 0.3) {
    ctx.font = fontStr('mono', 10);
    ctx.textAlign = 'left';
    ctx.fillStyle = EP_COLORS.fix;
    ctx.globalAlpha = clamp((progress - 0.3) * 2, 0, 1);
    ctx.fillText('New rule: timestamp within 2 hours', lineX1, lineY - 10);
  }

  // Checkmark
  if (progress > 0.7) {
    const chkAlpha = clamp((progress - 0.7) * 3, 0, 1);
    ctx.globalAlpha = chkAlpha;
    ctx.strokeStyle = EP_COLORS.fix;
    ctx.lineWidth = 3;
    const cx = lineX2 + 15;
    const cy = lineY;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx - 2, cy + 5);
    ctx.lineTo(cx + 6, cy - 6);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────
interface Props {
  scene: number;
  style?: React.CSSProperties;
}

export default function DifficultyStaircase({ scene, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SimState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevModeRef = useRef<Mode>('HEALTHY');

  // Mode transitions
  const mode = modeFromScene(scene);
  useEffect(() => {
    const st = stateRef.current;
    if (mode !== st.mode) {
      st.prevMode = st.mode;
      st.mode = mode;
      st.modeT = 0;
      st.modeStartMs = st.elapsedMs;
      if (mode === 'FIXED') {
        st.fixProgress = 0;
      }
      if (mode === 'COLLAPSE') {
        st.collapseStep = 0;
        st.collapseProgress = 0;
      }
    }
    prevModeRef.current = mode;
  }, [mode]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function tick(timestamp: number) {
      const dt = lastTimeRef.current ? Math.min(timestamp - lastTimeRef.current, 50) : 16;
      lastTimeRef.current = timestamp;

      const c = canvasRef.current;
      if (!c) return;

      updateSim(stateRef.current, dt, c.width, c.height);
      drawFrame(ctx!, stateRef.current, c.width, c.height);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
    }

    const obs = new ResizeObserver(resize);
    obs.observe(container);
    resize();
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ ...style, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
