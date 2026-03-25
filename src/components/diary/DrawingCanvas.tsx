'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { DiaryTheme } from '@/lib/diary/themes';

type Tool = 'pen' | 'pencil' | 'eraser';

interface Props {
  theme: DiaryTheme;
  onSave?: (dataUrl: string) => void;
  onClose?: () => void;
}

const INK_COLOR: Record<DiaryTheme, string> = {
  kraft: '#3a2010',
  washi: '#5a4838',
  literary: '#c4a96d',
  minimal: '#1a1a1a',
};

export function DrawingCanvas({ theme, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 200 * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = theme === 'literary' ? '#1e1a14' : '#f5e6c8';
    ctx.fillRect(0, 0, canvas.offsetWidth, 200);
    saveSnapshot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSnapshot = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const trimmed = prev.slice(0, histIdx + 1);
      const next = [...trimmed, snap].slice(-20);
      setHistIdx(next.length - 1);
      return next;
    });
  }, [histIdx]);

  const undo = () => {
    if (histIdx <= 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    const prev = history[histIdx - 1];
    ctx.putImageData(prev, 0, 0);
    setHistIdx(histIdx - 1);
  };

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDrawing(true);
    lastPoint.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx || !lastPoint.current) return;
    const pos = getPos(e);
    const pressure = (e as unknown as PointerEvent).pressure || 0.5;
    const lineWidth = tool === 'eraser' ? 16 : Math.max(1, pressure * 4);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = INK_COLOR[theme];
      ctx.globalAlpha = 0.6;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = INK_COLOR[theme];
      ctx.globalAlpha = 1;
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    lastPoint.current = pos;
  };

  const onPointerUp = () => {
    setDrawing(false);
    lastPoint.current = null;
    saveSnapshot();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL('image/png'));
  };

  const TOOLS: { key: Tool; label: string }[] = [
    { key: 'pen', label: '钢笔' },
    { key: 'pencil', label: '铅笔' },
    { key: 'eraser', label: '橡皮' },
  ];

  return (
    <div className="border" style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'var(--d-border)' }}>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className="text-[10px] px-2 py-0.5 border transition-colors"
            style={{
              borderColor: tool === t.key ? 'var(--d-accent)' : 'var(--d-border)',
              color: tool === t.key ? 'var(--d-accent)' : 'var(--d-ink-3)',
              letterSpacing: '.1em',
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={undo}
          disabled={histIdx <= 0}
          className="text-[10px] ml-auto transition-opacity disabled:opacity-30"
          style={{ color: 'var(--d-ink-3)' }}
        >
          ↩ 撤销
        </button>
        {onSave && (
          <button onClick={handleSave} className="text-[10px] border-b transition-opacity hover:opacity-60" style={{ color: 'var(--d-accent)', borderColor: 'var(--d-accent)' }}>
            保存
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>✕</button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full block touch-none cursor-crosshair"
        style={{ height: 200 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
