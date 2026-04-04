import { useRef, useEffect } from 'react';
import { EP_COLORS, computeFiniteFieldPoints } from './constants';

export type ECCMode = 'curveDraw' | 'pointAdd' | 'scalarMult' | 'finiteField';

interface ECCCanvasProps {
  mode: ECCMode;
  /** 0-1 progress within the current mode's animation */
  progress: number;
  width?: number;
  height?: number;
  /** Whether to show the quantum "sweep" (scene 13) */
  quantumSweep?: boolean;
  /** Highlight a specific point (for the "found" moment) */
  highlightFound?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Pre-compute finite field points once
const FIELD_POINTS = computeFiniteFieldPoints();
const FIELD_P = 97;

/**
 * Canvas 2D elliptic curve visualization with 4 modes:
 * 1. CURVE_DRAW — animate y² = x³ + 7 drawing itself
 * 2. POINT_ADD — geometric construction: P → tangent → intersection → reflect → 2P
 * 3. SCALAR_MULT — rapid cascade P → 2P → 4P → ... → kP
 * 4. FINITE_FIELD — smooth curve morphs into discrete dots (mod 97)
 *
 * Underlying model: real modular arithmetic for finite field.
 */
export default function ECCCanvas({
  mode,
  progress,
  width = 1200,
  height = 800,
  quantumSweep = false,
  highlightFound = false,
  className,
  style,
}: ECCCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sweepAngleRef = useRef(0);
  const scanIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    // Coordinate system: map math coords to canvas
    const padX = 80;
    const padY = 60;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    // For the smooth curve: x range [-3, 10], y range [-35, 35]
    const curveXMin = -3, curveXMax = 10;
    const curveYMin = -35, curveYMax = 35;

    const toCanvasX = (x: number) => padX + ((x - curveXMin) / (curveXMax - curveXMin)) * plotW;
    const toCanvasY = (y: number) => padY + ((curveYMax - y) / (curveYMax - curveYMin)) * plotH;

    // For finite field: map [0, FIELD_P] to canvas
    const fieldToCanvasX = (x: number) => padX + (x / FIELD_P) * plotW;
    const fieldToCanvasY = (y: number) => padY + (1 - y / FIELD_P) * plotH;

    // Compute curve y = ±sqrt(x³ + 7)
    const curvePoints: Array<{ x: number; yTop: number; yBot: number }> = [];
    const step = 0.05;
    for (let x = -1.7; x <= curveXMax; x += step) {
      const val = x * x * x + 7;
      if (val >= 0) {
        const y = Math.sqrt(val);
        curvePoints.push({ x, yTop: y, yBot: -y });
      }
    }

    // Point addition geometry
    // Use P = (1, √8 ≈ 2.83) as generator on the real curve
    const P = { x: 1, y: Math.sqrt(1 + 7) };

    // Tangent slope at P for y² = x³ + 7: dy/dx = 3x²/(2y)
    const tangentSlope = (px: number, py: number) => (3 * px * px) / (2 * py);

    // Find intersection of tangent at P with curve
    const computePointAdd = (px: number, py: number) => {
      const m = tangentSlope(px, py);
      // x³ - m²x² + ... = 0, third root: x3 = m² - 2*px
      const x3 = m * m - 2 * px;
      const y3 = -(py + m * (x3 - px)); // reflect
      return { x: x3, y: y3, slope: m };
    };

    // Points for scalar mult visualization
    const scalarMultPoints: Array<{ x: number; y: number }> = [P];
    let cur = { ...P };
    for (let i = 0; i < 40; i++) {
      const result = computePointAdd(cur.x, cur.y);
      // Wrap points to stay in view (mod-like for visual)
      const wrapped = {
        x: ((result.x % 10) + 10) % 10,
        y: result.y > 0
          ? Math.sqrt(Math.max(0, wrapped_x_val(result.x)))
          : -Math.sqrt(Math.max(0, wrapped_x_val(result.x))),
      };
      // Just use scattered positions for visual effect
      scalarMultPoints.push({
        x: curveXMin + 1 + Math.random() * (curveXMax - curveXMin - 2),
        y: curveYMin + 5 + Math.random() * (curveYMax - curveYMin - 10),
      });
      cur = result;
    }

    function wrapped_x_val(x: number) {
      const wx = ((x % 10) + 10) % 10;
      return wx * wx * wx + 7;
    }

    const drawAxes = (alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = EP_COLORS.line;
      ctx.lineWidth = 1;

      // X axis
      ctx.beginPath();
      ctx.moveTo(padX, toCanvasY(0));
      ctx.lineTo(width - padX, toCanvasY(0));
      ctx.stroke();

      // Y axis
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), padY);
      ctx.lineTo(toCanvasX(0), height - padY);
      ctx.stroke();

      // Tick marks
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = EP_COLORS.textDim;
      ctx.textAlign = 'center';
      for (let x = 0; x <= curveXMax; x += 2) {
        const cx = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(cx, toCanvasY(0) - 4);
        ctx.lineTo(cx, toCanvasY(0) + 4);
        ctx.stroke();
        if (x > 0) ctx.fillText(x.toString(), cx, toCanvasY(0) + 18);
      }
      ctx.restore();
    };

    const drawCurve = (progressPct: number, alpha: number) => {
      const pointCount = Math.floor(curvePoints.length * Math.min(progressPct, 1));
      if (pointCount < 2) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = EP_COLORS.lineBright;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = EP_COLORS.text;
      ctx.lineWidth = 3;

      // Top branch
      ctx.beginPath();
      ctx.moveTo(toCanvasX(curvePoints[0].x), toCanvasY(curvePoints[0].yTop));
      for (let i = 1; i < pointCount; i++) {
        ctx.lineTo(toCanvasX(curvePoints[i].x), toCanvasY(curvePoints[i].yTop));
      }
      ctx.stroke();

      // Bottom branch
      ctx.beginPath();
      ctx.moveTo(toCanvasX(curvePoints[0].x), toCanvasY(curvePoints[0].yBot));
      for (let i = 1; i < pointCount; i++) {
        ctx.lineTo(toCanvasX(curvePoints[i].x), toCanvasY(curvePoints[i].yBot));
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawPoint = (
      x: number, y: number, radius: number,
      color: string, label?: string, glow?: boolean
    ) => {
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      if (glow) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (label) {
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(label, cx + radius + 6, cy - 4);
      }
    };

    const drawFieldPoint = (
      fx: number, fy: number, radius: number,
      color: string, alpha: number,
    ) => {
      const cx = fieldToCanvasX(fx);
      const cy = fieldToCanvasY(fy);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const render = (now: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      if (mode === 'curveDraw') {
        // Progress: 0→0.3 axes draw, 0.3→0.8 curve traces, 0.8→1 labels
        const axesProg = Math.min(progress / 0.3, 1);
        const curveProg = Math.max(0, Math.min((progress - 0.15) / 0.6, 1));

        drawAxes(axesProg);
        drawCurve(curveProg, 1);

        // Generator point P appears near end
        if (progress > 0.6) {
          const pointAlpha = Math.min((progress - 0.6) / 0.15, 1);
          ctx.globalAlpha = pointAlpha;
          drawPoint(P.x, P.y, 8, EP_COLORS.text, 'P (generator point)', true);
          ctx.globalAlpha = 1;
        }
      }

      else if (mode === 'pointAdd') {
        // Full curve visible
        drawAxes(1);
        drawCurve(1, 0.8);
        drawPoint(P.x, P.y, 8, EP_COLORS.text, 'P', true);

        // Point addition construction
        if (progress > 0.1) {
          const result = computePointAdd(P.x, P.y);
          const tangentProg = Math.min((progress - 0.1) / 0.2, 1);

          // Draw tangent line
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = EP_COLORS.lineBright;
          ctx.lineWidth = 2;
          ctx.globalAlpha = tangentProg;
          const tLen = 8;
          ctx.beginPath();
          ctx.moveTo(
            toCanvasX(P.x - tLen),
            toCanvasY(P.y - tLen * result.slope),
          );
          ctx.lineTo(
            toCanvasX(P.x + tLen),
            toCanvasY(P.y + tLen * result.slope),
          );
          ctx.stroke();
          ctx.restore();

          // Intersection point (unreflected)
          if (progress > 0.35) {
            const unreflectedY = -(result.y); // before reflection
            drawPoint(result.x, unreflectedY, 6, EP_COLORS.textMuted, 'intersection', false);

            // Reflection line
            if (progress > 0.5) {
              const reflProg = Math.min((progress - 0.5) / 0.15, 1);
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = EP_COLORS.textDim;
              ctx.lineWidth = 1;
              ctx.globalAlpha = reflProg;
              ctx.beginPath();
              ctx.moveTo(toCanvasX(result.x), toCanvasY(unreflectedY));
              ctx.lineTo(toCanvasX(result.x), toCanvasY(result.y));
              ctx.stroke();
              ctx.restore();
            }

            // Result point 2P
            if (progress > 0.6) {
              drawPoint(result.x, result.y, 8, EP_COLORS.text, '2P', true);
            }

            // 3P (from 2P)
            if (progress > 0.75) {
              const result3 = computePointAdd(result.x, result.y);
              // Abbreviated construction
              const p3Alpha = Math.min((progress - 0.75) / 0.15, 1);
              ctx.globalAlpha = p3Alpha;
              drawPoint(result3.x, result3.y, 8, EP_COLORS.text, '3P', true);
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      else if (mode === 'scalarMult') {
        drawAxes(0.6);
        drawCurve(1, 0.4);

        // Cascade of points
        const numVisible = Math.floor(progress * scalarMultPoints.length);
        for (let i = 0; i < numVisible; i++) {
          const p = scalarMultPoints[i];
          const isLast = i === numVisible - 1;
          const alpha = isLast ? 1 : 0.3 + 0.3 * (i / numVisible);
          const r = isLast ? 10 : 4;
          const label = i === 0 ? 'P' : i === numVisible - 1 ? 'kP = Public Key' : undefined;
          ctx.globalAlpha = alpha;
          drawPoint(p.x, p.y, r, isLast ? EP_COLORS.text : EP_COLORS.textMuted, label, isLast);

          // Trail lines
          if (i > 0) {
            const prev = scalarMultPoints[i - 1];
            ctx.beginPath();
            ctx.moveTo(toCanvasX(prev.x), toCanvasY(prev.y));
            ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y));
            ctx.strokeStyle = EP_COLORS.line;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        // Counter
        if (progress > 0.2) {
          const k = Math.floor(progress * 256);
          ctx.font = '18px "JetBrains Mono", monospace';
          ctx.fillStyle = EP_COLORS.textMuted;
          ctx.textAlign = 'right';
          ctx.fillText(
            k < 256 ? `k = ${Math.pow(2, Math.min(k, 20)).toLocaleString()}` : 'k = 2²⁵⁶',
            width - padX,
            padY + 20,
          );
        }
      }

      else if (mode === 'finiteField') {
        // Morph from smooth curve to finite field dots
        // progress 0→0.3: curve breaks into dots
        // progress 0.3→1: dots settle into grid

        const morphProg = Math.min(progress / 0.5, 1);

        if (morphProg < 1) {
          // Fading curve
          drawAxes(1 - morphProg);
          drawCurve(1, 1 - morphProg);
        }

        // Draw grid lines (finite field)
        if (morphProg > 0.3) {
          const gridAlpha = Math.min((morphProg - 0.3) / 0.3, 0.15);
          ctx.strokeStyle = EP_COLORS.line;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = gridAlpha;
          for (let x = 0; x < FIELD_P; x += 10) {
            ctx.beginPath();
            ctx.moveTo(fieldToCanvasX(x), padY);
            ctx.lineTo(fieldToCanvasX(x), height - padY);
            ctx.stroke();
          }
          for (let y = 0; y < FIELD_P; y += 10) {
            ctx.beginPath();
            ctx.moveTo(padX, fieldToCanvasY(y));
            ctx.lineTo(width - padX, fieldToCanvasY(y));
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Dots: interpolate from curve positions to field positions
        for (let i = 0; i < FIELD_POINTS.length; i++) {
          const fp = FIELD_POINTS[i];
          // Map field point to a curve position for morphing
          const curveX = (fp.x / FIELD_P) * (curveXMax - curveXMin) + curveXMin;
          const curveY = (fp.y / FIELD_P) * (curveYMax - curveYMin) + curveYMin;
          const curveCanvasX = toCanvasX(curveX);
          const curveCanvasY = toCanvasY(curveY);
          const fieldCanvasX = fieldToCanvasX(fp.x);
          const fieldCanvasY = fieldToCanvasY(fp.y);

          // Lerp
          const dx = curveCanvasX + (fieldCanvasX - curveCanvasX) * morphProg;
          const dy = curveCanvasY + (fieldCanvasY - curveCanvasY) * morphProg;

          const dotAlpha = 0.3 + morphProg * 0.7;
          ctx.beginPath();
          ctx.arc(dx, dy, 3 + morphProg * 3, 0, Math.PI * 2);
          ctx.fillStyle = EP_COLORS.text;
          ctx.globalAlpha = dotAlpha;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Highlight one point as "public key"
        if (progress > 0.6) {
          const pkPoint = FIELD_POINTS[42]; // arbitrary "public key"
          const pkAlpha = Math.min((progress - 0.6) / 0.1, 1);
          ctx.globalAlpha = pkAlpha;
          const pkx = fieldToCanvasX(pkPoint.x);
          const pky = fieldToCanvasY(pkPoint.y);
          ctx.save();
          ctx.shadowColor = EP_COLORS.accent;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(pkx, pky, 8, 0, Math.PI * 2);
          ctx.fillStyle = EP_COLORS.accent;
          ctx.fill();
          ctx.restore();
          ctx.font = '14px "JetBrains Mono", monospace';
          ctx.fillStyle = EP_COLORS.accent;
          ctx.textAlign = 'left';
          ctx.fillText('Your public key is HERE', pkx + 14, pky - 4);
          ctx.globalAlpha = 1;
        }

        // Quantum sweep (scene 13)
        if (quantumSweep) {
          sweepAngleRef.current += 0.02;
          const sweepProgress = Math.min(sweepAngleRef.current, 1);

          if (sweepProgress < 0.5) {
            // Classical scan — highlight one dot at a time
            scanIndexRef.current = Math.floor(sweepProgress * 30);
            for (let i = 0; i < FIELD_POINTS.length; i++) {
              const fp = FIELD_POINTS[i];
              const fx = fieldToCanvasX(fp.x);
              const fy = fieldToCanvasY(fp.y);
              const isCurrent = i === scanIndexRef.current;
              ctx.beginPath();
              ctx.arc(fx, fy, isCurrent ? 8 : 3, 0, Math.PI * 2);
              ctx.fillStyle = isCurrent ? EP_COLORS.text : EP_COLORS.line;
              ctx.fill();
            }
          } else {
            // Quantum sweep — all light up simultaneously
            const sweepAlpha = Math.min((sweepProgress - 0.5) / 0.1, 1);
            // Radial glow
            const grd = ctx.createRadialGradient(
              width / 2, height / 2, 0,
              width / 2, height / 2, plotW / 2,
            );
            grd.addColorStop(0, `rgba(255, 45, 45, ${0.15 * sweepAlpha})`);
            grd.addColorStop(1, 'rgba(255, 45, 45, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, width, height);

            for (const fp of FIELD_POINTS) {
              const fx = fieldToCanvasX(fp.x);
              const fy = fieldToCanvasY(fp.y);
              ctx.beginPath();
              ctx.arc(fx, fy, 4, 0, Math.PI * 2);
              ctx.fillStyle = EP_COLORS.accent;
              ctx.globalAlpha = sweepAlpha * 0.8;
              ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Highlight the "found" point
            if (highlightFound && sweepProgress > 0.7) {
              const found = FIELD_POINTS[42];
              const fx = fieldToCanvasX(found.x);
              const fy = fieldToCanvasY(found.y);
              ctx.save();
              ctx.shadowColor = EP_COLORS.accent;
              ctx.shadowBlur = 24;
              ctx.beginPath();
              ctx.arc(fx, fy, 10, 0, Math.PI * 2);
              ctx.fillStyle = EP_COLORS.text;
              ctx.fill();
              ctx.restore();

              // Glow ring
              ctx.beginPath();
              ctx.arc(fx, fy, 18, 0, Math.PI * 2);
              ctx.strokeStyle = EP_COLORS.accent;
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.font = 'bold 16px "JetBrains Mono", monospace';
              ctx.fillStyle = EP_COLORS.accent;
              ctx.textAlign = 'left';
              ctx.fillText('k found.', fx + 24, fy + 4);
            }
          }
        }

        // Flash sequential dots (scene 8 end)
        if (progress > 0.85 && !quantumSweep) {
          const flashIdx = Math.floor((now / 50) % FIELD_POINTS.length);
          for (let i = 0; i < FIELD_POINTS.length; i++) {
            if (Math.abs(i - flashIdx) < 3) {
              const fp = FIELD_POINTS[i];
              ctx.beginPath();
              ctx.arc(fieldToCanvasX(fp.x), fieldToCanvasY(fp.y), 5, 0, Math.PI * 2);
              ctx.fillStyle = EP_COLORS.text;
              ctx.globalAlpha = 0.8;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [mode, progress, width, height, quantumSweep, highlightFound]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
}
