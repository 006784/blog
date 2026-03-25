'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

// ─── Context ─────────────────────────────────────────────────────────────────

interface AdminContextType {
  isAdmin: boolean;
  /** true = 还在检查登录状态，此时不要做任何跳转 */
  loading: boolean;
  role: string | null;
  showLoginModal: (callback?: () => void) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  loading: true,
  role: null,
  showLoginModal: () => {},
  logout: async () => {},
  logoutAll: async () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

// ─── 空闲超时（30 分钟） ───────────────────────────────────────────────────────

const IDLE_MS = 30 * 60 * 1000;
const IDLE_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutFnRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // ── 检查登录状态（调用 /api/auth/me，不读 localStorage）──
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        setIsAdmin(true);
        setRole(data.role ?? 'super_admin');
      } else {
        setIsAdmin(false);
        setRole(null);
      }
    } catch {
      setIsAdmin(false);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 登出 ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async (all = false) => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all }),
      credentials: 'include',
    });
    setIsAdmin(false);
    setRole(null);
  }, []);

  logoutFnRef.current = logout;

  const logoutAll = useCallback(() => logout(true), [logout]);

  // ── 空闲计时器 ────────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (logoutFnRef.current) logoutFnRef.current();
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isAdmin) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    // 启动空闲检测
    resetIdleTimer();
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));

    // 定期刷新 access token（每 50 分钟）
    const refreshInterval = setInterval(async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        setIsAdmin(false);
        setRole(null);
      }
    }, 50 * 60 * 1000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      clearInterval(refreshInterval);
    };
  }, [isAdmin, resetIdleTimer]);

  // ── 跨标签同步：其他标签登出时同步状态 ──────────────────────────────────
  useEffect(() => {
    const onFocus = () => checkSession();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkSession]);

  // ── showLoginModal → 直接跳转登录页（httpOnly cookie 无弹窗登录） ──────────
  const showLoginModal = useCallback((callback?: () => void) => {
    if (callback) {
      // 存入 sessionStorage，登录后执行
      sessionStorage.setItem('admin_login_cb', window.location.pathname);
    }
    window.location.href = `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, role, showLoginModal, logout, logoutAll }}>
      {children}
    </AdminContext.Provider>
  );
}
