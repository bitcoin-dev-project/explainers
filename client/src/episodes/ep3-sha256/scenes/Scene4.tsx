import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function FlowBox({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      className="px-[2vw] py-[1.5vh] rounded-[0.4vw] text-[1.4vw] font-bold"
      style={{
        backgroundColor: 'var(--color-bg-muted)',
        color: 'var(--color-text-primary)',
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
      <div
        className="w-[3vw] h-[0.25vw]"
        style={{ backgroundColor: 'var(--color-text-muted)', transformOrigin: 'left' }}
      />
      <span
        className="text-[1.5vw] -ml-[0.3vw]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        ▸
      </span>
    </motion.div>
  );
}

export function Scene4() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Now let's look inside the black box
      </motion.p>

      <motion.div
        className="flex items-center gap-[1vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <FlowBox label="Input" delay={1.2} />
        <Arrow delay={1.5} />
        <motion.div
          className="w-[5vw] h-[5vw] rounded-[0.4vw] flex items-center justify-center text-[2.5vw] font-bold"
          style={{
            backgroundColor: 'var(--color-text-primary)',
            color: '#fff',
            border: '0.2vw solid var(--color-text-primary)',
            boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
          }}
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.8, ...springs.bouncy }}
        >
          ?
        </motion.div>
        <Arrow delay={2.2} />
        <FlowBox label="Hash" delay={2.5} />
      </motion.div>
    </motion.div>
  );
}
