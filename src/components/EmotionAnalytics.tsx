// 情绪趋势分析组件
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart3, PieChart, AlertTriangle, Star, Clock } from 'lucide-react';
import { EmotionAnalyticsService, type EmotionReport, type MoodAnalysis } from '@/lib/diary/emotion-analytics-service';

interface EmotionAnalyticsProps {
  diaries: any[];
  className?: string;
}

export function EmotionAnalytics({ diaries, className = '' }: EmotionAnalyticsProps) {
  const [report, setReport] = useState<EmotionReport | null>(null);
  const [moodAnalyses, setMoodAnalyses] = useState<MoodAnalysis[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (diaries.length > 0) {
      setLoading(true);
      try {
        const generatedReport = EmotionAnalyticsService.generateEmotionReport(diaries, selectedPeriod);
        const analyses = EmotionAnalyticsService.analyzeMoods(diaries);
        
        setReport(generatedReport);
        setMoodAnalyses(analyses);
      } catch (error) {
        console.error('生成情绪报告失败:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [diaries, selectedPeriod]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在分析情绪趋势...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report || report.totalEntries === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无情绪数据</h3>
          <p className="text-gray-600">写几篇带情绪标签的日记，即可生成情绪趋势分析报告</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          情绪趋势分析
        </h3>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="weekly">周报</option>
            <option value="monthly">月报</option>
            <option value="yearly">年报</option>
          </select>
        </div>
      </div>

      {/* 摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">总记录</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{report.totalEntries}</div>
          <div className="text-xs text-blue-700">篇日记</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">平均强度</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{report.averageIntensity}</div>
          <div className="text-xs text-green-700">/10</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">主导情绪</span>
          </div>
          <div className="text-lg font-bold text-purple-900 truncate">{report.dominantEmotion}</div>
          <div className="text-xs text-purple-700">最常见情绪</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">分析期间</span>
          </div>
          <div className="text-sm font-bold text-amber-900">{report.startDate}</div>
          <div className="text-xs text-amber-700">至 {report.endDate}</div>
        </div>
      </div>

      {/* 情绪分布图表 */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          情绪分布
        </h4>
        <div className="space-y-2">
          {report.emotionDistribution.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-gray-700 truncate">{item.mood}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="w-12 text-right text-sm text-gray-600">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 天气影响分析 */}
      {report.weatherImpact.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            天气对情绪的影响
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {report.weatherImpact.slice(0, 4).map((item, index) => (
              <div 
                key={index} 
                className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200"
              >
                <div className="font-medium text-cyan-800 mb-1">{item.weather}</div>
                <div className="text-sm text-cyan-600">平均强度: {item.avgIntensity}</div>
                <div className="text-xs text-cyan-500">{item.count} 次记录</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 情绪分析详情 */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          情绪分析详情
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moodAnalyses.slice(0, 4).map((analysis, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{analysis.mood}</h5>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  analysis.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                  analysis.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {analysis.trend === 'increasing' ? '上升' : analysis.trend === 'decreasing' ? '下降' : '稳定'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>出现频率: {analysis.frequency} 次</div>
                <div>平均强度: {analysis.averageIntensity}/10</div>
                <div>持续天数: {analysis.days} 天</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推荐建议 */}
      {report.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" />
            个性推荐
          </h4>
          <div className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 text-sm text-amber-800">
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}