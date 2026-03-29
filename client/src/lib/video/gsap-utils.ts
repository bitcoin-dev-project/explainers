/**
 * GSAP utilities for episode animations.
 *
 * GSAP is the imperative counterpart to Framer Motion's declarative approach.
 * Use GSAP when you need:
 * - Complex choreographed sequences ("at 0.5s do X, at 1.2s do Y, at 2s reverse Z")
 * - Timeline scrubbing (play/pause/reverse/seek)
 * - Precise timing control (overlap, stagger with custom easing)
 * - Effects that Framer Motion can't do (morphSVG, drawSVG, text scramble)
 *
 * GSAP targets DOM elements via refs. Use useRef + useGSAP for cleanup.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── useGSAP ─────────────────────────────────────────────────────
// Run a GSAP animation that auto-cleans on unmount.
// The callback receives a gsap.Context for scoping.
//
// Usage:
//   const container = useRef<HTMLDivElement>(null);
//   useGSAP(container, (ctx) => {
//     gsap.from('.block', { opacity: 0, y: 50, stagger: 0.2, duration: 0.8 });
//   }, [scene]);

export function useGSAP(
  /** Ref to the container element — GSAP will scope selectors to it */
  scopeRef: React.RefObject<HTMLElement | null>,
  /** Animation callback — runs inside a gsap.context() for automatic cleanup */
  callback: (ctx: gsap.Context) => void,
  /** Dependencies — re-runs animation when these change (e.g., scene number) */
  deps: any[] = [],
) {
  useEffect(() => {
    if (!scopeRef.current) return;
    const ctx = gsap.context(() => {
      callback(ctx!);
    }, scopeRef.current);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── useTimeline ─────────────────────────────────────────────────
// Create a GSAP timeline scoped to a container. Returns the timeline
// so you can add animations imperatively.
//
// Usage:
//   const container = useRef<HTMLDivElement>(null);
//   const tl = useTimeline(container, { defaults: { duration: 0.6 } });
//
//   useEffect(() => {
//     if (!tl.current) return;
//     tl.current
//       .clear()
//       .from('.title', { opacity: 0, y: 40 })
//       .from('.subtitle', { opacity: 0, y: 20 }, '-=0.3')
//       .from('.diagram', { scale: 0, ease: 'back.out(1.7)' }, '-=0.2');
//   }, [scene]);

export function useTimeline(
  scopeRef: React.RefObject<HTMLElement | null>,
  config?: gsap.TimelineVars,
) {
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!scopeRef.current) return;
    const ctx = gsap.context(() => {
      tl.current = gsap.timeline(config);
    }, scopeRef.current);
    return () => {
      tl.current?.kill();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tl;
}

// ─── Scene-driven GSAP ─���────────────────────────────────────────
// Run different GSAP animations per scene. Cleans up between scenes.
//
// Usage:
//   const container = useRef<HTMLDivElement>(null);
//   useSceneGSAP(container, scene, {
//     0: (tl) => {
//       tl.from('.title', { opacity: 0, scale: 0.5, duration: 1, ease: 'power3.out' })
//         .from('.subtitle', { opacity: 0, y: 30 }, '-=0.5');
//     },
//     2: (tl) => {
//       tl.to('.title', { y: -100, opacity: 0, duration: 0.6 })
//         .from('.diagram', { scale: 0, rotation: -10, ease: 'back.out(2)' }, '-=0.3')
//         .from('.label', { opacity: 0, x: -20, stagger: 0.15 });
//     },
//     5: (tl) => {
//       tl.to('.diagram', { scale: 1.5, x: -200, duration: 0.8 }) // zoom in
//         .from('.detail', { opacity: 0, scale: 0.8 }, '-=0.4');
//     },
//   });

export function useSceneGSAP(
  scopeRef: React.RefObject<HTMLElement | null>,
  scene: number,
  sceneAnimations: Record<number, (tl: gsap.core.Timeline) => void>,
) {
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!scopeRef.current) return;

    // Kill previous timeline
    tlRef.current?.kill();
    ctxRef.current?.revert();

    // Find the animation for this scene (highest key <= current scene)
    const keys = Object.keys(sceneAnimations).map(Number).sort((a, b) => a - b);
    const activeKey = [...keys].reverse().find(k => scene >= k);

    if (activeKey === undefined || !sceneAnimations[activeKey]) return;

    ctxRef.current = gsap.context(() => {
      tlRef.current = gsap.timeline();
      sceneAnimations[activeKey](tlRef.current);
    }, scopeRef.current);

    return () => {
      tlRef.current?.kill();
      ctxRef.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
}

// ─── Presets ─────────────────────────────────────────────────────
// Common GSAP animation patterns as reusable configs.

export const gsapPresets = {
  /** Stagger children in with fade + slide */
  staggerIn: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: { opacity: 0, y: 30, stagger: 0.12, duration: 0.6, ease: 'power2.out', ...opts },
  }),

  /** Typewriter: reveal text character by character */
  typewriter: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: { opacity: 0, display: 'inline-block', stagger: 0.03, duration: 0.1, ease: 'none', ...opts },
  }),

  /** Data cascade: elements appear in rapid succession (for hash/binary visualizations) */
  cascade: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: { opacity: 0, scale: 0.5, stagger: 0.02, duration: 0.3, ease: 'back.out(1.7)', ...opts },
  }),

  /** Shatter: elements scatter outward (for break/attack moments) */
  shatter: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: {
      x: () => gsap.utils.random(-200, 200),
      y: () => gsap.utils.random(-200, 200),
      rotation: () => gsap.utils.random(-45, 45),
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.02,
      ...opts,
    },
  }),

  /** Assemble: reverse of shatter — fragments come together */
  assemble: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: {
      startAt: {
        x: () => gsap.utils.random(-300, 300),
        y: () => gsap.utils.random(-300, 300),
        rotation: () => gsap.utils.random(-90, 90),
        opacity: 0,
      },
      x: 0, y: 0, rotation: 0, opacity: 1,
      duration: 1,
      ease: 'power3.inOut',
      stagger: 0.03,
      ...opts,
    },
  }),

  /** Propagate: radial reveal from a center point (for network/broadcast) */
  propagate: (selector: string, opts?: gsap.TweenVars) => ({
    targets: selector,
    vars: {
      opacity: 0,
      scale: 0,
      stagger: { each: 0.1, from: 'center', ease: 'power2.out' },
      duration: 0.5,
      ease: 'back.out(1.4)',
      ...opts,
    },
  }),
};
