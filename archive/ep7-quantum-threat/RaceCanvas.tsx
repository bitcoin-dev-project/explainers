import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

interface RaceCanvasProps {
  scene: number;
  style?: React.CSSProperties;
}

// Poisson CDF: P(T <= t) = 1 - e^(-t/lambda)
function poissonCDF(t: number, lambda: number): number {
  return 1 - Math.exp(-t / lambda);
}

export default function RaceCanvas({ scene, style }: RaceCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    // Scene 14: THE RACE
    14: (tl) => {
      // Title
      tl.from('.race-title', { opacity: 0, y: -20, duration: 0.4, ease: 'power3.out' })
        // Pre-computation label
        .from('.precomp-label', { opacity: 0, duration: 0.3 }, '+=0.1')
        // Progress bar outline
        .from('.progress-outline', { scaleX: 0, duration: 0.3, ease: 'power3.out' }, '-=0.1')
        // CDF axes
        .from('.cdf-axis', { opacity: 0, duration: 0.3 }, '-=0.2')
        // 10-min marker
        .from('.avg-line', { scaleY: 0, duration: 0.3 }, '-=0.1')
        // THE RACE: bar fills over 6 seconds
        .to('.progress-fill', { scaleX: 1, duration: 6, ease: 'none' }, '+=0.2')
        // CDF path draws simultaneously
        .to('.cdf-path-btc', { strokeDashoffset: 0, duration: 6, ease: 'none' }, '<')
        .to('.cdf-path-ltc', { strokeDashoffset: 0, duration: 6, ease: 'none' }, '<')
        // Percentage counter
        .to('.pct-counter', { innerText: 100, duration: 6, ease: 'none', snap: { innerText: 1 },
          modifiers: { innerText: (v: string) => `${Math.round(Number(v))}%` } }, '<')
        // CLIMAX: crack
        .to('.progress-fill', { backgroundColor: EP_COLORS.danger, duration: 0.1 })
        .from('.cracked-label', { scale: 3, opacity: 0, duration: 0.15, ease: 'power4.out' })
        // Screen flash
        .fromTo('.flash-overlay', { opacity: 0.4 }, { opacity: 0, duration: 0.3 })
        // Probability reveal
        .from('.prob-gap', { opacity: 0, duration: 0.3 }, '+=0.2')
        .from('.prob-label', { opacity: 0, scale: 0.9, duration: 0.4, ease: 'back.out(2)' }, '-=0.1');
    },
  });

  // CDF path data for Bitcoin (lambda=10), plot t from 0 to 30
  const cdfW = 320, cdfH = 160;
  const btcPath = Array.from({ length: 60 }, (_, i) => {
    const t = (i / 59) * 30;
    const x = (t / 30) * cdfW;
    const y = cdfH - poissonCDF(t, 10) * cdfH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const ltcPath = Array.from({ length: 60 }, (_, i) => {
    const t = (i / 59) * 30;
    const x = (t / 30) * cdfW;
    const y = cdfH - poissonCDF(t, 2.5) * cdfH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const pathLen = 800; // approximate path length

  // 9-min mark position
  const nineMinX = (9 / 30) * cdfW;
  const nineMinCDF = poissonCDF(9, 10);

  return (
    <div ref={ref} style={{
      width: '130vw', height: '65vh',
      background: EP_COLORS.bgAlt,
      borderRadius: '12px',
      border: `1px solid ${EP_COLORS.border}`,
      padding: '2vh 2vw',
      position: 'relative',
      ...style,
    }}>
      {/* Flash overlay */}
      <div className="flash-overlay" style={{
        position: 'absolute', inset: 0, background: EP_COLORS.danger,
        opacity: 0, borderRadius: '12px', pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Title */}
      <div className="race-title" style={{
        fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
        fontSize: '2.4vw', color: EP_COLORS.danger, textAlign: 'center',
        marginBottom: '1vh',
      }}>Race Against the Block</div>

      <div style={{ display: 'flex', gap: '3vw', alignItems: 'flex-start' }}>
        {/* LEFT: Quantum progress bar */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '1.2vw',
            color: EP_COLORS.quantum, marginBottom: '0.5vh',
          }}>CRQC: Deriving private key...</div>

          <div className="precomp-label" style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '1vw',
            color: EP_COLORS.textDim, marginBottom: '0.8vh',
          }}>Pre-computation: DONE <span style={{ color: EP_COLORS.safe }}>✓</span></div>

          <div className="progress-outline" style={{
            width: '100%', height: '3vh', border: `2px solid ${EP_COLORS.quantum}`,
            borderRadius: '4px', position: 'relative', overflow: 'hidden',
            transformOrigin: 'left',
          }}>
            <div className="progress-fill" style={{
              width: '100%', height: '100%',
              background: `linear-gradient(90deg, ${EP_COLORS.quantumDim}, ${EP_COLORS.quantum})`,
              transformOrigin: 'left', transform: 'scaleX(0)',
            }}>
              {/* Binary cascade effect */}
              <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8vw',
                color: 'rgba(255,255,255,0.3)', lineHeight: 1, whiteSpace: 'nowrap',
                animation: 'ep7-binary-scroll 2s linear infinite',
              }}>
                {'01001101 11010010 10110001 00101101 11001010 01101011 10010110 '.repeat(3)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5vh' }}>
            <span className="pct-counter" style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: '1.4vw',
              color: EP_COLORS.quantumBright,
            }}>0%</span>
          </div>

          {/* CRACKED label */}
          <div className="cracked-label" style={{
            fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
            fontSize: '2vw', color: EP_COLORS.danger, textAlign: 'center',
            marginTop: '1vh', opacity: 0,
          }}>CRACKED</div>
        </div>

        {/* RIGHT: CDF curves */}
        <div style={{ flex: 1.2 }}>
          <svg className="cdf-axis" viewBox={`-30 -15 ${cdfW + 50} ${cdfH + 40}`}
            style={{ width: '100%', height: '100%' }}>
            {/* Axes */}
            <line x1="0" y1={cdfH} x2={cdfW} y2={cdfH}
              stroke={EP_COLORS.border} strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2={cdfH}
              stroke={EP_COLORS.border} strokeWidth="1" />
            {/* X label */}
            <text x={cdfW / 2} y={cdfH + 28} fill={EP_COLORS.textDim}
              fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              Time Since Broadcast (min)
            </text>
            {/* Y label */}
            <text x="-18" y={cdfH / 2} fill={EP_COLORS.textDim}
              fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
              transform={`rotate(-90, -18, ${cdfH / 2})`}>
              P(block found)
            </text>
            {/* Tick marks */}
            {[0, 5, 10, 15, 20, 25, 30].map(t => (
              <g key={t}>
                <line x1={(t / 30) * cdfW} y1={cdfH} x2={(t / 30) * cdfW} y2={cdfH + 4}
                  stroke={EP_COLORS.border} strokeWidth="1" />
                <text x={(t / 30) * cdfW} y={cdfH + 14} fill={EP_COLORS.textDim}
                  fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{t}</text>
              </g>
            ))}

            {/* Avg block line */}
            <line className="avg-line" x1={(10 / 30) * cdfW} y1="0" x2={(10 / 30) * cdfW} y2={cdfH}
              stroke={EP_COLORS.gold} strokeWidth="1" strokeDasharray="4,3"
              style={{ transformOrigin: `${(10 / 30) * cdfW}px ${cdfH}px` }} />
            <text x={(10 / 30) * cdfW + 4} y="12" fill={EP_COLORS.gold}
              fontSize="8" fontFamily="JetBrains Mono, monospace">10 min avg</text>

            {/* Litecoin CDF (faster, for comparison) */}
            <path className="cdf-path-ltc" d={ltcPath} fill="none"
              stroke={EP_COLORS.muted} strokeWidth="1.5" opacity="0.4"
              strokeDasharray={pathLen} strokeDashoffset={pathLen} />
            <text x={cdfW - 5} y={cdfH - poissonCDF(30, 2.5) * cdfH - 4}
              fill={EP_COLORS.muted} fontSize="7" textAnchor="end"
              fontFamily="JetBrains Mono, monospace" opacity="0.5">LTC</text>

            {/* Bitcoin CDF */}
            <path className="cdf-path-btc" d={btcPath} fill="none"
              stroke="url(#btcGrad)" strokeWidth="2.5"
              strokeDasharray={pathLen} strokeDashoffset={pathLen} />
            <defs>
              <linearGradient id="btcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={EP_COLORS.gold} />
                <stop offset="100%" stopColor={EP_COLORS.danger} />
              </linearGradient>
            </defs>

            {/* 9-min attack marker */}
            <line x1={nineMinX} y1="0" x2={nineMinX} y2={cdfH}
              stroke={EP_COLORS.quantum} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

            {/* Probability gap highlight */}
            <rect className="prob-gap"
              x={nineMinX} y={cdfH - nineMinCDF * cdfH}
              width={(10 / 30) * cdfW - nineMinX}
              height={nineMinCDF * cdfH}
              fill={EP_COLORS.warning} opacity="0.2" />
          </svg>

          {/* Probability label */}
          <div className="prob-label" style={{
            fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
            fontSize: '1.6vw', color: EP_COLORS.warning, textAlign: 'center',
            marginTop: '0.5vh',
          }}>~41% chance the attacker wins</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9vw',
            color: EP_COLORS.textDim, textAlign: 'center',
          }}>Bitcoin block time {'>'} 9 min</div>
        </div>
      </div>

      <style>{`
        @keyframes ep7-binary-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33%); }
        }
      `}</style>
    </div>
  );
}
