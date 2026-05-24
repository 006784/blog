'use client';

import { useEffect, useState } from 'react';
import type { LinkPreviewData } from '@/app/api/link-preview/route';

interface Props {
  url: string;
}

export function LinkPreviewCard({ url }: Props) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(`lp:${url}`);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      } catch { /* ignore */ }
    }

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d: LinkPreviewData & { error?: string }) => {
        if (d.error) { setError(true); return; }
        setData(d);
        sessionStorage.setItem(`lp:${url}`, JSON.stringify(d));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url]);

  if (error) {
    // 降级为普通链接
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview-fallback">
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview-card"
      aria-label={data?.title || url}
    >
      {loading ? (
        <div className="link-preview-skeleton">
          <div className="link-preview-skeleton-body">
            <div className="link-preview-skeleton-line w-3/4" />
            <div className="link-preview-skeleton-line w-full" />
            <div className="link-preview-skeleton-line w-1/2" />
          </div>
          <div className="link-preview-skeleton-img" />
        </div>
      ) : data ? (
        <>
          <div className="link-preview-body">
            <div className="link-preview-meta">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.favicon}
                alt=""
                className="link-preview-favicon"
                aria-hidden
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="link-preview-domain">{data.siteName || data.domain}</span>
            </div>
            <p className="link-preview-title">{data.title}</p>
            {data.description && (
              <p className="link-preview-desc">{data.description}</p>
            )}
          </div>
          {data.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt=""
              className="link-preview-thumb"
              aria-hidden
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </>
      ) : null}
    </a>
  );
}
