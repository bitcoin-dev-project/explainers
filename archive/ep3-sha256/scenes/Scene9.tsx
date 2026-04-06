import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const MESSAGE_BITS = '01100010011010010111010001100011011011110110100101101110';

export function Scene9() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Step header */}
      <motion.h3
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Step 2:
      </motion.h3>

      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Append <span style={{ color: 'var(--color-primary)' }}>"1"</span> bit to mark end of message
      </motion.p>

      {/* Binary string with appended "1" */}
      <motion.div
        className="text-[1.1vw] max-w-[60vw] text-center leading-[1.6] px-[2vw] py-[1.5vh] rounded-[0.4vw]"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'var(--color-bg-muted)',
          border: '0.15vw solid var(--color-text-muted)',
          wordBreak: 'break-all',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span style={{ color: 'var(--color-text-primary)' }}>{MESSAGE_BITS}</span>
        <motion.span
          className="font-bold"
          initial={{ opacity: 0, color: 'var(--color-text-primary)' }}
          animate={{
            opacity: 1,
            color: 'var(--color-primary)',
          }}
          transition={{ delay: 2.5, duration: 0.6 }}
        >
          1
        </motion.span>
      </motion.div>

      {/* Label for the appended bit */}
      <motion.div
        className="flex items-center gap-[1vw]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5 }}
      >
        <div className="w-[2vw] h-[0.2vw]" style={{ backgroundColor: 'var(--color-primary)' }} />
        <span
          className="text-[1.1vw] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}
        >
          "1" marker (end of message)
        </span>
      </motion.div>
    </motion.div>
  );
}
