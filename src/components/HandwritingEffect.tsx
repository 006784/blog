// 手写笔迹效果组件
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HandwritingEffectProps {
  text: string;
  speed?: number; // 每个字符的书写间隔(ms)
  onComplete?: () => void;
  className?: string;
  penColor?: string;
  penSize?: number;
}

export const HandwritingEffect: React.FC<HandwritingEffectProps> = ({
  text,
  speed = 100,
  onComplete,
  className = '',
  penColor = '#333333',
  penSize = 2
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // 绘制手写效果
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置笔触样式
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 模拟手写轨迹
    if (displayedText.length > 0) {
      drawHandwriting(ctx, displayedText);
    }
  }, [displayedText, penColor, penSize]);

  const drawHandwriting = (ctx: CanvasRenderingContext2D, text: string) => {
    const fontSize = 18;
    const lineHeight = fontSize * 1.4;
    const maxWidth = 600;
    
    ctx.font = `${fontSize}px 'Kalam', cursive`;
    ctx.fillStyle = penColor;
    
    let x = 20;
    let y = 40;
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && char !== ' ') {
        // 换行
        ctx.fillText(currentLine, x, y);
        currentLine = char;
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
      
      // 添加手写波动效果
      const offsetX = Math.sin(i * 0.3) * 0.5;
      const offsetY = Math.cos(i * 0.2) * 0.3;
      
      if (i === text.length - 1) {
        ctx.fillText(currentLine, x + offsetX, y + offsetY);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 背景网格 */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #d4d4d4 1px, transparent 1px),
                           linear-gradient(to bottom, #d4d4d4 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          transform: 'translate(10px, 10px)'
        }}
      />
      
      {/* 手写内容 */}
      <canvas
        ref={canvasRef}
        width={700}
        height={300}
        className="w-full h-auto"
        style={{ 
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
        }}
      />
      
      {/* 光标效果 */}
      {currentIndex < text.length && (
        <motion.div
          className="absolute w-0.5 h-6 bg-amber-600"
          style={{
            left: `${20 + (currentIndex * 8)}px`,
            top: '30px'
          }}
          animate={{ opacity: [1, 0] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      )}
    </div>
  );
};

// 墨水扩散效果组件
export const InkDropEffect: React.FC<{ 
  x: number; 
  y: number; 
  color?: string;
  size?: number;
}> = ({ x, y, color = '#333333', size = 20 }) => {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity: 0.3
      }}
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ 
        scale: [0, 1, 0.8, 1.2, 1],
        opacity: [0.5, 0.3, 0.1, 0]
      }}
      transition={{ 
        duration: 1.5,
        times: [0, 0.2, 0.4, 0.7, 1]
      }}
    />
  );
};

// 笔记本页面翻动效果
export const PageTurnEffect: React.FC<{
  children: React.ReactNode;
  isTurning: boolean;
  onPageTurnComplete?: () => void;
}> = ({ children, isTurning, onPageTurnComplete }) => {
  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{
        rotateY: isTurning ? -180 : 0,
        zIndex: isTurning ? 10 : 1
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut"
      }}
      onAnimationComplete={() => {
        if (isTurning && onPageTurnComplete) {
          onPageTurnComplete();
        }
      }}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "left center"
      }}
    >
      <div 
        className="backface-hidden"
        style={{ backfaceVisibility: "hidden" }}
      >
        {children}
      </div>
    </motion.div>
  );
};

// 手写输入组件
export const HandwritingInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "开始书写...", className = "" }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [lastPosition, setLastPosition] = useState<{x: number, y: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startWriting = (e: React.MouseEvent | React.TouchEvent) => {
    setIsWriting(true);
    const pos = getEventPosition(e);
    setLastPosition(pos);
  };

  const write = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isWriting || !lastPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentPos = getEventPosition(e);
    
    // 绘制线条
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    setLastPosition(currentPos);
  };

  const stopWriting = () => {
    setIsWriting(false);
    setLastPosition(null);
  };

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={700}
        height={400}
        className="w-full h-96 border-2 border-amber-200 rounded-lg bg-amber-50 cursor-crosshair"
        onMouseDown={startWriting}
        onMouseMove={write}
        onMouseUp={stopWriting}
        onMouseLeave={stopWriting}
        onTouchStart={startWriting}
        onTouchMove={write}
        onTouchEnd={stopWriting}
      />
      
      {/* 网格背景 */}
      <div 
        className="absolute inset-2 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #d4d4d4 1px, transparent 1px),
                           linear-gradient(to bottom, #d4d4d4 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* 清除按钮 */}
      <button
        onClick={clearCanvas}
        className="absolute top-2 right-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm transition-colors"
      >
        清除
      </button>
      
      {/* 提示文字 */}
      {!value && !isWriting && (
        <div className="absolute inset-0 flex items-center justify-center text-amber-300 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};