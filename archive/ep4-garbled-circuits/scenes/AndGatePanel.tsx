import { motion } from 'framer-motion';

interface AndGatePanelProps {
  /** Small label on Alice's wire (e.g. "0/1", "Ka₀ / Ka₁") */
  aliceLabel?: string;
  /** Small label on Bob's wire */
  bobLabel?: string;
  /** Show "Garbler" / "Evaluator" under names */
  showRoles?: boolean;
  /** Current step badge (1–5) */
  step?: number;
  /** Content rendered below the gate (mini truth table, etc.) */
  children?: React.ReactNode;
}

export function AndGatePanel({ aliceLabel, bobLabel, showRoles, step, children }: AndGatePanelProps) {
  return (
    <div
      className="w-[30vw] h-full flex flex-col items-center justify-center gap-[2vh] shrink-0"
      style={{ borderLeft: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#ECD4B5' }}
    >
      {/* Step badge */}
      {step != null && (
        <div
          className="px-[1vw] py-[0.4vh] rounded-full text-[0.85vw] font-bold"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
        >
          Step {step}
        </div>
      )}

      {/* AND Gate SVG */}
      <svg viewBox="0 0 300 220" width="22vw" style={{ overflow: 'visible' }}>
        {/* ── Alice ── */}
        <text
          x="8" y="55"
          fill="var(--color-secondary)"
          fontSize="16"
          fontWeight="bold"
          fontFamily="var(--font-display)"
        >
          Alice
        </text>
        {showRoles && (
          <text
            x="8" y="72"
            fill="var(--color-text-muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            Garbler
          </text>
        )}

        {/* Alice wire */}
        <line
          x1="65" y1="80" x2="100" y2="80"
          stroke="var(--color-secondary)" strokeWidth="3.5" strokeLinecap="round"
        />

        {/* Alice wire label */}
        {aliceLabel && (
          <text
            x="10" y="95"
            fill="var(--color-secondary)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fontWeight="bold"
          >
            {aliceLabel}
          </text>
        )}

        {/* ── Bob ── */}
        <text
          x="18" y="150"
          fill="var(--color-primary)"
          fontSize="16"
          fontWeight="bold"
          fontFamily="var(--font-display)"
        >
          Bob
        </text>
        {showRoles && (
          <text
            x="8" y="167"
            fill="var(--color-text-muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            Evaluator
          </text>
        )}

        {/* Bob wire */}
        <line
          x1="65" y1="145" x2="100" y2="145"
          stroke="var(--color-primary)" strokeWidth="3.5" strokeLinecap="round"
        />

        {/* Bob wire label */}
        {bobLabel && (
          <text
            x="10" y="185"
            fill="var(--color-primary)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fontWeight="bold"
          >
            {bobLabel}
          </text>
        )}

        {/* ── Gate body ── */}
        <path
          d="M100,25 L100,200 L170,200 A87.5,87.5 0 0,0 170,25 Z"
          fill="var(--color-bg-muted)"
          stroke="var(--color-text-primary)"
          strokeWidth="3"
        />

        {/* AND label */}
        <text
          x="158" y="118"
          textAnchor="middle"
          fill="var(--color-text-primary)"
          fontSize="22"
          fontWeight="bold"
          fontFamily="var(--font-mono)"
        >
          AND
        </text>

        {/* ── Output wire ── */}
        <line
          x1="257" y1="112" x2="295" y2="112"
          stroke="var(--color-text-primary)" strokeWidth="3.5" strokeLinecap="round"
        />
        <text
          x="268" y="100"
          fill="var(--color-text-muted)"
          fontSize="12"
          fontFamily="var(--font-display)"
          fontWeight="bold"
        >
          Out
        </text>
      </svg>

      {/* Slot for content below the gate (mini truth table, etc.) */}
      {children && <div className="w-[24vw]">{children}</div>}
    </div>
  );
}

/* ── Tiny reusable mini truth-table shown below the gate ── */
export interface MiniRow {
  a: string;
  b: string;
  out: string;
  highlight?: boolean;
  encrypted?: boolean;
  dimmed?: boolean;
}

export function MiniTruthTable({ rows, delay = 0 }: { rows: MiniRow[]; delay?: number }) {
  return (
    <div className="flex flex-col gap-[0.4vh]">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-[0.4vw] px-[0.6vw] py-[0.35vh] rounded-[0.2vw] text-[0.8vw] font-bold"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: r.highlight
              ? 'rgba(111,125,193,0.14)'
              : 'rgba(0,0,0,0.04)',
            border: r.highlight ? '1px solid var(--color-secondary)' : '1px solid transparent',
            opacity: r.dimmed ? 0.35 : 1,
          }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: r.dimmed ? 0.35 : 1, x: 0 }}
          transition={{ delay: delay + i * 0.15 }}
        >
          <span style={{ color: 'var(--color-secondary)', width: '3.5vw', display: 'inline-block' }}>{r.a}</span>
          <span style={{ color: 'var(--color-primary)', width: '3.5vw', display: 'inline-block' }}>{r.b}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>→</span>
          {r.encrypted && (
            <svg width="0.8vw" height="1vw" viewBox="0 0 14 18" fill="none" style={{ flexShrink: 0 }}>
              <rect x="1" y="7" width="12" height="10" rx="2" fill={r.highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)'} />
              <path d="M4,7 V5 A3,3 0 0,1 10,5 V7" stroke={r.highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)'} strokeWidth="1.5" fill="none" />
            </svg>
          )}
          <span style={{ color: r.highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>{r.out}</span>
        </motion.div>
      ))}
    </div>
  );
}
