import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function LearnItem({ icon, text, good, delay }: { icon: string; text: string; good: boolean; delay: number }) {
  return (
    <motion.div className="flex items-center gap-[0.5vw]"
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...springs.snappy }}>
      <span className="text-[1.1vw] w-[1.3vw] text-center"
        style={{ color: good ? 'var(--color-secondary)' : 'var(--color-error)' }}>{icon}</span>
      <span className="text-[1.1vw]"
        style={{ fontFamily: 'var(--font-display)', color: good ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
        {text}
      </span>
    </motion.div>
  );
}

export function Scene14() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        What did each side learn?
      </motion.p>

      <div className="flex gap-[5vw]">
        {/* Alice */}
        <motion.div className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, ...springs.snappy }}>
          <img src="/alice.png" alt="Alice" className="w-[5vw] h-[5vw] object-contain" />
          <span className="text-[0.9vw] font-bold" style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-display)' }}>Alice / Garbler</span>
          <div className="flex flex-col gap-[0.6vh]">
            <LearnItem icon="✗" text="Bob's input" good={false} delay={4.0} />
            <LearnItem icon="✗" text="The output" good={false} delay={5.5} />
          </div>
        </motion.div>

        {/* Bob */}
        <motion.div className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 7.0, ...springs.snappy }}>
          <img src="/bob.png" alt="Bob" className="w-[5vw] h-[5vw] object-contain" />
          <span className="text-[0.9vw] font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>Bob / Evaluator</span>
          <div className="flex flex-col gap-[0.6vh]">
            <LearnItem icon="✓" text="The output" good={true} delay={8.5} />
            <LearnItem icon="✗" text="Alice's input" good={false} delay={10.5} />
          </div>
        </motion.div>
      </div>

      <motion.p className="text-[1.6vw] font-bold text-center max-w-[32vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 13.0, ...springs.snappy }}>
        They computed <span style={{ color: 'var(--color-secondary)' }}>together</span>,{' '}
        but learned <span style={{ color: 'var(--color-secondary)' }}>nothing</span> about each other.
      </motion.p>
    </motion.div>
  );
}
