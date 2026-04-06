import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene11() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.h2
        className="text-[2.5vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        But we're not done yet...
      </motion.h2>

      <motion.p
        className="text-[2vw] font-bold mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        SHA-256 works in 512-bit blocks
      </motion.p>

      {/* Math breakdown */}
      <motion.div
        className="flex flex-col gap-[1.5vh] mt-[2vh] text-[1.3vw]"
        style={{ fontFamily: 'var(--font-mono)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        {/* Current total */}
        <motion.div
          className="flex items-center gap-[0.8vw]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.8 }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>Currently we have:</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-[0.5vw] pl-[2vw]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.2 }}
        >
          <span style={{ color: 'var(--color-primary)' }}>56</span>
          <span style={{ color: 'var(--color-text-muted)' }}>+</span>
          <span style={{ color: 'var(--color-primary)' }}>1</span>
          <span style={{ color: 'var(--color-text-muted)' }}>+</span>
          <span style={{ color: 'var(--color-primary)' }}>64</span>
          <span style={{ color: 'var(--color-text-muted)' }}>=</span>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>121</span>
        </motion.div>

        {/* Need */}
        <motion.div
          className="flex items-center gap-[0.5vw] pl-[2vw]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 4.0 }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>Need:</span>
          <span style={{ color: 'var(--color-text-primary)' }}>512 - 121</span>
          <span style={{ color: 'var(--color-text-muted)' }}>=</span>
          <motion.span
            className="font-bold text-[1.6vw]"
            style={{ color: 'var(--color-error)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 4.5, ...springs.bouncy }}
          >
            391 zero bits
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.p
        className="text-[1.3vw] mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.5 }}
      >
        So the rest 391 bits we add (Pad) with zeros before length
      </motion.p>
    </motion.div>
  );
}
