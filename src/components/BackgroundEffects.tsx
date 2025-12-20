'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// 极光效果背景
export function AuroraBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      {/* Aurora layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        
        {/* Aurora wave 1 */}
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[150%] h-[100%] opacity-30"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--bg-gradient-1) 50%, transparent 100%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Aurora wave 2 */}
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-[120%] h-[80%] opacity-25"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--bg-gradient-2) 50%, transparent 100%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, 30, 0],
            rotate: [0, -3, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Aurora wave 3 */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[100%] h-[60%] opacity-20"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--bg-gradient-3) 50%, transparent 100%)',
            filter: 'blur(120px)',
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Accent glow */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, var(--bg-gradient-4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(at 40% 20%, var(--bg-gradient-1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, var(--bg-gradient-2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, var(--bg-gradient-3) 0px, transparent 50%),
            radial-gradient(at 80% 50%, var(--bg-gradient-4) 0px, transparent 50%),
            radial-gradient(at 0% 100%, var(--bg-gradient-1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, var(--bg-gradient-2) 0px, transparent 50%)
          `,
          filter: 'blur(100px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// 星空背景
export function StarfieldBackground({ children }: { children?: React.ReactNode }) {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-foreground"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Nebula effects */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, var(--bg-gradient-1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, var(--bg-gradient-4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// 网格动态背景
export function GridBackground({ children }: { children?: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="relative overflow-hidden">
      {/* Animated grid */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }}
      />

      {/* Mouse follower glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          opacity: 0.15,
          filter: 'blur(60px)',
        }}
      />

      {/* Gradient orbs */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30"
        style={{
          background: 'radial-gradient(circle, var(--bg-gradient-1) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-25"
        style={{
          background: 'radial-gradient(circle, var(--bg-gradient-4) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// 粒子漂浮效果
export function FloatingParticles({ count = 30 }: { count?: number }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    const colors = [
      'var(--primary)',
      'var(--gradient-start)',
      'var(--gradient-end)',
      '#06b6d4',
      '#8b5cf6',
      '#f43f5e',
    ];
    
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// 波浪背景
export function WaveBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      {/* Wave layers */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[400px] opacity-20"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,100 C320,180 420,20 740,100 C1060,180 1140,40 1440,100 L1440,400 L0,400 Z"
          fill="url(#wave-gradient-1)"
          animate={{
            d: [
              "M0,100 C320,180 420,20 740,100 C1060,180 1140,40 1440,100 L1440,400 L0,400 Z",
              "M0,150 C320,70 420,180 740,100 C1060,20 1140,180 1440,120 L1440,400 L0,400 Z",
              "M0,100 C320,180 420,20 740,100 C1060,180 1140,40 1440,100 L1440,400 L0,400 Z",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.path
          d="M0,150 C360,230 540,70 900,150 C1260,230 1340,70 1440,150 L1440,400 L0,400 Z"
          fill="url(#wave-gradient-2)"
          animate={{
            d: [
              "M0,150 C360,230 540,70 900,150 C1260,230 1340,70 1440,150 L1440,400 L0,400 Z",
              "M0,200 C360,120 540,230 900,150 C1260,70 1340,230 1440,180 L1440,400 L0,400 Z",
              "M0,150 C360,230 540,70 900,150 C1260,230 1340,70 1440,150 L1440,400 L0,400 Z",
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--bg-gradient-1)" />
            <stop offset="100%" stopColor="var(--bg-gradient-2)" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--bg-gradient-3)" />
            <stop offset="100%" stopColor="var(--bg-gradient-4)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// 光晕效果
export function GlowOrb({ 
  color = 'var(--primary)', 
  size = 300,
  blur = 80,
  className = '',
}: { 
  color?: string; 
  size?: number;
  blur?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
