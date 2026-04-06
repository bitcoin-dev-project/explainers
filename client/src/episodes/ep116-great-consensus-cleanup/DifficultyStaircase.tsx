import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

type StaircaseMode = 'intro' | 'zoom' | 'collapse' | 'flood' | 'fix' | 'hidden';

interface DifficultyStaircaseProps {
  mode: StaircaseMode;
  scene: number;
}

const PERIODS = 8;
const STEP_W = 160;
const STEP_H = 36;
const STEP_GAP = 4;
const BASE_DIFFICULTY = 83.13;
const FONT_MONO = 'var(--font-mono)';

function difficultyAtStep(step: number, collapsed: boolean): string {
  if (!collapsed) return `${BASE_DIFFICULTY}T`;
  const val = BASE_DIFFICULTY / Math.pow(2, step);
  if (val < 0.01) return '1';
  if (val < 1) return val.toFixed(2) + 'T';
  return val.toFixed(1) + 'T';
}

export default function DifficultyStaircase({ mode, scene }: DifficultyStaircaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Kill previous timeline
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    // Reset all step positions
    const steps = el.querySelectorAll('.staircase-step');
    const labels = el.querySelectorAll('.diff-label');
    const tsLabels = el.querySelectorAll('.ts-label');
    const gapHighlight = el.querySelector('.gap-highlight');
    const gapLabel = el.querySelector('.gap-label');
    const lockIcon = el.querySelector('.lock-icon');
    const floodContainer = el.querySelector('.flood-container');
    const formulaEl = el.querySelector('.formula');

    const tl = gsap.timeline();
    tlRef.current = tl;

    if (mode === 'hidden') {
      tl.set(el, { opacity: 0 });
      return;
    }

    tl.set(el, { opacity: 1 });

    if (mode === 'intro') {
      // Steps build from left, first step appears
      tl.set(steps, { scaleX: 0, opacity: 0, transformOrigin: 'left center' })
        .set([...Array.from(labels), ...Array.from(tsLabels), gapHighlight, gapLabel, lockIcon, floodContainer, formulaEl].filter(Boolean), { opacity: 0 });

      steps.forEach((step, i) => {
        tl.to(step, {
          scaleX: 1, opacity: 1, duration: 0.4,
          ease: 'power3.out', delay: i * 0.08,
        }, 0.3);
      });

      // Show period labels with stagger
      tl.to(labels, { opacity: 1, duration: 0.3, stagger: 0.06 }, 0.8);

      // Show gap highlight at boundary
      if (gapHighlight) {
        tl.to(gapHighlight, {
          opacity: 1, duration: 0.4,
          boxShadow: `0 0 20px ${EP_COLORS.actTimewarp}`,
        }, 2.0);
      }
      if (gapLabel) {
        tl.fromTo(gapLabel, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 }, 2.4);
      }
      if (formulaEl) {
        tl.fromTo(formulaEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 3.0);
      }
    }

    if (mode === 'collapse') {
      // Steps slam down in accelerating cascade
      tl.set(steps, { scaleX: 1, opacity: 1 })
        .set(labels, { opacity: 1 })
        .set([gapHighlight, gapLabel, lockIcon, floodContainer].filter(Boolean), { opacity: 0 });

      // Show attacker timestamps and slam each step down
      steps.forEach((step, i) => {
        if (i === 0) return; // First step stays
        const delay = i < 3 ? i * 0.5 : 0.5 * 3 + (i - 3) * (0.4 - (i - 3) * 0.04);
        const yDrop = i * (STEP_H + 12);

        // Timestamp label appears before drop
        if (tsLabels[i]) {
          tl.fromTo(tsLabels[i], { opacity: 0 }, {
            opacity: 1, duration: 0.2,
          }, delay);
        }

        // Step SLAMS down
        tl.to(step, {
          y: yDrop, duration: 0.15, ease: 'power4.in',
        }, delay + 0.2);
      });

      // Screen shake on final drop
      tl.to(el, {
        x: 3, duration: 0.05, yoyo: true, repeat: 7,
        ease: 'power1.inOut',
      }, '-=0.1');

      // Difficulty: 1 label
      const resultLabel = el.querySelector('.result-label');
      if (resultLabel) {
        tl.fromTo(resultLabel, { opacity: 0, scale: 0.5 }, {
          opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)',
        });
      }
    }

    if (mode === 'flood') {
      // Show flood of tiny blocks
      tl.set(steps, { opacity: 0.3 })
        .set([gapHighlight, gapLabel, lockIcon].filter(Boolean), { opacity: 0 });

      if (floodContainer) {
        tl.set(floodContainer, { opacity: 1 });
        const blocks = floodContainer.querySelectorAll('.flood-block');
        tl.fromTo(blocks, { opacity: 0, y: -20, scale: 0.3 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.1,
          stagger: 0.03, ease: 'power2.out',
        }, 0.3);
      }
    }

    if (mode === 'fix') {
      // Rebuild stable staircase
      tl.set(steps, { y: 0, scaleX: 1, opacity: 1 })
        .set(labels, { opacity: 1 })
        .set([...Array.from(tsLabels), floodContainer].filter(Boolean), { opacity: 0 });

      // Lock icon snaps in
      if (lockIcon) {
        tl.fromTo(lockIcon, { opacity: 0, scale: 0 }, {
          opacity: 1, scale: 1, duration: 0.3,
          ease: 'back.out(2)',
        }, 1.0);
      }

      if (gapLabel) {
        tl.fromTo(gapLabel, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 }, 1.5);
      }
    }

    return () => {
      tl.kill();
    };
  }, [mode, scene]);

  if (mode === 'hidden') return null;

  const collapsed = mode === 'collapse' || mode === 'flood';
  const isFixMode = mode === 'fix';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        fontFamily: FONT_MONO,
      }}
    >
      {/* Staircase steps */}
      {Array.from({ length: PERIODS }).map((_, i) => (
        <div
          key={i}
          className="staircase-step"
          style={{
            position: 'absolute',
            left: `${60 + i * 10}px`,
            top: `${200 + i * (STEP_H + STEP_GAP)}px`,
            width: `${STEP_W}px`,
            height: `${STEP_H}px`,
            background: EP_COLORS.bgAlt,
            border: `1px solid ${EP_COLORS.actTimewarp}40`,
            borderLeft: `3px solid ${EP_COLORS.actTimewarp}`,
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
          }}
        >
          <span className="diff-label" style={{ fontSize: '11px', color: EP_COLORS.textMuted }}>
            Period {i + 1}
          </span>
          <span className="diff-label" style={{
            fontSize: '11px',
            color: collapsed ? EP_COLORS.statusRed : isFixMode ? EP_COLORS.statusGreen : EP_COLORS.text,
            fontWeight: 'bold',
          }}>
            {difficultyAtStep(i, collapsed)}
          </span>
        </div>
      ))}

      {/* Timestamp labels (attack) */}
      {Array.from({ length: PERIODS }).map((_, i) => (
        <span
          key={`ts-${i}`}
          className="ts-label"
          style={{
            position: 'absolute',
            left: `${60 + i * 10 + STEP_W + 8}px`,
            top: `${200 + i * (STEP_H + STEP_GAP) + 10}px`,
            fontSize: '10px',
            color: EP_COLORS.statusRed,
            opacity: 0,
            whiteSpace: 'nowrap',
          }}
        >
          t={i % 2 === 0 ? 'Jan 1 00:00' : 'Dec 31 23:59'}
        </span>
      ))}

      {/* Gap highlight between period boundaries */}
      <div
        className="gap-highlight"
        style={{
          position: 'absolute',
          left: `${60 + STEP_W - 6}px`,
          top: '195px',
          width: '16px',
          height: `${STEP_H + 10}px`,
          border: `2px solid ${EP_COLORS.actTimewarp}`,
          borderRadius: '4px',
          opacity: 0,
        }}
      />

      {/* Gap label */}
      <div
        className="gap-label"
        style={{
          position: 'absolute',
          left: `${60 + STEP_W + 16}px`,
          top: '198px',
          fontSize: '12px',
          color: isFixMode ? EP_COLORS.statusGreen : EP_COLORS.actTimewarp,
          opacity: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {isFixMode ? '← Max 7,200s before prev block' : '← No timestamp constraint here'}
      </div>

      {/* Formula */}
      <div
        className="formula"
        style={{
          position: 'absolute',
          left: '60px',
          bottom: '100px',
          fontSize: '14px',
          color: EP_COLORS.text,
          opacity: 0,
        }}
      >
        Measured: t₂₀₁₆ − t₁ across 2,015 gaps
      </div>

      {/* Lock icon (fix mode) */}
      <div
        className="lock-icon"
        style={{
          position: 'absolute',
          left: `${60 + STEP_W - 2}px`,
          top: '192px',
          width: '24px',
          height: '24px',
          opacity: 0,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
          <rect x="3" y="11" width="18" height="11" rx="2" fill={EP_COLORS.actTimewarp} />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={EP_COLORS.actTimewarp} strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Difficulty: 1 result label */}
      <div
        className="result-label"
        style={{
          position: 'absolute',
          left: '60px',
          bottom: '60px',
          fontSize: '22px',
          fontWeight: 'bold',
          color: EP_COLORS.statusRed,
          opacity: 0,
        }}
      >
        Difficulty: 1
      </div>

      {/* Flood of blocks */}
      <div
        className="flood-container"
        style={{
          position: 'absolute',
          left: '60px',
          top: '450px',
          width: `${STEP_W * 5}px`,
          height: '300px',
          opacity: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '3px',
          alignContent: 'flex-start',
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`flood-${i}`}
            className="flood-block"
            style={{
              width: '28px',
              height: '18px',
              background: EP_COLORS.bgAlt,
              border: `1px solid ${EP_COLORS.actTimewarp}60`,
              borderRadius: '2px',
              opacity: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
