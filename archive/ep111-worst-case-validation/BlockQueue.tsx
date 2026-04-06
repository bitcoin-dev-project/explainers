/**
 * BlockQueue — stalled block silhouettes during network meltdown.
 * Three blocks queue up from the right, pulsing dimly with a "Waiting..." label.
 */

import { motion } from 'framer-motion';
import { EP_COLORS } from './constants';

const BLOCKS = [
  { id: 841204, delay: 0 },
  { id: 841205, delay: 0.3 },
  { id: 841206, delay: 0.6 },
];

export default function BlockQueue({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2vh',
        alignItems: 'center',
        ...style,
      }}
    >
      {BLOCKS.map((b) => (
        <motion.div
          key={b.id}
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 0.4 }}
          transition={{
            delay: b.delay,
            type: 'spring',
            stiffness: 200,
            damping: 25,
          }}
          style={{
            width: '6vw',
            height: '4vh',
            borderRadius: '0.4vw',
            border: `1px solid ${EP_COLORS.textMuted}`,
            background: EP_COLORS.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65vw',
            color: EP_COLORS.textMuted,
          }}
        >
          #{b.id}
        </motion.div>
      ))}
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8vw',
          color: EP_COLORS.textMuted,
          marginTop: '0.3vh',
        }}
      >
        Waiting...
      </motion.div>
    </div>
  );
}
