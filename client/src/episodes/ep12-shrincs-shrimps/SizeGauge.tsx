/**
 * SizeGauge — Persistent size comparison bar chart (SVG + GSAP).
 * Accumulates bars across scenes. Full-viewport mode for scene 17.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS, SCHEME_COLORS } from './constants';

export interface GaugeEntry {
  key: string;
  label: string;
  bytes: number;
  color: string;
  active?: boolean;
}

interface SizeGaugeProps {
  entries: GaugeEntry[];
  fullViewport?: boolean;
  highlightKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

const MAX_BYTES = 8000; // scale reference

export default function SizeGauge({
  entries, fullViewport = false, highlightKey, className, style,
}: SizeGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const newCount = entries.length;
    if (newCount > prevCountRef.current) {
      // Animate new bars in
      const newBars = containerRef.current.querySelectorAll('.gauge-bar');
      for (let i = prevCountRef.current; i < newCount; i++) {
        const bar = newBars[i];
        if (bar) {
          gsap.fromTo(bar,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.8, ease: 'power2.out', delay: 0.1 * (i - prevCountRef.current) },
          );
        }
      }
      prevCountRef.current = newCount;
    }
  }, [entries.length]);

  // Highlight bounce
  useEffect(() => {
    if (!highlightKey || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-key="${highlightKey}"] .gauge-label`);
    if (el) {
      gsap.fromTo(el,
        { scale: 1 },
        { scale: 1.3, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' },
      );
    }
  }, [highlightKey]);

  const barHeight = fullViewport ? 72 : 44;
  const gap = fullViewport ? 24 : 14;

  return (
    <div ref={containerRef} className={className} style={style}>
      {!fullViewport && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: EP_COLORS.textDim,
          marginBottom: 12,
          letterSpacing: '0.05em',
        }}>
          SIGNATURE SIZE
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {entries.map(entry => {
          const widthPct = Math.min(
            fullViewport ? 92 : 95,
            Math.max(4, (entry.bytes / MAX_BYTES) * (fullViewport ? 85 : 90)),
          );
          const isHighlighted = entry.key === highlightKey;
          const barColor = entry.active === false ? EP_COLORS.muted : entry.color;

          return (
            <div key={entry.key} data-key={entry.key} style={{ position: 'relative' }}>
              {/* Label */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: fullViewport ? 16 : 12,
                color: isHighlighted ? EP_COLORS.gold : EP_COLORS.textDim,
                marginBottom: 4,
              }}>
                {entry.label}
              </div>

              {/* Bar */}
              <div
                className="gauge-bar"
                style={{
                  width: `${widthPct}%`,
                  height: barHeight,
                  borderRadius: 6,
                  background: isHighlighted
                    ? `linear-gradient(90deg, ${barColor}, ${EP_COLORS.gold})`
                    : barColor,
                  opacity: entry.active === false ? 0.35 : 0.8,
                  position: 'relative',
                  boxShadow: isHighlighted ? `0 0 30px ${EP_COLORS.gold}60` : 'none',
                  transition: 'box-shadow 0.4s',
                }}
              >
                {/* Byte count inside bar */}
                <div
                  className="gauge-label"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: fullViewport ? 22 : 14,
                    fontWeight: 700,
                    color: isHighlighted ? EP_COLORS.bg : EP_COLORS.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.bytes >= 1000
                    ? `${entry.bytes.toLocaleString()} B`
                    : `${entry.bytes} B`}
                </div>
              </div>

              {/* Comparison annotation for highlighted bar */}
              {isHighlighted && fullViewport && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 16,
                  color: EP_COLORS.gold,
                  marginTop: 4,
                }}>
                  11× smaller than ML-DSA
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
