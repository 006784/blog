'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DayData {
  date: string;  // YYYY-MM-DD
  count: number;
}

interface ContributionHeatmapProps {
  data: DayData[];
  title?: string;
  /** 显示最近多少周，默认 52（一年） */
  weeks?: number;
}

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const LEVEL_CLASS = [
  'bg-zinc-100 dark:bg-zinc-800',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-300 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-600 dark:bg-emerald-400',
];

export function ContributionHeatmap({ data, title = '内容产出', weeks = 52 }: ContributionHeatmapProps) {
  const { grid, monthLabels, total } = useMemo(() => {
    // 构建日期 → count 查找表
    const countMap: Record<string, number> = {};
    let total = 0;
    data.forEach(({ date, count }) => {
      countMap[date] = (countMap[date] || 0) + count;
      total += count;
    });

    // 从今天往前推 weeks 周，补齐到周日起始
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 最后一天是今天所在周的周六
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    // 起始日
    const start = new Date(end);
    start.setDate(start.getDate() - weeks * 7 + 1);

    // 按列（周）组织
    const cols: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = [];
    const cur = new Date(start);

    while (cur <= end) {
      const col: typeof cols[number] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().split('T')[0];
        const count = countMap[dateStr] || 0;
        col.push({ date: dateStr, count, level: getLevel(count) });
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(col);
    }

    // 计算月份标签位置
    const monthLabels: { label: string; col: number }[] = [];
    cols.forEach((col, i) => {
      const firstDay = new Date(col[0].date);
      if (firstDay.getDate() <= 7 || i === 0) {
        const label = MONTHS[firstDay.getMonth()];
        if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
          monthLabels.push({ label, col: i });
        }
      }
    });

    return { grid: cols, monthLabels, total };
  }, [data, weeks]);

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h3>
          <span className="text-xs text-zinc-500">{total} 篇内容，近 {weeks} 周</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 月份标签 */}
          <div className="relative mb-1 flex" style={{ paddingLeft: '24px' }}>
            {monthLabels.map(({ label, col }) => (
              <div
                key={label + col}
                className="absolute text-[10px] text-zinc-400"
                style={{ left: `${24 + col * 13}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 格子 + 星期标签 */}
          <div className="flex gap-1">
            {/* 星期标签（只显示一、三、五）*/}
            <div className="flex flex-col justify-between pr-1" style={{ height: `${7 * 13 - 1}px` }}>
              {DAYS.map((d, i) => (
                <span
                  key={d}
                  className="text-[9px] leading-none text-zinc-400"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* 格子矩阵 */}
            <div className="flex gap-[2px]">
              {grid.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[2px]">
                  {col.map(({ date, count, level }) => (
                    <motion.div
                      key={date}
                      title={count > 0 ? `${date}：${count} 篇` : date}
                      className={`h-[11px] w-[11px] rounded-[2px] cursor-default transition-colors ${LEVEL_CLASS[level]}`}
                      whileHover={{ scale: 1.4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="mt-2 flex items-center gap-1.5 justify-end">
            <span className="text-[10px] text-zinc-400">少</span>
            {([0, 1, 2, 3, 4] as const).map((l) => (
              <div key={l} className={`h-[11px] w-[11px] rounded-[2px] ${LEVEL_CLASS[l]}`} />
            ))}
            <span className="text-[10px] text-zinc-400">多</span>
          </div>
        </div>
      </div>
    </div>
  );
}
