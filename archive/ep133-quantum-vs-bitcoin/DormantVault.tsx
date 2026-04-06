import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { EP_COLORS } from './constants';

interface DormantVaultProps {
  /** Whether the cascade animation is active */
  active: boolean;
  /** Number of coins to display in grid */
  cols?: number;
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Grid of coin icons representing 1.7M BTC.
 * Each coin has a lock. On activation, locks turn red in cascade.
 * GSAP stagger cascade for the gut-punch scene.
 */
export default function DormantVault({
  active,
  cols = 8,
  rows = 6,
  className,
  style,
}: DormantVaultProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cascadeStarted, setCascadeStarted] = useState(false);

  useEffect(() => {
    if (!active || cascadeStarted || !gridRef.current) return;
    setCascadeStarted(true);

    // Entrance animation
    const coins = gridRef.current.querySelectorAll('.vault-coin');
    gsap.fromTo(coins,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        stagger: 0.04,
        ease: 'back.out(1.5)',
      },
    );

    // Lock cascade after coins appear
    const locks = gridRef.current.querySelectorAll('.vault-lock');
    gsap.to(locks, {
      color: EP_COLORS.accent,
      textShadow: `0 0 8px ${EP_COLORS.accentGlow}`,
      duration: 0.15,
      stagger: 0.06,
      delay: 1.8,
      ease: 'power2.in',
    });
  }, [active, cascadeStarted]);

  useEffect(() => {
    if (!active) setCascadeStarted(false);
  }, [active]);

  const total = cols * rows;
  const coinSize = 60;
  const gap = 8;

  return (
    <div
      ref={gridRef}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${coinSize}px)`,
        gap: `${gap}px`,
        justifyContent: 'center',
        ...style,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="vault-coin"
          style={{
            width: coinSize,
            height: coinSize,
            borderRadius: '50%',
            border: `2px solid ${EP_COLORS.dormant}`,
            background: `radial-gradient(circle at 40% 35%, ${EP_COLORS.surface}, ${EP_COLORS.bgPanel})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            position: 'relative',
          }}
        >
          {/* Lock icon */}
          <span
            className="vault-lock"
            style={{
              fontSize: 20,
              color: EP_COLORS.dormant,
              transition: 'color 0.15s',
              userSelect: 'none',
            }}
          >
            🔒
          </span>

          {/* Subtle shimmer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
              animation: 'vaultShimmer 3s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes vaultShimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
