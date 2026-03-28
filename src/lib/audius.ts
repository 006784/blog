export interface AudiusSearchTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  durationSeconds?: number;
  genre?: string;
  mood?: string;
  permalink: string;
  streamUrl: string;
  description?: string;
}

interface AudiusArtwork {
  '150x150'?: string;
  '480x480'?: string;
  '1000x1000'?: string;
}

interface AudiusUser {
  name: string;
}

interface AudiusTrackResponse {
  id: string;
  title: string;
  user: AudiusUser;
  artwork?: AudiusArtwork | null;
  duration?: number;
  genre?: string;
  mood?: string;
  permalink: string;
  is_streamable?: boolean;
  description?: string;
}

const AUDIUS_API_BASE = 'https://api.audius.co/v1';

function getAuthHeaders() {
  const bearerToken = process.env.AUDIUS_API_BEARER_TOKEN;
  if (!bearerToken) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${bearerToken}`,
  } as Record<string, string>;
}

async function fetchAudiusJson<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeaders(),
  };

  const response = await fetch(`${AUDIUS_API_BASE}${path}`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Audius request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function searchAudiusTracks(
  query: string,
  limit: number = 8
): Promise<AudiusSearchTrack[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const searchResult = await fetchAudiusJson<{ data: AudiusTrackResponse[] }>(
    `/tracks/search?query=${encodeURIComponent(trimmedQuery)}&limit=${limit}&sort_method=relevant`
  );

  const candidates = (searchResult.data || []).filter(
    (track) => track.is_streamable !== false
  );

  const tracks = await Promise.all(
    candidates.map(async (track) => {
      try {
        const streamResponse = await fetchAudiusJson<{ data: string }>(
          `/tracks/${track.id}/stream?no_redirect=true`
        );

        return {
          id: track.id,
          title: track.title,
          artist: track.user?.name || 'Unknown Artist',
          artwork:
            track.artwork?.['1000x1000'] ||
            track.artwork?.['480x480'] ||
            track.artwork?.['150x150'],
          durationSeconds: track.duration,
          genre: track.genre,
          mood: track.mood,
          permalink: track.permalink,
          streamUrl: streamResponse.data,
          description: track.description,
        } satisfies AudiusSearchTrack;
      } catch {
        return null;
      }
    })
  );

  return tracks.reduce<AudiusSearchTrack[]>((result, track) => {
    if (track) {
      result.push(track);
    }
    return result;
  }, []);
}
