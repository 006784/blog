'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Eye, EyeOff, Shield } from 'lucide-react';

// 管理员密码 - 你可以修改这个密码
const ADMIN_PASSWORD = 'shiguang2024';

interface AdminContextType {
  isAdmin: boolean;
  showLoginModal: () => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    return { isAdmin: false, showLoginModal: () => {}, logout: () => {} };
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查本地存储的登录状态
    const adminToken = localStorage.getItem('admin-token');
    if (adminToken === btoa(ADMIN_PASSWORD)) {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('admin-token', btoa(ADMIN_PASSWORD));
      setShowModal(false);
      setPassword('');
      setError('');
    } else {
      setError('密码错误');
      setPassword('');
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('admin-token');
  };

  const showLoginModal = () => {
    setShowModal(true);
    setError('');
    setPassword('');
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AdminContext.Provider value={{ isAdmin, showLoginModal, logout }}>
      {children}

      {/* 登录弹窗 */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-card rounded-3xl shadow-2xl z-[100] overflow-hidden"
            >
              {/* 头部 */}
              <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">管理员登录</h2>
                    <p className="text-sm text-muted-foreground">请输入管理员密码</p>
                  </div>
                </div>
              </div>

              {/* 表单 */}
              <div className="p-6 pt-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="输入密码"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25"
                >
                  确认登录
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminContext.Provider>
  );
}
