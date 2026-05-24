import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  siteName: string;
  domain: string;
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return '';
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : '';
}

function extractFavicon(html: string, baseUrl: string): string {
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const href = m[1].trim();
      if (href.startsWith('http')) return href;
      const origin = new URL(baseUrl).origin;
      return href.startsWith('/') ? origin + href : `${origin}/${href}`;
    }
  }
  // fallback: /favicon.ico
  return new URL(baseUrl).origin + '/favicon.ico';
}

/** GET /api/link-preview?url=<url> */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  let url: string;
  try {
    url = new URL(rawUrl).toString();
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Block internal / private addresses
  const hostname = new URL(url).hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
    return NextResponse.json({ error: 'Blocked' }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Lumen-Bot/1.0; +https://www.artchain.icu)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });

    const html = await res.text();
    const domain = new URL(url).hostname.replace(/^www\./, '');

    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractTitle(html) ||
      domain;

    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'twitter:description') ||
      extractMeta(html, 'description') ||
      '';

    const image =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractMeta(html, 'twitter:image:src') ||
      '';

    const siteName =
      extractMeta(html, 'og:site_name') ||
      extractMeta(html, 'application-name') ||
      domain;

    const favicon = extractFavicon(html, url);

    const data: LinkPreviewData = {
      url,
      title: title.slice(0, 120),
      description: description.slice(0, 200),
      image,
      favicon,
      siteName,
      domain,
    };

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Fetch failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
