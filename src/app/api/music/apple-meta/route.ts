import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** GET /api/music/apple-meta?url=<apple_music_url>
 *  Proxies Apple Music oEmbed to avoid CORS. Returns title, author_name, thumbnail_url.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const oembedUrl = `https://music.apple.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; blog-bot/1.0)' },
      next: { revalidate: 86400 }, // cache 24h
    });
    if (!res.ok) return NextResponse.json({ error: 'Apple Music oEmbed failed' }, { status: 502 });

    const data = await res.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      height?: number;
      type?: string;
    };

    // thumbnail_url comes in small size; request larger via URL manipulation
    let coverUrl = data.thumbnail_url ?? '';
    if (coverUrl) {
      // Apple CDN pattern: .../300x300bb.jpg → bump to 600x600
      coverUrl = coverUrl.replace(/\/\d+x\d+bb\./, '/600x600bb.');
    }

    return NextResponse.json({
      title: data.title ?? '',
      artist: data.author_name ?? '',
      cover: coverUrl,
      height: data.height ?? 175,
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
