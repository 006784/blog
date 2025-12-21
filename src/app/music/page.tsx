'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Heart, Play, Plus, X, Disc3, ListMusic, 
  Sparkles, ExternalLink, Trash2, Upload, FileAudio, Image as ImageIcon,
  FileText, Check, Loader2, Pause
} from 'lucide-react';
import { 
  Song, Playlist, 
  getAllSongs, getFavoriteSongs, getPlaylists,
  createSong, updateSong, deleteSong, toggleSongFavorite,
  createPlaylist, platformIcons
} from '@/lib/supabase';
import MusicPlayer from '@/components/MusicPlayer';

const moods = [
  { value: 'chill', label: '放松', emoji: '😎' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'sad', label: '伤感', emoji: '😢' },
  { value: 'energetic', label: '活力', emoji: '⚡' },
  { value: 'romantic', label: '浪漫', emoji: '💕' },
  { value: 'focus', label: '专注', emoji: '🎯' },
];

export default function MusicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [songsData, playlistsData] = await Promise.all([
        getAllSongs(),
        getPlaylists()
      ]);
      setSongs(songsData);
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 只显示有audio_url的歌曲可以播放
  const playableSongs = songs.filter(s => s.audio_url);
  
  const filteredSongs = songs.filter(song => {
    if (filter === 'favorites' && !song.is_favorite) return false;
    if (moodFilter && song.mood !== moodFilter) return false;
    return true;
  });

  async function handleToggleFavorite(id: string, current: boolean) {
    try {
      await toggleSongFavorite(id, !current);
      setSongs(songs.map(s => s.id === id ? { ...s, is_favorite: !current } : s));
    } catch (error) {
      console.error('操作失败:', error);
    }
  }

  async function handleDeleteSong(id: string) {
    if (!confirm('确定删除这首歌吗？')) return;
    try {
      await deleteSong(id);
      setSongs(songs.filter(s => s.id !== id));
      if (currentSong?.id === id) {
        setCurrentSong(null);
        setShowPlayer(false);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  function handlePlaySong(song: Song) {
    if (song.audio_url) {
      setCurrentSong(song);
      setShowPlayer(true);
    } else if (song.music_url) {
      window.open(song.music_url, '_blank');
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-purple-500/25">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              我的歌单
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            分享我喜欢的音乐，每一首歌都有一个故事 🎵
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white shadow-lg'
                : 'bg-card hover:bg-card/80 text-foreground'
            }`}
          >
            <ListMusic className="w-4 h-4 inline mr-2" />
            全部
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'favorites'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : 'bg-card hover:bg-card/80 text-foreground'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            最爱
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          {moods.map(mood => (
            <button
              key={mood.value}
              onClick={() => setMoodFilter(moodFilter === mood.value ? null : mood.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                moodFilter === mood.value
                  ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                  : 'bg-card/50 hover:bg-card text-muted-foreground'
              }`}
            >
              {mood.emoji} {mood.label}
            </button>
          ))}
        </motion.div>

        {/* Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            上传歌曲
          </button>
        </motion.div>

        {/* Songs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Disc3 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : filteredSongs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === 'favorites' ? '还没有收藏的歌曲' : '还没有添加歌曲'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary hover:underline"
            >
              上传第一首歌曲
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <AddSongModal
              onClose={() => setShowAddModal(false)}
              onAdd={async (song) => {
                const newSong = await createSong(song);
                setSongs([newSong, ...songs]);
                setShowAddModal(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Music Player */}
        <AnimatePresence>
          {showPlayer && currentSong && (
            <MusicPlayer
              songs={playableSongs}
              currentSong={currentSong}
              onSongChange={setCurrentSong}
              onClose={() => setShowPlayer(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Song Card Component
function SongCard({ 
  song, 
  index,
  isPlaying,
  onPlay,
  onToggleFavorite, 
  onDelete 
}: { 
  song: Song; 
  index: number;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const platform = platformIcons[song.platform] || platformIcons.other;
  const mood = song.mood ? moods.find(m => m.value === song.mood) : null;
  const hasAudio = !!song.audio_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl bg-card border transition-all hover:shadow-xl hover:shadow-primary/5 ${
        isPlaying ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/30'
      }`}
    >
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden">
        {song.cover_image ? (
          <img
            src={song.cover_image}
            alt={song.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlaying ? 'scale-105' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Disc3 className={`w-20 h-20 text-primary/30 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          </div>
        )}
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity ${
          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`} />
        
        {/* Play Button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPlay(song)}
            className={`p-4 rounded-full backdrop-blur-sm border border-white/30 ${
              hasAudio ? 'bg-white/20' : 'bg-black/30'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : hasAudio ? (
              <Play className="w-8 h-8 text-white fill-white" />
            ) : (
              <ExternalLink className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/90 text-white text-xs">
            <Disc3 className="w-3 h-3 animate-spin" />
            正在播放
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(song.id, song.is_favorite);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              song.is_favorite ? 'text-pink-500 fill-pink-500' : 'text-white'
            }`} 
          />
        </button>

        {/* Mood Badge */}
        {mood && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs">
            {mood.emoji} {mood.label}
          </div>
        )}

        {/* Local badge */}
        {hasAudio && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-green-500/80 text-white text-xs flex items-center gap-1">
            <FileAudio className="w-3 h-3" />
            本地
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{song.title}</h3>
        <p className="text-muted-foreground text-sm truncate">{song.artist}</p>
        {song.album && (
          <p className="text-muted-foreground/60 text-xs truncate mt-1">{song.album}</p>
        )}
        
        {/* Note */}
        {song.note && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 italic">
            "{song.note}"
          </p>
        )}

        {/* Lyrics indicator */}
        {song.lyrics && (
          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
            <FileText className="w-3 h-3" />
            <span>有歌词</span>
          </div>
        )}

        {/* Platform & Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
          >
            {song.platform === 'local' ? '本地上传' : platform.name}
          </span>
          
          <div className="flex items-center gap-1">
            {song.music_url && (
              <a
                href={song.music_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(song.id);
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Add Song Modal
function AddSongModal({ 
  onClose, 
  onAdd 
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
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);

  // 上传文件
  async function uploadFile(file: File, type: 'audio' | 'cover') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const res = await fetch('/api/music/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '上传失败');
    }
    
    return await res.json();
  }

  // 处理音频上传
  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAudio(true);
    try {
      const result = await uploadFile(file, 'audio');
      setFormData(prev => ({ 
        ...prev, 
        audio_url: result.url,
        platform: 'local',
        // 尝试从文件名解析歌曲信息
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').split(' - ')[1] || file.name.replace(/\.[^/.]+$/, ''),
        artist: prev.artist || file.name.replace(/\.[^/.]+$/, '').split(' - ')[0] || '',
      }));
    } catch (error: any) {
      alert(error.message || '音频上传失败');
    } finally {
      setUploadingAudio(false);
    }
  }

  // 处理封面上传
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingCover(true);
    try {
      const result = await uploadFile(file, 'cover');
      setFormData(prev => ({ ...prev, cover_image: result.url }));
    } catch (error: any) {
      alert(error.message || '封面上传失败');
    } finally {
      setUploadingCover(false);
    }
  }

  // 处理歌词文件上传
  async function handleLyricsUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData(prev => ({ ...prev, lyrics: content }));
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.artist) return;
    
    setLoading(true);
    try {
      await onAdd(formData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              上传歌曲
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 音频上传区域 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">音频文件 *</label>
            <div
              onClick={() => audioInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                formData.audio_url 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {uploadingAudio ? (
                <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
              ) : formData.audio_url ? (
                <div className="flex items-center justify-center gap-3">
                  <FileAudio className="w-10 h-10 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium text-green-600">音频已上传</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {formData.audio_url.split('/').pop()}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    点击上传音频文件 (MP3, M4A, WAV, FLAC)
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    支持从 Apple Music 下载的歌曲
                  </p>
                </>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </div>
          </div>

          {/* 封面上传 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium">封面图片</label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all aspect-square flex items-center justify-center ${
                  formData.cover_image 
                    ? 'border-transparent p-0 overflow-hidden' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {uploadingCover ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : formData.cover_image ? (
                  <img 
                    src={formData.cover_image} 
                    alt="封面" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div>
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">上传封面</p>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>
            </div>

            {/* 歌词上传 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">歌词文件 (LRC格式)</label>
              <div
                onClick={() => lyricsInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all aspect-square flex items-center justify-center ${
                  formData.lyrics 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {formData.lyrics ? (
                  <div>
                    <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-green-600">歌词已导入</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.lyrics.split('\n').length} 行
                    </p>
                  </div>
                ) : (
                  <div>
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">上传 .lrc 歌词</p>
                  </div>
                )}
                <input
                  ref={lyricsInputRef}
                  type="file"
                  accept=".lrc,.txt"
                  className="hidden"
                  onChange={handleLyricsUpload}
                />
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">歌曲名称 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="输入歌曲名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">歌手 *</label>
              <input
                type="text"
                value={formData.artist}
                onChange={e => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="输入歌手名称"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">专辑</label>
            <input
              type="text"
              value={formData.album}
              onChange={e => setFormData({ ...formData, album: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="输入专辑名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">心情标签</label>
            <div className="flex flex-wrap gap-2">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: formData.mood === mood.value ? '' : mood.value })}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.mood === mood.value
                      ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">推荐理由</label>
            <textarea
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={2}
              placeholder="为什么喜欢这首歌？"
            />
          </div>

          {/* 手动输入歌词 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              歌词内容 (LRC格式)
              <span className="text-muted-foreground text-xs ml-2">可选</span>
            </label>
            <textarea
              value={formData.lyrics}
              onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-mono text-sm"
              rows={4}
              placeholder="[00:00.00]歌词第一行&#10;[00:05.00]歌词第二行&#10;..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_favorite}
              onChange={e => setFormData({ ...formData, is_favorite: e.target.checked })}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">添加到最爱 ❤️</span>
          </label>
        </form>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.artist || (!formData.audio_url && !formData.music_url)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            上传歌曲
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
