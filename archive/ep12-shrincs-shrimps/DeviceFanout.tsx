/**
 * DeviceFanout — SHRIMPS multi-device signing (Scene 18).
 * One key → two SPHINCS+ instances → fan to 8 device nodes.
 * GSAP ripple-out animation.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface DeviceFanoutProps {
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEVICES = [
  { x: 220, y: 540, icon: 'phone', label: '~2.5 KB' },
  { x: 480, y: 520, icon: 'phone', label: '~2.5 KB' },
  { x: 740, y: 540, icon: 'laptop', label: '~2.5 KB' },
  { x: 960, y: 560, icon: 'laptop', label: '~2.5 KB' },
  { x: 1180, y: 540, icon: 'hw', label: '~2.5 KB' },
  { x: 1440, y: 520, icon: 'hw', label: '~2.5 KB' },
  { x: 1620, y: 550, icon: 'server', label: '~2.5 KB' },
  { x: 1780, y: 530, icon: 'server', label: '~2.5 KB' },
];

function DeviceIcon({ type, x, y }: { type: string; x: number; y: number }) {
  const s = 44;
  if (type === 'phone') {
    return <rect x={x - s / 3} y={y - s / 2} width={s * 0.66} height={s} rx="6"
      fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2" />;
  }
  if (type === 'laptop') {
    return (
      <g>
        <rect x={x - s / 2} y={y - s * 0.35} width={s} height={s * 0.6} rx="4"
          fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2" />
        <line x1={x - s * 0.6} y1={y + s * 0.3} x2={x + s * 0.6} y2={y + s * 0.3}
          stroke={EP_COLORS.accent} strokeWidth="2" />
      </g>
    );
  }
  if (type === 'hw') {
    return (
      <polygon
        points={`${x},${y - s / 2} ${x + s / 2},${y - s / 6} ${x + s / 2},${y + s / 3} ${x},${y + s / 2} ${x - s / 2},${y + s / 3} ${x - s / 2},${y - s / 6}`}
        fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2" />
    );
  }
  // server (circle)
  return <circle cx={x} cy={y} r={s / 2.2}
    fill={EP_COLORS.bgAlt} stroke={EP_COLORS.accent} strokeWidth="2" />;
}

export default function DeviceFanout({ active, className, style }: DeviceFanoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;
    const c = containerRef.current;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Central key
    tl.fromTo(c.querySelector('.fanout-key'),
      { scale: 0 }, { scale: 1, duration: 0.3 }, 0);

    // SPHINCS+ nodes
    tl.fromTo(c.querySelectorAll('.fanout-sphincs'),
      { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.12 }, 0.3);

    // Fan lines
    tl.fromTo(c.querySelectorAll('.fanout-line'),
      { strokeDashoffset: 500 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.06 }, 0.7);

    // Device icons
    tl.fromTo(c.querySelectorAll('.fanout-device'),
      { scale: 0 }, { scale: 1, duration: 0.35, stagger: 0.08 }, 1.0);

    // Labels
    tl.fromTo(c.querySelectorAll('.fanout-label'),
      { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.05 }, 1.5);

    // Ripple rings
    tl.fromTo(c.querySelectorAll('.fanout-ring'),
      { scale: 0, opacity: 0.3 },
      { scale: 3, opacity: 0, duration: 2, stagger: 0.4, repeat: -1 }, 2.0);
  }, [active]);

  useEffect(() => {
    if (!active) hasAnimated.current = false;
  }, [active]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet">
        {/* Ripple rings from center */}
        {[0, 1, 2].map(i => (
          <circle key={`ring-${i}`} className="fanout-ring"
            cx="960" cy="120" r="50"
            fill="none" stroke={EP_COLORS.accent} strokeWidth="1" opacity="0" />
        ))}

        {/* Lines from key to SPHINCS+ nodes */}
        <line className="fanout-line" x1="960" y1="155" x2="640" y2="290"
          stroke={EP_COLORS.stateless} strokeWidth="2" strokeDasharray="500" strokeDashoffset="500" opacity="0.6" />
        <line className="fanout-line" x1="960" y1="155" x2="1280" y2="290"
          stroke={EP_COLORS.stateless} strokeWidth="2" strokeDasharray="500" strokeDashoffset="500" opacity="0.6" />

        {/* Lines from SPHINCS+ nodes to devices */}
        {DEVICES.map((d, i) => {
          const sourceX = i < 4 ? 640 : 1280;
          return (
            <line key={`fl-${i}`} className="fanout-line"
              x1={sourceX} y1="330" x2={d.x} y2={d.y - 30}
              stroke={EP_COLORS.accent} strokeWidth="1.5" strokeDasharray="500" strokeDashoffset="500" opacity="0.4" />
          );
        })}

        {/* SPHINCS+ nodes */}
        <g className="fanout-sphincs" style={{ transformOrigin: '640px 310px' }}>
          <rect x="575" y="285" width="130" height="50" rx="8"
            fill={EP_COLORS.bgAlt} stroke={EP_COLORS.stateless} strokeWidth="2" opacity="0.6" />
          <text x="640" y="316" textAnchor="middle" fill={EP_COLORS.textDim}
            fontFamily="var(--font-mono)" fontSize="13">SPHINCS+₁</text>
        </g>
        <g className="fanout-sphincs" style={{ transformOrigin: '1280px 310px' }}>
          <rect x="1215" y="285" width="130" height="50" rx="8"
            fill={EP_COLORS.bgAlt} stroke={EP_COLORS.stateless} strokeWidth="2" opacity="0.6" />
          <text x="1280" y="316" textAnchor="middle" fill={EP_COLORS.textDim}
            fontFamily="var(--font-mono)" fontSize="13">SPHINCS+₂</text>
        </g>

        {/* Device icons */}
        {DEVICES.map((d, i) => (
          <g key={`dev-${i}`} className="fanout-device" style={{ transformOrigin: `${d.x}px ${d.y}px` }}>
            <DeviceIcon type={d.icon} x={d.x} y={d.y} />
          </g>
        ))}

        {/* Size labels under devices */}
        {DEVICES.map((d, i) => (
          <text key={`lbl-${i}`} className="fanout-label"
            x={d.x} y={d.y + 42} textAnchor="middle"
            fill={EP_COLORS.textDim} fontFamily="var(--font-mono)" fontSize="12" opacity="0">
            {d.label}
          </text>
        ))}
      </svg>

      {/* Central key */}
      <div className="fanout-key" style={{
        position: 'absolute', left: '50%', top: '8%',
        transform: 'translate(-50%, -50%) scale(0)',
        padding: '12px 24px', borderRadius: 12,
        border: `2px solid ${EP_COLORS.accent}`,
        background: EP_COLORS.bgAlt,
        fontFamily: 'var(--font-mono)', fontSize: 15, color: EP_COLORS.text,
        whiteSpace: 'nowrap',
      }}>
        SHRIMPS pk
      </div>

      {/* Capacity label */}
      <div style={{
        position: 'absolute', left: '50%', top: '66%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24,
        color: EP_COLORS.accent, textAlign: 'center',
        opacity: active ? 1 : 0, transition: 'opacity 0.5s 3s',
      }}>
        Up to 1,024 devices
      </div>
      <div style={{
        position: 'absolute', left: '50%', top: '71%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-body)', fontSize: 17, color: EP_COLORS.textDim,
        textAlign: 'center',
        opacity: active ? 1 : 0, transition: 'opacity 0.5s 3.3s',
      }}>
        No state coordination between devices
      </div>
    </div>
  );
}
