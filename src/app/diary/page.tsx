'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, X, Calendar, MapPin, Clock, 
  Edit2, Trash2, Lock, Unlock, ChevronLeft, ChevronRight,
  Sparkles, Save, Eye
} from 'lucide-react';
import { 
  Diary, 
  getDiaries, createDiary, updateDiary, deleteDiary,
  formatDate, moodIcons, weatherIcons
} from '@/lib/supabase';

const moods = Object.entries(moodIcons).map(([value, info]) => ({
  value,
  ...info
}));

const weathers = Object.entries(weatherIcons).map(([value, info]) => ({
  value,
  ...info
}));

export default function DiaryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getDiaries(false); // 获取所有日记包括私密的
      setDiaries(data);
    } catch (error) {
      console.error('加载日记失败:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDiaries = diaries.filter(diary => {
    if (moodFilter && diary.mood !== moodFilter) return false;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm('确定删除这篇日记吗？')) return;
    try {
      await deleteDiary(id);
      setDiaries(diaries.filter(d => d.id !== id));
      if (selectedDiary?.id === id) setSelectedDiary(null);
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  function handleEdit(diary: Diary) {
    setEditingDiary(diary);
    setShowEditor(true);
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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              日记本
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            记录每一天的心情，让时光留下痕迹 ✨
          </p>
        </motion.div>

        {/* Mood Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          <button
            onClick={() => setMoodFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !moodFilter
                ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white shadow-lg'
                : 'bg-card hover:bg-card/80 text-foreground'
            }`}
          >
            全部心情
          </button>
          {moods.slice(0, 6).map(mood => (
            <button
              key={mood.value}
              onClick={() => setMoodFilter(moodFilter === mood.value ? null : mood.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                moodFilter === mood.value
                  ? 'ring-2 ring-offset-2'
                  : 'bg-card/50 hover:bg-card'
              }`}
              style={moodFilter === mood.value ? { 
                backgroundColor: `${mood.color}20`,
                color: mood.color,
                ringColor: mood.color
              } : {}}
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
            onClick={() => { setEditingDiary(null); setShowEditor(true); }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            写日记
          </button>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <BookOpen className="w-12 h-12 text-primary animate-pulse" />
          </div>
        ) : filteredDiaries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">还没有写过日记</p>
            <button
              onClick={() => setShowEditor(true)}
              className="mt-4 text-primary hover:underline"
            >
              写下今天的心情
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredDiaries.map((diary, index) => (
                <DiaryCard
                  key={diary.id}
                  diary={diary}
                  index={index}
                  onClick={() => setSelectedDiary(diary)}
                  onEdit={() => handleEdit(diary)}
                  onDelete={() => handleDelete(diary.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Editor Modal */}
        <AnimatePresence>
          {showEditor && (
            <DiaryEditor
              diary={editingDiary}
              onClose={() => { setShowEditor(false); setEditingDiary(null); }}
              onSave={async (diaryData) => {
                if (editingDiary) {
                  const updated = await updateDiary(editingDiary.id, diaryData);
                  setDiaries(diaries.map(d => d.id === editingDiary.id ? updated : d));
                } else {
                  const newDiary = await createDiary(diaryData);
                  setDiaries([newDiary, ...diaries]);
                }
                setShowEditor(false);
                setEditingDiary(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Diary Detail Modal */}
        <AnimatePresence>
          {selectedDiary && (
            <DiaryDetail
              diary={selectedDiary}
              onClose={() => setSelectedDiary(null)}
              onEdit={() => { handleEdit(selectedDiary); setSelectedDiary(null); }}
              onDelete={() => { handleDelete(selectedDiary.id); setSelectedDiary(null); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Diary Card Component
function DiaryCard({
  diary,
  index,
  onClick,
  onEdit,
  onDelete
}: {
  diary: Diary;
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = diary.mood ? moodIcons[diary.mood] : null;
  const weather = diary.weather ? weatherIcons[diary.weather] : null;
  const date = new Date(diary.diary_date);
  const day = date.getDate();
  const month = date.toLocaleDateString('zh-CN', { month: 'short' });
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      {/* Date Badge */}
      <div className="absolute top-4 left-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">{day}</span>
          <span className="text-xs text-muted-foreground">{month}</span>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="absolute top-4 right-4">
        {diary.is_public ? (
          <Unlock className="w-4 h-4 text-green-500" />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="pt-20 p-5">
        {/* Title & Mood */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">
              {diary.title || formatDate(diary.diary_date)}
            </h3>
            <span className="text-sm text-muted-foreground">{weekday}</span>
          </div>
          <div className="flex items-center gap-2">
            {mood && (
              <span 
                className="text-2xl"
                title={mood.label}
              >
                {mood.emoji}
              </span>
            )}
            {weather && (
              <span title={weather.label}>{weather.emoji}</span>
            )}
          </div>
        </div>

        {/* Preview */}
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {diary.content.substring(0, 150)}...
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {diary.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {diary.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {diary.word_count} 字
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
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

// Diary Detail Modal
function DiaryDetail({
  diary,
  onClose,
  onEdit,
  onDelete
}: {
  diary: Diary;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = diary.mood ? moodIcons[diary.mood] : null;
  const weather = diary.weather ? weatherIcons[diary.weather] : null;

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
        className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mood && <span className="text-3xl">{mood.emoji}</span>}
            <div>
              <h2 className="text-xl font-bold">
                {diary.title || formatDate(diary.diary_date)}
              </h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(diary.diary_date)}
                </span>
                {weather && <span>{weather.emoji} {weather.label}</span>}
                {diary.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {diary.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {diary.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {diary.word_count} 字
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Diary Editor Component
function DiaryEditor({
  diary,
  onClose,
  onSave
}: {
  diary: Diary | null;
  onClose: () => void;
  onSave: (data: Partial<Diary>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: diary?.title || '',
    content: diary?.content || '',
    mood: diary?.mood || '',
    weather: diary?.weather || '',
    location: diary?.location || '',
    is_public: diary?.is_public || false,
    diary_date: diary?.diary_date || new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!formData.content.trim()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
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
        className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {diary ? '编辑日记' : '写日记'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Date & Title */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">日期</label>
              <input
                type="date"
                value={formData.diary_date}
                onChange={e => setFormData({ ...formData, diary_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标题（可选）</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="给这篇日记起个标题"
              />
            </div>
          </div>

          {/* Mood & Weather */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">今天的心情</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: formData.mood === mood.value ? '' : mood.value })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all ${
                      formData.mood === mood.value
                        ? 'ring-2 ring-offset-2'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    style={formData.mood === mood.value ? {
                      backgroundColor: `${mood.color}20`,
                      color: mood.color,
                      ringColor: mood.color
                    } : {}}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">天气</label>
              <div className="flex flex-wrap gap-2">
                {weathers.map(w => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, weather: formData.weather === w.value ? '' : w.value })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all ${
                      formData.weather === w.value
                        ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {w.emoji} {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">地点</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="你在哪里写的这篇日记"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={10}
              placeholder="写下今天的故事..."
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {formData.content.length} 字
            </div>
          </div>

          {/* Privacy */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm flex items-center gap-2">
              {formData.is_public ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {formData.is_public ? '公开日记' : '私密日记'}
            </span>
          </label>
        </div>

        {/* Footer */}
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
            disabled={loading || !formData.content.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {diary ? '保存修改' : '保存日记'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
