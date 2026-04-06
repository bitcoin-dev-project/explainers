import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene7() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
      style={{ backgroundColor: '#1C1C1C' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[1.6vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)' }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        What if we could compute the answer...
      </motion.p>

      <motion.p
        className="text-[2.6vw] font-bold text-center leading-[1.3]"
        style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.9, ...springs.snappy }}
      >
        ...without <span style={{ color: 'var(--color-secondary)' }}>either side</span> seeing the inputs?
      </motion.p>
    </motion.div>
  );
}
