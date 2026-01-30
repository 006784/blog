'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, X, Calendar, MapPin, Clock, 
  Edit2, Trash2, Lock, Unlock, ChevronLeft, ChevronRight,
  Sparkles, Save, Eye, Shield, Filter, Grid, List, Search,
  Thermometer, Droplets, Wind, Navigation, Sun, Cloud, CloudRain
} from 'lucide-react';
import { 
  Diary, 
  getDiaries, createDiary, updateDiary, deleteDiary,
  formatDate, formatDateTime, moodIcons, weatherIcons
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { EnvironmentService } from '@/services/environmentService';

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
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autoCaptureEnvironment, setAutoCaptureEnvironment] = useState(true);
  const [capturingEnvironment, setCapturingEnvironment] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState<{
    location: any;
    weather: any;
    error?: string;
  } | null>(null);
  const { isAdmin, showLoginModal } = useAdmin();

  // 直接使用搜索查询，不使用防抖
  const effectiveSearch = searchQuery;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // 当搜索查询改变时重新过滤
    if (effectiveSearch) {
      setMoodFilter(null);
      setPrivacyFilter('all');
    }
  }, [effectiveSearch]);

  async function loadData() {
    try {
      setLoading(true);
      // 使用API端点获取日记
      const response = await fetch('/api/diaries?limit=100');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '加载日记失败');
      }
      
      setDiaries(result.data);
    } catch (error) {
      console.error('加载日记失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 过滤日记
  const filteredDiaries = useMemo(() => {
    return diaries.filter(diary => {
      // 搜索查询过滤
      if (effectiveSearch && 
          !diary.title?.toLowerCase().includes(effectiveSearch.toLowerCase()) && 
          !diary.content.toLowerCase().includes(effectiveSearch.toLowerCase())) {
        return false;
      }
      
      // 心情过滤
      if (moodFilter && diary.mood !== moodFilter) return false;
      
      // 隐私过滤
      if (privacyFilter === 'public' && !diary.is_public) return false;
      if (privacyFilter === 'private' && diary.is_public) return false;
      
      // 日期过滤
      if (dateFilter) {
        const diaryDate = new Date(diary.diary_date);
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        if (diaryDate < startDate || diaryDate > endDate) return false;
      }
      
      return true;
    });
  }, [diaries, effectiveSearch, moodFilter, privacyFilter, dateFilter]);

  // 获取环境信息
  const captureEnvironmentInfo = async () => {
    if (!autoCaptureEnvironment) return;
    
    // 检查浏览器环境
    if (typeof window === 'undefined') {
      console.warn('服务端渲染环境中无法获取环境信息');
      return;
    }
    
    setCapturingEnvironment(true);
    try {
      const envInfo = await EnvironmentService.getEnvironmentInfo();
      setEnvironmentInfo(envInfo);
      
      if (envInfo.error) {
        console.warn('环境信息获取失败:', envInfo.error);
      }
    } catch (error) {
      console.error('获取环境信息时出错:', error);
      setEnvironmentInfo({
        location: null,
        weather: null,
        error: error instanceof Error ? error.message : '获取环境信息失败'
      });
    } finally {
      setCapturingEnvironment(false);
    }
  };

  // 当编辑器打开时自动获取环境信息
  useEffect(() => {
    if (showEditor && autoCaptureEnvironment) {
      captureEnvironmentInfo();
    }
  }, [showEditor, autoCaptureEnvironment]);

  async function handleDelete(id: string) {
    if (!confirm('确定删除这篇日记吗？此操作不可撤销。')) return;
    try {
      // 获取管理员token
      const adminToken = localStorage.getItem('admin-token');
      if (!adminToken) {
        alert('请先登录');
        return;
      }
      
      // 调用API删除日记
      const response = await fetch(`/api/diaries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除日记失败');
      }
      
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

  function handleDateFilterChange(start: string, end: string) {
    if (!start || !end) {
      setDateFilter(null);
      return;
    }
    setDateFilter({ start, end });
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
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

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-card border border-border/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all w-64"
                />
              </div>
              
              {/* Mood Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">心情:</span>
                <button
                  onClick={() => setMoodFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    !moodFilter
                      ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white'
                      : 'bg-card hover:bg-card/80 text-foreground'
                  }`}
                >
                  全部
                </button>
                {moods.slice(0, 6).map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => setMoodFilter(moodFilter === mood.value ? null : mood.value)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      moodFilter === mood.value
                        ? 'ring-2 ring-offset-2'
                        : 'bg-card/50 hover:bg-card'
                    }`}
                    style={moodFilter === mood.value ? { 
                      backgroundColor: `${mood.color}20`,
                      color: mood.color,
                      '--tw-ring-color': mood.color
                    } as React.CSSProperties : {}}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Privacy Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">隐私:</span>
                <div className="flex gap-1">
                  {[
                    { key: 'all', label: '全部', icon: Eye },
                    { key: 'public', label: '公开', icon: Unlock },
                    { key: 'private', label: '私密', icon: Lock },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setPrivacyFilter(key as any)}
                      className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                        privacyFilter === key
                          ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white'
                          : 'bg-card hover:bg-card/80 text-foreground'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-card/80'}`}
                  title="网格视图"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-card/80'}`}
                  title="列表视图"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-4 pt-4 border-t border-border/30">
            <span className="text-sm text-muted-foreground">日期范围:</span>
            <input
              type="date"
              value={dateFilter?.start || ''}
              onChange={(e) => handleDateFilterChange(e.target.value, dateFilter?.end || '')}
              className="px-3 py-1.5 rounded-lg bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <span className="text-muted-foreground">至</span>
            <input
              type="date"
              value={dateFilter?.end || ''}
              onChange={(e) => handleDateFilterChange(dateFilter?.start || '', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter(null)}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm"
              >
                清除
              </button>
            )}
          </div>
        </motion.div>

        {/* Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <button
            onClick={() => {
              if (!isAdmin) {
                showLoginModal();
                return;
              }
              setEditingDiary(null);
              setShowEditor(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            {isAdmin ? <Plus className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            {isAdmin ? '写日记' : '管理员登录'}
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-4 rounded-xl bg-card border border-border/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground">
                共 <span className="font-semibold text-foreground">{filteredDiaries.length}</span> 篇日记
              </span>
              <span className="text-muted-foreground">
                公开 <span className="font-semibold text-foreground">{filteredDiaries.filter(d => d.is_public).length}</span> 篇
              </span>
              <span className="text-muted-foreground">
                私密 <span className="font-semibold text-foreground">{filteredDiaries.filter(d => !d.is_public).length}</span> 篇
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground">
                总字数: <span className="font-semibold text-foreground">{filteredDiaries.reduce((sum, diary) => sum + diary.word_count, 0)}</span>
              </span>
            </div>
          </div>
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
            <p className="text-muted-foreground">没有找到匹配的日记</p>
            {searchQuery || moodFilter || privacyFilter !== 'all' || dateFilter ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMoodFilter(null);
                  setPrivacyFilter('all');
                  setDateFilter(null);
                }}
                className="mt-4 text-primary hover:underline"
              >
                清除筛选条件
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isAdmin) {
                    showLoginModal();
                    return;
                  }
                  setShowEditor(true);
                }}
                className="mt-4 text-primary hover:underline"
              >
                {isAdmin ? '写下今天的心情' : '管理员登录后可写日记'}
              </button>
            )}
          </motion.div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredDiaries.map((diary, index) => (
                  <DiaryCard
                    key={diary.id}
                    diary={diary}
                    index={index}
                    isAdmin={isAdmin}
                    onClick={() => setSelectedDiary(diary)}
                    onEdit={() => handleEdit(diary)}
                    onDelete={() => handleDelete(diary.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredDiaries.map((diary, index) => (
                  <DiaryListItem
                    key={diary.id}
                    diary={diary}
                    index={index}
                    isAdmin={isAdmin}
                    onClick={() => setSelectedDiary(diary)}
                    onEdit={() => handleEdit(diary)}
                    onDelete={() => handleDelete(diary.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}

        {/* Editor Modal */}
        <AnimatePresence>
          {showEditor && (
            <DiaryEditor
              diary={editingDiary}
              onClose={() => { 
                setShowEditor(false); 
                setEditingDiary(null);
                setEnvironmentInfo(null);
              }}
              onSave={async (diaryData) => {
                // 获取管理员token
                const adminToken = localStorage.getItem('admin-token');
                if (!adminToken) {
                  alert('请先登录');
                  return;
                }
                            
                if (editingDiary) {
                  // 更新现有日记
                  const response = await fetch(`/api/diaries/${editingDiary.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(diaryData)
                  });
                              
                  const result = await response.json();
                  if (!result.success) {
                    throw new Error(result.error || '更新日记失败');
                  }
                              
                  setDiaries(diaries.map(d => d.id === editingDiary.id ? result.data : d));
                } else {
                  // 创建新日记
                  const response = await fetch('/api/diaries', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(diaryData)
                  });
                              
                  const result = await response.json();
                  if (!result.success) {
                    throw new Error(result.error || '创建日记失败');
                  }
                              
                  setDiaries([result.data, ...diaries]);
                }
                setShowEditor(false);
                setEditingDiary(null);
                setEnvironmentInfo(null);
              }}
              autoCaptureEnvironment={autoCaptureEnvironment}
              setAutoCaptureEnvironment={setAutoCaptureEnvironment}
              capturingEnvironment={capturingEnvironment}
              environmentInfo={environmentInfo}
              captureEnvironmentInfo={captureEnvironmentInfo}
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
              isAdmin={isAdmin}
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
  isAdmin,
  onClick,
  onEdit,
  onDelete
}: {
  diary: Diary;
  index: number;
  isAdmin: boolean;
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
            <h3 className="font-semibold text-lg line-clamp-1">
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
          
          {/* Actions - 只有管理员可见 */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Diary List Item Component
function DiaryListItem({
  diary,
  index,
  isAdmin,
  onClick,
  onEdit,
  onDelete
}: {
  diary: Diary;
  index: number;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = diary.mood ? moodIcons[diary.mood] : null;
  const weather = diary.weather ? weatherIcons[diary.weather] : null;
  const date = new Date(diary.diary_date);
  const day = date.getDate();
  const month = date.toLocaleDateString('zh-CN', { month: 'short' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {/* Date Badge */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-primary">{day}</span>
        <span className="text-xs text-muted-foreground">{month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-base line-clamp-1 mr-4">
            {diary.title || formatDate(diary.diary_date)}
          </h3>
          <div className="flex items-center gap-2">
            {mood && (
              <span 
                className="text-lg"
                title={mood.label}
              >
                {mood.emoji}
              </span>
            )}
            {weather && (
              <span title={weather.label}>{weather.emoji}</span>
            )}
            {diary.is_public ? (
              <Unlock className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
          {diary.content.substring(0, 100)}...
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(diary.diary_date)}
            </span>
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
          
          {/* Actions - 只有管理员可见 */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
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
  onDelete,
  isAdmin = false
}: {
  diary: Diary;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin?: boolean;
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
        className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {mood && <span className="text-3xl">{mood.emoji}</span>}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">
                  {diary.title || formatDate(diary.diary_date)}
                </h2>
                <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(diary.diary_date)}
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
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{diary.word_count} 字</span>
              <span>•</span>
              <span>{Math.ceil(diary.word_count / 300)} 分钟阅读</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {diary.content.split('\n').map((paragraph, i) => (
              paragraph.trim() ? (
                <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
              ) : (
                <br key={i} />
              )
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            {diary.is_public ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Unlock className="w-4 h-4" />
                公开日记
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                私密日记
              </div>
            )}
          </div>
          
          {isAdmin && (
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
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Diary Editor Component
function DiaryEditor({
  diary,
  onClose,
  onSave,
  autoCaptureEnvironment,
  setAutoCaptureEnvironment,
  capturingEnvironment,
  environmentInfo,
  captureEnvironmentInfo
}: {
  diary: Diary | null;
  onClose: () => void;
  onSave: (data: Partial<Diary>) => Promise<void>;
  autoCaptureEnvironment: boolean;
  setAutoCaptureEnvironment: (value: boolean) => void;
  capturingEnvironment: boolean;
  environmentInfo: any;
  captureEnvironmentInfo: () => Promise<void>;
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
      // 准备日记数据，包含环境信息
      const diaryData = {
        ...formData,
        environment: autoCaptureEnvironment && environmentInfo && !environmentInfo.error 
          ? {
              location: environmentInfo.location,
              weather: environmentInfo.weather
            }
          : null
      };
      
      await onSave(diaryData);
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
        className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Date & Title */}
          <div className="grid gap-6 md:grid-cols-2">
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
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">今天的心情</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: formData.mood === mood.value ? '' : mood.value })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      formData.mood === mood.value
                        ? 'ring-2 ring-offset-2'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    style={formData.mood === mood.value ? {
                      backgroundColor: `${mood.color}20`,
                      color: mood.color,
                      '--tw-ring-color': mood.color
                    } as React.CSSProperties : {}}
                    title={mood.label}
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
                    className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      formData.weather === w.value
                        ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    title={w.label}
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

          {/* Environment Info Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span className="font-medium">自动获取环境信息</span>
              </div>
              <p className="text-sm text-muted-foreground">
                自动记录位置、天气等环境信息到日记中
              </p>
            </div>
            <button
              onClick={() => setAutoCaptureEnvironment(!autoCaptureEnvironment)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoCaptureEnvironment 
                  ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoCaptureEnvironment ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Environment Status */}
          {autoCaptureEnvironment && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <Cloud className="w-4 h-4 text-gray-500" />
                </div>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  环境信息
                </span>
              </div>
              
              {capturingEnvironment ? (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">正在获取位置和天气信息...</span>
                </div>
              ) : environmentInfo ? (
                <div className="space-y-2">
                  {environmentInfo.error ? (
                    <div className="text-amber-600 dark:text-amber-400 text-sm">
                      ⚠️ {environmentInfo.error}
                    </div>
                  ) : (
                    <>
                      {environmentInfo.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 dark:text-green-300">
                            {environmentInfo.location.city || environmentInfo.location.address}
                          </span>
                        </div>
                      )}
                      {environmentInfo.weather && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-4 h-4 text-red-500" />
                            <span>{environmentInfo.weather.temperature}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span>{environmentInfo.weather.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wind className="w-4 h-4 text-gray-500" />
                            <span>{environmentInfo.weather.windSpeed}km/h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sun className="w-4 h-4 text-yellow-500" />
                            <span>{environmentInfo.weather.condition}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={captureEnvironmentInfo}
                    disabled={capturingEnvironment}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    重新获取环境信息
                  </button>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  等待获取环境信息...
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={12}
              placeholder="写下今天的故事...\n\n今天的感受是...\n\n今天发生的事情..."
            />
            <div className="text-right text-sm text-muted-foreground mt-2">
              {formData.content.length} 字
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="privacy-toggle"
                checked={formData.is_public}
                onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="privacy-toggle" className="flex items-center gap-2 cursor-pointer">
                {formData.is_public ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {formData.is_public ? '公开日记' : '私密日记'}
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {formData.is_public ? '所有人可见' : '仅自己可见'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.content.trim()}
            className="btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{diary ? '保存修改' : '保存日记'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
