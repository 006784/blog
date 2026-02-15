'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Eye, EyeOff, Shield } from 'lucide-react';
import { modalBackdropVariants, modalPanelVariants, TAP_BUTTON } from './Animations';

interface AdminContextType {
  isAdmin: boolean;
  showLoginModal: (callback?: () => void) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    return { isAdmin: false, showLoginModal: (callback?: () => void) => {}, logout: () => {} };
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

let loginCallback: (() => void) | null = null;

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
    if (adminToken) {
      // 验证 token 是否有效（通过检查格式）
      // 实际验证在服务端 API 进行
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      // 通过 API 验证密码
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setIsAdmin(true);
        localStorage.setItem('admin-token', data.token);
        setShowModal(false);
        setPassword('');
        setError('');
        
        // 执行登录回调
        if (loginCallback) {
          loginCallback();
          loginCallback = null;
        }
      } else {
        setError(data.error || '密码错误');
        setPassword('');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录失败，请稍后重试');
      setPassword('');
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('admin-token');
  };

  const showLoginModal = (callback?: () => void) => {
    loginCallback = callback || null;
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
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowModal(false)}
              className="ios-modal-overlay fixed inset-0 z-[100]"
            />
            <motion.div
              variants={modalPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-card fixed left-4 right-4 top-1/2 z-[100] mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-3xl bg-card shadow-2xl"
            >
              {/* 头部 */}
              <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <button
                  onClick={() => setShowModal(false)}
                  className="ios-button-press absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-secondary/50"
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
                    className="ios-button-press absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                  whileTap={TAP_BUTTON}
                  onClick={handleLogin}
                  className="ios-button-press mt-4 w-full rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-4 font-semibold text-white shadow-lg shadow-primary/25"
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
