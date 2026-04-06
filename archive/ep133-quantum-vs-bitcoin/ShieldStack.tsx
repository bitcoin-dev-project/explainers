import { motion } from 'framer-motion';
import { EP_COLORS, EP_SPRINGS } from './constants';

interface ShieldItem {
  icon: string;
  text: string;
  sub?: string;
  urgent?: boolean;
}

const SHIELDS: ShieldItem[] = [
  { icon: '↻', text: '1. Stop reusing addresses' },
  { icon: '⚠', text: '2. Avoid P2TR for large holdings', sub: '(Taproot re-exposes your key)' },
  { icon: '✓', text: '3. Use P2WPKH (SegWit)' },
  { icon: '→', text: '4. Prepare for PQC migration (BIP-360)', urgent: true },
];

interface ShieldStackProps {
  /** How many shields are visible (0-4) */
  visible: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Mitigation steps stacking from bottom.
 * Each shield slides in with resolveEnter spring.
 */
export default function ShieldStack({
  visible,
  className,
  style,
}: ShieldStackProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        alignItems: 'center',
        ...style,
      }}
    >
      {SHIELDS.slice(0, visible).map((shield, i) => (
        <motion.div
          key={shield.text}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...EP_SPRINGS.resolveEnter,
            delay: i * 0.3,
          }}
          style={{
            background: EP_COLORS.bgPanel,
            borderLeft: `3px solid ${shield.urgent ? EP_COLORS.accent : EP_COLORS.safe}`,
            padding: '16px 24px',
            borderRadius: '6px',
            width: '520px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: shield.urgent ? EP_COLORS.accent : EP_COLORS.safe,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {shield.icon}
          </span>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
                color: shield.urgent ? EP_COLORS.accent : EP_COLORS.text,
              }}
            >
              {shield.text}
            </div>
            {shield.sub && (
              <div
                style={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontSize: 12,
                  color: EP_COLORS.textMuted,
                  marginTop: 4,
                }}
              >
                {shield.sub}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
