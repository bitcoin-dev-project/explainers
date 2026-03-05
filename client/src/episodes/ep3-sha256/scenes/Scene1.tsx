import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene1() {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center relative"
      style={{ backgroundColor: 'var(--color-primary)' }}
      {...sceneTransitions.fadeBlur}
    >
      {/* Part 1 badge */}
      <motion.div
        className="absolute top-[4vh] left-[3vw] px-[1.2vw] py-[0.6vh] rounded-[0.3vw] text-[1.2vw] font-bold"
        style={{
          backgroundColor: 'rgba(0,0,0,0.15)',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          border: '0.15vw solid rgba(255,255,255,0.3)',
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Part 1
      </motion.div>

      <div className="flex flex-col items-center gap-[2vh]">
        <motion.h1
          className="text-[7vw] font-bold leading-[1] text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, ...springs.snappy }}
        >
          SHA-256
        </motion.h1>
        <motion.h2
          className="text-[3.5vw] font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Padding
        </motion.h2>
      </div>
    </motion.div>
  );
}
