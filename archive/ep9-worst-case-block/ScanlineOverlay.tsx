/**
 * ScanlineOverlay — Atmospheric CSS-only effect.
 *
 * Full-viewport overlay with drifting horizontal scanlines.
 * Gives the whole episode a "system monitor" / "surveillance" feel.
 * Always mounted — no JS animation needed.
 *
 * Also handles the danger/safe glow that pulses at screen edges.
 */

import { EP_COLORS } from './constants';

interface ScanlineOverlayProps {
  /** 'calm' | 'danger' | 'safe' — controls edge glow color */
  mood?: 'calm' | 'danger' | 'safe';
}

export default function ScanlineOverlay({ mood = 'calm' }: ScanlineOverlayProps) {
  const edgeGlow =
    mood === 'danger' ? EP_COLORS.dangerGlow :
    mood === 'safe' ? EP_COLORS.safeGlow :
    'transparent';

  const pulseSpeed = mood === 'danger' ? '1.2s' : '2.5s';

  return (
    <>
      {/* Scanlines */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            ${EP_COLORS.scanline} 3px,
            ${EP_COLORS.scanline} 4px
          )`,
          backgroundSize: '100% 4px',
          animation: 'ep9-scanlineDrift 8s linear infinite',
          opacity: 0.7,
        }}
      />

      {/* Edge glow (vignette that pulses) */}
      {mood !== 'calm' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99,
            boxShadow: `inset 0 0 100px 30px ${edgeGlow}`,
            animation: `ep9-edgePulse ${pulseSpeed} ease-in-out infinite`,
          }}
        />
      )}

      {/* Corner noise dots — subtle digital grain */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 98,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes ep9-scanlineDrift {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes ep9-edgePulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
