'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Disc3,
  ExternalLink,
  FileAudio,
  FileText,
  Globe2,
  Heart,
  Image as ImageIcon,
  ListMusic,
  Loader2,
  Music,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  type Playlist,
  type Song,
  getAllSongs,
  getPlaylists,
  platformIcons,
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import type { AudiusSearchTrack } from '@/lib/audius';
import { getPlayableSongUrl } from '@/lib/music';

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer'), {
  ssr: false,
  loading: () => (
    <div
      className="h-24 rounded-[var(--radius-2xl)] bg-[var(--surface-overlay)] animate-pulse"
      aria-label="播放器加载中"
    />
  ),
});

const moods = [
  { value: 'chill', label: '放松', emoji: '😎' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'sad', label: '伤感', emoji: '😢' },
  { value: 'energetic', label: '活力', emoji: '⚡' },
  { value: 'romantic', label: '浪漫', emoji: '💕' },
  { value: 'focus', label: '专注', emoji: '🎯' },
];

function formatSongDuration(seconds?: number): string | undefined {
  if (!seconds || !Number.isFinite(seconds)) {
    return undefined;
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getSongPlatformMeta(song: Pick<Song, 'platform' | 'platform_id' | 'music_url'>) {
  const isAudius =
    typeof song.platform_id === 'string' && song.platform_id.startsWith('audius:') ||
    typeof song.music_url === 'string' && song.music_url.includes('audius.co');

  if (isAudius) {
    return { name: 'Audius', color: '#cc0fe0' };
  }

  return platformIcons[song.platform] || platformIcons.other;
}

function mapAudiusTrackToSong(track: AudiusSearchTrack): Partial<Song> {
  return {
    title: track.title,
    artist: track.artist,
    cover_image: track.artwork,
    audio_url: track.streamUrl,
    music_url: track.permalink,
    duration_seconds: track.durationSeconds,
    duration: formatSongDuration(track.durationSeconds),
    platform: 'other',
    platform_id: `audius:${track.id}`,
    note: track.description?.trim() || `从 Audius 导入 · ${track.genre || '在线音乐'}`,
    mood: track.mood || '',
    is_favorite: false,
  };
}

export default function MusicPage() {
  const { isAdmin } = useAdmin();
  const hasPrimedAutoPlayer = useRef(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [songsData, playlistsData] = await Promise.all([
        getAllSongs(),
        getPlaylists(),
      ]);
      setSongs(songsData);
      setPlaylists(playlistsData);
    } catch {
      setError('音乐列表暂时加载失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  const playableSongs = songs.filter((song) => Boolean(getPlayableSongUrl(song)));

  const filteredSongs = songs.filter((song) => {
    if (filter === 'favorites' && !song.is_favorite) return false;
    if (moodFilter && song.mood !== moodFilter) return false;
    return true;
  });

  const favoriteCount = songs.filter((song) => song.is_favorite).length;
  const directPlayCount = playableSongs.length;
  const moodCount = new Set(songs.map((song) => song.mood).filter(Boolean)).size;

  useEffect(() => {
    if (loading || hasPrimedAutoPlayer.current || playableSongs.length === 0) {
      return;
    }

    setCurrentSong(playableSongs[0]);
    setShowPlayer(true);
    hasPrimedAutoPlayer.current = true;
  }, [loading, playableSongs]);

  async function handleToggleFavorite(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/music/songs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !current }),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('收藏状态更新失败');
      }
      setSongs((prev) =>
        prev.map((song) =>
          song.id === id ? { ...song, is_favorite: !current } : song
        )
      );
    } catch {
      setError('更新收藏状态失败，请稍后再试。');
    }
  }

  async function handleDeleteSong(id: string) {
    if (!confirm('确定删除这首歌吗？')) return;
    try {
      const res = await fetch(`/api/music/songs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('删除失败');
      }
      setSongs((prev) => prev.filter((song) => song.id !== id));
      if (currentSong?.id === id) {
        setCurrentSong(null);
        setShowPlayer(false);
      }
    } catch {
      setError('删除歌曲失败，请稍后再试。');
    }
  }

  function handlePlaySong(song: Song) {
    if (getPlayableSongUrl(song)) {
      setCurrentSong(song);
      setShowPlayer(true);
      return;
    }
    if (song.music_url) {
      window.open(song.music_url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[6%] top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-primary-200)_0%,transparent_72%)] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-[10%] h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--surface-overlay)_0%,transparent_72%)] opacity-75 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <Card variant="glass" padding="lg" className="overflow-hidden">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge variant="soft" className="gap-1.5 px-3 py-1.5">
                <Music className="h-3.5 w-3.5" />
                音乐空间
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                用旋律存档情绪
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--color-neutral-900)] sm:text-5xl">
                  我的歌单
                </h1>
                <p className="mt-3 max-w-2xl text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                  这里收着我最近反复播放的音乐。可以是陪我写代码的背景声，也可以是一首突然把回忆拽回来的歌。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('all')}
                >
                  <ListMusic className="h-4 w-4" />
                  全部歌曲
                </Button>
                <Button
                  variant={filter === 'favorites' ? 'primary' : 'secondary'}
                  onClick={() => setFilter('favorites')}
                >
                  <Heart className="h-4 w-4" />
                  最爱收藏
                </Button>
                {isAdmin ? (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4" />
                    添加歌曲
                  </Button>
                ) : null}
              </div>

              {playlists.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {playlists.slice(0, 6).map((playlist) => (
                    <Badge key={playlist.id} variant="soft" className="px-3 py-1.5">
                      {playlist.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard label="歌曲总数" value={songs.length} hint="持续更新中" />
            <StatsCard label="直接可播" value={directPlayCount} hint="本地上传或在线直链" />
            <StatsCard label="收藏歌曲" value={favoriteCount} hint="一键进入最爱筛选" />
            <StatsCard label="情绪标签" value={moodCount} hint="按氛围快速检索" />
          </div>
        </motion.section>

        <Card variant="default" padding="lg" className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium tracking-[0.16em] text-[var(--color-primary-700)]">
                Mood Filters
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
                按情绪筛歌
              </h2>
              <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                当前结果 {filteredSongs.length} 首，可以先按收藏筛一轮，再用心情标签缩小范围。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() =>
                    setMoodFilter((current) =>
                      current === mood.value ? null : mood.value
                    )
                  }
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)]',
                    moodFilter === mood.value
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-900)]'
                      : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-700)] hover:border-[var(--color-primary-300)] hover:bg-[var(--surface-overlay)]'
                  )}
                >
                  <span>{mood.emoji}</span>
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <StatePanel
              tone="error"
              title="音乐列表加载失败"
              description={error}
              action={
                <Button variant="secondary" onClick={() => void loadData()}>
                  重新加载
                </Button>
              }
            />
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SongSkeleton key={index} />
              ))}
            </div>
          ) : filteredSongs.length === 0 ? (
            <StatePanel
              tone="empty"
              title={filter === 'favorites' ? '还没有收藏的歌曲' : '还没有匹配的歌曲'}
              description={
                filter === 'favorites'
                  ? '先把喜欢的歌标成最爱，这里就会慢慢变成自己的固定歌单。'
                  : '可以切换筛选条件，或者上传一首最近常听的歌。'
              }
              action={
                isAdmin ? (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4" />
                    添加第一首歌曲
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            >
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
        </Card>

        <AnimatePresence>
          {showAddModal ? (
            <AddSongModal
              onClose={() => setShowAddModal(false)}
              onAdd={async (song) => {
                const res = await fetch('/api/music/songs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(song),
                  credentials: 'include',
                });

                const payload = (await res.json().catch(() => null)) as
                  | { song?: Song; error?: string }
                  | null;

                if (!res.ok || !payload?.song) {
                  throw new Error(payload?.error || '上传歌曲失败');
                }

                setSongs((prev) => [payload.song as Song, ...prev]);
                setShowAddModal(false);
              }}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showPlayer && currentSong ? (
            <MusicPlayer
              songs={playableSongs}
              currentSong={currentSong}
              onSongChange={setCurrentSong}
              onClose={() => setShowPlayer(false)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card
      variant="elevated"
      padding="md"
      className="rounded-[var(--radius-2xl)] bg-[linear-gradient(180deg,var(--surface-base),var(--surface-panel))]"
    >
      <p className="text-sm text-[var(--color-neutral-500)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-neutral-900)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{hint}</p>
    </Card>
  );
}

function SongSkeleton() {
  return (
    <Card variant="default" className="overflow-hidden p-0">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

function SongCard({
  song,
  index,
  isPlaying,
  onPlay,
  onToggleFavorite,
  onDelete,
  isAdmin,
}: {
  song: Song;
  index: number;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}) {
  const platform = getSongPlatformMeta(song);
  const mood = song.mood ? moods.find((item) => item.value === song.mood) : null;
  const hasAudio = Boolean(getPlayableSongUrl(song));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        variant={isPlaying ? 'elevated' : 'default'}
        className={cn(
          'group overflow-hidden p-0 transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-xl)]',
          isPlaying && 'ring-2 ring-[var(--color-primary-500)] ring-offset-2 ring-offset-[var(--surface-base)]'
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {song.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.cover_image}
              alt={song.title}
              className={cn(
                'h-full w-full object-cover transition-transform duration-500',
                isPlaying ? 'scale-105' : 'group-hover:scale-105'
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--surface-overlay),var(--surface-base))]">
              <Disc3
                className={cn(
                  'h-20 w-20 text-[var(--color-primary-600)]/40',
                  isPlaying && 'animate-spin'
                )}
                style={{ animationDuration: '3s' }}
              />
            </div>
          )}

          <div
            className={cn(
              'absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,15,0.05)_0%,rgba(20,18,15,0.72)_100%)] transition-opacity duration-300',
              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          />

          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <button
              type="button"
              onClick={() => onPlay(song)}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition-transform hover:scale-105"
              aria-label={hasAudio ? `播放 ${song.title}` : `打开 ${song.title}`}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : hasAudio ? (
                <Play className="h-8 w-8 fill-white" />
              ) : (
                <ExternalLink className="h-7 w-7" />
              )}
            </button>
          </div>

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {mood ? (
              <Badge className="border-none bg-black/45 px-3 py-1.5 text-white backdrop-blur-md">
                {mood.emoji} {mood.label}
              </Badge>
            ) : null}
            {hasAudio ? (
              <Badge className="border-none bg-[rgba(232,217,180,0.92)] px-3 py-1.5 text-[var(--color-primary-900)]">
                <FileAudio className="mr-1 h-3.5 w-3.5" />
                支持播放
              </Badge>
            ) : null}
          </div>

          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(song.id, song.is_favorite);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
              aria-label={song.is_favorite ? '取消收藏' : '加入收藏'}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  song.is_favorite && 'fill-[var(--color-primary-500)] text-[var(--color-primary-500)]'
                )}
              />
            </button>
          </div>

          {isPlaying ? (
            <div className="absolute bottom-3 left-3">
              <Badge className="border-none bg-[var(--color-primary-600)] px-3 py-1.5 text-[var(--color-primary-foreground)]">
                <Disc3 className="mr-1 h-3.5 w-3.5 animate-spin" />
                正在播放
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <h3 className="line-clamp-1 text-xl font-semibold text-[var(--color-neutral-900)]">
              {song.title}
            </h3>
            <p className="line-clamp-1 text-sm text-[var(--color-neutral-600)]">
              {song.artist}
            </p>
            {song.album ? (
              <p className="line-clamp-1 text-xs text-[var(--color-neutral-500)]">
                {song.album}
              </p>
            ) : null}
          </div>

          {song.note ? (
            <p className="line-clamp-3 min-h-[4.25rem] text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
              “{song.note}”
            </p>
          ) : (
            <p className="min-h-[4.25rem] text-sm text-[var(--color-neutral-500)]">
              这首歌暂时还没写下备注。
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="soft"
              className="px-3 py-1.5"
              style={{
                backgroundColor: `${platform.color}18`,
                color: platform.color,
              }}
            >
              {song.platform === 'local' ? '本地上传' : platform.name}
            </Badge>
            {song.lyrics ? (
              <Badge variant="outline" className="px-3 py-1.5">
                <FileText className="mr-1 h-3.5 w-3.5" />
                附带歌词
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-[color:var(--border-default)] pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlay(song)}
              className="text-[var(--color-neutral-700)]"
            >
              {hasAudio ? (
                <>
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {isPlaying ? '暂停中' : '立即播放'}
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  打开链接
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              {song.music_url ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 px-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    window.open(song.music_url, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label="打开外部音乐链接"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ) : null}
              {isAdmin ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 px-0 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(song.id);
                  }}
                  aria-label="删除歌曲"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AddSongModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (song: Partial<Song>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    cover_image: '',
    audio_url: '',
    lyrics: '',
    music_url: '',
    platform: 'local' as Song['platform'],
    mood: '',
    note: '',
    is_favorite: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [audioInputMode, setAudioInputMode] = useState<'upload' | 'url' | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingAudius, setSearchingAudius] = useState(false);
  const [audiusTracks, setAudiusTracks] = useState<AudiusSearchTrack[]>([]);
  const [audiusError, setAudiusError] = useState('');
  const [importingTrackId, setImportingTrackId] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: 'audio' | 'cover') {
    const payload = new FormData();
    payload.append('file', file);
    payload.append('type', type);

    const res = await fetch('/api/music/upload', {
      method: 'POST',
      body: payload,
    });

    if (!res.ok) {
      const error = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(error?.error || '上传失败');
    }

    return (await res.json()) as { url: string };
  }

  async function handleAudioUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    setSubmitError('');
    try {
      const result = await uploadFile(file, 'audio');
      setFormData((prev) => ({
        ...prev,
        audio_url: result.url,
        platform: 'local',
        title:
          prev.title ||
          file.name.replace(/\.[^/.]+$/, '').split(' - ')[1] ||
          file.name.replace(/\.[^/.]+$/, ''),
        artist:
          prev.artist ||
          file.name.replace(/\.[^/.]+$/, '').split(' - ')[0] ||
          '',
      }));
      setAudioInputMode('upload');
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : '音频上传失败');
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setSubmitError('');
    try {
      const result = await uploadFile(file, 'cover');
      setFormData((prev) => ({ ...prev, cover_image: result.url }));
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : '封面上传失败');
    } finally {
      setUploadingCover(false);
    }
  }

  function handleLyricsUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = String(loadEvent.target?.result || '');
      setFormData((prev) => ({ ...prev, lyrics: content }));
    };
    reader.readAsText(file);
  }

  async function searchAudius() {
    const query = searchQuery.trim();
    if (!query) {
      setAudiusTracks([]);
      setAudiusError('请输入歌名或歌手再搜索。');
      return;
    }

    setSearchingAudius(true);
    setAudiusError('');

    try {
      const res = await fetch(`/api/music/audius/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      const payload = (await res.json().catch(() => null)) as
        | { tracks?: AudiusSearchTrack[]; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error || 'Audius 搜索失败');
      }

      setAudiusTracks(Array.isArray(payload?.tracks) ? payload.tracks : []);
      if (!payload?.tracks?.length) {
        setAudiusError('这次没有找到可直接播放的结果，换个关键词试试。');
      }
    } catch (error: unknown) {
      setAudiusTracks([]);
      setAudiusError(error instanceof Error ? error.message : 'Audius 搜索失败');
    } finally {
      setSearchingAudius(false);
    }
  }

  async function importAudiusTrack(track: AudiusSearchTrack) {
    setSubmitError('');
    setAudiusError('');
    setImportingTrackId(track.id);

    try {
      await onAdd(mapAudiusTrackToSong(track));
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : '导入 Audius 歌曲失败');
    } finally {
      setImportingTrackId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formData.title || !formData.artist) return;
    if (!getPlayableSongUrl(formData)) {
      setSubmitError('请上传音频，或填写一个可直接播放的在线音频地址。');
      return;
    }

    setLoading(true);
    setSubmitError('');
    try {
      await onAdd(formData);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : '上传歌曲失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Card variant="elevated" className="overflow-hidden p-0">
          <div className="border-b border-[color:var(--border-default)] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="soft" className="px-3 py-1.5">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    添加歌曲
                  </Badge>
                </div>
                <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">
                  做一个可直接播放的音乐卡片
                </h2>
                <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
                  支持上传本地音频，也支持直接填写在线音频地址，保存后会直接进入站内播放器。
                </p>
              </div>

              <Button
                variant="ghost"
                className="h-10 w-10 px-0"
                onClick={onClose}
                aria-label="关闭上传弹窗"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <div className="rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[linear-gradient(135deg,rgba(244,228,255,0.6),rgba(255,244,234,0.82))] p-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="border-none bg-[rgba(204,15,224,0.12)] px-3 py-1.5 text-[#8b0ca1]">
                        <Globe2 className="mr-1 h-3.5 w-3.5" />
                        Audius 搜索导入
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-neutral-900)]">
                      直接搜索免费线上的歌
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
                      搜到后可以一键导入到你的歌单，并直接走站内播放器播放。
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="输入歌名、歌手或关键词"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void searchAudius();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => void searchAudius()}
                      disabled={searchingAudius || !searchQuery.trim()}
                    >
                      {searchingAudius ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      搜索
                    </Button>
                  </div>

                  {audiusError ? (
                    <div className="rounded-[var(--radius-xl)] border border-[rgba(204,15,224,0.12)] bg-white/70 px-4 py-3 text-sm text-[var(--color-neutral-700)]">
                      {audiusError}
                    </div>
                  ) : null}

                  {audiusTracks.length > 0 ? (
                    <div className="grid gap-3">
                      {audiusTracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-white/60 bg-white/80 p-3 shadow-[0_12px_28px_rgba(129,78,30,0.08)] sm:flex-row sm:items-center"
                        >
                          <div className="relative h-16 w-16 overflow-hidden rounded-[20px] bg-[var(--surface-overlay)]">
                            {track.artwork ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={track.artwork}
                                alt={track.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(233,213,255,0.9),rgba(251,226,255,0.7))]">
                                <Music className="h-7 w-7 text-[#8b0ca1]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-base font-semibold text-[var(--color-neutral-900)]">
                              {track.title}
                            </p>
                            <p className="line-clamp-1 text-sm text-[var(--color-neutral-600)]">
                              {track.artist}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-500)]">
                              {track.genre ? <span>{track.genre}</span> : null}
                              {track.durationSeconds ? <span>{formatSongDuration(track.durationSeconds)}</span> : null}
                              <span>Audius</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => window.open(track.permalink, '_blank', 'noopener,noreferrer')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              查看
                            </Button>
                            <Button
                              type="button"
                              onClick={() => void importAudiusTrack(track)}
                              loading={importingTrackId === track.id}
                              disabled={importingTrackId !== null}
                            >
                              <Plus className="h-4 w-4" />
                              导入
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <UploadDropzone
                  title="音频文件 *"
                  description="点击上传音频文件（MP3、M4A、WAV、FLAC）"
                  helper="支持从本地音乐库整理进站点。"
                  active={Boolean(formData.audio_url)}
                  uploading={uploadingAudio}
                  onClick={() => audioInputRef.current?.click()}
                  icon={<Upload className="h-10 w-10 text-[var(--color-neutral-500)]" />}
                  activeContent={
                    audioInputMode === 'url' ? (
                      <div className="flex items-center justify-center gap-3">
                        <ExternalLink className="h-10 w-10 text-[var(--color-primary-700)]" />
                        <div className="text-left">
                          <p className="font-medium text-[var(--color-primary-800)]">
                            在线音频已连接
                          </p>
                          <p className="max-w-xs truncate text-xs text-[var(--color-neutral-500)]">
                            {formData.audio_url}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <FileAudio className="h-10 w-10 text-[var(--color-primary-700)]" />
                        <div className="text-left">
                          <p className="font-medium text-[var(--color-primary-800)]">
                            音频已上传
                          </p>
                          <p className="max-w-xs truncate text-xs text-[var(--color-neutral-500)]">
                            {formData.audio_url.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    )
                  }
                >
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAudioUpload}
                  />
                </UploadDropzone>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <UploadDropzone
                    title="封面图片"
                    description="上传封面后，列表卡片会直接显示。"
                    active={Boolean(formData.cover_image)}
                    uploading={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    icon={<ImageIcon className="h-8 w-8 text-[var(--color-neutral-500)]" />}
                    className="aspect-square"
                    activeContent={
                      formData.cover_image ? (
                        <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-xl)]">
                          <Image
                            src={formData.cover_image}
                            alt="歌曲封面预览"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : null
                    }
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </UploadDropzone>

                  <UploadDropzone
                    title="歌词文件"
                    description="支持 .lrc 或 .txt，后面会用于歌词展示。"
                    active={Boolean(formData.lyrics)}
                    onClick={() => lyricsInputRef.current?.click()}
                    icon={<FileText className="h-8 w-8 text-[var(--color-neutral-500)]" />}
                    className="aspect-square"
                    activeContent={
                      formData.lyrics ? (
                        <div className="text-center">
                          <FileText className="mx-auto mb-2 h-8 w-8 text-[var(--color-primary-700)]" />
                          <p className="text-sm font-medium text-[var(--color-primary-800)]">
                            歌词已导入
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                            {formData.lyrics.split('\n').length} 行内容
                          </p>
                        </div>
                      ) : null
                    }
                  >
                    <input
                      ref={lyricsInputRef}
                      type="file"
                      accept=".lrc,.txt"
                      className="hidden"
                      onChange={handleLyricsUpload}
                    />
                  </UploadDropzone>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="歌曲名称 *">
                  <Input
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="输入歌曲名称"
                    required
                  />
                </Field>
                <Field label="歌手 *">
                  <Input
                    value={formData.artist}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, artist: event.target.value }))
                    }
                    placeholder="输入歌手名称"
                    required
                  />
                </Field>
              </div>

              <Field label="专辑">
                <Input
                  value={formData.album}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, album: event.target.value }))
                  }
                  placeholder="输入专辑名称"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="在线音频地址"
                  description="可填写 MP3、M4A、AAC、OGG、WAV、FLAC 或 M3U8 直链。"
                >
                  <Input
                    type="url"
                    value={formData.audio_url}
                    placeholder="https://example.com/stream/song.mp3"
                    onChange={(event) => {
                      const value = event.target.value;
                      setAudioInputMode(value ? 'url' : null);
                      setFormData((prev) => ({
                        ...prev,
                        audio_url: value,
                        platform:
                          prev.platform === 'local' && value
                            ? 'other'
                            : prev.platform,
                      }));
                    }}
                  />
                </Field>

                <Field
                  label="歌曲来源链接"
                  description="可选，播放器右上角会保留一个跳转按钮。"
                >
                  <Input
                    type="url"
                    value={formData.music_url}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, music_url: event.target.value }))
                    }
                    placeholder="https://music.example.com/song/123"
                  />
                </Field>
              </div>

              <Field label="心情标签">
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          mood: prev.mood === mood.value ? '' : mood.value,
                        }))
                      }
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)]',
                        formData.mood === mood.value
                          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-900)]'
                          : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-700)] hover:border-[var(--color-primary-300)] hover:bg-[var(--surface-overlay)]'
                      )}
                    >
                      <span>{mood.emoji}</span>
                      {mood.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="推荐理由">
                <Textarea
                  value={formData.note}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, note: event.target.value }))
                  }
                  rows={3}
                  placeholder="为什么喜欢这首歌？"
                />
              </Field>

              <Field label="歌词内容 (LRC 格式)" description="可手动补充或修改上传的歌词。">
                <Textarea
                  value={formData.lyrics}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, lyrics: event.target.value }))
                  }
                  rows={6}
                  className="font-mono"
                  placeholder="[00:00.00]歌词第一行&#10;[00:05.00]歌词第二行&#10;..."
                />
              </Field>

              <label className="inline-flex items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.is_favorite}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_favorite: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[color:var(--border-default)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
                />
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">
                  直接加入我的最爱
                </span>
              </label>

              {submitError ? (
                <div className="rounded-[var(--radius-xl)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {submitError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[color:var(--border-default)] pt-5">
              <Button type="button" variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={
                  !formData.title ||
                  !formData.artist ||
                  !getPlayableSongUrl(formData)
                }
              >
                {!loading ? <Check className="h-4 w-4" /> : null}
                添加歌曲
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function UploadDropzone({
  title,
  description,
  helper,
  active,
  uploading = false,
  onClick,
  icon,
  activeContent,
  className,
  children,
}: {
  title: string;
  description: string;
  helper?: string;
  active: boolean;
  uploading?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeContent?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--color-neutral-800)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] border border-dashed px-4 py-5 text-center transition-all duration-[var(--duration-fast)]',
          active
            ? 'border-[var(--color-primary-300)] bg-[linear-gradient(180deg,var(--color-primary-50),var(--surface-base))]'
            : 'border-[color:var(--border-default)] bg-[var(--surface-base)] hover:border-[var(--color-primary-300)] hover:bg-[var(--surface-raised)]',
          className
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-600)]" />
        ) : active && activeContent ? (
          activeContent
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-overlay)]">
              {icon}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-neutral-700)]">{description}</p>
              {helper ? (
                <p className="text-xs text-[var(--color-neutral-500)]">{helper}</p>
              ) : null}
            </div>
          </div>
        )}
      </button>
      {children}
    </div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--color-neutral-800)]">
        {label}
      </label>
      {description ? (
        <p className="-mt-1 text-xs text-[var(--color-neutral-500)]">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
