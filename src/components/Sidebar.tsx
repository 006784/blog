'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, User, Mail, PenLine, 
  Sun, Moon, Sparkles, ChevronLeft,
  Heart, Music, Camera, BookOpen, Github, Twitter,
  Menu, X, Shield, LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAdmin } from './AdminProvider';
import clsx from 'clsx';

const navItems = [
  { name: '首页', href: '/', icon: Home, gradient: 'from-blue-500 to-cyan-500' },
  { name: '博客', href: '/blog', icon: FileText, gradient: 'from-violet-500 to-purple-500' },
  { name: '歌单', href: '/music', icon: Music, gradient: 'from-pink-500 to-rose-500' },
  { name: '相册', href: '/gallery', icon: Camera, gradient: 'from-amber-500 to-orange-500' },
  { name: '日记', href: '/diary', icon: BookOpen, gradient: 'from-emerald-500 to-teal-500' },
  { name: '关于', href: '/about', icon: User, gradient: 'from-indigo-500 to-blue-500' },
  { name: '联系', href: '/contact', icon: Mail, gradient: 'from-fuchsia-500 to-pink-500' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin, showLoginModal, logout } = useAdmin();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);
  
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '88px' : '280px');
  }, [isCollapsed]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'fixed left-0 top-0 bottom-0 z-50',
          'flex flex-col',
          'transition-all duration-300 ease-out',
          'hidden md:flex',
          isCollapsed ? 'w-[88px]' : 'w-[280px]'
        )}
      >
        {/* 背景层 */}
        <div className="absolute inset-0 bg-card/70 backdrop-blur-2xl border-r border-border/50" />
        
        {/* 装饰光效 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        
        {/* 动态光球 */}
        <motion.div 
          className="absolute top-20 -left-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl pointer-events-none"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 内容 */}
        <div className="relative flex flex-col h-full z-10">
          {/* Logo区域 */}
          <div className={clsx(
            'flex items-center border-b border-border/30',
            isCollapsed ? 'h-20 justify-center px-4' : 'h-24 px-6'
          )}>
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative"
              >
                {/* Logo外圈 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="font-bold text-2xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent">
                      拾光
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">记录每一刻美好</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* 用户信息卡片 */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-4"
              >
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/50 to-primary/5 border border-border/50 overflow-hidden">
                  {/* 装饰 */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
                  
                  <div className="relative flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white font-bold text-lg">
                        S
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">拾光博主</p>
                      <p className="text-xs text-muted-foreground truncate">探索 · 记录 · 分享</p>
                    </div>
                  </div>
                  
                  {/* 社交链接 */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <a href="#" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                    <a href="#" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Twitter className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 导航菜单 */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.name;
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onHoverStart={() => setHoveredItem(item.name)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Link href={item.href}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
                          'transition-all duration-300',
                          'group cursor-pointer overflow-hidden',
                          isCollapsed && 'justify-center',
                          isActive 
                            ? 'text-white' 
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {/* 活跃/悬浮背景 */}
                        <motion.div
                          className={clsx(
                            'absolute inset-0 rounded-xl',
                            `bg-gradient-to-r ${item.gradient}`
                          )}
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : isHovered ? 0.15 : 0,
                            scale: isActive || isHovered ? 1 : 0.95,
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        
                        {/* 活跃指示条 */}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-lg shadow-white/50"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* 图标 */}
                        <div className={clsx(
                          'relative z-10 flex items-center justify-center',
                          'w-9 h-9 rounded-lg transition-all duration-300',
                          isActive 
                            ? 'bg-white/20' 
                            : 'bg-secondary/50 group-hover:bg-secondary'
                        )}>
                          <item.icon className={clsx(
                            'w-[18px] h-[18px] transition-colors',
                            isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                          )} />
                        </div>
                        
                        {/* 文字 */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className={clsx(
                                'relative z-10 font-medium whitespace-nowrap',
                                isActive ? 'text-white' : ''
                              )}
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* 悬浮光效 */}
                        {!isActive && (
                          <motion.div 
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: isHovered ? '100%' : '-100%' }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* 写文章按钮 */}
            <div className="mt-6 px-1">
              {isAdmin ? (
                <Link href="/write">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'relative w-full flex items-center justify-center gap-2',
                      'px-4 py-3.5 rounded-xl',
                      'text-white font-semibold',
                      'overflow-hidden',
                      'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
                      'transition-shadow duration-300'
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    <PenLine className="w-5 h-5 relative z-10" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative z-10 whitespace-nowrap"
                        >
                          写文章
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={showLoginModal}
                  className={clsx(
                    'relative w-full flex items-center justify-center gap-2',
                    'px-4 py-3.5 rounded-xl',
                    'text-white font-semibold',
                    'overflow-hidden',
                    'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
                    'transition-shadow duration-300'
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />
                  <Shield className="w-5 h-5 relative z-10" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="relative z-10 whitespace-nowrap"
                      >
                        管理员登录
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </div>
          </nav>

          {/* 底部操作区 */}
          <div className="p-4 border-t border-border/30 space-y-2">
            {/* 主题切换 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'bg-secondary/30 hover:bg-secondary/60',
                'border border-border/30',
                'transition-all duration-300',
                isCollapsed && 'justify-center'
              )}
            >
              {mounted && (
                <motion.div
                  key={resolvedTheme}
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    resolvedTheme === 'dark' 
                      ? 'bg-amber-500/20' 
                      : 'bg-indigo-500/20'
                  )}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-[18px] h-[18px] text-amber-400" />
                  ) : (
                    <Moon className="w-[18px] h-[18px] text-indigo-500" />
                  )}
                </motion.div>
              )}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {resolvedTheme === 'dark' ? '浅色模式' : '深色模式'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* 折叠按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleCollapse}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'bg-secondary/30 hover:bg-secondary/60',
                'border border-border/30',
                'transition-all duration-300',
                isCollapsed && 'justify-center'
              )}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <ChevronLeft className="w-[18px] h-[18px] text-primary" />
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    收起菜单
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* 管理员登出按钮 */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                  'bg-red-500/10 hover:bg-red-500/20',
                  'border border-red-500/20',
                  'transition-all duration-300',
                  isCollapsed && 'justify-center'
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-[18px] h-[18px] text-red-500" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium text-red-500"
                    >
                      退出管理
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {/* 版权信息 */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="text-center py-3 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
                  <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
                    Made with <Heart className="w-3 h-3 text-red-400 fill-red-400 animate-pulse" /> by 拾光
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* 移动端底部导航 */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="mx-3 mb-3">
          <div className="relative flex items-center justify-around px-2 py-2 rounded-2xl bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            
            {/* 首页 */}
            <Link href="/">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
                  'transition-all duration-300'
                )}
              >
                {pathname === '/' && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Home className={clsx(
                  'w-5 h-5 relative z-10 transition-colors',
                  pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={clsx(
                  'text-[10px] font-medium relative z-10 transition-colors',
                  pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                )}>
                  首页
                </span>
              </motion.div>
            </Link>

            {/* 博客 */}
            <Link href="/blog">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
                  'transition-all duration-300'
                )}
              >
                {pathname === '/blog' && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 opacity-20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <FileText className={clsx(
                  'w-5 h-5 relative z-10 transition-colors',
                  pathname === '/blog' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={clsx(
                  'text-[10px] font-medium relative z-10 transition-colors',
                  pathname === '/blog' ? 'text-primary' : 'text-muted-foreground'
                )}>
                  博客
                </span>
              </motion.div>
            </Link>

            {/* 写文章按钮 - 中间突出 */}
            {isAdmin ? (
              <Link href="/write">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center shadow-lg shadow-primary/30">
                    <PenLine className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </Link>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={showLoginModal}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center shadow-lg shadow-primary/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </motion.button>
            )}

            {/* 相册 */}
            <Link href="/gallery">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
                  'transition-all duration-300'
                )}
              >
                {pathname === '/gallery' && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Camera className={clsx(
                  'w-5 h-5 relative z-10 transition-colors',
                  pathname === '/gallery' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={clsx(
                  'text-[10px] font-medium relative z-10 transition-colors',
                  pathname === '/gallery' ? 'text-primary' : 'text-muted-foreground'
                )}>
                  相册
                </span>
              </motion.div>
            </Link>

            {/* 更多按钮 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">
                更多
              </span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* 移动端抽屉菜单 */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />
            
            {/* 抽屉内容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-[60] md:hidden max-h-[80vh] overflow-hidden"
            >
              {/* 拖动条 */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setShowMobileMenu(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-secondary/50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 菜单内容 */}
              <div className="px-4 pb-8 pt-2">
                {/* 用户信息 */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                  <div>
                    <p className="font-semibold">拾光博主</p>
                    <p className="text-xs text-muted-foreground">探索 · 记录 · 分享</p>
                  </div>
                </div>

                {/* 导航网格 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className={clsx(
                            'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all',
                            isActive 
                              ? 'bg-primary/15 text-primary' 
                              : 'bg-secondary/30 text-muted-foreground'
                          )}
                        >
                          <item.icon className="w-6 h-6" />
                          <span className="text-xs font-medium">{item.name}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                {/* 主题切换 */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/30 mb-3"
                >
                  <div className="flex items-center gap-3">
                    {mounted && (
                      resolvedTheme === 'dark' ? (
                        <Sun className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-500" />
                      )
                    )}
                    <span className="font-medium">
                      {resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                    </span>
                  </div>
                  <div className={clsx(
                    'w-12 h-7 rounded-full relative transition-colors',
                    resolvedTheme === 'dark' ? 'bg-primary' : 'bg-muted'
                  )}>
                    <motion.div 
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ left: resolvedTheme === 'dark' ? '26px' : '4px' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  </div>
                </motion.button>

                {/* 管理员登录/登出 */}
                {isAdmin ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-500">退出管理员</span>
                    </div>
                    <Shield className="w-5 h-5 text-red-500" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowMobileMenu(false);
                      showLoginModal();
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/10 mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="font-medium text-primary">管理员登录</span>
                    </div>
                  </motion.button>
                )}

                {/* 社交链接 */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <a href="#" className="p-3 rounded-full bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 rounded-full bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>

                {/* 版权 */}
                <p className="text-center text-xs text-muted-foreground/50 mt-4 flex items-center justify-center gap-1">
                  Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by 拾光
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
