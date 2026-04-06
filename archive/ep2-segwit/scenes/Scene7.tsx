import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

// The 5-bit values from the witness program decode
const FIVE_BIT_VALS = [
  [25, 0, 2, 18, 22, 30, 12, 28],
  [27, 25, 20, 14, 27, 3, 13, 8],
  [2, 20, 6, 4, 25, 23, 23, 20],
  [21, 24, 24, 23, 13, 18, 29, 8],
];

const BINARY_STREAM =
  '11001000000001010010101101111001100111001101111001101000111011011000110110101000000101010000110001001100110111101111010010101110001100010111011011001011101010' +
  '00';

const BYTE_GROUPS = BINARY_STREAM.match(/.{1,8}/g) || [];

const HEX_BYTES = [
  'c8', '05', '2b', '79', '9c', 'de', '68', 'ed',
  '8d', 'a8', '15', '0c', '4c', 'de', 'f4', 'ae',
  '31', '76', 'cb', 'a8',
];

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 1: WPKH grand reveal — voice says "Converting to hexadecimal" at ~12.9s
    const timer = setTimeout(() => setPhase(1), 12000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.fadeBlur}
    >
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="conversion"
            className="flex flex-col items-center gap-[2.5vh]"
            exit={{ opacity: 0, y: -40, transition: { duration: 0.5 } }}
          >
            {/* Voice: "We take those 32 five-bit values" at 0.4s */}
            <motion.h3
              className="text-[3.2vw] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...springs.snappy }}
            >
              Step 4: Convert to witness program
            </motion.h3>

            {/* 5-bit values */}
            <motion.div
              className="px-[2vw] py-[1.2vh] rounded-[0.5vw] flex flex-wrap gap-x-[0.6vw] gap-y-[0.3vh] max-w-[50vw] justify-center"
              style={{ backgroundColor: '#1C1C1C' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, ...springs.snappy }}
            >
              <div className="w-full text-[0.9vw] font-bold mb-[0.3vh]" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>
                5-bit values from witness decode
              </div>
              {FIVE_BIT_VALS.flat().map((v, i) => (
                <motion.span
                  key={i}
                  className="text-[1.2vw] font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: '#E8A838' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 + i * 0.02 }}
                >
                  {String(v).padStart(2, ' ')}
                </motion.span>
              ))}
            </motion.div>

            {/* Voice: "concatenate...into a single binary stream" ~3.0-7.5s */}
            <motion.div
              className="flex items-center gap-[1.5vw]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.0 }}
            >
              <span className="text-[1.5vw]" style={{ fontFamily: 'var(--font-display)', color: '#888' }}>
                5-bit groups
              </span>
              <motion.span
                className="text-[2vw]"
                style={{ color: '#EB5234' }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 4.8 }}
              >
                →
              </motion.span>
              <span className="text-[1.5vw]" style={{ fontFamily: 'var(--font-display)', color: '#888' }}>
                binary stream
              </span>
              <motion.span
                className="text-[2vw]"
                style={{ color: '#EB5234' }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 5.5 }}
              >
                →
              </motion.span>
              <span className="text-[1.5vw]" style={{ fontFamily: 'var(--font-display)', color: '#888' }}>
                8-bit bytes
              </span>
            </motion.div>

            {/* Binary bytes — voice: "binary stream" at ~6.5s */}
            <motion.div
              className="px-[2vw] py-[1.2vh] rounded-[0.5vw] flex flex-wrap gap-x-[0.6vw] gap-y-[0.4vh] max-w-[60vw] justify-center"
              style={{ backgroundColor: '#1C1C1C' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 6.5, ...springs.snappy }}
            >
              {BYTE_GROUPS.map((byte, i) => (
                <motion.span
                  key={i}
                  className="text-[1.1vw] font-bold px-[0.3vw] py-[0.2vh] rounded-[0.2vw]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#fff',
                    backgroundColor: i < 20 ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 6.8 + i * 0.04 }}
                >
                  {byte}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div
            key="wpkh-reveal"
            className="flex flex-col items-center gap-[4vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Small context label */}
            <motion.p
              className="text-[1.5vw]"
              style={{ fontFamily: 'var(--font-display)', color: '#888' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Converting to hexadecimal gives us...
            </motion.p>

            {/* WPKH hex — the star of the show */}
            <motion.div
              className="px-[3.5vw] py-[3vh] rounded-[0.8vw] flex flex-wrap gap-x-[1vw] gap-y-[1vh] max-w-[65vw] justify-center"
              style={{
                backgroundColor: '#1C1C1C',
                boxShadow: '0 0 4vw rgba(235,82,52,0.25), 0.4vw 0.4vw 0 rgba(0,0,0,0.3)',
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, ...springs.bouncy }}
            >
              {HEX_BYTES.map((hex, i) => (
                <motion.span
                  key={i}
                  className="text-[3vw] font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: '#EB5234' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.08, ...springs.snappy }}
                >
                  {hex}
                </motion.span>
              ))}
            </motion.div>

            {/* Divider */}
            <motion.div
              className="h-[0.4vh] w-[12vw] rounded-full"
              style={{ backgroundColor: '#EB5234' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 3.5, duration: 0.5 }}
            />

            {/* Voice: "witness public key hash" ~15.5s (= ~3.5s into phase) */}
            <motion.h2
              className="text-[3.5vw] font-bold text-center"
              style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8, ...springs.bouncy }}
            >
              Witness Public Key Hash
            </motion.h2>

            <motion.span
              className="text-[2vw] font-bold"
              style={{ fontFamily: 'var(--font-mono)', color: '#EB5234' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 4.5, ...springs.bouncy }}
            >
              (WPKH)
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
