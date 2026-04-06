/**
 * OverwriteParticles — Ambient Destruction Effect for EP7
 *
 * Pure CSS particle system for the BTC destruction moment.
 * Golden dots scatter and fade when the overwrite stamps down.
 *
 * Self-animating via CSS @keyframes — no JS animation loop needed.
 * Mount when the overwrite happens, auto-animates, unmount after.
 */

import { useMemo } from 'react';
import { EP_COLORS } from './constants';

interface OverwriteParticlesProps {
  /** Whether the particle effect is active */
  active: boolean;
  /** Number of particles to generate */
  count?: number;
  /** Center position — where the BTC value was before destruction */
  originX?: string;
  originY?: string;
}

interface Particle {
  id: number;
  size: number;
  angle: number;
  distance: number;
  duration: number;
  delay: number;
  color: string;
  drift: number;
}

// ─── Seeded random for deterministic particles ───────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function OverwriteParticles({
  active,
  count = 40,
  originX = '50%',
  originY = '50%',
}: OverwriteParticlesProps) {
  // Generate particles deterministically
  const particles: Particle[] = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 2 + rand() * 6,         // 2-8px
      angle: rand() * 360,            // scatter direction
      distance: 80 + rand() * 300,    // how far they fly (px)
      duration: 0.8 + rand() * 1.5,   // 0.8-2.3s animation
      delay: rand() * 0.4,            // staggered start
      drift: -20 + rand() * 40,       // horizontal wobble
      // Mix of gold, amber, and white particles
      color: i % 5 === 0
        ? EP_COLORS.text                          // white spark
        : i % 3 === 0
          ? EP_COLORS.highlight                    // bright yellow
          : EP_COLORS.accent,                      // gold
    }));
  }, [count]);

  const keyframes = `
    @keyframes particle-scatter {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      20% {
        opacity: 1;
      }
      100% {
        transform: translate(var(--dx), var(--dy)) scale(0);
        opacity: 0;
      }
    }
    @keyframes particle-glow {
      0% { box-shadow: 0 0 4px var(--glow-color); }
      50% { box-shadow: 0 0 12px var(--glow-color); }
      100% { box-shadow: 0 0 0px var(--glow-color); }
    }
  `;

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: originX,
        top: originY,
        width: 0,
        height: 0,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <style>{keyframes}</style>
      {particles.map((p) => {
        const radian = (p.angle * Math.PI) / 180;
        const dx = Math.cos(radian) * p.distance + p.drift;
        const dy = Math.sin(radian) * p.distance - Math.abs(p.distance * 0.3); // bias upward

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              '--glow-color': p.color + '80',
              animation: `particle-scatter ${p.duration}s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, particle-glow ${p.duration}s ${p.delay}s ease-out forwards`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
