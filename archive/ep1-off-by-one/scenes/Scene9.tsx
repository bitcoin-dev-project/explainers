import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, highlight, muted, delay }: { label: string; highlight?: boolean; muted?: boolean; delay: number }) {
  return (
    <motion.div
      className="w-[4.5vw] h-[4.5vw] rounded-[0.4vw] flex items-center justify-center text-[1.1vw] font-bold"
      style={{
        backgroundColor: highlight ? 'var(--color-primary)' : muted ? 'var(--color-bg-dark)' : 'var(--color-bg-muted)',
        border: '0.2vw solid var(--color-text-primary)',
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        color: highlight ? '#fff' : muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: muted ? 0.35 : 1, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
    >
      {label}
    </motion.div>
  );
}

function Conn({ delay, muted }: { delay: number; muted?: boolean }) {
  return (
    <motion.div
      className="w-[1.5vw] h-[0.2vw]"
      style={{ backgroundColor: 'var(--color-text-muted)' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1, opacity: muted ? 0.35 : 1 }}
      transition={{ delay, duration: 0.2 }}
    />
  );
}

export function Scene9() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3.5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.p
        className="text-[1.5vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        The correct measurement
      </motion.p>

      {/* Block diagram with clear epoch grouping */}
      <div className="flex items-center gap-[1.5vw]">
        {/* Epoch 1 group */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            className="text-[0.9vw] font-bold tracking-[0.08vw] uppercase px-[0.8vw] py-[0.2vh] rounded-full"
            style={{ color: 'var(--color-text-muted)', border: '0.12vw solid var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.5 }}
          >
            Epoch 1
          </motion.span>
          <motion.div
            className="flex items-center px-[1vw] py-[1vh] rounded-[0.5vw]"
            style={{ border: '0.15vw dashed var(--color-text-muted)', opacity: 0.5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.6 }}
          >
            <Block label="0" muted delay={0.6} />
            <Conn delay={0.8} muted />
            <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)', opacity: 0.35 }}>···</motion.span>
            <Conn delay={0.9} muted />
            {/* Block 2015 = START (last block of Epoch 1) */}
            <div className="flex flex-col items-center gap-[0.5vh]">
              <Block label="2015" highlight delay={1.0} />
              <motion.span
                className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.2vw]"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                START
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* Arrow connecting START to END */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
        >
          <div className="w-[2vw] h-[0.3vw]" style={{ backgroundColor: 'var(--color-primary)' }} />
          <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>···</motion.span>
          <div className="w-[2vw] h-[0.3vw]" style={{ backgroundColor: 'var(--color-primary)' }} />
        </motion.div>

        {/* Epoch 2 group */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.span
            className="text-[0.9vw] font-bold tracking-[0.08vw] uppercase px-[0.8vw] py-[0.2vh] rounded-full"
            style={{ color: 'var(--color-primary)', border: '0.12vw solid var(--color-primary)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            Epoch 2
          </motion.span>
          <motion.div
            className="flex items-center px-[1vw] py-[1vh] rounded-[0.5vw]"
            style={{ border: '0.15vw dashed var(--color-primary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
          >
            <Block label="2016" delay={2.0} />
            <Conn delay={2.2} />
            <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>···</motion.span>
            <Conn delay={2.3} />
            {/* Block 4031 = END (last block of Epoch 2) */}
            <div className="flex flex-col items-center gap-[0.5vh]">
              <Block label="4031" highlight delay={2.2} />
              <motion.span
                className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.2vw]"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
              >
                END
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Calculation */}
      <motion.div
        className="text-[1.8vw] font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
      >
        time(<span style={{ color: 'var(--color-primary)' }}>4031</span>) − time(<span style={{ color: 'var(--color-primary)' }}>2015</span>)
      </motion.div>

      <motion.div
        className="text-[2.2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 4.2, ...springs.snappy }}
      >
        = <span style={{ color: 'var(--color-primary)' }}>2016</span> intervals ✓
      </motion.div>
    </motion.div>
  );
}
