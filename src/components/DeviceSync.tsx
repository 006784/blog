// 多设备同步组件
'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Shield,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';
import { DeviceSyncService, type SyncConfig, type SyncConflict } from '@/lib/diary/device-sync-service';

interface DeviceSyncProps {
  diaries: any[];
  className?: string;
}

export function DeviceSync({ diaries, className = '' }: DeviceSyncProps) {
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    syncEnabled: false,
    syncFrequency: 'interval',
    syncInterval: 300, // 5分钟
    offlineSupport: true,
    conflictResolution: 'manual',
    encryption: false,
    compression: false
  });
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  // 初始化同步服务
  useEffect(() => {
    loadSyncData();
    
    // 监听网络状态变化
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 定期更新同步状态
  useEffect(() => {
    const interval = setInterval(() => {
      updateSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 加载同步数据
  const loadSyncData = async () => {
    setLoading(true);
    try {
      const config = await DeviceSyncService.getSyncConfig();
      setSyncConfig(config);
      
      const status = DeviceSyncService.getSyncStatus();
      setSyncStatus(status);
      
      const device = DeviceSyncService.getDeviceInfo();
      setDeviceInfo(device);
      
      const conflicts = await DeviceSyncService.getSyncConflicts();
      setConflicts(conflicts);
      
      const history = await DeviceSyncService.getSyncHistory();
      setSyncHistory(history);
    } catch (error) {
      console.error('加载同步数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新同步状态
  const updateSyncStatus = async () => {
    try {
      const status = DeviceSyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('更新同步状态失败:', error);
    }
  };

  // 处理配置更改
  const handleConfigChange = async (newConfig: SyncConfig) => {
    try {
      await DeviceSyncService.saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      setShowSettings(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败: ' + (error as Error).message);
    }
  };

  // 强制同步
  const handleForceSync = async () => {
    setLoading(true);
    try {
      const success = await DeviceSyncService.forceSync();
      if (success) {
        alert('同步成功！');
      } else {
        alert('同步失败，请检查网络连接');
      }
    } catch (error) {
      console.error('强制同步失败:', error);
      alert('同步失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 解决冲突
  const handleResolveConflict = async (conflictId: string, resolution: 'keep_local' | 'keep_remote' | 'merge' | 'discard') => {
    try {
      const success = await DeviceSyncService.resolveConflict(conflictId, resolution);
      if (success) {
        // 重新加载冲突列表
        const updatedConflicts = await DeviceSyncService.getSyncConflicts();
        setConflicts(updatedConflicts);
        alert('冲突已解决');
      }
    } catch (error) {
      console.error('解决冲突失败:', error);
      alert('解决冲突失败: ' + (error as Error).message);
    }
  };

  // 清空离线队列
  const handleClearOfflineQueue = async () => {
    if (window.confirm('确定要清空离线更改队列吗？此操作不可逆。')) {
      try {
        await DeviceSyncService.clearOfflineQueue();
        alert('离线队列已清空');
        updateSyncStatus();
      } catch (error) {
        console.error('清空离线队列失败:', error);
        alert('清空失败: ' + (error as Error).message);
      }
    }
  };

  // 格式化时间
  const formatTime = (dateString: string): string => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取设备图标
  const getDeviceIcon = (platform: string) => {
    if (platform.includes('iPhone') || platform.includes('iPad') || platform.includes('iPod')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (platform.includes('Android')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (platform.includes('Win')) {
      return <Laptop className="w-4 h-4" />;
    } else if (platform.includes('Mac')) {
      return <Laptop className="w-4 h-4" />;
    } else if (platform.includes('Linux')) {
      return <Laptop className="w-4 h-4" />;
    } else {
      return <Smartphone className="w-4 h-4" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sync_success': return 'text-green-600 bg-green-50';
      case 'sync_error': return 'text-red-600 bg-red-50';
      case 'conflict_detected': return 'text-yellow-600 bg-yellow-50';
      case 'conflict_resolved': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 获取动作文本
  const getActionText = (action: string) => {
    switch (action) {
      case 'sync_start': return '同步开始';
      case 'sync_success': return '同步成功';
      case 'sync_error': return '同步错误';
      case 'conflict_detected': return '发现冲突';
      case 'conflict_resolved': return '冲突已解决';
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">初始化同步服务...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-500" />
          多设备同步
        </h3>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? '在线' : '离线'}
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="同步设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 同步状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">连接状态</span>
            <div className={`w-3 h-3 rounded-full ${syncStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {syncStatus?.isConnected ? '已连接' : '未连接'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">同步状态</span>
            <div className={`w-3 h-3 rounded-full ${syncStatus?.isSyncing ? 'bg-yellow-500 animate-pulse' : syncStatus?.lastSync ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
          <div className="text-lg font-bold text-green-900">
            {syncStatus?.isSyncing ? '同步中...' : syncStatus?.lastSync ? '已同步' : '未同步'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">待同步</span>
          </div>
          <div className="text-lg font-bold text-amber-900">{syncStatus?.pendingChanges || 0}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">上次同步</span>
          </div>
          <div className="text-sm font-bold text-purple-900">
            {syncStatus?.lastSync ? formatTime(syncStatus.lastSync) : '从未'}
          </div>
        </div>
      </div>

      {/* 同步进度条 */}
      {syncStatus?.isSyncing && syncStatus.syncProgress > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncStatus.syncProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">同步进度: {syncStatus.syncProgress}%</p>
        </div>
      )}

      {/* 设备信息 */}
      {deviceInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            当前设备
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">设备名称:</span>
              <span className="font-medium">{deviceInfo.deviceName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">设备ID:</span>
              <span className="font-mono text-xs">{deviceInfo.deviceId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">平台:</span>
              <span className="font-medium">{deviceInfo.platform}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">上次更新:</span>
              <span className="font-medium">{formatTime(deviceInfo.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleForceSync}
          disabled={loading || !syncConfig.syncEnabled}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          立即同步
        </button>
        
        {syncStatus?.pendingChanges > 0 && (
          <button
            onClick={handleClearOfflineQueue}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            清空队列
          </button>
        )}
        
        <button
          onClick={() => setShowConflicts(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          冲突 ({conflicts.filter(c => !c.resolved).length})
        </button>
        
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Activity className="w-4 h-4" />
          历史记录
        </button>
      </div>

      {/* 同步设置面板 */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">同步配置</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={syncConfig.syncEnabled}
                  onChange={(e) => setSyncConfig({...syncConfig, syncEnabled: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">启用同步</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">同步频率</label>
              <select
                value={syncConfig.syncFrequency}
                onChange={(e) => setSyncConfig({...syncConfig, syncFrequency: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="realtime">实时同步</option>
                <option value="interval">定时同步</option>
              </select>
            </div>
            
            {syncConfig.syncFrequency === 'interval' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">同步间隔（秒）</label>
                <input
                  type="number"
                  value={syncConfig.syncInterval}
                  onChange={(e) => setSyncConfig({...syncConfig, syncInterval: parseInt(e.target.value) || 300})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="60"
                  max="3600"
                />
              </div>
            )}
            
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={syncConfig.offlineSupport}
                  onChange={(e) => setSyncConfig({...syncConfig, offlineSupport: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">离线支持</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">冲突解决策略</label>
              <select
                value={syncConfig.conflictResolution}
                onChange={(e) => setSyncConfig({...syncConfig, conflictResolution: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="manual">手动解决</option>
                <option value="automatic">自动解决</option>
                <option value="server_wins">服务器优先</option>
                <option value="client_wins">客户端优先</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={syncConfig.encryption}
                  onChange={(e) => setSyncConfig({...syncConfig, encryption: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">数据加密</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={syncConfig.compression}
                  onChange={(e) => setSyncConfig({...syncConfig, compression: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">数据压缩</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleConfigChange(syncConfig)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              保存设置
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                loadSyncData(); // 恢复原始设置
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 冲突模态框 */}
      {showConflicts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                同步冲突 ({conflicts.filter(c => !c.resolved).length} 个未解决)
              </h3>
              <button
                onClick={() => setShowConflicts(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>暂无同步冲突</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        conflict.resolved 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {conflict.type === 'create' ? '创建冲突' : 
                           conflict.type === 'update' ? '更新冲突' : '删除冲突'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          conflict.resolved ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {conflict.resolved ? '已解决' : '未解决'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        时间: {formatTime(conflict.timestamp)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">本地版本</h5>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(conflict.localVersion, null, 2)}
                          </pre>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-blue-600 mb-2">远程版本</h5>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(conflict.remoteVersion, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {!conflict.resolved && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'keep_local')}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            保留本地
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'keep_remote')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            保留远程
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'merge')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            合并
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conflict.id, 'discard')}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            丢弃
                          </button>
                        </div>
                      )}
                      
                      {conflict.resolved && conflict.resolution && (
                        <div className="text-sm text-green-600">
                          已通过 "{conflict.resolution}" 方式解决
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowConflicts(false)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录模态框 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                同步历史记录
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {syncHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>暂无同步历史记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">时间</th>
                        <th className="px-3 py-2 text-left">操作</th>
                        <th className="px-3 py-2 text-left">详情</th>
                        <th className="px-3 py-2 text-right">耗时</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {syncHistory.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{formatTime(record.timestamp)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.action)}`}>
                              {getActionText(record.action)}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-md truncate">{record.details}</td>
                          <td className="px-3 py-2 text-right">{record.duration}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}