'use client';

import { useEffect, useState } from 'react';
import { Hash, Copy, Check } from 'lucide-react';

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algo = (typeof ALGOS)[number];

async function digestHex(algo: Algo, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function HashGenerator({ text: initText, algo: initAlgo }: { text?: string; algo?: string }) {
  const [text, setText] = useState(initText ?? 'Hello, Lumen');
  const [algo, setAlgo] = useState<Algo>(
    (ALGOS as readonly string[]).includes(initAlgo ?? '') ? (initAlgo as Algo) : 'SHA-256'
  );
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    digestHex(algo, text).then((h) => { if (alive) setHash(h); });
    return () => { alive = false; };
  }, [text, algo]);

  function copy() {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="itx-card hash-gen">
      <div className="itx-head">
        <Hash className="h-4 w-4" />
        <span>哈希生成器</span>
        <span className="itx-hint">改动任意一个字，哈希全变——这就是雪崩效应</span>
      </div>

      <textarea
        className="hash-gen__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        spellCheck={false}
        placeholder="输入任意文字"
        aria-label="哈希输入"
      />

      <div className="hash-gen__algos">
        {ALGOS.map((a) => (
          <button
            key={a}
            type="button"
            className={`hash-gen__algo${algo === a ? ' is-active' : ''}`}
            onClick={() => setAlgo(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="hash-gen__output">
        <code className="hash-gen__hash">{hash}</code>
        <button type="button" className="hash-gen__copy" onClick={copy} aria-label="复制哈希">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="hash-gen__meta">
        {algo} · 长度 {hash.length} 个十六进制字符（{hash.length * 4} 位）
      </p>
    </div>
  );
}

export default HashGenerator;
