'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Play, Pause, Shuffle } from 'lucide-react';

type Algo = 'bubble' | 'selection' | 'insertion';

interface Frame {
  arr: number[];
  active: number[];   // 正在比较/操作的下标
  sorted: number[];   // 已排好的下标
}

const ALGO_NAME: Record<Algo, string> = {
  bubble: '冒泡排序',
  selection: '选择排序',
  insertion: '插入排序',
};

const ALGO_DESC: Record<Algo, string> = {
  bubble: '相邻两两比较，大的往后冒，每轮把最大的送到末尾。',
  selection: '每轮从未排序部分选出最小的，放到已排序部分末尾。',
  insertion: '像理扑克牌，把每张牌插入到前面已排好的合适位置。',
};

function genFrames(input: number[], algo: Algo): Frame[] {
  const a = [...input];
  const frames: Frame[] = [];
  const n = a.length;
  const snap = (active: number[], sorted: number[]) => frames.push({ arr: [...a], active: [...active], sorted: [...sorted] });
  snap([], []);

  if (algo === 'bubble') {
    const sorted: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        snap([j, j + 1], sorted);
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; snap([j, j + 1], sorted); }
      }
      sorted.unshift(n - 1 - i);
    }
    sorted.unshift(0);
    snap([], sorted);
  } else if (algo === 'selection') {
    const sorted: number[] = [];
    for (let i = 0; i < n; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        snap([min, j], sorted);
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; }
      sorted.push(i);
      snap([], sorted);
    }
  } else {
    const sorted = [0];
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0 && a[j - 1] > a[j]) {
        snap([j - 1, j], sorted);
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        j--;
      }
      sorted.push(i);
      snap([], sorted);
    }
  }
  return frames;
}

function randomArr(): number[] {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 90) + 10);
}

export function SortVisualizer({ algo: initAlgo }: { algo?: string }) {
  const [algo, setAlgo] = useState<Algo>(
    (['bubble', 'selection', 'insertion'] as string[]).includes(initAlgo ?? '') ? (initAlgo as Algo) : 'bubble'
  );
  const [base, setBase] = useState<number[]>(randomArr);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 帧序列由数据和算法派生（无需 state + effect）
  const frames = useMemo(() => genFrames(base, algo), [base, algo]);

  // 切换数据 / 算法：重置进度并停止播放
  const reset = (next: () => void) => { next(); setStep(0); setPlaying(false); };

  // 播放
  useEffect(() => {
    if (!playing) { if (timer.current) clearInterval(timer.current); return; }
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= frames.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 280);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, frames.length]);

  const frame = frames[step] ?? frames[0];
  const maxVal = Math.max(...base);

  return (
    <div className="itx-card sortviz">
      <div className="itx-head">
        <BarChart3 className="h-4 w-4" />
        <span>排序算法可视化</span>
        <span className="itx-hint">看排序一步步怎么交换</span>
      </div>

      <div className="sortviz__algos">
        {(['bubble', 'selection', 'insertion'] as Algo[]).map((a) => (
          <button key={a} type="button" className={`sortviz__algo${algo === a ? ' is-active' : ''}`} onClick={() => reset(() => setAlgo(a))}>
            {ALGO_NAME[a]}
          </button>
        ))}
      </div>

      <div className="sortviz__bars">
        {frame.arr.map((v, i) => {
          const isActive = frame.active.includes(i);
          const isSorted = frame.sorted.includes(i);
          const cls = isActive ? ' is-active' : isSorted ? ' is-sorted' : '';
          return (
            <div
              key={i}
              className={`sortviz__bar${cls}`}
              style={{ height: `${(v / maxVal) * 100}%` }}
            >
              <span className="sortviz__bar-val">{v}</span>
            </div>
          );
        })}
      </div>

      <div className="sortviz__controls">
        <button type="button" className="sortviz__btn" onClick={() => setPlaying((p) => !p)} disabled={step >= frames.length - 1 && !playing}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? '暂停' : step >= frames.length - 1 ? '已完成' : '播放'}
        </button>
        <button type="button" className="sortviz__btn" onClick={() => reset(() => setBase(randomArr()))}>
          <Shuffle className="h-3.5 w-3.5" />
          换一组
        </button>
        <input
          type="range"
          className="sortviz__range"
          min={0}
          max={frames.length - 1}
          value={step}
          onChange={(e) => { setPlaying(false); setStep(Number(e.target.value)); }}
          aria-label="进度"
        />
        <span className="sortviz__progress">{step}/{frames.length - 1}</span>
      </div>

      <p className="sortviz__desc">{ALGO_DESC[algo]}</p>
    </div>
  );
}

export default SortVisualizer;