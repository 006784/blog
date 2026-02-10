// 多设备同步服务
// 提供实时同步、离线支持、冲突解决等功能

export interface SyncConfig {
  syncEnabled: boolean;
  syncFrequency: 'realtime' | 'interval';
  syncInterval: number; // 同步间隔（秒）
  offlineSupport: boolean;
  conflictResolution: 'manual' | 'automatic' | 'server_wins' | 'client_wins';
  encryption: boolean;
  compression: boolean;
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  nextSync: string | null;
  pendingChanges: number;
  syncProgress: number;
  error: string | null;
}

export interface SyncConflict {
  id: string;
  type: 'create' | 'update' | 'delete';
  localVersion: any;
  remoteVersion: any;
  timestamp: string;
  resolved: boolean;
  resolution: 'keep_local' | 'keep_remote' | 'merge' | 'discard' | null;
}

export interface SyncHistory {
  id: string;
  timestamp: string;
  action: 'sync_start' | 'sync_success' | 'sync_error' | 'conflict_detected' | 'conflict_resolved';
  details: string;
  dataSize: number;
  duration: number; // 同步耗时（毫秒）
}

export class DeviceSyncService {
  private static readonly STORAGE_KEY = 'sync_config';
  private static readonly STATUS_KEY = 'sync_status';
  private static readonly CONFLICT_KEY = 'sync_conflicts';
  private static readonly HISTORY_KEY = 'sync_history';
  private static readonly OFFLINE_QUEUE_KEY = 'offline_queue';

  private static syncStatus: SyncStatus = {
    isConnected: false,
    isSyncing: false,
    lastSync: null,
    nextSync: null,
    pendingChanges: 0,
    syncProgress: 0,
    error: null
  };

  private static syncIntervalId: NodeJS.Timeout | null = null;

  /**
   * 获取同步配置
   */
  static async getSyncConfig(): Promise<SyncConfig> {
    if (typeof window === 'undefined') {
      return {
        syncEnabled: false,
        syncFrequency: 'interval',
        syncInterval: 300, // 5分钟
        offlineSupport: true,
        conflictResolution: 'manual',
        encryption: false,
        compression: false
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('获取同步配置失败:', error);
    }

    // 默认配置
    return {
      syncEnabled: false,
      syncFrequency: 'interval',
      syncInterval: 300, // 5分钟
      offlineSupport: true,
      conflictResolution: 'manual',
      encryption: false,
      compression: false
    };
  }

  /**
   * 保存同步配置
   */
  static async saveSyncConfig(config: SyncConfig): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      
      // 根据配置启动或停止同步
      if (config.syncEnabled) {
        await this.startSyncService(config);
      } else {
        await this.stopSyncService();
      }
    } catch (error) {
      console.error('保存同步配置失败:', error);
    }
  }

  /**
   * 启动同步服务
   */
  static async startSyncService(config: SyncConfig): Promise<void> {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    // 设置初始状态
    this.syncStatus.isConnected = true;
    this.syncStatus.error = null;

    if (config.syncFrequency === 'realtime') {
      // 实时同步 - 使用WebSocket或其他实时连接
      // 这里简化处理，使用较短的轮询间隔
      this.syncIntervalId = setInterval(() => {
        this.performSync();
      }, 5000); // 每5秒检查一次
    } else {
      // 定时同步
      this.syncIntervalId = setInterval(() => {
        this.performSync();
      }, config.syncInterval * 1000);
    }
  }

  /**
   * 停止同步服务
   */
  static async stopSyncService(): Promise<void> {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    this.syncStatus.isConnected = false;
    this.syncStatus.isSyncing = false;
  }

  /**
   * 执行同步操作
   */
  static async performSync(): Promise<boolean> {
    if (!this.syncStatus.isConnected) {
      return false;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.syncProgress = 0;

    try {
      // 模拟同步进度
      this.syncStatus.syncProgress = 25;
      await this.delay(500);

      // 检查是否有离线更改需要同步
      const offlineQueue = await this.getOfflineQueue();
      if (offlineQueue.length > 0) {
        this.syncStatus.pendingChanges = offlineQueue.length;
      }

      this.syncStatus.syncProgress = 50;
      await this.delay(500);

      // 模拟同步过程
      const startTime = Date.now();
      
      // 在实际应用中，这里会调用API进行真正的数据同步
      // 暂时模拟同步成功
      this.syncStatus.syncProgress = 75;
      await this.delay(500);

      // 同步完成
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.nextSync = new Date(Date.now() + 300000).toISOString(); // 5分钟后下次同步
      this.syncStatus.syncProgress = 100;
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.error = null;

      const duration = Date.now() - startTime;
      
      // 记录同步历史
      await this.addSyncHistory({
        timestamp: new Date().toISOString(),
        action: 'sync_success',
        details: `同步完成，耗时 ${duration}ms`,
        dataSize: 0, // 实际数据大小
        duration
      });

      return true;
    } catch (error) {
      this.syncStatus.error = (error as Error).message;
      
      // 记录错误历史
      await this.addSyncHistory({
        timestamp: new Date().toISOString(),
        action: 'sync_error',
        details: (error as Error).message,
        dataSize: 0,
        duration: 0
      });

      return false;
    } finally {
      this.syncStatus.isSyncing = false;
      setTimeout(() => {
        this.syncStatus.syncProgress = 0;
      }, 1000);
    }
  }

  /**
   * 处理离线更改
   */
  static async handleOfflineChange(change: any, action: 'create' | 'update' | 'delete'): Promise<void> {
    const config = await this.getSyncConfig();
    if (!config.offlineSupport) {
      return;
    }

    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        change,
        action,
        timestamp: new Date().toISOString()
      });

      // 限制队列大小
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }

      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      
      // 更新待同步计数
      this.syncStatus.pendingChanges = queue.length;
    } catch (error) {
      console.error('处理离线更改失败:', error);
    }
  }

  /**
   * 获取离线更改队列
   */
  static async getOfflineQueue(): Promise<Array<{
    id: string;
    change: any;
    action: 'create' | 'update' | 'delete';
    timestamp: string;
  }>> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取离线队列失败:', error);
      return [];
    }
  }

  /**
   * 清空离线更改队列
   */
  static async clearOfflineQueue(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
      this.syncStatus.pendingChanges = 0;
    } catch (error) {
      console.error('清空离线队列失败:', error);
    }
  }

  /**
   * 检测冲突
   */
  static async detectConflicts(localData: any, remoteData: any): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    
    // 简化的冲突检测逻辑
    // 在实际应用中，这里会有更复杂的比较逻辑
    
    if (localData && remoteData && localData.id === remoteData.id) {
      // 检查内容是否不同
      if (JSON.stringify(localData) !== JSON.stringify(remoteData)) {
        conflicts.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          type: 'update',
          localVersion: localData,
          remoteVersion: remoteData,
          timestamp: new Date().toISOString(),
          resolved: false,
          resolution: null
        });
      }
    }

    return conflicts;
  }

  /**
   * 解决冲突
   */
  static async resolveConflict(conflictId: string, resolution: 'keep_local' | 'keep_remote' | 'merge' | 'discard'): Promise<boolean> {
    try {
      const conflicts = await this.getSyncConflicts();
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId);

      if (conflictIndex === -1) {
        return false;
      }

      conflicts[conflictIndex].resolved = true;
      conflicts[conflictIndex].resolution = resolution;

      await this.saveSyncConflicts(conflicts);

      // 记录解决历史
      await this.addSyncHistory({
        timestamp: new Date().toISOString(),
        action: 'conflict_resolved',
        details: `冲突 ${conflictId} 已通过 ${resolution} 方式解决`,
        dataSize: 0,
        duration: 0
      });

      return true;
    } catch (error) {
      console.error('解决冲突失败:', error);
      return false;
    }
  }

  /**
   * 获取同步冲突
   */
  static async getSyncConflicts(): Promise<SyncConflict[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.CONFLICT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取同步冲突失败:', error);
      return [];
    }
  }

  /**
   * 保存同步冲突
   */
  static async saveSyncConflicts(conflicts: SyncConflict[]): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.CONFLICT_KEY, JSON.stringify(conflicts));
    } catch (error) {
      console.error('保存同步冲突失败:', error);
    }
  }

  /**
   * 获取同步历史
   */
  static async getSyncHistory(): Promise<SyncHistory[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取同步历史失败:', error);
      return [];
    }
  }

  /**
   * 添加同步历史记录
   */
  static async addSyncHistory(history: Omit<SyncHistory, 'id'>): Promise<SyncHistory> {
    if (typeof window === 'undefined') {
      return history as SyncHistory;
    }

    const newHistory: SyncHistory = {
      ...history,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    };

    try {
      const historyList = await this.getSyncHistory();
      historyList.unshift(newHistory);
      
      // 限制历史记录数量
      const maxRecords = 50;
      if (historyList.length > maxRecords) {
        historyList.splice(maxRecords);
      }
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(historyList));
      return newHistory;
    } catch (error) {
      console.error('添加同步历史失败:', error);
      return newHistory;
    }
  }

  /**
   * 获取同步状态
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * 强制同步
   */
  static async forceSync(): Promise<boolean> {
    if (!this.syncStatus.isConnected) {
      return false;
    }

    return await this.performSync();
  }

  /**
   * 获取设备信息
   */
  static getDeviceInfo(): {
    deviceId: string;
    deviceName: string;
    platform: string;
    userAgent: string;
    timestamp: string;
  } {
    if (typeof window === 'undefined') {
      return {
        deviceId: 'server',
        deviceName: 'Server',
        platform: 'server',
        userAgent: 'server',
        timestamp: new Date().toISOString()
      };
    }

    // 生成设备ID（基于一些硬件/软件特征）
    const deviceInfo = {
      deviceId: this.generateDeviceId(),
      deviceName: this.getDeviceName(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    return deviceInfo;
  }

  /**
   * 生成设备ID
   */
  private static generateDeviceId(): string {
    if (typeof window === 'undefined') {
      return 'server-device';
    }

    // 基于用户代理和其他信息生成唯一标识
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const hardwareConcurrency = (navigator as any).hardwareConcurrency || 'unknown';
    
    const combined = userAgent + platform + hardwareConcurrency + Date.now();
    return btoa(combined).substring(0, 16);
  }

  /**
   * 获取设备名称
   */
  private static getDeviceName(): string {
    if (typeof window === 'undefined') {
      return 'Server';
    }

    const ua = navigator.userAgent;
    
    if (/Android/i.test(ua)) {
      return 'Android Device';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      return 'iOS Device';
    } else if (/Win/i.test(ua)) {
      return 'Windows PC';
    } else if (/Mac/i.test(ua)) {
      return 'Mac Device';
    } else if (/Linux/i.test(ua)) {
      return 'Linux Device';
    } else {
      return 'Unknown Device';
    }
  }

  /**
   * 延迟函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查网络状态
   */
  static isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // 服务端默认在线
  }

  /**
   * 监听网络状态变化
   */
  static onNetworkChange(callback: (online: boolean) => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => callback(true));
      window.addEventListener('offline', () => callback(false));
    }
  }
}