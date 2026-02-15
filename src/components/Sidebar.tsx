'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  BookOpen,
  Camera,
  ChevronLeft,
  Compass,
  FileText,
  FolderOpen,
  Home,
  Link as LinkIcon,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Music,
  PenLine,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useAdmin } from './AdminProvider';
import { useProfile } from './ProfileProvider';
import { EnhancedSearch } from './EnhancedSearch';
import {
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_BUTTON,
  TAP_BUTTON,
  bottomSheetVariants,
  modalBackdropVariants,
} from './Animations';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const contentItems: NavItem[] = [
  { name: '首页', href: '/', icon: Home },
  { name: '博客', href: '/blog', icon: FileText },
  { name: '归档', href: '/archive', icon: Archive },
];

const exploreItems: NavItem[] = [
  { name: '日记', href: '/diary', icon: BookOpen },
  { name: '相册', href: '/gallery', icon: Camera },
  { name: '歌单', href: '/music', icon: Music },
  { name: '资源', href: '/resources', icon: FolderOpen },
  { name: '友链', href: '/links', icon: LinkIcon },
  { name: '留言', href: '/guestbook', icon: MessageCircle },
];

const aboutItems: NavItem[] = [
  { name: '关于', href: '/about', icon: User },
  { name: '联系', href: '/contact', icon: Mail },
];

function itemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function renderSection(
  title: string,
  items: NavItem[],
  pathname: string,
  collapsed: boolean,
  closeMenu?: () => void
) {
  return (
    <div>
      {!collapsed && <p className="mb-2 px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>}
      <div className="space-y-1">
        {items.map((item) => {
          const active = itemActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              <motion.div
                whileHover={{ x: 2, scale: 1.008 }}
                whileTap={{ scale: 0.992, x: 1 }}
                transition={APPLE_SPRING_GENTLE}
                className={clsx(
                  'nav-chip premium-nav-chip group flex items-center gap-3 px-3 py-2.5 text-sm',
                  collapsed && 'justify-center',
                  active
                    ? 'nav-chip-active premium-nav-chip-active text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin, showLoginModal, logout } = useAdmin();
  const { profile } = useProfile();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const savedState = window.localStorage.getItem('sidebar-collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '88px' : '260px');
  }, [isCollapsed]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const themeText = resolvedTheme === 'dark' ? '切换浅色' : '切换深色';

  return (
    <>
      <motion.aside
        initial={{ x: -34, opacity: 0, filter: 'blur(8px)' }}
        animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.56, ease: APPLE_EASE_SOFT }}
        className={clsx(
          'premium-sidebar fixed left-0 top-0 z-40 hidden h-screen md:flex md:flex-col',
          isCollapsed ? 'w-[88px]' : 'w-[260px]'
        )}
      >
        <div className="flex h-full flex-col">
          <div className={clsx('premium-sidebar-header px-4 py-4', isCollapsed && 'px-3')}>
            <Link href="/" className={clsx('flex items-center gap-3', isCollapsed && 'justify-center')}>
              <div className="premium-sidebar-logo flex h-10 w-10 items-center justify-center rounded-2xl text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-lg font-semibold tracking-tight">拾光博客</p>
                  <p className="text-xs text-soft">Design. Code. Journal.</p>
                </div>
              )}
            </Link>
          </div>

          {!isCollapsed && (
            <>
              <div className="surface-card premium-sidebar-profile mx-3.5 mt-4 p-3">
                <p className="text-sm font-medium">{profile.nickname || '拾光'}</p>
                <p className="mt-1 line-clamp-2 text-xs text-soft">
                  {profile.signature || '记录技术与生活的长期写作。'}
                </p>
              </div>
              <div className="mx-3.5 mt-3">
                <EnhancedSearch />
              </div>
            </>
          )}

          <div className="custom-scrollbar mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {renderSection('内容', contentItems, pathname, isCollapsed)}
            {renderSection('探索', exploreItems, pathname, isCollapsed)}
            {renderSection('站点', aboutItems, pathname, isCollapsed)}
          </div>

          <div className="space-y-2 border-t border-border/60 p-3">
            {isAdmin ? (
              <Link href="/write" className="block">
                <button
                  className={clsx(
                    'btn-primary ios-button-press w-full px-3 py-2.5 text-sm',
                    isCollapsed ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'
                  )}
                >
                  <PenLine className="h-4 w-4" />
                  {!isCollapsed && <span>写文章</span>}
                </button>
              </Link>
            ) : (
              <button
                onClick={() => showLoginModal()}
                className={clsx(
                  'btn-primary ios-button-press w-full px-3 py-2.5 text-sm',
                  isCollapsed ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'
                )}
              >
                <Shield className="h-4 w-4" />
                {!isCollapsed && <span>管理员登录</span>}
              </button>
            )}

            {isAdmin && !isCollapsed && (
              <Link href="/admin" className="block">
                <button className="btn-secondary ios-button-press inline-flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  管理后台
                </button>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className={clsx(
                'btn-secondary ios-button-press w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground',
                isCollapsed ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'
              )}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!isCollapsed && <span>{themeText}</span>}
            </button>

            <button
              onClick={toggleCollapse}
              className={clsx(
                'btn-secondary ios-button-press w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground',
                isCollapsed ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'
              )}
            >
              <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
              {!isCollapsed && <span>{isCollapsed ? '展开侧栏' : '收起侧栏'}</span>}
            </button>

            {isAdmin && (
              <button
                onClick={logout}
              className={clsx(
                  'ios-button-press w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-500/15',
                  isCollapsed ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'
                )}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>退出管理</span>}
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <nav className="premium-mobile-nav fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2.5">
          <Link href="/" className={clsx('rounded-xl p-2.5 transition', itemActive(pathname, '/') ? 'bg-primary/12 text-primary' : 'text-muted-foreground')}>
            <Home className="h-5 w-5" />
          </Link>

          <Link href="/blog" className={clsx('rounded-xl p-2.5 transition', itemActive(pathname, '/blog') ? 'bg-primary/12 text-primary' : 'text-muted-foreground')}>
            <FileText className="h-5 w-5" />
          </Link>

          {isAdmin ? (
            <Link href="/write" className="premium-fab -mt-8 rounded-full p-4 text-white shadow-lg ios-button-press">
              <PenLine className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={() => showLoginModal()}
              className="premium-fab -mt-8 rounded-full p-4 text-white shadow-lg ios-button-press"
            >
              <Shield className="h-5 w-5" />
            </button>
          )}

          <Link
            href="/archive"
            className={clsx('rounded-xl p-2.5 transition', itemActive(pathname, '/archive') ? 'bg-primary/12 text-primary' : 'text-muted-foreground')}
          >
            <Archive className="h-5 w-5" />
          </Link>

          <button onClick={() => setMobileOpen(true)} className="ios-button-press rounded-xl p-2.5 text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-sheet-card fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-background/92 p-5 backdrop-blur-2xl md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">站点导航</h3>
                <button onClick={() => setMobileOpen(false)} className="ios-button-press rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 pb-6">
                {renderSection('内容', contentItems, pathname, false, () => setMobileOpen(false))}
                {renderSection('探索', exploreItems, pathname, false, () => setMobileOpen(false))}
                {renderSection('站点', aboutItems, pathname, false, () => setMobileOpen(false))}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="btn-secondary ios-button-press inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm"
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {themeText}
                  </button>

                  {isAdmin ? (
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="ios-button-press inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-500/20"
                    >
                      <LogOut className="h-4 w-4" />
                      退出管理
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        showLoginModal();
                        setMobileOpen(false);
                      }}
                      className="btn-secondary ios-button-press inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm"
                    >
                      <Shield className="h-4 w-4" />
                      管理员登录
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <div className="btn-secondary ios-button-press inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm">
                      <Settings className="h-4 w-4" />
                      打开管理后台
                    </div>
                  </Link>
                )}

                <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    <span>{profile.nickname || '拾光'}</span>
                  </div>
                  <p className="mt-1">{profile.signature || '持续写作，持续迭代。'}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
