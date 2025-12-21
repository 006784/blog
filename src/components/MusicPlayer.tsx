'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, ListMusic, X, ChevronDown, ChevronUp,
  Music2, Disc3
} from 'lucide-react';
import { Song, updateSong } from '@/lib/supabase';

interface MusicPlayerProps {
  songs: Song[];
  currentSong: Song | null;
  onSongChange: (song: Song) => void;
  onClose: () => void;
}

// 解析LRC歌词
interface LyricLine {
  time: number; // 秒
  text: string;
}

function parseLyrics(lrc: string): LyricLine[] {
  if (!lrc) return [];
  
  const lines = lrc.split('\n');
  const lyrics: LyricLine[] = [];
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = minutes * 60 + seconds + ms / (match[3].length === 2 ? 100 : 1000);
      const text = match[4].trim();
      if (text) {
        lyrics.push({ time, text });
      }
    }
  }
  
  return lyrics.sort((a, b) => a.time - b.time);
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayer({ songs, currentSong, onSongChange, onClose }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 解析歌词
  useEffect(() => {
    if (currentSong?.lyrics) {
      const parsed = parseLyrics(currentSong.lyrics);
      setLyrics(parsed);
    } else {
      setLyrics([]);
    }
  }, [currentSong?.lyrics]);

  // 更新当前歌词行
  useEffect(() => {
    if (lyrics.length === 0) {
      setCurrentLyricIndex(-1);
      return;
    }
    
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    setCurrentLyricIndex(index);
  }, [currentTime, lyrics]);

  // 歌词自动滚动
  useEffect(() => {
    if (currentLyricIndex >= 0 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const lyricElements = container.querySelectorAll('.lyric-line');
      const currentElement = lyricElements[currentLyricIndex] as HTMLElement;
      
      if (currentElement) {
        const containerHeight = container.clientHeight;
        const elementTop = currentElement.offsetTop;
        const scrollTarget = elementTop - containerHeight / 2 + currentElement.clientHeight / 2;
        
        container.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    }
  }, [currentLyricIndex]);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // 时间更新
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isRepeat]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 切换歌曲时自动播放
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong?.audio_url) {
      audio.src = currentSong.audio_url;
      audio.play().catch(() => {});
      setIsPlaying(true);
      // 更新播放次数
      updateSong(currentSong.id, { play_count: (currentSong.play_count || 0) + 1 });
    }
  }, [currentSong?.id]);

  // 进度条拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  // 下一首
  const playNext = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    let nextIndex;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    
    onSongChange(songs[nextIndex]);
  };

  // 上一首
  const playPrev = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    onSongChange(songs[prevIndex]);
  };

  if (!currentSong) return null;

  const audioSrc = currentSong.audio_url || currentSong.music_url || '';

  // 最小化模式
  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl">
          {/* 封面 */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden">
            {currentSong.cover_image ? (
              <img src={currentSong.cover_image} alt={currentSong.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                <Music2 className="w-6 h-6 text-primary" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Disc3 className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </div>
          
          {/* 信息 */}
          <div className="max-w-[120px]">
            <p className="font-medium text-sm truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center gap-1">
            <button onClick={togglePlay} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button onClick={() => setIsMinimized(false)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>
        <audio ref={audioRef} src={audioSrc} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* 背景模糊 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/98 to-background"
        style={{
          backgroundImage: currentSong.cover_image 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95)), url(${currentSong.cover_image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px) saturate(1.5)',
        }}
      />
      
      {/* 内容 */}
      <div className="relative flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <span className="text-sm text-muted-foreground">正在播放</span>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
          {/* 封面 + 歌词切换 */}
          <div className="flex-shrink-0 w-full md:w-1/2 flex flex-col items-center">
            {/* 专辑封面 */}
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl shadow-primary/20"
            >
              {currentSong.cover_image ? (
                <img 
                  src={currentSong.cover_image} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                  <Music2 className="w-24 h-24 text-white/80" />
                </div>
              )}
              {/* 唱片中心 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-black/80 border-4 border-white/10" />
              </div>
            </motion.div>

            {/* 歌曲信息 */}
            <div className="text-center mt-8">
              <h2 className="text-2xl font-bold">{currentSong.title}</h2>
              <p className="text-muted-foreground mt-1">{currentSong.artist}</p>
              {currentSong.album && (
                <p className="text-sm text-muted-foreground/60 mt-1">{currentSong.album}</p>
              )}
            </div>
          </div>

          {/* 歌词区域 */}
          {showLyrics && (
            <div className="flex-1 w-full md:w-1/2 h-64 md:h-full overflow-hidden">
              <div 
                ref={lyricsContainerRef}
                className="h-full overflow-y-auto scrollbar-hide py-20"
                style={{ scrollBehavior: 'smooth' }}
              >
                {lyrics.length > 0 ? (
                  <div className="space-y-4 text-center px-4">
                    {lyrics.map((line, index) => (
                      <p
                        key={index}
                        className={`lyric-line transition-all duration-300 ${
                          index === currentLyricIndex
                            ? 'text-xl font-bold text-primary scale-105'
                            : index < currentLyricIndex
                            ? 'text-muted-foreground/40 text-sm'
                            : 'text-muted-foreground/60 text-sm'
                        }`}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>暂无歌词</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 控制区 */}
        <div className="mt-auto pt-6">
          {/* 进度条 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-1 group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 rounded-full bg-white/20" />
              <div 
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4">
            {/* 随机播放 */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-full transition-colors ${
                isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* 上一首 */}
            <button onClick={playPrev} className="p-3 rounded-full hover:bg-white/10 transition-colors">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              className="p-4 rounded-full bg-white text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            {/* 下一首 */}
            <button onClick={playNext} className="p-3 rounded-full hover:bg-white/10 transition-colors">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* 循环 */}
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-full transition-colors ${
                isRepeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between mt-6">
            {/* 音量控制 */}
            <div className="flex items-center gap-2 w-32">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* 歌词开关 */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                showLyrics ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              歌词
            </button>

            {/* 播放列表 */}
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-2 rounded-full transition-colors ${
                showPlaylist ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 播放列表面板 */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-l border-border"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">播放列表 ({songs.length})</h3>
              <button onClick={() => setShowPlaylist(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {songs.map((song, index) => (
                <button
                  key={song.id}
                  onClick={() => onSongChange(song)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                    song.id === currentSong.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="w-6 text-center text-sm text-muted-foreground">
                    {song.id === currentSong.id && isPlaying ? (
                      <Disc3 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm truncate ${song.id === currentSong.id ? 'text-primary font-medium' : ''}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  {song.is_favorite && <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={audioSrc} />
    </motion.div>
  );
}

export default MusicPlayer;
