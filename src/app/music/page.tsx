'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, ChevronDown, Disc3, ExternalLink, Heart,
  Loader2, Music2, Pause, Play, Plus, Trash2, X,
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

// ── Apple Music 元数据 ─────────────────────────────────────────────
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

// Apple Music 展开面板（iTunes 数据 + 试听播放器 + 歌词）
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
          {[1, 2, 3].map(i => <div key={i} className="h-3 rounded bg-white/10 animate-pulse" style={{ width: `${60 + i * 10}%` }} />)}
        </div>
      ) : meta ? (
        <>
          {/* 元数据行 */}
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

          {/* 试听播放器 */}
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
                  <div className="apple-preview-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="apple-preview-label">{playing ? '试听中…' : '30 秒试听'}</span>
              </div>
              <a
                href={musicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="apple-open-btn"
              >
                <ExternalLink className="h-3 w-3" />
                完整收听
              </a>
            </div>
          )}

          {/* 歌词 */}
          {(lyricsLoading || (lyrics && lyrics.length > 0)) && (
            <div className="apple-lyrics-section">
              <button
                type="button"
                className="apple-lyrics-toggle"
                onClick={() => setLyricsOpen(v => !v)}
              >
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
                            <p key={i} className={cn('apple-lyrics-line', !line.trim() && 'apple-lyrics-blank')}>{line || ' '}</p>
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

// ── 歌曲卡片 ──────────────────────────────────────────────────────
function SongCard({
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
  const embedInfo = song.music_url ? parseMusicUrl(song.music_url) : null;
  const hasEmbed = Boolean(embedInfo?.embedUrl);
  const hasAudio = Boolean(getPlayableSongUrl(song));
  const isApple = embedInfo?.type === 'apple';
  const [embedOpen, setEmbedOpen] = useState(false);

  // Apple Music — 专属美化卡片
  if (isApple && song.cover_image) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ delay: index * 0.04 }}
        className={cn(
          'relative overflow-hidden rounded-2xl transition-all duration-300',
          isPlaying && 'ring-2 ring-[#fc3c44]/60 ring-offset-2 ring-offset-(--surface-base)'
        )}
      >
        {/* 模糊背景 */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={song.cover_image}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover blur-2xl scale-110 opacity-60"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/50 to-black/30" />
        </div>

        {/* 内容区 */}
        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {/* 封面 */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-2xl">
              <Image
                src={song.cover_image}
                alt={song.title}
                fill
                sizes="80px"
                className="object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-white"
                        animate={{ height: ['40%', '100%', '60%'] }}
                        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, repeatType: 'mirror' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 文字信息 */}
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate text-base font-semibold text-white leading-tight">{song.title}</p>
              <p className="truncate text-sm text-white/70 mt-0.5">{song.artist}</p>
              {song.note && (
                <p className="mt-1.5 line-clamp-2 text-xs italic text-white/50 leading-relaxed">{song.note}</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {hasAudio && (
                <button
                  type="button"
                  onClick={() => onPlay(song)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
                  aria-label={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleFavorite(song.id, song.is_favorite)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur transition-colors hover:bg-white/20"
                aria-label={song.is_favorite ? '取消收藏' : '收藏'}
              >
                <Heart className={cn('h-3.5 w-3.5', song.is_favorite && 'fill-[#fc3c44] text-[#fc3c44]')} />
              </button>
              {song.music_url && (
                <button
                  type="button"
                  onClick={() => window.open(song.music_url, '_blank', 'noopener,noreferrer')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur transition-colors hover:bg-white/20"
                  aria-label="在 Apple Music 打开"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(song.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-300 backdrop-blur transition-colors hover:bg-red-500/30"
                  aria-label="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Apple Music 嵌入展开 */}
          {hasEmbed && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setEmbedOpen(!embedOpen)}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                <Music2 className="h-3 w-3" />
                <span>歌曲详情 · 试听</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', embedOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {embedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-2"
                  >
                    <AppleDetailPanel url={song.music_url!} musicUrl={song.music_url!} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 通用卡片（Spotify、YouTube、网易云等）
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        variant="default"
        className={cn(
          'overflow-hidden p-0 transition-all',
          isPlaying && 'ring-2 ring-gold ring-offset-2 ring-offset-(--surface-base)'
        )}
      >
        {/* Embed player */}
        {hasEmbed && (
          <iframe
            src={embedInfo!.embedUrl}
            className="block w-full border-none music-embed-frame"
            height={embedHeight(embedInfo!.type, song.music_url ?? '')}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title={song.title}
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          />
        )}

        {/* Audio-only card */}
        {!hasEmbed && (
          <div className="flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-(--surface-overlay)">
              {song.cover_image ? (
                <Image src={song.cover_image} alt={song.title} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Disc3 className={cn('h-9 w-9 text-ink-ghost', isPlaying && 'animate-spin')} style={{ animationDuration: '3s' }} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{song.title}</p>
              <p className="truncate text-sm text-ink-muted">{song.artist}</p>
              {song.note && (
                <p className="mt-1 line-clamp-2 text-xs italic text-ink-ghost">{song.note}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1 border-t border-(--border-default) px-3 py-2">
          {hasAudio && (
            <button
              type="button"
              onClick={() => onPlay(song)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: isPlaying ? 'var(--color-teal-500)' : 'var(--surface-overlay)', color: isPlaying ? '#fff' : 'var(--ink)' }}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
          )}
          {hasEmbed && song.note ? (
            <p className="flex-1 truncate px-1 text-xs italic text-ink-muted">{song.note}</p>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite(song.id, song.is_favorite)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-(--surface-overlay)"
            aria-label={song.is_favorite ? '取消收藏' : '收藏'}
          >
            <Heart className={cn('h-4 w-4', song.is_favorite ? 'fill-orange-500 text-orange-500' : 'text-ink-ghost')} />
          </button>
          {song.music_url && (
            <button
              type="button"
              onClick={() => window.open(song.music_url, '_blank', 'noopener,noreferrer')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-ghost transition-colors hover:bg-(--surface-overlay)"
              aria-label="打开原链接"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(song.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-500/10"
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Card>
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

  // 当输入 Apple Music 链接时自动抓取元数据
  useEffect(() => {
    const u = trimmedUrl;
    if (!u || !u.includes('music.apple.com')) return;
    if (title && artist) return; // 已手动填写

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
            {/* URL */}
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
                  ✓ 识别为 {embedInfo.platform}
                  {embedInfo.type === 'apple' && ' — 正在自动获取专辑信息…'}
                </p>
              )}
            </div>

            {/* 封面预览 */}
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

            {/* Live iframe preview (non-Apple) */}
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

            {/* Title / Artist */}
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

            {/* Note */}
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
export default function MusicPage() {
  const { isAdmin } = useAdmin();
  const hasPrimedAutoPlayer = useRef(false);
  const previewCache = useRef<Map<string, string>>(new Map());
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
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

  // 所有歌曲都进播放列表（Apple Music 歌曲运行时异步获取 preview URL）
  const playableSongs = songs;
  const filteredSongs = songs.filter((s) => (filter === 'favorites' ? s.is_favorite : true));

  useEffect(() => {
    // 只有上传的直接音频才自动启动
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
    // 有直接音频 URL，直接播放
    if (getPlayableSongUrl(song)) {
      setCurrentSong(song);
      setShowPlayer(true);
      return;
    }

    // Apple Music：获取 30s preview URL（有缓存直接用）
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
      // 无 preview 则跳转
      window.open(song.music_url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="min-h-screen px-4 pb-32 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* 页头 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">歌单</h1>
              <p className="mt-1 text-sm text-ink-muted">最近反复播放的那些歌</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'rounded-full px-3 py-1 text-sm transition-colors',
                  filter === 'all' ? 'bg-gold text-white' : 'text-ink-muted hover:bg-(--surface-overlay)'
                )}
              >全部</button>
              <button
                type="button"
                onClick={() => setFilter('favorites')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
                  filter === 'favorites' ? 'bg-gold text-white' : 'text-ink-muted hover:bg-(--surface-overlay)'
                )}
              >
                <Heart className="h-3 w-3" />收藏
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 rounded-full border border-(--border-default) px-3 py-1 text-sm text-ink-muted transition-colors hover:bg-(--surface-overlay)"
                >
                  <Plus className="h-3.5 w-3.5" />添加
                </button>
              )}
            </div>
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有歌曲"
            description={filter === 'favorites' ? '先把喜欢的歌标成收藏。' : '点击右上角添加一首。'}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredSongs.map((song, index) => (
                <SongCard
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

      {/* 切歌加载指示 */}
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
