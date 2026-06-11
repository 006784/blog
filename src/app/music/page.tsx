'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, ChevronDown, Disc3, ExternalLink, Heart,
  Loader2, Pause, Play, Plus, Trash2, X,
} from 'lucide-react';
import {
  type Song,
  getAllSongs,
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { getPlayableSongUrl } from '@/lib/music';
import { parseMusicUrl } from '@/lib/music-embed';

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer'), {
  ssr: false,
  loading: () => (
    <div className="h-24 rounded-2xl bg-(--surface-overlay) animate-pulse" aria-label="播放器加载中" />
  ),
});

function embedHeight(type: string, url: string) {
  if (type === 'apple') return url.includes('?i=') ? 175 : 450;
  if (type === 'spotify') return 152;
  if (type === 'netease') return 86;
  return 240;
}

interface AppleMeta {
  title: string; artist: string; album: string; cover: string;
  genre: string; releaseDate: string; durationMs: number;
  trackNumber: number; trackCount: number; previewUrl: string;
}

async function fetchAppleMeta(url: string): Promise<AppleMeta | null> {
  try {
    const res = await fetch(`/api/music/apple-meta?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return await res.json() as AppleMeta;
  } catch { return null; }
}

function fmtDuration(ms: number) {
  if (!ms) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function fetchLyrics(title: string, artist: string, album: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ track: title, artist, album });
    const res = await fetch(`/api/music/lyrics?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { found: boolean; lyrics?: string; instrumental?: boolean };
    if (!data.found) return null;
    if (data.instrumental) return '[纯音乐]';
    return data.lyrics ?? null;
  } catch { return null; }
}

// Apple Music detail panel (used in row expand)
function AppleDetailPanel({ url, musicUrl }: { url: string; musicUrl: string }) {
  const [meta, setMeta] = useState<AppleMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    fetchAppleMeta(url).then(m => { setMeta(m); setLoading(false); });
  }, [url]);

  useEffect(() => {
    if (!meta || lyricsLoading || lyrics !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLyricsLoading(true);
    fetchLyrics(meta.title, meta.artist, meta.album).then(l => {
      setLyrics(l ?? '');
      setLyricsLoading(false);
    });
  }, [meta, lyrics, lyricsLoading]);

  function togglePreview() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  }

  return (
    <div className="apple-detail-panel">
      {loading ? (
        <div className="flex flex-col gap-2 p-3">
          {(['song-list-skel-w1', 'song-list-skel-w2', 'song-list-skel-w3'] as const).map(cls => (
            <div key={cls} className={`h-3 rounded bg-white/10 animate-pulse ${cls}`} />
          ))}
        </div>
      ) : meta ? (
        <>
          <div className="apple-detail-meta">
            {meta.album && (
              <div className="apple-detail-row">
                <span className="apple-detail-label">专辑</span>
                <span className="apple-detail-value">{meta.album}</span>
              </div>
            )}
            <div className="apple-detail-pills">
              {meta.genre && <span className="apple-detail-pill">{meta.genre}</span>}
              {meta.durationMs > 0 && <span className="apple-detail-pill">{fmtDuration(meta.durationMs)}</span>}
              {meta.trackNumber > 0 && (
                <span className="apple-detail-pill">第 {meta.trackNumber} / {meta.trackCount} 首</span>
              )}
              {meta.releaseDate && <span className="apple-detail-pill">{fmtDate(meta.releaseDate)}</span>}
            </div>
          </div>

          {meta.previewUrl && (
            <div className="apple-preview-player">
              <audio
                ref={audioRef}
                src={meta.previewUrl}
                onTimeUpdate={() => {
                  const a = audioRef.current;
                  if (a) setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
                }}
                onEnded={() => { setPlaying(false); setProgress(0); }}
              />
              <button type="button" onClick={togglePreview} className="apple-preview-btn" aria-label={playing ? '暂停试听' : '试听 30 秒'}>
                {playing
                  ? <Pause className="h-3.5 w-3.5 fill-current" />
                  : <Play className="h-3.5 w-3.5 fill-current" />}
              </button>
              <div className="apple-preview-track">
                <div className="apple-preview-bar">
                  <div className="apple-preview-fill" style={{ '--fill': `${progress}%` } as React.CSSProperties} />
                </div>
                <span className="apple-preview-label">{playing ? '试听中…' : '30 秒试听'}</span>
              </div>
              <a href={musicUrl} target="_blank" rel="noopener noreferrer" className="apple-open-btn">
                <ExternalLink className="h-3 w-3" />
                完整收听
              </a>
            </div>
          )}

          {(lyricsLoading || (lyrics && lyrics.length > 0)) && (
            <div className="apple-lyrics-section">
              <button type="button" className="apple-lyrics-toggle" onClick={() => setLyricsOpen(v => !v)}>
                <span>歌词</span>
                {lyricsLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <ChevronDown className={cn('h-3 w-3 transition-transform', lyricsOpen && 'rotate-180')} />}
              </button>
              <AnimatePresence>
                {lyricsOpen && !lyricsLoading && lyrics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="apple-lyrics-body">
                      {lyrics === '[纯音乐]'
                        ? <span className="apple-lyrics-instrumental">纯音乐，请欣赏</span>
                        : lyrics.split('\n').map((line, i) => (
                          <p key={i} className={cn('apple-lyrics-line', !line.trim() && 'apple-lyrics-blank')}>{line || ' '}</p>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        <a href={musicUrl} target="_blank" rel="noopener noreferrer" className="apple-open-btn mx-3 my-2">
          <ExternalLink className="h-3 w-3" />
          在 Apple Music 播放
        </a>
      )}
    </div>
  );
}

const REGION_NOTES = new Set(['欧美', '日本', '韩国']);

// ── 歌曲列表行 ────────────────────────────────────────────────────
function SongRow({
  song, index, isPlaying, onPlay, onToggleFavorite, onDelete, isAdmin,
}: {
  song: Song;
  index: number;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const embedInfo = song.music_url ? parseMusicUrl(song.music_url) : null;
  const isApple = embedInfo?.type === 'apple';
  const isRegionNote = Boolean(song.note && REGION_NOTES.has(song.note));
  const noteAsSubtitle = song.note && !isRegionNote ? song.note : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.4) }}
    >
      <div
        className={cn(
          'song-row group',
          isPlaying && 'song-row--playing',
        )}
      >
        {/* 序号 / 均衡器 / 播放按钮 */}
        <div className="song-row__num">
          {isPlaying ? (
            <div className="song-row__eq" aria-hidden>
              {[1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  className="song-row__eq-bar"
                  animate={{ scaleY: [0.25, 1, 0.4] }}
                  transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity, repeatType: 'mirror' }}
                />
              ))}
            </div>
          ) : (
            <>
              <span className="song-row__index group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
              <button
                type="button"
                onClick={() => onPlay(song)}
                className="song-row__play-icon hidden group-hover:flex"
                aria-label="播放"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </>
          )}
        </div>

        {/* 封面 */}
        <button
          type="button"
          className="song-row__cover"
          onClick={() => onPlay(song)}
          aria-label={`播放 ${song.title}`}
        >
          {song.cover_image ? (
            <Image
              src={song.cover_image}
              alt={song.title}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <div className="song-row__cover-empty">
              <Disc3 className="h-5 w-5 text-ink-ghost" />
            </div>
          )}
        </button>

        {/* 歌曲信息 */}
        <div className="song-row__info min-w-0">
          <p className={cn('song-row__title', isPlaying && 'song-row__title--playing')}>
            {song.title}
          </p>
          <p className="song-row__artist">
            {song.artist}
            {noteAsSubtitle && <span className="ml-2 italic text-ink-ghost">{noteAsSubtitle}</span>}
          </p>
        </div>

        {/* 地区标签 */}
        {isRegionNote && (
          <span className="song-row__region hidden sm:inline-flex" data-region={song.note}>
            {song.note}
          </span>
        )}

        {/* 时长 */}
        {song.duration && (
          <span className="song-row__duration hidden md:block">{song.duration}</span>
        )}

        {/* 操作按钮 */}
        <div className="song-row__actions">
          {/* 详情展开（仅 Apple Music） */}
          {isApple && (
            <button
              type="button"
              onClick={() => setDetailOpen(v => !v)}
              className={cn(
                'song-row__action opacity-0 group-hover:opacity-100',
                detailOpen && 'opacity-100 text-gold'
              )}
              aria-label="歌曲详情"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailOpen && 'rotate-180')} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleFavorite(song.id, song.is_favorite)}
            className={cn('song-row__action', !song.is_favorite && 'opacity-0 group-hover:opacity-100')}
            aria-label={song.is_favorite ? '取消收藏' : '收藏'}
          >
            <Heart className={cn('h-3.5 w-3.5', song.is_favorite && 'fill-[#fc3c44] text-[#fc3c44]')} />
          </button>

          {song.music_url && (
            <button
              type="button"
              onClick={() => window.open(song.music_url, '_blank', 'noopener,noreferrer')}
              className="song-row__action opacity-0 group-hover:opacity-100"
              aria-label="打开原链接"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(song.id)}
              className="song-row__action song-row__action--danger opacity-0 group-hover:opacity-100"
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Apple Music 详情面板 */}
      {isApple && (
        <AnimatePresence>
          {detailOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="song-row-detail">
                <AppleDetailPanel url={song.music_url!} musicUrl={song.music_url!} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

// ── 添加歌曲弹窗 ──────────────────────────────────────────────────
function AddSongModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (song: Partial<Song>) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmedUrl = url.trim();
  const embedInfo = trimmedUrl ? parseMusicUrl(trimmedUrl) : null;

  useEffect(() => {
    const u = trimmedUrl;
    if (!u || !u.includes('music.apple.com')) return;
    if (title && artist) return;

    const timer = setTimeout(async () => {
      setMetaLoading(true);
      try {
        const meta = await fetchAppleMeta(u);
        if (meta) {
          if (!title) setTitle(meta.title);
          if (!artist) setArtist(meta.artist);
          if (!coverImage && meta.cover) setCoverImage(meta.cover);
        }
      } finally {
        setMetaLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedUrl) return;

    const info = parseMusicUrl(trimmedUrl);
    const platform: Song['platform'] = info?.type === 'apple' ? 'apple'
      : info?.type === 'spotify' ? 'spotify'
      : 'other';

    setLoading(true);
    setError('');
    try {
      await onAdd({
        title: title.trim() || info?.platform || trimmedUrl,
        artist: artist.trim(),
        music_url: trimmedUrl,
        cover_image: coverImage || undefined,
        platform,
        note: note.trim(),
        is_favorite: false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="elevated" className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-(--border-default) px-5 py-4">
            <h2 className="font-medium text-ink">添加歌曲</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-(--surface-overlay)" aria-label="关闭">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">音乐链接</label>
              <div className="relative">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴 Apple Music / Spotify / YouTube / 网易云 链接"
                  autoFocus
                />
                {metaLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-ghost" />
                )}
              </div>
              {embedInfo && (
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  识别为 {embedInfo.platform}
                  {embedInfo.type === 'apple' && ' — 正在自动获取专辑信息…'}
                </p>
              )}
            </div>

            {coverImage && (
              <div className="relative overflow-hidden rounded-xl border border-(--border-default)">
                <div className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="" className="h-full w-full object-cover blur-xl scale-110 opacity-50" aria-hidden />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt={title} className="h-14 w-14 rounded-lg object-cover shadow-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{title || '（未填写标题）'}</p>
                    <p className="truncate text-xs text-white/60">{artist || '（未填写艺术家）'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
                    aria-label="移除封面"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {embedInfo?.embedUrl && embedInfo.type !== 'apple' && (
              <div className="overflow-hidden rounded-xl border border-(--border-default)">
                <iframe
                  src={embedInfo.embedUrl}
                  className="block w-full border-none music-embed-frame"
                  height={embedHeight(embedInfo.type, trimmedUrl)}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen"
                  title="预览"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted">歌曲名（选填）</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="自动识别" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted">艺术家（选填）</label>
                <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="艺术家名" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-ink-muted">备注（选填）</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="为什么喜欢这首歌？" />
            </div>

            {error && <p className="rounded-lg bg-red-500/8 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
              <Button type="submit" loading={loading} disabled={!trimmedUrl}>
                {!loading && <Check className="h-4 w-4" />}
                保存
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ── 主页面 ─────────────────────────────────────────────────────────
type RegionFilter = 'all' | 'favorites' | '欧美' | '日本' | '韩国';

export default function MusicPage() {
  const { isAdmin } = useAdmin();
  const hasPrimedAutoPlayer = useRef(false);
  const previewCache = useRef<Map<string, string>>(new Map());
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<RegionFilter>('all');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      setSongs(await getAllSongs());
    } catch {
      setError('音乐列表暂时加载失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  const playableSongs = songs;

  const filteredSongs = songs.filter((s) => {
    if (filter === 'favorites') return s.is_favorite;
    if (filter === '欧美' || filter === '日本' || filter === '韩国') return s.note === filter;
    return true;
  });

  useEffect(() => {
    const directAudio = songs.filter((s) => Boolean(getPlayableSongUrl(s)));
    if (loading || hasPrimedAutoPlayer.current || directAudio.length === 0) return;
    setCurrentSong(directAudio[0]);
    setShowPlayer(true);
    hasPrimedAutoPlayer.current = true;
  }, [loading, songs]);

  async function handleToggleFavorite(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/music/songs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !current }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, is_favorite: !current } : s)));
    } catch {
      setError('更新收藏状态失败，请稍后再试。');
    }
  }

  async function handleDeleteSong(id: string) {
    if (!confirm('确定删除这首歌吗？')) return;
    try {
      const res = await fetch(`/api/music/songs/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (currentSong?.id === id) { setCurrentSong(null); setShowPlayer(false); }
    } catch {
      setError('删除歌曲失败，请稍后再试。');
    }
  }

  async function handlePlaySong(song: Song) {
    if (getPlayableSongUrl(song)) {
      setCurrentSong(song);
      setShowPlayer(true);
      return;
    }
    if (song.music_url) {
      const cached = previewCache.current.get(song.id);
      if (cached) {
        setCurrentSong({ ...song, audio_url: cached });
        setShowPlayer(true);
        return;
      }
      setPlayerLoading(true);
      const meta = await fetchAppleMeta(song.music_url);
      setPlayerLoading(false);
      if (meta?.previewUrl) {
        previewCache.current.set(song.id, meta.previewUrl);
        setCurrentSong({ ...song, audio_url: meta.previewUrl });
        setShowPlayer(true);
        return;
      }
      window.open(song.music_url, '_blank', 'noopener,noreferrer');
    }
  }

  const filterTabs: { key: RegionFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '欧美', label: '欧美' },
    { key: '日本', label: '日本' },
    { key: '韩国', label: '韩国' },
    { key: 'favorites', label: '收藏' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-32 pt-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute right-[6%] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-orange-100)_0%,transparent_70%)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[4%] h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-smoke-blue-100)_0%,transparent_70%)] opacity-50 blur-3xl" />

      <div className="relative mx-auto max-w-3xl space-y-6">

        {/* 页头 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--color-orange-500) 15%, transparent)', color: 'var(--color-orange-500)' }}
              >
                <Disc3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-mincho text-3xl font-semibold tracking-tight text-ink">歌单</h1>
                <p className="mt-1 text-sm text-ink-muted">
                  最近反复播放的那些歌
                  {!loading && songs.length > 0 && (
                    <span className="ml-2 text-ink-ghost">· {songs.length} 首</span>
                  )}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 rounded-full border border-(--border-default) px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-(--surface-overlay)"
              >
                <Plus className="h-3.5 w-3.5" />添加
              </button>
            )}
          </div>

          {/* 筛选标签 */}
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm transition-all',
                  filter === tab.key
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink-muted hover:bg-(--surface-overlay)'
                )}
              >
                {tab.key === 'favorites' && (
                  <Heart className={cn('inline-block mr-1 h-3 w-3 -mt-0.5', filter === 'favorites' && 'fill-current')} />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 列表 */}
        {error ? (
          <StatePanel
            tone="error"
            title="加载失败"
            description={error}
            action={<Button variant="secondary" onClick={() => void loadData()}>重新加载</Button>}
          />
        ) : loading ? (
          <div className="song-list">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="song-row-skeleton">
                <Skeleton className="h-4 w-6 rounded" />
                <Skeleton className="h-11 w-11 rounded-md shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-3.5 w-1/2 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full hidden sm:block" />
                <Skeleton className="h-3 w-8 rounded hidden md:block" />
              </div>
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <StatePanel
            tone="empty"
            title="没有歌曲"
            description={filter === 'favorites' ? '先把喜欢的歌标成收藏。' : '点击右上角添加一首。'}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="song-list">
            <AnimatePresence>
              {filteredSongs.map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={index}
                  isPlaying={currentSong?.id === song.id && showPlayer}
                  onPlay={handlePlaySong}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteSong}
                  isAdmin={isAdmin}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddSongModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (song) => {
              const res = await fetch('/api/music/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(song),
                credentials: 'include',
              });
              const payload = (await res.json().catch(() => null)) as { song?: Song; error?: string } | null;
              if (!res.ok || !payload?.song) throw new Error(payload?.error || '添加失败');
              setSongs((prev) => [payload.song as Song, ...prev]);
              setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {playerLoading && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-(--surface-panel) border border-line px-4 py-2 text-sm text-ink shadow-lg backdrop-blur-md">
          <Loader2 className="h-4 w-4 animate-spin text-gold" />
          正在加载试听...
        </div>
      )}

      <AnimatePresence>
        {showPlayer && currentSong && (
          <MusicPlayer
            songs={playableSongs}
            currentSong={currentSong}
            onSongChange={(song) => { void handlePlaySong(song); }}
            onClose={() => setShowPlayer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
