import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function FlowBox({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      className="px-[1.5vw] py-[1.2vh] rounded-[0.4vw] text-[1.2vw] font-bold"
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
        className="w-[2.5vw] h-[0.25vw]"
        style={{ backgroundColor: 'var(--color-text-muted)', transformOrigin: 'left' }}
      />
      <span className="text-[1.2vw] -ml-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>▸</span>
    </motion.div>
  );
}

function StepCard({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      className="px-[1.5vw] py-[1vh] rounded-[0.5vw] text-[1.1vw] font-bold"
      style={{
        backgroundColor: 'var(--color-text-primary)',
        color: '#fff',
        fontFamily: 'var(--font-display)',
      }}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...springs.snappy }}
    >
      {label}
    </motion.div>
  );
}

export function Scene5() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        SHA-256 has three internal steps:
      </motion.p>

      <motion.div
        className="flex items-center gap-[1vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <FlowBox label="Input" delay={1.2} />
        <Arrow delay={1.5} />

        {/* Steps container */}
        <motion.div
          className="flex flex-col gap-[1vh] px-[1.5vw] py-[1.5vh] rounded-[0.5vw]"
          style={{ border: '0.2vw dashed var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <StepCard label="Padding" delay={2.2} />
          <StepCard label="Message schedule" delay={2.6} />
          <StepCard label="Compression" delay={3.0} />
        </motion.div>

        <Arrow delay={3.4} />
        <FlowBox label="Hash" delay={3.6} />
      </motion.div>
    </motion.div>
  );
}
