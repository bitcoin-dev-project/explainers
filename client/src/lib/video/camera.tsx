/**
 * Camera — viewport movement for 3Blue1Brown-style pan/zoom.
 *
 * Instead of a static 1920x1080 rectangle, place content on a larger canvas
 * and "move the camera" by transforming the wrapper per scene.
 *
 * Usage:
 *   <Camera scene={s} shots={{
 *     0: { x: 0, y: 0, scale: 1 },              // wide shot
 *     3: { x: '-50vw', y: '-30vh', scale: 2.5 }, // zoom into block detail
 *     6: { x: '-120vw', y: 0, scale: 1.2 },      // pan to next section
 *     9: { x: 0, y: 0, scale: 1 },               // pull back to overview
 *   }}>
 *     <BlockDiagram style={{ position: 'absolute', left: '60vw', top: '30vh' }} />
 *     <DetailView style={{ position: 'absolute', left: '140vw', top: '20vh' }} />
 *   </Camera>
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { springs } from './animations';

interface CameraShot {
  x?: number | string;
  y?: number | string;
  scale?: number;
  rotate?: number;
}

interface CameraProps {
  /** Current scene index from useVideoPlayer */
  scene: number;
  /** Scene-indexed camera positions */
  shots: Record<number, CameraShot>;
  /** Canvas width (default '200vw') */
  width?: string;
  /** Canvas height (default '200vh') */
  height?: string;
  /** Transition spring (default: smooth, slow pan) */
  transition?: Record<string, any>;
  children: ReactNode;
}

export function Camera({
  scene,
  shots,
  width = '200vw',
  height = '200vh',
  transition,
  children,
}: CameraProps) {
  // Find the active shot (highest scene key <= current scene)
  const keys = Object.keys(shots).map(Number).sort((a, b) => a - b);
  const active = [...keys].reverse().find(k => scene >= k);
  const shot = active !== undefined ? shots[active] : {};

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div
        style={{
          width,
          height,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
        }}
        animate={{
          x: shot.x ?? 0,
          y: shot.y ?? 0,
          scale: shot.scale ?? 1,
          rotate: shot.rotate ?? 0,
        }}
        transition={transition ?? {
          type: 'spring',
          stiffness: 60,
          damping: 25,
          mass: 1.5,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
