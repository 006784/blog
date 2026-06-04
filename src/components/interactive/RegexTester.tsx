'use client';

import { useMemo, useState } from 'react';
import { Regex, AlertCircle } from 'lucide-react';

const SAMPLE_PATTERN = '\\b\\w+@\\w+\\.\\w+\\b';
const SAMPLE_FLAGS = 'g';
const SAMPLE_TEXT =
  '联系我们：support@example.com 或 sales@artchain.icu。\n无效的：abc@、@def.com。\n再来一个：hello.world@my-site.org';

interface Segment {
  text: string;
  match: boolean;
}

export function RegexTester({
  pattern: initPattern,
  flags: initFlags,
  text: initText,
}: {
  pattern?: string;
  flags?: string;
  text?: string;
}) {
  const [pattern, setPattern] = useState(initPattern ?? SAMPLE_PATTERN);
  const [flags, setFlags] = useState(initFlags ?? SAMPLE_FLAGS);
  const [text, setText] = useState(initText ?? SAMPLE_TEXT);

  const { segments, error, count } = useMemo(() => {
    if (!pattern) {
      return { segments: [{ text, match: false }] as Segment[], error: null as string | null, count: 0 };
    }
    let re: RegExp;
    try {
      // 强制带 g，便于遍历所有匹配；保留用户其它 flag
      const userFlags = flags.includes('g') ? flags : flags + 'g';
      re = new RegExp(pattern, userFlags);
    } catch (e) {
      return { segments: [{ text, match: false }] as Segment[], error: e instanceof Error ? e.message : '正则语法错误', count: 0 };
    }

    const segs: Segment[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let n = 0;
    let guard = 0;
    while ((m = re.exec(text)) !== null) {
      if (guard++ > 10000) break;
      // 防止零宽匹配死循环
      if (m.index === re.lastIndex) { re.lastIndex++; continue; }
      if (m.index > last) segs.push({ text: text.slice(last, m.index), match: false });
      segs.push({ text: m[0], match: true });
      last = m.index + m[0].length;
      n++;
    }
    if (last < text.length) segs.push({ text: text.slice(last), match: false });
    if (segs.length === 0) segs.push({ text, match: false });
    return { segments: segs, error: null, count: n };
  }, [pattern, flags, text]);

  return (
    <div className="itx-card regex-tester">
      <div className="itx-head">
        <Regex className="h-4 w-4" />
        <span>正则表达式测试器</span>
        <span className="itx-hint">实时高亮匹配结果（纯本地运算）</span>
      </div>

      <div className="regex-tester__inputs">
        <div className="regex-tester__pattern-row">
          <span className="regex-tester__slash">/</span>
          <input
            className="regex-tester__pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            placeholder="正则表达式"
            aria-label="正则表达式"
          />
          <span className="regex-tester__slash">/</span>
          <input
            className="regex-tester__flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
            spellCheck={false}
            placeholder="flags"
            aria-label="标志位"
          />
        </div>
      </div>

      {error ? (
        <div className="itx-error">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : (
        <p className="regex-tester__count">
          匹配到 <strong>{count}</strong> 处
        </p>
      )}

      <textarea
        className="regex-tester__text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        spellCheck={false}
        placeholder="在这里输入要测试的文本"
        aria-label="测试文本"
      />

      <div className="regex-tester__result">
        {segments.map((s, i) =>
          s.match ? (
            <mark key={i} className="regex-tester__hit">{s.text}</mark>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </div>
    </div>
  );
}

export default RegexTester;
