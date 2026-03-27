'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Globe,
  Loader2,
  Newspaper,
  Play,
  Server,
  Settings,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatePanel } from '@/components/ui/StatePanel';

interface NewsSource {
  id: string;
  name: string;
  category: string;
  language: string;
  country?: string;
  isActive: boolean;
  lastChecked?: string;
}

interface TestResult {
  success: boolean;
  itemCount: number;
  error?: string;
}

export default function NewsAdminPage() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningTest, setRunningTest] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/admin/login?redirect=/admin/news');
      return;
    }

    loadSources();
  }, [authLoading, isAdmin, router]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news/sources');
      const data = await response.json();
      if (data.success) {
        setSources(data.data);
      } else {
        setSources([]);
      }
    } catch (error) {
      console.error('加载新闻源失败:', error);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const testSource = async (sourceId: string) => {
    try {
      setTesting(sourceId);
      const response = await fetch('/api/news/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });
      const data = await response.json();
      setTestResults((prev) => ({ ...prev, [sourceId]: data.data }));
    } catch (error) {
      console.error('测试新闻源失败:', error);
      setTestResults((prev) => ({
        ...prev,
        [sourceId]: { success: false, itemCount: 0, error: '测试失败' },
      }));
    } finally {
      setTesting(null);
    }
  };

  const runFullTest = async () => {
    try {
      setRunningTest(true);
      await fetch('/api/news/test?test=true');
    } catch (error) {
      console.error('完整测试失败:', error);
    } finally {
      setRunningTest(false);
    }
  };

  const activeSources = useMemo(() => sources.filter((source) => source.isActive).length, [sources]);
  const languageCount = useMemo(() => new Set(sources.map((source) => source.language)).size, [sources]);
  const categoryCount = useMemo(() => new Set(sources.map((source) => source.category)).size, [sources]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <StatePanel
            tone="loading"
            title={authLoading ? '正在验证管理员身份' : '正在跳转登录页'}
            description="新闻后台会在身份验证完成后自动恢复。"
            icon={<Newspaper className="h-6 w-6" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-start gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
                  <Newspaper className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">新闻收集管理</h1>
                  <p className="text-sm text-muted-foreground">检查新闻源状态、语言覆盖和测试抓取结果。</p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={runFullTest} disabled={runningTest}>
            {runningTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            运行完整测试
          </Button>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总新闻源</p>
                <p className="mt-3 text-3xl font-semibold">{sources.length}</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">活跃源</p>
                <p className="mt-3 text-3xl font-semibold">{activeSources}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">语言种类</p>
                <p className="mt-3 text-3xl font-semibold">{languageCount}</p>
              </div>
              <Server className="h-8 w-8 text-cyan-500" />
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">分类数量</p>
                <p className="mt-3 text-3xl font-semibold">{categoryCount}</p>
              </div>
              <Settings className="h-8 w-8 text-amber-500" />
            </div>
          </Card>
        </div>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载新闻源"
            description="正在同步新闻源配置和最近测试结果。"
          />
        ) : sources.length === 0 ? (
          <StatePanel
            tone="empty"
            title="暂无新闻源配置"
            description="先在服务端配置新闻源，这里会自动显示抓取入口和状态。"
            icon={<AlertCircle className="h-6 w-6" />}
          />
        ) : (
          <Card variant="elevated" padding="sm" className="space-y-3 rounded-[var(--radius-2xl)]">
            {sources.map((source) => {
              const result = testResults[source.id];
              return (
                <div
                  key={source.id}
                  className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-4 shadow-[var(--shadow-xs)] md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{source.name}</h2>
                      <Badge tone={source.isActive ? 'success' : 'error'} variant="soft">
                        {source.isActive ? '活跃' : '停用'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{source.category}</Badge>
                      <Badge variant="outline">{source.language}</Badge>
                      {source.country ? <Badge variant="outline">{source.country}</Badge> : null}
                    </div>
                    {result?.error ? (
                      <p className="mt-2 text-xs text-red-500">{result.error}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    {result ? (
                      result.success ? (
                        <div className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>{result.itemCount} 条</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-sm text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span>失败</span>
                        </div>
                      )
                    ) : null}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => testSource(source.id)}
                      disabled={testing === source.id}
                    >
                      {testing === source.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {testing === source.id ? '测试中' : '测试'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
