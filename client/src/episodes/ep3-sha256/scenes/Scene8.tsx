import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const ASCII_TABLE = [
  { char: 'b', dec: 98, bin: '01100010' },
  { char: 'i', dec: 105, bin: '01101001' },
  { char: 't', dec: 116, bin: '01110100' },
  { char: 'c', dec: 99, bin: '01100011' },
  { char: 'o', dec: 111, bin: '01101111' },
  { char: 'i', dec: 105, bin: '01101001' },
  { char: 'n', dec: 110, bin: '01101110' },
];

const CONCATENATED = '01100010011010010111010001100011011011110110100101101110';

export function Scene8() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3vh]"
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
        Step 1:
      </motion.h3>

      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Convert each character to its 8-bit ASCII value
      </motion.p>

      {/* ASCII table */}
      <motion.div
        className="flex flex-col gap-[0.8vh] mt-[1vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {ASCII_TABLE.map((row, i) => (
          <motion.div
            key={row.char + i}
            className="flex items-center gap-[1.5vw] text-[1.2vw]"
            style={{ fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.4, duration: 0.3 }}
          >
            <span className="w-[2vw] text-right font-bold" style={{ color: 'var(--color-primary)' }}>
              '{row.char}'
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            <span className="w-[3vw] text-center" style={{ color: 'var(--color-text-primary)' }}>
              {row.dec}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{row.bin}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Concatenation label */}
      <motion.p
        className="text-[1.3vw] mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.0 }}
      >
        Concatenate the bytes
      </motion.p>

      {/* Concatenated binary string */}
      <motion.div
        className="text-[1vw] max-w-[60vw] text-center leading-[1.6] px-[2vw] py-[1.5vh] rounded-[0.4vw]"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
          backgroundColor: 'var(--color-bg-muted)',
          border: '0.15vw solid var(--color-text-muted)',
          wordBreak: 'break-all',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5.8, duration: 0.5 }}
      >
        {CONCATENATED}
      </motion.div>
    </motion.div>
  );
}
