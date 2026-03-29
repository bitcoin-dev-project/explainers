/**
 * StatusBar — Console header and footer with scene-aware messages.
 *
 * Top: "PROTOCOL DIAGNOSTIC v54 — BITCOIN CONSENSUS AUDIT"
 * Bottom: scene-driven status text with blinking cursor.
 * JetBrains Mono, cyan on navy.
 */

import { useEffect, useState } from 'react';
import { EP_COLORS } from './constants';

const styles = `
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

/** Maps scene index → status message */
const STATUS_MESSAGES: Record<number, { text: string; color: string }> = {
  0: { text: 'INITIALIZING PROTOCOL SCAN...', color: EP_COLORS.cyan },
  1: { text: 'SCANNING CONSENSUS RULES...', color: EP_COLORS.cyan },
  2: { text: 'ANALYZING: TIMEWARP ATTACK', color: EP_COLORS.red },
  3: { text: 'ANALYZING: BLOCK VALIDATION DoS', color: EP_COLORS.red },
  4: { text: 'ANALYZING: MERKLE TREE AMBIGUITY', color: EP_COLORS.red },
  5: { text: 'ANALYZING: COINBASE UNIQUENESS', color: EP_COLORS.red },
  6: { text: '4 VULNERABILITIES DETECTED', color: EP_COLORS.red },
  7: { text: 'REVIEWING PROPOSAL HISTORY...', color: EP_COLORS.cyan },
  8: { text: 'BIP 54 STATUS: STALLED (2019-2024)', color: EP_COLORS.muted },
  9: { text: 'ALERT: NEW VARIANT DISCOVERED', color: EP_COLORS.amber },
  10: { text: '⚠ MURCH-ZAWY TIMEWARP VARIANT', color: EP_COLORS.amber },
  11: { text: 'ALL VULNERABILITIES PATCHED ✓', color: EP_COLORS.green },
  12: { text: 'PROTOCOL AUDIT COMPLETE — BIP 54', color: EP_COLORS.green },
};

interface StatusBarProps {
  scene: number;
  /** Controls visibility during boot */
  visible?: boolean;
}

export default function StatusBar({ scene, visible = true }: StatusBarProps) {
  const [displayText, setDisplayText] = useState('');
  const status = STATUS_MESSAGES[scene] ?? STATUS_MESSAGES[0];

  // Typewriter effect for status messages
  useEffect(() => {
    if (!visible) {
      setDisplayText('');
      return;
    }
    setDisplayText('');
    const target = status.text;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(target.slice(0, i));
      if (i >= target.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [scene, visible, status.text]);

  return (
    <>
      <style>{styles}</style>

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2vw',
          background: `linear-gradient(180deg, ${EP_COLORS.steel}40 0%, transparent 100%)`,
          borderBottom: `1px solid ${EP_COLORS.steel}60`,
          fontFamily: 'var(--font-mono)',
          fontSize: '1.4vh',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: EP_COLORS.cyan,
          opacity: visible ? 0.9 : 0,
          transition: 'opacity 0.6s ease',
          zIndex: 40,
        }}
      >
        <span>Protocol Diagnostic v54</span>
        <span style={{ color: EP_COLORS.muted }}>Bitcoin Consensus Audit</span>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4.5vh',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2vw',
          background: `linear-gradient(0deg, ${EP_COLORS.steel}40 0%, transparent 100%)`,
          borderTop: `1px solid ${EP_COLORS.steel}60`,
          fontFamily: 'var(--font-mono)',
          fontSize: '1.5vh',
          letterSpacing: '0.1em',
          color: status.color,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease, color 0.4s ease',
          zIndex: 40,
        }}
      >
        <span style={{ marginRight: '1vw', opacity: 0.5 }}>{'>'}</span>
        <span>{displayText}</span>
        <span
          style={{
            display: 'inline-block',
            width: '0.7vh',
            height: '1.6vh',
            marginLeft: '0.3vw',
            background: status.color,
            animation: 'cursorBlink 1s step-end infinite',
          }}
        />
      </div>
    </>
  );
}
