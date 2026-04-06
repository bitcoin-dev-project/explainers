/**
 * DataStream — GSAP-animated hex characters flowing in/out of the sponge.
 *
 * Renders a vertical column of hex characters that cascade downward
 * (absorb) or upward (squeeze). Each character briefly glows as it
 * passes the boundary. Uses GSAP stagger for rapid-fire data feel.
 */

import { useRef, useMemo } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

type StreamDirection = 'down' | 'up' | 'none';

interface DataStreamProps {
  /** Current scene for GSAP orchestration */
  scene: number;
  /** Direction of data flow */
  direction: StreamDirection;
  /** Number of hex characters to display */
  charCount?: number;
  /** Vertical start position offset */
  startY?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Real SHA-3 output fragments for visual authenticity
const HEX_CHARS = 'a7f3b2e9c1d806543af98e2b1c7d05f6'.split('');

export default function DataStream({
  scene,
  direction,
  charCount = 16,
  startY = 0,
  className,
  style,
}: DataStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const chars = useMemo(() => {
    return Array.from({ length: charCount }, (_, i) => ({
      char: HEX_CHARS[i % HEX_CHARS.length],
      id: i,
    }));
  }, [charCount]);

  useSceneGSAP(containerRef, scene, {
    // Absorb — characters cascade downward
    6: (tl) => {
      if (direction !== 'down') return;
      tl.from('.hex-char', {
        opacity: 0,
        y: -30,
        scale: 0.5,
        stagger: 0.06,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
        .to('.hex-char', {
          y: 20,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.in',
        }, '+=0.5');
    },
    // Squeeze — characters rise upward
    8: (tl) => {
      if (direction !== 'up') return;
      tl.from('.hex-char', {
        opacity: 0,
        y: 30,
        scale: 0.5,
        stagger: { each: 0.06, from: 'end' },
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
        .to('.hex-char', {
          y: -20,
          opacity: 0.3,
          stagger: { each: 0.08, from: 'end' },
          duration: 0.5,
          ease: 'power2.in',
        }, '+=0.5');
    },
  });

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        paddingTop: startY,
        ...style,
      }}
    >
      {chars.map(({ char, id }) => (
        <span
          key={id}
          className="hex-char"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            color: direction === 'up' ? EP_COLORS.rateGlow : EP_COLORS.rate,
            textShadow: `0 0 6px ${direction === 'up' ? EP_COLORS.rateGlow : EP_COLORS.rate}60`,
            lineHeight: 1.3,
            opacity: 0,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
