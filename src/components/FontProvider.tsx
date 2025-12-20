'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FontConfig {
  id: string;
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'rounded';
  preview: string;
}

// 可用字体列表
export const fonts: FontConfig[] = [
  { 
    id: 'noto-sans', 
    name: '思源黑体', 
    family: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    category: 'sans-serif',
    preview: '现代简约'
  },
  { 
    id: 'noto-serif', 
    name: '思源宋体', 
    family: '"Noto Serif SC", "Songti SC", "SimSun", serif',
    category: 'serif',
    preview: '古典优雅'
  },
  { 
    id: 'lxgw', 
    name: '霞鹜文楷', 
    family: '"LXGW WenKai", "Noto Sans SC", sans-serif',
    category: 'rounded',
    preview: '手写温暖'
  },
  { 
    id: 'zcool', 
    name: '站酷快乐体', 
    family: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif',
    category: 'rounded',
    preview: '活泼可爱'
  },
  { 
    id: 'system', 
    name: '系统默认', 
    family: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    category: 'sans-serif',
    preview: '原生体验'
  },
];

interface FontContextType {
  currentFont: FontConfig;
  setFont: (fontId: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
}

const FontContext = createContext<FontContextType | null>(null);

export function FontProvider({ children }: { children: ReactNode }) {
  const [currentFont, setCurrentFont] = useState<FontConfig>(fonts[0]);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 从 localStorage 恢复设置
    const savedFont = localStorage.getItem('article-font');
    const savedSize = localStorage.getItem('article-font-size');
    const savedLineHeight = localStorage.getItem('article-line-height');
    
    if (savedFont) {
      const font = fonts.find(f => f.id === savedFont);
      if (font) setCurrentFont(font);
    }
    if (savedSize) setFontSize(parseInt(savedSize));
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
  }, []);

  const setFont = (fontId: string) => {
    const font = fonts.find(f => f.id === fontId);
    if (font) {
      setCurrentFont(font);
      localStorage.setItem('article-font', fontId);
    }
  };

  const handleSetFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem('article-font-size', size.toString());
  };

  const handleSetLineHeight = (height: number) => {
    setLineHeight(height);
    localStorage.setItem('article-line-height', height.toString());
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FontContext.Provider value={{ 
      currentFont, 
      setFont, 
      fontSize, 
      setFontSize: handleSetFontSize,
      lineHeight,
      setLineHeight: handleSetLineHeight
    }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  // 如果上下文不存在，返回默认值
  if (!context) {
    return {
      currentFont: fonts[0],
      setFont: () => {},
      fontSize: 18,
      setFontSize: () => {},
      lineHeight: 1.8,
      setLineHeight: () => {},
    };
  }
  return context;
}
