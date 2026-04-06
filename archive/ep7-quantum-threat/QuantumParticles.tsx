import { useMemo } from 'react';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

const DRIFT_KEYFRAMES = `
@keyframes ep7-qp-drift-1 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(18px, -22px); }
  66% { transform: translate(-14px, 12px); }
}
@keyframes ep7-qp-drift-2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-20px, 15px); }
  66% { transform: translate(16px, -10px); }
}
@keyframes ep7-qp-drift-3 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(12px, 18px); }
  66% { transform: translate(-18px, -16px); }
}
`;

const ANIMS = ['ep7-qp-drift-1', 'ep7-qp-drift-2', 'ep7-qp-drift-3'];

export default function QuantumParticles({ scene, style }: Props) {
  // Act-based color
  const color = scene < 10 ? EP_COLORS.gold
    : scene < 22 ? EP_COLORS.quantum
    : EP_COLORS.safe;

  const density = scene < 10 ? 25 : scene < 22 ? 40 : 18;

  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      dur: 15 + Math.random() * 20,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.25 + 0.05,
      anim: ANIMS[i % 3],
    })),
  []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden', pointerEvents: 'none',
      ...style,
    }}>
      {particles.slice(0, density).map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: p.opacity,
          animation: `${p.anim} ${p.dur}s ease-in-out ${p.delay}s infinite`,
          transition: 'background-color 2s ease',
        }} />
      ))}
      <style>{DRIFT_KEYFRAMES}</style>
    </div>
  );
}
