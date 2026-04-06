/**
 * UTXOHistogram — Scene 14 HIGHLIGHT: "Most UTXOs are spent exactly once."
 * Horizontal bar chart with GSAP staggered growth. Gold pulse on 1× bar.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface UTXOHistogramProps {
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BARS = [
  { label: 'Spent 1×', pct: 70, width: 68, color: EP_COLORS.gold, highlight: true },
  { label: 'Spent 2×', pct: 18, width: 17, color: EP_COLORS.accent },
  { label: 'Spent 3×', pct: 7, width: 7, color: EP_COLORS.muted },
  { label: 'Spent 4×+', pct: 5, width: 5, color: `${EP_COLORS.muted}99` },
];

export default function UTXOHistogram({ active, className, style }: UTXOHistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const bars = containerRef.current.querySelectorAll('.histo-bar');
    const labels = containerRef.current.querySelectorAll('.histo-pct');

    gsap.fromTo(bars,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1.0, ease: 'power2.out', stagger: 0.2, delay: 0.3 },
    );

    gsap.fromTo(labels,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, stagger: 0.2, delay: 1.0 },
    );

    // Gold pulse on first bar
    const firstBar = bars[0] as HTMLElement | undefined;
    if (firstBar) {
      gsap.to(firstBar, {
        boxShadow: `0 0 60px ${EP_COLORS.gold}80`,
        duration: 0.6,
        delay: 1.5,
        yoyo: true,
        repeat: 2,
        ease: 'sine.inOut',
      });
    }
  }, [active]);

  // Reset animation on deactivate
  useEffect(() => {
    if (!active) hasAnimated.current = false;
  }, [active]);

  const barH = 90;
  const gap = 28;

  return (
    <div ref={containerRef} className={className} style={{ padding: '4vh 6vw', ...style }}>
      {/* Y-axis label */}
      <div style={{
        position: 'absolute', left: '3vw', top: '50%',
        transform: 'translateY(-50%) rotate(-90deg)',
        fontFamily: 'var(--font-body)', fontSize: 18, color: EP_COLORS.textDim,
        letterSpacing: '0.08em',
      }}>
        Bitcoin UTXOs
      </div>

      <div style={{ marginLeft: '6vw', display: 'flex', flexDirection: 'column', gap }}>
        {BARS.map(bar => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Row label */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 16,
              color: EP_COLORS.text, width: 110, textAlign: 'right', flexShrink: 0,
            }}>
              {bar.label}
            </div>

            {/* Bar */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                className="histo-bar"
                style={{
                  width: `${bar.width}%`,
                  height: barH,
                  borderRadius: 8,
                  background: bar.highlight
                    ? `linear-gradient(90deg, ${EP_COLORS.accent}, ${EP_COLORS.gold})`
                    : bar.color,
                  border: bar.highlight ? `2px solid ${EP_COLORS.gold}` : 'none',
                  position: 'relative',
                  boxShadow: 'none',
                  transition: 'box-shadow 0.3s',
                }}
              >
                {/* Percentage inside */}
                <div
                  className="histo-pct"
                  style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: bar.highlight ? 28 : 18,
                    color: bar.highlight ? EP_COLORS.bg : EP_COLORS.text,
                    opacity: 0,
                  }}
                >
                  ~{bar.pct}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
