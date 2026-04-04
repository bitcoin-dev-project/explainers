import { useRef, useEffect } from 'react';
import { EP_COLORS, RESOURCE_DATA, RESOURCE_TREND_DATA } from './constants';

interface ResourceChartProps {
  /** 'scatter' = Fig 1 (logical qubits vs gates), 'trend' = Fig 3 (physical qubits over time) */
  variant: 'scatter' | 'trend';
  /** 0-1 how many data points are visible */
  progress: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animated scatter plot / trend chart.
 * - 'scatter': recreates Fig 1 — Toffoli Gates vs Logical Qubits (log-log),
 *   with Google's 2026 result landing last and lowest, pulsing red.
 * - 'trend': physical qubits over time (log scale) showing downward trend.
 */
export default function ResourceChart({
  variant,
  progress,
  width = 1400,
  height = 700,
  className,
  style,
}: ResourceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const pad = { top: 60, right: 60, bottom: 60, left: 100 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const render = (now: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      if (variant === 'scatter') {
        // Log-log scatter: X = log(Toffoli gates), Y = log(logical qubits)
        const xMin = Math.log10(5e7);   // 5×10^7
        const xMax = Math.log10(5e12);  // 5×10^12
        const yMin = Math.log10(800);
        const yMax = Math.log10(8000);

        const toX = (gates: number) => pad.left + ((Math.log10(gates) - xMin) / (xMax - xMin)) * plotW;
        const toY = (qubits: number) => pad.top + (1 - (Math.log10(qubits) - yMin) / (yMax - yMin)) * plotH;

        // Grid
        ctx.strokeStyle = EP_COLORS.line;
        ctx.lineWidth = 0.5;
        for (let e = 8; e <= 12; e++) {
          const x = toX(Math.pow(10, e));
          ctx.beginPath();
          ctx.moveTo(x, pad.top);
          ctx.lineTo(x, height - pad.bottom);
          ctx.stroke();

          ctx.fillStyle = EP_COLORS.textDim;
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`10^${e}`, x, height - pad.bottom + 20);
        }
        for (let e = 3; e <= 3.8; e += 0.2) {
          const y = toY(Math.pow(10, e));
          ctx.beginPath();
          ctx.moveTo(pad.left, y);
          ctx.lineTo(width - pad.right, y);
          ctx.stroke();
        }

        // Axis labels
        ctx.fillStyle = EP_COLORS.textDim;
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Toffoli Gates →', width / 2, height - 15);
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Logical Qubits ↑', 0, 0);
        ctx.restore();

        // Data points
        const numVisible = Math.floor(progress * RESOURCE_DATA.length);
        for (let i = 0; i < numVisible; i++) {
          const d = RESOURCE_DATA[i];
          const x = toX(d.gates);
          const y = toY(d.qubits);
          const isGoogle = i === RESOURCE_DATA.length - 1;
          const r = isGoogle ? 10 : 7;
          const color = isGoogle ? EP_COLORS.accent : EP_COLORS.lineBright;

          // Glow for Google
          if (isGoogle) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 400);
            ctx.save();
            ctx.shadowColor = EP_COLORS.accent;
            ctx.shadowBlur = 12 + pulse * 8;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
          }

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Label
          ctx.font = `${isGoogle ? 'bold ' : ''}13px "JetBrains Mono", monospace`;
          ctx.fillStyle = isGoogle ? EP_COLORS.accent : EP_COLORS.textMuted;
          ctx.textAlign = 'left';
          ctx.fillText(d.label, x + r + 6, y + 4);
        }

        // Trend arrow through historical points
        if (numVisible >= 3) {
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = EP_COLORS.textDim;
          ctx.lineWidth = 1;
          ctx.beginPath();
          const first = RESOURCE_DATA[0];
          const beforeLast = RESOURCE_DATA[Math.min(numVisible - 2, RESOURCE_DATA.length - 2)];
          ctx.moveTo(toX(first.gates), toY(first.qubits));
          ctx.lineTo(toX(beforeLast.gates), toY(beforeLast.qubits));
          ctx.stroke();
          ctx.restore();
        }

        // Annotation card for Google
        if (numVisible >= RESOURCE_DATA.length) {
          const gd = RESOURCE_DATA[RESOURCE_DATA.length - 1];
          const gx = toX(gd.gates);
          const gy = toY(gd.qubits);

          ctx.fillStyle = EP_COLORS.bgPanel;
          ctx.strokeStyle = EP_COLORS.accent;
          ctx.lineWidth = 2;
          const cardX = gx + 20;
          const cardY = gy + 15;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, 180, 50, 4);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cardX, cardY);
          ctx.lineTo(cardX, cardY + 50);
          ctx.stroke();

          ctx.font = '16px "JetBrains Mono", monospace';
          ctx.fillStyle = EP_COLORS.accent;
          ctx.textAlign = 'left';
          ctx.fillText('1,200 qubits', cardX + 12, cardY + 22);
          ctx.fillText('90M gates', cardX + 12, cardY + 42);
        }

      } else {
        // Trend chart: physical qubits over time (log Y)
        const xMin = 2011;
        const xMax = 2027;
        const yMinLog = 5.5; // 10^5.5
        const yMaxLog = 9.5; // 10^9.5

        const toX = (year: number) => pad.left + ((year - xMin) / (xMax - xMin)) * plotW;
        const toY = (qubits: number) => pad.top + (1 - (Math.log10(qubits) - yMinLog) / (yMaxLog - yMinLog)) * plotH;

        // Grid
        ctx.strokeStyle = EP_COLORS.line;
        ctx.lineWidth = 0.5;
        for (let y = 2012; y <= 2026; y += 2) {
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
        for (let e = 6; e <= 9; e++) {
          const y = toY(Math.pow(10, e));
          ctx.beginPath();
          ctx.moveTo(pad.left, y);
          ctx.lineTo(width - pad.right, y);
          ctx.stroke();
          ctx.fillStyle = EP_COLORS.textDim;
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`10^${e}`, pad.left - 10, y + 4);
        }

        // Data points and trend line
        const numVisible = Math.floor(progress * RESOURCE_TREND_DATA.length);
        ctx.beginPath();
        for (let i = 0; i < numVisible; i++) {
          const d = RESOURCE_TREND_DATA[i];
          const x = toX(d.year);
          const y = toY(d.qubits);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          // Dot
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = EP_COLORS.textMuted;
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = EP_COLORS.lineBright;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Extrapolation dashed line
        if (numVisible >= RESOURCE_TREND_DATA.length) {
          const last = RESOURCE_TREND_DATA[RESOURCE_TREND_DATA.length - 1];
          const secondLast = RESOURCE_TREND_DATA[RESOURCE_TREND_DATA.length - 2];
          const slope = (Math.log10(last.qubits) - Math.log10(secondLast.qubits)) / (last.year - secondLast.year);

          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = EP_COLORS.textDim;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(toX(last.year), toY(last.qubits));
          const futureYear = 2028;
          const futureQubits = Math.pow(10, Math.log10(last.qubits) + slope * (futureYear - last.year));
          ctx.lineTo(toX(futureYear), toY(futureQubits));
          ctx.stroke();
          ctx.restore();

          // "?" at end
          ctx.font = '18px "JetBrains Mono", monospace';
          ctx.fillStyle = EP_COLORS.textDim;
          ctx.textAlign = 'center';
          ctx.fillText('?', toX(futureYear) + 10, toY(futureQubits));
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [variant, progress, width, height]);

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
