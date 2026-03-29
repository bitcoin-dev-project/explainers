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
 *
 * Shot helpers — avoid manual positioning math:
 *
 *   import { focus, fitRect } from '@/lib/video';
 *
 *   // Center canvas point (28vw, 30vh) on screen at 2.2x zoom:
 *   shots: { 2: focus(28, 30, 2.2) }
 *
 *   // Place canvas point (27vw, 35vh) at screen position (30vw, 25vh):
 *   shots: { 3: focus(27, 35, { scale: 1.3, screenX: 30, screenY: 25 }) }
 *
 *   // Auto-fit a rect (x:100, y:10, w:80, h:60) with 10% padding:
 *   shots: { 5: fitRect(100, 10, 80, 60) }
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { springs } from './animations';

export interface CameraShot {
  x?: number | string;
  y?: number | string;
  scale?: number;
  rotate?: number;
}

/* ── Shot helpers ─────────────────────────────────────────────── */

interface FocusOptions {
  /** Zoom level (default 1) */
  scale?: number;
  /** Target screen X position in vw (default 50 = center) */
  screenX?: number;
  /** Target screen Y position in vh (default 50 = center) */
  screenY?: number;
  /** Rotation in degrees */
  rotate?: number;
}

/**
 * Calculate camera shot that places a canvas point at a screen position.
 * All coordinates in vw/vh units. Replaces manual `screen = canvas × scale + offset` math.
 *
 * @param cx - Canvas X position (vw)
 * @param cy - Canvas Y position (vh)
 * @param opts - Scale number, or options object with scale + screen target
 *
 * @example
 *   // Center element at (28vw, 30vh) on screen at 2.2x zoom
 *   focus(28, 30, 2.2)
 *   // → { x: '-11.6vw', y: '-16vh', scale: 2.2 }
 *
 *   // Position element at (27vw, 35vh) at screen (30vw, 25vh) at 1.3x
 *   focus(27, 35, { scale: 1.3, screenX: 30, screenY: 25 })
 *   // → { x: '-5.1vw', y: '-20.5vh', scale: 1.3 }
 */
export function focus(
  cx: number,
  cy: number,
  opts?: number | FocusOptions,
): CameraShot {
  const options = typeof opts === 'number' ? { scale: opts } : (opts ?? {});
  const { scale = 1, screenX = 50, screenY = 50, rotate } = options;
  return {
    x: `${screenX - cx * scale}vw`,
    y: `${screenY - cy * scale}vh`,
    scale,
    ...(rotate != null && { rotate }),
  };
}

interface FitRectOptions {
  /** Padding in vw/vh percentage around the rect (default 10) */
  pad?: number;
  /** Rotation in degrees */
  rotate?: number;
}

/**
 * Calculate camera shot that fits a canvas rectangle in the viewport, centered.
 * Auto-calculates scale to fit both width and height with padding.
 *
 * @param x - Rect left edge (vw)
 * @param y - Rect top edge (vh)
 * @param w - Rect width (vw)
 * @param h - Rect height (vh)
 * @param opts - Optional padding and rotation
 *
 * @example
 *   // Fit a 80vw × 60vh region starting at (100vw, 10vh) with 10% padding
 *   fitRect(100, 10, 80, 60)
 *   // → { x: '-90vw', y: '-10vh', scale: 1 }
 *
 *   // Tighter fit with 5% padding
 *   fitRect(100, 10, 80, 60, { pad: 5 })
 *   // → { x: '-96.25vw', y: '-13.75vh', scale: 1.125 }
 */
export function fitRect(
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: FitRectOptions,
): CameraShot {
  const { pad = 10, rotate } = opts ?? {};
  const scale = Math.min((100 - 2 * pad) / w, (100 - 2 * pad) / h);
  return focus(x + w / 2, y + h / 2, { scale, rotate });
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
