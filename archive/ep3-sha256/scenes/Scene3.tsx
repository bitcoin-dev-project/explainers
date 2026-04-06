import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function FlowBox({ label, dark, delay }: { label: string; dark?: boolean; delay: number }) {
  return (
    <motion.div
      className="px-[2vw] py-[1.5vh] rounded-[0.4vw] text-[1.4vw] font-bold"
      style={{
        backgroundColor: dark ? 'var(--color-text-primary)' : 'var(--color-bg-muted)',
        color: dark ? '#fff' : 'var(--color-text-primary)',
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

function Arrow({ delay }: { delay: number }) {
  return (
    <motion.div
      className="flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <motion.div
        className="w-[3vw] h-[0.25vw]"
        style={{ backgroundColor: 'var(--color-text-muted)', transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.3 }}
      />
      <motion.span
        className="text-[1.5vw] -ml-[0.3vw]"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        ▸
      </motion.span>
    </motion.div>
  );
}

export function Scene3() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[5vh]"
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
        We usually think of hashing as:
      </motion.p>

      <motion.div
        className="flex items-center gap-[1vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <FlowBox label="Input" delay={1.0} />
        <Arrow delay={1.4} />
        <FlowBox label="Black Box" dark delay={1.8} />
        <Arrow delay={2.2} />
        <FlowBox label="Hash" delay={2.6} />
      </motion.div>
    </motion.div>
  );
}
