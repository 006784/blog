'use client';

import { useMemo, useState } from 'react';

interface UsesIconProps {
  iconUrl?: string;
  link?: string;
  name: string;
  fallback: string;
  wrapperClassName?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}

function getHostname(value?: string): string | null {
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function buildCandidates(iconUrl?: string, link?: string): string[] {
  const seen = new Set<string>();
  const candidates: string[] = [];

  const push = (value?: string | null) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    candidates.push(value);
  };

  push(iconUrl);

  const hostname = getHostname(link) || getHostname(iconUrl);
  if (hostname) {
    push(`https://${hostname}/favicon.ico`);
  }

  return candidates;
}

export function UsesIcon({
  iconUrl,
  link,
  name,
  fallback,
  wrapperClassName = '',
  imgClassName = '',
  fallbackClassName = '',
}: UsesIconProps) {
  const candidates = useMemo(() => buildCandidates(iconUrl, link), [iconUrl, link]);
  const [index, setIndex] = useState(0);

  const src = candidates[index];

  return (
    <div className={wrapperClassName}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={imgClassName}
          onError={() => setIndex((current) => current + 1)}
        />
      ) : (
        <span className={fallbackClassName}>{fallback}</span>
      )}
    </div>
  );
}
