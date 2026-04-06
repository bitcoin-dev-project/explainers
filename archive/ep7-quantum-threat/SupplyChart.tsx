import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

// Simplified supply data (cumulative % of 19.8M total, by year)
const LAYERS = [
  { name: 'P2PK', color: EP_COLORS.gold, data: [100, 95, 50, 20, 12, 10, 9], vulnerable: true },
  { name: 'P2PKH', color: '#6B7280', data: [0, 5, 45, 60, 50, 42, 38], vulnerable: false },
  { name: 'P2SH', color: '#4B5563', data: [0, 0, 5, 15, 18, 16, 14], vulnerable: false },
  { name: 'P2WPKH', color: '#374151', data: [0, 0, 0, 0, 12, 18, 20], vulnerable: false },
  { name: 'P2WSH', color: '#2C3040', data: [0, 0, 0, 0, 3, 5, 5], vulnerable: false },
  { name: 'P2TR', color: EP_COLORS.quantumDim, data: [0, 0, 0, 0, 0, 4, 14], vulnerable: true },
];

const YEARS = [2009, 2012, 2015, 2017, 2020, 2023, 2026];
const W = 380, H = 200;

function buildAreaPath(layerIdx: number): string {
  // Stack layers bottom-up
  const pts: Array<{ x: number; yBottom: number; yTop: number }> = [];

  for (let yi = 0; yi < YEARS.length; yi++) {
    const x = (yi / (YEARS.length - 1)) * W;
    let yBottom = 0;
    for (let li = 0; li < layerIdx; li++) {
      yBottom += LAYERS[li].data[yi];
    }
    const yTop = yBottom + LAYERS[layerIdx].data[yi];
    pts.push({ x, yBottom: H - (yBottom / 100) * H, yTop: H - (yTop / 100) * H });
  }

  // Build path: top line forward, bottom line backward
  const top = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yTop}`).join(' ');
  const bottom = pts.slice().reverse().map((p, i) => `${i === 0 ? 'L' : 'L'}${p.x},${p.yBottom}`).join(' ');
  return `${top} ${bottom} Z`;
}

export default function SupplyChart({ scene, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    16: (tl) => {
      tl.from('.sc-axes', { opacity: 0, duration: 0.3 });

      // Layers build chronologically
      LAYERS.forEach((_, i) => {
        tl.from(`.sc-layer-${i}`, {
          opacity: 0, scaleY: 0,
          duration: 0.5, ease: 'power2.out',
          transformOrigin: 'bottom',
        }, `+=${i === 0 ? 0.3 : 0.15}`);
      });

      // Hatched overlay on vulnerable layers
      tl.from('.sc-hatch', { opacity: 0, duration: 0.5 }, '+=0.3')
        // P2PK callout
        .from('.sc-callout', { opacity: 0, y: 10, duration: 0.4, ease: 'back.out(2)' })
        .from('.sc-satoshi', { opacity: 0, duration: 0.3 }, '-=0.2');
    },
  });

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <svg viewBox={`-50 -15 ${W + 70} ${H + 50}`} style={{ width: '60vw', height: '32vh' }}>
        {/* Axes */}
        <g className="sc-axes">
          <line x1="0" y1={H} x2={W} y2={H} stroke={EP_COLORS.border} strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2={H} stroke={EP_COLORS.border} strokeWidth="1" />

          {/* X ticks */}
          {YEARS.map((yr, i) => (
            <text key={yr} x={(i / (YEARS.length - 1)) * W} y={H + 16}
              fill={EP_COLORS.textDim} fontSize="9" textAnchor="middle"
              fontFamily="JetBrains Mono, monospace">{yr}</text>
          ))}

          {/* Y label */}
          <text x="-35" y={H / 2} fill={EP_COLORS.textDim} fontSize="10"
            textAnchor="middle" fontFamily="JetBrains Mono, monospace"
            transform={`rotate(-90, -35, ${H / 2})`}>Total Supply (%)</text>

          {[25, 50, 75, 100].map(pct => (
            <g key={pct}>
              <line x1="0" y1={H - (pct / 100) * H} x2={W} y2={H - (pct / 100) * H}
                stroke={EP_COLORS.border} strokeWidth="0.5" opacity="0.3" />
              <text x="-8" y={H - (pct / 100) * H + 3} fill={EP_COLORS.textDim}
                fontSize="8" textAnchor="end" fontFamily="JetBrains Mono, monospace">{pct}%</text>
            </g>
          ))}
        </g>

        {/* Stacked area layers */}
        {LAYERS.map((layer, i) => (
          <path key={i} className={`sc-layer-${i}`}
            d={buildAreaPath(i)}
            fill={layer.color} opacity="0.7" />
        ))}

        {/* Hatched overlay on vulnerable portions */}
        <defs>
          <pattern id="sc-hatch" width="6" height="6" patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={EP_COLORS.danger} strokeWidth="1.5" opacity="0.4" />
          </pattern>
        </defs>

        {/* P2PK vulnerable hatch */}
        <path className="sc-hatch" d={buildAreaPath(0)} fill="url(#sc-hatch)" opacity="0" />
        {/* P2TR vulnerable hatch */}
        <path className="sc-hatch" d={buildAreaPath(5)} fill="url(#sc-hatch)" opacity="0" />

        {/* P2PK callout bracket */}
        <g className="sc-callout">
          <line x1={-15} y1={H - 2} x2={-15} y2={H - (9 / 100) * H}
            stroke={EP_COLORS.goldBright} strokeWidth="2" />
          <line x1={-20} y1={H - 2} x2={-10} y2={H - 2}
            stroke={EP_COLORS.goldBright} strokeWidth="2" />
          <line x1={-20} y1={H - (9 / 100) * H} x2={-10} y2={H - (9 / 100) * H}
            stroke={EP_COLORS.goldBright} strokeWidth="2" />
          <text x={W + 10} y={H - 10} fill={EP_COLORS.goldBright}
            fontSize="13" fontWeight="bold" fontFamily="Montserrat, sans-serif">
            1.7M BTC in P2PK
          </text>
        </g>

        <text className="sc-satoshi" x={W + 10} y={H + 5}
          fill={EP_COLORS.gold} fontSize="10"
          fontFamily="JetBrains Mono, monospace">
          Including Satoshi&apos;s ~1M BTC
        </text>

        {/* Layer legend */}
        {LAYERS.map((layer, i) => (
          <g key={i} transform={`translate(${W + 10}, ${20 + i * 16})`}>
            <rect width="10" height="10" fill={layer.color} opacity="0.7" rx="2" />
            <text x="14" y="9" fill={EP_COLORS.textDim} fontSize="8"
              fontFamily="JetBrains Mono, monospace">{layer.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
