/** 解析音乐 URL，返回可 embed 的信息 */

export type EmbedInfo = {
  type: 'youtube' | 'spotify' | 'bilibili' | 'netease' | 'link';
  embedUrl?: string;   // iframe src
  externalUrl: string;
  platform: string;
  color: string;
};

export function parseMusicUrl(url: string): EmbedInfo | null {
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get('v') || '';
      }
      if (videoId) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
          externalUrl: url,
          platform: 'YouTube',
          color: '#ff0000',
        };
      }
    }

    // Spotify
    if (host === 'open.spotify.com') {
      const path = u.pathname; // /track/xxx or /album/xxx
      const embedPath = path.replace(/^\/(track|album|playlist|episode)/, (_, type) => `/${type}`);
      return {
        type: 'spotify',
        embedUrl: `https://open.spotify.com/embed${embedPath}?utm_source=generator&theme=0`,
        externalUrl: url,
        platform: 'Spotify',
        color: '#1DB954',
      };
    }

    // Bilibili
    if (host === 'bilibili.com' || host === 'b23.tv') {
      const bvMatch = u.pathname.match(/\/(BV[a-zA-Z0-9]+)/);
      const bvid = bvMatch?.[1];
      if (bvid) {
        return {
          type: 'bilibili',
          embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&as_wide=1&high_quality=1&danmaku=0`,
          externalUrl: url,
          platform: 'Bilibili',
          color: '#fb7299',
        };
      }
    }

    // 网易云音乐
    if (host === 'music.163.com') {
      const idMatch = url.match(/id=(\d+)/);
      const id = idMatch?.[1];
      if (id) {
        return {
          type: 'netease',
          embedUrl: `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66`,
          externalUrl: url,
          platform: '网易云音乐',
          color: '#cc0000',
        };
      }
    }

    // 通用链接
    return {
      type: 'link',
      externalUrl: url,
      platform: host,
      color: '#6b7280',
    };
  } catch {
    return null;
  }
}

export const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff0000',
  spotify: '#1DB954',
  bilibili: '#fb7299',
  netease: '#cc0000',
  'qq music': '#fcb814',
  apple: '#fc3c44',
  local: '#1b8272',
  other: '#6b7280',
};
