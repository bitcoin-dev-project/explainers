import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene12() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Converting to days
      </motion.p>

      {/* Side by side cards */}
      <div className="flex items-stretch gap-[3vw]">
        {/* Measured card */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh] px-[2.5vw] py-[2.5vh] rounded-[0.5vw]"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
            boxShadow: '0.25vw 0.25vw 0 var(--color-text-primary)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span className="text-[1.1vw] font-bold uppercase tracking-[0.1vw]" style={{ color: 'var(--color-text-muted)' }}>
            Measured
          </span>
          <span className="text-[1.2vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            2015 × 10 min
          </span>
          <motion.span
            className="text-[3.5vw] font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-error)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, ...springs.snappy }}
          >
            13.993
          </motion.span>
          <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-text-primary)' }}>days</span>
        </motion.div>

        {/* VS */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
        >
          <span className="text-[1.5vw] font-bold" style={{ color: 'var(--color-text-muted)' }}>vs</span>
        </motion.div>

        {/* Expected card */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh] px-[2.5vw] py-[2.5vh] rounded-[0.5vw]"
          style={{
            backgroundColor: 'var(--color-bg-muted)',
            border: '0.2vw solid var(--color-text-primary)',
            boxShadow: '0.25vw 0.25vw 0 var(--color-text-primary)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.5 }}
        >
          <span className="text-[1.1vw] font-bold uppercase tracking-[0.1vw]" style={{ color: 'var(--color-text-muted)' }}>
            Expected
          </span>
          <span className="text-[1.2vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            2016 × 10 min
          </span>
          <motion.span
            className="text-[3.5vw] font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3.0, ...springs.snappy }}
          >
            14.000
          </motion.span>
          <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-text-primary)' }}>days</span>
        </motion.div>
      </div>

      {/* Difference callout */}
      <motion.div
        className="flex flex-col items-center gap-[1vh] mt-[1vh]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.0, duration: 0.5 }}
      >
        <motion.div
          className="px-[2vw] py-[1vh] rounded-[0.4vw] text-[1.8vw] font-bold"
          style={{
            backgroundColor: 'var(--color-error)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 4.2, ...springs.bouncy }}
        >
          10 minutes short!
        </motion.div>

        <motion.p
          className="text-[1.3vw]"
          style={{ color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.0 }}
        >
          Bitcoin thinks blocks came slightly too fast
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
