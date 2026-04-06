import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, RESOURCE_DATA, RSA_TREND } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

// Log-scale mapping
const logScale = (val: number, min: number, max: number, size: number) => {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return ((Math.log10(val) - logMin) / (logMax - logMin)) * size;
};

// Figure 1: scatter plot dimensions
const W = 400, H = 260;
const GATES_MIN = 5e7, GATES_MAX = 1e11;
const QUBITS_MIN = 800, QUBITS_MAX = 8000;

export default function ResourceChart({ scene, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    // Scene 12: Figure 1 scatter plot
    12: (tl) => {
      tl.from('.rc-axis-x', { scaleX: 0, duration: 0.3, ease: 'power3.out' })
        .from('.rc-axis-y', { scaleY: 0, duration: 0.3, ease: 'power3.out' }, '<+0.1');

      // Historical dots appear chronologically
      RESOURCE_DATA.forEach((_, i) => {
        const isLast = RESOURCE_DATA[i].isThisWork;
        tl.from(`.rc-dot-${i}`, {
          scale: 0, opacity: 0,
          duration: isLast ? 0.2 : 0.3,
          ease: isLast ? 'power4.out' : 'back.out(2)',
        }, isLast ? '+=0.4' : '+=0.15');
        tl.from(`.rc-label-${i}`, { opacity: 0, y: 5, duration: 0.2 }, '-=0.15');
      });

      // Impact for "This Work" dots
      tl.fromTo('.rc-container', { x: 0 }, { x: 3, duration: 0.05, yoyo: true, repeat: 5 }, '-=0.3')
        .from('.rc-reduction', { opacity: 0, y: 10, duration: 0.3, ease: 'back.out(2)' });
    },
    // Scene 13: RSA trend
    13: (tl) => {
      tl.from('.rsa-chart', { opacity: 0, y: 20, duration: 0.4 })
        .from('.rsa-dot', { scale: 0, opacity: 0, stagger: 0.15, duration: 0.25, ease: 'back.out(2)' })
        .from('.rsa-trend-line', { strokeDashoffset: 500, duration: 1.5, ease: 'power2.inOut' })
        .from('.rsa-annotation', { opacity: 0, x: -15, duration: 0.3 }, '-=0.5')
        .from('.rsa-bridge', { opacity: 0, y: 10, duration: 0.3 });
    },
  });

  return (
    <div ref={ref} className="rc-container" style={{ position: 'relative', ...style }}>
      {/* Figure 1: Resource scatter plot */}
      <svg viewBox={`-55 -25 ${W + 80} ${H + 55}`} style={{ width: '55vw', height: '35vh' }}>
        {/* Axes */}
        <line className="rc-axis-x" x1="0" y1={H} x2={W} y2={H}
          stroke={EP_COLORS.border} strokeWidth="1" style={{ transformOrigin: `0 ${H}px` }} />
        <line className="rc-axis-y" x1="0" y1="0" x2="0" y2={H}
          stroke={EP_COLORS.border} strokeWidth="1" style={{ transformOrigin: `0 ${H}px` }} />

        {/* Axis labels */}
        <text x={W / 2} y={H + 35} fill={EP_COLORS.textDim} fontSize="11"
          textAnchor="middle" fontFamily="JetBrains Mono, monospace">Toffoli Gates</text>
        <text x="-35" y={H / 2} fill={EP_COLORS.textDim} fontSize="11"
          textAnchor="middle" fontFamily="JetBrains Mono, monospace"
          transform={`rotate(-90, -35, ${H / 2})`}>Logical Qubits</text>

        {/* Grid lines */}
        {[1e8, 1e9, 1e10].map(g => {
          const x = logScale(g, GATES_MIN, GATES_MAX, W);
          return <line key={g} x1={x} y1="0" x2={x} y2={H}
            stroke={EP_COLORS.border} strokeWidth="0.5" opacity="0.3" />;
        })}
        {[1000, 2000, 4000].map(q => {
          const y = H - logScale(q, QUBITS_MIN, QUBITS_MAX, H);
          return <line key={q} x1="0" y1={y} x2={W} y2={y}
            stroke={EP_COLORS.border} strokeWidth="0.5" opacity="0.3" />;
        })}

        {/* X ticks */}
        {[1e8, 1e9, 1e10, 1e11].map(g => (
          <text key={g} x={logScale(g, GATES_MIN, GATES_MAX, W)} y={H + 16}
            fill={EP_COLORS.textDim} fontSize="8" textAnchor="middle"
            fontFamily="JetBrains Mono, monospace">
            {g >= 1e9 ? `${g / 1e9}B` : `${g / 1e6}M`}
          </text>
        ))}

        {/* Y ticks */}
        {[1000, 2000, 4000].map(q => (
          <text key={q} x="-8" y={H - logScale(q, QUBITS_MIN, QUBITS_MAX, H) + 3}
            fill={EP_COLORS.textDim} fontSize="8" textAnchor="end"
            fontFamily="JetBrains Mono, monospace">{q >= 1000 ? `${q / 1000}K` : q}</text>
        ))}

        {/* Data points */}
        {RESOURCE_DATA.map((d, i) => {
          const cx = logScale(d.gates, GATES_MIN, GATES_MAX, W);
          const cy = H - logScale(d.qubits, QUBITS_MIN, QUBITS_MAX, H);
          const isThis = 'isThisWork' in d && d.isThisWork;
          return (
            <g key={i}>
              {isThis ? (
                <text className={`rc-dot-${i}`} x={cx} y={cy + 5}
                  fill={EP_COLORS.warning} fontSize="18" textAnchor="middle"
                  style={{ filter: `drop-shadow(0 0 6px ${EP_COLORS.warning})` }}>★</text>
              ) : (
                <circle className={`rc-dot-${i}`} cx={cx} cy={cy} r="6"
                  fill={EP_COLORS.quantum} opacity="0.8" />
              )}
              <text className={`rc-label-${i}`} x={cx + (isThis ? 14 : 10)} y={cy + 3}
                fill={isThis ? EP_COLORS.warning : EP_COLORS.textDim} fontSize="8"
                fontFamily="JetBrains Mono, monospace">{d.author}</text>
            </g>
          );
        })}

        {/* Reduction label */}
        <text className="rc-reduction" x={logScale(9e7, GATES_MIN, GATES_MAX, W)}
          y={H - logScale(1200, QUBITS_MIN, QUBITS_MAX, H) + 25}
          fill={EP_COLORS.danger} fontSize="13" fontWeight="bold"
          textAnchor="middle" fontFamily="Montserrat, sans-serif">20× reduction</text>
      </svg>

      {/* Figure 3 adaptation: RSA trend chart */}
      <div className="rsa-chart" style={{ marginTop: '2vh' }}>
        <svg viewBox="-45 -15 340 180" style={{ width: '45vw', height: '20vh' }}>
          <text x="150" y="-2" fill={EP_COLORS.textDim} fontSize="10" textAnchor="middle"
            fontFamily="Montserrat, sans-serif" fontWeight="600">
            RSA-2048 Physical Qubit Estimates Over Time
          </text>
          {/* Axes */}
          <line x1="0" y1="140" x2="300" y2="140" stroke={EP_COLORS.border} strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="140" stroke={EP_COLORS.border} strokeWidth="1" />

          {/* Dots */}
          {RSA_TREND.map((d, i) => {
            const x = ((d.year - 2010) / 16) * 300;
            const y = 140 - logScale(d.qubits, 5e5, 2e9, 140);
            return (
              <g key={i}>
                <circle className="rsa-dot" cx={x} cy={y} r="5"
                  fill={EP_COLORS.quantum} opacity="0.7" />
                <text x={x} y="155" fill={EP_COLORS.textDim} fontSize="7"
                  textAnchor="middle" fontFamily="JetBrains Mono, monospace">{d.year}</text>
              </g>
            );
          })}

          {/* Trend line */}
          <path className="rsa-trend-line"
            d={RSA_TREND.map((d, i) => {
              const x = ((d.year - 2010) / 16) * 300;
              const y = 140 - logScale(d.qubits, 5e5, 2e9, 140);
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ')}
            fill="none" stroke={EP_COLORS.gold} strokeWidth="2"
            strokeDasharray="4,3" strokeDashoffset="0" />

          {/* Annotation */}
          <text className="rsa-annotation" x="200" y="30" fill={EP_COLORS.warning}
            fontSize="11" fontWeight="bold" fontFamily="Montserrat, sans-serif">
            1000× reduction in 15 years
          </text>
        </svg>

        <div className="rsa-bridge" style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '1.1vw',
          color: EP_COLORS.textDim, textAlign: 'center', marginTop: '0.5vh',
        }}>
          The same pattern is now starting for elliptic curves ↑
        </div>
      </div>
    </div>
  );
}
