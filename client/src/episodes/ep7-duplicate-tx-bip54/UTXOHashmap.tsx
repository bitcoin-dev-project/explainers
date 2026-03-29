/**
 * UTXOHashmap — The Signature Visual for EP7
 *
 * A stylized key-value database visualization of Bitcoin's UTXO set.
 * Driven by GSAP timelines for the multi-step overwrite choreography.
 *
 * States: normal → highlighted → character-by-character match → overwrite → ghost
 *
 * This is the CORE visual. It does NOT use CE. All animation is GSAP + CSS.
 */

import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useSceneGSAP } from '@/lib/video';
import { EP_COLORS, SAMPLE_UTXOS, DUPLICATE_ENTRY, DUPLICATE_TXID_1 } from './constants';

interface UTXOHashmapProps {
  scene: number;
}

// ─── Sub-components ──────────────────────────────────────────────

/** Single UTXO row in the hashmap */
function UTXORow({
  txid,
  btc,
  className = '',
  style,
}: {
  txid: string;
  btc: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`utxo-row ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.2vh 2vw',
        borderRadius: '0.6vh',
        background: EP_COLORS.bgAlt,
        border: `1px solid ${EP_COLORS.muted}33`,
        fontFamily: 'var(--font-mono)',
        fontSize: '1.8vh',
        color: EP_COLORS.text,
        gap: '2vw',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* TXID column */}
      <span className="txid-col" style={{ opacity: 0.7, letterSpacing: '0.05em' }}>
        {txid}
      </span>
      {/* Separator */}
      <span style={{ color: EP_COLORS.muted, fontSize: '1.4vh' }}>→</span>
      {/* BTC value */}
      <span
        className="btc-col"
        style={{
          color: EP_COLORS.accent,
          fontWeight: 700,
          minWidth: '8vw',
          textAlign: 'right',
        }}
      >
        {btc} BTC
      </span>
    </div>
  );
}

// ─── Character-by-character TXID for the match sequence ──────────
function MatchableTXID({ fullTxid }: { fullTxid: string }) {
  // Show first 32 chars of the real TXID for the match animation
  const chars = fullTxid.slice(0, 32).split('');
  return (
    <span style={{ display: 'inline-flex', gap: 0 }}>
      {chars.map((c, i) => (
        <span
          key={i}
          className="match-char"
          style={{
            display: 'inline-block',
            width: '1.3vw',
            textAlign: 'center',
            padding: '0.2vh 0',
            borderRadius: '0.2vh',
            transition: 'background 0.1s, color 0.1s',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.6vh',
            color: EP_COLORS.text,
          }}
        >
          {c}
        </span>
      ))}
      <span style={{ color: EP_COLORS.muted, fontSize: '1.4vh' }}>...</span>
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function UTXOHashmap({ scene }: UTXOHashmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const duplicateRowRef = useRef<HTMLDivElement>(null);

  // The target row index (the one that gets overwritten)
  const targetIdx = 1; // Second entry in SAMPLE_UTXOS = the duplicate TXID

  // Determine visibility phases
  const showHashmap = scene >= 5; // Appears in Act 2
  const showDuplicate = scene >= 6; // Duplicate materializes
  const showMatch = scene >= 6; // Character match begins
  const isOverwritten = scene >= 7; // After overwrite
  const isGhost = scene >= 8; // Ghost state
  const showScanBeam = scene >= 10; // BIP 30 scan (scene 10 after merge)

  // ─── GSAP Scene Animations ──────────────────────────────────────
  useSceneGSAP(containerRef, scene, {
    // Scene 5: Hashmap rows stagger in
    5: (tl) => {
      tl.from('.utxo-row', {
        opacity: 0,
        x: -40,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power2.out',
      })
        .to(`.utxo-row:nth-child(${targetIdx + 1})`, {
          borderColor: EP_COLORS.accent,
          boxShadow: `0 0 20px ${EP_COLORS.accent}40, inset 0 0 10px ${EP_COLORS.accent}15`,
          duration: 0.6,
          ease: 'power2.inOut',
        }, '+=0.3');
    },

    // Scene 6: Duplicate slides in + character-by-character match
    6: (tl) => {
      tl.from('.duplicate-row', {
        x: 200,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
        .to('.match-char', {
          backgroundColor: EP_COLORS.match + '30',
          color: EP_COLORS.match,
          stagger: 0.04,
          duration: 0.08,
          ease: 'none',
        }, '+=0.2')
        .to('.match-label', {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.3');
    },

    // Scene 7: THE OVERWRITE — the impact moment
    7: (tl) => {
      // Both rows flash red
      tl.to(['.duplicate-row', `.utxo-row:nth-child(${targetIdx + 1})`], {
        borderColor: EP_COLORS.danger,
        boxShadow: `0 0 30px ${EP_COLORS.danger}60`,
        duration: 0.2,
        ease: 'power4.in',
      })
        // Duplicate stamps down onto original's position
        .to('.duplicate-row', {
          y: 0,
          scale: 1.05,
          duration: 0.1,
          ease: 'power4.in',
        })
        .to('.duplicate-row', {
          scale: 1,
          duration: 0.15,
          ease: 'elastic.out(1, 0.5)',
        })
        // Original row shatters — each child scatters
        .to('.target-row .txid-col', {
          x: () => gsap.utils.random(-120, -60),
          y: () => gsap.utils.random(-80, 80),
          rotation: gsap.utils.random(-30, 30),
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
        }, '-=0.1')
        .to('.target-row .btc-col', {
          x: () => gsap.utils.random(60, 120),
          y: () => gsap.utils.random(-60, 60),
          rotation: gsap.utils.random(-20, 20),
          scale: 0,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        }, '<')
        // Background flash
        .to('.hashmap-bg', {
          backgroundColor: EP_COLORS.danger + '15',
          duration: 0.15,
        }, '-=0.8')
        .to('.hashmap-bg', {
          backgroundColor: 'transparent',
          duration: 0.6,
        })
        // "50 BTC DESTROYED" label
        .from('.destroyed-label', {
          opacity: 0,
          scale: 1.5,
          duration: 0.4,
          ease: 'back.out(2)',
        }, '-=0.3');
    },

    // Scene 8: Ghost state — row becomes spectral
    8: (tl) => {
      tl.to('.target-row', {
        opacity: 0.15,
        filter: 'blur(2px)',
        duration: 1.0,
        ease: 'power2.inOut',
      })
        .to('.duplicate-row', {
          borderColor: EP_COLORS.ghost,
          boxShadow: 'none',
          opacity: 0.4,
          duration: 0.8,
        }, '<');
    },

    // Scene 10: BIP 30 scan beam sweeps across (merged with transition)
    10: (tl) => {
      tl.from('.scan-beam', {
        x: '-100%',
        duration: 2.0,
        ease: 'power1.inOut',
      })
        .to('.scan-beam', {
          x: '100%',
          duration: 2.0,
          ease: 'power1.inOut',
        });
    },
  });

  // ─── CSS @keyframes for ambient glow on highlighted row ─────────
  const glowKeyframes = `
    @keyframes utxo-glow {
      0%, 100% { box-shadow: 0 0 15px ${EP_COLORS.accent}30; }
      50% { box-shadow: 0 0 25px ${EP_COLORS.accent}50, 0 0 40px ${EP_COLORS.accent}20; }
    }
    @keyframes ghost-flicker {
      0%, 100% { opacity: 0.12; }
      50% { opacity: 0.18; }
    }
  `;

  if (!showHashmap) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '105vw',
        top: '10vh',
        width: '80vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2vh',
        padding: '3vh 3vw',
      }}
    >
      <style>{glowKeyframes}</style>

      {/* Background panel */}
      <div
        className="hashmap-bg"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5vh',
          border: `1px solid ${EP_COLORS.muted}22`,
          background: `linear-gradient(180deg, ${EP_COLORS.bgAlt}80, ${EP_COLORS.bg}90)`,
          backdropFilter: 'blur(20px)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '1vw',
          marginBottom: '1vh',
          padding: '0 1vw',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.4vh',
            fontWeight: 700,
            color: EP_COLORS.text,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          UTXO Set
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4vh',
            color: EP_COLORS.muted,
          }}
        >
          chainstate/
        </span>
      </div>

      {/* Column headers */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.5vh 2vw',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.3vh',
          color: EP_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}
      >
        <span>TXID (key)</span>
        <span>Value</span>
      </div>

      {/* UTXO Rows */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
        {SAMPLE_UTXOS.map((entry, i) => (
          <div
            key={i}
            className={i === targetIdx ? 'utxo-row target-row' : 'utxo-row'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.2vh 2vw',
              borderRadius: '0.6vh',
              background: EP_COLORS.bgAlt,
              border: `1px solid ${EP_COLORS.muted}33`,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.8vh',
              color: EP_COLORS.text,
              gap: '2vw',
              position: 'relative',
              overflow: 'hidden',
              ...(i === targetIdx && scene >= 5 && scene < 7
                ? { animation: 'utxo-glow 2s ease-in-out infinite' }
                : {}),
              ...(isGhost && i === targetIdx
                ? { animation: 'ghost-flicker 3s ease-in-out infinite' }
                : {}),
            }}
          >
            <span className="txid-col" style={{ opacity: i === targetIdx ? 1 : 0.6, letterSpacing: '0.05em' }}>
              {i === targetIdx && showMatch ? (
                <MatchableTXID fullTxid={DUPLICATE_TXID_1} />
              ) : (
                entry.txid
              )}
            </span>
            <span style={{ color: EP_COLORS.muted, fontSize: '1.4vh' }}>→</span>
            <span
              className="btc-col"
              style={{
                color: i === targetIdx ? EP_COLORS.accent : EP_COLORS.text,
                fontWeight: i === targetIdx ? 700 : 400,
                minWidth: '8vw',
                textAlign: 'right',
              }}
            >
              {entry.btc} BTC
            </span>
          </div>
        ))}

        {/* BIP 30 scan beam */}
        {showScanBeam && (
          <div
            className="scan-beam"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3vw',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${EP_COLORS.fix}40, ${EP_COLORS.fix}60, ${EP_COLORS.fix}40, transparent)`,
              borderRadius: '2vw',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Duplicate row — slides in from right during scene 6 */}
      {showDuplicate && scene < 9 && (
        <div
          ref={duplicateRowRef}
          className="duplicate-row"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2vh 2vw',
            borderRadius: '0.6vh',
            background: EP_COLORS.danger + '18',
            border: `2px solid ${EP_COLORS.danger}60`,
            fontFamily: 'var(--font-mono)',
            fontSize: '1.8vh',
            color: EP_COLORS.text,
            gap: '2vw',
            marginTop: '2vh',
          }}
        >
          <span style={{ letterSpacing: '0.05em' }}>
            <MatchableTXID fullTxid={DUPLICATE_TXID_1} />
          </span>
          <span style={{ color: EP_COLORS.muted, fontSize: '1.4vh' }}>→</span>
          <span style={{ color: EP_COLORS.danger, fontWeight: 700, minWidth: '8vw', textAlign: 'right' }}>
            50 BTC
          </span>

          {/* "DUPLICATE" badge */}
          <span
            style={{
              position: 'absolute',
              right: '-1vw',
              top: '-1.5vh',
              background: EP_COLORS.danger,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '1.1vh',
              fontWeight: 700,
              padding: '0.3vh 0.8vw',
              borderRadius: '0.4vh',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Duplicate
          </span>
        </div>
      )}

      {/* Match confirmation label */}
      {showMatch && scene < 7 && (
        <div
          className="match-label"
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '1.8vh',
            color: EP_COLORS.match,
            marginTop: '1vh',
            opacity: 0,
            transform: 'translateY(10px)',
          }}
        >
          TXID MATCH — SAME KEY
        </div>
      )}

      {/* "50 BTC DESTROYED" label — appears during overwrite */}
      {scene >= 7 && scene < 9 && (
        <div
          className="destroyed-label"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            fontFamily: 'var(--font-display)',
            fontSize: '4vh',
            fontWeight: 800,
            color: EP_COLORS.danger,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textShadow: `0 0 30px ${EP_COLORS.danger}80, 0 0 60px ${EP_COLORS.danger}40`,
            whiteSpace: 'nowrap',
          }}
        >
          50 BTC Destroyed
        </div>
      )}
    </div>
  );
}
