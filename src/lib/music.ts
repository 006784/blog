import type { Song } from '@/lib/supabase';

const DIRECT_AUDIO_URL_RE =
  /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|weba|m3u8)(?:$|[?#])/i;

export function isDirectAudioUrl(url?: string | null): boolean {
  if (!url) {
    return false;
  }

  return DIRECT_AUDIO_URL_RE.test(url);
}

export function getPlayableSongUrl(
  song: Pick<Song, 'audio_url' | 'music_url'>
): string | null {
  if (song.audio_url) {
    return song.audio_url;
  }

  if (isDirectAudioUrl(song.music_url)) {
    return song.music_url ?? null;
  }

  return null;
}
