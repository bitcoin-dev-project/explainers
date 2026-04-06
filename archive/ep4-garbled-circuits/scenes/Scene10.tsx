import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Same order as Scene 9, then shuffles */
const ROWS = [
  { id: 0, a: 'Ka₀', b: 'Kb₀', out: '0', isYes: false },
  { id: 1, a: 'Ka₀', b: 'Kb₁', out: '0', isYes: false },
  { id: 2, a: 'Ka₁', b: 'Kb₀', out: '0', isYes: false },
  { id: 3, a: 'Ka₁', b: 'Kb₁', out: '1', isYes: true },
];
const SHUFFLED_ORDER = [2, 3, 0, 1];

function LockIcon({ highlight }: { highlight: boolean }) {
  const c = highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)';
  return (
    <svg width="0.9vw" height="1.1vw" viewBox="0 0 18 22" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="9" width="16" height="12" rx="2" fill={c} />
      <path d="M5,9 V6 A4,4 0 0,1 13,6 V9" stroke={c} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function Scene10() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[3vh] px-[3vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      {/* Step + Role badge */}
      <motion.div className="flex items-center gap-[1vw]"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springs.snappy }}>
        <span className="px-[0.8vw] py-[0.3vh] rounded-full text-[0.85vw] font-bold"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Step 3
        </span>
        <img src="/alice.png" alt="Alice" className="w-[3vw] h-[3vw] object-contain" />
        <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
          Alice (Garbler)
        </span>
      </motion.div>

      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        Shuffle the rows <span style={{ color: 'var(--color-secondary)' }}>randomly</span>
      </motion.p>

      {/* Shuffling visual */}
      <div className="relative h-[26vh] w-[28vw]">
        {ROWS.map((row, origIdx) => {
          const destIdx = SHUFFLED_ORDER.indexOf(origIdx);
          const isYes = row.isYes;
          const accent = isYes ? 'var(--color-secondary)' : 'var(--color-text-muted)';

          return (
            <motion.div
              key={row.id}
              className="absolute left-0 right-0 flex items-center gap-[0.5vw] px-[1vw] py-[1vh] rounded-[0.3vw]"
              style={{
                backgroundColor: isYes ? 'rgba(241,118,13,0.12)' : 'var(--color-bg-muted)',
                border: isYes ? '0.12vw solid var(--color-secondary)' : '0.12vw solid rgba(0,0,0,0.07)',
              }}
              initial={{ opacity: 0, y: origIdx * 58 }}
              animate={{
                opacity: 1,
                y: [origIdx * 58, origIdx * 58, destIdx * 58],
              }}
              transition={{
                opacity: { delay: 1.5 + origIdx * 0.1, duration: 0.3 },
                y: { delay: 3.0, duration: 4.0, times: [0, 0.25, 1], ease: 'easeInOut' },
              }}
            >
              <LockIcon highlight={isYes} />
              <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: accent }}>
                Enc(
              </span>
              <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
                {row.a}
              </span>
              <span className="text-[0.85vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>,</span>
              <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                {row.b}
              </span>
              <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: accent }}>
                ) = 🔒 {row.out}
              </span>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        className="text-[1.2vw] text-center max-w-[30vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 9.0 }}
      >
        The <strong style={{ color: 'var(--color-text-primary)' }}>row position</strong> no longer corresponds to
        any input combination.
      </motion.p>

      <motion.p
        className="text-[1.5vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 12.0, ...springs.snappy }}
      >
        This is why it's called "garbled."
      </motion.p>
    </motion.div>
  );
}
