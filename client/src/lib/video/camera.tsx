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
 *
 * Dev minimap:
 *   Shows a bird's-eye view of the canvas with the viewport rect highlighted.
 *   Green = fully within canvas, red = viewport extends past canvas edge.
 *   Pass `zones` to mark content regions on the minimap:
 *
 *   <Camera zones={[
 *     { label: 'A', x: 0, y: 0, w: 90, h: 100, color: '#3b82f6' },
 *     { label: 'B', x: 105, y: 0, w: 80, h: 100, color: '#ef4444' },
 *   ]} ...>
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

export interface CameraZone {
  /** Short label for the zone */
  label: string;
  /** Left edge (vw) */
  x: number;
  /** Top edge (vh) */
  y: number;
  /** Width (vw) */
  w: number;
  /** Height (vh) */
  h: number;
  /** Zone color */
  color: string;
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

/**
 * Check if a canvas rect is visible in a given shot.
 * Returns the fraction of the rect that's on-screen (0 = invisible, 1 = fully visible).
 *
 * @param rect - Canvas region to check { x, y, w, h } in vw/vh
 * @param shot - Camera shot to test against
 */
export function visibility(
  rect: { x: number; y: number; w: number; h: number },
  shot: CameraShot,
): number {
  const shotX = typeof shot.x === 'string' ? parseFloat(shot.x) : (shot.x ?? 0);
  const shotY = typeof shot.y === 'string' ? parseFloat(shot.y) : (shot.y ?? 0);
  const sc = shot.scale ?? 1;

  // Viewport in canvas coordinates
  const vpL = -shotX / sc;
  const vpT = -shotY / sc;
  const vpR = vpL + 100 / sc;
  const vpB = vpT + 100 / sc;

  // Content rect
  const cL = rect.x, cT = rect.y, cR = rect.x + rect.w, cB = rect.y + rect.h;

  // Intersection
  const iL = Math.max(vpL, cL), iT = Math.max(vpT, cT);
  const iR = Math.min(vpR, cR), iB = Math.min(vpB, cB);
  if (iR <= iL || iB <= iT) return 0;

  const intersectionArea = (iR - iL) * (iB - iT);
  const contentArea = rect.w * rect.h;
  return contentArea > 0 ? intersectionArea / contentArea : 0;
}

/* ── Minimap (dev-only) ──────────────────────────────────────── */

function Minimap({
  canvasW,
  canvasH,
  shot,
  zones,
  sceneIndex,
}: {
  canvasW: number;
  canvasH: number;
  shot: CameraShot;
  zones?: CameraZone[];
  sceneIndex?: number;
}) {
  const shotX = typeof shot.x === 'string' ? parseFloat(shot.x) : (shot.x ?? 0);
  const shotY = typeof shot.y === 'string' ? parseFloat(shot.y) : (shot.y ?? 0);
  const sc = shot.scale ?? 1;

  // Viewport rect in canvas coords
  const vpL = -shotX / sc;
  const vpT = -shotY / sc;
  const vpW = 100 / sc;
  const vpH = 100 / sc;

  // Minimap pixel dimensions (correct aspect ratio for 16:9 viewport)
  const vRatio = typeof window !== 'undefined'
    ? window.innerWidth / window.innerHeight
    : 16 / 9;
  const canvasAspect = (canvasW / canvasH) * vRatio;
  const mmW = 190;
  const mmH = mmW / canvasAspect;

  // Canvas-coord to minimap-pixel scale
  const sX = mmW / canvasW;
  const sY = mmH / canvasH;

  // Viewport extends past canvas edge?
  const isClipped = vpL < -1 || vpT < -1
    || vpL + vpW > canvasW + 1
    || vpT + vpH > canvasH + 1;

  // Zone visibility in current shot
  const zoneVis = zones?.map(z => visibility(z, shot)) ?? [];

  return (
    <div style={{
      position: 'absolute',
      bottom: 56,
      right: 12,
      width: mmW,
      height: mmH,
      border: '1px solid rgba(255,255,255,0.15)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderRadius: 6,
      zIndex: 100,
      pointerEvents: 'none',
      overflow: 'hidden',
      backdropFilter: 'blur(4px)',
    }}>
      {/* Canvas outline */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 5,
      }} />

      {/* Zone rects */}
      {zones?.map((z, i) => {
        const vis = zoneVis[i];
        const isVisible = vis > 0.01;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: z.x * sX,
            top: z.y * sY,
            width: z.w * sX,
            height: z.h * sY,
            backgroundColor: `${z.color}${isVisible ? '30' : '12'}`,
            border: `1px solid ${z.color}${isVisible ? '80' : '30'}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
          }}>
            <span style={{
              fontSize: 7,
              color: isVisible ? z.color : `${z.color}60`,
              padding: '0 2px',
              fontFamily: 'monospace',
              lineHeight: 1,
              fontWeight: isVisible ? 700 : 400,
            }}>
              {z.label}
            </span>
          </div>
        );
      })}

      {/* Viewport rect */}
      <div style={{
        position: 'absolute',
        left: vpL * sX,
        top: vpT * sY,
        width: vpW * sX,
        height: vpH * sY,
        border: `2px solid ${isClipped ? '#ef4444' : '#22c55e'}`,
        backgroundColor: isClipped ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
        borderRadius: 2,
        transition: 'left 0.4s ease, top 0.4s ease, width 0.3s ease, height 0.3s ease, border-color 0.2s ease',
      }} />

      {/* Info bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '2px 5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 7,
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}>
        <span>
          {sceneIndex != null ? `s${sceneIndex} ` : ''}
          x:{shotX.toFixed(0)} y:{shotY.toFixed(0)} {sc.toFixed(1)}x
        </span>
        <span>
          {canvasW}vw×{canvasH}vh
        </span>
      </div>
    </div>
  );
}

/* ── Camera Component ────────────────────────────────────────── */

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
  /** Named canvas zones shown on the dev minimap */
  zones?: CameraZone[];
  /** Show minimap overlay (default: auto — shown in dev, hidden in prod) */
  minimap?: boolean;
  children: ReactNode;
}

export function Camera({
  scene,
  shots,
  width = '200vw',
  height = '200vh',
  transition,
  zones,
  minimap,
  children,
}: CameraProps) {
  // Find the active shot (highest scene key <= current scene)
  const keys = Object.keys(shots).map(Number).sort((a, b) => a - b);
  const active = [...keys].reverse().find(k => scene >= k);
  const shot = active !== undefined ? shots[active] : {};

  const showMinimap = minimap ?? (
    typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV
  );

  const canvasW = parseFloat(width) || 200;
  const canvasH = parseFloat(height) || 200;

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

      {showMinimap && (
        <Minimap
          canvasW={canvasW}
          canvasH={canvasH}
          shot={shot}
          zones={zones}
          sceneIndex={active}
        />
      )}
    </div>
  );
}
