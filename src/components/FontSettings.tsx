'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Minus, Plus, X, Check, RotateCcw } from 'lucide-react';
import { useFont, fonts } from './FontProvider';

interface FontSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FontSettings({ isOpen, onClose }: FontSettingsProps) {
  const { currentFont, setFont, fontSize, setFontSize, lineHeight, setLineHeight } = useFont();

  const resetSettings = () => {
    setFont('noto-sans');
    setFontSize(18);
    setLineHeight(1.8);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  阅读设置
                </h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetSettings}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                    title="重置"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Font Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">选择字体</label>
                <div className="space-y-2">
                  {fonts.map((font) => (
                    <motion.button
                      key={font.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFont(font.id)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        currentFont.id === font.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium" style={{ fontFamily: font.family }}>
                            {font.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {font.preview}
                          </p>
                        </div>
                        {currentFont.id === font.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <p 
                        className="mt-3 text-sm text-muted-foreground line-clamp-2"
                        style={{ fontFamily: font.family }}
                      >
                        春风又绿江南岸，明月何时照我还。The quick brown fox jumps over the lazy dog.
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">
                  字号大小
                  <span className="ml-2 text-muted-foreground">{fontSize}px</span>
                </label>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <input
                    type="range"
                    min="14"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>紧凑</span>
                  <span>舒适</span>
                </div>
              </div>

              {/* Line Height */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">
                  行高
                  <span className="ml-2 text-muted-foreground">{lineHeight.toFixed(1)}</span>
                </label>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setLineHeight(Math.max(1.4, lineHeight - 0.1))}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <input
                    type="range"
                    min="1.4"
                    max="2.4"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.1))}
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>紧凑</span>
                  <span>宽松</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-5 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-3">效果预览</p>
                <p 
                  style={{ 
                    fontFamily: currentFont.family,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight
                  }}
                >
                  在文字中拾起生活的微光，记录下每一个值得珍藏的瞬间。时光流转，文字永恒。
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 浮动按钮
export function FontSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-40 hover:border-primary transition-colors"
      title="阅读设置"
    >
      <Type className="w-5 h-5" />
    </motion.button>
  );
}
