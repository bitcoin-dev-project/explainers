/**
 * SpongeCanvas — THE HERO VISUAL
 *
 * Canvas 2D particle simulation of the Keccak sponge construction.
 * A tall translucent vessel divided by a glowing waterline:
 *   - Above: Rate zone (r=1088 bits) — sky-blue, exposed, accessible
 *   - Below: Capacity zone (c=512 bits) — deep navy, hidden, impenetrable
 *
 * Modes: idle | absorb | permute | squeeze | attack
 * The canvas is ALWAYS alive — particles drift with Brownian motion.
 */

import { useRef, useEffect, useCallback } from 'react';
import { EP_COLORS, PARTICLE, SPONGE } from './constants';

// ─── Types ───────────────────────────────────────────────────────

export type SpongeMode = 'idle' | 'absorb' | 'permute' | 'squeeze' | 'attack';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  zone: 'rate' | 'capacity';
  color: string;
  alpha: number;
  /** For attack mode — the attacker particle */
  isAttacker?: boolean;
  /** Bounce animation progress (0-1) */
  bouncePhase?: number;
}

interface SpongeCanvasProps {
  mode: SpongeMode;
  /** Canvas CSS width in px */
  width?: number;
  /** Canvas CSS height in px */
  height?: number;
  /** Show the attack bounce glow */
  showBounceGlow?: boolean;
  /** Scale factor for mini mode (comparison view) */
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Helpers ─────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ─── Component ───────────────────────────────────────────────────

export default function SpongeCanvas({
  mode,
  width = 480,
  height = 700,
  showBounceGlow = false,
  scale = 1,
  className,
  style,
}: SpongeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const modeRef = useRef<SpongeMode>(mode);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const bounceGlowRef = useRef(0);
  const showBounceGlowRef = useRef(showBounceGlow);

  // Keep refs in sync
  modeRef.current = mode;
  showBounceGlowRef.current = showBounceGlow;

  // DPR for crisp rendering
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
  const cw = width * dpr;
  const ch = height * dpr;

  // Tank geometry (in canvas pixels)
  const tankPad = width * SPONGE.tankPadding * dpr;
  const tankX = tankPad;
  const tankY = tankPad;
  const tankW = cw - tankPad * 2;
  const tankH = ch - tankPad * 2;
  const waterlineY = tankY + tankH * SPONGE.rateRatio;
  const cr = SPONGE.cornerRadius * dpr;

  // ─── Init particles ──────────────────────────────────────────

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const rateCount = Math.floor(PARTICLE.count * SPONGE.rateRatio);
    const capCount = PARTICLE.count - rateCount;

    // Rate zone particles
    for (let i = 0; i < rateCount; i++) {
      particles.push({
        x: lerp(tankX + 10 * dpr, tankX + tankW - 10 * dpr, Math.random()),
        y: lerp(tankY + 10 * dpr, waterlineY - 10 * dpr, Math.random()),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: lerp(PARTICLE.minRadius, PARTICLE.maxRadius, Math.random()) * dpr,
        zone: 'rate',
        color: Math.random() > 0.3 ? EP_COLORS.rate : EP_COLORS.rateGlow,
        alpha: lerp(0.4, 0.9, Math.random()),
      });
    }

    // Capacity zone particles
    for (let i = 0; i < capCount; i++) {
      particles.push({
        x: lerp(tankX + 10 * dpr, tankX + tankW - 10 * dpr, Math.random()),
        y: lerp(waterlineY + 10 * dpr, tankY + tankH - 10 * dpr, Math.random()),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: lerp(PARTICLE.minRadius, PARTICLE.maxRadius, Math.random()) * dpr,
        zone: 'capacity',
        color: Math.random() > 0.4 ? EP_COLORS.capacity : EP_COLORS.accent,
        alpha: lerp(0.3, 0.7, Math.random()),
      });
    }

    particlesRef.current = particles;
  }, [cw, ch, dpr, tankX, tankY, tankW, tankH, waterlineY]);

  // ─── Physics update ──────────────────────────────────────────

  const updateParticles = useCallback((dt: number) => {
    const particles = particlesRef.current;
    const currentMode = modeRef.current;

    for (const p of particles) {
      // Brownian motion (always active — the tank is alive)
      p.vx += (Math.random() - 0.5) * PARTICLE.brownianForce * dt;
      p.vy += (Math.random() - 0.5) * PARTICLE.brownianForce * dt;

      // Zone-specific physics
      if (p.zone === 'rate') {
        // Light gravity
        p.vy += PARTICLE.rateGravity * dpr * dt;
        // Low viscosity
        p.vx *= PARTICLE.rateViscosity;
        p.vy *= PARTICLE.rateViscosity;
      } else {
        // Higher viscosity in capacity zone — particles move slower, heavier
        p.vx *= PARTICLE.capacityViscosity;
        p.vy *= PARTICLE.capacityViscosity;
      }

      // Mode-specific forces
      switch (currentMode) {
        case 'absorb': {
          if (p.zone === 'rate') {
            // Pull particles downward toward waterline
            p.vy += PARTICLE.absorbSpeed * 0.3 * dt * dpr;
          }
          break;
        }
        case 'permute': {
          // Violent churn — random forces on ALL particles
          p.vx += (Math.random() - 0.5) * PARTICLE.permuteForce * dt;
          p.vy += (Math.random() - 0.5) * PARTICLE.permuteForce * dt;
          break;
        }
        case 'squeeze': {
          if (p.zone === 'rate') {
            // Push rate particles upward (output escaping)
            p.vy += PARTICLE.squeezeSpeed * 0.4 * dt * dpr;
          }
          // Capacity particles stay put — trapped
          break;
        }
        case 'attack': {
          if (p.isAttacker) {
            // Attacker tries to push down toward capacity
            p.vy += 1.5 * dpr * dt;
            // Bounce off waterline
            if (p.y > waterlineY - p.radius * 2) {
              p.vy = -Math.abs(p.vy) * PARTICLE.bounceElasticity;
              p.y = waterlineY - p.radius * 2;
              p.bouncePhase = 1;
              bounceGlowRef.current = 1;
            }
          }
          break;
        }
      }

      // Clamp speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > PARTICLE.maxSpeed * dpr) {
        const ratio = (PARTICLE.maxSpeed * dpr) / speed;
        p.vx *= ratio;
        p.vy *= ratio;
      }

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Contain within tank walls
      if (p.x < tankX + p.radius) { p.x = tankX + p.radius; p.vx *= -0.5; }
      if (p.x > tankX + tankW - p.radius) { p.x = tankX + tankW - p.radius; p.vx *= -0.5; }
      if (p.y < tankY + p.radius) { p.y = tankY + p.radius; p.vy *= -0.5; }
      if (p.y > tankY + tankH - p.radius) { p.y = tankY + tankH - p.radius; p.vy *= -0.5; }

      // Zone containment: rate stays above waterline, capacity stays below
      if (!p.isAttacker) {
        if (p.zone === 'rate' && p.y > waterlineY - p.radius) {
          p.y = waterlineY - p.radius;
          p.vy *= -0.3;
        }
        if (p.zone === 'capacity' && p.y < waterlineY + p.radius) {
          p.y = waterlineY + p.radius;
          p.vy *= -0.3;
        }
      }

      // Decay bounce phase
      if (p.bouncePhase && p.bouncePhase > 0) {
        p.bouncePhase -= dt * 2;
        if (p.bouncePhase < 0) p.bouncePhase = 0;
      }
    }

    // Decay bounce glow
    if (bounceGlowRef.current > 0) {
      bounceGlowRef.current -= dt * 1.5;
      if (bounceGlowRef.current < 0) bounceGlowRef.current = 0;
    }
  }, [dpr, tankX, tankY, tankW, tankH, waterlineY]);

  // ─── Render ──────────────────────────────────────────────────

  const render = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, cw, ch);

    // ── Tank background ──
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankW, tankH, cr);
    ctx.clip();

    // Rate zone gradient (top)
    const rateGrad = ctx.createLinearGradient(0, tankY, 0, waterlineY);
    rateGrad.addColorStop(0, EP_COLORS.bgAlt + '60');
    rateGrad.addColorStop(1, EP_COLORS.rate + '15');
    ctx.fillStyle = rateGrad;
    ctx.fillRect(tankX, tankY, tankW, waterlineY - tankY);

    // Capacity zone gradient (bottom) — deeper, darker
    const capGrad = ctx.createLinearGradient(0, waterlineY, 0, tankY + tankH);
    capGrad.addColorStop(0, EP_COLORS.capacityGlow + '40');
    capGrad.addColorStop(1, EP_COLORS.bg + 'CC');
    ctx.fillStyle = capGrad;
    ctx.fillRect(tankX, waterlineY, tankW, tankH - (waterlineY - tankY));

    // Depth pulse in capacity zone (ambient)
    const pulseAlpha = 0.05 + 0.03 * Math.sin(time * 0.001);
    ctx.fillStyle = EP_COLORS.accent + Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(tankX, waterlineY, tankW, tankH - (waterlineY - tankY));

    ctx.restore();

    // ── Tank border ──
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankW, tankH, cr);
    ctx.strokeStyle = EP_COLORS.muted + '60';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();
    ctx.restore();

    // ── Particles ──
    const particles = particlesRef.current;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankW, tankH, cr);
    ctx.clip();

    for (const p of particles) {
      const rgb = hexToRgb(p.isAttacker ? EP_COLORS.danger : p.color);

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.alpha * 0.15})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.alpha})`;
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
      ctx.fill();

      // Attacker bounce flash
      if (p.isAttacker && p.bouncePhase && p.bouncePhase > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (3 + p.bouncePhase * 6), 0, Math.PI * 2);
        const dangerRgb = hexToRgb(EP_COLORS.dangerGlow);
        ctx.fillStyle = `rgba(${dangerRgb[0]}, ${dangerRgb[1]}, ${dangerRgb[2]}, ${p.bouncePhase * 0.4})`;
        ctx.fill();
      }
    }
    ctx.restore();

    // ── Waterline ──
    const waveAmplitude = 3 * dpr;
    const waveFreq = 0.015;
    const waveSpeed = time * 0.002;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tankX, waterlineY);
    for (let x = tankX; x <= tankX + tankW; x += 2) {
      const wave = Math.sin((x - tankX) * waveFreq + waveSpeed) * waveAmplitude;
      ctx.lineTo(x, waterlineY + wave);
    }

    // Main waterline
    ctx.strokeStyle = EP_COLORS.waterline;
    ctx.lineWidth = 2 * dpr;
    ctx.shadowColor = EP_COLORS.waterline;
    ctx.shadowBlur = 12 * dpr;
    ctx.stroke();

    // Second pass — brighter core
    ctx.shadowBlur = 4 * dpr;
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = EP_COLORS.rateGlow;
    ctx.stroke();
    ctx.restore();

    // ── Bounce glow on waterline (attack mode) ──
    if (bounceGlowRef.current > 0 && showBounceGlowRef.current) {
      ctx.save();
      const glowAlpha = bounceGlowRef.current;
      ctx.beginPath();
      ctx.moveTo(tankX, waterlineY);
      for (let x = tankX; x <= tankX + tankW; x += 2) {
        const wave = Math.sin((x - tankX) * waveFreq + waveSpeed) * waveAmplitude;
        ctx.lineTo(x, waterlineY + wave);
      }
      ctx.strokeStyle = EP_COLORS.danger;
      ctx.lineWidth = 3 * dpr;
      ctx.shadowColor = EP_COLORS.danger;
      ctx.shadowBlur = 25 * dpr * glowAlpha;
      ctx.globalAlpha = glowAlpha;
      ctx.stroke();
      ctx.restore();
    }

    // ── Rate zone shimmer (caustics) ──
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankW, waterlineY - tankY, [cr, cr, 0, 0]);
    ctx.clip();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 5; i++) {
      const cx = tankX + tankW * (0.2 + i * 0.15) + Math.sin(time * 0.0008 + i) * 20 * dpr;
      const cy = tankY + (waterlineY - tankY) * 0.5 + Math.cos(time * 0.0006 + i * 2) * 15 * dpr;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * dpr);
      grad.addColorStop(0, EP_COLORS.rateGlow);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 40 * dpr, cy - 40 * dpr, 80 * dpr, 80 * dpr);
    }
    ctx.restore();
  }, [cw, ch, dpr, tankX, tankY, tankW, tankH, waterlineY, cr]);

  // ─── Spawn attacker particle ──────────────────────────────────

  const spawnedAttacker = useRef(false);

  useEffect(() => {
    if (mode === 'attack' && !spawnedAttacker.current) {
      spawnedAttacker.current = true;
      particlesRef.current.push({
        x: tankX + tankW * 0.5,
        y: tankY + 20 * dpr,
        vx: 0,
        vy: 2 * dpr,
        radius: PARTICLE.maxRadius * 1.5 * dpr,
        zone: 'rate',
        color: EP_COLORS.danger,
        alpha: 0.95,
        isAttacker: true,
        bouncePhase: 0,
      });
    }
    if (mode !== 'attack') {
      spawnedAttacker.current = false;
      particlesRef.current = particlesRef.current.filter(p => !p.isAttacker);
    }
  }, [mode, dpr, tankX, tankY, tankW]);

  // ─── Absorb: spawn incoming particles ─────────────────────────

  const absorbTimer = useRef(0);

  useEffect(() => {
    if (mode === 'absorb') {
      absorbTimer.current = 0;
    }
  }, [mode]);

  // ─── Animation loop ──────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initParticles();

    let lastTime = performance.now();
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      const dt = clamp((now - lastTime) / 16.667, 0.1, 3); // normalize to ~60fps
      lastTime = now;
      timeRef.current = now;
      frameRef.current++;

      // Spawn new rate particles during absorb
      if (modeRef.current === 'absorb') {
        absorbTimer.current += dt;
        if (absorbTimer.current > 8 && particlesRef.current.length < PARTICLE.count + 30) {
          absorbTimer.current = 0;
          particlesRef.current.push({
            x: lerp(tankX + 20 * dpr, tankX + tankW - 20 * dpr, Math.random()),
            y: tankY + 5 * dpr,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 * dpr,
            radius: lerp(PARTICLE.minRadius, PARTICLE.maxRadius, Math.random()) * dpr,
            zone: 'rate',
            color: EP_COLORS.rateGlow,
            alpha: lerp(0.5, 0.9, Math.random()),
          });
        }
      }

      // Remove excess particles during squeeze (rate particles that escape)
      if (modeRef.current === 'squeeze') {
        particlesRef.current = particlesRef.current.filter(p => {
          if (p.zone === 'rate' && p.y < tankY) return false;
          return true;
        });
      }

      updateParticles(dt);
      render(ctx, now);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [cw, ch, initParticles, updateParticles, render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: width * scale,
        height: height * scale,
        ...style,
      }}
    />
  );
}
