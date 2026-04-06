import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene15() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-primary)' }}
      {...sceneTransitions.fadeBlur}
    >
      {/* Next post teaser */}
      <motion.p
        className="text-[1.4vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.7)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Next post
      </motion.p>

      <motion.h2
        className="text-[2.5vw] font-bold text-center leading-tight max-w-[50vw]"
        style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        How the Consensus Cleanup soft fork<br />
        fixes the TimeWarp Attack
      </motion.h2>

      {/* Divider */}
      <motion.div
        className="w-[8vw] h-[0.25vw] rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2.0, duration: 0.5 }}
      />

      {/* Follow CTA */}
      <motion.div
        className="flex flex-col items-center gap-[1.5vh]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        <motion.div
          className="px-[2.5vw] py-[1.5vh] rounded-[0.5vw] text-[2vw] font-bold"
          style={{
            backgroundColor: '#fff',
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-display)',
            boxShadow: '0.3vw 0.3vw 0 rgba(0,0,0,0.15)',
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2.8, ...springs.bouncy }}
        >
          Follow @bitcoin_devs
        </motion.div>

        <motion.p
          className="text-[1.2vw]"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          for more Bitcoin technical breakdowns
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
