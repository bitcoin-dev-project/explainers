import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Person({ label, color, delay }: { label: string; color: string; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-[1vh]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...springs.snappy }}
    >
      <img
        src={label === 'A' ? '/alice.png' : '/bob.png'}
        alt={label === 'A' ? 'Alice' : 'Bob'}
        className="w-[7vw] h-[7vw] object-contain"
      />
      <span
        className="text-[1.2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {label === 'A' ? 'Alice' : 'Bob'}
      </span>
    </motion.div>
  );
}

export function Scene3() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.4vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Let's simplify this...
      </motion.p>

      <div className="flex items-center gap-[6vw]">
        <Person label="A" color="var(--color-secondary)" delay={2.5} />

        {/* Party icon */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.5, ...springs.bouncy }}
        >
          <div className="text-[4vw]">🎉</div>
          <span
            className="text-[1.1vw] font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            Party
          </span>
        </motion.div>

        <Person label="B" color="var(--color-primary)" delay={4.0} />
      </div>

      <motion.p
        className="text-[2.2vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 6.0, duration: 0.5 }}
      >
        "Should we <span style={{ color: 'var(--color-secondary)' }}>both</span> go to the party?"
      </motion.p>

      <motion.p
        className="text-[1.4vw] text-center max-w-[38vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 10.0, duration: 0.5 }}
      >
        They only go if <strong style={{ color: 'var(--color-text-primary)' }}>both</strong> want to.
        <br />
        But if one says No, they don't want the other to know.
      </motion.p>
    </motion.div>
  );
}
