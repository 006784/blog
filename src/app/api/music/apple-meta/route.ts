import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface AppleMetaResult {
  title: string;
  artist: string;
  album: string;
  cover: string;
  genre: string;
  releaseDate: string;      // ISO string
  durationMs: number;
  trackNumber: number;
  trackCount: number;
  previewUrl: string;
}

/** GET /api/music/apple-meta?url=<apple_music_url> */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const country = pathParts[0] ?? 'us';
    const trackId = parsed.searchParams.get('i');
    const albumId = pathParts.find((p) => /^\d+$/.test(p));
    const id = trackId ?? albumId;

    if (!id) return NextResponse.json({ error: 'Cannot extract ID from URL' }, { status: 400 });

    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${id}&country=${country}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ error: 'iTunes lookup failed' }, { status: 502 });

    const data = await res.json() as {
      resultCount: number;
      results: Array<{
        trackName?: string;
        collectionName?: string;
        artistName?: string;
        artworkUrl100?: string;
        primaryGenreName?: string;
        releaseDate?: string;
        trackTimeMillis?: number;
        trackNumber?: number;
        trackCount?: number;
        previewUrl?: string;
      }>;
    };

    if (!data.resultCount || !data.results[0]) {
      return NextResponse.json({ error: 'No results' }, { status: 404 });
    }

    const item = data.results[0];
    const result: AppleMetaResult = {
      title:       item.trackName ?? item.collectionName ?? '',
      artist:      item.artistName ?? '',
      album:       item.collectionName ?? '',
      cover:       (item.artworkUrl100 ?? '').replace('/100x100bb.', '/600x600bb.'),
      genre:       item.primaryGenreName ?? '',
      releaseDate: item.releaseDate ?? '',
      durationMs:  item.trackTimeMillis ?? 0,
      trackNumber: item.trackNumber ?? 0,
      trackCount:  item.trackCount ?? 0,
      previewUrl:  item.previewUrl ?? '',
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
