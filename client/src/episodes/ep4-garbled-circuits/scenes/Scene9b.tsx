import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 9b — Step 2 cont: full garbled table with all columns */

const ROWS = [
  { alice: 0, bob: 0, ka: 'Ka₀', kb: 'Kb₀', result: 0 },
  { alice: 0, bob: 1, ka: 'Ka₀', kb: 'Kb₁', result: 0 },
  { alice: 1, bob: 0, ka: 'Ka₁', kb: 'Kb₀', result: 0 },
  { alice: 1, bob: 1, ka: 'Ka₁', kb: 'Kb₁', result: 1 },
];

function LockIcon({ highlight }: { highlight: boolean }) {
  const c = highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)';
  return (
    <svg width="0.8vw" height="1vw" viewBox="0 0 18 22" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="9" width="16" height="12" rx="2" fill={c} />
      <path d="M5,9 V6 A4,4 0 0,1 13,6 V9" stroke={c} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function Scene9b() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[2.5vh] px-[2vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      {/* Step + Role badge */}
      <motion.div className="flex items-center gap-[1vw]"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, ...springs.snappy }}>
        <span className="px-[0.8vw] py-[0.3vh] rounded-full text-[0.85vw] font-bold"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Step 2
        </span>
        <img src="/alice.png" alt="Alice" className="w-[3vw] h-[3vw] object-contain" />
        <span className="text-[1vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
          Alice (Garbler)
        </span>
      </motion.div>

      <motion.p
        className="text-[1.8vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        The <span style={{ color: 'var(--color-secondary)' }}>garbled table</span>
      </motion.p>

      {/* Full table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, ...springs.snappy }}
        style={{ width: '100%', maxWidth: '42vw' }}
      >
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.6vh', fontFamily: 'var(--font-mono)' }}>
          {/* Header */}
          <thead>
            <motion.tr
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-left"
                style={{ color: 'var(--color-secondary)' }}>Alice</th>
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-left"
                style={{ color: 'var(--color-primary)' }}>Bob</th>
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-center"
                style={{ color: 'var(--color-text-muted)' }}>AND</th>
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-left"
                style={{ color: 'var(--color-secondary)' }}>Alice Key</th>
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-left"
                style={{ color: 'var(--color-primary)' }}>Bob Key</th>
              <th className="text-[0.7vw] font-bold px-[0.5vw] py-[0.5vh] text-left"
                style={{ color: 'var(--color-text-muted)' }}>Encrypted Output</th>
            </motion.tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const delay = 2.9 + i * 2.0;
              const isMatch = row.result === 1;
              return (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay, ...springs.snappy }}
                  style={{
                    backgroundColor: isMatch ? 'rgba(241,118,13,0.12)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Alice input */}
                  <td className="text-[0.9vw] font-bold px-[0.5vw] py-[0.7vh] rounded-l-[0.2vw]"
                    style={{ color: 'var(--color-secondary)' }}>
                    {row.alice}
                  </td>
                  {/* Bob input */}
                  <td className="text-[0.9vw] font-bold px-[0.5vw] py-[0.7vh]"
                    style={{ color: 'var(--color-primary)' }}>
                    {row.bob}
                  </td>
                  {/* AND result */}
                  <td className="text-[0.9vw] font-bold px-[0.5vw] py-[0.7vh] text-center"
                    style={{ color: isMatch ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                    {row.result}
                  </td>
                  {/* Alice key */}
                  <td className="px-[0.5vw] py-[0.7vh]">
                    <span className="text-[0.8vw] font-bold px-[0.4vw] py-[0.2vh] rounded-[0.12vw]"
                      style={{
                        backgroundColor: isMatch ? 'var(--color-secondary)' : 'rgba(241,118,13,0.15)',
                        color: isMatch ? '#fff' : 'var(--color-secondary)',
                      }}>
                      {row.ka}
                    </span>
                  </td>
                  {/* Bob key */}
                  <td className="px-[0.5vw] py-[0.7vh]">
                    <span className="text-[0.8vw] font-bold px-[0.4vw] py-[0.2vh] rounded-[0.12vw]"
                      style={{
                        backgroundColor: isMatch ? 'var(--color-primary)' : 'rgba(38,70,83,0.15)',
                        color: isMatch ? '#fff' : 'var(--color-primary)',
                      }}>
                      {row.kb}
                    </span>
                  </td>
                  {/* Encrypted output */}
                  <td className="px-[0.5vw] py-[0.7vh] rounded-r-[0.2vw]">
                    <div className="flex items-center gap-[0.3vw]">
                      <LockIcon highlight={isMatch} />
                      <span className="text-[0.8vw] font-bold"
                        style={{ color: isMatch ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                        Enc({row.ka}, {row.kb})
                      </span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      <motion.p
        className="text-[1.1vw] text-center max-w-[34vw] mt-[0.5vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 11.4 }}
      >
        Alice replaces the real values with random keys, then encrypts each row.
        Only the <strong style={{ color: 'var(--color-text-primary)' }}>matching key pair</strong> can unlock its row.
      </motion.p>
    </motion.div>
  );
}
