/**
 * Single-Canvas Architecture — 3Blue1Brown-style continuous animations.
 *
 * Instead of mounting/unmounting entire scene components via AnimatePresence,
 * ALL visual elements live on ONE persistent canvas. Each element knows when
 * to enter and exit based on the current scene index. Elements morph, move,
 * and transform smoothly without page-level transitions.
 *
 * Core primitives:
 * - CE (CanvasElement)  — lifecycle wrapper: enter/exit/delay
 * - morph()             — scene-driven animation props for position/style changes
 * - sceneRange()        — boolean helper: is current scene in [enter, exit)?
 */

import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { springs } from './animations';

// ─── CE (CanvasElement) ─────────────────────────────────────────────
// Wraps any content with enter/exit lifecycle on a persistent canvas.
// Uses AnimatePresence on individual elements (not entire scenes).
//
// Usage (HTML):
//   <CE s={scene} enter={2} exit={5} delay={0.3}>
//     <h2>Some title</h2>
//   </CE>
//
// Usage (SVG — wrap in motion.g):
//   <CE s={scene} enter={2} exit={5} as="g">
//     <TreeNode x={100} y={50} label="Root" />
//   </CE>
//
// Usage (container with children that have their own animations):
//   <CE s={scene} enter={1} exit={7} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//     <svg><TreeNode delay={0.5} /><TreeNode delay={0.8} /></svg>
//   </CE>

interface CEProps {
  /** Current scene index from useVideoPlayer */
  s: number;
  /** Scene index when this element enters (becomes visible) */
  enter: number;
  /** Scene index when this element exits (omit = stays forever) */
  exit?: number;
  /** Delay in seconds after the enter scene starts */
  delay?: number;
  /** Initial state before entering. Default: { opacity: 0, y: 15 } */
  initial?: Record<string, any>;
  /** Visible/target state. Default: { opacity: 1, y: 0 } */
  animate?: Record<string, any>;
  /** Exit animation state. Default: { opacity: 0 } */
  exitStyle?: Record<string, any>;
  /** Transition config. Default: springs.snappy on enter, duration 0.4 after */
  transition?: Record<string, any>;
  /** Wrapper element: 'div' for HTML (default), 'g' for SVG groups */
  as?: 'div' | 'span' | 'p' | 'g';
  /** className on the wrapper */
  className?: string;
  /** style on the wrapper */
  style?: React.CSSProperties;
  children: ReactNode;
}

export function CE({
  s,
  enter,
  exit,
  delay = 0,
  initial: initProp,
  animate: animProp,
  exitStyle,
  transition,
  as: Tag = 'div',
  className,
  style,
  children,
}: CEProps) {
  const visible = s >= enter && (exit === undefined || s < exit);
  const isEntering = s === enter;
  const MotionTag = motion[Tag] as any;

  // Default animations
  const defaultInitial = Tag === 'g'
    ? { opacity: 0 }
    : { opacity: 0, y: 15 };
  const defaultAnimate = Tag === 'g'
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const defaultExit = { opacity: 0 };

  // Transition: include delay only on the entering scene
  const enterTransition = {
    delay,
    ...(transition ?? springs.snappy),
  };
  const stayTransition = transition ?? { duration: 0.4 };

  // Always use a fast exit transition — never inherit the enter delay
  const exitWithTransition = {
    ...(exitStyle ?? defaultExit),
    transition: { duration: 0.3 },
  };

  return (
    <AnimatePresence>
      {visible && (
        <MotionTag
          key={`ce-${enter}-${exit ?? 'inf'}`}
          initial={initProp ?? defaultInitial}
          animate={animProp ?? defaultAnimate}
          exit={exitWithTransition}
          transition={isEntering ? enterTransition : stayTransition}
          className={className}
          style={style}
        >
          {children}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}

// ─── morph() ────────────────────────────────────────────────────────
// Returns animation props for elements that change position/style
// across scenes. Spread onto any motion.* component.
//
// Usage:
//   <motion.g {...morph(scene, {
//     2: { x: 100, y: 200, opacity: 1 },
//     4: { x: 300, y: 100, scale: 0.8 },
//     6: { opacity: 0 },
//   })}>
//     <TreeNode label="Root" />
//   </motion.g>

export function morph(
  scene: number,
  states: Record<number, Record<string, any>>,
  transition?: Record<string, any>,
) {
  const keys = Object.keys(states).map(Number).sort((a, b) => a - b);
  const active = [...keys].reverse().find(k => scene >= k);

  return {
    animate: active !== undefined ? states[active] : {},
    transition: transition ?? springs.smooth,
  };
}

// ─── sceneRange() ───────────────────────────────────────────────────
// Simple boolean: is the current scene within [enter, exit)?
// Useful for conditional logic without CE wrapper.
//
// Usage:
//   const showTree = sceneRange(scene, 2, 8);
//   {showTree && <MerkleTree />}

export function sceneRange(
  scene: number,
  enter: number,
  exit?: number,
): boolean {
  return scene >= enter && (exit === undefined || scene < exit);
}
