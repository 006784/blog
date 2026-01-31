// 情绪趋势分析服务
// 提供情绪变化图表、月度/年度报告、情绪与天气关联分析等功能

export interface EmotionDataPoint {
  date: string;
  mood: string;
  intensity: number; // 情绪强度 1-10
  weather?: string;
  temperature?: number;
  note?: string;
}

export interface EmotionTrend {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: EmotionDataPoint[];
  averageIntensity: number;
  dominantEmotions: { mood: string; count: number }[];
}

export interface EmotionReport {
  period: string;
  startDate: string;
  endDate: string;
  totalEntries: number;
  averageMood: string;
  averageIntensity: number;
  dominantEmotion: string;
  emotionDistribution: { mood: string; percentage: number; count: number }[];
  weatherImpact: { weather: string; avgIntensity: number; count: number }[];
  productivityInsights: {
    mostProductiveMood: string;
    leastProductiveMood: string;
    moodProductivityScore: { mood: string; score: number }[];
  };
  recommendations: string[];
}

export interface MoodAnalysis {
  mood: string;
  frequency: number;
  averageIntensity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  days: number;
}

export class EmotionAnalyticsService {
  /**
   * 分析情绪趋势数据
   */
  static analyzeEmotionTrends(diaries: any[]): EmotionTrend {
    // 提取情绪数据点
    const dataPoints: EmotionDataPoint[] = diaries
      .filter(diary => diary.mood && diary.mood_intensity)
      .map(diary => ({
        date: diary.diary_date,
        mood: diary.mood,
        intensity: diary.mood_intensity || 5, // 默认强度为5
        weather: diary.weather,
        temperature: diary.environment?.weather?.temperature,
        note: diary.title || diary.content.substring(0, 50) + '...'
      }));

    // 计算平均强度
    const totalIntensity = dataPoints.reduce((sum, dp) => sum + dp.intensity, 0);
    const averageIntensity = dataPoints.length > 0 ? totalIntensity / dataPoints.length : 0;

    // 计算主导情绪
    const moodCounts = dataPoints.reduce((acc, dp) => {
      acc[dp.mood] = (acc[dp.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotions = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 取前5个主导情绪

    return {
      period: 'monthly',
      data: dataPoints,
      averageIntensity: parseFloat(averageIntensity.toFixed(2)),
      dominantEmotions
    };
  }

  /**
   * 生成情绪报告
   */
  static generateEmotionReport(diaries: any[], period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): EmotionReport {
    const filteredDiaries = diaries.filter(diary => diary.mood && diary.diary_date);
    
    // 计算周期
    const dates = filteredDiaries.map(d => new Date(d.diary_date));
    const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    
    // 情绪分布
    const moodCounts = filteredDiaries.reduce((acc: Record<string, number>, diary: any) => {
      acc[diary.mood] = (acc[diary.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalEntries = filteredDiaries.length;
    const moodDistribution = Object.entries(moodCounts)
      .map(([mood, count]: [string, number]) => ({
        mood,
        count,
        percentage: parseFloat(((count / totalEntries) * 100).toFixed(1))
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // 平均情绪强度
    const totalIntensity = filteredDiaries.reduce((sum, diary) => sum + (diary.mood_intensity || 5), 0);
    const averageIntensity = totalEntries > 0 ? parseFloat((totalIntensity / totalEntries).toFixed(2)) : 0;
    
    // 主导情绪
    const dominantEmotion = moodDistribution.length > 0 ? moodDistribution[0].mood : 'Unknown';
    
    // 天气影响分析
    const weatherImpact = filteredDiaries.reduce((acc: Record<string, { totalIntensity: number; count: number }>, diary: any) => {
      const weather = diary.weather || 'Unknown';
      if (!acc[weather]) {
        acc[weather] = { totalIntensity: 0, count: 0 };
      }
      acc[weather].totalIntensity += diary.mood_intensity || 5;
      acc[weather].count += 1;
      return acc;
    }, {} as Record<string, { totalIntensity: number; count: number }>);

    const weatherImpactAnalysis = Object.entries(weatherImpact)
      .map(([weather, data]: [string, { totalIntensity: number; count: number }]) => ({
        weather,
        count: data.count,
        avgIntensity: parseFloat((data.totalIntensity / data.count).toFixed(2))
      }))
      .sort((a, b) => b.avgIntensity - a.avgIntensity);
    
    // 生产力洞察
    const moodProductivity = filteredDiaries.reduce((acc: Record<string, { totalIntensity: number; count: number }>, diary: any) => {
      const mood = diary.mood;
      if (!acc[mood]) {
        acc[mood] = { totalIntensity: 0, count: 0 };
      }
      acc[mood].totalIntensity += diary.mood_intensity || 5;
      acc[mood].count += 1;
      return acc;
    }, {} as Record<string, { totalIntensity: number; count: number }>);

    const moodProductivityScores = Object.entries(moodProductivity)
      .map(([mood, data]: [string, { totalIntensity: number; count: number }]) => ({
        mood,
        score: parseFloat((data.totalIntensity / data.count).toFixed(2))
      }))
      .sort((a, b) => b.score - a.score);

    const mostProductiveMood = moodProductivityScores.length > 0 ? moodProductivityScores[0].mood : 'Unknown';
    const leastProductiveMood = moodProductivityScores.length > 0 ? moodProductivityScores[moodProductivityScores.length - 1].mood : 'Unknown';
    
    // 推荐建议
    const recommendations = this.generateRecommendations({
      averageIntensity,
      dominantEmotion,
      moodDistribution,
      weatherImpact: weatherImpactAnalysis
    });
    
    return {
      period: `${period.charAt(0).toUpperCase() + period.slice(1)} Report`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalEntries,
      averageMood: dominantEmotion,
      averageIntensity,
      dominantEmotion,
      emotionDistribution: moodDistribution,
      weatherImpact: weatherImpactAnalysis,
      productivityInsights: {
        mostProductiveMood,
        leastProductiveMood,
        moodProductivityScore: moodProductivityScores
      },
      recommendations
    };
  }

  /**
   * 生成情绪分析
   */
  static analyzeMoods(diaries: any[]): MoodAnalysis[] {
    const moodData = diaries.reduce((acc: Record<string, { count: number; totalIntensity: number; dates: Date[] }>, diary: any) => {
      const mood = diary.mood;
      if (!mood) return acc;
      
      if (!acc[mood]) {
        acc[mood] = {
          count: 0,
          totalIntensity: 0,
          dates: []
        };
      }
      
      acc[mood].count += 1;
      acc[mood].totalIntensity += diary.mood_intensity || 5;
      acc[mood].dates.push(new Date(diary.diary_date));
      
      return acc;
    }, {} as Record<string, { count: number; totalIntensity: number; dates: Date[] }>);

    return Object.entries(moodData).map(([mood, data]: [string, { count: number; totalIntensity: number; dates: Date[] }]) => {
      const averageIntensity = data.count > 0 ? data.totalIntensity / data.count : 0;
      
      // 计算趋势 (基于最近的数据)
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (data.dates.length >= 2) {
        const sortedDates = data.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        const recentDate = sortedDates[sortedDates.length - 1];
        const previousDate = sortedDates[Math.max(0, sortedDates.length - 2)];
        
        // 这里简化趋势判断，实际应用中可能需要更复杂的算法
        if (recentDate.getTime() - previousDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
          // 如果最近两次记录间隔较短，暂时标记为稳定
          trend = 'stable';
        }
      }
      
      return {
        mood,
        frequency: data.count,
        averageIntensity: parseFloat(averageIntensity.toFixed(2)),
        trend,
        days: data.dates.length
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 获取情绪统计摘要
   */
  static getEmotionSummary(diaries: any[]): {
    totalEntries: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    averageIntensity: number;
    mostCommonMood: string;
    moodTrend: 'positive' | 'negative' | 'mixed' | 'neutral';
  } {
    const filteredDiaries = diaries.filter(d => d.mood && d.mood_intensity);
    const totalEntries = filteredDiaries.length;
    
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        averageIntensity: 0,
        mostCommonMood: 'Unknown',
        moodTrend: 'neutral'
      };
    }
    
    // 情绪分类（基于强度）
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    const moodCounts = filteredDiaries.reduce((acc, diary) => {
      const intensity = diary.mood_intensity || 5;
      acc[diary.mood] = (acc[diary.mood] || 0) + 1;
      
      if (intensity > 7) {
        positiveCount++;
      } else if (intensity < 4) {
        negativeCount++;
      } else {
        neutralCount++;
      }
      
      return acc;
    }, {} as Record<string, number>);
    
    // 计算百分比
    const positivePercentage = parseFloat(((positiveCount / totalEntries) * 100).toFixed(1));
    const negativePercentage = parseFloat(((negativeCount / totalEntries) * 100).toFixed(1));
    const neutralPercentage = parseFloat(((neutralCount / totalEntries) * 100).toFixed(1));
    
    // 平均强度
    const totalIntensity = filteredDiaries.reduce((sum, diary) => sum + (diary.mood_intensity || 5), 0);
    const averageIntensity = parseFloat((totalIntensity / totalEntries).toFixed(2));
    
    // 最常见情绪
    const mostCommonMood = Object.entries(moodCounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // 情绪趋势
    let moodTrend: 'positive' | 'negative' | 'mixed' | 'neutral' = 'neutral';
    if (positivePercentage > 60) {
      moodTrend = 'positive';
    } else if (negativePercentage > 60) {
      moodTrend = 'negative';
    } else if (positivePercentage > 0 && negativePercentage > 0) {
      moodTrend = 'mixed';
    }
    
    return {
      totalEntries,
      positivePercentage,
      negativePercentage,
      neutralPercentage,
      averageIntensity,
      mostCommonMood,
      moodTrend
    };
  }

  /**
   * 生成推荐建议
   */
  private static generateRecommendations(report: {
    averageIntensity: number;
    dominantEmotion: string;
    moodDistribution: { mood: string; percentage: number }[];
    weatherImpact: { weather: string; avgIntensity: number }[];
  }): string[] {
    const recommendations: string[] = [];
    
    // 基于平均强度的建议
    if (report.averageIntensity < 4) {
      recommendations.push('您的整体情绪偏低，建议多参与积极活动，或寻求朋友和家人的支持。');
    } else if (report.averageIntensity > 8) {
      recommendations.push('您最近情绪很高涨，继续保持这种积极状态！');
    }
    
    // 基于主导情绪的建议
    const dominantMoodPercent = report.moodDistribution.find(m => m.mood === report.dominantEmotion)?.percentage || 0;
    if (dominantMoodPercent > 50) {
      recommendations.push(`您最常出现的情绪是"${report.dominantEmotion}"，占比${dominantMoodPercent}%，这是您近期的主要情绪特征。`);
    }
    
    // 基于天气影响的建议
    if (report.weatherImpact.length > 0) {
      const bestWeather = report.weatherImpact[0];
      const worstWeather = report.weatherImpact[report.weatherImpact.length - 1];
      
      if (bestWeather && worstWeather && bestWeather.avgIntensity > worstWeather.avgIntensity + 1) {
        recommendations.push(`您在"${bestWeather.weather}"天气时情绪最好(平均强度${bestWeather.avgIntensity})，而在"${worstWeather.weather}"天气时情绪较低(平均强度${worstWeather.avgIntensity})，可以考虑在不同天气下安排不同的活动。`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('继续保持记录日记的习惯，这有助于您更好地了解自己的情绪变化。');
    }
    
    return recommendations;
  }

  /**
   * 计算情绪变化趋势
   */
  static calculateMoodTrend(diaries: any[], mood: string): {
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    confidence: number;
  } {
    const moodDiaries = diaries.filter(d => d.mood === mood && d.mood_intensity && d.diary_date);
    
    if (moodDiaries.length < 2) {
      return { trend: 'stable', slope: 0, confidence: 0 };
    }
    
    // 使用日期和强度值计算趋势线
    const data = moodDiaries
      .map(d => ({ date: new Date(d.diary_date).getTime(), intensity: d.mood_intensity || 5 }))
      .sort((a, b) => a.date - b.date);
    
    if (data.length < 2) {
      return { trend: 'stable', slope: 0, confidence: 0 };
    }
    
    // 简单线性回归计算斜率
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i; // 使用索引作为x值
      const y = data[i].intensity;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const confidence = Math.min(1, Math.abs(slope) * n / 10); // 简化的置信度计算
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (slope > 0.1) {
      trend = 'increasing';
    } else if (slope < -0.1) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }
    
    return { trend, slope: parseFloat(slope.toFixed(3)), confidence: parseFloat(confidence.toFixed(2)) };
  }
}