import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track') ?? '';
  const artist = searchParams.get('artist') ?? '';
  const album = searchParams.get('album') ?? '';

  if (!track) return NextResponse.json({ error: 'missing track' }, { status: 400 });

  try {
    const params = new URLSearchParams({ track_name: track, artist_name: artist, album_name: album });
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'blog-lrclib-proxy/1.0' },
      next: { revalidate: 86400 }, // 缓存 24h
    });

    if (res.status === 404) return NextResponse.json({ found: false });
    if (!res.ok) return NextResponse.json({ found: false });

    const data = await res.json() as { plainLyrics?: string; syncedLyrics?: string; instrumental?: boolean };

    if (data.instrumental) return NextResponse.json({ found: true, instrumental: true });
    if (!data.plainLyrics) return NextResponse.json({ found: false });

    return NextResponse.json({ found: true, lyrics: data.plainLyrics });
  } catch {
    return NextResponse.json({ found: false });
  }
}
