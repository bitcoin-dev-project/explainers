import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 14d: The trade-off / scale */

export function Scene14d() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
      style={{ backgroundColor: '#1C1C1C' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[2vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        The trade-off?
      </motion.p>

      {/* Comparison */}
      <div className="flex gap-[4vw]">
        {/* Regular gate */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh] px-[2vw] py-[2vh] rounded-[0.4vw]"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '0.12vw solid rgba(255,255,255,0.1)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.5, ...springs.snappy }}
        >
          <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
            Regular gate
          </span>
          <span className="text-[2.5vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>
            ~1 ns
          </span>
        </motion.div>

        <motion.span
          className="text-[2vw] font-bold self-center"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.0 }}
        >
          vs
        </motion.span>

        {/* Garbled gate */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh] px-[2vw] py-[2vh] rounded-[0.4vw]"
          style={{ backgroundColor: 'rgba(241,118,13,0.1)', border: '0.12vw solid var(--color-secondary)' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 6.0, ...springs.snappy }}
        >
          <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
            Garbled gate
          </span>
          <span className="text-[2.5vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
            ~1 us
          </span>
        </motion.div>
      </div>

      <motion.p
        className="text-[1.3vw] text-center max-w-[34vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 11.0 }}
      >
        Each gate requires symmetric encryption.
        Fast, but <strong style={{ color: '#fff' }}>~1000x slower</strong> than a native gate.
      </motion.p>

      <motion.p
        className="text-[1.3vw] text-center max-w-[34vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 17.0 }}
      >
        And the full circuit description can be{' '}
        <strong style={{ color: '#fff' }}>megabytes, even gigabytes</strong> of encrypted data
        sent between the parties.
      </motion.p>

      <motion.p
        className="text-[1.6vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 24.0, ...springs.snappy }}
      >
        Privacy has a cost. But it works.
      </motion.p>
    </motion.div>
  );
}
