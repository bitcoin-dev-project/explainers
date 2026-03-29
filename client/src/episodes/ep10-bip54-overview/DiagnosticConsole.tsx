/**
 * DiagnosticConsole — The core visual. A 2×2 diagnostic grid.
 *
 * Manages:
 *   - Overall console frame (borders, glow)
 *   - 2×2 quadrant layout
 *   - Boot sequence via GSAP (power on → borders illuminate)
 *   - Status progression per quadrant based on scene
 *   - Twist sequence: timewarp quadrant splits to reveal new variant
 *
 * Animation lib: GSAP (useSceneGSAP) for boot + state changes.
 */

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneGSAP } from '@/lib/video';
import BugQuadrant from './BugQuadrant';
import ScanLineOverlay from './ScanLineOverlay';
import StatusBar from './StatusBar';
import { EP_COLORS, EP_SPRINGS, BUGS, type BugStatus, type BugId } from './constants';

/** Derive each quadrant's status from the current scene */
function getQuadrantStatus(bugIndex: number, scene: number): BugStatus {
  // Scenes 0-1: all dormant (boot sequence)
  if (scene <= 1) return 'dormant';
  // Scene 2-5: each bug scans in order (bug 0 at scene 2, bug 1 at scene 3, etc.)
  const scanScene = bugIndex + 2;
  if (scene < scanScene) return 'dormant';
  if (scene === scanScene) return 'scanning';
  // After its scan scene, it's diagnosed
  if (scene < 11) return 'diagnosed';
  // Scene 11+: all fixed
  return 'fixed';
}

/** Is this quadrant the one the camera is zoomed into? */
function isQuadrantActive(bugIndex: number, scene: number): boolean {
  return scene === bugIndex + 2;
}

interface DiagnosticConsoleProps {
  scene: number;
}

export default function DiagnosticConsole({ scene }: DiagnosticConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  // GSAP boot sequence
  useSceneGSAP(consoleRef, scene, {
    0: (tl) => {
      // Console powers on from black
      tl.from('.console-frame', {
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        ease: 'power2.out',
      })
      .from('.console-border', {
        opacity: 0,
        duration: 0.6,
        ease: 'power1.in',
      }, '-=0.6')
      .from('.quadrant-cell', {
        opacity: 0,
        scale: 0.9,
        stagger: 0.15,
        duration: 0.5,
        ease: 'power2.out',
      }, '-=0.3');
    },
    1: (tl) => {
      // Scan sweep — borders illuminate with cyan glow
      tl.to('.console-border', {
        borderColor: EP_COLORS.cyan,
        boxShadow: `0 0 30px ${EP_COLORS.cyan}30, inset 0 0 30px ${EP_COLORS.cyan}10`,
        duration: 0.8,
        ease: 'power2.out',
      })
      .to('.quadrant-cell', {
        borderColor: `${EP_COLORS.cyan}60`,
        stagger: 0.1,
        duration: 0.4,
      }, '-=0.4');
    },
    6: (tl) => {
      // All 4 diagnosed — border goes red
      tl.to('.console-border', {
        borderColor: EP_COLORS.red,
        boxShadow: `0 0 40px ${EP_COLORS.red}30, inset 0 0 20px ${EP_COLORS.red}10`,
        duration: 0.6,
        ease: 'power2.out',
      });
    },
    11: (tl) => {
      // Resolution — all green
      tl.to('.console-border', {
        borderColor: EP_COLORS.green,
        boxShadow: `0 0 40px ${EP_COLORS.green}30, inset 0 0 20px ${EP_COLORS.green}10`,
        duration: 0.8,
        ease: 'power2.out',
      })
      .to('.quadrant-cell', {
        borderColor: `${EP_COLORS.green}60`,
        stagger: 0.08,
        duration: 0.4,
      }, '-=0.4');
    },
  });

  // During the twist (scenes 9-10), show the variant split overlay on timewarp quadrant
  const showTwist = scene >= 9 && scene <= 10;
  const showVariantReveal = scene >= 10;

  return (
    <div
      ref={consoleRef}
      style={{
        position: 'absolute',
        left: '5vw',
        top: '5vh',
        width: '90vw',
        height: '90vh',
      }}
    >
      {/* Console outer frame */}
      <div
        className="console-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5vh',
          border: `2px solid ${EP_COLORS.steel}`,
          background: `${EP_COLORS.bg}e0`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {/* Scan line overlay */}
        <ScanLineOverlay opacity={scene >= 1 ? 1 : 0} />

        {/* Status bars */}
        <StatusBar scene={scene} visible={scene >= 0} />

        {/* 2×2 Quadrant Grid */}
        <div
          className="console-frame"
          style={{
            position: 'absolute',
            top: '5vh',
            left: '2vw',
            right: '2vw',
            bottom: '5vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '1.5vh',
          }}
        >
          {BUGS.map((bug, i) => (
            <div
              key={bug.id}
              className="quadrant-cell"
              style={{
                position: 'relative',
                borderRadius: '1vh',
                border: `1px solid ${EP_COLORS.steel}40`,
                transition: 'border-color 0.4s ease',
                overflow: 'hidden',
              }}
            >
              <BugQuadrant
                bug={bug}
                status={getQuadrantStatus(i, scene)}
                scene={scene}
                active={isQuadrantActive(i, scene)}
              />

              {/* Twist overlay on timewarp quadrant */}
              {i === 0 && showTwist && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  {/* Glitch lines */}
                  {Array.from({ length: 8 }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ x: 0, opacity: 0 }}
                      animate={{
                        x: [0, (j % 2 === 0 ? 8 : -8), 0],
                        opacity: [0, 1, 0.7],
                      }}
                      transition={{
                        duration: 0.15,
                        delay: j * 0.02,
                        repeat: scene === 9 ? 3 : 0,
                      }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${j * 12.5}%`,
                        height: '12.5%',
                        background: `${EP_COLORS.amber}15`,
                        borderTop: j > 0 ? `1px solid ${EP_COLORS.amber}30` : 'none',
                      }}
                    />
                  ))}

                  {/* Variant reveal — the quadrant "splits" */}
                  <AnimatePresence>
                    {showVariantReveal && (
                      <motion.div
                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                        animate={{ clipPath: 'inset(0 0% 0 50%)' }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `${EP_COLORS.panelBg}f0`,
                          borderLeft: `2px solid ${EP_COLORS.amber}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1.5vh',
                          zIndex: 11,
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, ...EP_SPRINGS.alert }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1.1vh',
                            letterSpacing: '0.2em',
                            color: EP_COLORS.amber,
                            fontWeight: 700,
                          }}
                        >
                          NEW VARIANT
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.8vh',
                            color: EP_COLORS.text,
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '0 1vh',
                          }}
                        >
                          Murch-Zawy
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.4 }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1vh',
                            color: EP_COLORS.muted,
                            textAlign: 'center',
                            lineHeight: 1.5,
                            padding: '0 1vh',
                          }}
                        >
                          Second timewarp vector<br />discovered during review
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
