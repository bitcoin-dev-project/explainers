/**
 * TimelineJourney — The Act 2 centerpiece.
 *
 * A horizontal timeline showing BIP 54's political journey:
 *   2009 (bugs born) → 2017 (CVE) → 2019 (Corallo proposes) →
 *   [STALL: flatline heartbeat] → 2024 (Poinsot revives) → 2025 (BIP 54)
 *
 * The flatline heartbeat is the must-nail visual element.
 * Uses GSAP for node reveals + SVG stroke animation.
 * CSS @keyframes for the heartbeat/flatline pulse.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS, TIMELINE_EVENTS } from './constants';

const styles = `
  @keyframes heartbeatActive {
    0% { d: path("M0,20 L5,20 L8,5 L12,35 L16,20 L20,20 L25,20 L28,5 L32,35 L36,20 L40,20"); }
    50% { d: path("M0,20 L5,20 L8,8 L12,32 L16,20 L20,20 L25,20 L28,8 L32,32 L36,20 L40,20"); }
    100% { d: path("M0,20 L5,20 L8,5 L12,35 L16,20 L20,20 L25,20 L28,5 L32,35 L36,20 L40,20"); }
  }

  @keyframes heartbeatFlat {
    0%, 100% { d: path("M0,20 L40,20"); }
  }

  @keyframes flatlineBlink {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }

  @keyframes revivalPulse {
    0% { r: 6; opacity: 0.8; }
    50% { r: 14; opacity: 0.2; }
    100% { r: 6; opacity: 0.8; }
  }
`;

interface TimelineJourneyProps {
  scene: number;
}

export default function TimelineJourney({ scene }: TimelineJourneyProps) {
  const ref = useRef<HTMLDivElement>(null);

  // GSAP: draw the timeline line + reveal first 3 nodes (scene 7)
  useEffect(() => {
    if (!ref.current || scene < 7) return;
    const ctx = gsap.context(() => {
      // Draw the main timeline line
      gsap.fromTo('.timeline-line',
        { strokeDashoffset: 1200 },
        { strokeDashoffset: 0, duration: 2.5, ease: 'power2.inOut' }
      );

      // Reveal event nodes with stagger
      gsap.from('.timeline-node', {
        scale: 0,
        opacity: 0,
        stagger: 0.4,
        duration: 0.6,
        ease: 'back.out(2)',
        delay: 0.5,
      });

      // Reveal labels
      gsap.from('.timeline-label', {
        opacity: 0,
        y: 15,
        stagger: 0.4,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.8,
      });
    }, ref.current);
    return () => ctx.revert();
  }, [scene >= 7 ? 7 : scene]);

  // GSAP: animate late-arriving nodes (2024, 2025) when they mount at scene 8
  useEffect(() => {
    if (!ref.current || scene < 8) return;
    const ctx = gsap.context(() => {
      // Target only the last 2 nodes that just mounted
      const nodes = ref.current!.querySelectorAll('.timeline-node');
      const lateNodes = Array.from(nodes).slice(3); // nodes 4 & 5 (2024, 2025)
      if (lateNodes.length === 0) return;
      gsap.from(lateNodes, {
        scale: 0,
        opacity: 0,
        stagger: 0.3,
        duration: 0.6,
        ease: 'back.out(2)',
        delay: 0.3,
      });
      // Their labels too
      const labels = lateNodes.map(n => n.querySelector('.timeline-label')).filter(Boolean);
      gsap.from(labels, {
        opacity: 0,
        y: 15,
        stagger: 0.3,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.5,
      });
    }, ref.current);
    return () => ctx.revert();
  }, [scene >= 8 ? 8 : scene]);

  // Scene 8: stall period + flatline
  const showStall = scene >= 8;
  // Scene 8 (second half): revival
  const showRevival = scene >= 8;

  // Determine which nodes are visible based on scene progression
  const visibleCount = scene < 7 ? 0 : scene === 7 ? 3 : TIMELINE_EVENTS.length;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '105vw',
        top: '15vh',
        width: '145vw',
        height: '70vh',
      }}
    >
      <style>{styles}</style>

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '5vw',
        fontFamily: 'var(--font-display)',
        fontSize: '3vh',
        fontWeight: 700,
        color: EP_COLORS.text,
        letterSpacing: '0.05em',
        opacity: scene >= 7 ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        The Long Road to BIP 54
      </div>

      {/* SVG Timeline */}
      <svg
        style={{
          position: 'absolute',
          top: '12vh',
          left: '0',
          width: '145vw',
          height: '50vh',
          overflow: 'visible',
        }}
        viewBox="0 0 1450 500"
        preserveAspectRatio="none"
      >
        {/* Main horizontal line */}
        <line
          className="timeline-line"
          x1="50" y1="200" x2="1400" y2="200"
          stroke={EP_COLORS.steel}
          strokeWidth="2"
          strokeDasharray="1200"
          strokeDashoffset="1200"
        />

        {/* Stall period — dashed section between 2019 and 2024 */}
        {showStall && (
          <g>
            {/* Flatline zone background */}
            <rect
              x="700" y="150" width="450" height="100"
              rx="8"
              fill={`${EP_COLORS.red}08`}
              stroke={`${EP_COLORS.red}20`}
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* "STALLED" label */}
            <text
              x="925" y="145"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="14"
              fill={EP_COLORS.red}
              letterSpacing="0.2em"
              opacity="0.7"
            >
              STALLED — 5 YEARS
            </text>

            {/* Flatline heartbeat path — the must-nail visual */}
            <g transform="translate(700, 180)">
              {/* Repeating flatline segments */}
              {Array.from({ length: 10 }).map((_, i) => (
                <line
                  key={i}
                  x1={i * 45}
                  y1="20"
                  x2={(i + 1) * 45}
                  y2="20"
                  stroke={EP_COLORS.red}
                  strokeWidth="1.5"
                  opacity="0.4"
                  style={{
                    animation: showRevival
                      ? 'none'
                      : 'flatlineBlink 2s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}

              {/* Flatline becomes alive when revival happens */}
              {showRevival && (
                <path
                  d="M0,20 L80,20 L100,20 L120,20 L150,20 L180,20 L200,20 L230,20 L260,20 L300,20 L320,5 L340,35 L360,20 L380,5 L400,35 L420,20 L450,20"
                  fill="none"
                  stroke={EP_COLORS.amber}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="600"
                    to="0"
                    dur="2s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 600;600 0"
                    dur="2s"
                    fill="freeze"
                  />
                </path>
              )}
            </g>

            {/* Year markers along stall period */}
            {[2020, 2021, 2022, 2023].map((year, i) => (
              <g key={year} transform={`translate(${760 + i * 100}, 200)`}>
                <line x1="0" y1="-5" x2="0" y2="5" stroke={EP_COLORS.dim} strokeWidth="1" />
                <text
                  x="0" y="25"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fill={EP_COLORS.dim}
                >
                  {year}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Event nodes */}
        {TIMELINE_EVENTS.slice(0, visibleCount).map((evt, i) => {
          const cx = 50 + (evt.x - 110) * 10; // Map vw positions to SVG coords
          const isRevival = evt.year === 2024;
          const isFinal = evt.year === 2025;

          return (
            <g key={evt.year} className="timeline-node" transform={`translate(${cx}, 200)`}>
              {/* Pulse ring for revival node */}
              {isRevival && showRevival && (
                <circle
                  cx="0" cy="0"
                  r="6"
                  fill="none"
                  stroke={EP_COLORS.amber}
                  strokeWidth="2"
                  style={{ animation: 'revivalPulse 1.5s ease-in-out infinite' }}
                />
              )}

              {/* Node circle */}
              <circle
                cx="0" cy="0"
                r={isFinal ? 10 : 7}
                fill={isFinal ? EP_COLORS.green : evt.color}
                stroke={isFinal ? EP_COLORS.green : 'none'}
                strokeWidth={isFinal ? 2 : 0}
              />

              {/* Glow */}
              <circle
                cx="0" cy="0"
                r={isFinal ? 18 : 14}
                fill={`${evt.color}15`}
              />

              {/* Label group */}
              <g className="timeline-label" transform={`translate(0, ${i % 2 === 0 ? -35 : 35})`}>
                <text
                  x="0" y={i % 2 === 0 ? 0 : 10}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="16"
                  fontWeight="700"
                  fill={evt.color}
                >
                  {evt.year}
                </text>
                <text
                  x="0" y={i % 2 === 0 ? 18 : 28}
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="13"
                  fontWeight="600"
                  fill={EP_COLORS.text}
                >
                  {evt.label}
                </text>
                {evt.sublabel && (
                  <text
                    x="0" y={i % 2 === 0 ? 33 : 43}
                    textAnchor="middle"
                    fontFamily="var(--font-body)"
                    fontSize="11"
                    fill={EP_COLORS.muted}
                  >
                    {evt.sublabel}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
