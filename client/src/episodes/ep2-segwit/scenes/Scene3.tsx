import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export function Scene3() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[5vh]"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Voice: "Here's a real SegWit address" at 0.4s */}
      <motion.h3
        className="text-[3.5vw] font-bold"
        style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Address Example
      </motion.h3>

      {/* Voice: "It has three parts" at ~2.6s */}
      <motion.div
        className="flex items-start gap-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7 }}
      >
        {/* "bc" — Voice: "bc tells us this is Bitcoin" at ~3.7s */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
        >
          <div
            className="px-[0.8vw] py-[1.2vh] text-[2.4vw] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#EB5234',
              backgroundColor: 'rgba(235,82,52,0.1)',
              border: '0.2vw solid #1C1C1C',
              borderRight: 'none',
              borderRadius: '0.4vw 0 0 0.4vw',
            }}
          >
            bc
          </div>
          {/* Voice: "...Bitcoin mainnet" at ~4.8s */}
          <motion.div
            className="flex flex-col items-center mt-[1.5vh]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.2 }}
          >
            <div className="w-[0.15vw] h-[2vh]" style={{ backgroundColor: '#EB5234' }} />
            <span className="text-[1.7vw] font-bold mt-[0.5vh]" style={{ fontFamily: 'var(--font-display)', color: '#EB5234' }}>
              means<br />bitcoin
            </span>
          </motion.div>
        </motion.div>

        {/* "1" — Voice: "Then a 1 as delimiter" at ~6.3s */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.7 }}
        >
          <div
            className="px-[0.6vw] py-[1.2vh] text-[2.4vw] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#1C1C1C',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderTop: '0.2vw solid #1C1C1C',
              borderBottom: '0.2vw solid #1C1C1C',
            }}
          >
            1
          </div>
          {/* Voice: "...as a delimiter" at ~6.9s */}
          <motion.div
            className="flex flex-col items-center mt-[1.5vh]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 6.5 }}
          >
            <div className="w-[0.15vw] h-[2vh]" style={{ backgroundColor: '#1C1C1C' }} />
            <span className="text-[1.7vw] font-bold mt-[0.5vh]" style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}>
              Delimiter
            </span>
          </motion.div>
        </motion.div>

        {/* Data part */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2 }}
        >
          <div
            className="px-[0.8vw] py-[1.2vh] text-[2.4vw] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#1C1C1C',
              backgroundColor: '#fff',
              border: '0.2vw solid #1C1C1C',
              borderLeft: 'none',
              borderRadius: '0 0.4vw 0.4vw 0',
              boxShadow: '0.2vw 0.2vw 0 #1C1C1C',
            }}
          >
            qeqzjk7vume5wmrdgz5xyehh54cchdjag6jdmkj
          </div>
          {/* Voice: "everything after that is the data" at ~9.2s */}
          <motion.div
            className="flex flex-col items-center mt-[1.5vh]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 9.2 }}
          >
            <div className="w-[0.15vw] h-[2vh]" style={{ backgroundColor: '#1C1C1C' }} />
            <span className="text-[1.7vw] font-bold mt-[0.5vh]" style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}>
              Data part
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
