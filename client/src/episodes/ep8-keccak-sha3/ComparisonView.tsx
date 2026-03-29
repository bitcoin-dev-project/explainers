/**
 * ComparisonView — Act 4: SHA-256d pipe vs SHA-3 sponge tank, side by side.
 *
 * Left: SHA-256d — the same pipe doubled (pipe→pipe). "Hash it twice. A patch."
 * Right: SHA-3 sponge — the tank, miniaturized. "Build it right. No patch needed."
 *
 * Director: NO tournament bracket or timeline. Just the clean comparison.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneGSAP } from '@/lib/video';
import SHA256Pipe from './SHA256Pipe';
import SpongeCanvas from './SpongeCanvas';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface ComparisonViewProps {
  scene: number;
  /** Show the labels/verdict */
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ComparisonView({
  scene,
  showLabels = false,
  className,
  style,
}: ComparisonViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useSceneGSAP(containerRef, scene, {
    14: (tl) => {
      // Both panels scale in from center
      tl.from('.compare-left', {
        opacity: 0,
        x: 60,
        scale: 0.8,
        duration: 0.8,
        ease: 'power3.out',
      })
        .from('.compare-right', {
          opacity: 0,
          x: -60,
          scale: 0.8,
          duration: 0.8,
          ease: 'power3.out',
        }, '-=0.6')
        .from('.compare-vs', {
          opacity: 0,
          scale: 0,
          duration: 0.4,
          ease: 'back.out(2)',
        }, '-=0.4');
    },
    15: (tl) => {
      if (!showLabels) return;
      tl.from('.compare-label-left', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
      })
        .from('.compare-label-right', {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.3')
        .from('.compare-verdict', {
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: 'back.out(1.7)',
        }, '-=0.2');
    },
  });

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3vw',
        ...style,
      }}
    >
      {/* ── Left: SHA-256d (doubled pipe) ── */}
      <div className="compare-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          padding: '20px 24px',
          borderRadius: 12,
          background: EP_COLORS.bgAlt + '80',
          border: `1px solid ${EP_COLORS.muted}30`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          {/* Two pipes stacked = double hash */}
          <SHA256Pipe scene={scene} mini />
          <div style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width={16} height={16} viewBox="0 0 16 16">
              <path d="M8 2 L8 14 M4 10 L8 14 L12 10" stroke={EP_COLORS.muted} strokeWidth={1.5} fill="none" />
            </svg>
          </div>
          <SHA256Pipe scene={scene} mini />
        </div>

        <motion.div
          className="compare-label-left"
          style={{ textAlign: 'center', opacity: 0 }}
          animate={showLabels ? { opacity: 1 } : { opacity: 0 }}
          transition={EP_SPRINGS.reveal}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            color: EP_COLORS.text,
          }}>
            SHA-256d
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: EP_COLORS.muted,
            marginTop: 4,
          }}>
            Hash it twice. A patch.
          </div>
        </motion.div>
      </div>

      {/* ── VS divider ── */}
      <div className="compare-vs" style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        fontWeight: 700,
        color: EP_COLORS.muted,
        letterSpacing: 3,
      }}>
        VS
      </div>

      {/* ── Right: SHA-3 sponge tank ── */}
      <div className="compare-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: EP_COLORS.bgAlt + '80',
          border: `1px solid ${EP_COLORS.waterline}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <SpongeCanvas
            mode="idle"
            width={200}
            height={300}
            scale={1}
          />
        </div>

        <motion.div
          className="compare-label-right"
          style={{ textAlign: 'center', opacity: 0 }}
          animate={showLabels ? { opacity: 1 } : { opacity: 0 }}
          transition={EP_SPRINGS.reveal}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            color: EP_COLORS.waterline,
          }}>
            SHA-3 Sponge
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: EP_COLORS.muted,
            marginTop: 4,
          }}>
            Build it right. No patch needed.
          </div>
        </motion.div>
      </div>

      {/* ── Verdict ── */}
      {showLabels && (
        <motion.div
          className="compare-verdict"
          style={{
            position: 'absolute',
            bottom: '8vh',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, ...EP_SPRINGS.reveal }}
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            color: EP_COLORS.highlight,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            Architectural solutions beat workarounds
          </span>
        </motion.div>
      )}
    </div>
  );
}
