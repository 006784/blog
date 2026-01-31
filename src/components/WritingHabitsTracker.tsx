// 写作习惯追踪组件
'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Trophy, Clock, BarChart3, Star } from 'lucide-react';
import { WritingHabitsService, type WritingHabit, type WritingStatistics, type TimeAnalysis, type GoalSetting } from '@/lib/diary/writing-habits-service';

interface WritingHabitsTrackerProps {
  diaries: any[];
  className?: string;
}

export function WritingHabitsTracker({ diaries, className = '' }: WritingHabitsTrackerProps) {
  const [statistics, setStatistics] = useState<WritingStatistics | null>(null);
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis | null>(null);
  const [goals, setGoals] = useState<GoalSetting | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (diaries.length > 0) {
      setLoading(true);
      try {
        // 将日记数据转换为写作习惯数据
        const writingHabits: WritingHabit[] = diaries.map(diary => ({
          date: diary.diary_date,
          wordCount: diary.word_count || diary.content.length || 0,
          timeSpent: 30, // 假设每次写作约30分钟，实际应用中可以记录实际时间
          startTime: diary.created_at || new Date().toISOString(),
          mood: diary.mood || 'neutral',
          environment: diary.environment_data ? {
            weather: diary.weather || 'unknown',
            temperature: diary.environment_data?.weather?.temperature || 0,
            location: diary.location || 'unknown'
          } : undefined
        }));

        const stats = WritingHabitsService.calculateWritingStatistics(writingHabits);
        const timeAnalysisResult = WritingHabitsService.analyzeTimePatterns(writingHabits);
        const goalsResult = WritingHabitsService.trackGoals(writingHabits);
        const suggestionsResult = WritingHabitsService.generateWritingSuggestions(writingHabits);
        const milestonesResult = WritingHabitsService.getMilestones(writingHabits);

        setStatistics(stats);
        setTimeAnalysis(timeAnalysisResult);
        setGoals(goalsResult);
        setSuggestions(suggestionsResult);
        setMilestones(milestonesResult);
      } catch (error) {
        console.error('分析写作习惯失败:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [diaries]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在分析写作习惯...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics || statistics.totalDays === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无写作数据</h3>
          <p className="text-gray-600">写几篇日记，即可生成写作习惯分析报告</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-amber-500" />
        写作习惯追踪
      </h3>

      {/* 统计摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">写作天数</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{statistics.totalDays}</div>
          <div className="text-xs text-blue-700">天</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">总字数</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{statistics.totalWords}</div>
          <div className="text-xs text-green-700">字</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">平均每日</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{statistics.averageWordsPerDay}</div>
          <div className="text-xs text-purple-700">字/天</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">连续天数</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{statistics.streakDays}</div>
          <div className="text-xs text-amber-700">当前连击</div>
        </div>
      </div>

      {/* 目标追踪 */}
      {goals && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            目标追踪
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-cyan-800">每日字数目标</span>
                <span className="text-sm font-bold text-cyan-900">{goals.currentProgress.daily}/{goals.dailyWordGoal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (goals.currentProgress.daily / goals.dailyWordGoal) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-800">每周字数目标</span>
                <span className="text-sm font-bold text-emerald-900">{goals.currentProgress.weekly}/{goals.weeklyGoal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (goals.currentProgress.weekly / goals.weeklyGoal) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-violet-800">连续写作目标</span>
                <span className="text-sm font-bold text-violet-900">{statistics.streakDays}/{goals.streakGoal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-400 to-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (statistics.streakDays / goals.streakGoal) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 时间分析 */}
      {timeAnalysis && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            时间分析
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">最佳写作时段</h5>
              <p className="text-lg font-bold text-amber-600">{timeAnalysis.bestTimeOfDay}</p>
              <p className="text-sm text-gray-600">在这个时段写作效率最高</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">高效时段</h5>
              <div className="flex flex-wrap gap-2">
                {timeAnalysis.peakHours.slice(0, 3).map((hour, index) => (
                  <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    {hour}:00-{hour}:59
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 里程碑 */}
      {milestones.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            达成的里程碑
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {milestones.slice(0, 4).map((milestone, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-yellow-800">{milestone.title}</div>
                  <div className="text-sm text-yellow-700">{milestone.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 个性化建议 */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" />
            个性化建议
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 text-sm text-blue-800">
                • {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}