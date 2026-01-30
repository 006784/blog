'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, X, Calendar, MapPin, Clock, 
  Edit2, Trash2, Lock, Unlock, ChevronLeft, ChevronRight,
  Sparkles, Save, Eye, Shield, Filter, Grid, List, Search,
  Thermometer, Droplets, Wind, Navigation, Sun, Cloud, CloudRain,
  PenLine, NotebookPen, StickyNote, Archive, Bookmark,
  ChevronDown
} from 'lucide-react';
import { 
  Diary, 
  getDiaries, createDiary, updateDiary, deleteDiary,
  formatDate, formatDateTime, moodIcons, weatherIcons
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { EnvironmentService } from '@/services/environmentService';

// 笔记本背景组件
const NotebookBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
    {/* 纸张纹理 */}
    <div className="absolute inset-0 opacity-20" 
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23f5f5dc'/%3E%3Cpath d='M0 0h100v1h-100zM0 2h100v1h-100zM0 4h100v1h-100z' fill='%23e8e8d0'/%3E%3C/svg%3E")`
         }}>
    </div>
    
    {/* 网格线 */}
    <div className="absolute inset-0 opacity-10 pointer-events-none"
         style={{
           backgroundImage: `linear-gradient(to right, #d4d4d4 1px, transparent 1px),
                            linear-gradient(to bottom, #d4d4d4 1px, transparent 1px)` ,
           backgroundSize: '24px 24px',
           transform: 'translate(12px, 12px)'
         }}>
    </div>
    
    {/* 装订线 */}
    <div className="absolute left-8 top-0 bottom-0 w-1 h-full bg-red-400/30 shadow-lg"></div>
    <div className="absolute left-7 top-0 bottom-0 w-0.5 h-full bg-red-600/50"></div>
    
    {/* 孔洞装饰 */}
    <div className="absolute left-6 top-16 w-2 h-2 rounded-full bg-red-300/50 shadow-inner"></div>
    <div className="absolute left-6 top-32 w-2 h-2 rounded-full bg-red-300/50 shadow-inner"></div>
    <div className="absolute left-6 top-48 w-2 h-2 rounded-full bg-red-300/50 shadow-inner"></div>
    
    {children}
  </div>
);

// 笔记本封面组件
const NotebookCover = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => (
  <motion.div 
    className="relative w-full max-w-4xl mx-auto mb-8 cursor-pointer"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onToggle}
  >
    <div className="relative h-64 rounded-xl overflow-hidden shadow-2xl">
      {/* 封面背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900"></div>
      
      {/* 封面纹理 */}
      <div className="absolute inset-0 opacity-30" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}>
      </div>
      
      {/* 封面文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-100 p-8">
        <motion.div 
          animate={{ rotate: isOpen ? -5 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <BookOpen className="w-16 h-16 mb-4 text-amber-200" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">我的日记本</h1>
        <p className="text-lg text-amber-200/80 text-center max-w-md">
          记录生活的点点滴滴 ✨
        </p>
        <div className="mt-6 flex items-center gap-2 text-amber-200/70">
          <span>点击{isOpen ? '合上' : '打开'}笔记本</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>
      
      {/* 封面边角磨损效果 */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-amber-900/50 rounded-br-full"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-900/50 rounded-tl-full"></div>
    </div>
  </motion.div>
);

// 笔记本内页组件
const NotebookPage = ({ children, pageNumber }: { children: React.ReactNode; pageNumber?: number }) => (
  <motion.div 
    className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl mb-8 overflow-hidden"
    initial={{ opacity: 0, y: 50, rotateY: -10 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ duration: 0.6 }}
  >
    {/* 页面阴影 */}
    <div className="absolute inset-0 shadow-inner"></div>
    
    {/* 页码 */}
    {pageNumber && (
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-mono">
        第 {pageNumber} 页
      </div>
    )}
    
    {/* 页面内容 */}
    <div className="p-8 md:p-12 relative z-10 text-gray-800 dark:text-gray-200">
      {children}
    </div>
    
    {/* 页面折痕 */}
    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-gray-200/30 to-transparent"></div>
  </motion.div>
);

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
  const [notebookOpen, setNotebookOpen] = useState(false);
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
    <NotebookBackground>
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 笔记本封面 */}
          <NotebookCover 
            isOpen={notebookOpen} 
            onToggle={() => setNotebookOpen(!notebookOpen)} 
          />
          
          <AnimatePresence>
            {notebookOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
              >
                <NotebookPage pageNumber={1}>
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25">
                        <PenLine className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
                        我的日记收藏
                      </h2>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      翻开记忆的每一页，重温那些美好的时光 ✨
                    </p>
                  </div>
                  
                  {/* 简化的日记列表 */}
                  <div className="mb-8">
                    {loading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400">正在加载日记...</p>
                        </div>
                      </div>
                    ) : filteredDiaries.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                      >
                        <NotebookPen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">还没有日记呢</p>
                        <button
                          onClick={() => {
                            if (!isAdmin) {
                              showLoginModal();
                              return;
                            }
                            setShowEditor(true);
                          }}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          {isAdmin ? '写下第一篇日记' : '管理员登录后可写日记'}
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
                              isAdmin={isAdmin}
                              onClick={() => setSelectedDiary(diary)}
                              onEdit={() => handleEdit(diary)}
                              onDelete={() => handleDelete(diary.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  
                  {/* 写日记按钮 */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        if (!isAdmin) {
                          showLoginModal();
                          return;
                        }
                        setEditingDiary(null);
                        setShowEditor(true);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
                    >
                      {isAdmin ? <Plus className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      {isAdmin ? '写新日记' : '管理员登录'}
                    </button>
                  </div>
                </NotebookPage>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 编辑器和详情模态框保持原有逻辑 */}
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
    </NotebookBackground>
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
      className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 hover:border-amber-400/50 transition-all hover:shadow-xl cursor-pointer backdrop-blur-sm"
      onClick={onClick}
    >
      {/* Date Badge */}
      <div className="absolute top-4 left-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{day}</span>
          <span className="text-xs text-amber-600 dark:text-amber-400">{month}</span>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="absolute top-4 right-4">
        {diary.is_public ? (
          <Unlock className="w-4 h-4 text-green-500" />
        ) : (
          <Lock className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="pt-20 p-5">
        {/* Title & Mood */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 text-gray-800 dark:text-gray-200">
              {diary.title || formatDate(diary.diary_date)}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{weekday}</span>
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
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
          {diary.content.substring(0, 150)}...
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
                className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-500 hover:text-amber-600 transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
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
        className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {mood && <span className="text-3xl">{mood.emoji}</span>}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100">
                  {diary.title || formatDate(diary.diary_date)}
                </h2>
                <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
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
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {diary.is_public ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Unlock className="w-4 h-4" />
                公开日记
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lock className="w-4 h-4" />
                私密日记
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors flex items-center gap-2"
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
  const { isAdmin } = useAdmin();

  async function handleSubmit() {
    if (!formData.content.trim()) return;
    
    setLoading(true);
    try {
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
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {diary ? '编辑日记' : '写日记'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">日期</label>
              <input
                type="date"
                value={formData.diary_date}
                onChange={e => setFormData({ ...formData, diary_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">标题（可选）</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 dark:text-gray-100"
                placeholder="给这篇日记起个标题"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">今天的心情</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(moodIcons).map(([value, info]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: formData.mood === value ? '' : value })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      formData.mood === value
                        ? 'ring-2 ring-offset-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    title={info.label}
                  >
                    {info.emoji} {info.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">天气</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(weatherIcons).map(([value, info]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, weather: formData.weather === value ? '' : value })}
                    className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      formData.weather === value
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    title={info.label}
                  >
                    {info.emoji} {info.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">地点</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 dark:text-gray-100"
              placeholder="你在哪里写的这篇日记"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">内容</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none text-gray-900 dark:text-gray-100"
              rows={12}
              placeholder="写下今天的故事...\n\n今天的感受是...\n\n今天发生的事情..."
            />
            <div className="text-right text-sm text-gray-700 dark:text-gray-300 mt-2">
              {formData.content.length} 字
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="privacy-toggle"
                checked={formData.is_public}
                onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="privacy-toggle" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                {formData.is_public ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {formData.is_public ? '公开日记' : '私密日记'}
              </label>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formData.is_public ? '所有人可见' : '仅自己可见'}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.content.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 font-medium"
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