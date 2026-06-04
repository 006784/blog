'use client';

import { useMemo, useState } from 'react';
import { GitCompare } from 'lucide-react';

const DEFAULT_TEXT = '<a><b><c>';
const DEFAULT_BASE = '<.+>';   // 贪婪
const DEFAULT_LAZY = '<.+?>';  // 懒惰

interface Segment { text: string; match: boolean }

function run(pattern: string, text: string): { segs: Segment[]; count: number; error: string | null } {
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'g');
  } catch (e) {
    return { segs: [{ text, match: false }], count: 0, error: e instanceof Error ? e.message : '语法错误' };
  }
  const segs: Segment[] = [];
  let last = 0, n = 0, guard = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (guard++ > 5000) break;
    if (m.index === re.lastIndex) { re.lastIndex++; continue; }
    if (m.index > last) segs.push({ text: text.slice(last, m.index), match: false });
    segs.push({ text: m[0], match: true });
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) segs.push({ text: text.slice(last), match: false });
  if (segs.length === 0) segs.push({ text, match: false });
  return { segs, count: n, error: null };
}

function Highlight({ segs }: { segs: Segment[] }) {
  return (
    <div className="regex-greedy__result">
      {segs.map((s, i) =>
        s.match ? <mark key={i} className="regex-tester__hit">{s.text}</mark> : <span key={i}>{s.text}</span>
      )}
    </div>
  );
}

export function RegexGreedy({
  text: initText,
  greedy: initGreedy,
  lazy: initLazy,
}: {
  text?: string;
  greedy?: string;
  lazy?: string;
}) {
  const [text, setText] = useState(initText ?? DEFAULT_TEXT);
  const greedyPat = initGreedy ?? DEFAULT_BASE;
  const lazyPat = initLazy ?? DEFAULT_LAZY;

  const g = useMemo(() => run(greedyPat, text), [greedyPat, text]);
  const l = useMemo(() => run(lazyPat, text), [lazyPat, text]);

  return (
    <div className="itx-card regex-greedy">
      <div className="itx-head">
        <GitCompare className="h-4 w-4" />
        <span>贪婪 vs 懒惰</span>
        <span className="itx-hint">同一段文本，两种量词的匹配差别一目了然</span>
      </div>

      <input
        className="regex-greedy__text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label="测试文本"
      />

      <div className="regex-greedy__cols">
        <div className="regex-greedy__col">
          <p className="regex-greedy__label">
            贪婪 <code>{greedyPat}</code> · {g.count} 处
          </p>
          <Highlight segs={g.segs} />
          <p className="regex-greedy__note">尽可能多匹配，一口气吃到最后一个 &gt;</p>
        </div>
        <div className="regex-greedy__col">
          <p className="regex-greedy__label">
            懒惰 <code>{lazyPat}</code> · {l.count} 处
          </p>
          <Highlight segs={l.segs} />
          <p className="regex-greedy__note">加了 ? 后尽可能少匹配，逐个分开</p>
        </div>
      </div>
    </div>
  );
}

export default RegexGreedy;
