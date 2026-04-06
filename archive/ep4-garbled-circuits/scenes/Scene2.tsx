import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Millionaire({ label, side, delay }: { label: string; side: 'left' | 'right'; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-[1.5vh]"
      initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...springs.snappy }}
    >
      {/* Money question */}
      <motion.div
        className="text-[2vw] font-bold"
        style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.4, ...springs.bouncy }}
      >
        $???
      </motion.div>

      {/* Pangolin avatar */}
      <img
        src={side === 'left' ? '/pango-million1.png' : '/pango-million2.png'}
        alt={label}
        className="w-[8vw] h-[8vw] object-contain"
      />
      <span
        className="text-[1.2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function Scene2() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[2.2vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Two millionaires at dinner...
      </motion.p>

      <div className="flex items-end gap-[8vw]">
        <Millionaire label="M1" side="right" delay={3.0} />

        {/* Table */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.0, ...springs.gentle }}
        >
          <img
            src="/dinning-table.png"
            alt="Dining table"
            className="w-[12vw] h-[12vw] object-contain"
          />
        </motion.div>

        <Millionaire label="M2" side="left" delay={5.0} />
      </div>

      <motion.p
        className="text-[1.6vw] text-center max-w-[40vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 6.0, duration: 0.5 }}
      >
        Who's richer? The richer one pays.
      </motion.p>

      <motion.p
        className="text-[1.8vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 9.0, duration: 0.5 }}
      >
        But neither wants to reveal how much they have.
      </motion.p>
    </motion.div>
  );
}
