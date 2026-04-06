import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 12 — Bob's inventory (one idea: what does Bob hold now?) */
export function Scene12() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[4vh] px-[3vw]"
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

      <motion.p
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        Bob now holds three things:
      </motion.p>

      <div className="flex flex-col gap-[2vh]">
        {/* Item 1 */}
        <motion.div className="flex items-center gap-[1vw]"
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.5, ...springs.snappy }}>
          <div className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-[0.9vw] font-bold"
            style={{ backgroundColor: 'var(--color-secondary)', color: '#fff' }}>1</div>
          <div className="flex flex-col">
            <span className="text-[1.2vw] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              Alice's key for her actual input
            </span>
            <div className="flex items-center gap-[0.5vw] mt-[0.3vh]">
              <span className="text-[0.9vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                Alice chose 1, so she sends:
              </span>
              <motion.span className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.15vw]"
                style={{ backgroundColor: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 6.0, ...springs.bouncy }}>
                Ka₁
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Item 2 */}
        <motion.div className="flex items-center gap-[1vw]"
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 9.5, ...springs.snappy }}>
          <div className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-[0.9vw] font-bold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>2</div>
          <div className="flex flex-col">
            <span className="text-[1.2vw] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              His own key from Oblivious Transfer
            </span>
            <div className="flex items-center gap-[0.5vw] mt-[0.3vh]">
              <span className="text-[0.9vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                Bob chose 1, so he received:
              </span>
              <motion.span className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.15vw]"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 12.0, ...springs.bouncy }}>
                Kb₁
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Item 3 */}
        <motion.div className="flex items-center gap-[1vw]"
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 15.0, ...springs.snappy }}>
          <div className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-[0.9vw] font-bold"
            style={{ backgroundColor: 'var(--color-text-primary)', color: '#fff' }}>3</div>
          <span className="text-[1.2vw] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            The entire garbled table
          </span>
        </motion.div>
      </div>

      <motion.p
        className="text-[1.3vw] text-center mt-[1vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 19.0 }}
      >
        He has the keys <strong style={{ color: 'var(--color-secondary)' }}>Ka₁</strong> and{' '}
        <strong style={{ color: 'var(--color-primary)' }}>Kb₁</strong>.
        <br />
        Now he tries to decrypt each row of the garbled table...
      </motion.p>
    </motion.div>
  );
}
