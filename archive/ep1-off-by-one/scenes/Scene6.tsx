import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene6() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.h2
        className="text-[3.2vw] font-bold text-center leading-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        But is it <span style={{ color: 'var(--color-error)' }}>really</span> 14 days?
      </motion.h2>

      <motion.p
        className="text-[1.8vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Let's look at how Bitcoin measures time...
      </motion.p>
    </motion.div>
  );
}
