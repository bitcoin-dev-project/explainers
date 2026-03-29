import { motion } from 'framer-motion';

interface SpeechBubbleProps {
  text: string;
  maxWidth?: string;
}

export function SpeechBubble({ text, maxWidth = '22vw' }: SpeechBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.3, y: 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      style={{
        position: 'relative',
        marginBottom: '10px',
        maxWidth,
        pointerEvents: 'none',
      }}
    >
      {/* Bubble body */}
      <div
        style={{
          background: 'white',
          borderRadius: '18px',
          border: '2.5px solid #2D2B2B',
          padding: '0.6vw 1vw',
          fontFamily: 'var(--font-body)',
          fontSize: '1.15vw',
          lineHeight: 1.45,
          color: '#2D2B2B',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {text}
      </div>

      {/* Tail — outer stroke */}
      <div
        style={{
          position: 'absolute',
          bottom: '-11px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '12px solid #2D2B2B',
        }}
      />
      {/* Tail — inner fill */}
      <div
        style={{
          position: 'absolute',
          bottom: '-7px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid white',
        }}
      />
    </motion.div>
  );
}
