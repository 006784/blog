'use client';

import { motion, type Transition, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

export const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const APPLE_EASE_SOFT: [number, number, number, number] = [0.32, 0.72, 0, 1];
export const APPLE_EASE_SNAPPY: [number, number, number, number] = [0.3, 0.7, 0, 1];
export const APPLE_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 30, mass: 0.9 };
export const APPLE_SPRING_GENTLE: Transition = { type: 'spring', stiffness: 150, damping: 24, mass: 1 };
export const APPLE_SPRING_MODAL: Transition = { type: 'spring', stiffness: 310, damping: 30, mass: 0.86 };
export const APPLE_PAGE_TRANSITION: Transition = { duration: 0.62, ease: APPLE_EASE };
export const APPLE_FADE_QUICK: Transition = { duration: 0.3, ease: APPLE_EASE_SOFT };

export const HOVER_LIFT = { y: -6, scale: 1.004 };
export const HOVER_BUTTON = { y: -1, scale: 1.016 };
export const TAP_BUTTON = { y: 0, scale: 0.982 };

// Animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: APPLE_EASE_SOFT } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.988, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.72, ease: APPLE_EASE } 
  },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -24, filter: 'blur(6px)' },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: APPLE_EASE } 
  },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.94, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.62, ease: APPLE_EASE_SOFT } 
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.994, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: APPLE_PAGE_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.996,
    filter: 'blur(7px)',
    transition: { duration: 0.3, ease: APPLE_EASE_SOFT },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(14px)',
    transition: { duration: 0.3, ease: APPLE_EASE_SOFT },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.22, ease: APPLE_EASE_SOFT },
  },
};

export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.972, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: APPLE_SPRING_MODAL,
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    filter: 'blur(8px)',
    transition: { duration: 0.22, ease: APPLE_EASE_SOFT },
  },
};

export const bottomSheetVariants: Variants = {
  hidden: { opacity: 0.92, y: '12%', scale: 0.99, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { ...APPLE_SPRING_MODAL, mass: 0.92 },
  },
  exit: {
    opacity: 0.95,
    y: '10%',
    scale: 0.992,
    filter: 'blur(7px)',
    transition: { duration: 0.24, ease: APPLE_EASE_SOFT },
  },
};

// Animated section wrapper
interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-70px' }}
      variants={{
        hidden: { opacity: 0, y: 32, scale: 0.986, filter: 'blur(8px)' },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          filter: 'blur(0px)',
          transition: { 
            duration: 0.78, 
            delay,
            ease: APPLE_EASE
          } 
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated text reveal
interface AnimatedTextProps {
  text: string;
  className?: string;
  once?: boolean;
}

export function AnimatedText({ text, className = '', once = true }: AnimatedTextProps) {
  const words = text.split(' ');

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={staggerContainer}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={slideUp}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Magnetic button effect
interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, className = '', onClick }: MagneticButtonProps) {
  return (
    <motion.button
      whileHover={HOVER_BUTTON}
      whileTap={TAP_BUTTON}
      transition={APPLE_SPRING}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// Parallax wrapper
interface ParallaxProps {
  children: ReactNode;
  offset?: number;
  className?: string;
}

export function Parallax({ children, offset = 50, className = '' }: ParallaxProps) {
  return (
    <motion.div
      initial={{ y: offset, opacity: 0.82 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: APPLE_EASE_SOFT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating animation
interface FloatingProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function Floating({ children, className = '', duration = 6 }: FloatingProps) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
        x: [0, 3, 0],
        rotate: [0, 0.6, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: APPLE_EASE_SOFT,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Glow effect component
interface GlowProps {
  children: ReactNode;
  className?: string;
}

export function Glow({ children, className = '' }: GlowProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.008, y: -2 }}
      transition={{ duration: 0.35, ease: APPLE_EASE_SOFT }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-2xl opacity-0 blur-xl"
        whileHover={{ opacity: 0.2 }}
        transition={{ duration: 0.35, ease: APPLE_EASE_SOFT }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
