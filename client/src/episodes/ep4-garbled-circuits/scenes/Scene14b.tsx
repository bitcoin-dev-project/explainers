import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

/* Scene 14b: Our party example was just one gate */

export function Scene14b() {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center gap-[5vh] px-[3vw]"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
      {...sceneTransitions.crossDissolve}
    >
      <motion.p
        className="text-[2.2vw] font-bold text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Our party example was just{' '}
        <span style={{ color: 'var(--color-secondary)' }}>one gate</span>.
      </motion.p>

      {/* Single AND gate recap */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.0, ...springs.snappy }}
      >
        <svg width="22vw" height="12vw" viewBox="0 0 330 180" fill="none">
          <motion.line x1="30" y1="60" x2="100" y2="60" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.2, duration: 0.4 }} />
          <motion.line x1="30" y1="120" x2="100" y2="120" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.4, duration: 0.4 }} />
          <motion.path d="M100,35 L100,145 L160,145 A55,55 0 0,0 160,35 Z"
            fill="rgba(241,118,13,0.12)" stroke="var(--color-secondary)" strokeWidth="3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} />
          <motion.text x="148" y="97" textAnchor="middle" fill="var(--color-secondary)" fontSize="20" fontWeight="bold"
            fontFamily="var(--font-mono)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
            AND
          </motion.text>
          <motion.line x1="215" y1="90" x2="300" y2="90" stroke="var(--color-text-primary)" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 3.0, duration: 0.4 }} />
          <motion.text x="15" y="55" fill="var(--color-secondary)" fontSize="14" fontWeight="bold" fontFamily="var(--font-display)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>Alice</motion.text>
          <motion.text x="20" y="135" fill="var(--color-primary)" fontSize="14" fontWeight="bold" fontFamily="var(--font-display)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>Bob</motion.text>
        </svg>
      </motion.div>

      <motion.p
        className="text-[1.5vw] text-center max-w-[34vw]"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5.5 }}
      >
        "Do we both want to go to the party?" is a single AND.
        <br />
        But real problems need <strong style={{ color: 'var(--color-text-primary)' }}>much more</strong>.
      </motion.p>
    </motion.div>
  );
}
