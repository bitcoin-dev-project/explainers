import { useRef, useEffect, useCallback } from 'react';
import { EP_COLORS, type CurveMode, curveYPositive, CV, CURVE_POINTS } from './constants';

// ── Types ──
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  opacity: number;
}

interface Fragment {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vr: number;
  w: number; h: number;
  opacity: number;
}

interface CanvasState {
  mode: CurveMode;
  modeStart: number;
  particles: Particle[];
  quantumParticles: Particle[];
  fragments: Fragment[];
  W: number; H: number;
}

interface CurveCanvasProps {
  mode: CurveMode;
  scene: number;
  style?: React.CSSProperties;
}

// ── Coordinate mapping ──
const toX = (mx: number, w: number) => ((mx - CV.xMin) / (CV.xMax - CV.xMin)) * w;
const toY = (my: number, h: number) => (1 - (my - CV.yMin) / (CV.yMax - CV.yMin)) * h;
const fromX = (cx: number, w: number) => CV.xMin + (cx / w) * (CV.xMax - CV.xMin);

// Curve start x (where y²=x³+7 starts: x = -7^(1/3) ≈ -1.913)
const CURVE_START_X = -1.913;

// ── Particle factories ──
function makeParticles(count: number, color: string): Particle[] {
  return Array.from({ length: count }, () => {
    const x = CV.xMin + Math.random() * (CV.xMax - CV.xMin);
    const yp = curveYPositive(x);
    const onCurve = yp !== null;
    return {
      x,
      y: onCurve ? (Math.random() > 0.5 ? yp : -yp) : CV.yMin + Math.random() * (CV.yMax - CV.yMin),
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
      color,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    };
  });
}

function makeFragments(): Fragment[] {
  return Array.from({ length: 60 }, () => {
    const x = CV.xMin + Math.random() * (CV.xMax - CV.xMin);
    const yp = curveYPositive(x);
    return {
      x, y: yp !== null ? (Math.random() > 0.5 ? yp : -yp) : 0,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      rot: 0,
      vr: (Math.random() - 0.5) * 4,
      w: Math.random() * 15 + 4,
      h: Math.random() * 3 + 1,
      opacity: 1,
    };
  });
}

// ── Drawing helpers ──
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = EP_COLORS.border;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.2;
  for (let mx = Math.ceil(CV.xMin); mx <= CV.xMax; mx++) {
    ctx.beginPath(); ctx.moveTo(toX(mx, w), 0); ctx.lineTo(toX(mx, w), h); ctx.stroke();
  }
  for (let my = Math.ceil(CV.yMin); my <= CV.yMax; my++) {
    ctx.beginPath(); ctx.moveTo(0, toY(my, h)); ctx.lineTo(w, toY(my, h)); ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = EP_COLORS.muted;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(0, toY(0, h)); ctx.lineTo(w, toY(0, h)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX(0, w), 0); ctx.lineTo(toX(0, w), h); ctx.stroke();
  ctx.globalAlpha = 1;
}

function strokeCurve(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const drawEnd = CURVE_START_X + (CV.xMax - CURVE_START_X) * progress;
  // Upper half
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= w; px += 1.5) {
    const mx = fromX(px, w);
    if (mx < CURVE_START_X || mx > drawEnd) continue;
    const y = curveYPositive(mx);
    if (y === null) continue;
    if (!started) { ctx.moveTo(px, toY(y, h)); started = true; }
    else ctx.lineTo(px, toY(y, h));
  }
  ctx.stroke();
  // Lower half
  ctx.beginPath();
  started = false;
  for (let px = 0; px <= w; px += 1.5) {
    const mx = fromX(px, w);
    if (mx < CURVE_START_X || mx > drawEnd) continue;
    const y = curveYPositive(mx);
    if (y === null) continue;
    if (!started) { ctx.moveTo(px, toY(-y, h)); started = true; }
    else ctx.lineTo(px, toY(-y, h));
  }
  ctx.stroke();
}

function drawCurveWithGlow(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, glowColor: string, t: number) {
  const pulse = Math.sin(t * 0.002) * 5 + 15;
  // Glow layer
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = pulse;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.35;
  strokeCurve(ctx, w, h, progress);
  ctx.restore();
  // Crisp layer
  ctx.strokeStyle = EP_COLORS.curve;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;
  strokeCurve(ctx, w, h, progress);
}

function drawDot(ctx: CanvasRenderingContext2D, w: number, h: number, mx: number, my: number, color: string, label: string, r: number) {
  const cx = toX(mx, w), cy = toY(my, h);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  if (label) {
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - r - 8);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, w: number, h: number, particles: Particle[]) {
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(toX(p.x, w), toY(p.y, h), p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function updateParticles(particles: Particle[], mode: CurveMode) {
  const speed = mode === 'QUANTUM_FLOOD' ? 0.04 : 0.008;
  for (const p of particles) {
    p.vx += (Math.random() - 0.5) * speed;
    p.vy += (Math.random() - 0.5) * speed;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.x += p.vx;
    p.y += p.vy;
    // Attract to curve in gentle modes
    if (mode === 'IDLE' || mode === 'DRAW' || mode === 'POINT_ADD' || mode === 'LATTICE') {
      const yt = curveYPositive(p.x);
      if (yt !== null) {
        const target = p.y >= 0 ? yt : -yt;
        p.vy += (target - p.y) * 0.008;
      }
    }
    // Wrap/clamp
    if (p.x > CV.xMax + 1) p.x = CV.xMin;
    if (p.x < CV.xMin - 1) p.x = CV.xMax;
    p.y = Math.max(CV.yMin, Math.min(CV.yMax, p.y));
  }
}

// ── MODES: Point Addition ──
function drawPointAddMode(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, isMultiply: boolean) {
  const G = CURVE_POINTS[0];
  const P2 = CURVE_POINTS[1];

  // Always show G
  drawDot(ctx, w, h, G.x, G.y, EP_COLORS.goldBright, 'G', 6);

  if (elapsed < 0.5) return;
  drawDot(ctx, w, h, P2.x, P2.y, EP_COLORS.goldBright, 'P₂', 5);

  // Line between G and P2
  if (elapsed >= 1.0) {
    const lp = Math.min((elapsed - 1.0) / 0.6, 1);
    const gx = toX(G.x, w), gy = toY(G.y, h);
    const px = toX(P2.x, w), py = toY(P2.y, h);
    const dx = px - gx, dy = py - gy;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = EP_COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = lp;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (dx * 1.6) * lp, gy + (dy * 1.6) * lp);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Intersection point
  if (elapsed >= 2.0) {
    const intY = 2.694; // upper curve intersection
    const intX = 0.637;
    drawDot(ctx, w, h, intX, intY, EP_COLORS.warning, "P₃'", 4);

    // Reflect
    if (elapsed >= 2.5) {
      const rp = Math.min((elapsed - 2.5) / 0.5, 1);
      const curY = intY + (CURVE_POINTS[2].y - intY) * rp;

      // Reflection dashed line
      ctx.save();
      ctx.strokeStyle = EP_COLORS.textDim;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(toX(intX, w), toY(intY, h));
      ctx.lineTo(toX(intX, w), toY(curY, h));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      if (rp >= 1) {
        drawDot(ctx, w, h, intX, CURVE_POINTS[2].y, EP_COLORS.goldBright, 'P₁ + P₂', 6);
      }
    }
  }

  // Additional points for multiply mode
  if (isMultiply && elapsed > 4) {
    const me = elapsed - 4;
    [CURVE_POINTS[3], CURVE_POINTS[4]].forEach((pt, i) => {
      if (me > i * 0.8) {
        const a = Math.min((me - i * 0.8) / 0.3, 1);
        ctx.globalAlpha = a;
        drawDot(ctx, w, h, pt.x, pt.y, EP_COLORS.goldBright, pt.label, 5);
        ctx.globalAlpha = 1;
      }
    });

    // Counter
    const counterVal = Math.min(Math.floor(Math.pow(2, Math.min(me * 3.5, 8))), 256);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = EP_COLORS.goldBright;
    ctx.textAlign = 'right';
    ctx.fillText(`k = ${counterVal}`, w * 0.92, h * 0.08);

    if (counterVal >= 256) {
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillStyle = EP_COLORS.textDim;
      ctx.fillText('~0.001 seconds', w * 0.92, h * 0.13);
    }

    // Final public key highlight
    if (me > 2.5) {
      const P = CURVE_POINTS[4];
      ctx.save();
      ctx.shadowColor = EP_COLORS.goldBright;
      ctx.shadowBlur = 20;
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = EP_COLORS.goldBright;
      ctx.textAlign = 'center';
      ctx.fillText('Public Key = 7 × G', toX(P.x, w), toY(P.y, h) - 22);
      ctx.restore();
    }
  }
}

// ── MODES: Trapdoor ──
function drawTrapdoorMode(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const mid = w / 2;

  // Dividing line
  const lp = Math.min(elapsed / 0.4, 1);
  ctx.save();
  ctx.strokeStyle = EP_COLORS.border;
  ctx.lineWidth = 2;
  ctx.globalAlpha = lp * 0.7;
  ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(mid, h * lp); ctx.stroke();
  ctx.restore();

  // Labels
  if (elapsed > 0.3) {
    ctx.font = 'bold 15px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = EP_COLORS.gold;
    ctx.fillText('Forward: k → P', mid * 0.5, h * 0.06);
    ctx.font = 'bold 18px "Montserrat", sans-serif';
    ctx.fillText('Easy ✓', mid * 0.5, h * 0.12);

    ctx.fillStyle = EP_COLORS.danger;
    ctx.font = 'bold 15px "Montserrat", sans-serif';
    ctx.fillText('Reverse: P → k ?', mid * 1.5, h * 0.06);
    ctx.font = 'bold 18px "Montserrat", sans-serif';
    ctx.fillText('???', mid * 1.5, h * 0.12);
  }

  // Forward: smooth flowing particles
  if (elapsed > 0.8) {
    const t = elapsed - 0.8;
    ctx.fillStyle = EP_COLORS.gold;
    for (let i = 0; i < 18; i++) {
      const phase = (t * 0.25 + i * 0.056) % 1;
      const px = phase * mid * 0.75 + mid * 0.12;
      const py = h * 0.5 + Math.sin(phase * Math.PI * 2 + i) * h * 0.12;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Arrow
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = EP_COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mid * 0.15, h * 0.5);
    ctx.lineTo(mid * 0.85, h * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid * 0.8, h * 0.47);
    ctx.lineTo(mid * 0.85, h * 0.5);
    ctx.lineTo(mid * 0.8, h * 0.53);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Reverse: scattered chaotic particles
  if (elapsed > 1.5) {
    const t = elapsed - 1.5;
    const scatter = Math.min(t, 2) * 0.5;
    ctx.fillStyle = EP_COLORS.textDim;
    for (let i = 0; i < 18; i++) {
      const seed = i * 1234.5678;
      const px = mid * 1.4 + Math.sin(seed) * scatter * mid * 0.35;
      const py = h * 0.5 + Math.cos(seed * 2.1) * scatter * h * 0.25;
      const jx = Math.sin(elapsed * 5 + seed) * 4;
      const jy = Math.cos(elapsed * 7 + seed) * 4;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(px + jx, py + jy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Brute force counter
    if (t > 1) {
      const ct = t - 1;
      const label = ct < 1 ? `Attempts: ${Math.floor(ct * 1000)}` : 'Brute force: ~2¹²⁸';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = ct > 1 ? EP_COLORS.danger : EP_COLORS.textDim;
      ctx.textAlign = 'center';
      ctx.fillText(label, mid * 1.5, h * 0.88);
    }
  }
}

// ── MODES: Quantum Flood ──
function drawQuantumFloodMode(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, particles: Particle[]) {
  const intensity = Math.min(elapsed / 3, 1);
  const convergence = elapsed > 5 ? Math.min((elapsed - 5) / 2, 1) : 0;
  const targetCX = toX(2.5, w), targetCY = toY(4.213, h);

  ctx.save();
  ctx.shadowColor = EP_COLORS.quantumBright;
  ctx.shadowBlur = 20 * intensity;

  const visCount = Math.floor(particles.length * intensity);
  for (let i = 0; i < visCount; i++) {
    const p = particles[i];
    const px = toX(p.x, w) * (1 - convergence) + targetCX * convergence;
    const py = toY(p.y, h) * (1 - convergence) + targetCY * convergence;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = EP_COLORS.quantumBright;
    ctx.globalAlpha = p.opacity * intensity;
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // "k found" label
  if (convergence > 0.9) {
    ctx.save();
    ctx.shadowColor = EP_COLORS.quantum;
    ctx.shadowBlur = 15;
    ctx.font = 'bold 22px "Montserrat", sans-serif';
    ctx.fillStyle = EP_COLORS.quantum;
    ctx.textAlign = 'center';
    ctx.fillText('k found.', targetCX, targetCY - 25);
    ctx.restore();

    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = EP_COLORS.warning;
    ctx.textAlign = 'center';
    ctx.fillText('Quantum: ~9 minutes', targetCX, targetCY - 5);
  }
}

// ── MODES: Shatter ──
function drawShatterMode(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, fragments: Fragment[]) {
  for (const f of fragments) {
    f.x += f.vx;
    f.y -= f.vy; // Note: y inverted
    f.vy -= 0.002; // gravity pulls down in math-space
    f.rot += f.vr;
    f.opacity = Math.max(0, 1 - elapsed / 3);

    const cx = toX(f.x, w), cy = toY(f.y, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.rot * Math.PI / 180);
    ctx.fillStyle = EP_COLORS.danger;
    ctx.globalAlpha = f.opacity;
    ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
    ctx.restore();
  }

  // Red flash
  const flash = Math.max(0, 1 - elapsed / 0.5) * 0.25;
  if (flash > 0) {
    ctx.fillStyle = EP_COLORS.danger;
    ctx.globalAlpha = flash;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

// ── MODES: Lattice ──
function drawLatticeMode(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const progress = Math.min(elapsed / 2, 1);
  const gridN = 8;
  const cellW = w * 0.55 / gridN;
  const cellH = h * 0.55 / gridN;
  const ox = w * 0.22, oy = h * 0.22;

  ctx.save();
  ctx.strokeStyle = EP_COLORS.safe;
  ctx.lineWidth = 1;
  ctx.globalAlpha = progress * 0.5;

  for (let i = 0; i <= gridN; i++) {
    ctx.beginPath(); ctx.moveTo(ox + i * cellW, oy); ctx.lineTo(ox + i * cellW, oy + gridN * cellH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy + i * cellH); ctx.lineTo(ox + gridN * cellW, oy + i * cellH); ctx.stroke();
  }

  // Glowing nodes
  ctx.shadowColor = EP_COLORS.safeBright;
  ctx.shadowBlur = 8;
  ctx.fillStyle = EP_COLORS.safeBright;
  const mid = gridN / 2;
  for (let i = 0; i <= gridN; i++) {
    for (let j = 0; j <= gridN; j++) {
      const dist = Math.abs(i - mid) + Math.abs(j - mid);
      const nodeP = Math.min(Math.max((progress * (gridN + 2) - dist) * 0.4, 0), 1);
      if (nodeP > 0) {
        ctx.globalAlpha = nodeP * 0.8;
        ctx.beginPath();
        ctx.arc(ox + i * cellW, oy + j * cellH, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  if (progress > 0.5) {
    ctx.font = 'bold 16px "Montserrat", sans-serif';
    ctx.fillStyle = EP_COLORS.safe;
    ctx.textAlign = 'center';
    ctx.globalAlpha = (progress - 0.5) * 2;
    ctx.fillText('Lattice-based PQC', w * 0.5, h * 0.92);
    ctx.globalAlpha = 1;
  }
}

// ── Main component ──
export default function CurveCanvas({ mode, scene, style }: CurveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasState>({
    mode: 'IDLE',
    modeStart: performance.now(),
    particles: makeParticles(80, EP_COLORS.gold),
    quantumParticles: [],
    fragments: [],
    W: 0, H: 0,
  });
  const frameRef = useRef(0);

  // Handle mode transitions
  const handleModeChange = useCallback((newMode: CurveMode) => {
    const st = stateRef.current;
    if (st.mode === newMode) return;
    st.mode = newMode;
    st.modeStart = performance.now();

    switch (newMode) {
      case 'IDLE':
      case 'DRAW':
        st.particles = makeParticles(80, EP_COLORS.gold);
        st.quantumParticles = [];
        st.fragments = [];
        break;
      case 'POINT_ADD':
      case 'MULTIPLY':
        st.particles = makeParticles(40, EP_COLORS.gold);
        st.quantumParticles = [];
        break;
      case 'TRAPDOOR':
        st.particles = makeParticles(30, EP_COLORS.gold);
        st.quantumParticles = [];
        break;
      case 'QUANTUM_FLOOD':
        st.quantumParticles = makeParticles(600, EP_COLORS.quantum);
        st.particles = makeParticles(15, EP_COLORS.gold);
        break;
      case 'SHATTER':
        st.fragments = makeFragments();
        st.particles = [];
        st.quantumParticles = [];
        break;
      case 'LATTICE':
        st.fragments = [];
        st.particles = makeParticles(30, EP_COLORS.safe);
        st.quantumParticles = [];
        break;
    }
  }, []);

  useEffect(() => { handleModeChange(mode); }, [mode, handleModeChange]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      stateRef.current.W = canvas.width;
      stateRef.current.H = canvas.height;
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const ctx = canvas.getContext('2d')!;

    const animate = (timestamp: number) => {
      const st = stateRef.current;
      const { W, H } = st;
      if (W === 0 || H === 0) { frameRef.current = requestAnimationFrame(animate); return; }

      const dpr = window.devicePixelRatio || 1;
      const w = W / dpr, h = H / dpr;
      const elapsed = (timestamp - st.modeStart) / 1000;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // 1. Background grid
      drawGrid(ctx, w, h);

      // 2. Curve (not during SHATTER)
      if (st.mode !== 'SHATTER') {
        const drawProg = st.mode === 'DRAW' ? Math.min(elapsed / 2, 1) : 1;
        const glowColor = st.mode === 'QUANTUM_FLOOD' ? EP_COLORS.quantumDim :
                          st.mode === 'LATTICE' ? EP_COLORS.safeDim : EP_COLORS.goldDim;
        const curveAlpha = st.mode === 'TRAPDOOR' ? 0.25 : 1;
        ctx.globalAlpha = curveAlpha;
        drawCurveWithGlow(ctx, w, h, drawProg, glowColor, timestamp);
        ctx.globalAlpha = 1;

        // Equation label
        if (drawProg > 0.5 && st.mode !== 'LATTICE') {
          ctx.font = '16px "JetBrains Mono", monospace';
          ctx.fillStyle = EP_COLORS.textDim;
          ctx.textAlign = 'center';
          ctx.globalAlpha = Math.min((drawProg - 0.5) * 2, 0.8);
          ctx.fillText('y² = x³ + 7', w * 0.5, h * 0.9);
          ctx.globalAlpha = 1;
        }
      }

      // 3. Mode-specific rendering
      switch (st.mode) {
        case 'POINT_ADD':
          drawPointAddMode(ctx, w, h, elapsed, false);
          break;
        case 'MULTIPLY':
          drawPointAddMode(ctx, w, h, elapsed, true);
          break;
        case 'TRAPDOOR':
          drawTrapdoorMode(ctx, w, h, elapsed);
          break;
        case 'QUANTUM_FLOOD':
          drawQuantumFloodMode(ctx, w, h, elapsed, st.quantumParticles);
          updateParticles(st.quantumParticles, 'QUANTUM_FLOOD');
          break;
        case 'SHATTER':
          drawShatterMode(ctx, w, h, elapsed, st.fragments);
          break;
        case 'LATTICE':
          drawLatticeMode(ctx, w, h, elapsed);
          break;
        default:
          // IDLE / DRAW: show G point after draw
          if (st.mode === 'DRAW' && elapsed > 2.5) {
            drawDot(ctx, w, h, CURVE_POINTS[0].x, CURVE_POINTS[0].y, EP_COLORS.goldBright, 'G', 6);
          }
          if (st.mode === 'IDLE' && elapsed > 0.5) {
            drawDot(ctx, w, h, CURVE_POINTS[0].x, CURVE_POINTS[0].y, EP_COLORS.goldBright, 'G', 5);
          }
          break;
      }

      // 4. Ambient particles (always)
      updateParticles(st.particles, st.mode);
      drawParticles(ctx, w, h, st.particles);

      ctx.restore();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameRef.current); obs.disconnect(); };
  }, []);

  return (
    <div style={{ position: 'relative', ...style }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
