import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, highlight, delay }: { label: string; highlight?: boolean; delay: number }) {
  return (
    <motion.div
      className="w-[4.5vw] h-[4.5vw] rounded-[0.4vw] flex items-center justify-center text-[1.2vw] font-bold"
      style={{
        backgroundColor: highlight ? 'var(--color-primary)' : 'var(--color-bg-muted)',
        border: '0.25vw solid var(--color-text-primary)',
        boxShadow: '0.25vw 0.25vw 0 var(--color-text-primary)',
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

function Conn({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-[1.8vw] h-[0.2vw] mx-[0.1vw]"
      style={{ backgroundColor: 'var(--color-text-muted)' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.3 }}
    />
  );
}

export function Scene5() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3.5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Context text */}
      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Each block takes about 10 minutes
      </motion.p>

      {/* Block chain with "10 min" measurement between block 0 and block 1 */}
      <div className="flex items-center">
        <Block label="0" delay={0.6} />

        {/* 10 min measurement bracket between blocks */}
        <div className="relative flex items-center">
          {/* Highlighted orange connector */}
          <motion.div
            className="w-[5vw] h-[0.3vw] mx-[0.1vw]"
            style={{ backgroundColor: 'var(--color-primary)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          />
          {/* Measurement label above */}
          <motion.div
            className="absolute -top-[4.5vh] left-1/2 -translate-x-1/2 flex flex-col items-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}
          >
            <span
              className="text-[1.1vw] font-bold whitespace-nowrap px-[0.6vw] py-[0.2vh] rounded-[0.2vw]"
              style={{
                color: '#fff',
                backgroundColor: 'var(--color-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              10 min
            </span>
            {/* Down arrow */}
            <svg width="1vw" height="1vh" viewBox="0 0 10 8" style={{ overflow: 'visible' }}>
              <path d="M1 0 L5 7 L9 0" fill="var(--color-primary)" />
            </svg>
          </motion.div>
        </div>

        <Block label="1" delay={0.8} />
        <Conn delay={1.5} />
        <Block label="2" delay={1.6} />
        <Conn delay={1.8} />

        <motion.span
          className="text-[1.8vw] mx-[0.6vw] font-bold tracking-[0.2vw]"
          style={{ color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
        >
          · · ·
        </motion.span>

        <Conn delay={2.2} />
        <Block label="2015" highlight delay={2.4} />
      </div>

      {/* Brace underneath */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
      >
        <svg width="42vw" height="3.5vh" viewBox="0 0 420 35" fill="none" style={{ overflow: 'visible' }}>
          <motion.path
            d="M 10 5 Q 10 25, 210 25 Q 410 25, 410 5"
            stroke="var(--color-secondary)"
            strokeWidth="2.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3.3, duration: 0.6, ease: 'circOut' }}
          />
          <motion.line
            x1="210" y1="25" x2="210" y2="35"
            stroke="var(--color-secondary)"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 3.8, duration: 0.3 }}
          />
        </svg>
      </motion.div>

      {/* Result */}
      <motion.div
        className="text-[2.8vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 4.2, ...springs.bouncy }}
      >
        2016 × 10 min = <span style={{ color: 'var(--color-secondary)' }}>14 Days</span>
      </motion.div>
    </motion.div>
  );
}
