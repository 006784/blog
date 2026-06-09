'use client';

import { useState } from 'react';
import { FileCode2, ArrowDownUp } from 'lucide-react';

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function base64ToUtf8(s: string): string {
  const bin = atob(s.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function Base64Tool({ text: initText }: { text?: string }) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState(initText ?? '你好，Lumen');

  let output = '';
  let error: string | null = null;
  try {
    output = mode === 'encode' ? utf8ToBase64(input) : base64ToUtf8(input);
  } catch {
    error = mode === 'decode' ? '不是合法的 Base64 字符串' : '编码失败';
  }

  return (
    <div className="itx-card b64">
      <div className="itx-head">
        <FileCode2 className="h-4 w-4" />
        <span>Base64 编解码器</span>
        <span className="itx-hint">文字与 Base64 实时互转（支持中文 / UTF-8）</span>
      </div>

      <div className="b64__modes">
        <button type="button" className={`b64__mode${mode === 'encode' ? ' is-active' : ''}`} onClick={() => setMode('encode')}>文字 → Base64</button>
        <button type="button" className="b64__swap" aria-label="切换方向" onClick={() => { setMode(mode === 'encode' ? 'decode' : 'encode'); setInput(output || input); }}>
          <ArrowDownUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" className={`b64__mode${mode === 'decode' ? ' is-active' : ''}`} onClick={() => setMode('decode')}>Base64 → 文字</button>
      </div>

      <label className="b64__label">{mode === 'encode' ? '输入文字' : '输入 Base64'}</label>
      <textarea
        className="b64__io"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        spellCheck={false}
        aria-label="输入"
      />

      <label className="b64__label">{mode === 'encode' ? 'Base64 结果' : '解码结果'}</label>
      <div className={`b64__out${error ? ' b64__out--error' : ''}`}>
        {error ?? output}
      </div>
    </div>
  );
}

export default Base64Tool;
