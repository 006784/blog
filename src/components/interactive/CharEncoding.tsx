'use client';

import { useMemo, useState } from 'react';
import { Binary } from 'lucide-react';

interface CharInfo {
  char: string;
  codePoint: number;
  hex: string;
  utf8: string[]; // 每个字节的十六进制
}

export function CharEncoding({ text: initText }: { text?: string }) {
  const [text, setText] = useState(initText ?? 'A中🐱');

  const chars = useMemo<CharInfo[]>(() => {
    const out: CharInfo[] = [];
    // 用 for...of 正确处理代理对（emoji 等）
    for (const ch of text.slice(0, 12)) {
      const cp = ch.codePointAt(0) ?? 0;
      const bytes = Array.from(new TextEncoder().encode(ch)).map((b) =>
        b.toString(16).toUpperCase().padStart(2, '0')
      );
      out.push({
        char: ch,
        codePoint: cp,
        hex: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
        utf8: bytes,
      });
    }
    return out;
  }, [text]);

  return (
    <div className="itx-card chenc">
      <div className="itx-head">
        <Binary className="h-4 w-4" />
        <span>字符编码可视化</span>
        <span className="itx-hint">看一个字如何变成 Unicode 码点和 UTF-8 字节</span>
      </div>

      <input
        className="chenc__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label="输入字符"
        placeholder="输入一些字符（最多显示 12 个）"
      />

      <div className="chenc__grid">
        {chars.map((c, i) => (
          <div key={i} className="chenc__cell">
            <div className="chenc__char">{c.char}</div>
            <div className="chenc__cp">{c.hex}</div>
            <div className="chenc__bytes">
              {c.utf8.map((b, j) => (
                <span key={j} className="chenc__byte">{b}</span>
              ))}
            </div>
            <div className="chenc__bytecount">{c.utf8.length} 字节</div>
          </div>
        ))}
      </div>

      <p className="chenc__legend">
        每个字符先有一个 Unicode <strong>码点</strong>（U+xxxx），再按 UTF-8 规则编码成 1-4 个<strong>字节</strong>。
        ASCII 字符占 1 字节，中文通常 3 字节，emoji 往往 4 字节——这就是为什么「字符数」不等于「字节数」。
      </p>
    </div>
  );
}

export default CharEncoding;