import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, highlight, delay }: { label: string; highlight?: boolean; delay: number }) {
  return (
    <motion.div
      className="w-[4vw] h-[4vw] rounded-[0.4vw] flex items-center justify-center text-[1vw] font-bold"
      style={{
        backgroundColor: highlight ? 'var(--color-primary)' : 'var(--color-bg-muted)',
        border: '0.2vw solid var(--color-text-primary)',
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        color: highlight ? '#fff' : 'var(--color-text-primary)',
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
      className="w-[1.5vw] h-[0.2vw]"
      style={{ backgroundColor: 'var(--color-text-muted)' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.2 }}
    />
  );
}

export function Scene8() {
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
        To adjust difficulty, Bitcoin asks:
      </motion.p>

      <motion.h2
        className="text-[2.8vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        How long did the last epoch take?
      </motion.h2>

      {/* Two epochs */}
      <div className="flex items-center mt-[2vh]">
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.5 }}
        >
          <Block label="0" delay={1.6} />
          <Conn delay={1.8} />
          <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>···</motion.span>
          <Conn delay={1.9} />
          <Block label="2015" delay={2.0} />
        </motion.div>

        <Conn delay={2.2} />

        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          <Block label="2016" highlight delay={2.5} />
          <Conn delay={2.7} />
          <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>···</motion.span>
          <Conn delay={2.8} />
          <Block label="4031" highlight delay={2.9} />
        </motion.div>
      </div>

      <motion.p
        className="text-[1.6vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.8 }}
      >
        It compares two block timestamps to find out
      </motion.p>
    </motion.div>
  );
}
