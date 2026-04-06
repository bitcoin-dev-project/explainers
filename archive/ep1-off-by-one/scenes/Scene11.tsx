import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene11() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Let's do the math
      </motion.p>

      <div className="flex flex-col items-center gap-[3vh]">
        <motion.div
          className="text-[2.2vw] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span style={{ color: 'var(--color-error)' }}>2015</span> × 10 min ={' '}
          <span style={{ color: 'var(--color-error)' }}>20,150</span> min
        </motion.div>

        <motion.div
          className="text-[2.2vw] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, duration: 0.5 }}
        >
          vs
        </motion.div>

        <motion.div
          className="text-[2.2vw] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.8, duration: 0.5 }}
        >
          <span style={{ color: 'var(--color-secondary)' }}>2016</span> × 10 min ={' '}
          <span style={{ color: 'var(--color-secondary)' }}>20,160</span> min
        </motion.div>
      </div>

      <motion.div
        className="text-[2vw] font-bold mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 4.0, ...springs.snappy }}
      >
        A difference of <span style={{ color: 'var(--color-primary)' }}>10 minutes</span>
      </motion.div>
    </motion.div>
  );
}
