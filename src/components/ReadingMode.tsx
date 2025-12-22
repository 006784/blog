'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Minus, Plus, Type, Moon, Sun } from 'lucide-react';

interface ReadingModeContextType {
  isReadingMode: boolean;
  fontSize: number;
  lineHeight: number;
  toggleReadingMode: () => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | null>(null);

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error('useReadingMode must be used within ReadingModeProvider');
  }
  return context;
}

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [mounted, setMounted] = useState(false);

  // 加载设置从localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readingModeSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        setFontSize(settings.fontSize || 18);
        setLineHeight(settings.lineHeight || 1.8);
      }
    }
  }, []);

  // 保存设置到localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('readingModeSettings', JSON.stringify({ fontSize, lineHeight }));
    }
  }, [fontSize, lineHeight, mounted]);

  const toggleReadingMode = () => setIsReadingMode(!isReadingMode);

  return (
    <ReadingModeContext.Provider value={{
      isReadingMode,
      fontSize,
      lineHeight,
      toggleReadingMode,
      setFontSize,
      setLineHeight
    }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

// 阅读模式切换按钮
export function ReadingModeToggle() {
  const { isReadingMode, toggleReadingMode } = useReadingMode();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleReadingMode}
      className={`p-2 rounded-lg transition-colors ${
        isReadingMode 
          ? 'bg-primary text-white' 
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
      title={isReadingMode ? '退出阅读模式' : '阅读模式'}
    >
      <BookOpen className="w-5 h-5" />
    </motion.button>
  );
}

// 阅读模式控制面板
export function ReadingModePanel() {
  const { 
    isReadingMode, 
    fontSize, 
    lineHeight, 
    toggleReadingMode,
    setFontSize, 
    setLineHeight 
  } = useReadingMode();
  
  const [showPanel, setShowPanel] = useState(false);

  if (!isReadingMode) return null;

  return (
    <>
      {/* 阅读模式遮罩 */}
      <div className="fixed inset-0 bg-background/95 z-40 pointer-events-none" />
      
      {/* 控制栏 */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-lg"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">阅读模式</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 字体大小控制 */}
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="p-1.5 rounded-lg hover:bg-muted"
                disabled={fontSize <= 14}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="p-1.5 rounded-lg hover:bg-muted"
                disabled={fontSize >= 28}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 行高控制 */}
            <div className="hidden sm:flex items-center gap-2 border-l border-border pl-4">
              <span className="text-xs text-muted-foreground">行高</span>
              <select
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="px-2 py-1 rounded-lg bg-muted border border-border text-sm"
              >
                <option value={1.5}>紧凑</option>
                <option value={1.8}>标准</option>
                <option value={2.2}>宽松</option>
              </select>
            </div>

            {/* 退出按钮 */}
            <button
              onClick={toggleReadingMode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// 阅读模式内容包装器
export function ReadingModeContent({ children }: { children: ReactNode }) {
  const { isReadingMode, fontSize, lineHeight } = useReadingMode();

  return (
    <div
      className={`transition-all duration-300 ${
        isReadingMode ? 'relative z-50 max-w-3xl mx-auto px-6 pt-20' : ''
      }`}
      style={isReadingMode ? {
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
      } : undefined}
    >
      {children}
    </div>
  );
}

export default ReadingModeProvider;
