import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const MESSAGE_BITS_LINE1 = '01100010011010010111010001100011';
const MESSAGE_BITS_LINE2 = '011011110110100101101110';
const ZERO_ROW = '00000000000000000000000000000000';
const LENGTH_LINE1 = '00000000000000000000000000000000';
const LENGTH_LINE2 = '00000000000000000000000000111000';

export function Scene12() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[1.5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.3vw] font-bold mb-[1vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Complete 512-bit padded message:
      </motion.p>

      {/* Padded message visualization */}
      <motion.div
        className="flex items-start gap-[1.5vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Binary content */}
        <div
          className="text-[0.75vw] leading-[2] px-[1.5vw] py-[1vh] rounded-[0.4vw]"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.15vw solid var(--color-text-muted)',
          }}
        >
          {/* Message bits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span style={{ color: 'var(--color-text-primary)' }}>{MESSAGE_BITS_LINE1}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <span style={{ color: 'var(--color-text-primary)' }}>{MESSAGE_BITS_LINE2}</span>
            {/* "1" marker */}
            <motion.span
              className="font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, color: 'var(--color-primary)' }}
              transition={{ delay: 2.2, duration: 0.5 }}
            >
              1
            </motion.span>
          </motion.div>

          {/* Zero padding rows: 12 full rows of 32 + 7 remaining = 391 zeros */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0 + i * 0.1 }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>{ZERO_ROW}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.2 }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>0000000</span>
          </motion.div>

          {/* Length */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.0 }}
          >
            <span style={{ color: '#2d8a4e' }}>{LENGTH_LINE1}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.3 }}
          >
            <span style={{ color: '#2d8a4e' }}>{LENGTH_LINE2}</span>
          </motion.div>
        </div>

        {/* Labels on the right */}
        <div className="flex flex-col text-[0.9vw] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
          <motion.div
            className="flex items-center gap-[0.5vw]"
            style={{ marginTop: '0.5vh' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
          >
            <span style={{ color: 'var(--color-text-primary)' }}>Message</span>
            <span style={{ color: 'var(--color-text-muted)' }}>56</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-[0.5vw]"
            style={{ marginTop: '1.8vh' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5 }}
          >
            <span style={{ color: 'var(--color-primary)' }}>"1" marker</span>
            <span style={{ color: 'var(--color-text-muted)' }}>1</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-[0.5vw]"
            style={{ marginTop: '8vh' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 4.5 }}
          >
            <span style={{ color: 'var(--color-error)' }}>zeros</span>
            <motion.span
              className="font-bold"
              style={{ color: 'var(--color-error)' }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 4.8, ...springs.snappy }}
            >
              391
            </motion.span>
          </motion.div>

          <motion.div
            className="flex items-center gap-[0.5vw]"
            style={{ marginTop: '4vh' }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 5.5 }}
          >
            <span style={{ color: '#2d8a4e' }}>length</span>
            <span style={{ color: 'var(--color-text-muted)' }}>64</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
