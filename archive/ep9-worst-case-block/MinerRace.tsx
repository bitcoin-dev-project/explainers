/**
 * MinerRace — GSAP-driven asymmetric race visualization.
 *
 * Two horizontal lanes: honest miner (blue) vs attacker (red).
 * The center divider squeezes the honest miner's lane as the
 * attacker races ahead. Time labels diverge dramatically.
 *
 * First useSceneGSAP usage in the series.
 */

import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video/gsap-utils';
import { sceneRange } from '@/lib/video/canvas';
import { EP_COLORS } from './constants';

interface MinerRaceProps {
  scene: number;
  /** Whether BIP 54 has equalized the race */
  equalized?: boolean;
}

export default function MinerRace({ scene, equalized = false }: MinerRaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP choreography
  useSceneGSAP(containerRef, scene, {
    // Scene 7: Lanes slide in, progress starts
    7: (tl) => {
      tl.from('.miner-lane-honest', {
        x: -100, opacity: 0, duration: 0.6, ease: 'power3.out',
      })
      .from('.miner-lane-attacker', {
        x: 100, opacity: 0, duration: 0.6, ease: 'power3.out',
      }, '-=0.4')
      .from('.race-label', {
        opacity: 0, y: 20, stagger: 0.1, duration: 0.4, ease: 'power2.out',
      }, '-=0.3')
      // Honest miner starts crawling
      .to('.honest-progress', {
        width: '15%', duration: 2, ease: 'power1.in',
      }, '+=0.2')
      // Attacker races
      .to('.attacker-progress', {
        width: '60%', duration: 2, ease: 'power2.out',
      }, '-=2')
      // Time labels start diverging
      .to('.honest-time', {
        innerText: '2s',
        duration: 0.01,
        snap: { innerText: 1 },
      }, '-=0.5')
      .to('.attacker-time', {
        innerText: '0.1s',
        duration: 0.01,
      }, '-=0.5');
    },

    // Scene 8: The squeeze — attacker dominates
    8: (tl) => {
      // Center divider moves left, squeezing honest miner
      tl.to('.race-divider', {
        left: '25%', duration: 1.5, ease: 'power2.inOut',
      })
      // Honest miner progress barely moves
      .to('.honest-progress', {
        width: '20%', duration: 1.5, ease: 'none',
      }, '-=1.5')
      // Attacker races to near completion
      .to('.attacker-progress', {
        width: '95%', duration: 1.5, ease: 'power1.out',
      }, '-=1.5')
      // Time labels diverge wildly
      .to('.honest-time', {
        duration: 0.01,
      }, '+=0.3')
      .to('.attacker-time', {
        duration: 0.01,
      }, '-=0.01')
      // Attacker lane pulses with victory glow
      .to('.miner-lane-attacker', {
        boxShadow: `inset 0 0 30px ${EP_COLORS.dangerGlow}`,
        duration: 0.5,
        repeat: 2,
        yoyo: true,
      });
    },

    // Scene 12: Equalized race (after BIP 54)
    12: (tl) => {
      // Divider returns to center
      tl.to('.race-divider', {
        left: '50%', duration: 1, ease: 'power2.out',
      })
      // Both progress bars equalize
      .to('.honest-progress', {
        width: '70%', duration: 1.2, ease: 'power2.out',
      }, '-=0.8')
      .to('.attacker-progress', {
        width: '72%', duration: 1.2, ease: 'power2.out',
      }, '-=1.2')
      // Green glow on honest lane
      .to('.miner-lane-honest', {
        boxShadow: `inset 0 0 20px ${EP_COLORS.safeGlow}`,
        duration: 0.6,
      }, '-=0.3')
      // Remove danger glow from attacker
      .to('.miner-lane-attacker', {
        boxShadow: 'inset 0 0 0px transparent',
        duration: 0.6,
      }, '-=0.6');
    },
  });

  const visible = sceneRange(scene, 7, 14);
  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '215vw',
        top: '10vh',
        width: '65vw',
        height: '50vh',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Title */}
      <div
        className="race-label"
        style={{
          textAlign: 'center',
          marginBottom: '2vh',
          color: EP_COLORS.text,
          fontSize: '1.6vw',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        The Mining Race
      </div>

      {/* Race track */}
      <div style={{ position: 'relative', width: '100%', height: '35vh' }}>
        {/* Honest miner lane */}
        <div
          className="miner-lane-honest"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '45%',
            background: EP_COLORS.surface,
            borderRadius: '8px',
            border: `1px solid rgba(37, 99, 235, 0.3)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 1.5vw',
          }}
        >
          {/* Label */}
          <div className="race-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1vh' }}>
            <span style={{ color: EP_COLORS.cool, fontSize: '1.1vw', fontWeight: 600 }}>
              Honest Miner
            </span>
            <span style={{ color: EP_COLORS.textMuted, fontSize: '0.9vw' }}>
              Validating poison block...
            </span>
          </div>

          {/* Progress track */}
          <div style={{
            width: '100%',
            height: '2.5vh',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div
              className="honest-progress"
              style={{
                width: '0%',
                height: '100%',
                background: `linear-gradient(90deg, ${EP_COLORS.cool}, ${EP_COLORS.warm})`,
                borderRadius: '4px',
                transition: 'none', // GSAP handles animation
              }}
            />
          </div>

          {/* Time label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5vh' }}>
            <span className="honest-time race-label" style={{ color: EP_COLORS.text, fontSize: '1.8vw', fontWeight: 700 }}>
              {equalized ? '0.1s' : scene >= 8 ? '10 hours' : '0s'}
            </span>
            <span className="race-label" style={{ color: EP_COLORS.critical, fontSize: '0.8vw', opacity: scene >= 8 && !equalized ? 1 : 0 }}>
              STUCK
            </span>
          </div>
        </div>

        {/* Center divider */}
        <div
          className="race-divider"
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            width: '100%',
            height: '8%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateX(-50%)',
          }}
        >
          <span style={{
            color: EP_COLORS.textMuted,
            fontSize: '0.8vw',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            vs
          </span>
        </div>

        {/* Attacker lane */}
        <div
          className="miner-lane-attacker"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: '45%',
            background: EP_COLORS.surface,
            borderRadius: '8px',
            border: `1px solid rgba(239, 68, 68, 0.3)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 1.5vw',
          }}
        >
          {/* Label */}
          <div className="race-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1vh' }}>
            <span style={{ color: EP_COLORS.critical, fontSize: '1.1vw', fontWeight: 600 }}>
              Attacker
            </span>
            <span style={{ color: EP_COLORS.textMuted, fontSize: '0.9vw' }}>
              Mining next block...
            </span>
          </div>

          {/* Progress track */}
          <div style={{
            width: '100%',
            height: '2.5vh',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div
              className="attacker-progress"
              style={{
                width: '0%',
                height: '100%',
                background: `linear-gradient(90deg, ${EP_COLORS.critical}, ${EP_COLORS.hot})`,
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Time label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5vh' }}>
            <span className="attacker-time race-label" style={{ color: EP_COLORS.text, fontSize: '1.8vw', fontWeight: 700 }}>
              {equalized ? '0.1s' : '0s'}
            </span>
            <span className="race-label" style={{ color: EP_COLORS.fix, fontSize: '0.8vw', opacity: scene >= 8 && !equalized ? 1 : 0 }}>
              HEAD START
            </span>
          </div>
        </div>
      </div>

      {/* Ratio callout */}
      {scene >= 8 && !equalized && (
        <div
          className="race-label"
          style={{
            textAlign: 'center',
            marginTop: '2vh',
            color: EP_COLORS.meltdown,
            fontSize: '2vw',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}
        >
          360,000 : 1
        </div>
      )}
    </div>
  );
}
