import { useRef } from 'react';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, VULN_DATA } from './constants';

interface Props {
  scene: number;
  style?: React.CSSProperties;
}

export default function VaultGrid({ scene, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneGSAP(ref, scene, {
    // Scene 17: Table slides in row by row
    17: (tl) => {
      tl.from('.vg-header', { opacity: 0, y: -10, duration: 0.3 })
        .from('.vg-col-header', { opacity: 0, y: -10, stagger: 0.1, duration: 0.3 });

      VULN_DATA.forEach((_, i) => {
        tl.from(`.vg-row-${i}`, {
          opacity: 0, x: -30, duration: 0.35, ease: 'power3.out',
        }, `+=0.15`);
      });
    },
    // Scene 18: Taproot twist
    18: (tl) => {
      // P2TR row is index 6
      tl.to('.vg-twist-badge', {
        scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)',
      })
        // Pause — let viewer register the green badge
        .to({}, { duration: 1.5 })
        // CRACK
        .to('.vg-twist-badge', {
          scale: 1.05, duration: 0.1,
        })
        .to('.vg-crack-line', { scaleX: 1, opacity: 1, duration: 0.2 })
        // SHATTER — badge disappears, vulnerable revealed
        .to('.vg-twist-badge', {
          scale: 0.3, opacity: 0, rotation: 15, duration: 0.3,
        })
        .to('.vg-crack-line', { opacity: 0, duration: 0.1 }, '<')
        .to('.vg-vuln-reveal', {
          scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(3)',
        }, '-=0.1')
        .from('.vg-twist-explain', { opacity: 0, y: 10, duration: 0.3 }, '+=0.2');
    },
  });

  const cellStyle = (color?: string): React.CSSProperties => ({
    padding: '0.8vh 1vw',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '1.1vw',
    color: color || EP_COLORS.text,
    borderBottom: `1px solid ${EP_COLORS.border}`,
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: '85vw', ...style }}>
      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: EP_COLORS.bgSurface, borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr className="vg-header" style={{ borderBottom: `2px solid ${EP_COLORS.gold}` }}>
            {['Script Type', 'Key Exposure', 'Prefix', 'Status'].map((h, i) => (
              <th key={h} className={`vg-col-header`} style={{
                ...cellStyle(EP_COLORS.gold),
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                fontSize: '1.2vw',
                textAlign: 'left',
                padding: '1vh 1vw',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VULN_DATA.map((row, i) => {
            const isTwist = 'isTwist' in row && row.isTwist;
            const isProposed = 'proposed' in row && row.proposed;
            return (
              <tr key={i} className={`vg-row-${i}`} style={{
                background: isTwist ? `${EP_COLORS.dangerDark}22` : 'transparent',
              }}>
                <td style={cellStyle(isProposed ? EP_COLORS.safe : EP_COLORS.text)}>
                  {row.type}
                  {isProposed && <span style={{ fontSize: '0.8vw', color: EP_COLORS.safe, marginLeft: '0.5vw' }}>(proposed)</span>}
                </td>
                <td style={cellStyle(EP_COLORS.textDim)}>{row.exposure}</td>
                <td style={cellStyle(EP_COLORS.textDim)}>{row.prefix}</td>
                <td style={{ ...cellStyle(), position: 'relative', minWidth: '12vw' }}>
                  {isTwist ? (
                    /* P2TR twist cell */
                    <div style={{ position: 'relative' }}>
                      {/* Green badge (initial) */}
                      <span className="vg-twist-badge" style={{
                        display: 'inline-block',
                        background: EP_COLORS.safe,
                        color: '#fff',
                        padding: '0.3vh 0.8vw',
                        borderRadius: '999px',
                        fontSize: '1vw',
                        fontWeight: 700,
                        fontFamily: '"Montserrat", sans-serif',
                        transform: 'scale(0)',
                        opacity: 0,
                        position: 'relative',
                      }}>
                        Taproot Upgrade ✓
                        {/* Crack line overlay */}
                        <div className="vg-crack-line" style={{
                          position: 'absolute', top: '50%', left: '5%',
                          width: '90%', height: '2px',
                          background: EP_COLORS.danger,
                          transform: 'scaleX(0) translateY(-50%)',
                          transformOrigin: 'left',
                          opacity: 0,
                        }} />
                      </span>
                      {/* Red VULNERABLE (revealed after shatter) */}
                      <span className="vg-vuln-reveal" style={{
                        position: 'absolute', left: 0, top: '50%',
                        transform: 'scale(0) translateY(-50%)',
                        opacity: 0,
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 700,
                        fontSize: '1.2vw',
                        color: EP_COLORS.danger,
                        textShadow: `0 0 8px ${EP_COLORS.danger}`,
                      }}>VULNERABLE</span>
                    </div>
                  ) : (
                    /* Normal status cells */
                    <div style={{ display: 'flex', gap: '0.5vw', flexWrap: 'wrap' }}>
                      {row.atRest && (
                        <span style={{
                          color: EP_COLORS.danger,
                          fontSize: '1vw',
                          padding: '0.2vh 0.5vw',
                          border: `1px solid ${EP_COLORS.danger}40`,
                          borderRadius: '4px',
                          animation: row.type === 'P2PK' ? 'ep7-pulse-red 2s ease-in-out infinite' : undefined,
                        }}>At Risk</span>
                      )}
                      {row.onSpend && !row.atRest && (
                        <span style={{ color: EP_COLORS.warning, fontSize: '1vw' }}>Vuln on spend</span>
                      )}
                      {!row.atRest && !row.onSpend && (
                        <span style={{ color: EP_COLORS.safe, fontSize: '1vw' }}>
                          {isProposed ? 'PROPOSED' : 'Safe'}
                        </span>
                      )}
                      {!row.atRest && row.onSpend && (
                        <span style={{ color: EP_COLORS.safe, fontSize: '1vw' }}>Safe at rest</span>
                      )}
                      {row.btc !== '—' && (
                        <span style={{
                          color: EP_COLORS.goldBright, fontSize: '0.9vw',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}>{row.btc} BTC</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Twist explanation (appears in scene 18) */}
      <div className="vg-twist-explain" style={{
        marginTop: '1vh',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '1.1vw',
        color: EP_COLORS.danger,
        textAlign: 'center',
        opacity: 0,
      }}>
        P2TR exposes your public key directly on-chain
        <br />
        <span style={{ color: EP_COLORS.warning, fontSize: '1vw' }}>
          Vulnerable to BOTH at-rest AND on-spend attacks
        </span>
      </div>

      <style>{`
        @keyframes ep7-pulse-red {
          0%, 100% { box-shadow: 0 0 4px ${EP_COLORS.danger}40; }
          50% { box-shadow: 0 0 12px ${EP_COLORS.danger}80; }
        }
      `}</style>
    </div>
  );
}
