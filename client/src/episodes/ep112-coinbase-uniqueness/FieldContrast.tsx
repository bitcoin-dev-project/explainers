// FieldContrast.tsx — Act 3 centerpiece for EP112
// Side-by-side comparison: scriptSig chaos vs nLockTime calm.
// Left panel jitters (GSAP random transforms), right panel sits still with gold glow.

import { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface Props {
  scene: number;   // 0-indexed; active during scenes 13-14
  active: boolean;
}

function randomHex(): string {
  return Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────

export default function FieldContrast({ scene, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitterTlRef = useRef<gsap.core.Timeline | null>(null);

  // Generate random hex for display (static after mount)
  const scriptSigHex = useMemo(
    () => Array.from({ length: 12 }, () => randomHex()),
    [],
  );

  // ── Continuous jitter for left panel ──
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const cells = containerRef.current.querySelectorAll('.jitter-cell');
    if (!cells.length) return;

    // Random jitter loop — each cell shakes independently
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true });
    cells.forEach((cell, i) => {
      tl.to(cell, {
        x: `random(-4, 4)`,
        y: `random(-3, 3)`,
        duration: 0.1,
        ease: 'steps(2)',
      }, i * 0.02);
    });
    jitterTlRef.current = tl;
    return () => { tl.kill(); };
  }, [active]);

  // ── Scene-driven enter/morph ──
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const ctx = gsap.context(() => {
      if (scene === 13) {
        const tl = gsap.timeline();
        tl.from('.left-panel', { x: -120, opacity: 0, duration: 0.5, ease: 'power2.out' })
          .from('.right-panel', { x: 120, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
          .from('.panel-header', { opacity: 0, y: -10, stagger: 0.15, duration: 0.3 })
          .from('.jitter-cell', { opacity: 0, stagger: 0.03, duration: 0.15 })
          .from('.calm-cell', { opacity: 0, stagger: 0.08, duration: 0.2 }, '-=0.3')
          .from('.sub-label', { opacity: 0, y: 8, stagger: 0.2, duration: 0.3 }, '-=0.3');
      } else if (scene === 14) {
        const tl = gsap.timeline();
        tl.to('.left-panel', { opacity: 0.15, duration: 0.5 })
          .to('.right-panel', {
            left: '30%', width: '40%', duration: 0.6, ease: 'power2.inOut',
          }, '-=0.3')
          .to('.calm-cell', { width: 60, height: 60, fontSize: 22, duration: 0.4 }, '-=0.3');
      }
    }, containerRef);

    return () => ctx.revert();
  }, [scene, active]);

  // ── Variable-width bracket animation ──
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const bracket = containerRef.current.querySelector('.var-bracket');
    if (!bracket) return;
    const tl = gsap.to(bracket, {
      width: 'random(180, 320)',
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
    });
    return () => { tl.kill(); };
  }, [active]);

  if (!active) return null;

  const cellStyle = (bg: string, border: string): React.CSSProperties => ({
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: 13,
    color: EP_COLORS.text,
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: 4,
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4vw',
      }}
    >
      {/* ─── Left panel: scriptSig (chaotic) ─── */}
      <div
        className="left-panel"
        style={{
          width: '38%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          className="panel-header"
          style={{
            fontFamily: 'Montserrat,sans-serif',
            fontWeight: 700,
            fontSize: 26,
            color: EP_COLORS.fieldScriptSig,
          }}
        >
          scriptSig
        </div>

        {/* Variable-width bracket */}
        <div
          className="var-bracket"
          style={{
            width: 240,
            height: 6,
            backgroundColor: EP_COLORS.fieldScriptSig,
            borderRadius: 3,
            opacity: 0.5,
          }}
        />

        {/* Jittering byte cells */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 340 }}>
          {scriptSigHex.map((hex, i) => (
            <div
              key={i}
              className="jitter-cell"
              style={cellStyle(EP_COLORS.byte, EP_COLORS.fieldScriptSig)}
            >
              {hex}
            </div>
          ))}
        </div>

        {/* Sub-labels */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {['FREE-FORM', 'VARIABLE LENGTH', 'POSITION UNKNOWN'].map(label => (
            <span
              key={label}
              className="sub-label"
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 12,
                color: EP_COLORS.textDim,
                letterSpacing: 1.5,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Right panel: nLockTime (calm) ─── */}
      <div
        className="right-panel"
        style={{
          width: '38%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          position: 'relative',
        }}
      >
        <div
          className="panel-header"
          style={{
            fontFamily: 'Montserrat,sans-serif',
            fontWeight: 700,
            fontSize: 26,
            color: EP_COLORS.fieldLockTime,
          }}
        >
          nLockTime
        </div>

        {/* Calm byte cells */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {['00', '00', '00', '00'].map((hex, i) => (
            <div
              key={i}
              className="calm-cell"
              style={{
                ...cellStyle(EP_COLORS.byte, EP_COLORS.fieldLockTime),
                boxShadow: `0 0 18px ${EP_COLORS.fieldLockTime}40`,
                animation: 'goldGlow 3s ease-in-out infinite',
              }}
            >
              {hex}
            </div>
          ))}
        </div>

        {/* Sub-labels */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {['FIXED POSITION', '4 BYTES', 'LAST FIELD'].map(label => (
            <span
              key={label}
              className="sub-label"
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 12,
                color: EP_COLORS.textDim,
                letterSpacing: 1.5,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes goldGlow {
          0%, 100% { box-shadow: 0 0 18px ${EP_COLORS.fieldLockTime}40; }
          50%       { box-shadow: 0 0 30px ${EP_COLORS.fieldLockTime}70; }
        }
      `}</style>
    </div>
  );
}
