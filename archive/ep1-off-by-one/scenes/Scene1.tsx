import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene1() {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-primary)' }}
      {...sceneTransitions.fadeBlur}
    >
      <div className="flex flex-col items-center gap-[2vh]">
        <motion.h1
          className="text-[7vw] font-bold leading-[1] text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, ...springs.snappy }}
        >
          Satoshi's<br />Off-By-One<br />Error
        </motion.h1>
      </div>
    </motion.div>
  );
}
