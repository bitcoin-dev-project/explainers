/**
 * BugQuadrant — Individual bug panel with mini-animation.
 *
 * Each of the 4 bugs has a unique motion verb:
 *   - Timewarp:   spinning clock + draining difficulty bar
 *   - Validation: overloading CPU meter + crawling progress bar
 *   - Merkle 64B: morphing rectangle between TX and tree node
 *   - Coinbase:   ticking block counter + duplicating hash
 *
 * Uses GSAP for choreographed sequences within each panel.
 * Status flow: dormant → scanning → diagnosed → fixed
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { type BugId, type BugStatus, type BugData, EP_COLORS } from './constants';

const styles = `
  @keyframes panelPulse {
    0%, 100% { box-shadow: inset 0 0 20px transparent; }
    50% { box-shadow: inset 0 0 20px var(--pulse-color, transparent); }
  }

  @keyframes clockSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes meterShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }

  @keyframes counterTick {
    0%, 80% { opacity: 1; }
    90% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;

interface BugQuadrantProps {
  bug: BugData;
  status: BugStatus;
  scene: number;
  /** Whether this quadrant is currently zoomed-in (camera focused) */
  active?: boolean;
}

// ─── Status indicator dot ────────────────────────────────────────

function StatusDot({ status }: { status: BugStatus }) {
  const color =
    status === 'dormant' ? EP_COLORS.dim :
    status === 'scanning' ? EP_COLORS.cyan :
    status === 'diagnosed' ? EP_COLORS.red :
    EP_COLORS.green;

  return (
    <div
      style={{
        width: '1.2vh',
        height: '1.2vh',
        borderRadius: '50%',
        background: color,
        boxShadow: status !== 'dormant' ? `0 0 8px ${color}80` : 'none',
        transition: 'all 0.4s ease',
      }}
    />
  );
}

// ─── Mini-Animation: Timewarp (spinning / draining) ─────────────

function TimewarpAnimation({ active, status }: { active: boolean; status: BugStatus }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    const ctx = gsap.context(() => {
      // Difficulty bar drains from full to zero
      gsap.fromTo('.diff-bar-fill',
        { scaleX: 1 },
        { scaleX: 0, duration: 4, ease: 'power2.in', transformOrigin: 'left center' }
      );
      // "2016 blocks" label fades in
      gsap.from('.data-label', { opacity: 0, y: 10, duration: 0.6, delay: 0.5 });
    }, ref.current);
    return () => ctx.revert();
  }, [active]);

  const isFixed = status === 'fixed';

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vh' }}>
      {/* Clock face */}
      <svg width="10vh" height="10vh" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke={EP_COLORS.steel} strokeWidth="2" />
        {/* Hour marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const x1 = 50 + 35 * Math.cos(angle);
          const y1 = 50 + 35 * Math.sin(angle);
          const x2 = 50 + 40 * Math.cos(angle);
          const y2 = 50 + 40 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={EP_COLORS.muted} strokeWidth="1.5" />;
        })}
        {/* Clock hand — spins faster and faster */}
        <line
          x1="50" y1="50" x2="50" y2="15"
          stroke={isFixed ? EP_COLORS.green : EP_COLORS.red}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transformOrigin: '50px 50px',
            animation: active ? 'clockSpin 0.8s linear infinite' : 'none',
            transition: 'stroke 0.5s ease',
          }}
        />
        <circle cx="50" cy="50" r="3" fill={isFixed ? EP_COLORS.green : EP_COLORS.red} />
      </svg>

      {/* Difficulty bar */}
      <div style={{ width: '80%', position: 'relative' }}>
        <div style={{
          fontSize: '1.1vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.muted,
          marginBottom: '0.5vh', letterSpacing: '0.1em',
        }}>
          DIFFICULTY
        </div>
        <div style={{
          width: '100%', height: '1.5vh', borderRadius: '0.75vh',
          background: EP_COLORS.steel, overflow: 'hidden',
        }}>
          <div
            className="diff-bar-fill"
            style={{
              width: '100%', height: '100%', borderRadius: '0.75vh',
              background: isFixed
                ? `linear-gradient(90deg, ${EP_COLORS.green}, ${EP_COLORS.green}cc)`
                : `linear-gradient(90deg, ${EP_COLORS.red}, ${EP_COLORS.amber})`,
              transition: 'background 0.5s ease',
            }}
          />
        </div>
        <div className="data-label" style={{
          fontSize: '1.3vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.text,
          marginTop: '0.8vh', textAlign: 'center', opacity: active ? 1 : 0,
        }}>
          2016 blocks per retarget
        </div>
      </div>
    </div>
  );
}

// ─── Mini-Animation: Validation (overloading / grinding) ────────

function ValidationAnimation({ active, status }: { active: boolean; status: BugStatus }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    const ctx = gsap.context(() => {
      // Progress bar crawls slowly to ~30% then snaps to 100%
      gsap.fromTo('.progress-fill',
        { scaleX: 0 },
        {
          scaleX: 0.3, duration: 3, ease: 'power1.in', transformOrigin: 'left center',
          onComplete: () => {
            gsap.to('.progress-fill', { scaleX: 1, duration: 0.2, ease: 'power4.out' });
            gsap.to('.time-label', { innerHTML: '10s', duration: 0.1, snap: { innerHTML: 1 } });
          },
        }
      );
      gsap.from('.data-label', { opacity: 0, y: 10, duration: 0.6, delay: 0.5 });
    }, ref.current);
    return () => ctx.revert();
  }, [active]);

  const isFixed = status === 'fixed';

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5vh' }}>
      {/* CPU Load meter */}
      <div style={{ width: '80%' }}>
        <div style={{
          fontSize: '1.1vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.muted,
          marginBottom: '0.5vh', letterSpacing: '0.1em',
        }}>
          CPU LOAD
        </div>
        <div style={{ display: 'flex', gap: '0.4vh', height: '6vh' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: '0.3vh',
                background: i < (active ? 19 : 3)
                  ? (i > 14 ? EP_COLORS.red : i > 10 ? EP_COLORS.amber : EP_COLORS.green)
                  : EP_COLORS.steel,
                transition: `background 0.1s ease ${i * 0.03}s`,
                animation: active && i > 16 ? 'meterShake 0.1s ease infinite' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Validation progress bar */}
      <div style={{ width: '80%' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '0.5vh',
        }}>
          <span style={{ fontSize: '1.1vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.muted, letterSpacing: '0.1em' }}>
            BLOCK VALIDATION
          </span>
          <span className="time-label" style={{
            fontSize: '1.8vh', fontFamily: 'var(--font-mono)',
            color: isFixed ? EP_COLORS.green : EP_COLORS.red,
            fontWeight: 600,
          }}>
            {isFixed ? '10s' : '1.5 hrs'}
          </span>
        </div>
        <div style={{
          width: '100%', height: '1.5vh', borderRadius: '0.75vh',
          background: EP_COLORS.steel, overflow: 'hidden',
        }}>
          <div
            className="progress-fill"
            style={{
              width: '100%', height: '100%', borderRadius: '0.75vh',
              background: isFixed
                ? EP_COLORS.green
                : `linear-gradient(90deg, ${EP_COLORS.amber}, ${EP_COLORS.red})`,
              transformOrigin: 'left center',
              transform: 'scaleX(0)',
            }}
          />
        </div>
        <div className="data-label" style={{
          fontSize: '1.2vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.text,
          marginTop: '0.8vh', textAlign: 'center', opacity: active ? 1 : 0,
        }}>
          O(n²) sighash + OP_CODESEPARATOR
        </div>
      </div>
    </div>
  );
}

// ─── Mini-Animation: Merkle 64-byte (morphing / splitting) ──────

function Merkle64Animation({ active, status }: { active: boolean; status: BugStatus }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    const ctx = gsap.context(() => {
      // The rectangle morphs between "TX" and "Node" interpretations
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

      tl.to('.morph-box', {
        borderRadius: '50%',
        background: EP_COLORS.cyan,
        duration: 0.8,
        ease: 'power2.inOut',
      })
      .to('.morph-label', { opacity: 0, duration: 0.2 }, '<')
      .set('.morph-label', { innerHTML: 'MERKLE NODE' })
      .to('.morph-label', { opacity: 1, duration: 0.2 })
      .to('.morph-box', {
        borderRadius: '0.5vh',
        background: EP_COLORS.red,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 1,
      })
      .to('.morph-label', { opacity: 0, duration: 0.2 }, '<')
      .set('.morph-label', { innerHTML: 'TRANSACTION' })
      .to('.morph-label', { opacity: 1, duration: 0.2 });

      gsap.from('.data-label', { opacity: 0, y: 10, duration: 0.6, delay: 0.5 });
    }, ref.current);
    return () => ctx.revert();
  }, [active]);

  const isFixed = status === 'fixed';

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vh' }}>
      {/* The morphing shape */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh' }}>
        <div
          className="morph-box"
          style={{
            width: '14vh',
            height: '7vh',
            borderRadius: '0.5vh',
            background: isFixed ? EP_COLORS.green : EP_COLORS.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isFixed ? 'background 0.5s ease' : undefined,
            boxShadow: `0 0 20px ${isFixed ? EP_COLORS.green : EP_COLORS.red}40`,
          }}
        >
          <span
            className="morph-label"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4vh',
              color: EP_COLORS.text,
              fontWeight: 600,
              letterSpacing: '0.1em',
            }}
          >
            TRANSACTION
          </span>
        </div>

        {/* Byte count badge */}
        <div style={{
          padding: '0.4vh 1.5vh',
          borderRadius: '1vh',
          border: `1px solid ${EP_COLORS.steel}`,
          fontFamily: 'var(--font-mono)',
          fontSize: '2vh',
          color: isFixed ? EP_COLORS.green : EP_COLORS.amber,
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          64 bytes
        </div>
      </div>

      <div className="data-label" style={{
        fontSize: '1.2vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.text,
        textAlign: 'center', opacity: active ? 1 : 0,
      }}>
        Same bytes, two meanings
      </div>
    </div>
  );
}

// ─── Mini-Animation: Coinbase (duplicating / ticking) ───────────

function CoinbaseAnimation({ active, status }: { active: boolean; status: BugStatus }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    const ctx = gsap.context(() => {
      // Block counter ticks toward target
      const counter = { val: 1983600 };
      gsap.to(counter, {
        val: 1983702,
        duration: 3,
        ease: 'power1.in',
        snap: { val: 1 },
        onUpdate: () => {
          const el = ref.current?.querySelector('.block-counter');
          if (el) el.textContent = counter.val.toLocaleString();
        },
      });

      // Hash strings duplicate
      gsap.from('.hash-dup', {
        opacity: 0,
        x: -20,
        stagger: 0.3,
        delay: 1.5,
        duration: 0.5,
        ease: 'power2.out',
      });

      gsap.from('.data-label', { opacity: 0, y: 10, duration: 0.6, delay: 0.5 });
    }, ref.current);
    return () => ctx.revert();
  }, [active]);

  const isFixed = status === 'fixed';
  const hashSnippet = 'd5d2...8a3e';

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vh' }}>
      {/* Block height counter */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '1.1vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.muted,
          letterSpacing: '0.1em', marginBottom: '0.5vh',
        }}>
          BLOCK HEIGHT
        </div>
        <div
          className="block-counter"
          style={{
            fontSize: '3vh',
            fontFamily: 'var(--font-mono)',
            color: isFixed ? EP_COLORS.green : EP_COLORS.amber,
            fontWeight: 700,
            animation: active ? 'counterTick 0.2s linear infinite' : 'none',
          }}
        >
          {active ? '1,983,600' : '1,983,702'}
        </div>
      </div>

      {/* Duplicating hash lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh', alignItems: 'center' }}>
        <div style={{
          fontSize: '1.1vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.muted,
          letterSpacing: '0.1em',
        }}>
          COINBASE TXID
        </div>
        {[0, 1].map(i => (
          <div
            key={i}
            className="hash-dup"
            style={{
              padding: '0.5vh 1.5vh',
              borderRadius: '0.3vh',
              background: i === 1 ? `${EP_COLORS.red}30` : `${EP_COLORS.steel}60`,
              border: `1px solid ${i === 1 ? EP_COLORS.red : EP_COLORS.steel}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.3vh',
              color: EP_COLORS.text,
              letterSpacing: '0.05em',
            }}
          >
            {hashSnippet} {i === 1 && <span style={{ color: EP_COLORS.red, fontWeight: 700 }}>← DUPLICATE</span>}
          </div>
        ))}
      </div>

      <div className="data-label" style={{
        fontSize: '1.2vh', fontFamily: 'var(--font-mono)', color: EP_COLORS.text,
        textAlign: 'center', opacity: active ? 1 : 0,
      }}>
        BIP 34 time bomb ~2046
      </div>
    </div>
  );
}

// ─── Main BugQuadrant Component ─────────────────────────────────

const ANIMATION_MAP: Record<BugId, React.FC<{ active: boolean; status: BugStatus }>> = {
  timewarp: TimewarpAnimation,
  validation: ValidationAnimation,
  merkle64: Merkle64Animation,
  coinbase: CoinbaseAnimation,
};

export default function BugQuadrant({ bug, status, scene, active = false }: BugQuadrantProps) {
  const Animation = ANIMATION_MAP[bug.id];

  const borderColor =
    status === 'dormant' ? EP_COLORS.steel :
    status === 'scanning' ? EP_COLORS.cyan :
    status === 'diagnosed' ? EP_COLORS.red :
    EP_COLORS.green;

  const severityColor =
    bug.severity === 'CRITICAL' ? EP_COLORS.red :
    bug.severity === 'HIGH' ? EP_COLORS.amber :
    EP_COLORS.cyan;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '1vh',
        border: `1px solid ${borderColor}`,
        background: EP_COLORS.panelBg,
        overflow: 'hidden',
        transition: 'border-color 0.5s ease',
        ['--pulse-color' as string]: status === 'diagnosed' ? `${EP_COLORS.red}20` : 'transparent',
        animation: status === 'diagnosed' ? 'panelPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      <style>{styles}</style>

      {/* Header strip */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5vh',
        borderBottom: `1px solid ${EP_COLORS.steel}40`,
        background: `${EP_COLORS.steel}20`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1vh' }}>
          <StatusDot status={status} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.3vh',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: status === 'dormant' ? EP_COLORS.dim : EP_COLORS.text,
            transition: 'color 0.5s ease',
          }}>
            {bug.label}
          </span>
        </div>

        {status !== 'dormant' && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1vh',
            fontWeight: 700,
            letterSpacing: '0.15em',
            padding: '0.3vh 0.8vh',
            borderRadius: '0.3vh',
            background: status === 'fixed' ? `${EP_COLORS.green}30` : `${severityColor}20`,
            color: status === 'fixed' ? EP_COLORS.green : severityColor,
            border: `1px solid ${status === 'fixed' ? EP_COLORS.green : severityColor}40`,
          }}>
            {status === 'fixed' ? 'PATCHED' : bug.severity}
          </span>
        )}
      </div>

      {/* Animation area */}
      <div style={{
        position: 'absolute',
        top: '4vh',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: status === 'dormant' ? 0.15 : 1,
        transition: 'opacity 0.6s ease',
      }}>
        <Animation active={active} status={status} />
      </div>
    </div>
  );
}
