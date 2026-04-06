/**
 * WorkCounter — animated numerical display showing current n² hash operations.
 * Uses GSAP for smooth number interpolation with locale-formatted output.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface Props {
  value: number;
  color?: string;
  label?: string;
  fontSize?: string;
  style?: React.CSSProperties;
}

export default function WorkCounter({
  value,
  color = EP_COLORS.text,
  label = 'hash operations',
  fontSize = '3vw',
  style,
}: Props) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const tweenObj = useRef({ val: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (tweenRef.current) tweenRef.current.kill();

    const diff = Math.abs(value - tweenObj.current.val);
    const dur = diff > 1_000_000 ? 1.5 : diff > 10_000 ? 1.0 : 0.6;

    tweenRef.current = gsap.to(tweenObj.current, {
      val: value,
      duration: dur,
      ease: 'power2.out',
      onUpdate() {
        if (displayRef.current) {
          displayRef.current.textContent = Math.round(tweenObj.current.val).toLocaleString();
        }
      },
    });
  }, [value]);

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        color,
        textAlign: 'right',
        transition: 'color 0.5s',
        ...style,
      }}
    >
      <span
        ref={displayRef}
        style={{
          fontSize,
          fontWeight: 700,
          textShadow: color === EP_COLORS.stall || color === EP_COLORS.cellCritical
            ? `0 0 20px ${color}40`
            : 'none',
        }}
      >
        {value.toLocaleString()}
      </span>
      {label && (
        <div
          style={{
            fontSize: '0.85vw',
            color: EP_COLORS.textMuted,
            marginTop: '0.2vh',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
