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
 * - createThemedCE()    — factory for episode-specific CE with custom transitions
 * - morph()             — scene-driven animation props for position/style changes
 * - sceneRange()        — boolean helper: is current scene in [enter, exit)?
 */

import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { springs } from './animations';

// ─── Transition Themes ───────────────────────────────────────────
// Pre-built enter/exit/transition bundles. Episodes pick one in constants.ts
// or define their own. Pass to CE via `theme` prop or use createThemedCE().

export interface CETheme {
  /** Initial state before entering */
  initial: Record<string, any>;
  /** Visible/target state */
  animate: Record<string, any>;
  /** Exit animation state */
  exit: Record<string, any>;
  /** Enter transition config */
  transition: Record<string, any>;
}

export const ceThemes = {
  /** Default: simple fade + slide up (the old default — avoid overusing) */
  fadeUp: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: springs.snappy,
  },

  /** Blur focus pull: blurry → sharp */
  blurIn: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(12px)' },
    transition: { duration: 0.6, ease: 'circOut' },
  },

  /** Scale pop: shrink to full size with overshoot */
  scalePop: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
    transition: { type: 'spring', stiffness: 500, damping: 15 },
  },

  /** Slide from left */
  slideLeft: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 60 },
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },

  /** Slide from right */
  slideRight: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },

  /** Clip reveal: iris wipe from center */
  clipCircle: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(100% at 50% 50%)' },
    exit: { clipPath: 'circle(0% at 50% 50%)' },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },

  /** Clip reveal: horizontal wipe left to right */
  wipeRight: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' },
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },

  /** 3D flip: card flip on Y axis */
  flip: {
    initial: { opacity: 0, rotateY: -90, transformPerspective: 1200 },
    animate: { opacity: 1, rotateY: 0, transformPerspective: 1200 },
    exit: { opacity: 0, rotateY: 90, transformPerspective: 1200 },
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },

  /** 3D rotate from top */
  rotateIn: {
    initial: { opacity: 0, rotateX: -60, transformPerspective: 1000 },
    animate: { opacity: 1, rotateX: 0, transformPerspective: 1000 },
    exit: { opacity: 0, rotateX: 40, transformPerspective: 1000 },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },

  /** Morph expand: tiny circle expands to full rectangle */
  morphExpand: {
    initial: { opacity: 0, scale: 0.3, borderRadius: '50%' },
    animate: { opacity: 1, scale: 1, borderRadius: '0%' },
    exit: { opacity: 0, scale: 2, filter: 'blur(20px)' },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },

  /** Glitch: sharp snap with slight rotation (for security/attack topics) */
  glitch: {
    initial: { opacity: 0, x: -8, skewX: -4 },
    animate: { opacity: 1, x: 0, skewX: 0 },
    exit: { opacity: 0, x: 8, skewX: 4 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  /** Elastic drop: falls in from above with bounce */
  elasticDrop: {
    initial: { opacity: 0, y: -80 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
    transition: { type: 'spring', stiffness: 400, damping: 12 },
  },

  /** Typewriter fade: appears from left edge, no vertical movement */
  typewriter: {
    initial: { opacity: 0, x: -20, scaleX: 0.95 },
    animate: { opacity: 1, x: 0, scaleX: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4, ease: 'circOut' },
  },
} as const;

// ─── CE (CanvasElement) ─────────────────────────────────────────────

interface CEProps {
  /** Current scene index from useVideoPlayer */
  s: number;
  /** Scene index when this element enters (becomes visible) */
  enter: number;
  /** Scene index when this element exits (omit = stays forever) */
  exit?: number;
  /** Delay in seconds after the enter scene starts */
  delay?: number;
  /** Transition theme — overrides initial/animate/exit/transition defaults.
   *  Use ceThemes.blurIn, ceThemes.clipCircle, etc. or define your own. */
  theme?: CETheme;
  /** Initial state before entering. Overrides theme.initial if both set. */
  initial?: Record<string, any>;
  /** Visible/target state. Overrides theme.animate if both set. */
  animate?: Record<string, any>;
  /** Exit animation state. Overrides theme.exit if both set. */
  exitStyle?: Record<string, any>;
  /** Transition config. Overrides theme.transition if both set. */
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
  theme,
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

  // Resolve defaults: explicit prop > theme > built-in default
  // ⚠️ Built-in defaults — always use createThemedCE() instead of bare CE.
  const builtinInitial = Tag === 'g' ? { opacity: 0 } : { opacity: 0, y: 15 };
  const builtinAnimate = Tag === 'g' ? { opacity: 1 } : { opacity: 1, y: 0 };
  const builtinExit = { opacity: 0 };
  const builtinTransition = springs.snappy;

  const resolvedInitial = initProp ?? theme?.initial ?? builtinInitial;
  const resolvedAnimate = animProp ?? theme?.animate ?? builtinAnimate;
  const resolvedExit = exitStyle ?? theme?.exit ?? builtinExit;
  const resolvedTransition = transition ?? theme?.transition ?? builtinTransition;

  // Transition: include delay only on the entering scene
  const enterTransition = {
    delay,
    ...resolvedTransition,
  };
  const stayTransition = transition ?? theme?.transition ?? { duration: 0.4 };

  // Always use a fast exit transition — never inherit the enter delay
  const exitWithTransition = {
    ...resolvedExit,
    transition: { duration: 0.3 },
  };

  return (
    <AnimatePresence>
      {visible && (
        <MotionTag
          key={`ce-${enter}-${exit ?? 'inf'}`}
          initial={resolvedInitial}
          animate={resolvedAnimate}
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

// ─── createThemedCE() ────────────────────────────────────────────
// Factory that returns a CE component with episode-specific defaults.
// Define once in your episode, use everywhere — no need to pass theme
// to every CE instance.
//
// Usage (in episode constants.ts or VideoTemplate.tsx):
//
//   export const ECE = createThemedCE(ceThemes.blurIn);
//   // or with custom theme:
//   export const ECE = createThemedCE({
//     initial: { opacity: 0, scale: 0.3, filter: 'blur(12px)' },
//     animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
//     exit: { opacity: 0, x: -50 },
//     transition: { type: 'spring', stiffness: 200, damping: 25 },
//   });
//
// Then in VideoTemplate:
//   <ECE s={s} enter={2} exit={5} delay={0.3}>
//     <h2>This uses the episode's custom transition</h2>
//   </ECE>

export function createThemedCE(defaultTheme: CETheme) {
  return function ThemedCE(props: Omit<CEProps, 'theme'> & { theme?: CETheme }) {
    return <CE {...props} theme={props.theme ?? defaultTheme} />;
  };
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
