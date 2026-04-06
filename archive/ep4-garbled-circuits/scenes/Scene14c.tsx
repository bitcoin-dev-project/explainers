import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 14c: Chained gates visual */

function MiniGate({ label, x, y, delay, highlight }: { label: string; x: number; y: number; delay: number; highlight?: boolean }) {
  const color = highlight ? 'var(--color-secondary)' : 'var(--color-text-muted)';
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.bouncy }}
    >
      <path
        d={`M${x},${y - 18} L${x},${y + 18} L${x + 16},${y + 18} A18,18 0 0,0 ${x + 16},${y - 18} Z`}
        fill={highlight ? 'rgba(241,118,13,0.15)' : 'var(--color-bg-muted)'}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={x + 14} y={y + 5}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="bold"
        fontFamily="var(--font-mono)"
      >
        {label}
      </text>
    </motion.g>
  );
}

function Wire({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="var(--color-text-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay, duration: 0.4 }}
    />
  );
}

export function Scene14c() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[3vh] px-[3vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[2vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Chain the gates into a{' '}
        <span style={{ color: 'var(--color-secondary)' }}>bigger circuit</span>
      </motion.p>

      <motion.p
        className="text-[1.2vw] text-center max-w-[32vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.0 }}
      >
        The output of one gate feeds into the next.
        Each connection is just another encrypted wire.
      </motion.p>

      {/* Chained gates visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 5.0, ...springs.snappy }}
      >
        <svg width="30vw" height="16vw" viewBox="0 0 460 240" fill="none">
          {/* Input labels */}
          <motion.text x="5" y="52" fill="var(--color-secondary)" fontSize="13" fontWeight="bold"
            fontFamily="var(--font-display)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }}>
            A
          </motion.text>
          <motion.text x="5" y="92" fill="var(--color-primary)" fontSize="13" fontWeight="bold"
            fontFamily="var(--font-display)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.6 }}>
            B
          </motion.text>
          <motion.text x="5" y="162" fill="var(--color-secondary)" fontSize="13" fontWeight="bold"
            fontFamily="var(--font-display)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.7 }}>
            C
          </motion.text>
          <motion.text x="5" y="202" fill="var(--color-primary)" fontSize="13" fontWeight="bold"
            fontFamily="var(--font-display)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.8 }}>
            D
          </motion.text>

          {/* Input wires to gate 1 */}
          <Wire x1={20} y1={50} x2={60} y2={60} delay={5.6} />
          <Wire x1={20} y1={90} x2={60} y2={80} delay={5.7} />

          {/* Gate 1 */}
          <MiniGate label="AND" x={60} y={70} delay={6.5} highlight />

          {/* Input wires to gate 2 */}
          <Wire x1={20} y1={160} x2={60} y2={170} delay={7.5} />
          <Wire x1={20} y1={200} x2={60} y2={190} delay={7.6} />

          {/* Gate 2 */}
          <MiniGate label="OR" x={60} y={180} delay={8.0} />

          {/* Wires from gate 1 & 2 to gate 3 */}
          <Wire x1={96} y1={70} x2={180} y2={115} delay={9.0} />
          <Wire x1={96} y1={180} x2={180} y2={135} delay={9.2} />

          {/* Gate 3 */}
          <MiniGate label="XOR" x={180} y={125} delay={9.5} />

          {/* Wire from gate 3 to gate 4 */}
          <Wire x1={216} y1={125} x2={300} y2={115} delay={11.0} />

          {/* Extra input E */}
          <motion.text x="245" y="162" fill="var(--color-text-muted)" fontSize="13" fontWeight="bold"
            fontFamily="var(--font-display)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 10.5 }}>
            E
          </motion.text>
          <Wire x1={260} y1={160} x2={300} y2={135} delay={11.0} />

          {/* Gate 4 */}
          <MiniGate label="AND" x={300} y={125} delay={11.5} />

          {/* Output wire */}
          <Wire x1={336} y1={125} x2={400} y2={125} delay={12.0} />

          {/* Output label */}
          <motion.text x="408" y="130" fill="var(--color-text-primary)" fontSize="14" fontWeight="bold"
            fontFamily="var(--font-mono)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 13.0 }}>
            Result
          </motion.text>
        </svg>
      </motion.div>

      <motion.p
        className="text-[1.3vw] text-center max-w-[36vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 16.0 }}
      >
        The millionaires problem, auctions, voting...{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>any function</strong> a computer can evaluate
        can be turned into a garbled circuit.
      </motion.p>
    </motion.div>
  );
}
