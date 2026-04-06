import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

export default function ShieldStack({ scene, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    // Scene 23: Immediate defenses checklist
    23: (tl) => {
      tl.from('.ss-layer1', { scaleY: 0, duration: 0.4, ease: 'power3.out' })
        .from('.ss-check-0', { opacity: 0, x: -20, duration: 0.3 }, '+=0.3')
        .to('.ss-box-0', { borderColor: EP_COLORS.safe, backgroundColor: `${EP_COLORS.safe}20`, duration: 0.2 }, '+=0.2')
        .from('.ss-check-1', { opacity: 0, x: -20, duration: 0.3 }, '+=0.2')
        .to('.ss-box-1', { borderColor: EP_COLORS.safe, backgroundColor: `${EP_COLORS.safe}20`, duration: 0.2 }, '+=0.2')
        .from('.ss-check-2', { opacity: 0, x: -20, duration: 0.3 }, '+=0.2')
        .to('.ss-box-2', { borderColor: EP_COLORS.safe, backgroundColor: `${EP_COLORS.safe}20`, duration: 0.2 }, '+=0.2')
        // All-checked glow
        .to('.ss-layer1', { boxShadow: `0 0 20px ${EP_COLORS.safe}40`, duration: 0.3 });
    },
    // Scene 24: BIP-360 P2MR Merkle tree
    24: (tl) => {
      tl.from('.ss-layer2', { scaleY: 0, duration: 0.4, ease: 'power3.out' })
        // Leaves appear bottom-up
        .from('.ss-leaf', { opacity: 0, y: 20, stagger: 0.15, duration: 0.3 })
        // Connections draw
        .from('.ss-branch', { scaleY: 0, opacity: 0, stagger: 0.1, duration: 0.3 }, '-=0.2')
        // Root appears
        .from('.ss-root', { scale: 0, opacity: 0, duration: 0.35, ease: 'back.out(2)' })
        .from('.ss-p2mr-label', { opacity: 0, x: 20, duration: 0.3 });
    },
    // Scene 25: PQC timeline bar
    25: (tl) => {
      tl.from('.ss-layer3', { scaleY: 0, duration: 0.4, ease: 'power3.out' })
        .from('.ss-bar-bg', { scaleX: 0, duration: 0.3 });

      // Fill segments sequentially
      const segments = ['.ss-seg-0', '.ss-seg-1', '.ss-seg-2', '.ss-seg-3', '.ss-seg-4'];
      segments.forEach((sel) => {
        tl.to(sel, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
      });

      tl.from('.ss-start-now', {
        opacity: 0, scale: 0.8, duration: 0.3, ease: 'back.out(2)',
      }, '+=0.2');
    },
  });

  const panelBase: React.CSSProperties = {
    border: `2px solid ${EP_COLORS.safe}`,
    borderRadius: '10px',
    padding: '1.5vh 2vw',
    marginBottom: '1.5vh',
    transformOrigin: 'top',
  };

  const checkItems = [
    'Never reuse addresses',
    'Avoid P2TR for large holdings',
    'Use P2WPKH (bc1q addresses)',
  ];

  const timelineSteps = ['Standardize', 'Implement', 'Test', 'Deploy', 'Migrate'];

  return (
    <div ref={ref} style={{ width: '90vw', ...style }}>
      {/* Layer 1: Immediate steps */}
      <div className="ss-layer1" style={{ ...panelBase, backgroundColor: 'transparent' }}>
        <div style={{
          fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
          fontSize: '1.6vw', color: EP_COLORS.safe, marginBottom: '1vh',
        }}>Immediate Steps</div>

        {checkItems.map((item, i) => (
          <div key={i} className={`ss-check-${i}`} style={{
            display: 'flex', alignItems: 'center', gap: '1vw',
            marginBottom: '0.8vh', opacity: 0,
          }}>
            <div className={`ss-box-${i}`} style={{
              width: '2vw', height: '2vw', borderRadius: '4px',
              border: `2px solid ${EP_COLORS.muted}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2vw', color: EP_COLORS.safe, fontWeight: 700,
              transition: 'all 0.2s',
            }}>✓</div>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.3vw', color: EP_COLORS.text,
            }}>
              {item}
              {i === 1 && <span style={{ color: EP_COLORS.danger, marginLeft: '0.3vw' }}>P2TR</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Layer 2: BIP-360 P2MR */}
      <div className="ss-layer2" style={{
        ...panelBase,
        backgroundColor: `${EP_COLORS.safe}08`,
        transformOrigin: 'top',
      }}>
        <div style={{
          fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
          fontSize: '1.6vw', color: EP_COLORS.safeBright, marginBottom: '1vh',
        }}>Medium-Term: BIP-360</div>

        {/* Merkle tree diagram */}
        <svg viewBox="0 0 300 140" style={{ width: '40vw', height: '16vh' }}>
          {/* Leaves (bottom) */}
          {['PQC Sig 1', 'PQC Sig 2', 'Script A', 'Script B'].map((label, i) => (
            <g key={i} className="ss-leaf" transform={`translate(${40 + i * 65}, 110)`}>
              <rect width="55" height="24" rx="4" fill={EP_COLORS.bgSurface}
                stroke={EP_COLORS.safeBright} strokeWidth="1" />
              <text x="27" y="15" fill={EP_COLORS.safeBright} fontSize="7"
                textAnchor="middle" fontFamily="JetBrains Mono, monospace">{label}</text>
            </g>
          ))}

          {/* Branches (mid) */}
          {[0, 1].map(i => (
            <g key={i}>
              <line className="ss-branch" x1={67 + i * 130} y1="110" x2={100 + i * 130} y2="75"
                stroke={EP_COLORS.safe} strokeWidth="1.5" style={{ transformOrigin: 'bottom' }} />
              <line className="ss-branch" x1={132 + i * 130} y1="110" x2={100 + i * 130} y2="75"
                stroke={EP_COLORS.safe} strokeWidth="1.5" style={{ transformOrigin: 'bottom' }} />
              <rect className="ss-branch" x={80 + i * 130} y="60" width="40" height="20" rx="4"
                fill={EP_COLORS.bgSurface} stroke={EP_COLORS.safe} strokeWidth="1" />
              <text className="ss-branch" x={100 + i * 130} y="73" fill={EP_COLORS.safe}
                fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono, monospace">H()</text>
            </g>
          ))}

          {/* Root */}
          <line className="ss-branch" x1="100" y1="60" x2="150" y2="30"
            stroke={EP_COLORS.safeBright} strokeWidth="1.5" style={{ transformOrigin: 'bottom' }} />
          <line className="ss-branch" x1="230" y1="60" x2="150" y2="30"
            stroke={EP_COLORS.safeBright} strokeWidth="1.5" style={{ transformOrigin: 'bottom' }} />
          <rect className="ss-root" x="115" y="8" width="70" height="26" rx="6"
            fill={EP_COLORS.bgAlt} stroke={EP_COLORS.safeBright} strokeWidth="2" />
          <text className="ss-root" x="150" y="25" fill={EP_COLORS.safeBright}
            fontSize="9" fontWeight="bold" textAnchor="middle"
            fontFamily="Montserrat, sans-serif">P2MR Root</text>
        </svg>

        <div className="ss-p2mr-label" style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '1.1vw',
          color: EP_COLORS.safeBright, marginTop: '0.5vh',
        }}>
          Taproot benefits, no quantum risk — key path removed
        </div>
      </div>

      {/* Layer 3: PQC Migration Timeline */}
      <div className="ss-layer3" style={{
        ...panelBase,
        background: `linear-gradient(135deg, ${EP_COLORS.safeDim}30, ${EP_COLORS.quantumDim}20)`,
        transformOrigin: 'top',
      }}>
        <div style={{
          fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
          fontSize: '1.6vw', color: EP_COLORS.safe, marginBottom: '1vh',
        }}>Long-Term: Full PQC Migration</div>

        {/* Timeline bar */}
        <div style={{ position: 'relative' }}>
          {/* Labels */}
          <div style={{ display: 'flex', marginBottom: '0.5vh' }}>
            {timelineSteps.map((step, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '1vw', color: EP_COLORS.textDim,
              }}>{step}</div>
            ))}
          </div>

          {/* Bar background */}
          <div className="ss-bar-bg" style={{
            width: '100%', height: '2.5vh',
            background: EP_COLORS.bgSurface,
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            transformOrigin: 'left',
          }}>
            {/* Fill segments */}
            {timelineSteps.map((_, i) => (
              <div key={i} className={`ss-seg-${i}`} style={{
                position: 'absolute',
                left: `${(i / 5) * 100}%`,
                top: 0, bottom: 0,
                width: `${100 / 5}%`,
                background: `linear-gradient(90deg, ${EP_COLORS.safeDim}, ${EP_COLORS.safe})`,
                transformOrigin: 'left',
                transform: 'scaleX(0)',
              }} />
            ))}
          </div>

          {/* START NOW label */}
          <div className="ss-start-now" style={{
            position: 'absolute', left: 0, top: '-0.5vh',
            fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
            fontSize: '1.2vw', color: EP_COLORS.warning,
            transform: 'translateY(-100%)',
          }}>START NOW ↓</div>
        </div>
      </div>
    </div>
  );
}
