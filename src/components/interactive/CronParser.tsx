'use client';

import { useMemo, useState } from 'react';
import { Clock4, AlertCircle } from 'lucide-react';

const FIELDS = [
  { label: '分钟', min: 0, max: 59 },
  { label: '小时', min: 0, max: 23 },
  { label: '日', min: 1, max: 31 },
  { label: '月', min: 1, max: 12 },
  { label: '星期', min: 0, max: 7 },
];

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function describeField(expr: string, idx: number): string {
  const f = FIELDS[idx];
  if (expr === '*') return `每${f.label}`;
  // 步长 */n
  const stepAll = /^\*\/(\d+)$/.exec(expr);
  if (stepAll) return `每隔 ${stepAll[1]} ${f.label}`;
  // 区间 a-b
  const range = /^(\d+)-(\d+)$/.exec(expr);
  if (range) return `${f.label} ${range[1]} 到 ${range[2]}`;
  // 列表 a,b,c
  if (expr.includes(',')) return `${f.label}为 ${expr.split(',').join('、')}`;
  // 单值
  if (/^\d+$/.test(expr)) {
    if (idx === 4) return `${WEEK[Number(expr)] ?? expr}`;
    return `${f.label} ${expr}`;
  }
  return expr;
}

function humanize(parts: string[]): string {
  const [min, hour] = parts;
  // 针对最常见的"每天固定时刻"给一句顺口的话
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    return `每天 ${hour.padStart(2, '0')}:${min.padStart(2, '0')} 执行`;
  }
  return parts.map((p, i) => describeField(p, i)).join('，');
}

export function CronParser({ expr: initExpr }: { expr?: string }) {
  const [expr, setExpr] = useState(initExpr ?? '0 8 * * *');

  const result = useMemo(() => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return { error: 'Cron 表达式应有 5 段，用空格分隔：分 时 日 月 星期', parts: [] as string[], human: '' };
    }
    return { error: null as string | null, parts, human: humanize(parts) };
  }, [expr]);

  return (
    <div className="itx-card cron">
      <div className="itx-head">
        <Clock4 className="h-4 w-4" />
        <span>Cron 表达式解析器</span>
        <span className="itx-hint">把定时规则翻译成人话</span>
      </div>

      <input
        className="cron__input"
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        spellCheck={false}
        aria-label="Cron 表达式"
        placeholder="0 8 * * *"
      />

      {result.error ? (
        <div className="itx-error">
          <AlertCircle className="h-4 w-4" />
          <span>{result.error}</span>
        </div>
      ) : (
        <>
          <div className="cron__human">{result.human}</div>
          <div className="cron__fields">
            {result.parts.map((p, i) => (
              <div key={i} className="cron__field">
                <span className="cron__field-val">{p}</span>
                <span className="cron__field-label">{FIELDS[i].label}</span>
                <span className="cron__field-desc">{describeField(p, i)}</span>
              </div>
            ))}
          </div>
          <p className="cron__legend">
            语法：<code>*</code> 任意值 · <code>*/n</code> 每隔 n · <code>a-b</code> 区间 · <code>a,b</code> 列表 · 星期 0/7 都表示周日
          </p>
        </>
      )}
    </div>
  );
}

export default CronParser;