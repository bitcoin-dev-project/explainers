import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 13: Bob tries to decrypt each row of the garbled table */

const GARBLED_ROWS = [
  { a: 'Ka₁', b: 'Kb₀', out: '0', ok: false },
  { a: 'Ka₁', b: 'Kb₁', out: '1', ok: true },
  { a: 'Ka₀', b: 'Kb₀', out: '0', ok: false },
  { a: 'Ka₀', b: 'Kb₁', out: '0', ok: false },
];

function LockIcon({ open, dim }: { open?: boolean; dim?: boolean }) {
  const c = open ? 'var(--color-secondary)' : 'var(--color-text-muted)';
  const opacity = dim ? 0.35 : 1;
  return (
    <svg width="1vw" height="1.2vw" viewBox="0 0 18 22" fill="none" style={{ flexShrink: 0, opacity }}>
      <rect x="1" y="9" width="16" height="12" rx="2" fill={c} />
      {open
        ? <path d="M5,9 V4 A4,4 0 0,1 13,4 V6" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        : <path d="M5,9 V6 A4,4 0 0,1 13,6 V9" stroke={c} strokeWidth="2" fill="none" />
      }
    </svg>
  );
}

function HeaderCell({ children, delay, width }: { children?: React.ReactNode; delay: number; width: string }) {
  return (
    <motion.div
      className={`${width} py-[0.6vh] text-center text-[0.8vw] font-bold`}
      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function Scene13() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[2vh] px-[2vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      {/* Step + Role badge */}
      <motion.div className="flex items-center gap-[1vw]"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springs.snappy }}>
        <span className="px-[0.8vw] py-[0.3vh] rounded-full text-[0.85vw] font-bold"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Step 5
        </span>
        <img src="/bob.png" alt="Bob" className="w-[3vw] h-[3vw] object-contain" />
        <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
          Bob (Evaluator)
        </span>
      </motion.div>

      {/* Bob's keys reminder */}
      <motion.div
        className="flex items-center gap-[1.5vw] px-[1.5vw] py-[0.8vh] rounded-[0.3vw]"
        style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '0.1vw dashed var(--color-text-muted)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springs.snappy }}
      >
        <span className="text-[0.85vw]" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}>
          Bob's keys:
        </span>
        <span className="text-[0.9vw] font-bold px-[0.5vw] py-[0.25vh] rounded-[0.15vw]"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Ka₁
        </span>
        <span className="text-[0.9vw] font-bold px-[0.5vw] py-[0.25vh] rounded-[0.15vw]"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Kb₁
        </span>
      </motion.div>

      {/* Table */}
      <div className="flex flex-col">
        {/* Table header */}
        <motion.div
          className="flex items-center rounded-t-[0.3vw] overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <HeaderCell width="w-[1.8vw]" delay={1.0}></HeaderCell>
          <HeaderCell width="w-[5vw]" delay={1.05}>Alice key</HeaderCell>
          <HeaderCell width="w-[5vw]" delay={1.1}>Bob key</HeaderCell>
          <HeaderCell width="w-[6vw]" delay={1.15}>Encrypted output</HeaderCell>
          <HeaderCell width="w-[3vw]" delay={1.2}>Try</HeaderCell>
          <HeaderCell width="w-[6vw]" delay={1.25}>Result</HeaderCell>
        </motion.div>

        {/* Table rows */}
        {GARBLED_ROWS.map((row, i) => {
          const rowDelays = [4.0, 8.0, 14.0, 18.0];
          const tryDelays = [5.5, 10.0, 15.5, 19.5];
          const resultDelays = [6.5, 12.0, 16.5, 20.5];
          const rowDelay = rowDelays[i];
          const tryDelay = tryDelays[i];
          const resultDelay = resultDelays[i];
          const aMatch = row.a === 'Ka₁';
          const bMatch = row.b === 'Kb₁';

          return (
            <motion.div
              key={i}
              className="flex items-center"
              style={{
                backgroundColor: row.ok ? 'rgba(241,118,13,0.1)' : 'transparent',
                borderBottom: '0.08vw solid rgba(0,0,0,0.06)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowDelay, duration: 0.3 }}
            >
              {/* Lock */}
              <div className="w-[1.8vw] flex justify-center py-[1vh]">
                <motion.div
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: row.ok ? 1 : 0.3 }}
                  transition={{ delay: resultDelay }}
                >
                  <LockIcon open={row.ok} dim={!row.ok} />
                </motion.div>
              </div>

              {/* Alice key */}
              <div className="w-[5vw] py-[1vh] flex justify-center">
                <span
                  className="text-[0.85vw] font-bold px-[0.4vw] py-[0.2vh] rounded-[0.15vw]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: aMatch ? '#fff' : 'var(--color-text-muted)',
                    backgroundColor: aMatch ? 'var(--color-secondary)' : 'transparent',
                  }}
                >
                  {row.a}
                </span>
              </div>

              {/* Bob key */}
              <div className="w-[5vw] py-[1vh] flex justify-center">
                <span
                  className="text-[0.85vw] font-bold px-[0.4vw] py-[0.2vh] rounded-[0.15vw]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: bMatch ? '#fff' : 'var(--color-text-muted)',
                    backgroundColor: bMatch ? 'var(--color-primary)' : 'transparent',
                  }}
                >
                  {row.b}
                </span>
              </div>

              {/* Encrypted output */}
              <div className="w-[6vw] py-[1vh] flex justify-center">
                <span
                  className="text-[0.85vw] font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: row.ok ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                    opacity: row.ok ? 1 : 0.5,
                  }}
                >
                  {row.out}
                </span>
              </div>

              {/* Try indicator */}
              <motion.div
                className="w-[3vw] py-[1vh] flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: tryDelay }}
              >
                <span className="text-[0.8vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {aMatch && bMatch ? '🔑🔑' : aMatch ? '🔑✗' : bMatch ? '✗🔑' : '✗✗'}
                </span>
              </motion.div>

              {/* Result */}
              <motion.div
                className="w-[6vw] py-[1vh] flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: resultDelay, ...springs.snappy }}
              >
                {row.ok ? (
                  <motion.span
                    className="text-[0.9vw] font-bold px-[0.6vw] py-[0.3vh] rounded-[0.2vw]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: '#fff',
                      backgroundColor: 'var(--color-secondary)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: resultDelay + 0.1, ...springs.bouncy }}
                  >
                    ✓ Decrypted!
                  </motion.span>
                ) : (
                  <span
                    className="text-[0.8vw] font-bold"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', opacity: 0.5 }}
                  >
                    gibberish
                  </span>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom message */}
      <motion.p
        className="text-[1.2vw] font-bold text-center max-w-[30vw] mt-[1vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 24.0, ...springs.snappy }}
      >
        Only one row opens. Bob learns the output,
        <br />
        <span style={{ color: 'var(--color-text-primary)' }}>nothing else.</span>
      </motion.p>
    </motion.div>
  );
}
