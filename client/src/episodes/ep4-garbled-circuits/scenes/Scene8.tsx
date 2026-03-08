import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function KeyPair({ bit, keyName, color, delay }: { bit: string; keyName: string; color: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-[0.8vw]"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ...springs.snappy }}
    >
      <div
        className="w-[2.5vw] h-[2.5vw] rounded-[0.2vw] flex items-center justify-center text-[1.1vw] font-bold"
        style={{
          backgroundColor: 'var(--color-bg-muted)',
          border: '0.12vw solid var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
        }}
      >
        {bit}
      </div>
      <span className="text-[1.2vw]" style={{ color: 'var(--color-text-muted)' }}>→</span>
      <motion.div
        className="px-[1vw] py-[0.6vh] rounded-[0.25vw] text-[0.9vw] font-bold"
        style={{
          backgroundColor: color,
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0.12vw 0.12vw 0 rgba(0,0,0,0.15)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.2, ...springs.bouncy }}
      >
        {keyName}
      </motion.div>
    </motion.div>
  );
}

export function Scene8() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[3vh] px-[3vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      {/* Step + Role badge */}
      <motion.div className="flex items-center gap-[1vw]"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, ...springs.snappy }}>
        <span className="px-[0.8vw] py-[0.3vh] rounded-full text-[0.85vw] font-bold"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
          Step 1
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
        transition={{ delay: 1.4 }}
      >
        Replace bits with <span style={{ color: 'var(--color-secondary)' }}>random keys</span>
      </motion.p>

      <div className="flex gap-[4vw]">
        {/* Alice's keys */}
        <div className="flex flex-col gap-[1.5vh]">
          <motion.span
            className="text-[1.1vw] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.4 }}
          >
            Alice's wire
          </motion.span>
          <KeyPair bit="0" keyName="Ka₀ = x7f2..." color="var(--color-secondary)" delay={6.4} />
          <KeyPair bit="1" keyName="Ka₁ = m9k1..." color="var(--color-secondary)" delay={9.4} />
        </div>

        {/* Divider */}
        <motion.div
          className="w-[0.1vw] self-stretch"
          style={{ backgroundColor: 'var(--color-text-muted)', opacity: 0.2 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 5.0, duration: 0.4 }}
        />

        {/* Bob's keys */}
        <div className="flex flex-col gap-[1.5vh]">
          <motion.span
            className="text-[1.1vw] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 11.4 }}
          >
            Bob's wire
          </motion.span>
          <KeyPair bit="0" keyName="Kb₀ = p3j8..." color="var(--color-primary)" delay={12.4} />
          <KeyPair bit="1" keyName="Kb₁ = r2d4..." color="var(--color-primary)" delay={14.4} />
        </div>
      </div>

      <motion.p
        className="text-[1.2vw] text-center max-w-[30vw] mt-[1vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 19.4 }}
      >
        The keys look <strong style={{ color: 'var(--color-text-primary)' }}>nothing like the original bits</strong>.
      </motion.p>
    </motion.div>
  );
}
