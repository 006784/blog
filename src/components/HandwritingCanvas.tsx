// 手写画布组件
'use client';

import { useState, useRef, useEffect } from 'react';
import { HandwritingService, type HandwritingOptions } from '@/lib/diary/handwriting-service';
import { PenTool, Eraser, Undo2, Redo2, Download, Palette } from 'lucide-react';

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  onStroke?: (stroke: any) => void;
  className?: string;
}

export function HandwritingCanvas({ 
  width = 800, 
  height = 400, 
  onStroke, 
  className = '' 
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<HandwritingService | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [options, setOptions] = useState<HandwritingOptions>({
    color: '#000000',
    lineWidth: 2,
    smoothing: true,
    pressureSensitivity: false,
    inkEffect: true
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 初始化手写服务
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const service = new HandwritingService(canvas, options);
    serviceRef.current = service;

    // 清除画布
    service.clear();

    // 清理函数
    return () => {
      if (serviceRef.current) {
        serviceRef.current = null;
      }
    };
  }, [width, height]);

  // 更新选项
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.setOptions(options);
    }
  }, [options]);

  // 开始绘制
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!serviceRef.current) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // 触摸事件
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // 鼠标事件
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    serviceRef.current.startStroke(x, y);
    setIsDrawing(true);
  };

  // 绘制中
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !serviceRef.current) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // 触摸事件
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // 鼠标事件
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    serviceRef.current.addPoint(x, y);
  };

  // 结束绘制
  const stopDrawing = () => {
    if (!serviceRef.current) return;

    serviceRef.current.endStroke();
    setIsDrawing(false);
  };

  // 清空画布
  const clearCanvas = () => {
    if (serviceRef.current) {
      serviceRef.current.clear();
    }
  };

  // 撤销
  const undo = () => {
    if (serviceRef.current) {
      serviceRef.current.undo();
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (serviceRef.current) {
      const dataUrl = serviceRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `handwriting-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // 颜色选择器
  const colorOptions = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#000080'
  ];

  return (
    <div className={`relative ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-lg">
        {/* 画笔工具 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="选择颜色"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-12 left-0 bg-white p-2 rounded-lg shadow-lg border z-10 grid grid-cols-6 gap-1">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setOptions({...options, color});
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
          
          <input
            type="range"
            min="1"
            max="10"
            value={options.lineWidth}
            onChange={(e) => setOptions({...options, lineWidth: parseInt(e.target.value)})}
            className="w-16"
            title="笔画粗细"
          />
        </div>
        
        <div className="h-4 w-px bg-gray-300 mx-1" />
        
        {/* 功能按钮 */}
        <button
          onClick={undo}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="撤销"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={clearCanvas}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="清空"
        >
          <Eraser className="w-4 h-4" />
        </button>
        
        <button
          onClick={downloadImage}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="下载"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* 画布 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
        style={{ touchAction: 'none' }}
      />
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        点击或触摸开始手写
      </div>
    </div>
  );
}