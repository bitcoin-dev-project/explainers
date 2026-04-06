import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene6() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.scaleFade}
    >
      <motion.p
        className="text-[2.5vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-error)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, ...springs.snappy }}
      >
        But here's the problem...
      </motion.p>

      {/* Scenario visual */}
      <motion.div
        className="flex items-center gap-[3vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        {/* Alice */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, ...springs.snappy }}
        >
          <img
            src="/alice.png"
            alt="Alice"
            className="w-[6vw] h-[6vw] object-contain"
          />
          <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
            Alice
          </span>
          <motion.div
            className="px-[1vw] py-[0.5vh] rounded-[0.3vw] text-[1.1vw] font-bold"
            style={{
              backgroundColor: 'rgba(217,83,79,0.15)',
              color: 'var(--color-error)',
              fontFamily: 'var(--font-mono)',
              border: '0.15vw solid var(--color-error)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 4.0, ...springs.bouncy }}
          >
            says: 0 (No)
          </motion.div>
        </motion.div>

        {/* Eye icon — Alice can see */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 7.0 }}
        >
          <svg width="4vw" height="3vw" viewBox="0 0 60 40" fill="none">
            <motion.path
              d="M5,20 Q30,0 55,20 Q30,40 5,20"
              stroke="var(--color-error)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 7.2, duration: 0.5 }}
            />
            <motion.circle
              cx="30" cy="20" r="7"
              fill="var(--color-error)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 7.5, ...springs.bouncy }}
            />
          </svg>
          <span className="text-[0.9vw]" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
            can see
          </span>
        </motion.div>

        {/* Bob */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.0, ...springs.snappy }}
        >
          <img
            src="/bob.png"
            alt="Bob"
            className="w-[6vw] h-[6vw] object-contain"
          />
          <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
            Bob
          </span>
          <motion.div
            className="px-[1vw] py-[0.5vh] rounded-[0.3vw] text-[1.1vw] font-bold"
            style={{
              backgroundColor: 'rgba(231,127,50,0.15)',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-mono)',
              border: '0.15vw solid var(--color-primary)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 5.0, ...springs.bouncy }}
          >
            says: ?
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex flex-col items-center gap-[1.5vh] mt-[1vh]"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 10.0, duration: 0.5 }}
      >
        <p
          className="text-[1.4vw] text-center max-w-[36vw]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          If Alice said <strong style={{ color: 'var(--color-error)' }}>No</strong>, and the answer is "Don't go"...
        </p>
        <p
          className="text-[1.4vw] text-center max-w-[36vw]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        >
          She still doesn't know if Bob said Yes or No.
        </p>
      </motion.div>

      <motion.p
        className="text-[1.6vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-error)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 17.0, duration: 0.5 }}
      >
        We need to keep inputs private.
      </motion.p>
    </motion.div>
  );
}
