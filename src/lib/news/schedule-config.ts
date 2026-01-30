// 定时新闻发送配置
export interface ScheduledNewsConfig {
  cronExpression: string;  // Cron表达式
  sendTime: string;        // 发送时间 (HH:mm格式)
  timezone: string;        // 时区
  recipientEmail: string;  // 收件人邮箱
  enabled: boolean;        // 是否启用
  categories: string[];    // 收集的分类
  minImportanceScore: number; // 最小重要性分数
  maxItemsPerCategory: number; // 每分类最大条数
}

// 默认配置
export const DEFAULT_SCHEDULED_CONFIG: ScheduledNewsConfig = {
  cronExpression: '0 30 8 * * *', // 每天上午8:30执行
  sendTime: '08:30',
  timezone: 'Asia/Shanghai',
  recipientEmail: '2047389870@qq.com',
  enabled: true,
  categories: ['international', 'technology', 'business', 'politics', 'science'],
  minImportanceScore: 60,
  maxItemsPerCategory: 5
};

// 预设的定时配置选项
export const SCHEDULE_OPTIONS = [
  {
    id: 'morning',
    name: '早晨推送',
    description: '每天上午8:30推送',
    cron: '0 30 8 * * *',
    time: '08:30'
  },
  {
    id: 'noon',
    name: '午间推送',
    description: '每天中午12:00推送',
    cron: '0 0 12 * * *',
    time: '12:00'
  },
  {
    id: 'evening',
    name: '晚间推送',
    description: '每天晚上19:00推送',
    cron: '0 0 19 * * *',
    time: '19:00'
  },
  {
    id: 'twice_daily',
    name: '每日两次',
    description: '上午8:30和晚上19:00各推送一次',
    cron: '0 30 8,19 * * *',
    time: '08:30,19:00'
  }
];

// 定时任务状态
export interface ScheduleStatus {
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

// 定时任务管理器
export class ScheduleManager {
  private static instance: ScheduleManager;
  private schedules: Map<string, ScheduledNewsConfig> = new Map();
  private statuses: Map<string, ScheduleStatus> = new Map();

  private constructor() {}

  static getInstance(): ScheduleManager {
    if (!ScheduleManager.instance) {
      ScheduleManager.instance = new ScheduleManager();
    }
    return ScheduleManager.instance;
  }

  // 添加定时任务
  addSchedule(id: string, config: ScheduledNewsConfig) {
    this.schedules.set(id, config);
    this.statuses.set(id, {
      totalRuns: 0,
      successCount: 0,
      failureCount: 0
    });
  }

  // 获取所有定时任务
  getAllSchedules(): { id: string; config: ScheduledNewsConfig; status: ScheduleStatus }[] {
    const result = [];
    for (const [id, config] of this.schedules) {
      result.push({
        id,
        config,
        status: this.statuses.get(id) || {
          totalRuns: 0,
          successCount: 0,
          failureCount: 0
        }
      });
    }
    return result;
  }

  // 更新任务状态
  updateStatus(scheduleId: string, success: boolean, error?: string) {
    const status = this.statuses.get(scheduleId);
    if (status) {
      status.totalRuns++;
      if (success) {
        status.successCount++;
      } else {
        status.failureCount++;
        status.lastError = error;
      }
      status.lastRun = new Date();
    }
  }

  // 获取下次执行时间（简化版）
  getNextRunTime(cronExpression: string): Date {
    // 这里应该使用真正的cron解析库
    // 现在返回明天的相同时间作为示例
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}