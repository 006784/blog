'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Image as ImageIcon, Palette, Type, Sparkles, RotateCcw } from 'lucide-react';

interface CoverGeneratorProps {
  title?: string;
  onGenerate?: (dataUrl: string) => void;
}

const gradients = [
  { name: '紫色梦幻', colors: ['#8b5cf6', '#ec4899'] },
  { name: '海洋蓝', colors: ['#0ea5e9', '#06b6d4'] },
  { name: '日落橙', colors: ['#f97316', '#eab308'] },
  { name: '森林绿', colors: ['#10b981', '#84cc16'] },
  { name: '樱花粉', colors: ['#ec4899', '#f472b6'] },
  { name: '星空紫', colors: ['#7c3aed', '#4f46e5'] },
  { name: '午夜蓝', colors: ['#1e3a5f', '#3b82f6'] },
  { name: '极光绿', colors: ['#047857', '#10b981'] },
];

const patterns = [
  { name: '无', value: 'none' },
  { name: '网格', value: 'grid' },
  { name: '点阵', value: 'dots' },
  { name: '斜线', value: 'lines' },
  { name: '波浪', value: 'waves' },
];

export function CoverGenerator({ title = '', onGenerate }: CoverGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [articleTitle, setArticleTitle] = useState(title);
  const [subtitle, setSubtitle] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState('none');
  const [fontSize, setFontSize] = useState(48);

  const generateCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const colors = gradients[selectedGradient].colors;
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制图案
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    switch (selectedPattern) {
      case 'grid':
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      case 'dots':
        ctx.fillStyle = '#ffffff';
        for (let x = 20; x < width; x += 30) {
          for (let y = 20; y < height; y += 30) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'lines':
        for (let i = -height; i < width + height; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + height, height);
          ctx.stroke();
        }
        break;
      case 'waves':
        for (let y = 50; y < height; y += 60) {
          ctx.beginPath();
          for (let x = 0; x < width; x += 10) {
            const waveY = y + Math.sin(x * 0.02) * 20;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
        break;
    }

    ctx.globalAlpha = 1;

    // 绘制装饰圆圈
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width - 100, 100, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, height - 50, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 绘制标题
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 标题
    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const titleLines = wrapText(ctx, articleTitle || '文章标题', width - 160, fontSize);
    const titleStartY = height / 2 - (titleLines.length - 1) * (fontSize * 0.6);
    
    titleLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, titleStartY + index * (fontSize * 1.2));
    });

    // 副标题
    if (subtitle) {
      ctx.font = `300 ${Math.round(fontSize * 0.4)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.globalAlpha = 0.8;
      ctx.fillText(subtitle, width / 2, titleStartY + titleLines.length * (fontSize * 1.2) + 20);
      ctx.globalAlpha = 1;
    }

    // 绘制网站标识
    ctx.font = `500 18px "PingFang SC", sans-serif`;
    ctx.globalAlpha = 0.6;
    ctx.fillText(window.location.hostname, width / 2, height - 40);
    ctx.globalAlpha = 1;

    // 回调
    const dataUrl = canvas.toDataURL('image/png');
    onGenerate?.(dataUrl);
  }, [articleTitle, subtitle, selectedGradient, selectedPattern, fontSize, onGenerate]);

  // 文本换行
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] => {
    const lines: string[] = [];
    let line = '';
    
    for (const char of text) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    
    return lines;
  };

  const downloadCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `cover-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 预览区域 */}
        <div className="space-y-4">
          <div className="aspect-[1200/630] bg-muted rounded-xl overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
              style={{ display: articleTitle ? 'block' : 'none' }}
            />
            {!articleTitle && (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>输入标题生成封面</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateCover}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white"
            >
              <Sparkles className="w-5 h-5" />
              生成封面
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadCover}
              className="px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* 设置区域 */}
        <div className="space-y-6">
          {/* 标题输入 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Type className="w-4 h-4" />
              文章标题
            </label>
            <input
              type="text"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              placeholder="输入文章标题"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none"
            />
          </div>

          {/* 副标题 */}
          <div>
            <label className="block text-sm font-medium mb-2">副标题（可选）</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="输入副标题"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none"
            />
          </div>

          {/* 渐变选择 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Palette className="w-4 h-4" />
              背景渐变
            </label>
            <div className="grid grid-cols-4 gap-2">
              {gradients.map((gradient, index) => (
                <button
                  key={gradient.name}
                  onClick={() => setSelectedGradient(index)}
                  className={`aspect-square rounded-xl transition-all ${
                    selectedGradient === index
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
                  }}
                  title={gradient.name}
                />
              ))}
            </div>
          </div>

          {/* 图案选择 */}
          <div>
            <label className="block text-sm font-medium mb-3">背景图案</label>
            <div className="flex flex-wrap gap-2">
              {patterns.map((pattern) => (
                <button
                  key={pattern.value}
                  onClick={() => setSelectedPattern(pattern.value)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedPattern === pattern.value
                      ? 'bg-primary text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {pattern.name}
                </button>
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              标题大小: {fontSize}px
            </label>
            <input
              type="range"
              min="32"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoverGenerator;
