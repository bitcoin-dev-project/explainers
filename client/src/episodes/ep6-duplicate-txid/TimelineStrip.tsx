/**
 * TimelineStrip — Horizontal timeline with cascading event nodes.
 *
 * Shows the 15-year saga from 2010 to 2046+.
 * A wire draws in left-to-right, then nodes light up sequentially.
 * Color-coded by event type (crimson for bugs, amber for partial fixes,
 * gold for BIP 54, green for defused).
 *
 * Used in: Scene 18 (the resolution timeline)
 */

import { motion } from 'framer-motion';
import { C, EP, F } from './constants';

export interface TimelineEvent {
  /** Year or date label */
  year: string;
  /** Short event description */
  label: string;
  /** Optional sub-label */
  sublabel?: string;
  /** Node color */
  color: string;
  /** Whether this node is larger/emphasized */
  emphasized?: boolean;
}

interface TimelineStripProps {
  /** Events to display along the timeline */
  events: TimelineEvent[];
  /** How many events to show as lit up (0 = none, events.length = all) */
  activeCount?: number;
  /** Entrance delay */
  delay?: number;
  /** Width of the timeline */
  width?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export function TimelineStrip({
  events,
  activeCount = events.length,
  delay = 0,
  width = '70vw',
  style,
}: TimelineStripProps) {
  const nodeSpacing = 100 / (events.length - 1); // percentage between nodes

  return (
    <motion.div
      style={{
        position: 'relative',
        width,
        height: '12vh',
        ...style,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {/* ── Wire ──────────────────────────────────────────────── */}
      <svg
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '0.15vw',
          marginTop: '-0.075vw',
          overflow: 'visible',
        }}
        viewBox={`0 0 1000 2`}
        preserveAspectRatio="none"
        width="100%"
        height="0.15vw"
      >
        {/* Background wire (dim) */}
        <line
          x1="0" y1="1" x2="1000" y2="1"
          stroke={C.dividerStrong}
          strokeWidth="2"
        />
        {/* Animated draw-in wire */}
        <motion.line
          x1="0" y1="1" x2="1000" y2="1"
          stroke={C.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.2, duration: 1.8, ease: 'easeInOut' }}
        />
      </svg>

      {/* ── Event Nodes ───────────────────────────────────────── */}
      {events.map((event, i) => {
        const isActive = i < activeCount;
        const nodeDelay = delay + 0.5 + i * 0.25;
        const x = `${i * nodeSpacing}%`;
        const isEmphasized = event.emphasized;
        const nodeSize = isEmphasized ? '1.1vw' : '0.7vw';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6vh',
              zIndex: isEmphasized ? 2 : 1,
            }}
          >
            {/* Year label (above) */}
            <motion.span
              style={{
                fontSize: isEmphasized ? '0.7vw' : '0.6vw',
                fontWeight: 700,
                fontFamily: F.display,
                color: isActive ? event.color : C.textFaint,
                whiteSpace: 'nowrap',
                position: 'absolute',
                bottom: 'calc(50% + 1.2vh)',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
              transition={{ delay: nodeDelay, ...EP.reveal }}
            >
              {event.year}
            </motion.span>

            {/* Node dot */}
            <motion.div
              style={{
                width: nodeSize,
                height: nodeSize,
                borderRadius: '50%',
                backgroundColor: isActive ? event.color : C.dividerStrong,
                border: `0.08vw solid ${isActive ? event.color : C.dividerStrong}`,
                boxShadow: isActive && isEmphasized
                  ? `0 0 0.8vw ${event.color}50, 0 0 0.3vw ${event.color}30`
                  : isActive
                    ? `0 0 0.4vw ${event.color}30`
                    : 'none',
                transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: nodeDelay, ...EP.pop }}
            />

            {/* Event label (below) */}
            <motion.div
              style={{
                position: 'absolute',
                top: 'calc(50% + 1.2vh)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.15vh',
                whiteSpace: 'nowrap',
              }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
              transition={{ delay: nodeDelay + 0.1, ...EP.reveal }}
            >
              <span style={{
                fontSize: isEmphasized ? '0.65vw' : '0.55vw',
                fontWeight: 600,
                fontFamily: F.body,
                color: isActive ? C.text : C.textFaint,
              }}>
                {event.label}
              </span>
              {event.sublabel && (
                <span style={{
                  fontSize: '0.45vw',
                  fontFamily: F.body,
                  color: C.textMuted,
                }}>
                  {event.sublabel}
                </span>
              )}
            </motion.div>
          </div>
        );
      })}
    </motion.div>
  );
}
