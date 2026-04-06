/**
 * ValidationTimer — ticking elapsed-time display for meltdown scenes.
 * Counts up to targetSeconds with accelerated pacing. Flashes red at thresholds.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface Props {
  targetSeconds: number;
  color?: string;
  style?: React.CSSProperties;
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ValidationTimer({
  targetSeconds,
  color = EP_COLORS.text,
  style,
}: Props) {
  const displayRef = useRef<HTMLDivElement>(null);
  const tweenObj = useRef({ val: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (tweenRef.current) tweenRef.current.kill();
    tweenObj.current.val = 0;

    const dur = Math.min(5, targetSeconds * 0.6);

    tweenRef.current = gsap.to(tweenObj.current, {
      val: targetSeconds,
      duration: dur,
      ease: 'power1.in', // accelerating — dramatic
      onUpdate() {
        if (displayRef.current) {
          const v = tweenObj.current.val;
          displayRef.current.textContent = fmt(v);

          // Threshold flashes
          if (v > 150 && v < 152) {
            displayRef.current.style.transform = 'scale(1.08)';
          } else if (v > 55 && v < 62) {
            displayRef.current.style.transform = 'scale(1.05)';
          } else {
            displayRef.current.style.transform = 'scale(1)';
          }
        }
      },
    });
  }, [targetSeconds]);

  return (
    <div
      ref={displayRef}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '2.2vw',
        fontWeight: 700,
        color,
        transition: 'color 0.4s, transform 0.15s',
        textShadow:
          color === EP_COLORS.stall
            ? `0 0 16px ${EP_COLORS.stall}60`
            : 'none',
        ...style,
      }}
    >
      0:00
    </div>
  );
}
