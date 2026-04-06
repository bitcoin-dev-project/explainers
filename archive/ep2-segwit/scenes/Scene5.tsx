import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

const ADDRESS = 'bc1qeqzjk7vume5wmrdgz5xyehh54cchdjag6jdmkj';

// Grid data with types for color coding
const GRID_DATA = [
  { chars: ['b', 'c', '\u00A0', '1'], type: 'hrp' as const },
  { chars: ['q'], type: 'version' as const },
  { chars: ['e', 'q', 'z', 'j', 'k', '7', 'v', 'u'], type: 'witness' as const },
  { chars: ['m', 'e', '5', 'w', 'm', 'r', 'd', 'g'], type: 'witness' as const },
  { chars: ['z', '5', 'x', 'y', 'e', 'h', 'h', '5'], type: 'witness' as const },
  { chars: ['4', 'c', 'c', 'h', 'd', 'j', 'a', 'g'], type: 'witness' as const },
  { chars: ['6', 'j', 'd', 'm', 'k', 'j'], type: 'checksum' as const },
];

const TYPE_COLORS = {
  hrp: '#EB5234',
  version: '#E8A838',
  witness: '#ffffff',
  checksum: '#6BBF6B',
};

const TYPE_LABELS = [
  { type: 'hrp', desc: '"bc" = bitcoin, "1" = delimiter', color: '#EB5234' },
  { type: 'version', desc: 'witness version', color: '#E8A838' },
  { type: 'witness', desc: 'witness program', color: '#ffffff' },
  { type: 'checksum', desc: 'checksum', color: '#6BBF6B' },
];

export function Scene5() {
  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center gap-[3vh]"
      style={{ backgroundColor: '#ECD4B5' }}
      {...sceneTransitions.slideLeft}
    >
      {/* Voice: "Now let's decode this address character by character" at 0.4s */}
      <motion.p
        className="text-[2.8vw] font-bold text-center max-w-[60vw]"
        style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Let's <em>decode</em> this bech32 address
      </motion.p>

      <motion.div
        className="px-[2vw] py-[1.2vh] rounded-[0.3vw] text-[1.8vw] font-bold"
        style={{
          fontFamily: 'var(--font-mono)',
          backgroundColor: '#fff',
          border: '0.2vw solid #1C1C1C',
          boxShadow: '0.2vw 0.2vw 0 #1C1C1C',
          color: '#1C1C1C',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {ADDRESS}
      </motion.div>

      {/* Voice: "We lay out the full address in a grid" at ~4.6s */}
      <motion.div
        className="text-[2.8vw]"
        style={{ color: '#1C1C1C' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
      >
        ↓
      </motion.div>

      {/* Grid + Legend */}
      <div className="flex items-center gap-[5vw]">
        {/* Voice: "...in a grid" — grid appears at ~4.7s */}
        <motion.div
          className="px-[2.5vw] py-[2vh] rounded-[0.5vw]"
          style={{ backgroundColor: '#1C1C1C' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 4.5, ...springs.snappy }}
        >
          {GRID_DATA.map((row, ri) => (
            <motion.div
              key={ri}
              className="flex items-center"
              style={{ minHeight: '4.5vh', marginBottom: '0.4vh' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5.0 + ri * 0.15 }}
            >
              {/* Voice: "Each part is color-coded" at ~7.0s — colors at ~7.7s */}
              <motion.div
                className="w-[0.4vw] self-stretch rounded-full mr-[1vw]"
                initial={{ opacity: 0, backgroundColor: '#333' }}
                animate={{ opacity: 1, backgroundColor: TYPE_COLORS[row.type] }}
                transition={{ delay: 7.7 + ri * 0.15, duration: 0.5 }}
              />
              <div className="flex gap-[1.5vw]">
                {row.chars.map((ch, ci) => (
                  <motion.span
                    key={ci}
                    className="text-[2vw] font-bold w-[2.2vw] text-center"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    initial={{ color: '#fff' }}
                    animate={{ color: TYPE_COLORS[row.type] }}
                    transition={{ delay: 7.7 + ri * 0.15 + ci * 0.02, duration: 0.4 }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Legend — Voice: "Red...Yellow...White...Green" from ~8.8s to ~17s */}
        <motion.div
          className="flex flex-col gap-[3vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 8.8 }}
        >
          {TYPE_LABELS.map((item, i) => (
            <motion.div
              key={item.type}
              className="flex items-center gap-[1vw]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 9.5 + i * 2.0, ...springs.snappy }}
            >
              <div
                className="w-[3vw] h-[0.5vw] rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span
                className="text-[1.8vw] font-bold"
                style={{ fontFamily: 'var(--font-display)', color: '#1C1C1C' }}
              >
                {item.desc}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
