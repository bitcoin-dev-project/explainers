import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const BECH32_ROWS = [
  ['q', 'p', 'z', 'r', 'y', '9', 'x', '8'],
  ['g', 'f', '2', 't', 'v', 'd', 'w', '0'],
  ['s', '3', 'j', 'n', '5', '4', 'k', 'h'],
  ['c', 'e', '6', 'm', 'u', 'a', '7', 'l'],
];
const ROW_OFFSETS = [0, 8, 16, 24];

const ADDR_PARTS = [
  { text: 'bc1', key: 'hrp' },
  { text: 'q', key: 'version' },
  { text: 'eqzjk7vume5wmrdgz5xyehh54cchdjag', key: 'witness' },
  { text: '6jdmkj', key: 'checksum' },
];

const COORD = '#4ECDC4';

const STEPS = [
  {
    title: 'Step 1: Extract the version',
    highlightKey: 'version',
    ex: { char: 'q', row: 0, col: 0, offset: 0, value: 0 },
  },
  {
    title: 'Step 2: Decode the witness program',
    highlightKey: 'witness',
    ex: { char: 'e', row: 3, col: 1, offset: 24, value: 25 },
  },
  {
    title: 'Step 3: Decode the checksum',
    highlightKey: 'checksum',
    ex: { char: '6', row: 3, col: 2, offset: 24, value: 26 },
  },
];

const WITNESS_CHARS = [
  ['e', 'q', 'z', 'j', 'k', '7', 'v', 'u'],
  ['m', 'e', '5', 'w', 'm', 'r', 'd', 'g'],
  ['z', '5', 'x', 'y', 'e', 'h', 'h', '5'],
  ['4', 'c', 'c', 'h', 'd', 'j', 'a', 'g'],
];
const WITNESS_VALS = [
  [25, 0, 2, 18, 22, 30, 12, 28],
  [27, 25, 20, 14, 27, 3, 13, 8],
  [2, 20, 6, 4, 25, 23, 23, 20],
  [21, 24, 24, 23, 13, 18, 29, 8],
];

const CHECKSUM_CHARS = ['6', 'j', 'd', 'm', 'k', 'j'];
const CHECKSUM_VALS = [26, 18, 13, 27, 22, 18];

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const [cellHl, setCellHl] = useState(false);
  const [coordHl, setCoordHl] = useState(false);

  useEffect(() => {
    setCellHl(false);
    setCoordHl(false);
    // Phase 0: table highlight at ~5.6s (voice: "q sits at row zero, column zero")
    // Phase 1/2: highlight shortly after phase starts
    const base = phase === 0 ? 5600 : 1500;
    const t1 = setTimeout(() => setCellHl(true), base);
    const t2 = setTimeout(() => setCoordHl(true), base + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  useEffect(() => {
    // Phase transitions synced to voiceover:
    // Voice says "Next, we decode..." at ~13.5s audio = ~13.9s scene
    // Voice says "Finally, the last 6..." at ~20.5s audio = ~20.9s scene
    const timers = [
      setTimeout(() => setPhase(1), 14000),
      setTimeout(() => setPhase(2), 21000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const step = STEPS[phase];
  const ex = step.ex;

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center pt-[10vh] gap-[2vh]"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Title — fixed-height container */}
      <div className="h-[5vh] flex items-center">
        <AnimatePresence mode="wait">
          <motion.h3
            key={phase}
            className="text-[3vw] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {step.title}
          </motion.h3>
        </AnimatePresence>
      </div>

      {/* Address — persistent, highlight shifts */}
      <motion.div
        className="flex items-center px-[1.5vw] py-[1vh] rounded-[0.3vw]"
        style={{ backgroundColor: '#fff', border: '0.15vw solid #ccc' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {ADDR_PARTS.map((part) => (
          <motion.span
            key={part.key}
            className="text-[1.8vw] font-bold px-[0.5vw] py-[0.3vh]"
            style={{ fontFamily: 'var(--font-mono)', borderRadius: '0.2vw' }}
            animate={{
              color: part.key === step.highlightKey ? '#EB5234' : '#bbb',
              backgroundColor: part.key === step.highlightKey ? 'rgba(235,82,52,0.12)' : 'transparent',
            }}
            transition={{ duration: 0.4 }}
          >
            {part.text}
          </motion.span>
        ))}
      </motion.div>

      {/* Table + step content — absolute positioning keeps table fixed */}
      <div className="relative w-[80vw] mt-[1vh]" style={{ minHeight: '55vh' }}>
        {/* Bech32 table — absolute left, never moves */}
        <div className="absolute left-0 top-0">
          <motion.div
            className="px-[1.5vw] py-[1.5vh] rounded-[0.5vw]"
            style={{ backgroundColor: '#1C1C1C' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, ...springs.snappy }}
          >
            <div className="text-[1.1vw] font-bold mb-[1vh] text-center" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>
              Bech32 charset
            </div>
            <div className="flex gap-[1.1vw] mb-[0.5vh] pl-[3vw]">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <motion.span
                  key={n}
                  className="text-[1vw] w-[2vw] text-center font-bold"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  animate={{ color: (coordHl && n === ex.col) ? COORD : '#555' }}
                  transition={{ duration: 0.4 }}
                >
                  {n}
                </motion.span>
              ))}
            </div>
            {BECH32_ROWS.map((row, ri) => (
              <motion.div
                key={ri}
                className="flex items-center gap-[1.1vw]"
                style={{ minHeight: '4vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + ri * 0.1 }}
              >
                <motion.span
                  className="text-[1vw] w-[2.5vw] text-right font-bold"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  animate={{ color: (coordHl && ri === ex.row) ? COORD : '#555' }}
                  transition={{ duration: 0.4 }}
                >
                  +{ROW_OFFSETS[ri]}
                </motion.span>
                {row.map((ch, ci) => {
                  const isEx = ri === ex.row && ci === ex.col;
                  return (
                    <motion.span
                      key={ci}
                      className="text-[1.5vw] font-bold w-[2vw] text-center"
                      style={{ fontFamily: 'var(--font-mono)', borderRadius: '0.15vw' }}
                      animate={{
                        color: (cellHl && isEx) ? '#EB5234' : '#fff',
                        backgroundColor: (cellHl && isEx) ? 'rgba(235,82,52,0.3)' : 'transparent',
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {ch}
                    </motion.span>
                  );
                })}
              </motion.div>
            ))}
          </motion.div>

          {/* Small hint — only visible in Phase 0 */}
          <motion.p
            className="text-[1vw] mt-[1vh] font-bold text-center"
            style={{ fontFamily: 'var(--font-mono)' }}
            animate={{ opacity: (phase === 0 && coordHl) ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <span style={{ color: '#888' }}>value = </span>
            <span style={{ color: COORD }}>row</span>
            <span style={{ color: '#888' }}> + </span>
            <span style={{ color: COORD }}>col</span>
          </motion.p>
        </div>

        {/* Step content — absolute right, table stays put */}
        <div className="absolute left-[35vw] top-0">
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="version"
                className="flex flex-col items-center gap-[3vh] mt-[3vh]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Voice: "q sits at row zero, column zero" at ~6.0s */}
                <motion.div
                  className="flex items-center gap-[2vw]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.4 }}
                >
                  <div className="flex flex-col items-center gap-[0.5vh]">
                    <span className="text-[1.1vw]" style={{ fontFamily: 'var(--font-display)', color: '#888' }}>char</span>
                    <div
                      className="text-[4vw] font-bold px-[1.3vw] py-[0.5vh] rounded-[0.3vw]"
                      style={{ fontFamily: 'var(--font-mono)', backgroundColor: '#1C1C1C', color: '#EB5234' }}
                    >
                      q
                    </div>
                  </div>
                  <motion.span
                    className="text-[3.5vw] font-bold"
                    style={{ color: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 6.7 }}
                  >
                    →
                  </motion.span>
                  <motion.div
                    className="flex flex-col items-center gap-[0.5vh]"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 7.8, ...springs.bouncy }}
                  >
                    <span className="text-[1.1vw]" style={{ fontFamily: 'var(--font-display)', color: '#888' }}>value</span>
                    <div
                      className="text-[4vw] font-bold px-[1.3vw] py-[0.5vh] rounded-[0.3vw]"
                      style={{ fontFamily: 'var(--font-mono)', backgroundColor: '#1C1C1C', color: '#E8A838' }}
                    >
                      0
                    </div>
                  </motion.div>
                </motion.div>
                {/* Voice: "witness version is zero" at ~10.0s */}
                <motion.p
                  className="text-[2.5vw] font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 10.0, ...springs.snappy }}
                >
                  witness version = 0
                </motion.p>
              </motion.div>
            )}

            {phase === 1 && (
              <motion.div
                key="witness"
                className="flex flex-col gap-[2vh] mt-[1vh]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Voice (in-phase): "decode all 32 witness characters" ~0-3s */}
                <motion.div
                  className="flex items-center gap-[1vw]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="px-[0.8vw] py-[0.8vh] rounded-[0.3vw]" style={{ backgroundColor: '#1C1C1C' }}>
                    <div className="text-[0.75vw] mb-[0.3vh] font-bold" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>chars</div>
                    {WITNESS_CHARS.map((row, i) => (
                      <motion.div
                        key={i}
                        className="text-[1vw] font-bold"
                        style={{ fontFamily: 'var(--font-mono)', color: '#EB5234', lineHeight: '2', letterSpacing: '0.08vw' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0 + i * 0.2 }}
                      >
                        {row.join(' ')}
                      </motion.div>
                    ))}
                  </div>
                  {/* Voice: "Each one gives us a 5-bit value" ~3.4-6s */}
                  <motion.span
                    className="text-[1.5vw] font-bold"
                    style={{ color: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.4 }}
                  >
                    →
                  </motion.span>
                  <motion.div
                    className="px-[0.8vw] py-[0.8vh] rounded-[0.3vw]"
                    style={{ backgroundColor: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.9, ...springs.snappy }}
                  >
                    <div className="text-[0.75vw] mb-[0.3vh] font-bold" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>5-bit values</div>
                    {WITNESS_VALS.map((row, i) => (
                      <motion.div
                        key={i}
                        className="text-[1vw] font-bold"
                        style={{ fontFamily: 'var(--font-mono)', color: '#E8A838', lineHeight: '2', letterSpacing: '0.04vw' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 4.5 + i * 0.2 }}
                      >
                        {row.map((v) => String(v).padStart(2, ' ')).join(' ')}
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {phase === 2 && (
              <motion.div
                key="checksum"
                className="flex flex-col gap-[2.5vh] mt-[1vh]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Voice (in-phase): "last 6 characters form the checksum" ~0-3s */}
                <div className="flex items-center gap-[1.5vw]">
                  <motion.div
                    className="px-[1vw] py-[1vh] rounded-[0.3vw]"
                    style={{ backgroundColor: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-[0.85vw] mb-[0.4vh] font-bold" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>chars</div>
                    <motion.div
                      className="text-[1.5vw] font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: '#EB5234', lineHeight: '2.2', letterSpacing: '0.15vw' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                    >
                      {CHECKSUM_CHARS.join('  ')}
                    </motion.div>
                  </motion.div>
                  {/* Voice: "We decode them" ~3.4-5.5s */}
                  <motion.span
                    className="text-[1.5vw] font-bold"
                    style={{ color: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.4 }}
                  >
                    →
                  </motion.span>
                  <motion.div
                    className="px-[1vw] py-[1vh] rounded-[0.3vw]"
                    style={{ backgroundColor: '#1C1C1C' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.9, ...springs.snappy }}
                  >
                    <div className="text-[0.85vw] mb-[0.4vh] font-bold" style={{ fontFamily: 'var(--font-display)', color: '#666' }}>values</div>
                    <motion.div
                      className="text-[1.5vw] font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: '#E8A838', lineHeight: '2.2', letterSpacing: '0.1vw' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4.5 }}
                    >
                      {CHECKSUM_VALS.map((v) => String(v).padStart(2, ' ')).join(' ')}
                    </motion.div>
                  </motion.div>
                </div>
                {/* Voice: "verify the address is valid" ~5.5-8s */}
                <motion.p
                  className="text-[2.2vw] font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 6.7, ...springs.snappy }}
                >
                  Verify checksum ✓
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
