'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

interface StatusItem {
  code: number;
  name: string;
  desc: string;
}

const GROUPS: { range: string; title: string; color: string; items: StatusItem[] }[] = [
  {
    range: '1xx', title: '信息响应', color: '#64748b',
    items: [
      { code: 100, name: 'Continue', desc: '已收到请求头，客户端可继续发送请求体。' },
      { code: 101, name: 'Switching Protocols', desc: '服务器同意切换协议，常见于升级到 WebSocket。' },
    ],
  },
  {
    range: '2xx', title: '成功', color: '#16a34a',
    items: [
      { code: 200, name: 'OK', desc: '请求成功，最常见的成功响应。' },
      { code: 201, name: 'Created', desc: '请求成功且创建了新资源，常用于 POST 创建后。' },
      { code: 204, name: 'No Content', desc: '成功但无返回内容，常用于删除操作。' },
    ],
  },
  {
    range: '3xx', title: '重定向', color: '#d97706',
    items: [
      { code: 301, name: 'Moved Permanently', desc: '资源永久迁移到新地址，SEO 会转移权重。' },
      { code: 302, name: 'Found', desc: '临时重定向，原地址以后还会用。' },
      { code: 304, name: 'Not Modified', desc: '资源未变化，用缓存即可，节省带宽。' },
    ],
  },
  {
    range: '4xx', title: '客户端错误', color: '#dc2626',
    items: [
      { code: 400, name: 'Bad Request', desc: '请求格式错误，服务器无法理解。' },
      { code: 401, name: 'Unauthorized', desc: '未认证，需要登录（其实是"未认证"）。' },
      { code: 403, name: 'Forbidden', desc: '已认证但无权限访问。' },
      { code: 404, name: 'Not Found', desc: '资源不存在，最知名的状态码。' },
      { code: 429, name: 'Too Many Requests', desc: '请求过于频繁，被限流了。' },
    ],
  },
  {
    range: '5xx', title: '服务器错误', color: '#9333ea',
    items: [
      { code: 500, name: 'Internal Server Error', desc: '服务器内部错误，代码出问题了。' },
      { code: 502, name: 'Bad Gateway', desc: '网关收到上游服务器的无效响应。' },
      { code: 503, name: 'Service Unavailable', desc: '服务暂时不可用，常见于过载或维护。' },
      { code: 504, name: 'Gateway Timeout', desc: '网关等待上游服务器超时。' },
    ],
  },
];

function findByCode(code: number): (StatusItem & { color: string }) | null {
  for (const g of GROUPS) {
    const it = g.items.find((x) => x.code === code);
    if (it) return { ...it, color: g.color };
  }
  return null;
}

export function HttpStatus({ default: defaultCode }: { default?: number | string }) {
  const initial =
    findByCode(Number(defaultCode)) ?? { ...GROUPS[3].items[3], color: GROUPS[3].color }; // 默认 404
  const [active, setActive] = useState<StatusItem & { color: string }>(initial);

  return (
    <div className="itx-card http-status">
      <div className="itx-head">
        <Globe className="h-4 w-4" />
        <span>HTTP 状态码速查</span>
        <span className="itx-hint">点击任意状态码查看含义</span>
      </div>

      <div className="http-status__grid">
        {GROUPS.map((g) => (
          <div key={g.range} className="http-status__group">
            <p className="http-status__group-title" style={{ color: g.color }}>
              {g.range} {g.title}
            </p>
            <div className="http-status__codes">
              {g.items.map((it) => (
                <button
                  key={it.code}
                  type="button"
                  className={`http-status__code${active.code === it.code ? ' is-active' : ''}`}
                  style={active.code === it.code ? { background: g.color, borderColor: g.color, color: '#fff' } : { color: g.color, borderColor: g.color }}
                  onClick={() => setActive({ ...it, color: g.color })}
                >
                  {it.code}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="http-status__detail" style={{ borderLeftColor: active.color }}>
        <p className="http-status__detail-code" style={{ color: active.color }}>
          {active.code} {active.name}
        </p>
        <p className="http-status__detail-desc">{active.desc}</p>
      </div>
    </div>
  );
}

export default HttpStatus;
