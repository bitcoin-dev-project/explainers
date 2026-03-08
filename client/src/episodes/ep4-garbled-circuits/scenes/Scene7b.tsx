import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene7b() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
      style={{ backgroundColor: '#1C1C1C' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, ...springs.snappy }}
      >
        Enter: Garbled Circuits
      </motion.p>

      <div className="flex gap-[6vw] mt-[2vh]">
        {/* Alice */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.9, ...springs.snappy }}
        >
          <img src="/alice.png" alt="Alice" className="w-[7vw] h-[7vw] object-contain" />
          <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-display)' }}>
            Alice
          </span>
          <motion.span
            className="text-[0.95vw] text-center"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.4 }}
          >
            the Garbler
          </motion.span>
          <motion.span
            className="text-[0.85vw] text-center max-w-[12vw]"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.9 }}
          >
            prepares the circuit
          </motion.span>
        </motion.div>

        {/* Bob */}
        <motion.div
          className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 6.9, ...springs.snappy }}
        >
          <img src="/bob.png" alt="Bob" className="w-[7vw] h-[7vw] object-contain" />
          <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
            Bob
          </span>
          <motion.span
            className="text-[0.95vw] text-center"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 8.4 }}
          >
            the Evaluator
          </motion.span>
          <motion.span
            className="text-[0.85vw] text-center max-w-[12vw]"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 9.9 }}
          >
            runs the circuit
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
