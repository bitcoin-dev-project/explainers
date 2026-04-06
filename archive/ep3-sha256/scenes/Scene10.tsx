import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const LENGTH_BINARY = '0000000000000000000000000000000000000000000000000000000000111000';

export function Scene10() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[2.5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Step header */}
      <motion.h3
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Step 3: Add length
      </motion.h3>

      {/* Calculation */}
      <motion.div
        className="flex flex-col gap-[1.2vh] text-[1.2vw]"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.p
          style={{ color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          How we calculate length:
        </motion.p>

        <motion.div
          className="flex flex-col gap-[0.6vh] pl-[2vw] text-[1.1vw]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Message: </span>
            <span style={{ color: 'var(--color-text-primary)' }}>"bitcoin"</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Characters: </span>
            <span style={{ color: 'var(--color-text-primary)' }}>7</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Bits per char: </span>
            <span style={{ color: 'var(--color-text-primary)' }}>8</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.6 }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Total bits: 7 × 8 = </span>
            <motion.span
              className="font-bold text-[1.3vw]"
              initial={{ color: 'var(--color-text-primary)' }}
              animate={{ color: 'var(--color-primary)' }}
              transition={{ delay: 3.2, duration: 0.5 }}
            >
              56
            </motion.span>
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="text-[1.5vw]"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.8 }}
      >
        ↓
      </motion.div>

      {/* Convert to 64-bit binary */}
      <motion.p
        className="text-[1.1vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.2 }}
      >
        Convert <span className="font-bold" style={{ color: 'var(--color-primary)' }}>56</span> to 64-bit binary:
      </motion.p>

      <motion.div
        className="text-[0.9vw] max-w-[55vw] text-center leading-[1.6] px-[2vw] py-[1vh] rounded-[0.4vw]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'var(--color-bg-muted)',
          border: '0.15vw solid var(--color-text-muted)',
          wordBreak: 'break-all',
          color: '#2d8a4e',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.8, ...springs.snappy }}
      >
        {LENGTH_BINARY}
      </motion.div>
    </motion.div>
  );
}
