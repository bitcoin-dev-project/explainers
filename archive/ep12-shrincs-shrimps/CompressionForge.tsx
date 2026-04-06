/**
 * CompressionForge — EP12 Signature Visual
 *
 * Canvas 2D component that visualizes signature scheme compression.
 * Each scheme is a column of cells whose height ∝ byte count.
 * Modes: idle → demonstrate → stress → shatter → forge → resolve.
 * The column shrinks across schemes — the visual IS the lesson.
 */
import { useRef, useEffect } from 'react';
import { EP_COLORS, SCHEME_COLORS } from './constants';

// ── Types ───────────────────────────────────────────────────────────
export type ForgeScheme = 'lamport' | 'wots' | 'xmss' | 'sphincs' | 'shrincs';
export type ForgeMode = 'idle' | 'demonstrate' | 'stress' | 'shatter' | 'forge' | 'resolve';

interface Cell {
  x: number; y: number;
  tx: number; ty: number;
  w: number; h: number;
  color: string;
  opacity: number;
  vx: number; vy: number;
  bx: number; by: number; // brownian offset
  active: boolean;
  detached: boolean;
  label?: string;
  chainIdx?: number;
  level?: number;
  col?: number; // 0=left, 1=right for lamport pairs
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  opacity: number;
  rot: number; rv: number;
  size: number;
  life: number;
}

interface HexFloat {
  x: number; y: number;
  char: string;
  opacity: number;
  speed: number;
}

export interface GhostOutline {
  height: number;
  color: string;
  label: string;
}

interface CompressionForgeProps {
  mode: ForgeMode;
  scheme: ForgeScheme;
  width: number;
  height: number;
  ghosts: GhostOutline[];
  crackStyle?: 'vertical' | 'topdown' | 'buckle';
  className?: string;
  style?: React.CSSProperties;
}

// ── Constants ───────────────────────────────────────────────────────
const HEX = '0123456789abcdef';
const GRAVITY = 500;
const BROWNIAN_FORCE = 0.4;
const CRACK_DELAY = 1.8; // seconds in stress before auto-shatter
const LERP_SPEED = 3.0;

function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function randHex(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Cell Generators ─────────────────────────────────────────────────

function generateLamportCells(cx: number, baseY: number): Cell[] {
  const rows = 16;
  const cellW = 42; const cellH = 18; const rowGap = 16; const pairGap = 56;
  const colH = rows * (cellH + rowGap) - rowGap;
  const startY = baseY - colH;
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    const y = startY + r * (cellH + rowGap);
    // sk (left)
    cells.push({
      x: cx - pairGap - cellW / 2, y, tx: cx - pairGap - cellW / 2, ty: y,
      w: cellW, h: cellH, color: EP_COLORS.accent, opacity: 0.75,
      vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
      label: randHex(4), col: 0, level: r,
    });
    // pk (right)
    cells.push({
      x: cx + pairGap - cellW / 2, y, tx: cx + pairGap - cellW / 2, ty: y,
      w: cellW, h: cellH, color: EP_COLORS.leaf, opacity: 0.75,
      vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
      label: randHex(4), col: 1, level: r,
    });
  }
  return cells;
}

function generateWOTSCells(cx: number, baseY: number): Cell[] {
  const chains = 4; const links = 8;
  const cellW = 32; const cellH = 22; const xGap = 6; const yGap = 50;
  const chainW = links * (cellW + xGap) - xGap;
  const colH = chains * (cellH + yGap) - yGap;
  const startY = baseY - colH;
  const startX = cx - chainW / 2;
  const cells: Cell[] = [];
  for (let c = 0; c < chains; c++) {
    for (let l = 0; l < links; l++) {
      const x = startX + l * (cellW + xGap);
      const y = startY + c * (cellH + yGap);
      cells.push({
        x, y, tx: x, ty: y, w: cellW, h: cellH,
        color: EP_COLORS.chain, opacity: 0.7,
        vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
        label: `H${superscript(l)}`, chainIdx: c, level: l,
      });
    }
  }
  return cells;
}

function generateXMSSCells(cx: number, baseY: number): Cell[] {
  const levels = 4;
  const cellS = 28; const levelGap = 80;
  const colH = levels * (cellS + levelGap) - levelGap;
  const startY = baseY - colH;
  const cells: Cell[] = [];
  for (let lv = 0; lv < levels; lv++) {
    const count = Math.pow(2, lv);
    const spread = 260;
    const y = startY + lv * (cellS + levelGap);
    for (let i = 0; i < count; i++) {
      const x = cx - spread / 2 + (spread / (count)) * (i + 0.5) - cellS / 2;
      cells.push({
        x, y, tx: x, ty: y, w: cellS, h: cellS,
        color: EP_COLORS.leaf, opacity: 0.75,
        vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
        label: lv === levels - 1 ? `W${i + 1}` : (lv === 0 ? 'pk' : ''),
        level: lv,
      });
    }
  }
  return cells;
}

function generateSPHINCSCells(cx: number, baseY: number): Cell[] {
  const tiers = 3;
  const cellS = 20; const tierGap = 30;
  const cells: Cell[] = [];
  // Each tier is a mini-tree: root(1) + children(2) + grandchildren(4) = 7 nodes
  const nodesPerTier = [1, 2, 4];
  let globalY = baseY - 600;
  for (let t = 0; t < tiers; t++) {
    const treesInTier = Math.pow(2, t);
    const tierWidth = 280;
    for (let tr = 0; tr < treesInTier; tr++) {
      const treeCx = cx - tierWidth / 2 + (tierWidth / treesInTier) * (tr + 0.5);
      for (let lv = 0; lv < nodesPerTier.length; lv++) {
        const count = nodesPerTier[lv];
        const spread = 50 / treesInTier;
        for (let i = 0; i < count; i++) {
          const x = treeCx - spread / 2 + (count > 1 ? (spread / (count - 1)) * i : 0) - cellS / 2;
          const y = globalY + lv * (cellS + 14);
          cells.push({
            x, y, tx: x, ty: y, w: cellS, h: cellS,
            color: EP_COLORS.accentAlt, opacity: 0.65,
            vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
            level: t * 3 + lv,
          });
        }
      }
    }
    globalY += nodesPerTier.length * (cellS + 14) + tierGap;
  }
  return cells;
}

function generateSHRINCScells(cx: number, baseY: number): Cell[] {
  const cells: Cell[] = [];
  const cellS = 28;
  // Stateful path — tiny (3 cells, left)
  for (let i = 0; i < 3; i++) {
    cells.push({
      x: cx - 80, y: baseY - 120 + i * 36,
      tx: cx - 80, ty: baseY - 120 + i * 36,
      w: cellS, h: cellS, color: EP_COLORS.gold, opacity: 0.9,
      vx: 0, vy: 0, bx: 0, by: 0, active: true, detached: false,
      label: i === 0 ? 'pk' : i === 1 ? 'sig' : 'auth', col: 0,
    });
  }
  // Stateless fallback — large (10 cells, right, dimmed)
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 2); const col = i % 2;
    cells.push({
      x: cx + 40 + col * 32, y: baseY - 200 + row * 36,
      tx: cx + 40 + col * 32, ty: baseY - 200 + row * 36,
      w: cellS, h: cellS, color: EP_COLORS.stateless, opacity: 0.3,
      vx: 0, vy: 0, bx: 0, by: 0, active: false, detached: false,
      col: 1,
    });
  }
  return cells;
}

function superscript(n: number): string {
  const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(n).split('').map(d => sup[parseInt(d)] || d).join('');
}

function generateCells(scheme: ForgeScheme, w: number, h: number): Cell[] {
  const cx = w / 2;
  const baseY = h - 50;
  switch (scheme) {
    case 'lamport': return generateLamportCells(cx, baseY);
    case 'wots': return generateWOTSCells(cx, baseY);
    case 'xmss': return generateXMSSCells(cx, baseY);
    case 'sphincs': return generateSPHINCSCells(cx, baseY);
    case 'shrincs': return generateSHRINCScells(cx, baseY);
  }
}

// ── Hex Particle Pool ───────────────────────────────────────────────

function initHexFloats(count: number, w: number, h: number): HexFloat[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    char: HEX[Math.floor(Math.random() * 16)],
    opacity: 0.04 + Math.random() * 0.1,
    speed: 0.4 + Math.random() * 1.0,
  }));
}

// ── Shatter Logic ───────────────────────────────────────────────────

function shatterCells(
  cells: Cell[],
  crackStyle: string,
  _w: number,
  _h: number,
): Particle[] {
  const particles: Particle[] = [];
  cells.forEach(c => {
    if (c.detached) return;
    c.detached = true;
    c.opacity = 0;
    let pvx = 0; let pvy = 0;
    if (crackStyle === 'vertical') {
      pvx = (c.col === 0 ? -1 : 1) * (100 + Math.random() * 200);
      pvy = -50 + Math.random() * 100;
    } else if (crackStyle === 'topdown') {
      pvx = (Math.random() - 0.5) * 150;
      pvy = 100 + Math.random() * 200;
    } else {
      // buckle — compress from top
      pvx = (Math.random() - 0.5) * 80;
      pvy = 50 + Math.random() * 150;
    }
    particles.push({
      x: c.x + c.w / 2, y: c.y + c.h / 2,
      vx: pvx, vy: pvy,
      color: c.color, opacity: 0.9,
      rot: 0, rv: (Math.random() - 0.5) * 8,
      size: Math.max(c.w, c.h) * 0.6,
      life: 2.5,
    });
  });
  return particles;
}

// ── Main Component ──────────────────────────────────────────────────

export default function CompressionForge({
  mode, scheme, width, height, ghosts, crackStyle = 'vertical',
  className, style,
}: CompressionForgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable animation state — no re-renders
  const state = useRef({
    cells: generateCells(scheme, width, height),
    particles: [] as Particle[],
    hexFloats: initHexFloats(25, width, height),
    mode: mode as ForgeMode,
    scheme: scheme as ForgeScheme,
    modeTime: 0,
    demoStep: 0,
    crackProgress: 0,
    glowColor: SCHEME_COLORS[scheme] || EP_COLORS.accent,
    glowOpacity: 0.08,
    breathing: 0,
    autoShattered: false,
  });

  // Scheme change → regenerate cells
  useEffect(() => {
    const s = state.current;
    if (s.scheme !== scheme) {
      s.scheme = scheme;
      s.cells = generateCells(scheme, width, height);
      s.demoStep = 0;
      s.glowColor = SCHEME_COLORS[scheme] || EP_COLORS.accent;
    }
  }, [scheme, width, height]);

  // Mode change → reset mode timer & trigger transitions
  useEffect(() => {
    const s = state.current;
    s.mode = mode;
    s.modeTime = 0;
    s.autoShattered = false;

    if (mode === 'stress') {
      s.crackProgress = 0;
      s.glowColor = EP_COLORS.danger;
      s.glowOpacity = 0.05;
    } else if (mode === 'shatter') {
      const p = shatterCells(s.cells, crackStyle, width, height);
      s.particles.push(...p);
      s.glowColor = EP_COLORS.danger;
    } else if (mode === 'forge') {
      // particles will converge to cell targets via lerp
      s.glowColor = SCHEME_COLORS[scheme] || EP_COLORS.accent;
      s.cells = generateCells(scheme, width, height);
      // Start cells off-position (from center bottom)
      s.cells.forEach(c => {
        c.x = width / 2 + (Math.random() - 0.5) * 60;
        c.y = height - 30 + (Math.random() - 0.5) * 40;
      });
      s.particles = [];
    } else if (mode === 'resolve') {
      s.glowColor = EP_COLORS.gold;
      s.glowOpacity = 0.12;
    } else if (mode === 'demonstrate') {
      s.demoStep = 0;
      s.glowColor = SCHEME_COLORS[scheme] || EP_COLORS.accent;
    } else {
      // idle
      s.glowColor = SCHEME_COLORS[scheme] || EP_COLORS.accent;
      s.glowOpacity = 0.06;
    }
  }, [mode, crackStyle, width, height, scheme]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let frameId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = state.current;
      s.modeTime += dt;
      s.breathing += dt * 1.8;

      // ── UPDATE ──────────────────────────────────────────────

      // Brownian drift on non-detached cells
      s.cells.forEach(c => {
        if (c.detached) return;
        c.bx += (Math.random() - 0.5) * BROWNIAN_FORCE;
        c.by += (Math.random() - 0.5) * BROWNIAN_FORCE;
        c.bx *= 0.92; c.by *= 0.92;
      });

      // Mode-specific cell updates
      if (s.mode === 'forge') {
        s.cells.forEach(c => {
          c.x += (c.tx - c.x) * LERP_SPEED * dt;
          c.y += (c.ty - c.y) * LERP_SPEED * dt;
          c.opacity += (0.8 - c.opacity) * 2 * dt;
        });
        s.glowOpacity += (0.1 - s.glowOpacity) * 2 * dt;
      } else if (s.mode === 'demonstrate') {
        s.demoStep += dt * 2.5;
        const step = Math.floor(s.demoStep);
        s.cells.forEach((c, i) => {
          // Scheme-specific demonstrate logic
          if (s.scheme === 'lamport') {
            // Reveal one from each pair based on "message bit"
            const row = c.level ?? 0;
            const bit = row % 3 === 0 ? 0 : 1; // deterministic pattern
            c.active = step > row && c.col === bit;
            c.opacity = c.active ? 1.0 : 0.35;
          } else if (s.scheme === 'wots') {
            const chainStep = Math.floor(s.demoStep * 1.5);
            if (c.chainIdx !== undefined && c.level !== undefined) {
              const targetPos = [5, 3, 7, 2][c.chainIdx % 4] ?? 4;
              c.active = chainStep > c.chainIdx * 8 + c.level && c.level <= targetPos;
              c.opacity = c.active ? 1.0 : 0.4;
            }
          } else if (s.scheme === 'xmss') {
            // Auth path: leaf 0 → root
            const authLevels = [3, 2, 1, 0];
            const authIdx = Math.min(step, authLevels.length - 1);
            c.active = (c.level !== undefined && c.level >= authLevels[authIdx]);
            if (c.level === 3 && i === s.cells.findIndex(cc => cc.level === 3)) {
              c.active = true; c.color = EP_COLORS.gold;
            }
            c.opacity = c.active ? 1.0 : 0.4;
          } else if (s.scheme === 'sphincs') {
            // Path through tiers lights up sequentially
            const tierStep = Math.floor(s.demoStep * 0.8);
            c.active = (c.level !== undefined && Math.floor(c.level / 3) <= tierStep);
            c.opacity = c.active ? 0.9 : 0.35;
          } else if (s.scheme === 'shrincs') {
            // Stateful cells glow gold
            c.active = c.col === 0;
            c.opacity = c.col === 0 ? 1.0 : 0.25;
          }
        });
      } else if (s.mode === 'stress') {
        s.crackProgress += dt / CRACK_DELAY;
        s.glowOpacity = 0.05 + s.crackProgress * 0.2;
        // Red tint on cells
        s.cells.forEach(c => {
          const redAmount = Math.min(s.crackProgress * 0.6, 0.5);
          c.opacity = 0.7 + Math.sin(s.modeTime * 6) * 0.1 * redAmount;
        });
        // Auto-shatter
        if (s.crackProgress >= 1 && !s.autoShattered) {
          s.autoShattered = true;
          const p = shatterCells(s.cells, crackStyle, width, height);
          s.particles.push(...p);
        }
      } else if (s.mode === 'resolve') {
        s.cells.forEach(c => {
          c.opacity = 0.85 + Math.sin(s.breathing + (c.level ?? 0) * 0.5) * 0.15;
        });
        s.glowOpacity = 0.1 + Math.sin(s.breathing * 0.6) * 0.04;
      }

      // Particles: gravity + fade
      s.particles = s.particles.filter(p => {
        p.life -= dt;
        if (p.life <= 0) return false;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.rv * dt;
        p.opacity = Math.max(0, p.life / 2.5) * 0.8;
        return true;
      });

      // Hex floats: drift upward
      s.hexFloats.forEach(hf => {
        hf.y -= hf.speed;
        if (hf.y < -20) {
          hf.y = height + 10;
          hf.x = Math.random() * width;
          hf.char = HEX[Math.floor(Math.random() * 16)];
        }
        hf.opacity = Math.min(0.12, hf.opacity + (Math.random() - 0.5) * 0.005);
      });

      // ── RENDER ─────────────────────────────────────────────

      ctx.clearRect(0, 0, width, height);

      // 1. Background glow
      const grd = ctx.createRadialGradient(width / 2, height * 0.45, 0, width / 2, height * 0.45, width * 0.55);
      grd.addColorStop(0, hexAlpha(s.glowColor, s.glowOpacity));
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      // 2. Ghost outlines
      const ghostX = width / 2 - 70;
      const ghostBase = height - 40;
      ghosts.forEach(g => {
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = hexAlpha(g.color, 0.2);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ghostX, ghostBase - g.height, 140, g.height);
        ctx.setLineDash([]);
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillStyle = hexAlpha(g.color, 0.28);
        ctx.fillText(g.label, ghostX + 148, ghostBase - g.height + 14);
      });

      // 3. Connections (tree branches, chain arrows)
      if (!s.autoShattered && s.mode !== 'shatter') {
        ctx.lineWidth = 1.2;
        if (s.scheme === 'xmss' || s.scheme === 'sphincs') {
          // Tree branches
          s.cells.forEach(c => {
            if (c.level === undefined || c.level === 0) return;
            // Find parent
            const parentLevel = c.level - 1;
            const parentsAtLevel = s.cells.filter(pc => pc.level === parentLevel);
            if (parentsAtLevel.length === 0) return;
            // rough parent index
            const idx = s.cells.filter(cc => cc.level === c.level).indexOf(c);
            const parentIdx = Math.floor(idx / 2);
            const parent = parentsAtLevel[Math.min(parentIdx, parentsAtLevel.length - 1)];
            if (!parent) return;
            ctx.strokeStyle = hexAlpha(c.color, c.active ? 0.6 : 0.2);
            ctx.beginPath();
            ctx.moveTo(parent.x + parent.w / 2 + parent.bx, parent.y + parent.h + parent.by);
            ctx.lineTo(c.x + c.w / 2 + c.bx, c.y + c.by);
            ctx.stroke();
          });
        } else if (s.scheme === 'wots') {
          // Chain arrows
          for (let i = 0; i < s.cells.length; i++) {
            const c = s.cells[i];
            const next = s.cells[i + 1];
            if (!next || next.chainIdx !== c.chainIdx) continue;
            ctx.strokeStyle = hexAlpha(EP_COLORS.chain, c.active && next.active ? 0.5 : 0.15);
            ctx.beginPath();
            ctx.moveTo(c.x + c.w + c.bx, c.y + c.h / 2 + c.by);
            ctx.lineTo(next.x + next.bx, next.y + next.h / 2 + next.by);
            ctx.stroke();
            // Arrow head
            const ax = next.x + next.bx;
            const ay = next.y + next.h / 2 + next.by;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.moveTo(ax, ay - 3);
            ctx.lineTo(ax - 6, ay);
            ctx.lineTo(ax, ay + 3);
            ctx.fill();
          }
        } else if (s.scheme === 'lamport') {
          // Hash arrows between sk → pk pairs
          for (let i = 0; i < s.cells.length; i += 2) {
            const sk = s.cells[i];
            const pk = s.cells[i + 1];
            if (!sk || !pk) continue;
            ctx.strokeStyle = hexAlpha(EP_COLORS.accent, sk.active ? 0.4 : 0.1);
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sk.x + sk.w + sk.bx + 2, sk.y + sk.h / 2 + sk.by);
            ctx.lineTo(pk.x + pk.bx - 2, pk.y + pk.h / 2 + pk.by);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // 4. Cells
      s.cells.forEach(c => {
        if (c.detached) return;
        const cx = c.x + c.bx;
        const cy = c.y + c.by;
        ctx.globalAlpha = c.opacity;

        // Cell fill
        roundRect(ctx, cx, cy, c.w, c.h, 4);
        ctx.fillStyle = hexAlpha(c.color, 0.2);
        ctx.fill();

        // Cell border
        ctx.strokeStyle = hexAlpha(c.color, c.active ? 0.9 : 0.45);
        ctx.lineWidth = c.active ? 2 : 1;
        ctx.stroke();

        // Active glow
        if (c.active) {
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 12;
          roundRect(ctx, cx, cy, c.w, c.h, 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Label
        if (c.label) {
          ctx.font = '500 10px "JetBrains Mono", monospace';
          ctx.fillStyle = hexAlpha(EP_COLORS.text, c.active ? 0.9 : 0.5);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.label, cx + c.w / 2, cy + c.h / 2);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }

        ctx.globalAlpha = 1;
      });

      // 5. Stress crack overlay
      if (s.mode === 'stress' && s.crackProgress > 0.2) {
        const prog = Math.min(s.crackProgress, 1);
        ctx.strokeStyle = hexAlpha(EP_COLORS.danger, 0.6 * prog);
        ctx.lineWidth = 2 + prog;
        ctx.beginPath();
        if (crackStyle === 'vertical') {
          const midX = width / 2;
          const startYc = height - 50 - 400 * prog;
          ctx.moveTo(midX + Math.sin(s.modeTime * 10) * 3, height - 50);
          for (let fy = 0; fy < 400 * prog; fy += 8) {
            ctx.lineTo(midX + Math.sin((fy + s.modeTime * 80) * 0.07) * 6, height - 50 - fy);
          }
        } else if (crackStyle === 'topdown') {
          const midX = width / 2;
          ctx.moveTo(midX, height - 50 - 350);
          for (let fy = 0; fy < 350 * prog; fy += 8) {
            ctx.lineTo(midX + Math.sin((fy + s.modeTime * 60) * 0.09) * 5, height - 50 - 350 + fy);
          }
        } else {
          // buckle — horizontal cracks from top
          const topY = height - 50 - 580;
          for (let i = 0; i < 3; i++) {
            ctx.moveTo(width / 2 - 60, topY + i * 30 * prog);
            ctx.lineTo(width / 2 + 60, topY + i * 30 * prog + Math.sin(s.modeTime * 8) * 4);
          }
        }
        ctx.stroke();
      }

      // 6. Particles
      s.particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        roundRect(ctx, -p.size / 2, -p.size / 2, p.size, p.size, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      });

      // 7. Hex floats
      ctx.font = '12px "JetBrains Mono", monospace';
      s.hexFloats.forEach(hf => {
        ctx.fillStyle = hexAlpha(EP_COLORS.accent, hf.opacity);
        ctx.fillText(hf.char, hf.x, hf.y);
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [width, height, ghosts, crackStyle]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, display: 'block', ...style }}
    />
  );
}
