import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene4() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        This is an <span style={{ color: 'var(--color-secondary)' }}>AND</span> gate.
      </motion.p>

      {/* AND gate diagram */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, ...springs.snappy }}
      >
        <svg width="28vw" height="18vw" viewBox="0 0 420 270" fill="none">
          {/* Alice input line */}
          <motion.line
            x1="30" y1="90" x2="130" y2="90"
            stroke="var(--color-secondary)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3.0, duration: 0.4 }}
          />
          {/* Bob input line */}
          <motion.line
            x1="30" y1="180" x2="130" y2="180"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 4.0, duration: 0.4 }}
          />

          {/* AND gate shape */}
          <motion.path
            d="M130,50 L130,220 L220,220 A85,85 0 0,0 220,50 Z"
            fill="var(--color-bg-muted)"
            stroke="var(--color-text-primary)"
            strokeWidth="4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.0, duration: 0.4 }}
          />

          {/* AND label inside gate */}
          <motion.text
            x="195" y="145"
            textAnchor="middle"
            fill="var(--color-text-primary)"
            fontSize="28"
            fontWeight="bold"
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6.0 }}
          >
            AND
          </motion.text>

          {/* Output line */}
          <motion.line
            x1="305" y1="135" x2="390" y2="135"
            stroke="var(--color-text-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 7.0, duration: 0.4 }}
          />

          {/* Alice label */}
          <motion.text
            x="15" y="85"
            fill="var(--color-secondary)"
            fontSize="20"
            fontWeight="bold"
            fontFamily="var(--font-display)"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.0 }}
          >
            Alice
          </motion.text>

          {/* Bob label */}
          <motion.text
            x="25" y="200"
            fill="var(--color-primary)"
            fontSize="20"
            fontWeight="bold"
            fontFamily="var(--font-display)"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 4.0 }}
          >
            Bob
          </motion.text>

          {/* Output label */}
          <motion.text
            x="350" y="125"
            fill="var(--color-text-primary)"
            fontSize="18"
            fontWeight="bold"
            fontFamily="var(--font-display)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 7.0 }}
          >
            Output
          </motion.text>
        </svg>
      </motion.div>

      <motion.p
        className="text-[1.5vw] text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 8.0, duration: 0.5 }}
      >
        Output is <strong style={{ color: 'var(--color-text-primary)' }}>YES</strong> only when{' '}
        <span style={{ color: 'var(--color-secondary)' }}>both</span> inputs are{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>YES</strong>
      </motion.p>
    </motion.div>
  );
}
