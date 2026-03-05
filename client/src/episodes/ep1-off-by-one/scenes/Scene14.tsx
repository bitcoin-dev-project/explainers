import { motion } from 'framer-motion';
import { useState } from 'react';
import { sceneTransitions, springs } from '@/lib/video/animations';
import { useSceneTimer } from '@/lib/video';

export function Scene14() {
  const [revealed, setRevealed] = useState(false);

  useSceneTimer([
    { time: 3000, callback: () => setRevealed(true) },
  ]);

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
        Remember our question?
      </motion.p>

      <motion.h2
        className="text-[2.8vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        How long is a retarget period?
      </motion.h2>

      <div className="flex flex-col gap-[2vh] w-[40vw] mt-[2vh]">
        {/* Option A */}
        <motion.div
          className="rounded-[0.5vw] px-[2vw] py-[1.5vh] flex items-center gap-[1vw]"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
            opacity: revealed ? 0.4 : 1,
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: revealed ? 0.4 : 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
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
          className="rounded-[0.5vw] px-[2vw] py-[1.5vh] flex items-center gap-[1vw] relative"
          style={{
            backgroundColor: revealed ? 'var(--color-primary)' : 'var(--color-bg-muted)',
            border: revealed ? '0.25vw solid var(--color-text-primary)' : '0.2vw solid var(--color-text-primary)',
            boxShadow: revealed ? '0.3vw 0.3vw 0 var(--color-text-primary)' : 'none',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
        >
          <div
            className="w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center text-[1.2vw] font-bold flex-shrink-0"
            style={{
              border: '0.2vw solid var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              backgroundColor: revealed ? 'var(--color-text-primary)' : 'transparent',
              color: revealed ? 'var(--color-primary)' : 'var(--color-text-primary)',
            }}
          >
            B
          </div>
          <span className="text-[1.6vw] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            2 weeks minus 10 minutes
          </span>

          {revealed && (
            <motion.span
              className="absolute right-[1.5vw] text-[2vw] font-bold"
              style={{ color: 'var(--color-text-primary)' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.bouncy}
            >
              ✓
            </motion.span>
          )}
        </motion.div>
      </div>

      {revealed && (
        <motion.p
          className="text-[1.3vw]"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          2015 × 10 = 20,150 min = 13 days 23h 50m
        </motion.p>
      )}
    </motion.div>
  );
}
