/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Calendar,
  Camera,
  Cloud,
  Clock,
  Edit3,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  MapPin,
  NotebookPen,
  Plus,
  Search,
  Shield,
  Sun,
  Thermometer,
  Trash2,
  Unlock,
  Video,
  X,
} from 'lucide-react';
import { Diary, formatDate, formatDateTime, moodIcons, weatherIcons } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { EnvironmentService } from '@/services/environmentService';
import {
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_LIFT,
  TAP_BUTTON,
  modalBackdropVariants,
  modalPanelVariants,
} from '@/components/Animations';

interface EnvironmentSnapshot {
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    address: string;
    accuracy?: number;
    timezone?: string;
  };
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    feelsLike?: number;
    pressure?: number;
    timestamp?: number;
  };
  airQuality?: {
    aqi: number;
    pm25: number;
    pm10: number;
  };
  astronomy?: {
    sunrise: string;
    sunset: string;
    moonPhase: string;
  };
  error?: string;
}

interface DiaryFormState {
  title: string;
  content: string;
  mood: string;
  weather: string;
  location: string;
  is_public: boolean;
  diary_date: string;
}

interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  name: string;
}

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('admin-token');
}

function buildAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

function stripVideoMarker(url: string): string {
  return url.replace(/#video$/i, '');
}

function isVideoMedia(url: string): boolean {
  return /#video$/i.test(url) || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function extractMediaUrlsFromContent(content: string): string[] {
  const regex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const urls: string[] = [];
  let match: RegExpExecArray | null = regex.exec(content);

  while (match) {
    urls.push(stripVideoMarker(match[1]));
    match = regex.exec(content);
  }

  return Array.from(new Set(urls));
}

const ENV_BLOCK_START = '<!--DIARY_ENV_AUTO_START-->';
const ENV_BLOCK_END = '<!--DIARY_ENV_AUTO_END-->';

function buildEnvironmentMarkdown(snapshot: EnvironmentSnapshot): string {
  if (snapshot.error) return '';

  const lines: string[] = [];
  const capturedAt = new Date().toLocaleString('zh-CN', { hour12: false });

  if (snapshot.location?.city) {
    const place = `${snapshot.location.city}${snapshot.location.country ? `, ${snapshot.location.country}` : ''}`;
    lines.push(`- 位置：${place}`);
  } else if (snapshot.location?.address) {
    lines.push(`- 位置：${snapshot.location.address}`);
  }

  if (snapshot.weather?.condition) {
    lines.push(`- 天气：${snapshot.weather.condition}`);
  }
  if (snapshot.weather?.temperature !== undefined) {
    lines.push(`- 温度：${snapshot.weather.temperature}°C`);
  }
  if (snapshot.weather?.humidity !== undefined) {
    lines.push(`- 湿度：${snapshot.weather.humidity}%`);
  }
  lines.push(`- 记录时间：${capturedAt}`);

  if (lines.length <= 1) return '';

  return ['### 今日环境记录', ...lines].join('\n');
}

function upsertEnvironmentBlock(content: string, snapshot: EnvironmentSnapshot): string {
  const envMarkdown = buildEnvironmentMarkdown(snapshot);
  if (!envMarkdown) return content;

  const block = `${ENV_BLOCK_START}\n${envMarkdown}\n${ENV_BLOCK_END}`;
  const blockRegex = new RegExp(`${ENV_BLOCK_START}[\\s\\S]*?${ENV_BLOCK_END}\\n*`, 'g');
  const cleanedContent = content.replace(blockRegex, '').trim();

  return cleanedContent ? `${block}\n\n${cleanedContent}` : `${block}\n`;
}

function buildUploadedMediaList(content: string, images?: string[] | null): UploadedMedia[] {
  const merged = new Set<string>();

  extractMediaUrlsFromContent(content).forEach((url) => {
    merged.add(stripVideoMarker(url));
  });

  (images || []).forEach((url) => {
    if (typeof url === 'string' && url.trim()) {
      merged.add(stripVideoMarker(url));
    }
  });

  return Array.from(merged).map((url) => ({
    url,
    type: isVideoMedia(url) ? 'video' : 'image',
    name: decodeURIComponent(url.split('/').pop() || '媒体'),
  }));
}

function weatherKeyFromCondition(condition: string): string {
  const text = condition.toLowerCase();
  if (text.includes('晴') || text.includes('clear')) return 'sunny';
  if (text.includes('雪') || text.includes('snow')) return 'snowy';
  if (text.includes('雨') || text.includes('drizzle') || text.includes('shower') || text.includes('rain')) return 'rainy';
  if (text.includes('雾') || text.includes('mist') || text.includes('fog')) return 'foggy';
  if (text.includes('风') || text.includes('wind')) return 'windy';
  if (text.includes('雷') || text.includes('storm') || text.includes('thunder')) return 'stormy';
  return 'cloudy';
}

function diaryPreview(content: string): string {
  const compact = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/\s+/g, ' ').trim();
  return compact.length > 110 ? `${compact.slice(0, 110)}...` : compact;
}

function DiaryNotebookBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="diary-readable relative min-h-screen overflow-hidden bg-[#f7f3e8] text-zinc-900 [font-family:var(--font-ui)] [text-rendering:optimizeLegibility] [letter-spacing:0] dark:bg-[#151512] dark:text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(120,94,42,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,94,42,0.09) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute left-8 top-0 h-full w-0.5 bg-red-500/25 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]" />
      <div className="pointer-events-none absolute left-4 top-20 h-2.5 w-2.5 rounded-full bg-red-500/35" />
      <div className="pointer-events-none absolute left-4 top-48 h-2.5 w-2.5 rounded-full bg-red-500/35" />
      <div className="pointer-events-none absolute left-4 top-76 h-2.5 w-2.5 rounded-full bg-red-500/35" />
      {children}
    </div>
  );
}

export default function DiaryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverOpen, setCoverOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [activeDiary, setActiveDiary] = useState<Diary | null>(null);
  const [keyword, setKeyword] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  const { isAdmin, showLoginModal } = useAdmin();

  const loadDiaries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diaries?limit=120', {
        headers: buildAuthHeaders(),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '加载日记失败');
      }

      setDiaries(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('加载日记失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiaries();
  }, [isAdmin, loadDiaries]);

  const filteredDiaries = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return diaries
      .filter((diary) => {
        if (showPublicOnly && !diary.is_public) return false;
        if (monthFilter && !diary.diary_date.startsWith(monthFilter)) return false;
        if (moodFilter !== 'all' && diary.mood !== moodFilter) return false;

        if (!q) return true;

        const title = (diary.title || '').toLowerCase();
        const content = diary.content.toLowerCase();
        const location = (diary.location || '').toLowerCase();
        return title.includes(q) || content.includes(q) || location.includes(q);
      })
      .sort((a, b) => new Date(b.diary_date).getTime() - new Date(a.diary_date).getTime());
  }, [diaries, keyword, monthFilter, moodFilter, showPublicOnly]);

  const stats = useMemo(() => {
    const publicCount = diaries.filter((item) => item.is_public).length;
    const privateCount = diaries.length - publicCount;
    const wordCount = diaries.reduce((acc, item) => acc + (item.word_count || 0), 0);

    return {
      total: diaries.length,
      publicCount,
      privateCount,
      wordCount,
    };
  }, [diaries]);

  const openCreateEditor = () => {
    if (!isAdmin) {
      showLoginModal(() => {
        setEditingDiary(null);
        setShowEditor(true);
      });
      return;
    }

    setEditingDiary(null);
    setShowEditor(true);
  };

  const handleDelete = async (diary: Diary) => {
    if (!isAdmin) {
      showLoginModal();
      return;
    }

    const confirmed = window.confirm(`确定删除《${diary.title || formatDate(diary.diary_date)}》吗？`);
    if (!confirmed) return;

    try {
      const token = getAdminToken();
      if (!token) {
        showLoginModal();
        return;
      }

      const response = await fetch(`/api/diaries/${diary.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }

      setDiaries((prev) => prev.filter((item) => item.id !== diary.id));
      if (activeDiary?.id === diary.id) {
        setActiveDiary(null);
      }
    } catch (error) {
      console.error('删除日记失败:', error);
      window.alert('删除失败，请稍后重试。');
    }
  };

  const handleSaved = (savedDiary: Diary, editingId?: string) => {
    setDiaries((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === editingId ? savedDiary : item));
      }
      return [savedDiary, ...prev];
    });

    setShowEditor(false);
    setEditingDiary(null);
  };

  return (
    <DiaryNotebookBackground>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <section className="surface-hero relative overflow-hidden border-amber-300/25 bg-[linear-gradient(142deg,#75532d_0%,#5a3d22_45%,#3c2918_100%)] p-6 text-amber-50 shadow-[0_28px_68px_-36px_rgba(44,24,8,0.82)] md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0))' }} />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(254,243,199,0.35),transparent_70%)]" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker border-amber-200/35 bg-amber-100/15 text-amber-100/90">
                <NotebookPen className="h-3.5 w-3.5" />
                PERSONAL JOURNAL
              </p>
              <h1 className="section-title-xl mt-4 text-amber-50 md:text-5xl">我的日记本</h1>
              <p className="mt-4 max-w-2xl text-amber-100/92">
                像真正的手写日记一样记录每一天。支持自动获取当前位置、天气与温度，并可把图片视频直接插入正文。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCoverOpen((prev) => !prev)}
                className="btn-secondary ios-button-press border-amber-200/35 bg-amber-200/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-200/20"
              >
                {coverOpen ? '合上日记本' : '打开日记本'}
              </button>
              <button
                onClick={openCreateEditor}
                className="btn-primary ios-button-press inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300"
              >
                {isAdmin ? <Plus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                {isAdmin ? '写今天的日记' : '管理员登录后写日记'}
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="metric-tile border-amber-200/30 bg-amber-100/10">
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-sm text-amber-100/90">总篇数</p>
            </div>
            <div className="metric-tile border-amber-200/30 bg-amber-100/10">
              <p className="text-2xl font-semibold">{stats.publicCount}</p>
              <p className="text-sm text-amber-100/90">公开篇数</p>
            </div>
            <div className="metric-tile border-amber-200/30 bg-amber-100/10">
              <p className="text-2xl font-semibold">{stats.privateCount}</p>
              <p className="text-sm text-amber-100/90">私密篇数</p>
            </div>
            <div className="metric-tile border-amber-200/30 bg-amber-100/10">
              <p className="text-2xl font-semibold">{stats.wordCount.toLocaleString()}</p>
              <p className="text-sm text-amber-100/90">累计字数</p>
            </div>
          </div>
        </section>

        {coverOpen && (
          <>
            <section className="surface-card diary-paper-surface mt-6 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索标题、内容、地点..."
                    className="input-modern py-2.5 pl-10 pr-3 text-base text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <select
                  value={moodFilter}
                  onChange={(event) => setMoodFilter(event.target.value)}
                  className="input-modern px-3 py-2.5 text-base text-zinc-800 dark:text-zinc-100"
                >
                  <option value="all">全部心情</option>
                  {Object.entries(moodIcons).map(([key, mood]) => (
                    <option key={key} value={key}>
                      {mood.emoji} {mood.label}
                    </option>
                  ))}
                </select>

                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="input-modern px-3 py-2.5 text-base text-zinc-800 dark:text-zinc-100"
                />

                {isAdmin && (
                  <label className="chip-filter h-11 border-amber-200/75 bg-white/90 px-3 py-2.5 text-sm text-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={showPublicOnly}
                      onChange={(event) => setShowPublicOnly(event.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    仅公开
                  </label>
                )}
              </div>
            </section>

            <section className="mt-6">
              {loading ? (
                <div className="surface-card diary-paper-surface py-20 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />
                  <p className="mt-3 text-sm text-muted-foreground">正在翻开日记页...</p>
                </div>
              ) : filteredDiaries.length === 0 ? (
                <div className="surface-card diary-paper-surface py-20 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-amber-500/70" />
                  <h3 className="mt-4 text-xl font-semibold">这一页还是空白</h3>
                  <p className="mt-2 text-sm text-muted-foreground">开始写下今天的心情、天气和发生的故事。</p>
                  <button
                    onClick={openCreateEditor}
                    className="btn-primary ios-button-press mt-5 px-4 py-2 text-sm font-medium text-white"
                  >
                    立刻写日记
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDiaries.map((diary, index) => (
                    <DiaryEntryCard
                      key={diary.id}
                      diary={diary}
                      index={index}
                      isAdmin={isAdmin}
                      onOpen={() => setActiveDiary(diary)}
                      onEdit={() => {
                        if (!isAdmin) {
                          showLoginModal();
                          return;
                        }
                        setEditingDiary(diary);
                        setShowEditor(true);
                      }}
                      onDelete={() => void handleDelete(diary)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AnimatePresence>
        {showEditor && (
          <DiaryEditorModal
            diary={editingDiary}
            onClose={() => {
              setShowEditor(false);
              setEditingDiary(null);
            }}
            onSaved={handleSaved}
            isAdmin={isAdmin}
            showLoginModal={showLoginModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDiary && (
          <DiaryDetailModal
            diary={activeDiary}
            isAdmin={isAdmin}
            onClose={() => setActiveDiary(null)}
            onEdit={() => {
              setEditingDiary(activeDiary);
              setActiveDiary(null);
              setShowEditor(true);
            }}
            onDelete={() => {
              void handleDelete(activeDiary);
              setActiveDiary(null);
            }}
          />
        )}
      </AnimatePresence>
    </DiaryNotebookBackground>
  );
}

function DiaryEntryCard({
  diary,
  index,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
}: {
  diary: Diary;
  index: number;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = diary.mood ? moodIcons[diary.mood] : null;
  const weather = diary.weather ? weatherIcons[diary.weather] : null;

  const date = new Date(diary.diary_date);
  const day = date.getDate();
  const month = date.toLocaleDateString('zh-CN', { month: 'short' });

  return (
    <motion.article
      initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.04, duration: 0.58, ease: APPLE_EASE_SOFT }}
      whileHover={HOVER_LIFT}
      whileTap={{ y: -2, scale: 0.994 }}
      className="diary-paper-surface ios-hover-surface group relative overflow-hidden rounded-2xl border border-amber-300/50 bg-white/80 shadow-sm dark:bg-zinc-900/70"
    >
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="absolute left-6 top-0 h-full w-0.5 bg-rose-300/50" />
        <div className="grid gap-4 p-5 md:grid-cols-[76px_minmax(0,1fr)] md:items-start">
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 p-2 text-center dark:bg-zinc-800/80">
            <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">{day}</p>
            <p className="text-sm text-amber-700 dark:text-amber-200">{month}</p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {diary.title || formatDate(diary.diary_date)}
              </h3>

              <div className="inline-flex items-center gap-2 text-sm">
                {mood && <span title={mood.label}>{mood.emoji}</span>}
                {weather && <span title={weather.label}>{weather.emoji}</span>}
                {diary.is_public ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Unlock className="h-3.5 w-3.5" />公开
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                    <Lock className="h-3.5 w-3.5" />私密
                  </span>
                )}
              </div>
            </div>

            <p className="diary-preview-text mt-3 line-clamp-2 text-base leading-8 text-zinc-800 dark:text-zinc-100">{diaryPreview(diary.content)}</p>

            <div className="diary-meta-text mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(diary.diary_date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {diary.word_count || diary.content.length} 字
              </span>
              {diary.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {diary.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {isAdmin && (
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="ios-button-press rounded-lg bg-white/95 p-2 text-amber-700 shadow-sm hover:bg-amber-50"
            title="编辑"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="ios-button-press rounded-lg bg-white/95 p-2 text-rose-600 shadow-sm hover:bg-rose-50"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.article>
  );
}

function DiaryDetailModal({
  diary,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
}: {
  diary: Diary;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mood = diary.mood ? moodIcons[diary.mood] : null;
  const weather = diary.weather ? weatherIcons[diary.weather] : null;

  const inlineMedia = useMemo(() => extractMediaUrlsFromContent(diary.content), [diary.content]);
  const extraMedia = useMemo(
    () => (diary.images || []).filter((url) => !inlineMedia.includes(stripVideoMarker(url))),
    [diary.images, inlineMedia]
  );

  const markdownComponents: Components = {
    p: ({ children }) => <p className="diary-preview-text mb-4 text-[1.03rem] leading-9 text-zinc-800 dark:text-zinc-100">{children}</p>,
    h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-semibold">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-3 mt-7 text-xl font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold">{children}</h3>,
    ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 rounded-r-xl border-l-4 border-amber-500 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
        {children}
      </blockquote>
    ),
    code: ({ className, children }) => {
      if (className) {
        return (
          <pre className="my-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-sm text-zinc-100 dark:border-zinc-700">
            <code className={className}>{children}</code>
          </pre>
        );
      }

      return <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">{children}</code>;
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-4 dark:text-amber-300">
        {children}
      </a>
    ),
    img: ({ src, alt }) => {
      if (!src) return null;
      const raw = String(src);
      const mediaUrl = stripVideoMarker(raw);

      if (isVideoMedia(raw)) {
        return (
          <div className="my-5 overflow-hidden rounded-2xl border border-amber-300/50 bg-black">
            <video src={mediaUrl} controls className="h-auto w-full" preload="metadata" />
          </div>
        );
      }

      return (
        <div className="my-5 overflow-hidden rounded-2xl border border-amber-300/50 bg-white">
          <img src={mediaUrl} alt={alt || '日记图片'} className="h-auto w-full object-cover" loading="lazy" />
        </div>
      );
    },
  };

  const environment = (diary.environment_data || null) as EnvironmentSnapshot | null;

  return (
    <motion.div
      variants={modalBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalPanelVariants}
        transition={APPLE_SPRING_GENTLE}
        className="ios-modal-card flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-amber-300/50 bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{diary.title || formatDate(diary.diary_date)}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-base text-zinc-700 dark:text-zinc-200">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(diary.diary_date)}
                </span>
                {mood && <span>{mood.emoji} {mood.label}</span>}
                {weather && <span>{weather.emoji} {weather.label}</span>}
                {diary.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {diary.location}
                  </span>
                )}
              </div>
            </div>

            <button onClick={onClose} className="ios-button-press rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {diary.content}
          </ReactMarkdown>

          {extraMedia.length > 0 && (
            <div className="mt-8 border-t border-amber-200/60 pt-6">
              <h3 className="mb-3 text-lg font-semibold">附件</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {extraMedia.map((mediaUrl) => (
                  <div key={mediaUrl} className="overflow-hidden rounded-2xl border border-amber-300/50 bg-zinc-50 dark:bg-zinc-800">
                    {isVideoMedia(mediaUrl) ? (
                      <video src={stripVideoMarker(mediaUrl)} controls className="h-auto w-full" preload="metadata" />
                    ) : (
                      <img src={stripVideoMarker(mediaUrl)} alt="日记附件" className="h-auto w-full object-cover" loading="lazy" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {environment && !environment.error && (
            <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-800 dark:bg-sky-900/20">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                <Globe className="h-4 w-4" />
                环境信息
              </h3>
              <div className="grid gap-2 text-sm text-sky-900 dark:text-sky-100 md:grid-cols-2">
                {environment.location?.city && (
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {environment.location.city}{environment.location.country ? `, ${environment.location.country}` : ''}
                  </div>
                )}
                {environment.weather && (
                  <div className="inline-flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4" />
                    {environment.weather.temperature}°C · {environment.weather.condition}
                  </div>
                )}
                {environment.weather?.humidity !== undefined && (
                  <div className="inline-flex items-center gap-1.5">
                    <Cloud className="h-4 w-4" />
                    湿度 {environment.weather.humidity}%
                  </div>
                )}
                {environment.astronomy?.sunset && (
                  <div className="inline-flex items-center gap-1.5">
                    <Sun className="h-4 w-4" />
                    日落 {environment.astronomy.sunset}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end gap-2 border-t border-amber-200/60 p-5 dark:border-zinc-700">
            <button onClick={onEdit} className="ios-button-press inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200">
              <Edit3 className="h-4 w-4" />编辑
            </button>
            <button onClick={onDelete} className="ios-button-press inline-flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200">
              <Trash2 className="h-4 w-4" />删除
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DiaryEditorModal({
  diary,
  onClose,
  onSaved,
  isAdmin,
  showLoginModal,
}: {
  diary: Diary | null;
  onClose: () => void;
  onSaved: (savedDiary: Diary, editingId?: string) => void;
  isAdmin: boolean;
  showLoginModal: (callback?: () => void) => void;
}) {
  const [form, setForm] = useState<DiaryFormState>({
    title: diary?.title || '',
    content: diary?.content || '',
    mood: diary?.mood || '',
    weather: diary?.weather || '',
    location: diary?.location || '',
    is_public: diary?.is_public || false,
    diary_date: diary?.diary_date || new Date().toISOString().slice(0, 10),
  });

  const [autoCapture, setAutoCapture] = useState(!diary);
  const [capturing, setCapturing] = useState(false);
  const [environmentData, setEnvironmentData] = useState<EnvironmentSnapshot | null>(
    (diary?.environment_data as EnvironmentSnapshot | null) || null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>(() =>
    diary ? buildUploadedMediaList(diary.content, diary.images) : []
  );

  const captureEnvironment = useCallback(async () => {
    setCapturing(true);
    setError('');

    try {
      const snapshot = await EnvironmentService.getEnvironmentInfo();
      setEnvironmentData(snapshot as EnvironmentSnapshot);
      setForm((prev) => {
        const next = { ...prev };

        if (snapshot.location?.city) {
          next.location = `${snapshot.location.city}${snapshot.location.country ? `, ${snapshot.location.country}` : ''}`;
        }

        if (snapshot.weather?.condition) {
          next.weather = weatherKeyFromCondition(snapshot.weather.condition);
        }

        // 自动导入到当前日记正文（会更新同一段环境记录，不会重复堆叠）
        next.content = upsertEnvironmentBlock(next.content, snapshot as EnvironmentSnapshot);
        return next;
      });
    } catch (captureError) {
      console.error('自动获取环境信息失败:', captureError);
      setError('无法自动获取环境信息，请检查浏览器定位权限。');
    } finally {
      setCapturing(false);
    }
  }, []);

  useEffect(() => {
    if (autoCapture) {
      void captureEnvironment();
    }
  }, [autoCapture, captureEnvironment]);

  const insertMediaMarkdown = (snippets: string[]) => {
    if (snippets.length === 0) return;

    setForm((prev) => {
      const trimmed = prev.content.trimEnd();
      const appended = trimmed ? `${trimmed}\n\n${snippets.join('\n\n')}\n` : `${snippets.join('\n\n')}\n`;
      return { ...prev, content: appended };
    });
  };

  const uploadAndInsertFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    const snippets: string[] = [];
    const newMedia: UploadedMedia[] = [];

    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          setError(`文件 ${file.name} 不是支持的图片/视频格式。`);
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          setError(`文件 ${file.name} 超过 50MB 限制。`);
          continue;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'diary-media');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });

        const result = await response.json();
        if (!response.ok || !result.success || !result.url) {
          throw new Error(result.error || `上传 ${file.name} 失败`);
        }

        const url = String(result.url);
        const mediaType: UploadedMedia['type'] = isVideo ? 'video' : 'image';
        const markdown = isVideo ? `![视频](${url}#video)` : `![图片](${url})`;

        snippets.push(markdown);
        newMedia.push({ url, type: mediaType, name: file.name });
      }

      insertMediaMarkdown(snippets);
      setUploadedMedia((prev) => [...prev, ...newMedia]);
    } catch (uploadError) {
      console.error('上传媒体失败:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : '上传失败，请稍后重试。');
    } finally {
      setUploading(false);
    }
  };

  const removeInsertedMedia = (url: string) => {
    const normalized = stripVideoMarker(url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`!\\[[^\\]]*\\]\\(${normalized}(#video)?\\)\\n?`, 'g');

    setForm((prev) => ({
      ...prev,
      content: prev.content.replace(regex, '').replace(/\n{3,}/g, '\n\n').trimEnd(),
    }));

    setUploadedMedia((prev) => prev.filter((item) => stripVideoMarker(item.url) !== stripVideoMarker(url)));
  };

  const handleSubmit = async () => {
    if (!form.content.trim()) {
      setError('请先写一点日记内容。');
      return;
    }

    if (!isAdmin) {
      showLoginModal();
      return;
    }

    const token = getAdminToken();
    if (!token) {
      showLoginModal();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const inlineMedia = extractMediaUrlsFromContent(form.content);
      const uploadedMediaUrls = uploadedMedia.map((item) => stripVideoMarker(item.url));
      const mergedImages = Array.from(new Set([...inlineMedia, ...uploadedMediaUrls]));

      const payload = {
        ...form,
        mood: form.mood || null,
        weather: form.weather || null,
        location: form.location || null,
        images: mergedImages,
        environment_data: environmentData && !environmentData.error ? environmentData : null,
      };

      const endpoint = diary ? `/api/diaries/${diary.id}` : '/api/diaries';
      const method = diary ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || '保存日记失败');
      }

      onSaved(result.data as Diary, diary?.id);
    } catch (submitError) {
      console.error('保存日记失败:', submitError);
      setError(submitError instanceof Error ? submitError.message : '保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={modalBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalPanelVariants}
        transition={APPLE_SPRING_GENTLE}
        className="ios-modal-card diary-editor flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-300/50 bg-white text-zinc-900 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              <NotebookPen className="h-5 w-5 text-amber-600" />
              {diary ? '编辑日记' : '新建日记'}
            </h2>
            <button onClick={onClose} className="ios-button-press rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">日期</label>
              <input
                type="date"
                value={form.diary_date}
                onChange={(event) => setForm((prev) => ({ ...prev, diary_date: event.target.value }))}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">标题（可选）</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="今天发生了什么..."
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">心情</label>
              <select
                value={form.mood}
                onChange={(event) => setForm((prev) => ({ ...prev, mood: event.target.value }))}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">未选择</option>
                {Object.entries(moodIcons).map(([key, mood]) => (
                  <option key={key} value={key}>
                    {mood.emoji} {mood.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">天气</label>
              <select
                value={form.weather}
                onChange={(event) => setForm((prev) => ({ ...prev, weather: event.target.value }))}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">未选择</option>
                {Object.entries(weatherIcons).map(([key, weather]) => (
                  <option key={key} value={key}>
                    {weather.emoji} {weather.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">地点</label>
            <input
              type="text"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="例如：上海 · 静安"
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-800 dark:bg-sky-900/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 dark:text-sky-200">
                <input
                  type="checkbox"
                  checked={autoCapture}
                  onChange={(event) => setAutoCapture(event.target.checked)}
                  className="h-4 w-4 rounded"
                />
                自动获取定位、天气、温度
              </label>

              <button
                onClick={() => void captureEnvironment()}
                disabled={capturing}
                className="ios-button-press inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                {capturing ? '获取中...' : '立即获取'}
              </button>
            </div>

            {environmentData && !environmentData.error && (
              <div className="mt-3 grid gap-2 text-sm text-sky-900 dark:text-sky-100 md:grid-cols-2">
                {environmentData.location?.city && (
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {environmentData.location.city}{environmentData.location.country ? `, ${environmentData.location.country}` : ''}
                  </p>
                )}
                {environmentData.weather && (
                  <p className="inline-flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4" />
                    {environmentData.weather.temperature}°C · {environmentData.weather.condition}
                  </p>
                )}
              </div>
            )}

            {environmentData?.error && <p className="mt-2 text-sm text-rose-600">{environmentData.error}</p>}
          </div>

          <div className="rounded-2xl border border-amber-300/55 bg-amber-50/60 p-4 dark:bg-zinc-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                <Camera className="h-4 w-4 text-amber-600" />
                媒体插入（直接插入正文）
              </h3>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 dark:bg-zinc-900">
                <ImageIcon className="h-4 w-4" />
                图片/视频
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => void uploadAndInsertFiles(event.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              选择文件后会自动上传并插入到正文，阅读时直接显示图片或视频播放器。
            </p>

            {uploading && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-amber-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在上传并插入媒体...
              </p>
            )}

            {uploadedMedia.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {uploadedMedia.map((media) => (
                  <div key={media.url} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:bg-zinc-900">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {media.type === 'video' ? (
                        <Video className="h-4 w-4 text-violet-600" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="truncate">{media.name}</span>
                    </span>
                    <button
                      onClick={() => removeInsertedMedia(media.url)}
                      className="ios-button-press rounded p-1 text-rose-600 hover:bg-rose-50"
                      title="从正文移除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">正文</label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              rows={14}
              placeholder={'记录今天的故事...\n\n你上传的图片和视频会直接插入到这里。'}
              className="w-full resize-y rounded-2xl border border-amber-300 bg-white px-4 py-3 text-[1.08rem] leading-9 text-zinc-900 placeholder:text-zinc-500 outline-none ring-amber-500/20 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
            <p className="mt-2 text-right text-sm text-zinc-700 dark:text-zinc-200">{form.content.length} 字</p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) => setForm((prev) => ({ ...prev, is_public: event.target.checked }))}
              className="h-4 w-4 rounded"
            />
            {form.is_public ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <Unlock className="h-4 w-4" /> 公开日记
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Lock className="h-4 w-4" /> 私密日记
              </span>
            )}
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-amber-200/60 p-5 dark:border-zinc-700">
          <button onClick={onClose} className="ios-button-press rounded-xl px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
            取消
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving || !form.content.trim()}
            className="ios-button-press inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            {saving ? '保存中...' : diary ? '保存修改' : '写入日记本'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
