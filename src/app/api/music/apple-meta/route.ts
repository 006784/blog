import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** GET /api/music/apple-meta?url=<apple_music_url>
 *  Uses iTunes Lookup API (globally accessible, no geo-redirect issues).
 *  Returns title, artist, cover.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const parsed = new URL(url);

    // Extract country code from path: /ng/album/... → 'ng'
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const country = pathParts[0] ?? 'us';

    // Prefer track ID (?i=) for single tracks, fall back to album ID in path
    const trackId = parsed.searchParams.get('i');
    const albumId = pathParts.find((p) => /^\d+$/.test(p));
    const id = trackId ?? albumId;

    if (!id) return NextResponse.json({ error: 'Cannot extract ID from URL' }, { status: 400 });

    const lookupUrl = `https://itunes.apple.com/lookup?id=${id}&country=${country}`;
    const res = await fetch(lookupUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ error: 'iTunes lookup failed' }, { status: 502 });

    const data = await res.json() as {
      resultCount: number;
      results: Array<{
        trackName?: string;
        collectionName?: string;
        artistName?: string;
        artworkUrl100?: string;
      }>;
    };

    if (!data.resultCount || !data.results[0]) {
      return NextResponse.json({ error: 'No results' }, { status: 404 });
    }

    const item = data.results[0];
    const title = item.trackName ?? item.collectionName ?? '';
    const artist = item.artistName ?? '';
    // Scale up artwork: 100x100bb → 600x600bb
    const cover = (item.artworkUrl100 ?? '').replace('/100x100bb.', '/600x600bb.');

    return NextResponse.json({ title, artist, cover });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
