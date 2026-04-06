/**
 * ForkDiagram — SHRINCS two-path fork (Scene 16).
 * Single pk at top forks into stateful (teal, tiny, bright) and stateless (orange, large, dim).
 * GSAP timeline: top-to-bottom reveal, left path first.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface ForkDiagramProps {
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ForkDiagram({ active, className, style }: ForkDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;
    const c = containerRef.current;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // 1. Public key node
    tl.fromTo(c.querySelector('.fork-pk'),
      { scale: 0 }, { scale: 1, duration: 0.4 }, 0);

    // 2. Fork lines
    tl.fromTo(c.querySelectorAll('.fork-line'),
      { strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.15 }, 0.4);

    // 3. Path labels
    tl.fromTo(c.querySelector('.fork-label-stateful'),
      { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.7);
    tl.fromTo(c.querySelector('.fork-label-stateless'),
      { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.9);

    // 4. Branch lines
    tl.fromTo(c.querySelectorAll('.fork-branch'),
      { strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.1 }, 1.0);

    // 5. Tree nodes
    tl.fromTo(c.querySelectorAll('.fork-node'),
      { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.08 }, 1.2);

    // 6. Signature blocks
    tl.fromTo(c.querySelector('.fork-sig-stateful'),
      { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }, 1.8);
    tl.fromTo(c.querySelector('.fork-sig-stateless'),
      { scale: 0 }, { scale: 1, duration: 0.4 }, 2.1);

    // 7. Detail labels
    tl.fromTo(c.querySelectorAll('.fork-detail'),
      { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.15 }, 2.5);

    // 8. Bottom caption
    tl.fromTo(c.querySelector('.fork-caption'),
      { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 3.2);
  }, [active]);

  useEffect(() => {
    if (!active) hasAnimated.current = false;
  }, [active]);

  const W = 100; // vw-relative percentages
  const pkY = 12; // vh %

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      {/* SVG for lines */}
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Fork lines from pk */}
        <line className="fork-line" x1="960" y1="160" x2="540" y2="330"
          stroke={EP_COLORS.stateful} strokeWidth="3" strokeDasharray="300" strokeDashoffset="300" />
        <line className="fork-line" x1="960" y1="160" x2="1380" y2="330"
          stroke={EP_COLORS.stateless} strokeWidth="2" strokeDasharray="8 4" strokeDashoffset="300"
          opacity="0.5" />

        {/* Left branch (stateful — short path) */}
        <line className="fork-branch" x1="540" y1="360" x2="540" y2="520"
          stroke={EP_COLORS.stateful} strokeWidth="2.5" strokeDasharray="400" strokeDashoffset="400" />

        {/* Right branch (stateless — long path) */}
        <line className="fork-branch" x1="1380" y1="360" x2="1380" y2="700"
          stroke={EP_COLORS.stateless} strokeWidth="1.5" strokeDasharray="6 4" strokeDashoffset="400"
          opacity="0.4" />

        {/* Unbalanced tree nodes (left path) */}
        {[380, 430, 480].map((y, i) => (
          <circle key={`ln-${i}`} className="fork-node"
            cx="540" cy={y} r="10"
            fill={EP_COLORS.bgAlt} stroke={EP_COLORS.stateful} strokeWidth="2" />
        ))}

        {/* Hypertree nodes (right path, dimmed) */}
        {[400, 460, 520, 580, 640].map((y, i) => (
          <circle key={`rn-${i}`} className="fork-node"
            cx="1380" cy={y} r="8"
            fill={EP_COLORS.bgAlt} stroke={EP_COLORS.stateless} strokeWidth="1.5" opacity="0.35" />
        ))}

        {/* Gold underline for caption */}
        <line className="fork-detail" x1="680" y1="930" x2="1240" y2="930"
          stroke={EP_COLORS.gold} strokeWidth="2" opacity="0" />
      </svg>

      {/* Public key node */}
      <div className="fork-pk" style={{
        position: 'absolute', left: '50%', top: `${pkY}%`,
        transform: 'translate(-50%, -50%) scale(0)',
        padding: '12px 28px', borderRadius: 12,
        border: `2px solid ${EP_COLORS.gold}`,
        background: EP_COLORS.bgAlt,
        fontFamily: 'var(--font-mono)', fontSize: 15, color: EP_COLORS.text,
        whiteSpace: 'nowrap',
      }}>
        pk = H(pk<sub>s</sub>, pk<sub>sl</sub>)
      </div>

      {/* Path labels */}
      <div className="fork-label-stateful" style={{
        position: 'absolute', left: '28%', top: '26%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
        color: EP_COLORS.stateful, opacity: 0,
      }}>
        STATEFUL
      </div>
      <div className="fork-label-stateless" style={{
        position: 'absolute', left: '72%', top: '26%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
        color: EP_COLORS.stateless, opacity: 0.6,
      }}>
        STATELESS
      </div>

      {/* Stateful signature block — tiny, gold */}
      <div className="fork-sig-stateful" style={{
        position: 'absolute', left: '28%', top: '52%', transform: 'translate(-50%, -50%) scale(0)',
        padding: '14px 24px', borderRadius: 10,
        background: `${EP_COLORS.stateful}18`,
        border: `2px solid ${EP_COLORS.gold}`,
        boxShadow: `0 0 28px ${EP_COLORS.gold}40`,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
          color: EP_COLORS.gold, textAlign: 'center',
        }}>
          324 B
        </div>
      </div>

      {/* Stateless signature block — large, dim */}
      <div className="fork-sig-stateless" style={{
        position: 'absolute', left: '72%', top: '68%', transform: 'translate(-50%, -50%) scale(0)',
        padding: '20px 24px', borderRadius: 10,
        background: `${EP_COLORS.stateless}10`,
        border: `1.5px dashed ${EP_COLORS.stateless}60`,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 20,
          color: `${EP_COLORS.stateless}90`, textAlign: 'center',
        }}>
          7,856 B
        </div>
      </div>

      {/* Detail labels */}
      <div className="fork-detail" style={{
        position: 'absolute', left: '28%', top: '60%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 13, color: EP_COLORS.textDim,
        textAlign: 'center', lineHeight: 1.7, opacity: 0,
      }}>
        292 B WOTS sig<br />
        16 B auth path (1 node)<br />
        16 B tree index
      </div>

      <div className="fork-detail" style={{
        position: 'absolute', left: '72%', top: '78%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-body)', fontSize: 14,
        color: `${EP_COLORS.stateless}80`, textAlign: 'center', opacity: 0,
      }}>
        Fallback: state lost or extra sigs needed
      </div>

      <div className="fork-detail" style={{
        position: 'absolute', left: '28%', top: '71%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 14, color: EP_COLORS.accent, opacity: 0,
      }}>
        Each additional sig: +16 B
      </div>

      {/* Caption */}
      <div className="fork-caption" style={{
        position: 'absolute', left: '50%', bottom: '8%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-body)', fontSize: 22, color: EP_COLORS.text,
        textAlign: 'center', opacity: 0,
      }}>
        Graceful degradation, not catastrophic failure
      </div>
    </div>
  );
}
