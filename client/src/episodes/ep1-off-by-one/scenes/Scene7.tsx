import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      className="w-[4.5vw] h-[4.5vw] rounded-[0.4vw] flex items-center justify-center text-[1.1vw] font-bold"
      style={{
        backgroundColor: 'var(--color-bg-muted)',
        border: '0.2vw solid var(--color-text-primary)',
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
    >
      {label}
    </motion.div>
  );
}

function Interval({ delay, label }: { delay: number; label: string }) {
  return (
    <div className="relative flex items-center">
      <motion.div
        className="w-[3.5vw] h-[0.25vw]"
        style={{ backgroundColor: 'var(--color-secondary)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay, duration: 0.3 }}
      />
      <motion.span
        className="absolute -bottom-[2.8vh] left-1/2 -translate-x-1/2 text-[0.85vw] font-bold whitespace-nowrap"
        style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {label}
      </motion.span>
    </div>
  );
}

export function Scene7() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.8vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Time is measured in gaps between blocks
      </motion.p>

      {/* Blocks with numbered intervals */}
      <motion.div
        className="flex items-center mt-[2vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Block label="B0" delay={0.8} />
        <Interval delay={1.1} label="1" />
        <Block label="B1" delay={1.3} />
        <Interval delay={1.6} label="2" />
        <Block label="B2" delay={1.8} />
        <Interval delay={2.1} label="3" />
        <Block label="B3" delay={2.3} />
        <Interval delay={2.6} label="4" />
        <Block label="B4" delay={2.8} />
      </motion.div>

      {/* Callout */}
      <motion.div
        className="text-[2.2vw] font-bold mt-[3vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.8 }}
      >
        <span style={{ color: 'var(--color-primary)' }}>5</span> blocks ={' '}
        <span style={{ color: 'var(--color-secondary)' }}>4</span> intervals
      </motion.div>
    </motion.div>
  );
}
