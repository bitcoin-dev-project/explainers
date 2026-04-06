import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function FlowBox({ label, highlighted, completed, delay }: { label: string; highlighted?: boolean; completed?: boolean; delay: number }) {
  return (
    <motion.div
      className="px-[1.5vw] py-[1.2vh] rounded-[0.4vw] text-[1.2vw] font-bold"
      style={{
        backgroundColor: highlighted ? 'var(--color-text-primary)' : completed ? 'var(--color-primary)' : 'var(--color-bg-muted)',
        color: highlighted || completed ? '#fff' : 'var(--color-text-primary)',
        border: `0.2vw solid ${highlighted ? 'var(--color-text-primary)' : 'var(--color-text-primary)'}`,
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-display)',
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
      <span className="text-[1.5vw] -ml-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>▸</span>
    </motion.div>
  );
}

export function Scene13() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.fadeBlur}
    >
      <motion.p
        className="text-[1.8vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Now next step is
      </motion.p>

      <motion.h2
        className="text-[3vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        Message schedule
      </motion.h2>

      {/* Flow diagram */}
      <motion.div
        className="flex items-center gap-[1vw] mt-[2vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <FlowBox label="Padding" completed delay={1.7} />
        <Arrow delay={2.0} />
        <FlowBox label="Message schedule" highlighted delay={2.3} />
      </motion.div>

      {/* CTA */}
      <motion.div
        className="flex flex-col items-center gap-[1.5vh] mt-[3vh]"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5, duration: 0.5 }}
      >
        <motion.p
          className="text-[1.2vw]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8 }}
        >
          See this padding step in practice at:
        </motion.p>

        <motion.div
          className="px-[2.5vw] py-[1.5vh] rounded-[0.5vw] text-[2vw] font-bold"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: '0.3vw 0.3vw 0 rgba(0,0,0,0.15)',
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 4.2, ...springs.bouncy }}
        >
          Hashexplained.com
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
