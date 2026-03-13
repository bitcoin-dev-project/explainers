/**
 * Diagram Primitives — reusable, animated components for flow diagrams,
 * connectors, tables, and data visualizations.
 *
 * Design principles (from frontend-design skill):
 * - Soft shadows, not hard offsets
 * - SVG arrowheads, not text characters
 * - Subtle curves on connectors
 * - Consistent spacing rhythm
 * - Minimal but intentional
 */

import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { springs } from './animations';

// ─── Color helpers ───────────────────────────────────────────────

type BoxVariant = 'default' | 'primary' | 'accent' | 'success' | 'danger' | 'muted';

const variantStyles: Record<BoxVariant, {
  bg: string;
  border: string;
  text: string;
  shadow: string;
  stripe?: string;
}> = {
  default: {
    bg: 'var(--color-bg-muted)',
    border: 'rgba(28,28,28,0.15)',
    text: 'var(--color-text-primary)',
    shadow: 'rgba(28,28,28,0.08)',
  },
  primary: {
    bg: 'rgba(231,127,50,0.1)',
    border: 'var(--color-primary)',
    text: 'var(--color-primary)',
    shadow: 'rgba(231,127,50,0.12)',
    stripe: 'var(--color-primary)',
  },
  accent: {
    bg: 'rgba(111,125,193,0.08)',
    border: 'var(--color-secondary)',
    text: 'var(--color-secondary)',
    shadow: 'rgba(111,125,193,0.1)',
    stripe: 'var(--color-secondary)',
  },
  success: {
    bg: 'rgba(46,204,113,0.08)',
    border: '#2ECC71',
    text: '#2ECC71',
    shadow: 'rgba(46,204,113,0.1)',
    stripe: '#2ECC71',
  },
  danger: {
    bg: 'rgba(231,76,60,0.08)',
    border: '#E74C3C',
    text: '#E74C3C',
    shadow: 'rgba(231,76,60,0.1)',
    stripe: '#E74C3C',
  },
  muted: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.1)',
    text: 'rgba(255,255,255,0.5)',
    shadow: 'transparent',
  },
};

// For dark-background scenes
const darkVariantStyles: Record<BoxVariant, typeof variantStyles.default> = {
  default: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.12)',
    text: 'rgba(255,255,255,0.85)',
    shadow: 'rgba(0,0,0,0.2)',
  },
  primary: {
    bg: 'rgba(231,127,50,0.1)',
    border: '#E77F32',
    text: '#E77F32',
    shadow: 'rgba(231,127,50,0.15)',
    stripe: '#E77F32',
  },
  accent: {
    bg: 'rgba(111,125,193,0.08)',
    border: '#6F7DC1',
    text: '#6F7DC1',
    shadow: 'rgba(111,125,193,0.12)',
    stripe: '#6F7DC1',
  },
  success: {
    bg: 'rgba(46,204,113,0.08)',
    border: '#2ECC71',
    text: '#2ECC71',
    shadow: 'rgba(46,204,113,0.12)',
    stripe: '#2ECC71',
  },
  danger: {
    bg: 'rgba(231,76,60,0.08)',
    border: '#E74C3C',
    text: '#E74C3C',
    shadow: 'rgba(231,76,60,0.12)',
    stripe: '#E74C3C',
  },
  muted: {
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
    text: 'rgba(255,255,255,0.3)',
    shadow: 'transparent',
  },
};

function getVariant(variant: BoxVariant, dark?: boolean) {
  return dark ? darkVariantStyles[variant] : variantStyles[variant];
}

// ─── DiagramBox ──────────────────────────────────────────────────
// A clean box for flow diagrams. Soft shadow, optional left accent stripe.

interface DiagramBoxProps {
  label: string;
  sublabel?: string;
  delay?: number;
  variant?: BoxVariant;
  dark?: boolean;
  mono?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Custom color override for border + text */
  color?: string;
}

const sizeMap = {
  sm: { px: '1.2vw', py: '1vh', text: '1.1vw', sub: '0.7vw' },
  md: { px: '2vw', py: '1.5vh', text: '1.4vw', sub: '0.85vw' },
  lg: { px: '2.5vw', py: '2vh', text: '1.8vw', sub: '1vw' },
};

export function DiagramBox({
  label,
  sublabel,
  delay = 0,
  variant = 'default',
  dark = false,
  mono = true,
  size = 'md',
  color,
}: DiagramBoxProps) {
  const s = getVariant(variant, dark);
  const sz = sizeMap[size];
  const borderColor = color || s.border;
  const textColor = color || s.text;

  return (
    <motion.div
      style={{
        padding: `${sz.py} ${sz.px}`,
        borderRadius: '0.5vw',
        backgroundColor: color ? `${color}10` : s.bg,
        border: `0.12vw solid ${borderColor}`,
        boxShadow: `0 0.2vw 0.8vw ${s.shadow}`,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: sublabel ? '0.4vh' : undefined,
      }}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
    >
      <span
        style={{
          fontSize: sz.text,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontSize: sz.sub,
            color: dark ? 'rgba(255,255,255,0.35)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {sublabel}
        </span>
      )}
    </motion.div>
  );
}

// ─── Arrow ───────────────────────────────────────────────────────
// SVG arrow with proper arrowhead. Draws in with pathLength animation.

interface ArrowProps {
  delay?: number;
  direction?: 'right' | 'left' | 'down' | 'up';
  length?: string;        // e.g. '4vw'
  color?: string;
  dark?: boolean;
  label?: string;
  dashed?: boolean;
  curved?: boolean;
}

export function Arrow({
  delay = 0,
  direction = 'right',
  length = '4vw',
  color,
  dark = false,
  label,
  dashed = false,
  curved = false,
}: ArrowProps) {
  const defaultColor = dark ? 'rgba(255,255,255,0.25)' : 'var(--color-text-muted)';
  const c = color || defaultColor;
  const isVertical = direction === 'down' || direction === 'up';

  // Viewbox dimensions
  const vw = isVertical ? 24 : 100;
  const vh = isVertical ? 100 : 24;

  // Path
  let path: string;
  if (isVertical) {
    if (curved) {
      path = direction === 'down'
        ? 'M12 4 C12 30, 12 70, 12 90'
        : 'M12 90 C12 70, 12 30, 12 4';
    } else {
      path = direction === 'down' ? 'M12 4 L12 90' : 'M12 90 L12 4';
    }
  } else {
    if (curved) {
      path = direction === 'right'
        ? 'M4 12 C30 4, 70 20, 96 12'
        : 'M96 12 C70 20, 30 4, 4 12';
    } else {
      path = direction === 'right' ? 'M4 12 L96 12' : 'M96 12 L4 12';
    }
  }

  // Arrowhead points
  let arrowhead: string;
  if (direction === 'right') arrowhead = 'M88 6 L98 12 L88 18';
  else if (direction === 'left') arrowhead = 'M12 6 L2 12 L12 18';
  else if (direction === 'down') arrowhead = 'M6 82 L12 96 L18 82';
  else arrowhead = 'M6 18 L12 2 L18 18';

  const containerStyle: React.CSSProperties = isVertical
    ? { width: '1.5vw', height: length, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }
    : { width: length, height: '1.5vw', display: 'flex', alignItems: 'center', position: 'relative' };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vw} ${vh}`}
        fill="none"
        style={{ overflow: 'visible' }}
      >
        <motion.path
          d={path}
          stroke={c}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={dashed ? '6 4' : undefined}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.35, ease: 'circOut' }}
        />
        <motion.path
          d={arrowhead}
          stroke={c}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4, duration: 0.15 }}
        />
      </svg>
      {label && (
        <motion.span
          style={{
            position: 'absolute',
            ...(isVertical
              ? { left: '120%', top: '50%', transform: 'translateY(-50%)' }
              : { bottom: '120%', left: '50%', transform: 'translateX(-50%)' }),
            fontSize: '0.85vw',
            fontFamily: 'var(--font-mono)',
            color: c,
            whiteSpace: 'nowrap',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.45 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

// ─── Connector ───────────────────────────────────────────────────
// SVG bezier curve between two points. Great for tree diagrams.

interface ConnectorProps {
  /** Start point as [x, y] in the SVG viewBox */
  from: [number, number];
  /** End point as [x, y] in the SVG viewBox */
  to: [number, number];
  delay?: number;
  color?: string;
  dark?: boolean;
  dashed?: boolean;
  strokeWidth?: number;
  showArrow?: boolean;
  /** Curvature amount (0 = straight, higher = more curve) */
  curvature?: number;
}

export function Connector({
  from,
  to,
  delay = 0,
  color,
  dark = false,
  dashed = false,
  strokeWidth = 2,
  showArrow = false,
  curvature = 0.5,
}: ConnectorProps) {
  const defaultColor = dark ? 'rgba(255,255,255,0.15)' : 'rgba(28,28,28,0.15)';
  const c = color || defaultColor;

  // Calculate control points for bezier
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  // Determine curve direction based on dominant axis
  let cp1: [number, number];
  let cp2: [number, number];

  if (Math.abs(dy) > Math.abs(dx)) {
    // More vertical — control points offset horizontally
    const offsetY = dy * curvature;
    cp1 = [from[0], from[1] + offsetY];
    cp2 = [to[0], to[1] - offsetY];
  } else {
    // More horizontal — control points offset vertically
    const offsetX = dx * curvature;
    cp1 = [from[0] + offsetX, from[1]];
    cp2 = [to[0] - offsetX, to[1]];
  }

  const path = `M${from[0]} ${from[1]} C${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${to[0]} ${to[1]}`;

  // Arrowhead at endpoint
  const angle = Math.atan2(to[1] - cp2[1], to[0] - cp2[0]);
  const arrowLen = 8;
  const arrowAngle = Math.PI / 6;
  const a1x = to[0] - arrowLen * Math.cos(angle - arrowAngle);
  const a1y = to[1] - arrowLen * Math.sin(angle - arrowAngle);
  const a2x = to[0] - arrowLen * Math.cos(angle + arrowAngle);
  const a2y = to[1] - arrowLen * Math.sin(angle + arrowAngle);

  return (
    <g>
      <motion.path
        d={path}
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? '6 4' : undefined}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.4, ease: 'circOut' }}
      />
      {showArrow && (
        <motion.path
          d={`M${a1x} ${a1y} L${to[0]} ${to[1]} L${a2x} ${a2y}`}
          stroke={c}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.35, duration: 0.15 }}
        />
      )}
    </g>
  );
}

// ─── FlowRow ─────────────────────────────────────────────────────
// Horizontal flow: Box → Arrow → Box → Arrow → Box
// Auto-staggers delays for you.

interface FlowStep {
  label: string;
  sublabel?: string;
  variant?: BoxVariant;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface FlowRowProps {
  steps: FlowStep[];
  baseDelay?: number;
  stagger?: number;
  arrowLength?: string;
  dark?: boolean;
  arrowColor?: string;
}

export function FlowRow({
  steps,
  baseDelay = 0.5,
  stagger = 0.5,
  arrowLength = '3.5vw',
  dark = false,
  arrowColor,
}: FlowRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
      {steps.map((step, i) => {
        const boxDelay = baseDelay + i * stagger;
        const arrowDelay = boxDelay + stagger * 0.5;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
            <DiagramBox
              label={step.label}
              sublabel={step.sublabel}
              delay={boxDelay}
              variant={step.variant || 'default'}
              dark={dark}
              color={step.color}
              size={step.size}
            />
            {i < steps.length - 1 && (
              <Arrow
                delay={arrowDelay}
                length={arrowLength}
                dark={dark}
                color={arrowColor}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────
// Pill-shaped label for step numbers, tags, status indicators.

interface BadgeProps {
  children: React.ReactNode;
  delay?: number;
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral';
  dark?: boolean;
  size?: 'sm' | 'md';
}

const badgeColors = {
  primary: { bg: 'var(--color-primary)', text: '#fff' },
  accent: { bg: 'var(--color-secondary)', text: '#fff' },
  success: { bg: '#2ECC71', text: '#fff' },
  danger: { bg: '#E74C3C', text: '#fff' },
  neutral: { bg: 'rgba(28,28,28,0.08)', text: 'var(--color-text-primary)' },
};

const badgeColorsDark = {
  primary: { bg: '#E77F32', text: '#fff' },
  accent: { bg: '#6F7DC1', text: '#fff' },
  success: { bg: '#2ECC71', text: '#fff' },
  danger: { bg: '#E74C3C', text: '#fff' },
  neutral: { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.8)' },
};

export function Badge({
  children,
  delay = 0,
  variant = 'primary',
  dark = false,
  size = 'md',
}: BadgeProps) {
  const colors = dark ? badgeColorsDark[variant] : badgeColors[variant];
  const isSm = size === 'sm';

  return (
    <motion.span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSm ? '0.3vh 0.8vw' : '0.5vh 1.2vw',
        borderRadius: '2vw',
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: isSm ? '0.8vw' : '1vw',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.02em',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.bouncy }}
    >
      {children}
    </motion.span>
  );
}

// ─── DataCell ────────────────────────────────────────────────────
// Monospace text with subtle background. For hashes, addresses, hex values.

interface DataCellProps {
  children: React.ReactNode;
  delay?: number;
  highlight?: boolean;
  color?: string;
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DataCell({
  children,
  delay = 0,
  highlight = false,
  color,
  dark = false,
  size = 'md',
}: DataCellProps) {
  const highlightColor = color || 'var(--color-primary)';
  const textSize = size === 'sm' ? '0.9vw' : size === 'lg' ? '1.4vw' : '1.1vw';

  return (
    <motion.code
      style={{
        display: 'inline-block',
        padding: '0.4vh 0.8vw',
        borderRadius: '0.3vw',
        backgroundColor: highlight
          ? `${highlightColor}15`
          : dark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(28,28,28,0.04)',
        border: highlight ? `0.1vw solid ${highlightColor}40` : '0.1vw solid transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: textSize,
        fontWeight: 600,
        color: highlight
          ? highlightColor
          : dark
            ? 'rgba(255,255,255,0.7)'
            : 'var(--color-text-primary)',
        letterSpacing: '0.03em',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'circOut' }}
    >
      {children}
    </motion.code>
  );
}

// ─── TableGrid ───────────────────────────────────────────────────
// Clean animated table with header, row stagger, and highlight support.

interface TableColumn {
  header: string;
  width: string;      // e.g. '6vw'
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
}

interface TableRow {
  cells: React.ReactNode[];
  highlight?: boolean;
  highlightColor?: string;
}

interface TableGridProps {
  columns: TableColumn[];
  rows: TableRow[];
  baseDelay?: number;
  rowStagger?: number;
  dark?: boolean;
  compact?: boolean;
}

export function TableGrid({
  columns,
  rows,
  baseDelay = 0.5,
  rowStagger = 0.3,
  dark = false,
  compact = false,
}: TableGridProps) {
  const cellPy = compact ? '0.8vh' : '1.2vh';
  const textColor = dark ? 'rgba(255,255,255,0.85)' : 'var(--color-text-primary)';
  const headerColor = dark ? 'rgba(255,255,255,0.4)' : 'var(--color-text-muted)';
  const dividerColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,28,28,0.06)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3vh' }}>
      {/* Header */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `0.6vh 0.5vw`,
          borderBottom: `0.1vw solid ${dividerColor}`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: baseDelay }}
      >
        {columns.map((col, i) => (
          <span
            key={i}
            style={{
              width: col.width,
              textAlign: col.align || 'center',
              fontSize: '0.85vw',
              fontWeight: 600,
              color: headerColor,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {col.header}
          </span>
        ))}
      </motion.div>

      {/* Rows */}
      {rows.map((row, ri) => {
        const rowDelay = baseDelay + 0.3 + ri * rowStagger;
        const hlColor = row.highlightColor || 'var(--color-primary)';

        return (
          <motion.div
            key={ri}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: `${cellPy} 0.5vw`,
              borderRadius: '0.3vw',
              backgroundColor: row.highlight ? `${hlColor}12` : 'transparent',
              borderLeft: row.highlight ? `0.2vw solid ${hlColor}` : '0.2vw solid transparent',
              borderBottom: `0.05vw solid ${dividerColor}`,
            }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowDelay, ...springs.snappy }}
          >
            {row.cells.map((cell, ci) => (
              <span
                key={ci}
                style={{
                  width: columns[ci].width,
                  textAlign: columns[ci].align || 'center',
                  fontSize: compact ? '1vw' : '1.2vw',
                  fontWeight: 600,
                  color: row.highlight ? hlColor : textColor,
                  fontFamily: columns[ci].mono !== false ? 'var(--font-mono)' : 'var(--font-display)',
                }}
              >
                {cell}
              </span>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Brace ───────────────────────────────────────────────────────
// Animated curly brace (top or bottom) that spans a width.

interface BraceProps {
  width: string;       // e.g. '40vw'
  delay?: number;
  color?: string;
  dark?: boolean;
  direction?: 'down' | 'up';
  label?: string;
}

export function Brace({
  width,
  delay = 0,
  color,
  dark = false,
  direction = 'down',
  label,
}: BraceProps) {
  const c = color || (dark ? 'rgba(255,255,255,0.3)' : 'var(--color-secondary)');
  const isDown = direction === 'down';
  const pathD = isDown
    ? 'M 8 4 Q 8 22, 200 22 Q 392 22, 392 4'
    : 'M 8 22 Q 8 4, 200 4 Q 392 4, 392 22';
  const tickY1 = isDown ? '22' : '4';
  const tickY2 = isDown ? '32' : '-6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
      <svg width={width} height="2.5vh" viewBox="0 0 400 34" fill="none" style={{ overflow: 'visible' }}>
        <motion.path
          d={pathD}
          stroke={c}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay, duration: 0.6, ease: 'circOut' }}
        />
        <motion.line
          x1="200" y1={tickY1} x2="200" y2={tickY2}
          stroke={c}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.25 }}
        />
      </svg>
      {label && (
        <motion.span
          style={{
            fontSize: '1.1vw',
            fontWeight: 700,
            color: c,
            fontFamily: 'var(--font-display)',
          }}
          initial={{ opacity: 0, y: isDown ? -6 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.7 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

// ─── TreeNode ────────────────────────────────────────────────────
// For Merkle trees and hierarchy diagrams. Renders an SVG node.

interface TreeNodeProps {
  x: number;
  y: number;
  label: string;
  delay?: number;
  variant?: BoxVariant;
  dark?: boolean;
  width?: number;
  height?: number;
}

export function TreeNode({
  x,
  y,
  label,
  delay = 0,
  variant = 'default',
  dark = false,
  width = 60,
  height = 26,
}: TreeNodeProps) {
  const s = getVariant(variant, dark);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.snappy }}
      style={{ transformOrigin: `${x}px ${y + height / 2}px` }}
    >
      <rect
        x={x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={s.bg}
        stroke={s.border}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + height / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={s.text}
        fontSize={10}
        fontFamily="var(--font-mono)"
        fontWeight="bold"
      >
        {label}
      </text>
    </motion.g>
  );
}

// ─── Highlight Box ───────────────────────────────────────────────
// A subtle glow/highlight wrapper for emphasizing a group of elements.

interface HighlightBoxProps extends HTMLMotionProps<'div'> {
  delay?: number;
  color?: string;
  dark?: boolean;
  padding?: string;
  children: React.ReactNode;
}

export function HighlightBox({
  delay = 0,
  color = 'var(--color-primary)',
  dark = false,
  padding = '1.5vh 1.5vw',
  children,
  ...rest
}: HighlightBoxProps) {
  return (
    <motion.div
      style={{
        padding,
        borderRadius: '0.6vw',
        backgroundColor: `${color}08`,
        border: `0.1vw solid ${color}25`,
        boxShadow: `0 0 2vw ${color}10`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
