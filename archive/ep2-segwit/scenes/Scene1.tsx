import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene1() {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.fadeBlur}
    >
      <div className="flex flex-col items-center gap-[3vh]">
        {/* Episode label — voice: "Episode 2" at ~0.4s */}
        <motion.p
          className="text-[1.6vw] font-bold tracking-[0.5vw]"
          style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          EPISODE 2
        </motion.p>

        {/* Main title — voice: "...SegWit address..." at ~1.5s */}
        <motion.h1
          className="text-[9vw] font-bold leading-[1]"
          style={{ fontFamily: 'var(--font-display)', color: '#EB5234' }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, ...springs.snappy }}
        >
          SegWit Address
        </motion.h1>

        {/* Divider */}
        <motion.div
          className="w-[10vw] h-[0.4vw] rounded-full"
          style={{ backgroundColor: '#1C1C1C' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        />

        {/* Diamond + SEGWIT row — voice: "...actually works" at ~3.5s */}
        <motion.div
          className="flex items-center gap-[2vw] mt-[1vh]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2 }}
        >
          {/* Small diamond */}
          <div className="relative" style={{ width: '4vw', height: '4vw' }}>
            <div
              style={{
                position: 'absolute', inset: 0,
                border: '0.2vw solid #1C1C1C',
                transform: 'rotate(45deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '25%', left: '25%', width: '50%', height: '50%',
                border: '0.2vw solid #1C1C1C',
                transform: 'rotate(45deg)',
              }}
            />
          </div>

          {/* SEGWIT letters */}
          <div className="flex items-center">
            {['S', 'E', 'G', 'W', 'I', 'T'].map((letter, i) => (
              <motion.span
                key={i}
                className="text-[2.8vw] font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: letter === 'W' ? '#fff' : '#1C1C1C',
                  backgroundColor: letter === 'W' ? '#EB5234' : 'transparent',
                  padding: '0.2vh 0.4vw',
                  letterSpacing: '0.3vw',
                  borderRadius: letter === 'W' ? '0.2vw' : '0',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 + i * 0.08 }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
