import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene4() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[4vh]"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.fadeBlur}
    >
      {/* Voice: "The data splits into two pieces" at 0.4s */}
      <motion.p
        className="text-[2.8vw] text-center"
        style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Data part consists of two parts:
      </motion.p>

      {/* Address split into labeled sections */}
      <motion.div
        className="flex items-start gap-0 mt-[2vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {/* bc1 dimmed */}
        <div
          className="px-[0.6vw] py-[1vh] text-[2vw] font-bold"
          style={{
            fontFamily: 'var(--font-mono)',
            color: '#999',
            backgroundColor: 'rgba(0,0,0,0.05)',
            border: '0.15vw solid #999',
            borderRadius: '0.3vw 0 0 0.3vw',
          }}
        >
          bc1
        </div>

        {/* Version "q" — Voice: "first character...witness version" at ~2.7s */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
        >
          <div
            className="px-[0.6vw] py-[1vh] text-[2vw] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#EB5234',
              backgroundColor: 'rgba(235,82,52,0.1)',
              borderTop: '0.15vw solid #1C1C1C',
              borderBottom: '0.15vw solid #1C1C1C',
            }}
          >
            q
          </div>
          {/* Voice: "witness version" label at ~4.2s */}
          <motion.div
            className="flex flex-col items-center mt-[1vh]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.9 }}
          >
            <div className="w-[0.12vw] h-[3vh]" style={{ backgroundColor: '#EB5234' }} />
            <motion.span
              className="text-[2.1vw] font-bold mt-[0.5vh]"
              style={{ fontFamily: 'var(--font-display)', color: '#EB5234' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 4.2, ...springs.snappy }}
            >
              version
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Witness program — Voice: "the rest is the witness program" at ~6.0s */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.3 }}
        >
          <div
            className="px-[0.6vw] py-[1vh] text-[2vw] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#1C1C1C',
              backgroundColor: '#fff',
              border: '0.15vw solid #1C1C1C',
              borderLeft: 'none',
              borderRadius: '0 0.3vw 0.3vw 0',
              boxShadow: '0.15vw 0.15vw 0 #1C1C1C',
            }}
          >
            eqzjk7vume5wmrdgz5xyehh54cchdjag6jdmkj
          </div>
          {/* Voice: "witness program" label at ~7.2s */}
          <motion.div
            className="flex flex-col items-center mt-[1vh]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 6.7 }}
          >
            <div className="w-[0.12vw] h-[3vh]" style={{ backgroundColor: '#1C1C1C' }} />
            <motion.span
              className="text-[2.1vw] font-bold mt-[0.5vh]"
              style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 7.0, ...springs.snappy }}
            >
              witness program
            </motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
