'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  Settings, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Globe,
  Server,
  AlertCircle
} from 'lucide-react';

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
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningTest, setRunningTest] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news/sources');
      const data = await response.json();
      if (data.success) {
        setSources(data.data);
      }
    } catch (error) {
      console.error('加载新闻源失败:', error);
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
        body: JSON.stringify({ sourceId })
      });
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [sourceId]: data.data }));
    } catch (error) {
      console.error('测试新闻源失败:', error);
      setTestResults(prev => ({ 
        ...prev, 
        [sourceId]: { success: false, itemCount: 0, error: '测试失败' } 
      }));
    } finally {
      setTesting(null);
    }
  };

  const runFullTest = async () => {
    try {
      setRunningTest(true);
      const response = await fetch('/api/news/test?test=true');
      const data = await response.json();
      console.log('完整测试结果:', data);
      // 可以在这里显示测试结果
    } catch (error) {
      console.error('完整测试失败:', error);
    } finally {
      setRunningTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Newspaper className="w-8 h-8" />
              新闻收集管理系统
            </h1>
            <p className="text-muted-foreground mt-2">
              管理新闻源和监控收集状态
            </p>
          </div>
          <button 
            onClick={runFullTest} 
            disabled={runningTest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {runningTest ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                运行完整测试
              </>
            )}
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总新闻源</p>
                <p className="text-2xl font-bold">{sources.length}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃源</p>
                <p className="text-2xl font-bold">
                  {sources.filter(s => s.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">语言种类</p>
                <p className="text-2xl font-bold">
                  {new Set(sources.map(s => s.language)).size}
                </p>
              </div>
              <Server className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">分类数量</p>
                <p className="text-2xl font-bold">
                  {new Set(sources.map(s => s.category)).size}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 新闻源列表 */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              新闻源管理
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sources.map((source) => (
                <div 
                  key={source.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{source.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {source.category}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {source.language}
                        </span>
                        {source.country && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {source.country}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded ${source.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {source.isActive ? "活跃" : "停用"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {testResults[source.id] && (
                      <div className="flex items-center gap-2 text-sm">
                        {testResults[source.id].success ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{testResults[source.id].itemCount}条</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span>失败</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => testSource(source.id)}
                      disabled={testing === source.id}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      {testing === source.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                          测试中
                        </>
                      ) : (
                        '测试'
                      )}
                    </button>
                  </div>
                </div>
              ))}
              
              {sources.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无新闻源配置</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}