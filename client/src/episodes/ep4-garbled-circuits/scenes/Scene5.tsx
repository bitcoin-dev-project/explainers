import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const ROWS = [
  { alice: '0', bob: '0', output: '0', label: 'No', outputColor: 'var(--color-text-muted)' },
  { alice: '0', bob: '1', output: '0', label: 'No', outputColor: 'var(--color-text-muted)' },
  { alice: '1', bob: '0', output: '0', label: 'No', outputColor: 'var(--color-text-muted)' },
  { alice: '1', bob: '1', output: '1', label: 'Yes!', outputColor: 'var(--color-secondary)' },
];

function HeaderCell({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      className="px-[1.5vw] py-[1vh] text-[1.1vw] font-bold text-center"
      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function TableRow({ row, index }: { row: typeof ROWS[0]; index: number }) {
  const delay = 3.5 + index * 2.0;
  const isHighlight = row.output === '1';

  return (
    <motion.div
      className="flex items-center rounded-[0.4vw] overflow-hidden"
      style={{
        backgroundColor: isHighlight ? 'rgba(241,118,13,0.12)' : 'var(--color-bg-muted)',
        border: isHighlight ? '0.2vw solid var(--color-secondary)' : '0.2vw solid transparent',
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...springs.snappy }}
    >
      <div
        className="w-[6vw] py-[1.2vh] text-center text-[1.3vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}
      >
        {row.alice}
      </div>
      <div
        className="w-[6vw] py-[1.2vh] text-center text-[1.3vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}
      >
        {row.bob}
      </div>
      <div
        className="w-[4vw] py-[1.2vh] text-center text-[1.3vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
      >
        →
      </div>
      <div
        className="w-[8vw] py-[1.2vh] text-center text-[1.3vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: row.outputColor }}
      >
        {row.label}
      </div>
    </motion.div>
  );
}

export function Scene5() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        All possible outcomes:
      </motion.p>

      <div className="flex flex-col gap-[1vh]">
        {/* Header */}
        <div className="flex items-center">
          <HeaderCell delay={2.0}>Alice</HeaderCell>
          <HeaderCell delay={2.1}>Bob</HeaderCell>
          <div className="w-[4vw]" />
          <HeaderCell delay={2.2}>Go?</HeaderCell>
        </div>

        {/* Rows */}
        {ROWS.map((row, i) => (
          <TableRow key={i} row={row} index={i} />
        ))}
      </div>

      <motion.p
        className="text-[1.3vw] text-center mt-[2vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 14.0, duration: 0.5 }}
      >
        Only <strong style={{ color: 'var(--color-secondary)' }}>one combination</strong> gets them to the party.
      </motion.p>
    </motion.div>
  );
}
