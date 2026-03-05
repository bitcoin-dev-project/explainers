import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene7() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.p
        className="text-[1.8vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Let's take this input text and hash it
      </motion.p>

      <motion.h2
        className="text-[5vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0, ...springs.bouncy }}
      >
        <span style={{ color: 'var(--color-text-muted)' }}>"</span>
        bitcoin
        <span style={{ color: 'var(--color-text-muted)' }}>"</span>
      </motion.h2>
    </motion.div>
  );
}
