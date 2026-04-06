import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene3() {
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
        This cycle of 2016 blocks is called
      </motion.p>

      <motion.h2
        className="text-[3.5vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0, ...springs.bouncy }}
      >
        A Retarget Period
      </motion.h2>

      {/* Visual: simple block range */}
      <motion.div
        className="flex items-center gap-[1vw] mt-[2vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
      >
        <motion.div
          className="px-[1.2vw] py-[0.8vh] rounded-[0.3vw] text-[1.2vw] font-bold"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
            boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2 }}
        >
          Block 0
        </motion.div>

        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <div className="w-[2vw] h-[0.25vw]" style={{ backgroundColor: 'var(--color-primary)' }} />
          <span className="text-[1.2vw] mx-[0.5vw] font-bold" style={{ color: 'var(--color-text-muted)' }}>···</span>
          <div className="w-[2vw] h-[0.25vw]" style={{ backgroundColor: 'var(--color-primary)' }} />
        </motion.div>

        <motion.div
          className="px-[1.2vw] py-[0.8vh] rounded-[0.3vw] text-[1.2vw] font-bold"
          style={{
            backgroundColor: 'var(--color-primary)',
            border: '0.2vw solid var(--color-text-primary)',
            boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            color: '#fff',
          }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.8 }}
        >
          Block 2015
        </motion.div>
      </motion.div>

      {/* Brace with 2016 blocks label */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
      >
        <svg width="25vw" height="2.5vh" viewBox="0 0 250 25" fill="none" style={{ overflow: 'visible' }}>
          <motion.path
            d="M 10 5 Q 10 20, 125 20 Q 240 20, 240 5"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3.6, duration: 0.5, ease: 'circOut' }}
          />
        </svg>
        <motion.span
          className="text-[1.4vw] font-bold mt-[0.5vh]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2 }}
        >
          2016 blocks
        </motion.span>
      </motion.div>

      <motion.p
        className="text-[1.3vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.0 }}
      >
        But how long should this take?
      </motion.p>
    </motion.div>
  );
}
