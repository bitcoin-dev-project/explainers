import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene11() {
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
          Step 4
        </span>
        <div className="flex items-center gap-[0.4vw]">
          <img src="/alice.png" alt="Alice" className="w-[2.5vw] h-[2.5vw] object-contain" />
          <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>Alice</span>
        </div>
        <span className="text-[0.85vw]" style={{ color: 'var(--color-text-muted)' }}>+</span>
        <div className="flex items-center gap-[0.4vw]">
          <img src="/bob.png" alt="Bob" className="w-[2.5vw] h-[2.5vw] object-contain" />
          <span className="text-[0.85vw] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>Bob</span>
        </div>
      </motion.div>

      <motion.p
        className="text-[1.8vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        But wait... how does Bob get his key?
      </motion.p>

      {/* OT diagram */}
      <motion.div
        className="flex items-center gap-[2vw]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.0 }}
      >
        {/* Alice side */}
        <motion.div className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.0, ...springs.snappy }}>
          <img src="/alice.png" alt="Alice" className="w-[5vw] h-[5vw] object-contain" />
          <div className="flex flex-col gap-[0.5vh]">
            <motion.div className="px-[0.8vw] py-[0.4vh] rounded-[0.2vw] text-[0.8vw] font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 4.0, ...springs.bouncy }}>Kb₀</motion.div>
            <motion.div className="px-[0.8vw] py-[0.4vh] rounded-[0.2vw] text-[0.8vw] font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 5.0, ...springs.bouncy }}>Kb₁</motion.div>
          </div>
          <span className="text-[0.7vw]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
            has both of Bob's keys
          </span>
        </motion.div>

        {/* OT box */}
        <motion.div className="flex items-center gap-[0.5vw]"
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 8.0, ...springs.bouncy }}>
          <div className="w-[2vw] h-[0.15vw]" style={{ backgroundColor: 'var(--color-text-muted)' }} />
          <div className="px-[1.2vw] py-[1.5vh] rounded-[0.4vw] flex flex-col items-center gap-[0.5vh]"
            style={{ backgroundColor: 'var(--color-text-primary)', border: '0.15vw solid var(--color-secondary)' }}>
            <svg width="2vw" height="2.5vw" viewBox="0 0 36 44" fill="none">
              <rect x="3" y="16" width="30" height="24" rx="4" fill="var(--color-secondary)" />
              <path d="M11,16 V10 A7,7 0 0,1 25,10 V16" stroke="var(--color-secondary)" strokeWidth="3" fill="none" />
              <circle cx="18" cy="28" r="3" fill="#1C1C1C" />
            </svg>
            <span className="text-[0.75vw] font-bold leading-tight text-center"
              style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
              Oblivious{'\n'}Transfer
            </span>
          </div>
          <div className="w-[2vw] h-[0.15vw]" style={{ backgroundColor: 'var(--color-text-muted)' }} />
        </motion.div>

        {/* Bob side */}
        <motion.div className="flex flex-col items-center gap-[1.5vh]"
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 6.0, ...springs.snappy }}>
          <img src="/bob.png" alt="Bob" className="w-[5vw] h-[5vw] object-contain" />
          <motion.div className="px-[0.8vw] py-[0.4vh] rounded-[0.2vw] text-[0.8vw] font-bold"
            style={{
              backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 0.6vw rgba(241,118,13,0.4)',
            }}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 14.0, ...springs.bouncy }}>Kb₁ ✓</motion.div>
          <span className="text-[0.7vw]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
            gets exactly one, doesn't know which
          </span>
        </motion.div>
      </motion.div>

      <motion.div className="flex flex-col items-center gap-[0.5vh] mt-[1vh]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 17.0 }}>
        <p className="text-[1.2vw] text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Bob gets the key matching his private choice.
        </p>
        <p className="text-[1.2vw] text-center font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>
          Alice never learns which one he picked.
        </p>
      </motion.div>
    </motion.div>
  );
}
