import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene13() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Every epoch loses 10 minutes
      </motion.p>

      {/* Simple fraction */}
      <motion.div
        className="flex flex-col items-center gap-[1vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <motion.div
          className="text-[2vw] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <span style={{ color: 'var(--color-error)' }}>10</span> min missing out of <span style={{ color: 'var(--color-primary)' }}>20,160</span> min
        </motion.div>
      </motion.div>

      {/* Arrow down */}
      <motion.div
        className="text-[2vw]"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        ↓
      </motion.div>

      {/* Big percentage */}
      <motion.div
        className="text-[8vw] font-bold leading-none"
        style={{ color: 'var(--color-error)', fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.0, ...springs.bouncy }}
      >
        +0.05%
      </motion.div>

      <motion.h2
        className="text-[2.2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.5 }}
      >
        Upward Difficulty Bias
      </motion.h2>

      <motion.p
        className="text-[1.2vw]"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.5 }}
      >
        Difficulty is pushed slightly higher every 2 weeks
      </motion.p>
    </motion.div>
  );
}
