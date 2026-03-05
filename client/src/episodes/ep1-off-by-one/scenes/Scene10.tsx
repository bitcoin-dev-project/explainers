import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, error, muted, delay }: { label: string; error?: boolean; muted?: boolean; delay: number }) {
  return (
    <motion.div
      className="w-[4.5vw] h-[4.5vw] rounded-[0.4vw] flex items-center justify-center text-[1.1vw] font-bold"
      style={{
        backgroundColor: error ? 'var(--color-error)' : muted ? 'var(--color-bg-dark)' : 'var(--color-bg-muted)',
        border: `0.2vw solid ${error ? 'var(--color-error)' : 'var(--color-text-primary)'}`,
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        color: error ? '#fff' : muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
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

export function Scene10() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[2.5vh]"
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
        But Satoshi's code does this
      </motion.p>

      {/* Code snippet */}
      <motion.div
        className="rounded-[0.5vw] px-[2.5vw] py-[1.8vh]"
        style={{
          backgroundColor: 'var(--color-text-primary)',
          border: '0.2vw solid var(--color-text-secondary)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className="text-[1.2vw]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-inverse)' }}>
          <span style={{ color: '#6F7DC1' }}>int</span> nHeightFirst = pindexLast-&gt;nHeight -{' '}
          <motion.span
            className="px-[0.4vw] py-[0.2vh] rounded-[0.2vw] font-bold"
            initial={{ backgroundColor: 'transparent', color: 'var(--color-text-inverse)' }}
            animate={{
              backgroundColor: 'var(--color-error)',
              color: '#fff',
            }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            2015
          </motion.span>
          ;
        </div>
      </motion.div>

      {/* Block diagram with clear epoch grouping */}
      <div className="flex items-center gap-[1vw]">
        {/* Epoch 1 group — ghosted / skipped */}
        <motion.div
          className="flex flex-col items-center gap-[0.8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 }}
        >
          <motion.span
            className="text-[0.9vw] font-bold tracking-[0.08vw] uppercase px-[0.8vw] py-[0.2vh] rounded-full"
            style={{ color: 'var(--color-text-muted)', border: '0.12vw solid var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2.3 }}
          >
            Epoch 1
          </motion.span>
          <motion.div
            className="flex items-center px-[0.8vw] py-[0.8vh] rounded-[0.5vw]"
            style={{ border: '0.15vw dashed var(--color-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 2.4 }}
          >
            <Block label="2015" muted delay={2.5} />
          </motion.div>
        </motion.div>

        <Conn delay={2.7} muted />

        {/* Epoch 2 group — error highlighted */}
        <motion.div
          className="flex flex-col items-center gap-[0.8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
        >
          <motion.span
            className="text-[0.9vw] font-bold tracking-[0.08vw] uppercase px-[0.8vw] py-[0.2vh] rounded-full"
            style={{ color: 'var(--color-error)', border: '0.12vw solid var(--color-error)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
          >
            Epoch 2
          </motion.span>
          <motion.div
            className="flex items-center px-[0.8vw] py-[0.8vh] rounded-[0.5vw]"
            style={{ border: '0.15vw dashed var(--color-error)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.9 }}
          >
            {/* Block 2016 = WRONG START */}
            <div className="flex flex-col items-center gap-[0.5vh]">
              <motion.span
                className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.2vw]"
                style={{ backgroundColor: 'var(--color-error)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2 }}
              >
                START
              </motion.span>
              <Block label="2016" error delay={2.9} />
            </div>

            {/* Arrow connecting START to END */}
            <motion.div
              className="flex items-center mx-[0.3vw]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
            >
              <div className="w-[2vw] h-[0.3vw]" style={{ backgroundColor: 'var(--color-error)' }} />
              <motion.span className="text-[1vw] mx-[0.3vw]" style={{ color: 'var(--color-text-muted)' }}>···</motion.span>
              <div className="w-[2vw] h-[0.3vw]" style={{ backgroundColor: 'var(--color-error)' }} />
            </motion.div>

            {/* Block 4031 = END */}
            <div className="flex flex-col items-center gap-[0.5vh]">
              <motion.span
                className="text-[0.9vw] font-bold px-[0.5vw] py-[0.2vh] rounded-[0.2vw]"
                style={{ backgroundColor: 'var(--color-error)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.0 }}
              >
                END
              </motion.span>
              <Block label="4031" error delay={3.7} />
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
        transition={{ delay: 4.8 }}
      >
        time(<span style={{ color: 'var(--color-error)' }}>4031</span>) − time(<span style={{ color: 'var(--color-error)' }}>2016</span>)
      </motion.div>

      <motion.div
        className="text-[2vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-error)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 5.5, ...springs.snappy }}
      >
        = Only 2015 intervals (one short!)
      </motion.div>

      <motion.p
        className="text-[1.3vw] font-bold"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 6.5 }}
      >
        It skips Block 2015 → the gap between epochs is never measured
      </motion.p>
    </motion.div>
  );
}
