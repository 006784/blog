// 写作习惯追踪服务
// 提供写作频率统计、最佳时间分析、字数目标设定等功能

export interface WritingHabit {
  date: string;
  wordCount: number;
  timeSpent: number; // 写作时长（分钟）
  startTime: string; // 开始时间
  mood: string;
  environment?: {
    weather: string;
    temperature: number;
    location: string;
  };
}

export interface WritingStatistics {
  totalDays: number;
  totalWords: number;
  totalWritingTime: number; // 总写作时间（分钟）
  averageWordsPerDay: number;
  averageTimePerDay: number;
  consistencyRate: number; // 连续写作率
  streakDays: number; // 当前连续天数
  longestStreak: number; // 最长连续天数
}

export interface TimeAnalysis {
  bestTimeOfDay: string; // 最佳写作时段
  peakHours: number[]; // 高产小时段
  dayOfWeekAnalysis: {
    [day: string]: {
      averageWords: number;
      averageTime: number;
      frequency: number;
    };
  };
  monthlyTrends: {
    [month: string]: {
      totalWords: number;
      averageWords: number;
      daysWritten: number;
    };
  };
}

export interface GoalSetting {
  dailyWordGoal: number;
  weeklyGoal: number;
  streakGoal: number;
  currentProgress: {
    daily: number;
    weekly: number;
    streak: number;
  };
  achievementRate: number; // 目标达成率
}

export class WritingHabitsService {
  /**
   * 计算写作统计数据
   */
  static calculateWritingStatistics(habits: WritingHabit[]): WritingStatistics {
    if (habits.length === 0) {
      return {
        totalDays: 0,
        totalWords: 0,
        totalWritingTime: 0,
        averageWordsPerDay: 0,
        averageTimePerDay: 0,
        consistencyRate: 0,
        streakDays: 0,
        longestStreak: 0
      };
    }

    const totalDays = habits.length;
    const totalWords = habits.reduce((sum, habit) => sum + habit.wordCount, 0);
    const totalWritingTime = habits.reduce((sum, habit) => sum + habit.timeSpent, 0);
    const averageWordsPerDay = totalDays > 0 ? totalWords / totalDays : 0;
    const averageTimePerDay = totalDays > 0 ? totalWritingTime / totalDays : 0;

    // 计算连续天数
    const sortedHabits = [...habits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < sortedHabits.length; i++) {
      const currentDate = new Date(sortedHabits[i].date);
      const previousDate = new Date(sortedHabits[i - 1].date);
      const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    // 计算一致性率（假设理想情况下每天都写作）
    const firstDate = new Date(sortedHabits[0].date);
    const lastDate = new Date(sortedHabits[sortedHabits.length - 1].date);
    const totalPossibleDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const consistencyRate = totalPossibleDays > 0 ? (totalDays / totalPossibleDays) * 100 : 0;

    return {
      totalDays,
      totalWords,
      totalWritingTime,
      averageWordsPerDay: Math.round(averageWordsPerDay),
      averageTimePerDay: Math.round(averageTimePerDay),
      consistencyRate: parseFloat(consistencyRate.toFixed(1)),
      streakDays: currentStreak,
      longestStreak
    };
  }

  /**
   * 分析最佳写作时间
   */
  static analyzeTimePatterns(habits: WritingHabit[]): TimeAnalysis {
    if (habits.length === 0) {
      return {
        bestTimeOfDay: '未知',
        peakHours: [],
        dayOfWeekAnalysis: {},
        monthlyTrends: {}
      };
    }

    // 按小时统计
    const hourlyStats: { [hour: string]: { words: number; time: number; count: number } } = {};
    // 按星期统计
    const dayOfWeekStats: { [day: string]: { words: number; time: number; count: number } } = {};
    // 按月份统计
    const monthlyStats: { [month: string]: { words: number; time: number; count: number } } = {};

    habits.forEach(habit => {
      const date = new Date(habit.startTime);
      const hour = date.getHours();
      const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'long' });
      const month = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });

      // 小时统计
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { words: 0, time: 0, count: 0 };
      }
      hourlyStats[hour].words += habit.wordCount;
      hourlyStats[hour].time += habit.timeSpent;
      hourlyStats[hour].count++;

      // 星期统计
      if (!dayOfWeekStats[dayOfWeek]) {
        dayOfWeekStats[dayOfWeek] = { words: 0, time: 0, count: 0 };
      }
      dayOfWeekStats[dayOfWeek].words += habit.wordCount;
      dayOfWeekStats[dayOfWeek].time += habit.timeSpent;
      dayOfWeekStats[dayOfWeek].count++;

      // 月度统计
      if (!monthlyStats[month]) {
        monthlyStats[month] = { words: 0, time: 0, count: 0 };
      }
      monthlyStats[month].words += habit.wordCount;
      monthlyStats[month].time += habit.timeSpent;
      monthlyStats[month].count++;
    });

    // 找出最佳时段
    let bestHour = 0;
    let maxAvgWordsPerHour = 0;
    for (const [hour, stats] of Object.entries(hourlyStats)) {
      const avgWords = stats.words / stats.count;
      if (avgWords > maxAvgWordsPerHour) {
        maxAvgWordsPerHour = avgWords;
        bestHour = parseInt(hour);
      }
    }

    // 找出高峰小时
    const peakHours = Object.entries(hourlyStats)
      .sort((a, b) => (b[1].words / b[1].count) - (a[1].words / a[1].count))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // 格式化星期分析
    const dayOfWeekAnalysis: TimeAnalysis['dayOfWeekAnalysis'] = {};
    for (const [day, stats] of Object.entries(dayOfWeekStats)) {
      dayOfWeekAnalysis[day] = {
        averageWords: Math.round(stats.words / stats.count),
        averageTime: Math.round(stats.time / stats.count),
        frequency: stats.count
      };
    }

    // 格式化月度趋势
    const monthlyTrends: TimeAnalysis['monthlyTrends'] = {};
    for (const [month, stats] of Object.entries(monthlyStats)) {
      monthlyTrends[month] = {
        totalWords: stats.words,
        averageWords: Math.round(stats.words / stats.count),
        daysWritten: stats.count
      };
    }

    return {
      bestTimeOfDay: `${bestHour.toString().padStart(2, '0')}:00 - ${bestHour.toString().padStart(2, '0')}:59`,
      peakHours,
      dayOfWeekAnalysis,
      monthlyTrends
    };
  }

  /**
   * 设置和追踪目标
   */
  static trackGoals(habits: WritingHabit[], goals: Partial<GoalSetting> = {}): GoalSetting {
    const defaultGoals: GoalSetting = {
      dailyWordGoal: 300,
      weeklyGoal: 2100,
      streakGoal: 7,
      currentProgress: {
        daily: 0,
        weekly: 0,
        streak: 0
      },
      achievementRate: 0
    };

    const finalGoals = { ...defaultGoals, ...goals };

    // 计算当前进度
    const today = new Date().toISOString().split('T')[0];
    const todayHabit = habits.find(h => h.date === today);
    finalGoals.currentProgress.daily = todayHabit ? todayHabit.wordCount : 0;

    // 计算本周进度
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyHabits = habits.filter(h => new Date(h.date) >= oneWeekAgo);
    finalGoals.currentProgress.weekly = weeklyHabits.reduce((sum, h) => sum + h.wordCount, 0);

    // 获取当前连续天数
    const stats = this.calculateWritingStatistics(habits);
    finalGoals.currentProgress.streak = stats.streakDays;

    // 计算达成率
    const dailyAchieved = finalGoals.currentProgress.daily >= finalGoals.dailyWordGoal ? 1 : 0;
    const weeklyAchieved = finalGoals.currentProgress.weekly >= finalGoals.weeklyGoal ? 1 : 0;
    const streakAchieved = stats.streakDays >= finalGoals.streakGoal ? 1 : 0;
    finalGoals.achievementRate = parseFloat(((dailyAchieved + weeklyAchieved + streakAchieved) / 3 * 100).toFixed(1));

    return finalGoals;
  }

  /**
   * 生成写作建议
   */
  static generateWritingSuggestions(habits: WritingHabit[]): string[] {
    const suggestions: string[] = [];
    if (habits.length === 0) {
      return ['开始记录您的第一次写作，养成写作习惯'];
    }

    const stats = this.calculateWritingStatistics(habits);
    const timeAnalysis = this.analyzeTimePatterns(habits);

    // 基于平均字数的建议
    if (stats.averageWordsPerDay < 200) {
      suggestions.push(`您的平均每日字数是${stats.averageWordsPerDay}字，可以尝试设定较小的目标逐步提升写作量`);
    } else if (stats.averageWordsPerDay > 1000) {
      suggestions.push(`您的写作量很丰富！平均每天${stats.averageWordsPerDay}字，注意适当休息保持长期写作`);
    }

    // 基于连续性的建议
    if (stats.consistencyRate < 50) {
      suggestions.push(`您的写作连续性有待提高，目前连续率为${stats.consistencyRate}%，建议设定固定时间写作`);
    } else if (stats.longestStreak < 7) {
      suggestions.push(`尝试挑战连续写作7天以上，目前最长连续${stats.longestStreak}天`);
    }

    // 基于时间分析的建议
    if (timeAnalysis.bestTimeOfDay && timeAnalysis.bestTimeOfDay !== '未知') {
      suggestions.push(`数据显示您在${timeAnalysis.bestTimeOfDay}写作效率最高，可以考虑在这个时段安排写作`);
    }

    // 基于星期分析的建议
    const sortedDays = Object.entries(timeAnalysis.dayOfWeekAnalysis)
      .sort((a, b) => b[1].averageWords - a[1].averageWords);
    if (sortedDays.length > 0) {
      const bestDay = sortedDays[0];
      suggestions.push(`您在${bestDay[0]}的写作效率最高，平均产出${bestDay[1].averageWords}字`);
    }

    if (suggestions.length === 0) {
      suggestions.push('您的写作习惯很好，继续保持！');
    }

    return suggestions;
  }

  /**
   * 预测未来写作表现
   */
  static predictFuturePerformance(habits: WritingHabit[]): {
    predictedMonthlyWords: number;
    growthTrend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  } {
    if (habits.length < 7) {
      return {
        predictedMonthlyWords: 0,
        growthTrend: 'stable',
        confidence: 0
      };
    }

    // 获取最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHabits = habits.filter(h => new Date(h.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentHabits.length < 7) {
      // 如果最近30天数据不足7天，使用全部数据
      const sortedHabits = [...habits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortedHabits.length < 7) {
        return {
          predictedMonthlyWords: 0,
          growthTrend: 'stable',
          confidence: 0
        };
      }
      return this.calculatePrediction(sortedHabits);
    }

    return this.calculatePrediction(recentHabits);
  }

  private static calculatePrediction(habits: WritingHabit[]) {
    // 使用最近数据的趋势进行预测
    const totalWords = habits.reduce((sum, habit) => sum + habit.wordCount, 0);
    const avgDailyWords = totalWords / habits.length;

    // 计算趋势
    let trendValue = 0;
    if (habits.length >= 14) {
      const firstHalf = habits.slice(0, Math.floor(habits.length / 2));
      const secondHalf = habits.slice(Math.floor(habits.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, h) => sum + h.wordCount, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, h) => sum + h.wordCount, 0) / secondHalf.length;
      
      trendValue = secondAvg - firstAvg;
    }

    let growthTrend: 'increasing' | 'decreasing' | 'stable';
    if (trendValue > 50) {
      growthTrend = 'increasing';
    } else if (trendValue < -50) {
      growthTrend = 'decreasing';
    } else {
      growthTrend = 'stable';
    }

    // 预测下个月的字数
    let predictedMonthlyWords = avgDailyWords * 30;
    if (growthTrend === 'increasing') {
      predictedMonthlyWords *= 1.1; // 增加10%
    } else if (growthTrend === 'decreasing') {
      predictedMonthlyWords *= 0.9; // 减少10%
    }

    // 计算置信度
    const confidence = Math.min(1, Math.abs(trendValue) / 100);

    return {
      predictedMonthlyWords: Math.round(predictedMonthlyWords),
      growthTrend,
      confidence: parseFloat(confidence.toFixed(2))
    };
  }

  /**
   * 获取写作里程碑
   */
  static getMilestones(habits: WritingHabit[]): Array<{
    title: string;
    description: string;
    achieved: boolean;
    date?: string;
  }> {
    const stats = this.calculateWritingStatistics(habits);
    const milestones = [];

    // 字数里程碑
    milestones.push({
      title: '千字新手',
      description: '累计写作达到1,000字',
      achieved: stats.totalWords >= 1000,
      date: this.getMilestoneDate(habits, 'words', 1000)
    });

    milestones.push({
      title: '万字达人',
      description: '累计写作达到10,000字',
      achieved: stats.totalWords >= 10000,
      date: this.getMilestoneDate(habits, 'words', 10000)
    });

    milestones.push({
      title: '作家起步',
      description: '累计写作达到50,000字',
      achieved: stats.totalWords >= 50000,
      date: this.getMilestoneDate(habits, 'words', 50000)
    });

    // 连续写作里程碑
    milestones.push({
      title: '一周连更',
      description: '连续写作达到7天',
      achieved: stats.longestStreak >= 7,
      date: stats.longestStreak >= 7 ? new Date().toISOString().split('T')[0] : undefined
    });

    milestones.push({
      title: '月度坚持',
      description: '连续写作达到30天',
      achieved: stats.longestStreak >= 30,
      date: stats.longestStreak >= 30 ? new Date().toISOString().split('T')[0] : undefined
    });

    // 高产里程碑
    milestones.push({
      title: '高产日',
      description: '单日写作超过1000字',
      achieved: habits.some(h => h.wordCount >= 1000),
      date: habits.find(h => h.wordCount >= 1000)?.date
    });

    return milestones.filter(m => m.achieved); // 只返回已达成的里程碑
  }

  private static getMilestoneDate(habits: WritingHabit[], type: 'words', threshold: number): string | undefined {
    if (type === 'words') {
      let cumulativeWords = 0;
      for (const habit of habits) {
        cumulativeWords += habit.wordCount;
        if (cumulativeWords >= threshold) {
          return habit.date;
        }
      }
    }
    return undefined;
  }
}