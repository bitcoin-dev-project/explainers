/**
 * Stage/Act — Declarative camera system that eliminates manual positioning math.
 *
 * Instead of placing elements at absolute canvas coordinates and computing
 * camera shots with focus(cx, cy, scale), you declare Acts and Stage auto-frames them.
 *
 * Usage:
 *   <Stage scene={s}>
 *     <Act scenes={[0, 1, 2]}>
 *       <TitleScreen scene={s} />
 *     </Act>
 *     <Act scenes={[3, 4, 5]}>
 *       <PaddingVisual scene={s} />
 *     </Act>
 *     <Act scenes={[6, 7, 8]} shots={{
 *       6: { scale: 0.9 },
 *       7: { scale: 1.5, x: 70, y: 40 },
 *     }}>
 *       <DetailDiagram scene={s} />
 *     </Act>
 *   </Stage>
 *
 * How it works:
 *   - Stage lays out Acts side by side on a canvas (horizontal strip or grid)
 *   - Each Act is viewport-sized (100vw × 100vh) — content fills the full screen
 *   - When the scene changes, Stage pans to center the active Act
 *   - Acts handle within-Act zoom via optional `shots` prop
 *   - No manual coordinates, no manual camera math, no position audits
 *
 * Within-Act zoom:
 *   shots={{ 7: { scale: 1.5, x: 70, y: 40 } }}
 *   Zooms to 1.5x centered on the point at 70% across, 40% down the Act content.
 *   x/y are percentages (0-100). Default: 50, 50 (center).
 *
 * Overview mode:
 *   <Stage scene={s} overview={[20, 21, 22]}>
 *   During overview scenes, Stage zooms out to show all Acts simultaneously.
 *
 * Grid layout:
 *   <Stage scene={s} layout="grid" columns={3}>
 *   Acts arranged in rows/columns instead of a horizontal strip.
 */

import { motion, type Transition } from 'framer-motion';
import { type ReactNode, type ReactElement, Children, isValidElement, cloneElement } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

export interface ActShot {
  /** Zoom level (1 = fill viewport, >1 = zoom in, <1 = zoom out) */
  scale?: number;
  /** Horizontal focus point (0-100, percentage). Default 50 (center) */
  x?: number;
  /** Vertical focus point (0-100, percentage). Default 50 (center) */
  y?: number;
}

export interface ActProps {
  /** Scene indices when this Act is the primary focus */
  scenes: number[];
  /** Per-scene zoom/pan within this Act's viewport */
  shots?: Record<number, ActShot>;
  /** Act content — design as if filling the full screen (100vw × 100vh) */
  children: ReactNode;

  // ── Internal props (injected by Stage via cloneElement) ──
  /** @internal */ _scene?: number;
  /** @internal */ _isOverview?: boolean;
}

export interface StageProps {
  /** Current scene index from useVideoPlayer */
  scene: number;
  /** Layout mode: 'row' = horizontal strip (default), 'grid' = rows + columns */
  layout?: 'row' | 'grid';
  /** Number of columns for grid layout (default 3) */
  columns?: number;
  /** Gap between Acts in vw units (default 10) */
  gap?: number;
  /** Spring config for stage panning between Acts */
  transition?: Transition;
  /** Scenes where Stage zooms out to show ALL Acts at once */
  overview?: number[];
  /** Children: Act components + optional non-Act overlays */
  children: ReactNode;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 60,
  damping: 25,
  mass: 1.5,
};

const ACT_INNER_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 80,
  damping: 25,
  mass: 1,
};

const ACT_WIDTH = 100;  // vw
const ACT_HEIGHT = 100; // vh

// ─── Helpers ─────────────────────────────────────────────────────────

/** Find the highest key <= scene (same lookup pattern as Camera/morph) */
function resolveKey(keys: number[], scene: number): number | undefined {
  const sorted = [...keys].sort((a, b) => a - b);
  return [...sorted].reverse().find(k => scene >= k);
}

// ─── Act Component ───────────────────────────────────────────────────

export function Act({ scenes, shots, children, _scene, _isOverview }: ActProps) {
  // During overview, reset to default view (no zoom)
  const effectiveScene = _scene ?? 0;

  // Resolve the active shot for the current scene
  let shot: ActShot = {};
  if (!_isOverview && shots) {
    const keys = Object.keys(shots).map(Number);
    const activeKey = resolveKey(keys, effectiveScene);
    if (activeKey != null) shot = shots[activeKey];
  }

  const scale = shot.scale ?? 1;
  const focusX = shot.x ?? 50; // 0-100 percentage
  const focusY = shot.y ?? 50;

  // Compute transform to zoom/pan within this Act's viewport
  // Formula: translate so that the focus point ends up at viewport center
  // With transformOrigin '0 0':
  //   screen_pos = content_pos * scale + translate
  //   We want: focusX% * scale + translateX = 50% (center)
  //   So: translateX = 50 - focusX * scale
  const tx = 50 - focusX * scale;
  const ty = 50 - focusY * scale;

  // At scale=1, focusX=50, focusY=50: tx=0, ty=0 (no transform needed)
  const needsTransform = scale !== 1 || focusX !== 50 || focusY !== 50;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
        }}
        animate={{
          x: needsTransform ? `${tx}vw` : 0,
          y: needsTransform ? `${ty}vh` : 0,
          scale,
        }}
        transition={ACT_INNER_TRANSITION}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Stage Component ─────────────────────────────────────────────────

export function Stage({
  scene,
  layout = 'row',
  columns = 3,
  gap = 10,
  transition,
  overview,
  children,
}: StageProps) {
  // ── Separate Act children from overlay children ──
  const allChildren = Children.toArray(children);
  const acts: ReactElement<ActProps>[] = [];
  const overlays: ReactNode[] = [];

  for (const child of allChildren) {
    if (isValidElement(child) && child.type === Act) {
      acts.push(child as ReactElement<ActProps>);
    } else {
      overlays.push(child);
    }
  }

  const actCount = acts.length;

  // ── Calculate Act positions on the canvas ──
  const positions: { left: number; top: number }[] = [];

  if (layout === 'row') {
    for (let i = 0; i < actCount; i++) {
      positions.push({ left: i * (ACT_WIDTH + gap), top: 0 });
    }
  } else {
    // Grid layout
    for (let i = 0; i < actCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      positions.push({
        left: col * (ACT_WIDTH + gap),
        top: row * (ACT_HEIGHT + gap),
      });
    }
  }

  // ── Canvas dimensions ──
  let canvasWidth: number;
  let canvasHeight: number;

  if (layout === 'row') {
    canvasWidth = actCount * ACT_WIDTH + Math.max(0, actCount - 1) * gap;
    canvasHeight = ACT_HEIGHT;
  } else {
    const rows = Math.ceil(actCount / columns);
    const cols = Math.min(actCount, columns);
    canvasWidth = cols * ACT_WIDTH + Math.max(0, cols - 1) * gap;
    canvasHeight = rows * ACT_HEIGHT + Math.max(0, rows - 1) * gap;
  }

  // ── Find the active Act ──
  const isOverview = overview?.includes(scene) ?? false;

  let activeIndex = -1;
  for (let i = acts.length - 1; i >= 0; i--) {
    if (acts[i].props.scenes.includes(scene)) {
      activeIndex = i;
      break;
    }
  }

  // ── Compute Stage transform ──
  let stageX: string | number = 0;
  let stageY: string | number = 0;
  let stageScale = 1;

  if (isOverview) {
    // Zoom out to show all Acts with padding
    const pad = 5; // vw/vh padding
    const scaleX = (100 - 2 * pad) / canvasWidth;
    const scaleY = (100 - 2 * pad) / canvasHeight;
    stageScale = Math.min(scaleX, scaleY, 1); // never zoom in past 1x

    // Center the scaled canvas in the viewport
    const scaledWidth = canvasWidth * stageScale;
    const scaledHeight = canvasHeight * stageScale;
    stageX = `${(100 - scaledWidth) / 2}vw`;
    stageY = `${(100 - scaledHeight) / 2}vh`;
  } else if (activeIndex >= 0) {
    // Pan to center the active Act
    const pos = positions[activeIndex];
    stageX = `${-pos.left}vw`;
    stageY = `${-pos.top}vh`;
  }
  // If no Act is active and not overview, stage stays at last position (Framer Motion holds)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Canvas — holds all Acts, transforms to pan/zoom */}
      <motion.div
        style={{
          width: `${canvasWidth}vw`,
          height: `${canvasHeight}vh`,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
        }}
        animate={{
          x: stageX,
          y: stageY,
          scale: stageScale,
        }}
        transition={transition ?? DEFAULT_TRANSITION}
      >
        {/* Render each Act at its computed position */}
        {acts.map((act, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${positions[i].left}vw`,
              top: `${positions[i].top}vh`,
              width: `${ACT_WIDTH}vw`,
              height: `${ACT_HEIGHT}vh`,
            }}
          >
            {cloneElement(act, {
              _scene: scene,
              _isOverview: isOverview,
            })}
          </div>
        ))}
      </motion.div>

      {/* Overlays — non-Act children, positioned relative to viewport */}
      {overlays.length > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {overlays}
        </div>
      )}
    </div>
  );
}
