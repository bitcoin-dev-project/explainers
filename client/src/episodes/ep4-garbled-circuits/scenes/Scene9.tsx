import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 9 — Step 2: encrypt each row with its two keys */
export function Scene9() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
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
        className="text-[2.5vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        Encrypt each row with its <span style={{ color: 'var(--color-secondary)' }}>two keys</span>
      </motion.p>

      <motion.p
        className="text-[1.3vw] text-center max-w-[32vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.9 }}
      >
        Each output is <strong style={{ color: 'var(--color-text-primary)' }}>double-encrypted</strong>.
        You need both Alice's key and Bob's key to open it.
      </motion.p>

      {/* Simple example row */}
      <motion.div
        className="flex items-center gap-[1.2vw] px-[2vw] py-[1.5vh] rounded-[0.3vw]"
        style={{ backgroundColor: 'var(--color-bg-muted)' }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 8.4, ...springs.bouncy }}
      >
        <div className="flex flex-col items-center gap-[0.3vh]">
          <span className="text-[1.2vw] font-bold px-[0.6vw] py-[0.3vh] rounded-[0.15vw]"
            style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
            Ka₁
          </span>
          <span className="text-[0.65vw]" style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-display)' }}>Alice's key</span>
        </div>

        <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-text-muted)' }}>+</span>

        <div className="flex flex-col items-center gap-[0.3vh]">
          <span className="text-[1.2vw] font-bold px-[0.6vw] py-[0.3vh] rounded-[0.15vw]"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
            Kb₁
          </span>
          <span className="text-[0.65vw]" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>Bob's key</span>
        </div>

        <span className="text-[1.3vw] font-bold" style={{ color: 'var(--color-text-muted)' }}>=</span>

        <div className="flex flex-col items-center gap-[0.3vh]">
          <span className="text-[1.2vw] font-bold px-[0.6vw] py-[0.3vh] rounded-[0.15vw]"
            style={{ backgroundColor: 'rgba(241,118,13,0.15)', border: '0.1vw solid var(--color-secondary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
            Enc(Ka₁, Kb₁)
          </span>
          <span className="text-[0.65vw]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>Encrypted output</span>
        </div>
      </motion.div>

      <motion.p
        className="text-[1.1vw] text-center max-w-[30vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 15.4 }}
      >
        No single key can decrypt. You need the <strong style={{ color: 'var(--color-text-primary)' }}>exact matching pair</strong>.
      </motion.p>
    </motion.div>
  );
}
