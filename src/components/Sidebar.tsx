'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  BookMarked,
  BookOpen,
  Camera,
  Clock,
  Code2,
  Compass,
  FileText,
  Film,
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
  Search,
  Shield,
  Sparkles,
  Sun,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useAdmin } from './AdminProvider';
import { useProfile } from './ProfileProvider';
import { bottomSheetVariants, modalBackdropVariants } from './Animations';

// ── Nav data ──────────────────────────────────────────────
interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  label: string;
  kana: string;
}

const group1: NavItem[] = [
  { key: 'home',    href: '/',        icon: Home,          label: '首页', kana: '光' },
  { key: 'blog',    href: '/blog',    icon: FileText,      label: '博客', kana: '文' },
  { key: 'archive', href: '/archive', icon: Archive,       label: '归档', kana: '集' },
];

const group2: NavItem[] = [
  { key: 'diary',       href: '/diary',       icon: BookOpen,      label: '日记',  kana: '記' },
  { key: 'gallery',     href: '/gallery',     icon: Camera,        label: '相册',  kana: '影' },
  { key: 'music',       href: '/music',       icon: Music,         label: '歌单',  kana: '音' },
  { key: 'practice',    href: '/practice',    icon: Code2,         label: '练习',  kana: '練' },
  { key: 'collections', href: '/collections', icon: BookMarked,    label: '合集',  kana: '選' },
  { key: 'media',       href: '/media',       icon: Film,          label: '书影音', kana: '覧' },
  { key: 'timeline',    href: '/timeline',    icon: Clock,         label: '时间线', kana: '史' },
  { key: 'uses',        href: '/uses',        icon: Wrench,        label: '工具箱', kana: '具' },
  { key: 'resources',   href: '/resources',   icon: FolderOpen,    label: '资源',  kana: '庫' },
  { key: 'links',       href: '/links',       icon: LinkIcon,      label: '友链',  kana: '縁' },
  { key: 'message',     href: '/guestbook',   icon: MessageCircle, label: '留言',  kana: '声' },
];

const group3: NavItem[] = [
  { key: 'now',     href: '/now',     icon: Sparkles, label: '此刻', kana: '今' },
  { key: 'about',   href: '/about',   icon: User,     label: '关于', kana: '我' },
  { key: 'contact', href: '/contact', icon: Mail,     label: '联系', kana: '信' },
];

const allItems = [...group1, ...group2, ...group3];

const groupMeta: Record<string, { title: string; items: NavItem[] }> = {
  content: { title: '内容', items: group1 },
  explore: { title: '探索', items: group2 },
  site:    { title: '站点', items: group3 },
};

function getGroupKey(iconKey: string): string {
  if (group1.some(i => i.key === iconKey)) return 'content';
  if (group2.some(i => i.key === iconKey)) return 'explore';
  return 'site';
}

function getActiveIconKey(pathname: string): string | null {
  const match = allItems.find(item =>
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(item.href + '/')
  );
  return match?.key ?? null;
}

function itemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

// ── Rail icon button ──────────────────────────────────────
function RailBtn({
  item,
  isCurrentPage,
  isPanelOpen,
  onClick,
}: {
  item: NavItem;
  isCurrentPage: boolean;
  isPanelOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rail-btn',
        isCurrentPage && !isPanelOpen && 'active',
        isPanelOpen && 'panel-open'
      )}
      title={item.label}
      aria-label={item.label}
    >
      <item.icon style={{ width: 15, height: 15 }} strokeWidth={1.5} />
    </button>
  );
}

// ── Rail divider ──────────────────────────────────────────
function RailDivider() {
  return (
    <div
      style={{
        width: 20,
        height: 1,
        background: 'var(--line)',
        margin: '8px 0',
        flexShrink: 0,
      }}
    />
  );
}

// ── Main Sidebar ──────────────────────────────────────────
export function Sidebar() {
  const pathname  = usePathname();
  const isHome    = pathname === '/';
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin, showLoginModal, logout } = useAdmin();
  const { profile } = useProfile();
  const routeActiveIcon = getActiveIconKey(pathname);

  const [panelOpen,  setPanelOpen]  = useState(false);
  const [panelIcon, setPanelIcon] = useState<string | null>(routeActiveIcon);
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const activeIcon = panelOpen ? (panelIcon ?? routeActiveIcon) : routeActiveIcon;

  // Sync sidebar-width CSS var with panel state
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      panelOpen ? '232px' : '52px'
    );
  }, [panelOpen]);

  const handleIconClick = (key: string) => {
    if (activeIcon === key && panelOpen) {
      setPanelOpen(false);
    } else {
      setPanelIcon(key);
      setPanelOpen(true);
    }
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const visibleTheme = themeReady ? resolvedTheme : null;

  // Panel content derived from active icon
  const groupKey   = activeIcon ? getGroupKey(activeIcon) : 'content';
  const panelGroup = groupMeta[groupKey];
  const kana       = activeIcon
    ? (allItems.find(i => i.key === activeIcon)?.kana ?? '光')
    : '光';

  if (isHome) return null;

  return (
    <>
      {/* ══ Desktop: Rail + Panel ══════════════════════════ */}
      <div
        className="hidden md:flex"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100dvh',
          zIndex: 40,
        }}
      >
        {/* ── Rail (52px) ─────────────────────────────── */}
        <div
          style={{
            width: 52,
            minWidth: 52,
            background: 'var(--paper)',
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: '100%',
              borderBottom: '1px solid var(--line)',
              padding: '18px 0 16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Link href="/" style={{ display: 'block' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mincho)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.15em',
                  lineHeight: 1,
                }}
              >
                Lumen
              </span>
            </Link>
          </div>

          {/* Nav icons */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 10,
              paddingBottom: 8,
              gap: 2,
            }}
          >
            {group1.map(item => (
              <RailBtn
                key={item.key}
                item={item}
                isCurrentPage={itemActive(pathname, item.href)}
                isPanelOpen={activeIcon === item.key && panelOpen}
                onClick={() => handleIconClick(item.key)}
              />
            ))}

            <RailDivider />

            {group2.map(item => (
              <RailBtn
                key={item.key}
                item={item}
                isCurrentPage={itemActive(pathname, item.href)}
                isPanelOpen={activeIcon === item.key && panelOpen}
                onClick={() => handleIconClick(item.key)}
              />
            ))}

            <RailDivider />

            {group3.map(item => (
              <RailBtn
                key={item.key}
                item={item}
                isCurrentPage={itemActive(pathname, item.href)}
                isPanelOpen={activeIcon === item.key && panelOpen}
                onClick={() => handleIconClick(item.key)}
              />
            ))}
          </div>

          {/* Rail bottom: avatar + theme */}
          <div
            style={{
              width: '100%',
              borderTop: '1px solid var(--line)',
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--paper-deep)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.nickname}
                  width={24}
                  height={24}
                  style={{ width: 24, height: 24, objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-mincho)',
                    fontSize: 9,
                    color: 'var(--ink-secondary)',
                  }}
                >
                  {(profile.nickname || '拾').charAt(0)}
                </span>
              )}
            </div>

            {/* 搜索按钮 — 触发 Cmd+K */}
            <button
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                )
              }
              className="rail-btn"
              style={{ width: 30, height: 30 }}
              title="搜索 (⌘K)"
              aria-label="搜索"
            >
              <Search style={{ width: 13, height: 13 }} strokeWidth={1.5} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rail-btn"
              style={{ width: 30, height: 30 }}
              title={
                visibleTheme === 'dark'
                  ? '浅色模式'
                  : visibleTheme === 'light'
                    ? '深色模式'
                    : '切换主题'
              }
            >
              {visibleTheme === 'dark' ? (
                <Sun style={{ width: 13, height: 13 }} strokeWidth={1.5} />
              ) : (
                <Moon style={{ width: 13, height: 13 }} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* ── Expand Panel (0 → 180px) ─────────────────── */}
        <div className={clsx('expand-panel', panelOpen && 'open')}>
          <div className="expand-panel-inner">
            {/* Group label */}
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'var(--ink-ghost)',
                fontFamily: 'var(--font-jp-serif)',
                fontWeight: 300,
                display: 'block',
                marginBottom: 12,
              }}
            >
              {panelGroup.title}
            </span>

            {/* Nav links */}
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              {panelGroup.items.map(item => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={clsx('panel-link', itemActive(pathname, item.href) && 'active')}
                >
                  <span className="panel-link-dot" />
                  <span className="panel-link-text">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Admin actions */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 20,
                borderTop: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {isAdmin ? (
                <>
                  <Link href="/write">
                    <span className="sidebar-text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <PenLine style={{ width: 11, height: 11 }} strokeWidth={1.5} />
                      <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        Write
                      </span>
                    </span>
                  </Link>
                  <Link href="/admin">
                    <span className="sidebar-text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid var(--ink-muted)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        Dashboard
                      </span>
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="sidebar-text-ghost"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <LogOut style={{ width: 11, height: 11 }} strokeWidth={1.5} />
                    <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => showLoginModal()}
                  className="sidebar-text-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid var(--ink-muted)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Admin
                  </span>
                </button>
              )}
            </div>

            {/* Kana decoration */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 20,
                right: -4,
                writingMode: 'vertical-rl',
                fontFamily: 'var(--font-mincho)',
                fontSize: 72,
                fontWeight: 300,
                color: 'var(--kana-ghost)',
                letterSpacing: '0.1em',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
                lineHeight: 1,
                transition: 'all 0.3s ease',
              }}
            >
              {kana}
            </span>
          </div>
        </div>
      </div>

      {/* ══ Mobile Bottom Nav ══════════════════════════════ */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'var(--paper)',
          borderTop: '1px solid var(--line)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 28px',
          }}
        >
          {([
            { href: '/',        icon: Home     },
            { href: '/blog',    icon: FileText  },
            { href: '/archive', icon: Archive   },
          ] as { href: string; icon: React.ElementType }[]).map(({ href, icon: Icon }) => {
            const active = itemActive(pathname, href);
            return (
              <Link key={href} href={href}>
                <Icon
                  style={{
                    width: 20,
                    height: 20,
                    color: active ? 'var(--gold)' : 'var(--ink)',
                    opacity: active ? 1 : 0.4,
                  }}
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}

          {/* FAB */}
          {isAdmin ? (
            <Link href="/write">
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -20,
                  border: '2px solid var(--paper)',
                }}
              >
                <PenLine style={{ width: 18, height: 18, color: 'var(--paper)' }} strokeWidth={1.5} />
              </div>
            </Link>
          ) : (
            <button
              onClick={() => showLoginModal()}
              style={{
                width: 40,
                height: 40,
                background: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -20,
                border: '2px solid var(--paper)',
                cursor: 'pointer',
              }}
            >
              <Shield style={{ width: 18, height: 18, color: 'var(--paper)' }} strokeWidth={1.5} />
            </button>
          )}

          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
          >
            <Menu style={{ width: 20, height: 20, color: 'var(--ink)', opacity: 0.4 }} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ══ Mobile Sheet ═══════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden"
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(26,26,24,0.45)' }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                maxHeight: '82vh',
                overflowY: 'auto',
                background: 'var(--paper)',
                borderTop: '1px solid var(--line)',
                padding: '24px 0 0',
                paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px 20px' }}>
                <span style={{ fontFamily: 'var(--font-mincho)', fontSize: 13, letterSpacing: '0.12em', color: 'var(--ink)' }}>
                  站点导航
                </span>
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                  <X style={{ width: 18, height: 18, color: 'var(--ink-muted)' }} strokeWidth={1.5} />
                </button>
              </div>

              {/* All groups */}
              {[
                { title: '内容', items: group1 },
                { title: '探索', items: group2 },
                { title: '站点', items: group3 },
              ].map((g, gi) => (
                <div key={g.title}>
                  {gi > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '8px 28px' }} />}
                  <span style={{ display: 'block', padding: '12px 28px 8px', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--ink-ghost)', fontFamily: 'var(--font-jp-serif)', fontWeight: 300 }}>
                    {g.title}
                  </span>
                  {g.items.map(item => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 28px', textDecoration: 'none' }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: itemActive(pathname, item.href) ? 'var(--gold)' : 'var(--line)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-jp-serif)', fontSize: 13, fontWeight: itemActive(pathname, item.href) ? 400 : 300, color: itemActive(pathname, item.href) ? 'var(--ink)' : 'var(--ink-secondary)', letterSpacing: '0.05em' }}>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}

              {/* Sheet actions */}
              <div style={{ padding: '20px 28px 0', display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--line)', marginTop: 16 }}>
                <button
                  onClick={toggleTheme}
                  className="sidebar-text-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {resolvedTheme === 'dark'
                    ? <Sun style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                    : <Moon style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                  }
                  <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
                  </span>
                </button>

                {isAdmin && (
                  <>
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <span className="sidebar-text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid var(--ink-muted)' }} />
                        <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Dashboard</span>
                      </span>
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="sidebar-text-ghost"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <LogOut style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                      <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Logout</span>
                    </button>
                  </>
                )}

                {!isAdmin && (
                  <button
                    onClick={() => { showLoginModal(); setMobileOpen(false); }}
                    className="sidebar-text-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid var(--ink-muted)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-garamond)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Admin</span>
                  </button>
                )}
              </div>

              {/* Profile note */}
              <div style={{ padding: '16px 28px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Compass style={{ width: 11, height: 11, color: 'var(--ink-muted)', opacity: 0.6 }} strokeWidth={1.5} />
                  <span style={{ fontFamily: 'var(--font-mincho)', fontSize: 11, color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                    {profile.nickname || 'Lumen'}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-jp-serif)', fontWeight: 300, fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.8, letterSpacing: '0.04em' }}>
                  {profile.signature || '持续写作，持续迭代。'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
