import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene15() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] relative overflow-hidden"
      style={{ backgroundColor: '#1C1C1C' }}
      {...sceneTransitions.fadeBlur}
    >
      {/* Subtle grid */}
      <motion.div className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(241,118,13,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(241,118,13,0.04) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />

      <div className="relative z-10 flex flex-col items-center gap-[3vh]">
        {/* Bob */}
        <motion.img
          src="/bob.png"
          alt="Bob"
          className="w-[10vw] h-[10vw] object-contain"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springs.snappy }}
        />

        {/* Teaser */}
        <motion.p
          className="text-[2.2vw] font-bold text-center leading-[1.4] max-w-[40vw]"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, ...springs.snappy }}
        >
          Next up: how{' '}
          <span style={{ color: 'var(--color-secondary)' }}>BitVM</span>{' '}
          uses garbled circuits on Bitcoin.
        </motion.p>

        <motion.div className="h-[0.2vh] w-[6vw] rounded-full"
          style={{ backgroundColor: 'var(--color-secondary)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 5.0, duration: 0.6, ease: 'circOut' }} />

        {/* CTA */}
        <motion.p
          className="text-[1.6vw] font-bold text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 7.0, duration: 0.5 }}
        >
          Follow @bitcoin_devs
        </motion.p>
      </div>
    </motion.div>
  );
}
