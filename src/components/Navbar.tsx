'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Menu, X, Sun, Moon, Sparkles, PenLine } from 'lucide-react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

const navItems = [
  { name: '首页', href: '/' },
  { name: '博客', href: '/blog' },
  { name: '管理', href: '/dashboard' },
  { name: '关于', href: '/about' },
  { name: '联系', href: '/contact' },
];

// 磁性按钮组件
function MagneticButton({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
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
      whileTap={{ scale: 0.9 }}
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
  const { theme, setTheme, resolvedTheme } = useTheme();

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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled
            ? 'glass border-b border-border/50 shadow-lg shadow-black/5'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%', opacity: 0 }}
                  whileHover={{ x: '100%', opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
                <Sparkles className="w-5 h-5 text-white relative z-10" />
              </motion.div>
              <motion.span 
                className="font-semibold text-lg hidden sm:block shimmer-text"
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                拾光
              </motion.span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 p-1.5 bg-secondary/50 rounded-full backdrop-blur-sm">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 group"
                >
                  <motion.span
                    className={clsx(
                      'relative z-10 text-sm font-medium transition-colors duration-300',
                      pathname === item.href
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {item.name}
                  </motion.span>
                  {pathname === item.href && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Write Button - Desktop */}
              <Link href="/write" className="hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                >
                  <PenLine className="w-4 h-4" />
                  <span>写文章</span>
                </motion.button>
              </Link>

              {/* Theme Toggle - 增强版 */}
              <MagneticButton
                onClick={toggleTheme}
                className="relative w-11 h-11 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors overflow-hidden group"
              >
                {/* 背景光晕效果 */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: currentTheme === 'dark' 
                      ? 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)'
                  }}
                />
                
                <AnimatePresence mode="wait">
                  {mounted && (
                    <motion.div
                      key={currentTheme}
                      initial={{ y: -30, opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ y: 30, opacity: 0, rotate: 90, scale: 0.5 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.25, 0.46, 0.45, 0.94],
                        scale: { type: 'spring', stiffness: 300, damping: 20 }
                      }}
                      className="relative z-10"
                    >
                      {currentTheme === 'dark' ? (
                        <Sun className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-500" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 点击涟漪效果 */}
                <motion.div
                  className="absolute inset-0 bg-foreground/10 rounded-full"
                  initial={{ scale: 0, opacity: 1 }}
                  whileTap={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </MagneticButton>

              {/* Mobile Menu Button */}
              <MagneticButton
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden relative w-11 h-11 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isOpen ? 'close' : 'open'}
                    initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative z-10"
                  >
                    {isOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </MagneticButton>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-2xl"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-l border-border p-6 pt-24 shadow-2xl"
            >
              <nav className="flex flex-col gap-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="relative block overflow-hidden"
                    >
                      <motion.div
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                          'px-5 py-4 rounded-2xl text-lg font-medium transition-all flex items-center justify-between',
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'hover:bg-secondary'
                        )}
                      >
                        {item.name}
                        <motion.span
                          initial={{ x: -10, opacity: 0 }}
                          whileHover={{ x: 0, opacity: 1 }}
                          className="text-xl"
                        >
                          →
                        </motion.span>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile theme toggle */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 pt-6 border-t border-border"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className="w-full px-5 py-4 rounded-2xl bg-secondary flex items-center justify-between"
                >
                  <span className="font-medium">
                    {currentTheme === 'dark' ? '浅色模式' : '深色模式'}
                  </span>
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      currentTheme === 'dark' ? 'bg-amber-400/20' : 'bg-indigo-500/20'
                    )}
                  >
                    {currentTheme === 'dark' ? (
                      <Sun className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-indigo-500" />
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
