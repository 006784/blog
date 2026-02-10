'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, PenTool, Bell, Download, Search, 
  ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { EmotionAnalytics } from '@/components/EmotionAnalytics';
import { WritingHabitsTracker } from '@/components/WritingHabitsTracker';
import { SmartReminder } from '@/components/SmartReminder';
import { DataExport } from '@/components/DataExport';
import { DiarySearch } from '@/components/DiarySearch';
import type { SearchResult } from '@/lib/diary/search-service';

interface DiaryFeaturePanelProps {
  diaries: any[];
  isAdmin: boolean;
  onSearchResults?: (results: SearchResult[]) => void;
  onClearSearch?: () => void;
}

const featureTabs = [
  { id: 'search', label: '搜索', icon: Search, color: 'amber' },
  { id: 'analytics', label: '情绪分析', icon: BarChart3, color: 'purple' },
  { id: 'habits', label: '写作习惯', icon: PenTool, color: 'blue' },
  { id: 'reminder', label: '智能提醒', icon: Bell, color: 'green' },
  { id: 'export', label: '数据导出', icon: Download, color: 'orange' },
] as const;

type TabId = typeof featureTabs[number]['id'];

export function DiaryFeaturePanel({ 
  diaries, 
  isAdmin, 
  onSearchResults,
  onClearSearch 
}: DiaryFeaturePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('search');

  const handleSearchResults = (results: SearchResult[]) => {
    onSearchResults?.(results);
  };

  const handleClearSearch = () => {
    onClearSearch?.();
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      {/* 展开/收起按钮 */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400/80 transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
      >
        <Layers className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isExpanded ? '收起工具面板' : '展开工具面板'}
        </span>
        <span className="text-xs text-gray-500 ml-1">
          （搜索 · 分析 · 提醒 · 导出）
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </motion.button>

      {/* 展开的面板 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-amber-200/50 dark:border-amber-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
              {/* Tab 导航 */}
              <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-2 pt-2 gap-1 scrollbar-hide">
                {featureTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  // 只有管理员才能看到提醒和导出功能
                  if ((tab.id === 'reminder' || tab.id === 'export') && !isAdmin) return null;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 内容 */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {activeTab === 'search' && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DiarySearch
                        diaries={diaries}
                        onSearchResults={handleSearchResults}
                        onClearSearch={handleClearSearch}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EmotionAnalytics diaries={diaries} />
                    </motion.div>
                  )}

                  {activeTab === 'habits' && (
                    <motion.div
                      key="habits"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <WritingHabitsTracker diaries={diaries} />
                    </motion.div>
                  )}

                  {activeTab === 'reminder' && isAdmin && (
                    <motion.div
                      key="reminder"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SmartReminder />
                    </motion.div>
                  )}

                  {activeTab === 'export' && isAdmin && (
                    <motion.div
                      key="export"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DataExport diaries={diaries} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
