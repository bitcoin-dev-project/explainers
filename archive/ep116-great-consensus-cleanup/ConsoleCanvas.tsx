import { useRef, useEffect, useCallback } from 'react';
import { EP_COLORS, BUG_ROWS, type BugStatus } from './constants';

interface ConsoleCanvasProps {
  scene: number;
  bugStatuses: BugStatus[];
  activeBugIndex: number;
  progress: number;
  width: number;
}

const HEX_CHARS = '0123456789abcdef';
const ROW_HEIGHT = 48;
const ROW_GAP = 12;
const PADDING = 16;
const DOT_RADIUS = 5;
const FONT_MONO = '"JetBrains Mono", monospace';

interface HexChar {
  x: number;
  y: number;
  char: string;
  speed: number;
  opacity: number;
}

interface ScanLine {
  y: number;
  speed: number;
}

export default function ConsoleCanvas({
  scene,
  bugStatuses,
  activeBugIndex,
  progress,
  width,
}: ConsoleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const hexCharsRef = useRef<HexChar[]>([]);
  const scanLinesRef = useRef<ScanLine[]>([]);
  const prevStatusesRef = useRef<BugStatus[]>(['UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN']);
  const wipeProgressRef = useRef<number[]>([0, 0, 0, 0]);

  const HEIGHT = 1080;
  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

  // Initialize hex waterfall characters
  const initHexChars = useCallback((w: number) => {
    const chars: HexChar[] = [];
    const cols = Math.floor(w / 14);
    for (let i = 0; i < cols * 3; i++) {
      chars.push({
        x: Math.random() * w,
        y: Math.random() * HEIGHT,
        char: HEX_CHARS[Math.floor(Math.random() * 16)],
        speed: 0.3 + Math.random() * 0.8,
        opacity: 0.02 + Math.random() * 0.06,
      });
    }
    return chars;
  }, []);

  // Initialize scan lines
  const initScanLines = useCallback(() => {
    return [
      { y: 0, speed: 1.2 },
      { y: HEIGHT * 0.33, speed: 0.8 },
      { y: HEIGHT * 0.66, speed: 1.0 },
    ];
  }, []);

  useEffect(() => {
    hexCharsRef.current = initHexChars(width);
    scanLinesRef.current = initScanLines();
  }, [width, initHexChars, initScanLines]);

  // Track wipe animations for status transitions
  useEffect(() => {
    for (let i = 0; i < 4; i++) {
      if (bugStatuses[i] !== prevStatusesRef.current[i]) {
        if (bugStatuses[i] === 'PATCHED') {
          wipeProgressRef.current[i] = 0;
        }
      }
    }
    prevStatusesRef.current = [...bugStatuses];
  }, [bugStatuses]);

  const getStatusColor = useCallback((status: BugStatus, isActive: boolean, wipe: number): string => {
    if (status === 'PATCHED') {
      if (wipe < 1) return EP_COLORS.statusRed;
      return EP_COLORS.statusGreen;
    }
    if (status === 'VULNERABLE') return isActive ? EP_COLORS.statusRed : EP_COLORS.statusDim;
    return EP_COLORS.statusDim;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number, dt: number) => {
    const w = width;
    const h = HEIGHT;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = EP_COLORS.bgConsole;
    ctx.fillRect(0, 0, w, h);

    // Hex waterfall background
    const hexChars = hexCharsRef.current;
    ctx.font = `10px ${FONT_MONO}`;
    for (const hc of hexChars) {
      hc.y += hc.speed;
      if (hc.y > h) {
        hc.y = -12;
        hc.x = Math.random() * w;
        hc.char = HEX_CHARS[Math.floor(Math.random() * 16)];
      }
      // Occasional character change
      if (Math.random() < 0.005) {
        hc.char = HEX_CHARS[Math.floor(Math.random() * 16)];
      }
      ctx.fillStyle = `rgba(167, 139, 250, ${hc.opacity})`;
      ctx.fillText(hc.char, hc.x, hc.y);
    }

    // Scan lines (CRT effect)
    const scanLines = scanLinesRef.current;
    for (const sl of scanLines) {
      sl.y = (sl.y + sl.speed) % h;
      const allPatched = bugStatuses.every(s => s === 'PATCHED');
      const scanColor = allPatched ? 'rgba(52, 211, 153, 0.12)' : 'rgba(45, 212, 191, 0.15)';
      const grad = ctx.createLinearGradient(0, sl.y - 30, 0, sl.y + 30);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, scanColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, sl.y - 30, w, 60);
    }

    // Horizontal noise lines (random flicker)
    if (Math.random() < 0.15) {
      const noiseY = Math.random() * h;
      ctx.fillStyle = `rgba(148, 163, 184, ${0.02 + Math.random() * 0.03})`;
      ctx.fillRect(0, noiseY, w, 1);
    }

    // Console header
    const headerY = PADDING + 20;
    ctx.font = `bold 11px ${FONT_MONO}`;
    ctx.fillStyle = EP_COLORS.textMuted;
    ctx.fillText('CONSENSUS AUDIT', PADDING, headerY);

    // Separator line
    ctx.strokeStyle = EP_COLORS.statusDim + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, headerY + 10);
    ctx.lineTo(w - PADDING, headerY + 10);
    ctx.stroke();

    // Bug status rows
    const rowStartY = headerY + 30;
    for (let i = 0; i < 4; i++) {
      const bug = BUG_ROWS[i];
      const status = bugStatuses[i];
      const isActive = i === activeBugIndex;
      const rowY = rowStartY + i * (ROW_HEIGHT + ROW_GAP);

      // Animate wipe progress for patched rows
      if (status === 'PATCHED' && wipeProgressRef.current[i] < 1) {
        wipeProgressRef.current[i] = Math.min(1, wipeProgressRef.current[i] + dt * 1.8);
      }
      const wipe = wipeProgressRef.current[i];

      // Row background with glow for active bug
      if (isActive) {
        const glowAlpha = 0.08 + Math.sin(t * 3) * 0.04;
        ctx.fillStyle = bug.accentColor + Math.round(glowAlpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.roundRect(PADDING - 4, rowY - 4, w - PADDING * 2 + 8, ROW_HEIGHT + 8, 6);
        ctx.fill();
      }

      // Row bg
      ctx.fillStyle = EP_COLORS.bgAlt + (isActive ? 'dd' : '88');
      ctx.beginPath();
      ctx.roundRect(PADDING, rowY, w - PADDING * 2, ROW_HEIGHT, 4);
      ctx.fill();

      // Wipe overlay for PATCHED transition
      if (status === 'PATCHED' && wipe > 0 && wipe < 1) {
        const wipeWidth = (w - PADDING * 2) * wipe;
        ctx.fillStyle = EP_COLORS.statusGreen + '30';
        ctx.beginPath();
        ctx.roundRect(PADDING, rowY, wipeWidth, ROW_HEIGHT, 4);
        ctx.fill();
      }

      // Status dot
      const dotX = PADDING + 16;
      const dotY = rowY + ROW_HEIGHT / 2;
      const dotColor = getStatusColor(status, isActive, wipe);
      const pulseScale = status === 'VULNERABLE' && isActive
        ? 1 + Math.sin(t * 4) * 0.3
        : status === 'PATCHED' ? 1 : 0.8;

      // Dot glow
      if (status !== 'UNKNOWN' && (isActive || status === 'PATCHED')) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, DOT_RADIUS * pulseScale * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = dotColor + '30';
        ctx.fill();
      }

      // Dot core
      ctx.beginPath();
      ctx.arc(dotX, dotY, DOT_RADIUS * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();

      // Bug label
      ctx.font = `bold 12px ${FONT_MONO}`;
      ctx.fillStyle = isActive ? EP_COLORS.text : EP_COLORS.textMuted;
      ctx.fillText(bug.label, dotX + 16, dotY - 5);

      // Status text
      ctx.font = `10px ${FONT_MONO}`;
      const statusText = status === 'PATCHED'
        ? 'PATCHED'
        : status === 'VULNERABLE'
          ? 'VULNERABLE'
          : 'SCANNING...';
      ctx.fillStyle = status === 'PATCHED'
        ? EP_COLORS.statusGreen
        : status === 'VULNERABLE'
          ? EP_COLORS.statusRed
          : EP_COLORS.statusDim;
      ctx.fillText(statusText, dotX + 16, dotY + 10);

      // Checkmark for patched
      if (status === 'PATCHED' && wipe >= 1) {
        const chkX = w - PADDING - 24;
        const chkY = dotY;
        ctx.strokeStyle = EP_COLORS.statusGreen;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(chkX - 5, chkY);
        ctx.lineTo(chkX - 1, chkY + 4);
        ctx.lineTo(chkX + 6, chkY - 5);
        ctx.stroke();
      }
    }

    // Progress bar
    const barY = rowStartY + 4 * (ROW_HEIGHT + ROW_GAP) + 20;
    const barX = PADDING;
    const barW = w - PADDING * 2;
    const barH = 8;

    ctx.font = `9px ${FONT_MONO}`;
    ctx.fillStyle = EP_COLORS.textMuted;
    ctx.fillText('SCAN PROGRESS', barX, barY - 6);

    // Bar background
    ctx.fillStyle = EP_COLORS.statusDim + '40';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // Bar fill
    const fillW = barW * progress;
    if (fillW > 0) {
      const allDone = progress >= 1;
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, allDone ? EP_COLORS.statusGreen : EP_COLORS.actTimewarp);
      grad.addColorStop(1, allDone ? EP_COLORS.statusGreen : EP_COLORS.actMerkle);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 4);
      ctx.fill();
    }

    // Progress percentage
    ctx.font = `bold 10px ${FONT_MONO}`;
    ctx.fillStyle = EP_COLORS.text;
    ctx.fillText(`${Math.round(progress * 100)}%`, barX + barW + 6, barY + 8);

    // Bottom decorative text
    const bottomY = h - PADDING - 10;
    ctx.font = `9px ${FONT_MONO}`;
    ctx.fillStyle = EP_COLORS.textMuted + '60';
    const ts = new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' ');
    ctx.fillText(`BIP-54 AUDIT // ${ts}`, PADDING, bottomY);

    // All-clear radiance when all patched
    if (bugStatuses.every(s => s === 'PATCHED')) {
      const pulse = 0.03 + Math.sin(t * 1.5) * 0.02;
      ctx.fillStyle = `rgba(52, 211, 153, ${pulse})`;
      ctx.fillRect(0, 0, w, h);
    }
  }, [width, bugStatuses, activeBugIndex, progress, getStatusColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * DPR;
    canvas.height = HEIGHT * DPR;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(DPR, DPR);
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      draw(ctx, timeRef.current, dt);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, draw, DPR]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${HEIGHT}px`,
        display: 'block',
      }}
    />
  );
}
