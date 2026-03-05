import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene4() {
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
        Quick question...
      </motion.p>

      <motion.h2
        className="text-[2.8vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        How long does a retarget period take?
      </motion.h2>

      <div className="flex flex-col gap-[2vh] w-[40vw] mt-[2vh]">
        {/* Option A */}
        <motion.div
          className="rounded-[0.5vw] px-[2vw] py-[1.5vh] flex items-center gap-[1vw]"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div
            className="w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center text-[1.2vw] font-bold flex-shrink-0"
            style={{ border: '0.2vw solid var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            A
          </div>
          <span className="text-[1.6vw] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Exactly 2 weeks
          </span>
        </motion.div>

        {/* Option B */}
        <motion.div
          className="rounded-[0.5vw] px-[2vw] py-[1.5vh] flex items-center gap-[1vw]"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, duration: 0.5 }}
        >
          <div
            className="w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center text-[1.2vw] font-bold flex-shrink-0"
            style={{ border: '0.2vw solid var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            B
          </div>
          <span className="text-[1.6vw] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            2 weeks minus 10 minutes
          </span>
        </motion.div>
      </div>

      <motion.p
        className="text-[1.6vw] italic mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
      >
        Let's find out...
      </motion.p>
    </motion.div>
  );
}
