import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface CrackEffectProps {
  active: boolean;
  width?: number;
  height?: number;
  color?: string;
  separateAmount?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable SVG crack-and-separate effect.
 * When `active` becomes true, fracture lines draw across the element
 * and the two halves separate slightly.
 */
export default function CrackEffect({
  active,
  width = 600,
  height = 100,
  color = EP_COLORS.accent,
  separateAmount = 8,
  className,
  style,
}: CrackEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hasActivated, setHasActivated] = useState(false);

  useEffect(() => {
    if (!active || hasActivated || !svgRef.current) return;
    setHasActivated(true);

    const svg = svgRef.current;
    const mainCrack = svg.querySelector('.crack-main') as SVGPathElement;
    const branchA = svg.querySelector('.crack-branch-a') as SVGPathElement;
    const branchB = svg.querySelector('.crack-branch-b') as SVGPathElement;
    const leftHalf = svg.querySelector('.crack-left') as SVGGElement;
    const rightHalf = svg.querySelector('.crack-right') as SVGGElement;

    if (mainCrack) {
      const len = mainCrack.getTotalLength();
      gsap.set(mainCrack, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(mainCrack, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.in' });
    }

    if (branchA) {
      const len = branchA.getTotalLength();
      gsap.set(branchA, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(branchA, { strokeDashoffset: 0, duration: 0.2, delay: 0.15, ease: 'power2.in' });
    }

    if (branchB) {
      const len = branchB.getTotalLength();
      gsap.set(branchB, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(branchB, { strokeDashoffset: 0, duration: 0.2, delay: 0.2, ease: 'power2.in' });
    }

    if (leftHalf && rightHalf) {
      gsap.to(leftHalf, { x: -separateAmount, duration: 0.3, delay: 0.25, ease: 'power2.out' });
      gsap.to(rightHalf, { x: separateAmount, duration: 0.3, delay: 0.25, ease: 'power2.out' });
    }
  }, [active, hasActivated, separateAmount]);

  // Reset when active goes false
  useEffect(() => {
    if (!active) setHasActivated(false);
  }, [active]);

  const cx = width / 2;
  const cy = height / 2;
  // Jagged crack path through center
  const mainPath = `M ${cx - 10} ${cy - 2}
    L ${cx - 6} ${cy + 4}
    L ${cx - 2} ${cy - 3}
    L ${cx + 3} ${cy + 2}
    L ${cx + 7} ${cy - 1}
    L ${cx + 12} ${cy + 3}`;

  const branchPathA = `M ${cx - 4} ${cy + 2} L ${cx - 8} ${cy + 12}`;
  const branchPathB = `M ${cx + 5} ${cy} L ${cx + 10} ${cy - 10}`;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Split halves for separation animation */}
      <g className="crack-left">
        <rect x={0} y={0} width={cx} height={height} fill="transparent" />
      </g>
      <g className="crack-right">
        <rect x={cx} y={0} width={cx} height={height} fill="transparent" />
      </g>

      {/* Fracture lines */}
      <path
        className="crack-main"
        d={mainPath}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        className="crack-branch-a"
        d={branchPathA}
        stroke={color}
        strokeWidth={1}
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
      />
      <path
        className="crack-branch-b"
        d={branchPathB}
        stroke={color}
        strokeWidth={1}
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
