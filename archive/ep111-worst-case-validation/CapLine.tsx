/**
 * CapLine — the BIP-54 sigops cap boundary.
 * Three visual states: hint (dashed, low opacity), slam (sweeps in), active (persists).
 * The slam is the most dramatic single moment in the episode.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface Props {
  mode: 'hint' | 'slam' | 'active';
  style?: React.CSSProperties;
}

export default function CapLine({ mode, style }: Props) {
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (mode === 'slam' && lineRef.current) {
      // Kill any previous animation
      gsap.killTweensOf(lineRef.current);
      gsap.killTweensOf(labelRef.current);

      // Line sweeps in from left — 0.12s, dead stop, no bounce
      gsap.fromTo(
        lineRef.current,
        { x: '-110%', opacity: 1 },
        { x: '0%', duration: 0.12, ease: 'power4.out' },
      );

      // Brief white flash on the line
      gsap.fromTo(
        lineRef.current,
        { boxShadow: '0 0 60px rgba(255,255,255,0.8), 0 0 120px rgba(0,255,136,0.5)' },
        {
          boxShadow: '0 0 30px rgba(0,255,136,0.6), 0 0 60px rgba(0,255,136,0.3)',
          duration: 0.3,
          delay: 0.12,
        },
      );

      // Label snaps in
      if (labelRef.current) {
        gsap.fromTo(
          labelRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.15, delay: 0.2 },
        );
      }
    }
  }, [mode]);

  const isHint = mode === 'hint';

  return (
    <div
      ref={lineRef}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: isHint ? '2px' : '3px',
        background: isHint
          ? `repeating-linear-gradient(90deg, ${EP_COLORS.capLine} 0 8px, transparent 8px 16px)`
          : EP_COLORS.capLine,
        opacity: isHint ? 0.3 : 1,
        boxShadow: isHint
          ? 'none'
          : `0 0 30px rgba(0,255,136,0.6), 0 0 60px rgba(0,255,136,0.3)`,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {!isHint && (
        <span
          ref={labelRef}
          style={{
            position: 'absolute',
            left: '1vw',
            top: '-2em',
            fontFamily: 'var(--font-mono)',
            fontSize: '1vw',
            fontWeight: 700,
            color: EP_COLORS.capLine,
            whiteSpace: 'nowrap',
            opacity: mode === 'slam' ? 0 : 1, // GSAP animates this in slam
          }}
        >
          2,500 sigops
        </span>
      )}
    </div>
  );
}
