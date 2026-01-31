'use client';

// AQI等级判断函数
function getAQILevel(aqi: number): string {
  if (aqi <= 50) return '优';
  if (aqi <= 100) return '良';
  if (aqi <= 150) return '轻度污染';
  if (aqi <= 200) return '中度污染';
  if (aqi <= 300) return '重度污染';
  return '严重污染';
}

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, X, Calendar, MapPin, Clock, 
  Edit2, Trash2, Lock, Unlock, ChevronLeft, ChevronRight,
  Sparkles, Save, Eye, Shield, Filter, Grid, List, Search,
  Thermometer, Droplets, Wind, Navigation, Sun, Cloud, CloudRain,
  PenLine, NotebookPen, StickyNote, Archive, Bookmark,
  ChevronDown, Globe, Feather, Palette, Brush,
  Image, Video, Upload, Camera, FileImage, PlayCircle
} from 'lucide-react';
import { 
  Diary, 
  getDiaries, createDiary, updateDiary, deleteDiary,
  formatDate, formatDateTime, moodIcons, weatherIcons
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { EnvironmentService } from '@/services/environmentService';
import { SmartTagService, type GeneratedTags } from '@/lib/diary/smart-tag-service';
import { DiarySearchService, type SearchOptions, type SearchResult } from '@/lib/diary/search-service';
import { DiarySearch } from '@/components/DiarySearch';

// 笔记本背景组件
const NotebookBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-50 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-yellow-900/10 overflow-hidden">
    {/* 纸张纹理 - 更精致的效果 */}
    <div className="absolute inset-0 opacity-15" 
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='paper' x='0' y='0' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Crect width='200' height='200' fill='%23fdf6e3'/%3E%3Cpath d='M0 0h200v1h-200zM0 2h200v1h-200zM0 4h200v1h-200zM0 6h200v1h-200zM0 8h200v1h-200z' fill='%23f0e6d2'/%3E%3Cpath d='M0 0v200h1V0zM2 0v200h1V0zM4 0v200h1V0zM6 0v200h1V0zM8 0v200h1V0z' fill='%23f0e6d2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23paper)'/%3E%3C/svg%3E")`
         }}>
    </div>
    
    {/* 增强网格线 - 更清晰的视觉效果 */}
    <div className="absolute inset-0 opacity-15 pointer-events-none"
         style={{
           backgroundImage: `linear-gradient(to right, #d97706 1px, transparent 1px),
                            linear-gradient(to bottom, #d97706 1px, transparent 1px)` ,
           backgroundSize: '28px 28px',
           transform: 'translate(14px, 14px)'
         }}>
    </div>
    
    {/* 增强装订线 - 更立体的效果 */}
    <div className="absolute left-8 top-0 bottom-0 w-1.5 h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 shadow-2xl"></div>
    <div className="absolute left-7 top-0 bottom-0 w-1 h-full bg-gradient-to-r from-red-800 to-red-600 shadow-lg"></div>
    <div className="absolute left-9 top-0 bottom-0 w-0.5 h-full bg-red-300/40"></div>
    
    {/* 增强孔洞装饰 - 更逼真的效果 */}
    <div className="absolute left-5 top-20 w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-inner border border-red-800/30"></div>
    <div className="absolute left-5 top-36 w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-inner border border-red-800/30"></div>
    <div className="absolute left-5 top-52 w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-inner border border-red-800/30"></div>
    <div className="absolute left-5 top-68 w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-inner border border-red-800/30"></div>
    
    {/* 添加纸张边缘阴影效果 */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/5 to-transparent opacity-20 pointer-events-none"></div>
    
    {children}
  </div>
);

// 笔记本封面组件
const NotebookCover = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => (
  <motion.div 
    className="relative w-full max-w-4xl mx-auto mb-8 cursor-pointer"
    whileHover={{ scale: 1.03, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onToggle}
  >
    <div className="relative h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800/30">
      {/* 增强封面背景 - 更丰富的渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-amber-900 to-red-900"></div>
      
      {/* 金属光泽效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>
      
      {/* 封面纹理 - 更复杂的图案 */}
      <div className="absolute inset-0 opacity-25" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.2'%3E%3Cpath d='M0 0l80 80M80 0L0 80'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='20' cy='60' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`
           }}>
      </div>
      
      {/* 封面皮革质感 */}
      <div className="absolute inset-0 opacity-10" 
           style={{
             backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)`
           }}>
      </div>
      
      {/* 封面文字区域 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-50 p-10">
        <motion.div 
          animate={{ rotate: isOpen ? -8 : 0, y: isOpen ? -10 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="mb-6"
        >
          <div className="relative">
            <BookOpen className="w-20 h-20 mb-4 text-amber-100 drop-shadow-lg" />
            {/* 光泽效果 */}
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-sm"></div>
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-6xl font-bold mb-4 text-center drop-shadow-lg"
          animate={{ scale: isOpen ? 0.95 : 1 }}
          transition={{ duration: 0.6 }}
        >
          我的日记本
        </motion.h1>
        
        <motion.p 
          className="text-xl text-amber-100/90 text-center max-w-lg mb-8 drop-shadow-md leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          记录生活的点点滴滴 ✨
        </motion.p>
        
        <motion.div
          className="flex items-center gap-3 text-amber-100/80 bg-amber-900/30 px-6 py-3 rounded-full backdrop-blur-sm border border-amber-700/50"
          animate={{ y: isOpen ? 15 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="font-medium">点击{isOpen ? '合上' : '打开'}笔记本</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0, x: isOpen ? 5 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </div>
      
      {/* 封面装饰元素 */}
      <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-amber-200/40 shadow-lg"></div>
      <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-amber-200/40 shadow-lg"></div>
      <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full bg-amber-200/40 shadow-lg"></div>
      <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-amber-200/40 shadow-lg"></div>
      
      {/* 封面边角磨损效果 - 更自然 */}
      <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-amber-950/80 to-transparent rounded-br-3xl"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-amber-950/80 to-transparent rounded-tl-3xl"></div>
      
      {/* 侧面阴影增强立体感 */}
      <div className="absolute -right-2 top-4 bottom-4 w-2 bg-gradient-to-r from-transparent to-black/20 rounded-r-lg"></div>
    </div>
  </motion.div>
);

// 笔记本内页组件
const NotebookPage = ({ children, pageNumber }: { children: React.ReactNode; pageNumber?: number }) => (
  <motion.div 
    className="relative w-full max-w-4xl mx-auto bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/20 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-amber-200/50"
    initial={{ opacity: 0, y: 50, rotateY: -15 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
  >
    {/* 页面材质质感 */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/5 to-transparent opacity-20"></div>
    
    {/* 纸张纤维纹理 */}
    <div className="absolute inset-0 opacity-10" 
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23ffffff'/%3E%3Cpath d='M0 0h100v0.5h-100zM0 2h100v0.5h-100zM0 4h100v0.5h-100z' fill='%23f5f5dc'/%3E%3C/svg%3E")`
         }}>
    </div>
    
    {/* 页码 - 更精美的设计 */}
    {pageNumber && (
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-100/80 border border-amber-300 flex items-center justify-center shadow-sm">
          <span className="text-xs font-bold text-amber-800">{pageNumber}</span>
        </div>
        <span className="text-xs text-amber-600/70 font-medium">页</span>
      </div>
    )}
    
    {/* 页面内容区域 */}
    <div className="p-10 md:p-14 relative z-10">
      {children}
    </div>
    
    {/* 页面装订边效果 */}
    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-amber-100/40 via-amber-50/20 to-transparent border-r border-amber-200/30">
      {/* 装订孔阴影 */}
      <div className="absolute left-8 top-24 w-1.5 h-1.5 rounded-full bg-amber-300/50 shadow-inner"></div>
      <div className="absolute left-8 top-40 w-1.5 h-1.5 rounded-full bg-amber-300/50 shadow-inner"></div>
      <div className="absolute left-8 top-56 w-1.5 h-1.5 rounded-full bg-amber-300/50 shadow-inner"></div>
    </div>
    
    {/* 页面折痕和阴影 */}
    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-l from-transparent via-gray-300/20 to-transparent shadow-sm"></div>
    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"></div>
    
    {/* 页面角落轻微卷曲效果 */}
    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-amber-900/10 to-transparent rounded-tl-3xl"></div>
    <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-amber-900/10 to-transparent rounded-br-2xl"></div>
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
    airQuality: any;
    astronomy: any;
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
        airQuality: null,
        astronomy: null,
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
          
          {/* 媒体内容展示 */}
          {(diary as any).images && (diary as any).images.length > 0 && (
            <div className="mt-8 pt-6 border-t border-amber-200 dark:border-amber-800/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-amber-600" />
                相关媒体
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(diary as any).images.map((imageUrl: string, index: number) => (
                  <div key={index} className="group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="aspect-square flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={`媒体内容 ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={() => window.open(imageUrl, '_blank')}
                        className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<{url: string, type: string, name: string}[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<GeneratedTags>({
    emotions: [],
    activities: [],
    weather: [],
    locations: [],
    custom: []
  });
  const [showTags, setShowTags] = useState(false);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);
  const { isAdmin } = useAdmin();

  // 处理媒体文件选择
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // 验证文件类型和大小
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB (与API保持一致)
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 太大，请选择小于50MB的文件`);
        return false;
      }
      
      // 支持的文件类型 (与API的ALLOWED_TYPES保持一致)
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 
        'audio/flac', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/ogg',
        'application/pdf', 'text/plain', 'text/markdown', 'text/x-lrc'
      ];
      if (!validTypes.includes(file.type)) {
        alert(`文件 ${file.name} 类型不支持，请选择图片、视频或音频文件`);
        return false;
      }
      
      return true;
    });
    
    setMediaFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // 重置input以便再次选择相同文件
  };

  // 上传媒体文件
  const uploadMediaFiles = async () => {
    if (mediaFiles.length === 0) return [];
    
    setUploadingMedia(true);
    const uploadedUrls: {url: string, type: string, name: string}[] = [];
    
    try {
      for (const file of mediaFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'diary-media'); // 指定日记媒体文件夹
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '上传失败');
        }
        
        uploadedUrls.push({
          url: result.url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        });
      }
      
      setUploadedMedia(prev => [...prev, ...uploadedUrls]);
      setMediaFiles([]);
      return uploadedUrls;
    } catch (error) {
      console.error('上传媒体文件失败:', error);
      alert(`上传失败: ${(error as Error).message}`);
      return [];
    } finally {
      setUploadingMedia(false);
    }
  };

  // 执行搜索
  const performSearch = (allDiaries: Diary[]) => {
    if (!searchQuery.trim() && Object.keys(searchOptions).length <= 2) {
      setSearchResults([]);
      setSearchStats(null);
      return;
    }
    
    const options: SearchOptions = {
      ...searchOptions,
      query: searchQuery.trim()
    };
    
    const results = DiarySearchService.searchDiaries(allDiaries, options);
    const stats = DiarySearchService.getSearchStats(allDiaries, options);
    
    setSearchResults(results);
    setSearchStats(stats);
    setShowSearch(true);
  };

  // 更新搜索选项
  const updateSearchOptions = (updates: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...updates }));
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchOptions({ sortBy: 'date', sortOrder: 'desc' });
    setSearchResults([]);
    setSearchStats(null);
    setShowSearch(false);
  };

  // 生成智能标签
  const generateSmartTags = () => {
    const content = formData.content;
    const weatherCondition = formData.weather ? weatherIcons[formData.weather]?.label : undefined;
    
    if (content.trim().length < 10) {
      alert('请先输入至少10个字符的内容再生成标签');
      return;
    }
    
    const tags = SmartTagService.generateTags(content, weatherCondition);
    setGeneratedTags(tags);
    setShowTags(true);
  };

  async function handleSubmit() {
    if (!formData.content.trim()) return;
    
    setLoading(true);
    try {
      // 先上传媒体文件
      const mediaUrls = await uploadMediaFiles();
      
      const allTags = [
        ...generatedTags.emotions.map(tag => tag.name),
        ...generatedTags.activities.map(tag => tag.name),
        ...generatedTags.weather.map(tag => tag.name),
        ...generatedTags.locations.map(tag => tag.name),
        ...generatedTags.custom.map(tag => tag.name)
      ];
      
      const diaryData = {
        ...formData,
        images: mediaUrls.map(media => media.url), // 将媒体URL添加到images数组
        tags: allTags, // 添加生成的标签
        environment: autoCaptureEnvironment && environmentInfo && !environmentInfo.error 
          ? {
              location: environmentInfo.location,
              weather: environmentInfo.weather
            }
          : null
      };
      
      await onSave(diaryData);
      
      // 重置表单
      setGeneratedTags({
        emotions: [],
        activities: [],
        weather: [],
        locations: [],
        custom: []
      });
      setShowTags(false);
      setMediaFiles([]);
      setUploadedMedia([]);
      
      // 注意：不需要在这里执行搜索，父组件会处理状态更新
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
        <div className="p-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-amber-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                {diary ? '编辑日记' : '写日记'}
                <Feather className="w-5 h-5 text-amber-500" />
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-amber-100/80 rounded-full text-xs text-amber-700 font-medium border border-amber-300">
                <Brush className="w-3 h-3 inline mr-1" />
                手写模式
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-amber-100/50 transition-colors group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 环境信息显示 */}
          {environmentInfo && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">环境信息</h3>
                {capturingEnvironment && (
                  <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">获取中...</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* 位置信息 */}
                {environmentInfo.location && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">位置信息</span>
                    </div>
                    <div className="ml-6 space-y-1 text-gray-600 dark:text-gray-400">
                      <div>📍 {environmentInfo.location.city}{environmentInfo.location.country && `, ${environmentInfo.location.country}`}</div>
                      <div>📏 精度: ±{environmentInfo.location.accuracy}米</div>
                      {environmentInfo.location.altitude && (
                        <div>🏔️ 海拔: {environmentInfo.location.altitude}米</div>
                      )}
                      {environmentInfo.location.timezone && (
                        <div>🕐 时区: {environmentInfo.location.timezone}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 天气信息 */}
                {environmentInfo.weather && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">天气状况</span>
                    </div>
                    <div className="ml-6 space-y-1 text-gray-600 dark:text-gray-400">
                      <div>🌡️ 温度: {environmentInfo.weather.temperature}°C {environmentInfo.weather.feelsLike && `(体感${environmentInfo.weather.feelsLike}°C)`}</div>
                      <div>☁️ 天气: {environmentInfo.weather.condition}</div>
                      <div>💧 湿度: {environmentInfo.weather.humidity}%</div>
                      <div>💨 风速: {environmentInfo.weather.windSpeed} km/h</div>
                      {environmentInfo.weather.pressure && (
                        <div>🔽 气压: {environmentInfo.weather.pressure} hPa</div>
                      )}
                      {environmentInfo.weather.visibility && (
                        <div>👁️ 能见度: {(environmentInfo.weather.visibility / 1000).toFixed(1)} km</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 空气质量 */}
                {environmentInfo.airQuality && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">空气质量</span>
                    </div>
                    <div className="ml-6 space-y-1 text-gray-600 dark:text-gray-400">
                      <div>📊 AQI: {environmentInfo.airQuality.aqi} ({getAQILevel(environmentInfo.airQuality.aqi)})</div>
                      <div>🦠 PM2.5: {environmentInfo.airQuality.pm25} μg/m³</div>
                      <div>🦠 PM10: {environmentInfo.airQuality.pm10} μg/m³</div>
                      <div>🛡️ O₃: {environmentInfo.airQuality.o3} μg/m³</div>
                    </div>
                  </div>
                )}
                
                {/* 天文信息 */}
                {environmentInfo.astronomy && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">天文信息</span>
                    </div>
                    <div className="ml-6 space-y-1 text-gray-600 dark:text-gray-400">
                      <div>🌅 日出: {environmentInfo.astronomy.sunrise}</div>
                      <div>🌇 日落: {environmentInfo.astronomy.sunset}</div>
                      <div>🌙 月相: {environmentInfo.astronomy.moonPhase}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {environmentInfo.error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                  ⚠️ {environmentInfo.error}
                </div>
              )}
            </div>
          )}

          {/* 自动获取环境信息开关 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto-env-toggle"
                checked={autoCaptureEnvironment}
                onChange={e => setAutoCaptureEnvironment(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="auto-env-toggle" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <Navigation className="w-4 h-4" />
                自动获取环境信息
              </label>
            </div>
            <button
              onClick={captureEnvironmentInfo}
              disabled={capturingEnvironment}
              className="px-4 py-2 text-sm rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {capturingEnvironment ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>获取中...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>立即获取</span>
                </>
              )}
            </button>
          </div>
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

          {/* 智能标签生成区域 */}
          <div className="border-2 border-dashed border-purple-300/50 rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:border-purple-400/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">智能标签</h3>
              </div>
              <button
                onClick={generateSmartTags}
                disabled={formData.content.trim().length < 10}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>生成标签</span>
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              基于日记内容自动生成情绪、活动、天气等标签
            </p>
            
            {/* 标签显示区域 */}
            {showTags && (
              <div className="space-y-4">
                {/* 情绪标签 */}
                {generatedTags.emotions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      情绪标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.emotions.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          <span className="text-xs opacity-70">{Math.round(tag.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 活动标签 */}
                {generatedTags.activities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      活动标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.activities.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          <span className="text-xs opacity-70">{Math.round(tag.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 天气标签 */}
                {generatedTags.weather.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      天气标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.weather.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          <span className="text-xs opacity-70">{Math.round(tag.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 位置标签 */}
                {generatedTags.locations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      位置标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.locations.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          <span className="text-xs opacity-70">{Math.round(tag.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 自定义标签 */}
                {generatedTags.custom.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      关键词
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.custom.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          <span className="text-xs opacity-70">{Math.round(tag.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!showTags && formData.content.trim().length >= 10 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                点击"生成标签"按钮，基于您的日记内容自动生成智能标签
              </div>
            )}
          </div>

          {/* 媒体上传区域 */}
          <div className="border-2 border-dashed border-amber-300/50 rounded-2xl p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 hover:border-amber-400/70 transition-colors">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Camera className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">添加图片或视频</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                支持图片、视频、音频等多种格式，最大50MB
              </p>
              
              {/* 文件选择按钮 */}
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                <label className="cursor-pointer">
                  <div className="px-4 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2">
                    <Image className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300 font-medium">选择图片</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                </label>
                
                <label className="cursor-pointer">
                  <div className="px-4 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300 font-medium">选择视频</span>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* 已选择的文件预览 */}
              {(mediaFiles.length > 0 || uploadedMedia.length > 0) && (
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">已选择的媒体文件：</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                    {/* 待上传文件 */}
                    {mediaFiles.map((file, index) => (
                      <div key={`pending-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-amber-300/50 flex items-center justify-center overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <Video className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate px-1">{file.name}</p>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                            className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                    
                    {/* 已上传文件 */}
                    {uploadedMedia.map((media, index) => (
                      <div key={`uploaded-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-green-400/50 flex items-center justify-center overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt={media.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <PlayCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate px-1">{media.name}</p>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => setUploadedMedia(prev => prev.filter((_, i) => i !== index))}
                            className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          已上传
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded truncate">
                          {media.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 上传按钮 */}
                  {mediaFiles.length > 0 && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={uploadMediaFiles}
                        disabled={uploadingMedia}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploadingMedia ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>上传中...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>上传 {mediaFiles.length} 个文件</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
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