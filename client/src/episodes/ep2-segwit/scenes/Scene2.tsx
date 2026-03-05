import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene2() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[5vh]"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Voice: "Unlike legacy addresses, SegWit uses..." at 0.4s */}
      <motion.p
        className="text-[3vw] text-center"
        style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        SegWit address uses
      </motion.p>

      {/* Voice: "...called Bech32" at ~4.0s */}
      <motion.h2
        className="text-[7vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.5, ...springs.bouncy }}
      >
        Bech32
      </motion.h2>

      {/* Voice: "Not Base58" at ~5.5s */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.5 }}
      >
        <span
          className="text-[2.8vw]"
          style={{ fontFamily: 'var(--font-display)', color: '#888' }}
        >
          not base58 check
        </span>
        <motion.div
          className="absolute top-1/2 left-[-2%] right-[-2%] h-[0.35vw]"
          style={{ backgroundColor: '#EB5234' }}
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 6.5, duration: 0.5, ease: 'circOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
