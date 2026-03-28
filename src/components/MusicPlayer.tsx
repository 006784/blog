'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Disc3,
  ExternalLink,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getPlayableSongUrl } from '@/lib/music';
import { type Song, updateSong } from '@/lib/supabase';

interface MusicPlayerProps {
  songs: Song[];
  currentSong: Song | null;
  onSongChange: (song: Song) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayer({
  songs,
  currentSong,
  onSongChange,
  onClose,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.86);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playError, setPlayError] = useState('');

  const audioSrc = currentSong ? getPlayableSongUrl(currentSong) ?? '' : '';
  const currentSongId = currentSong?.id ?? '';
  const currentSongPlayCount = currentSong?.play_count || 0;
  const remainingTime = Math.max((duration || 0) - currentTime, 0);
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const playAudio = useCallback(
    (mode: 'auto' | 'manual') => {
      const audio = audioRef.current;

      if (!audio || !audioSrc) {
        return;
      }

      setAutoplayBlocked(false);
      setPlayError('');
      const maybePromise = audio.play();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        void maybePromise.catch(() => {
          setIsPlaying(false);
          if (mode === 'auto') {
            setAutoplayBlocked(true);
            setPlayError('浏览器拦截了自动播放，点一下播放键就能继续。');
          } else {
            setPlayError('这首歌暂时无法播放，请检查音频链接是否仍然有效。');
          }
        });
      }
    },
    [audioSrc]
  );

  const playNext = useCallback(() => {
    if (songs.length === 0) {
      return;
    }

    const currentIndex = songs.findIndex((song) => song.id === currentSong?.id);
    const nextIndex = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : currentIndex < 0
        ? 0
        : (currentIndex + 1) % songs.length;

    onSongChange(songs[nextIndex]);
  }, [currentSong?.id, isShuffle, onSongChange, songs]);

  const playPrev = useCallback(() => {
    if (songs.length === 0) {
      return;
    }

    const currentIndex = songs.findIndex((song) => song.id === currentSong?.id);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    onSongChange(songs[prevIndex]);
  }, [currentSong?.id, onSongChange, songs]);

  const handleClose = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || !audioSrc) {
      setPlayError('当前歌曲还没有可播放的音频地址。');
      return;
    }

    if (isPlaying) {
      audio.pause();
      return;
    }

    setAutoplayBlocked(false);
    playAudio('manual');
  }, [audioSrc, isPlaying, playAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        playAudio('manual');
        return;
      }

      playNext();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setAutoplayBlocked(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setPlayError('音频资源加载失败，请稍后再试。');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat, playAudio, playNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongId || !audioSrc) {
      return;
    }

    audio.currentTime = 0;
    audio.src = audioSrc;
    audio.load();
    queueMicrotask(() => {
      setAutoplayBlocked(false);
      setPlayError('');
      const maybePromise = audio.play();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        void maybePromise.catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
          setPlayError('浏览器拦截了自动播放，点一下播放键就能继续。');
        });
      }
    });
    void updateSong(currentSongId, {
      play_count: currentSongPlayCount + 1,
    }).catch(() => undefined);
  }, [audioSrc, currentSongId, currentSongPlayCount]);

  if (!currentSong) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showPlaylist ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-[min(15rem,30vh)] left-1/2 z-40 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-[28px] border border-white/45 bg-[rgba(255,250,245,0.84)] shadow-[0_20px_60px_rgba(117,74,33,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(23,20,18,0.88)]">
              <div className="flex items-center justify-between border-b border-[color:var(--border-default)] px-5 py-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-primary-700)]">
                    Playlist
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--color-neutral-900)] dark:text-white">
                    当前队列
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlaylist(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[var(--color-neutral-700)] transition-colors hover:bg-white dark:bg-white/10 dark:text-white"
                  aria-label="关闭播放列表"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto px-3 py-3">
                {songs.map((song, index) => {
                  const isActive = song.id === currentSong.id;
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => {
                        onSongChange(song);
                        setShowPlaylist(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-overlay)] text-[var(--color-neutral-500)]">
                        {isActive && isPlaying ? (
                          <Disc3 className="h-5 w-5 animate-spin text-[var(--color-primary-700)]" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-[var(--color-neutral-900)] dark:text-white">
                          {song.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-[var(--color-neutral-500)] dark:text-white/65">
                          {song.artist}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-xs font-medium text-[var(--color-primary-800)]">
                          播放中
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-4 left-1/2 z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2"
      >
        <div className="relative overflow-hidden rounded-[32px] border border-white/55 bg-[rgba(255,249,244,0.92)] shadow-[0_24px_80px_rgba(112,72,31,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(22,19,17,0.9)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage: currentSong.cover_image
                ? `linear-gradient(135deg, rgba(255, 239, 228, 0.88), rgba(255, 248, 240, 0.7)), url(${currentSong.cover_image})`
                : 'linear-gradient(135deg, rgba(255, 233, 221, 0.96), rgba(230, 242, 255, 0.72))',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(32px) saturate(1.15)',
              transform: 'scale(1.2)',
            }}
          />

          <div className="relative space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-white/50 bg-[var(--surface-overlay)] shadow-[0_12px_28px_rgba(70,43,20,0.14)] sm:h-20 sm:w-20">
                {currentSong.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentSong.cover_image}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,210,186,0.8),rgba(181,228,255,0.7))]">
                    <Music2 className="h-8 w-8 text-[var(--color-primary-800)]" />
                  </div>
                )}

                {isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Disc3 className="h-7 w-7 animate-spin text-white" style={{ animationDuration: '3s' }} />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-primary-800)] shadow-[0_8px_18px_rgba(125,80,41,0.08)] dark:bg-white/10 dark:text-[var(--color-primary-100)]">
                    Now Playing
                  </span>
                  {autoplayBlocked ? (
                    <span className="rounded-full bg-[rgba(255,210,186,0.86)] px-3 py-1 text-[11px] font-medium text-[var(--color-primary-900)]">
                      自动播放被拦截
                    </span>
                  ) : (
                    <span className="rounded-full bg-[rgba(210,244,223,0.9)] px-3 py-1 text-[11px] font-medium text-[rgb(31,107,71)]">
                      页面打开自动尝试播放
                    </span>
                  )}
                </div>

                <h2 className="mt-3 line-clamp-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-neutral-900)] dark:text-white sm:text-[2rem]">
                  {currentSong.title}
                </h2>
                <p className="mt-1 line-clamp-1 text-lg text-[var(--color-neutral-500)] dark:text-white/68">
                  {currentSong.artist}
                  {currentSong.album ? ` · ${currentSong.album}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentSong.music_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(currentSong.music_url, '_blank', 'noopener,noreferrer')
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--color-neutral-700)] transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white"
                    aria-label="打开歌曲来源链接"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowPlaylist((current) => !current)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--color-neutral-700)] transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white"
                  aria-label="切换播放列表"
                >
                  <ListMusic className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--color-neutral-700)] transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white"
                  aria-label="关闭播放器"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {playError ? (
              <div className="rounded-[22px] border border-[rgba(227,137,82,0.24)] bg-[rgba(255,243,234,0.9)] px-4 py-3 text-sm text-[rgb(149,75,27)] dark:border-[rgba(255,214,184,0.12)] dark:bg-[rgba(61,39,25,0.9)] dark:text-[rgb(255,221,196)]">
                {playError}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(event) => {
                    const nextTime = Number(event.target.value);
                    if (audioRef.current) {
                      audioRef.current.currentTime = nextTime;
                    }
                    setCurrentTime(nextTime);
                  }}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label="调整播放进度"
                />
                <div className="h-2 rounded-full bg-black/8 dark:bg-white/10" />
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,164,117,0.98),rgba(255,208,143,0.98))]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-[var(--color-neutral-500)] dark:text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(remainingTime)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShuffle((current) => !current)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                    isShuffle
                      ? 'bg-[rgba(255,214,182,0.92)] text-[var(--color-primary-900)]'
                      : 'bg-white/65 text-[var(--color-neutral-700)] hover:bg-white dark:bg-white/10 dark:text-white'
                  }`}
                  aria-label="随机播放"
                >
                  <Shuffle className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={playPrev}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.72)] text-[var(--color-neutral-800)] shadow-[0_10px_22px_rgba(105,66,33,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white"
                  aria-label="上一首"
                >
                  <SkipBack className="h-6 w-6 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(255,177,132,0.98),rgba(255,211,149,0.98))] text-[rgb(58,33,18)] shadow-[0_16px_30px_rgba(147,92,44,0.28)] transition-all hover:-translate-y-0.5 hover:scale-[1.02]"
                  aria-label={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="ml-1 h-8 w-8 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={playNext}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.72)] text-[var(--color-neutral-800)] shadow-[0_10px_22px_rgba(105,66,33,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white"
                  aria-label="下一首"
                >
                  <SkipForward className="h-6 w-6 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRepeat((current) => !current)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                    isRepeat
                      ? 'bg-[rgba(255,214,182,0.92)] text-[var(--color-primary-900)]'
                      : 'bg-white/65 text-[var(--color-neutral-700)] hover:bg-white dark:bg-white/10 dark:text-white'
                  }`}
                  aria-label="循环播放"
                >
                  <Repeat className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-full bg-white/65 px-3 py-2 text-[var(--color-neutral-700)] shadow-[0_10px_22px_rgba(105,66,33,0.08)] dark:bg-white/10 dark:text-white">
                <button
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/80 dark:hover:bg-white/10"
                  aria-label={isMuted ? '取消静音' : '静音'}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(event) => {
                    setVolume(Number(event.target.value));
                    setIsMuted(false);
                  }}
                  className="h-1.5 w-24 cursor-pointer accent-[rgb(225,146,94)]"
                  aria-label="调整音量"
                />
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} preload="metadata" />
      </motion.div>
    </>
  );
}

export default MusicPlayer;
