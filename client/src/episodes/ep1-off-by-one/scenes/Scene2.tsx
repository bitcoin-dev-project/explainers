import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

function Block({ label, highlight, small, delay }: { label: string; highlight?: boolean; small?: boolean; delay: number }) {
  const size = small ? 'w-[3.2vw] h-[3.2vw]' : 'w-[4vw] h-[4vw]';
  const text = small ? 'text-[0.9vw]' : 'text-[1.1vw]';
  return (
    <motion.div
      className={`${size} rounded-[0.3vw] flex items-center justify-center ${text} font-bold`}
      style={{
        backgroundColor: highlight ? 'var(--color-primary)' : 'var(--color-bg-muted)',
        border: '0.2vw solid var(--color-text-primary)',
        boxShadow: '0.2vw 0.2vw 0 var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
    >
      {label}
    </motion.div>
  );
}

function Conn({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-[1.2vw] h-[0.18vw] mx-[0.05vw]"
      style={{ backgroundColor: 'var(--color-text-muted)' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.2 }}
    />
  );
}

export function Scene2() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3.5vh]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.slideLeft}
    >
      <motion.h2
        className="text-[3vw] font-bold text-center leading-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Every <span style={{ color: 'var(--color-primary)' }}>2016 blocks</span>,<br />
        Bitcoin adjusts difficulty
      </motion.h2>

      {/* Two epochs side by side */}
      <div className="flex items-center gap-[1.5vw] mt-[2vh]">
        {/* Epoch 1 */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <motion.span
            className="text-[1vw] font-bold tracking-[0.1vw] uppercase px-[1vw] py-[0.3vh] rounded-full"
            style={{ color: 'var(--color-secondary)', border: '0.15vw solid var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Epoch 1
          </motion.span>
          <div className="flex items-center">
            <Block label="0" small delay={1.4} />
            <Conn delay={1.6} />
            <Block label="1" small delay={1.7} />
            <Conn delay={1.9} />
            <motion.span
              className="text-[1.2vw] mx-[0.4vw] font-bold"
              style={{ color: 'var(--color-text-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
            >
              ···
            </motion.span>
            <Conn delay={2.1} />
            <Block label="2015" small delay={2.2} />
          </div>
        </motion.div>

        {/* Retarget boundary */}
        <motion.div
          className="flex flex-col items-center gap-[0.5vh]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.0, ...springs.bouncy }}
        >
          <motion.div
            className="px-[0.8vw] py-[0.5vh] rounded-[0.3vw] text-[0.9vw] font-bold"
            style={{
              backgroundColor: 'var(--color-primary)',
              border: '0.15vw solid var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              color: '#fff',
            }}
          >
            Retarget
          </motion.div>
          <svg width="0.8vw" height="2vh" viewBox="0 0 10 20">
            <path d="M5 0 L5 14 L2 11 M5 14 L8 11" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
          </svg>
        </motion.div>

        {/* Epoch 2 */}
        <motion.div
          className="flex flex-col items-center gap-[1vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          <motion.span
            className="text-[1vw] font-bold tracking-[0.1vw] uppercase px-[1vw] py-[0.3vh] rounded-full"
            style={{ color: 'var(--color-secondary)', border: '0.15vw solid var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.7 }}
          >
            Epoch 2
          </motion.span>
          <div className="flex items-center">
            <Block label="2016" small highlight delay={3.9} />
            <Conn delay={4.1} />
            <Block label="2017" small delay={4.2} />
            <Conn delay={4.4} />
            <motion.span
              className="text-[1.2vw] mx-[0.4vw] font-bold"
              style={{ color: 'var(--color-text-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.5 }}
            >
              ···
            </motion.span>
            <Conn delay={4.6} />
            <Block label="4031" small delay={4.7} />
          </div>
        </motion.div>
      </div>

      {/* Explanation */}
      <motion.p
        className="text-[1.4vw] font-bold text-center mt-[1vh]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.5 }}
      >
        At each boundary, Bitcoin recalculates difficulty
      </motion.p>
    </motion.div>
  );
}
