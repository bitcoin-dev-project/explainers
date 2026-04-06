/**
 * ScanLineOverlay — Ambient CRT diagnostic effect.
 *
 * Pure CSS: sweeping cyan scan line + horizontal CRT texture + vignette.
 * Runs independently of scene state for constant atmosphere.
 * Uses will-change: transform for GPU acceleration.
 */

import { EP_COLORS } from './constants';

const styles = `
  @keyframes scanSweep {
    0% { transform: translateY(-2vh); }
    100% { transform: translateY(102vh); }
  }

  @keyframes scanPulse {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.25; }
  }
`;

interface ScanLineOverlayProps {
  /** Controls overall visibility — fades in during boot */
  opacity?: number;
}

export default function ScanLineOverlay({ opacity = 1 }: ScanLineOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        opacity,
        transition: 'opacity 1s ease',
      }}
    >
      <style>{styles}</style>

      {/* Sweeping scan line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${EP_COLORS.cyan}60 20%, ${EP_COLORS.cyan}90 50%, ${EP_COLORS.cyan}60 80%, transparent 100%)`,
          boxShadow: `0 0 20px 4px ${EP_COLORS.cyan}40, 0 0 60px 8px ${EP_COLORS.cyan}20`,
          animation: 'scanSweep 3s linear infinite',
          willChange: 'transform',
          zIndex: 2,
        }}
      />

      {/* CRT horizontal line texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            ${EP_COLORS.steel}12 3px,
            ${EP_COLORS.steel}12 4px
          )`,
          animation: 'scanPulse 4s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Vignette darkening at edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, ${EP_COLORS.bg}cc 100%)`,
          zIndex: 3,
        }}
      />
    </div>
  );
}
