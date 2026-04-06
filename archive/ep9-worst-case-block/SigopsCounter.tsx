/**
 * SigopsCounter — Running signature operation count.
 *
 * Large monospace number that ticks up. In linear mode, steady ticks.
 * In quadratic mode, the ticking ACCELERATES — digits blur as the
 * count races past comprehension.
 *
 * Uses requestAnimationFrame for smooth number animation.
 */

import { useRef, useEffect, useState } from 'react';
import { EP_COLORS } from './constants';

type CounterMode = 'idle' | 'linear' | 'quadratic' | 'capped';

interface SigopsCounterProps {
  mode: CounterMode;
  scene: number;
  className?: string;
  style?: React.CSSProperties;
}

// Target values by mode
const TARGETS = {
  idle: 0,
  linear: 3600,          // ~3,600 sigops in a normal block
  quadratic: 3_600_000,  // millions for the attack
  capped: 2500,          // BIP 54 cap
};

export default function SigopsCounter({ mode, scene, className, style }: SigopsCounterProps) {
  const [count, setCount] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    setCount(0);
    startRef.current = performance.now();

    if (mode === 'idle') return;

    const target = TARGETS[mode];
    const duration = mode === 'quadratic' ? 5500 : mode === 'capped' ? 2500 : 3000;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      let value: number;
      if (mode === 'quadratic') {
        // Cubic easing — slow start, explosive finish
        value = Math.floor(target * Math.pow(progress, 3));
      } else {
        // Linear
        value = Math.floor(target * progress);
      }

      setCount(value);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [mode, scene]);

  const isOverheating = mode === 'quadratic' && count > 100_000;
  const isMeltdown = mode === 'quadratic' && count > 1_000_000;

  const formattedCount = count.toLocaleString();

  // Color based on heat level
  let textColor: string = EP_COLORS.warm;
  if (isMeltdown) textColor = EP_COLORS.meltdown;
  else if (isOverheating) textColor = EP_COLORS.critical;
  else if (mode === 'capped') textColor = EP_COLORS.fix;

  return (
    <div
      className={className}
      style={{
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
        ...style,
      }}
    >
      {/* Count */}
      <div
        style={{
          fontSize: isMeltdown ? '3.5vw' : '2.8vw',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1,
          transition: 'color 0.3s, font-size 0.3s',
          textShadow: isOverheating
            ? `0 0 20px ${EP_COLORS.critical}, 0 0 40px ${EP_COLORS.dangerGlow}`
            : 'none',
          // Blur effect when numbers race
          filter: isMeltdown ? 'blur(0.5px)' : 'none',
        }}
      >
        {formattedCount}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '0.9vw',
          color: EP_COLORS.textMuted,
          marginTop: '0.3vh',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        signature operations
      </div>

      {/* O(n²) badge in quadratic mode */}
      {mode === 'quadratic' && (
        <div
          style={{
            display: 'inline-block',
            marginTop: '1vh',
            padding: '0.3vh 0.8vw',
            background: `rgba(239, 68, 68, 0.15)`,
            border: `1px solid ${EP_COLORS.critical}`,
            borderRadius: '4px',
            color: EP_COLORS.critical,
            fontSize: '1vw',
            fontWeight: 600,
            animation: isOverheating ? 'ep9-counterPulse 0.5s ease-in-out infinite' : 'none',
          }}
        >
          O(n²)
        </div>
      )}

      {mode === 'capped' && (
        <div
          style={{
            display: 'inline-block',
            marginTop: '1vh',
            padding: '0.3vh 0.8vw',
            background: `rgba(16, 185, 129, 0.15)`,
            border: `1px solid ${EP_COLORS.fix}`,
            borderRadius: '4px',
            color: EP_COLORS.fix,
            fontSize: '1vw',
            fontWeight: 600,
          }}
        >
          CAPPED
        </div>
      )}

      <style>{`
        @keyframes ep9-counterPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
