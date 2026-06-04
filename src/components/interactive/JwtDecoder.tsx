'use client';

import { useMemo, useState } from 'react';
import { KeyRound, AlertCircle } from 'lucide-react';

// 一个示例 token（HS256），默认填入便于读者直接看到效果
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikx1bWVuIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE2MjM5MDIyLCJleHAiOjE3MTYyNDI2MjJ9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// 浏览器端安全的 base64url 解码
function base64UrlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  try {
    const bytes = atob(s);
    // 处理 UTF-8
    const arr = Uint8Array.from(bytes, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(arr);
  } catch {
    return '';
  }
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

// 常见 claim 的中文解释
const CLAIM_DESC: Record<string, string> = {
  alg: '签名算法',
  typ: '令牌类型',
  iss: '签发者（issuer）',
  sub: '主题，通常是用户 ID（subject）',
  aud: '接收方（audience）',
  exp: '过期时间（Unix 时间戳）',
  nbf: '在此时间前不可用（not before）',
  iat: '签发时间（issued at）',
  jti: '令牌唯一 ID',
  name: '自定义：用户名',
  role: '自定义：角色',
};

function formatTimestamp(v: unknown): string | null {
  if (typeof v !== 'number') return null;
  // 10 位秒级时间戳
  if (v > 1_000_000_000 && v < 10_000_000_000) {
    const d = new Date(v * 1000);
    return d.toLocaleString('zh-CN', { hour12: false });
  }
  return null;
}

export function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE_JWT);

  const result = useMemo(() => {
    const trimmed = token.trim();
    if (!trimmed) return { error: '请粘贴一个 JWT' as string | null };

    const parts = trimmed.split('.');
    if (parts.length !== 3) {
      return { error: 'JWT 应由三段组成，用点号(.)分隔：header.payload.signature' };
    }

    const [h, p, sig] = parts;
    const headerRaw = base64UrlDecode(h);
    const payloadRaw = base64UrlDecode(p);

    if (!headerRaw || !payloadRaw) {
      return { error: '无法解码，请检查是否为合法的 base64url 编码' };
    }

    let payloadObj: Record<string, unknown> = {};
    try {
      payloadObj = JSON.parse(payloadRaw) as Record<string, unknown>;
    } catch {
      // ignore
    }

    return {
      error: null,
      header: prettyJson(headerRaw),
      payload: prettyJson(payloadRaw),
      signature: sig,
      claims: payloadObj,
      parts: [h, p, sig] as [string, string, string],
    };
  }, [token]);

  return (
    <div className="jwt-decoder">
      <div className="jwt-decoder__head">
        <KeyRound className="h-4 w-4" />
        <span>JWT 解码器</span>
        <span className="jwt-decoder__hint">在下方粘贴你的 JWT，实时拆解（纯本地运算，不上传）</span>
      </div>

      <textarea
        className="jwt-decoder__input"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={4}
        spellCheck={false}
        placeholder="粘贴 JWT：xxxxx.yyyyy.zzzzz"
        aria-label="JWT 输入"
      />

      {/* 着色的三段式预览 */}
      {!result.error && result.parts && (
        <div className="jwt-decoder__colored">
          <span className="jwt-seg jwt-seg--header">{result.parts[0]}</span>
          <span className="jwt-dot">.</span>
          <span className="jwt-seg jwt-seg--payload">{result.parts[1]}</span>
          <span className="jwt-dot">.</span>
          <span className="jwt-seg jwt-seg--sig">{result.parts[2]}</span>
        </div>
      )}

      {result.error ? (
        <div className="jwt-decoder__error">
          <AlertCircle className="h-4 w-4" />
          <span>{result.error}</span>
        </div>
      ) : (
        <div className="jwt-decoder__grid">
          <div className="jwt-decoder__panel jwt-decoder__panel--header">
            <p className="jwt-decoder__label">Header · 头部</p>
            <pre>{result.header}</pre>
          </div>
          <div className="jwt-decoder__panel jwt-decoder__panel--payload">
            <p className="jwt-decoder__label">Payload · 载荷</p>
            <pre>{result.payload}</pre>
          </div>
          <div className="jwt-decoder__panel jwt-decoder__panel--sig">
            <p className="jwt-decoder__label">Signature · 签名</p>
            <p className="jwt-decoder__sig-note">
              签名由 header 和 payload 用密钥计算得出，只能验证、无法从这里反解出密钥。这一段保证了令牌未被篡改。
            </p>
          </div>
        </div>
      )}

      {/* claim 解释表 */}
      {!result.error && result.claims && Object.keys(result.claims).length > 0 && (
        <div className="jwt-decoder__claims">
          <p className="jwt-decoder__label">Payload 字段含义</p>
          <table>
            <tbody>
              {Object.entries(result.claims).map(([k, v]) => {
                const ts = formatTimestamp(v);
                return (
                  <tr key={k}>
                    <td className="jwt-claim-key">{k}</td>
                    <td className="jwt-claim-val">
                      {String(v)}
                      {ts && <span className="jwt-claim-ts"> → {ts}</span>}
                    </td>
                    <td className="jwt-claim-desc">{CLAIM_DESC[k] ?? '自定义字段'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JwtDecoder;
