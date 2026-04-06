import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#1C1C1C' }}
      {...sceneTransitions.fadeBlur}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(241,118,13,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(241,118,13,0.06) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
      />

      <div className="flex flex-col items-center gap-[2vh] relative z-10">
        <h1
          className="text-[7vw] font-bold leading-[1] text-center tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        >
          Garbled Circuits
        </h1>

        <div
          className="h-[0.3vh] w-[8vw] rounded-full"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        />

        <p
          className="text-[1.8vw]"
          style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)' }}
        >
          Secure Multi-Party Computation
        </p>
      </div>
    </motion.div>
  );
}
