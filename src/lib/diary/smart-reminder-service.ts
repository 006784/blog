// 智能提醒系统服务
// 提供定时提醒、特殊日期提醒、位置触发提醒、天气变化提醒等功能

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special_date' | 'location' | 'weather';
  schedule: string; // Cron表达式或特殊日期
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  nextTrigger?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // 触发半径（米）
    name: string;
  };
  weatherConditions?: {
    temperatureThreshold?: number; // 温度阈值
    weatherTypes?: string[]; // 天气类型 ['sunny', 'rainy', 'cloudy', 'snowy']
    location: string; // 地点
  };
  userId?: string; // 用户ID（如果需要）
}

export interface ReminderNotification {
  id: string;
  reminderId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  triggeredBy: 'schedule' | 'location' | 'weather';
}

export class SmartReminderService {
  private static readonly STORAGE_KEY = 'smart_reminders';
  private static readonly NOTIFICATION_KEY = 'reminder_notifications';

  /**
   * 创建新提醒
   */
  static async createReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'enabled'>): Promise<Reminder> {
    const newReminder: Reminder = {
      ...reminder,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      enabled: true
    };

    const reminders = await this.getReminders();
    reminders.push(newReminder);
    await this.saveReminders(reminders);

    return newReminder;
  }

  /**
   * 获取所有提醒
   */
  static async getReminders(): Promise<Reminder[]> {
    if (typeof window === 'undefined') {
      return []; // 服务端返回空数组
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取提醒失败:', error);
      return [];
    }
  }

  /**
   * 保存提醒列表
   */
  static async saveReminders(reminders: Reminder[]): Promise<void> {
    if (typeof window === 'undefined') {
      return; // 服务端不执行
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('保存提醒失败:', error);
    }
  }

  /**
   * 更新提醒
   */
  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<boolean> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === id);

    if (index === -1) return false;

    reminders[index] = { ...reminders[index], ...updates };
    await this.saveReminders(reminders);
    return true;
  }

  /**
   * 删除提醒
   */
  static async deleteReminder(id: string): Promise<boolean> {
    const reminders = await this.getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    
    if (filtered.length === reminders.length) return false;
    
    await this.saveReminders(filtered);
    return true;
  }

  /**
   * 获取所有通知
   */
  static async getNotifications(): Promise<ReminderNotification[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.NOTIFICATION_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取通知失败:', error);
      return [];
    }
  }

  /**
   * 保存通知
   */
  static async saveNotifications(notifications: ReminderNotification[]): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.NOTIFICATION_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('保存通知失败:', error);
    }
  }

  /**
   * 添加通知
   */
  static async addNotification(notification: Omit<ReminderNotification, 'id' | 'timestamp'>): Promise<ReminderNotification> {
    const newNotification: ReminderNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false
    };

    const notifications = await this.getNotifications();
    notifications.unshift(newNotification); // 添加到开头
    await this.saveNotifications(notifications);

    return newNotification;
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(id: string): Promise<boolean> {
    const notifications = await this.getNotifications();
    const notification = notifications.find(n => n.id === id);

    if (!notification) return false;

    notification.read = true;
    await this.saveNotifications(notifications);
    return true;
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(): Promise<boolean> {
    const notifications = await this.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    if (unreadCount === 0) return true;

    notifications.forEach(n => n.read = true);
    await this.saveNotifications(notifications);
    return true;
  }

  /**
   * 检查是否有待处理的提醒（按时间）
   */
  static async checkScheduledReminders(): Promise<ReminderNotification[]> {
    const reminders = await this.getReminders();
    const activeReminders = reminders.filter(r => r.enabled && r.type !== 'location' && r.type !== 'weather');

    const now = new Date();
    const dueReminders: ReminderNotification[] = [];

    for (const reminder of activeReminders) {
      // 对于特殊日期类型的提醒
      if (reminder.type === 'special_date') {
        const reminderDate = new Date(reminder.schedule);
        // 检查是否是今天且尚未触发
        if (
          reminderDate.getDate() === now.getDate() &&
          reminderDate.getMonth() === now.getMonth() &&
          reminderDate.getFullYear() === now.getFullYear()
        ) {
          // 检查是否今天尚未触发
          if (!reminder.lastTriggered || new Date(reminder.lastTriggered).getDate() !== now.getDate()) {
            dueReminders.push({
              id: this.generateId(),
              reminderId: reminder.id,
              title: reminder.title,
              message: reminder.description || `该写日记了: ${reminder.title}`,
              timestamp: now.toISOString(),
              read: false,
              triggeredBy: 'schedule'
            });
          }
        }
      }
      // 对于日常提醒，这里简化处理，实际应该解析cron表达式
      else if (['daily', 'weekly', 'monthly'].includes(reminder.type)) {
        // 检查今天是否已经触发过
        if (!reminder.lastTriggered || new Date(reminder.lastTriggered).getDate() !== now.getDate()) {
          dueReminders.push({
            id: this.generateId(),
            reminderId: reminder.id,
            title: reminder.title,
            message: reminder.description || `记得写日记: ${reminder.title}`,
            timestamp: now.toISOString(),
            read: false,
            triggeredBy: 'schedule'
          });
        }
      }
    }

    return dueReminders;
  }

  /**
   * 检查位置相关的提醒
   */
  static async checkLocationReminders(currentPosition: { latitude: number; longitude: number }): Promise<ReminderNotification[]> {
    const reminders = await this.getReminders();
    const locationReminders = reminders.filter(r => r.enabled && r.type === 'location' && r.location);

    const triggeredReminders: ReminderNotification[] = [];

    for (const reminder of locationReminders) {
      if (!reminder.location) continue;

      const distance = this.calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        reminder.location.latitude,
        reminder.location.longitude
      );

      if (distance <= reminder.location.radius) {
        triggeredReminders.push({
          id: this.generateId(),
          reminderId: reminder.id,
          title: reminder.title,
          message: `您已到达 ${reminder.location.name}，${reminder.description || '该写日记了'}`,
          timestamp: new Date().toISOString(),
          read: false,
          triggeredBy: 'location'
        });
      }
    }

    return triggeredReminders;
  }

  /**
   * 检查天气相关的提醒
   */
  static async checkWeatherReminders(weatherData: {
    location: string;
    temperature: number;
    condition: string;
  }): Promise<ReminderNotification[]> {
    const reminders = await this.getReminders();
    const weatherReminders = reminders.filter(r => r.enabled && r.type === 'weather' && r.weatherConditions);

    const triggeredReminders: ReminderNotification[] = [];

    for (const reminder of weatherReminders) {
      if (!reminder.weatherConditions) continue;

      const conditions = reminder.weatherConditions;
      
      // 检查地点是否匹配
      if (conditions.location && conditions.location !== weatherData.location) {
        continue;
      }

      let shouldTrigger = false;

      // 检查温度条件
      if (conditions.temperatureThreshold !== undefined) {
        if (conditions.temperatureThreshold > 0) { // 高温提醒
          if (weatherData.temperature >= conditions.temperatureThreshold) {
            shouldTrigger = true;
          }
        } else { // 低温提醒（负数表示低温）
          if (weatherData.temperature <= Math.abs(conditions.temperatureThreshold)) {
            shouldTrigger = true;
          }
        }
      }

      // 检查天气类型
      if (conditions.weatherTypes && conditions.weatherTypes.length > 0) {
        if (conditions.weatherTypes.includes(weatherData.condition.toLowerCase())) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        triggeredReminders.push({
          id: this.generateId(),
          reminderId: reminder.id,
          title: reminder.title,
          message: `天气变化提醒: ${weatherData.condition}，温度${weatherData.temperature}°C，${reminder.description || '适合记录心情'}`,
          timestamp: new Date().toISOString(),
          read: false,
          triggeredBy: 'weather'
        });
      }
    }

    return triggeredReminders;
  }

  /**
   * 计算两点间距离（米）
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  /**
   * 清理过期的通知（保留最近30天的）
   */
  static async cleanupOldNotifications(): Promise<void> {
    const notifications = await this.getNotifications();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNotifications = notifications.filter(
      n => new Date(n.timestamp) >= thirtyDaysAgo
    );
    
    await this.saveNotifications(recentNotifications);
  }

  /**
   * 获取近期通知
   */
  static async getRecentNotifications(days = 7): Promise<ReminderNotification[]> {
    const notifications = await this.getNotifications();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return notifications.filter(
      n => new Date(n.timestamp) >= cutoffDate
    );
  }
}