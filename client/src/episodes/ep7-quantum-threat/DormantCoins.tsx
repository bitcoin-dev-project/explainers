import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

const COINS = Array.from({ length: 9 }, (_, i) => ({
  x: 10 + (i % 5) * 18 + Math.random() * 5,
  rot: (Math.random() - 0.5) * 25,
  size: 2.5 + Math.random() * 1.5,
  delay: i * 0.1,
}));

export default function DormantCoins({ scene, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    // Scene 26: Coins settle on ocean floor
    26: (tl) => {
      tl.from('.dc-ocean', { opacity: 0, duration: 0.5 });

      COINS.forEach((_, i) => {
        tl.from(`.dc-coin-${i}`, {
          y: -120, opacity: 0, rotation: Math.random() * 30 - 15,
          duration: 0.7, ease: 'bounce.out',
        }, `+=${i === 0 ? 0.3 : 0.08}`);
      });

      tl.from('.dc-label', { opacity: 0, y: -10, duration: 0.3 }, '+=0.3')
        .from('.dc-sublabel', { opacity: 0, y: -10, duration: 0.3, stagger: 0.2 })
        .from('.dc-ghost', { opacity: 0, duration: 0.8 }, '-=0.5')
        .to('.dc-ghost', { opacity: 0, duration: 0.8 }, '+=0.5');
    },
    // Scene 27: Three branching paths
    27: (tl) => {
      tl.from('.dc-path-0', { opacity: 0, scaleY: 0, duration: 0.5, ease: 'power2.out' })
        .from('.dc-path-label-0', { opacity: 0, duration: 0.3 })
        .from('.dc-path-1', { opacity: 0, scaleY: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .from('.dc-path-label-1', { opacity: 0, duration: 0.3 })
        // Burn: coins fade to ash
        .to('.dc-burn-coins', { opacity: 0.1, scale: 0.8, filter: 'grayscale(100%)', duration: 0.5 }, '<')
        .from('.dc-path-2', { opacity: 0, scaleY: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .from('.dc-path-label-2', { opacity: 0, duration: 0.3 })
        // Salvage: coins lift
        .to('.dc-salvage-coins', { y: -30, duration: 0.8, ease: 'power2.inOut' }, '<')
        .from('.dc-summary', { opacity: 0, y: 10, duration: 0.3 }, '+=0.2');
    },
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: '80vw', height: '55vh', ...style }}>
      {/* Ocean background */}
      <div className="dc-ocean" style={{
        position: 'absolute', inset: 0, borderRadius: '12px', overflow: 'hidden',
        background: `linear-gradient(180deg, ${EP_COLORS.bgAlt} 0%, #050810 60%, #020408 100%)`,
      }}>
        {/* Caustic light effect */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          background: `radial-gradient(ellipse at 30% 20%, ${EP_COLORS.quantum} 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 40%, ${EP_COLORS.quantum} 0%, transparent 40%)`,
          animation: 'ep7-caustic 8s ease-in-out infinite alternate',
        }} />

        {/* Floating dust particles */}
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 90 + 5}%`,
            bottom: `${Math.random() * 60 + 5}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            borderRadius: '50%',
            background: EP_COLORS.goldDim,
            opacity: Math.random() * 0.3 + 0.1,
            animation: `ep7-dust ${8 + Math.random() * 6}s linear ${Math.random() * -10}s infinite`,
          }} />
        ))}
      </div>

      {/* Coins on the floor */}
      <div style={{
        position: 'absolute', bottom: '10%', left: '5%', right: '5%',
        display: 'flex', justifyContent: 'center', gap: '1vw', flexWrap: 'wrap',
      }}>
        {COINS.map((coin, i) => (
          <div key={i} className={`dc-coin-${i}`} style={{
            width: `${coin.size}vw`, height: `${coin.size}vw`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${EP_COLORS.goldBright}, ${EP_COLORS.gold}, ${EP_COLORS.goldDim})`,
            border: `2px solid ${EP_COLORS.goldBright}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
            fontSize: `${coin.size * 0.4}vw`, color: EP_COLORS.goldDim,
            transform: `rotate(${coin.rot}deg)`,
            boxShadow: `0 0 10px ${EP_COLORS.goldDim}`,
            animation: `ep7-float ${3 + Math.random() * 2}s ease-in-out ${Math.random() * -3}s infinite alternate`,
          }}>₿</div>
        ))}
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="dc-label" style={{
          fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
          fontSize: '2.2vw', color: EP_COLORS.goldBright,
        }}>1.7M BTC</div>
        <div className="dc-sublabel" style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '1.1vw',
          color: EP_COLORS.textDim, marginTop: '0.5vh',
        }}>Keys lost. Owners gone.</div>
        <div className="dc-sublabel" style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '1.1vw',
          color: EP_COLORS.textDim,
        }}>These coins can&apos;t move to safety.</div>
      </div>

      {/* Ghost key */}
      <div className="dc-ghost" style={{
        position: 'absolute', right: '15%', top: '30%',
        fontSize: '4vw', opacity: 0,
        filter: `drop-shadow(0 0 10px ${EP_COLORS.textDim})`,
      }}>🔑</div>

      {/* Three branching paths (scene 27) */}
      <div style={{
        position: 'absolute', top: '5%', left: '3%', right: '3%',
        display: 'flex', justifyContent: 'space-between', gap: '2vw',
      }}>
        {/* Path 1: Do Nothing */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="dc-path-0" style={{
            height: '8vh', borderLeft: `2px dashed ${EP_COLORS.textDim}`,
            margin: '0 auto', width: 0, transformOrigin: 'bottom',
          }} />
          <div className="dc-path-label-0" style={{ marginTop: '0.5vh' }}>
            <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '1.2vw', color: EP_COLORS.textDim }}>Do Nothing</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9vw', color: EP_COLORS.danger }}>Quantum bounty</div>
          </div>
        </div>

        {/* Path 2: Burn */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="dc-path-1" style={{
            height: '8vh', borderLeft: `2px dashed ${EP_COLORS.textDim}`,
            margin: '0 auto', width: 0, transformOrigin: 'bottom',
          }} />
          <div className="dc-path-label-1" style={{ marginTop: '0.5vh' }}>
            <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '1.2vw', color: EP_COLORS.textDim }}>Burn</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9vw', color: EP_COLORS.warning }}>Property rights?</div>
          </div>
          <div className="dc-burn-coins" style={{ fontSize: '1.5vw', marginTop: '0.3vh' }}>₿₿</div>
        </div>

        {/* Path 3: Digital Salvage */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="dc-path-2" style={{
            height: '8vh', borderLeft: `2px dashed ${EP_COLORS.safe}`,
            margin: '0 auto', width: 0, transformOrigin: 'bottom',
          }} />
          <div className="dc-path-label-2" style={{ marginTop: '0.5vh' }}>
            <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '1.2vw', color: EP_COLORS.safeBright }}>Digital Salvage</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9vw', color: EP_COLORS.textDim }}>Legal framework needed</div>
          </div>
          <div className="dc-salvage-coins" style={{ fontSize: '1.5vw', marginTop: '0.3vh' }}>₿↑</div>
        </div>
      </div>

      {/* Summary */}
      <div className="dc-summary" style={{
        position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%)',
        fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
        fontSize: '1.4vw', color: EP_COLORS.warning, textAlign: 'center',
      }}>None of them clean.</div>

      <style>{`
        @keyframes ep7-caustic {
          0% { transform: translate(0, 0); }
          100% { transform: translate(10px, -5px); }
        }
        @keyframes ep7-dust {
          0% { transform: translateY(0) translateX(0); opacity: 0.15; }
          50% { opacity: 0.35; }
          100% { transform: translateY(-80px) translateX(15px); opacity: 0; }
        }
        @keyframes ep7-float {
          0% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          100% { transform: translateY(-3px) rotate(calc(var(--rot, 0deg) + 2deg)); }
        }
      `}</style>
    </div>
  );
}
