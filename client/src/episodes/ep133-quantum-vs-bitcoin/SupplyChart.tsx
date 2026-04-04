import { useRef, useEffect } from 'react';
import { EP_COLORS } from './constants';

interface SupplyChartProps {
  /** 0-1 draw progress (left to right) */
  progress: number;
  /** Whether to show the vulnerable overlay */
  showVulnerable?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Simplified BTC supply bands by script type (approximate, in millions BTC)
const BANDS = [
  { label: 'P2PK', base: 1.7, color: EP_COLORS.dormant, vulnerable: true, hatch: true },
  { label: 'P2PKH', base: 8.5, color: EP_COLORS.fill, vulnerable: false, hatch: false },
  { label: 'P2SH', base: 3.2, color: EP_COLORS.fillAlt, vulnerable: false, hatch: false },
  { label: 'P2WPKH', base: 3.8, color: EP_COLORS.safe, vulnerable: false, hatch: false },
  { label: 'P2WSH', base: 0.8, color: EP_COLORS.lineBright, vulnerable: false, hatch: false },
  { label: 'P2TR', base: 1.0, color: EP_COLORS.accentDim, vulnerable: true, hatch: true },
];

/**
 * Stacked area chart showing BTC supply by script type.
 * Vulnerable portions (P2PK, P2TR, reused addresses) are crosshatched in red.
 * Canvas 2D for the crosshatch pattern.
 */
export default function SupplyChart({
  progress,
  showVulnerable = false,
  width = 1600,
  height = 700,
  className,
  style,
}: SupplyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pad = { top: 50, right: 60, bottom: 60, left: 80 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const totalBTC = BANDS.reduce((s, b) => s + b.base, 0);
    const maxY = 21; // 21M BTC max supply
    const years = [2009, 2012, 2015, 2017, 2019, 2021, 2023, 2026];

    const toX = (year: number) => pad.left + ((year - 2009) / (2026 - 2009)) * plotW;
    const toY = (btc: number) => pad.top + (1 - btc / maxY) * plotH;

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = EP_COLORS.line;
    ctx.lineWidth = 0.5;
    for (const y of years) {
      const x = toX(y);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
      ctx.fillStyle = EP_COLORS.textDim;
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(y.toString(), x, height - pad.bottom + 20);
    }
    for (let btc = 0; btc <= 20; btc += 5) {
      const y = toY(btc);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = EP_COLORS.textDim;
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${btc}M`, pad.left - 10, y + 4);
    }

    // Draw stacked bands (simplified — approximate growth curves)
    const drawProgress = Math.min(progress, 1);
    const visibleX = pad.left + drawProgress * plotW;

    let cumulativeBottom = 0;
    for (let bi = 0; bi < BANDS.length; bi++) {
      const band = BANDS[bi];
      const bandTop = cumulativeBottom + band.base;

      // Draw filled area
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(cumulativeBottom));

      // Simplified: band grows linearly from 2009 to full by ~2020
      const growStart = bi === 0 ? 2009 : 2009 + bi * 1.5;
      const growEnd = growStart + 4;

      for (let px = pad.left; px <= visibleX; px += 2) {
        const yearAtPx = 2009 + ((px - pad.left) / plotW) * (2026 - 2009);
        let frac = 0;
        if (yearAtPx >= growStart) {
          frac = Math.min((yearAtPx - growStart) / (growEnd - growStart), 1);
        }
        const val = cumulativeBottom + band.base * frac;
        ctx.lineTo(px, toY(val));
      }

      // Close back along bottom
      for (let px = Math.floor(visibleX); px >= pad.left; px -= 2) {
        const yearAtPx = 2009 + ((px - pad.left) / plotW) * (2026 - 2009);
        let frac = 0;
        if (yearAtPx >= growStart) {
          frac = Math.min((yearAtPx - growStart) / (growEnd - growStart), 1);
        }
        // Previous band's top is this band's bottom
        const botVal = cumulativeBottom;
        ctx.lineTo(px, toY(botVal));
      }
      ctx.closePath();

      ctx.fillStyle = band.color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Crosshatch for vulnerable bands
      if (band.hatch && showVulnerable) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = EP_COLORS.accent;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        for (let d = -height; d < width + height; d += 12) {
          ctx.beginPath();
          ctx.moveTo(d, 0);
          ctx.lineTo(d + height, height);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Band label
      if (drawProgress > 0.5) {
        const labelX = visibleX - 100;
        const labelY = toY(cumulativeBottom + band.base * 0.5);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = band.vulnerable ? EP_COLORS.accent : EP_COLORS.textMuted;
        ctx.textAlign = 'right';
        ctx.globalAlpha = Math.min((drawProgress - 0.5) / 0.2, 1);
        ctx.fillText(band.label, labelX, labelY);
        ctx.globalAlpha = 1;
      }

      cumulativeBottom = bandTop;
    }
  }, [progress, showVulnerable, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
