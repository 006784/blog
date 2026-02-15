'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const { resolvedTheme } = useTheme();

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const area = width * height;
    const count = Math.min(72, Math.max(18, Math.floor(area / 28000)));
    
    const colors = resolvedTheme === 'dark' 
      ? ['#7dd3fc', '#93c5fd', '#5eead4', '#fbbf24']
      : ['#0ea5e9', '#38bdf8', '#14b8a6', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        size: Math.random() * 1.2 + 0.7,
        opacity: Math.random() * 0.16 + 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return particles;
  }, [resolvedTheme]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    const connectionDistance = 110;
    const mouseDistance = 150;

    // 更新和绘制粒子
    particles.forEach((particle, i) => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 边界检测
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      // 鼠标交互 - 轻微排斥
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < mouseDistance && dist > 0) {
        const force = (mouseDistance - dist) / mouseDistance * 0.008;
        particle.vx -= (dx / dist) * force;
        particle.vy -= (dy / dist) * force;
      }

      // 限制速度
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > 0.35) {
        particle.vx = (particle.vx / speed) * 0.35;
        particle.vy = (particle.vy / speed) * 0.35;
      }

      // 绘制粒子
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();

      // 绘制连线
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = (1 - distance / connectionDistance) * 0.08;
          ctx.lineWidth = 0.45;
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };
    handleReducedMotion();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = createParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      drawParticles(ctx, canvas.width, canvas.height);
      if (!reducedMotionRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    mediaQuery.addEventListener('change', handleReducedMotion);

    if (reducedMotionRef.current) {
      drawParticles(ctx, canvas.width, canvas.height);
    } else {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      mediaQuery.removeEventListener('change', handleReducedMotion);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticles, drawParticles]);

  // 主题变化时重新创建粒子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      particlesRef.current = createParticles(canvas.width, canvas.height);
    }
  }, [resolvedTheme, createParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-65 dark:opacity-55"
      style={{ background: 'transparent' }}
    />
  );
}
