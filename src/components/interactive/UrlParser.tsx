'use client';

import { useMemo, useState } from 'react';
import { Link2, AlertCircle } from 'lucide-react';

const SAMPLE = 'https://www.artchain.icu:443/blog/jwt?from=home&page=2#section-3';

const PART_DESC: Record<string, string> = {
  protocol: '协议，决定用什么方式通信（http/https 等）',
  hostname: '主机名（域名或 IP）',
  port: '端口，省略时用协议默认值（http:80 / https:443）',
  pathname: '路径，定位服务器上的具体资源',
  search: '查询字符串，以 ? 开头的参数部分',
  hash: '锚点，以 # 开头，定位页面内位置，不发给服务器',
};

export function UrlParser({ url: initUrl }: { url?: string }) {
  const [url, setUrl] = useState(initUrl ?? SAMPLE);

  const parsed = useMemo(() => {
    try {
      const u = new URL(url.trim());
      const params: { key: string; value: string }[] = [];
      u.searchParams.forEach((value, key) => params.push({ key, value }));
      return {
        error: null as string | null,
        parts: [
          { name: 'protocol', label: '协议', value: u.protocol },
          { name: 'hostname', label: '主机', value: u.hostname },
          { name: 'port', label: '端口', value: u.port || '(默认)' },
          { name: 'pathname', label: '路径', value: u.pathname },
          { name: 'search', label: '查询', value: u.search || '(无)' },
          { name: 'hash', label: '锚点', value: u.hash || '(无)' },
        ],
        params,
      };
    } catch {
      return { error: '不是合法的 URL（需要带协议，如 https://）', parts: [], params: [] };
    }
  }, [url]);

  return (
    <div className="itx-card urlp">
      <div className="itx-head">
        <Link2 className="h-4 w-4" />
        <span>URL 结构解析器</span>
        <span className="itx-hint">把一个网址拆解成各个组成部分</span>
      </div>

      <input
        className="urlp__input"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        spellCheck={false}
        aria-label="URL 输入"
        placeholder="https://example.com/path?key=value#hash"
      />

      {parsed.error ? (
        <div className="itx-error">
          <AlertCircle className="h-4 w-4" />
          <span>{parsed.error}</span>
        </div>
      ) : (
        <>
          <table className="urlp__table">
            <tbody>
              {parsed.parts.map((p) => (
                <tr key={p.name}>
                  <td className="urlp__key">{p.label}</td>
                  <td className="urlp__val">{p.value}</td>
                  <td className="urlp__desc">{PART_DESC[p.name]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {parsed.params.length > 0 && (
            <div className="urlp__params">
              <p className="urlp__params-title">查询参数（拆开后）</p>
              {parsed.params.map((p, i) => (
                <div key={i} className="urlp__param">
                  <span className="urlp__param-key">{p.key}</span>
                  <span className="urlp__param-eq">=</span>
                  <span className="urlp__param-val">{p.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UrlParser;
