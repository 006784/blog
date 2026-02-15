'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { Menu, X, Sun, Moon, Sparkles, PenLine } from 'lucide-react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import {
  APPLE_EASE,
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_BUTTON,
  TAP_BUTTON,
  modalBackdropVariants,
} from './Animations';

const navItems = [
  { name: '首页', href: '/' },
  { name: '博客', href: '/blog' },
  { name: '管理', href: '/dashboard' },
  { name: '关于', href: '/about' },
  { name: '联系', href: '/contact' },
];

const drawerVariants = {
  hidden: { x: '100%', opacity: 0.94, scale: 0.992, filter: 'blur(8px)' },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { ...APPLE_SPRING_GENTLE, stiffness: 210, damping: 28 },
  },
  exit: {
    x: '100%',
    opacity: 0.96,
    scale: 0.994,
    filter: 'blur(7px)',
    transition: { duration: 0.24, ease: APPLE_EASE_SOFT },
  },
};

function MagneticButton({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 170, damping: 20, mass: 0.9 });
  const springY = useSpring(y, { stiffness: 170, damping: 20, mass: 0.9 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.16);
    y.set((e.clientY - centerY) * 0.16);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={HOVER_BUTTON}
      whileTap={TAP_BUTTON}
      transition={APPLE_SPRING_GENTLE}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const currentTheme = resolvedTheme;

  return (
    <>
      <motion.nav
        initial={{ y: -48, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.62, ease: APPLE_EASE }}
        className={clsx(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-500',
          isScrolled
            ? 'glass border-b border-border/55 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={APPLE_SPRING_GENTLE}
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]"
            >
              <motion.div
                className="absolute inset-0 bg-white/22"
                initial={{ x: '-100%', opacity: 0 }}
                whileHover={{ x: '100%', opacity: 1 }}
                transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
              />
              <Sparkles className="relative z-10 h-4 w-4 text-white" />
            </motion.div>
            <motion.span
              className="hidden text-base font-semibold text-foreground sm:block"
              whileHover={{ x: 1.5 }}
              transition={APPLE_SPRING_GENTLE}
            >
              拾光
            </motion.span>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-border/60 bg-secondary/50 p-1.5 backdrop-blur-sm md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link key={item.name} href={item.href} className="relative px-4 py-2">
                  <motion.span
                    className={clsx(
                      'relative z-10 text-sm font-medium transition-colors duration-300',
                      active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                    whileHover={HOVER_BUTTON}
                    whileTap={TAP_BUTTON}
                    transition={APPLE_SPRING_GENTLE}
                  >
                    {item.name}
                  </motion.span>
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/25"
                      transition={{ ...APPLE_SPRING_GENTLE, stiffness: 240, damping: 24 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/write" className="hidden sm:block">
              <motion.button
                whileHover={HOVER_BUTTON}
                whileTap={TAP_BUTTON}
                transition={APPLE_SPRING_GENTLE}
                className="btn-primary ios-button-press flex items-center gap-2 px-4 py-2 text-sm"
              >
                <PenLine className="h-4 w-4" />
                <span>写文章</span>
              </motion.button>
            </Link>

            <MagneticButton
              onClick={toggleTheme}
              className="ios-button-press group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-secondary/80 text-muted-foreground backdrop-blur-sm hover:text-foreground"
            >
              <motion.div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    currentTheme === 'dark'
                      ? 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 70%)',
                }}
              />

              <AnimatePresence mode="wait">
                {mounted && (
                  <motion.div
                    key={currentTheme}
                    initial={{ y: -16, opacity: 0, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 16, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.32, ease: APPLE_EASE_SOFT }}
                    className="relative z-10"
                  >
                    {currentTheme === 'dark' ? (
                      <Sun className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Moon className="h-5 w-5 text-sky-500" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </MagneticButton>

            <MagneticButton
              onClick={() => setIsOpen(!isOpen)}
              className="ios-button-press relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-secondary/80 backdrop-blur-sm md:hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.28, ease: APPLE_EASE_SOFT }}
                  className="relative z-10"
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </MagneticButton>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-card fixed bottom-0 right-0 top-0 z-50 w-80 border-l border-border p-6 pt-24 shadow-2xl md:hidden"
            >
              <nav className="flex flex-col gap-2">
                {navItems.map((item, index) => {
                  const active = pathname === item.href;

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ x: 16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.06, duration: 0.34, ease: APPLE_EASE_SOFT }}
                    >
                      <Link href={item.href} onClick={() => setIsOpen(false)} className="block overflow-hidden rounded-2xl">
                        <motion.div
                          whileHover={{ x: 2, scale: 1.006 }}
                          whileTap={{ scale: 0.992 }}
                          transition={APPLE_SPRING_GENTLE}
                          className={clsx(
                            'flex items-center justify-between rounded-2xl px-5 py-4 text-lg font-medium',
                            active
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                              : 'bg-secondary/70 text-foreground hover:bg-secondary'
                          )}
                        >
                          {item.name}
                          <span className={clsx('text-base transition-opacity', active ? 'opacity-100' : 'opacity-45')}>→</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.34, ease: APPLE_EASE_SOFT }}
                className="mt-8 border-t border-border pt-6"
              >
                <motion.button
                  whileHover={HOVER_BUTTON}
                  whileTap={TAP_BUTTON}
                  transition={APPLE_SPRING_GENTLE}
                  onClick={toggleTheme}
                  className="ios-button-press flex w-full items-center justify-between rounded-2xl bg-secondary px-5 py-4"
                >
                  <span className="font-medium">{currentTheme === 'dark' ? '浅色模式' : '深色模式'}</span>
                  <span
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      currentTheme === 'dark' ? 'bg-amber-400/20' : 'bg-sky-500/20'
                    )}
                  >
                    {currentTheme === 'dark' ? (
                      <Sun className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Moon className="h-5 w-5 text-sky-500" />
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
