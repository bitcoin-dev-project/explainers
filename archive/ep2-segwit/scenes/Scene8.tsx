import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene8() {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.fadeBlur}
    >
      <div className="flex items-center gap-[5vw]">
        {/* Merkle pangolin — large */}
        <motion.img
          src="/Pango.png"
          alt="Merkle the Pangolin"
          className="w-[28vw]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...springs.bouncy }}
        />

        {/* Text side */}
        <div className="flex flex-col gap-[2.5vh]">
          {/* Brand name */}
          <motion.h1
            className="text-[5.5vw] font-bold leading-[1]"
            style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...springs.snappy }}
          >
            Merkle
          </motion.h1>

          {/* Divider line */}
          <motion.div
            className="h-[0.4vh] w-[8vw] rounded-full"
            style={{ backgroundColor: '#EB5234' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />

          {/* Voice: "Follow Merkle for more Bitcoin technical posts" at 0.4s */}
          <motion.p
            className="text-[2.2vw] leading-[1.6] max-w-[30vw]"
            style={{ fontFamily: 'var(--font-display)', color: '#555' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            Follow Merkle for more
            <br />
            Bitcoin technical posts
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
