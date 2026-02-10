// 数据导出备份组件
'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, HardDrive, Cloud, Settings, History, Eye, Lock, FileText, Archive } from 'lucide-react';
import { DataExportService, type ExportFormat, type BackupConfig, type VersionHistory } from '@/lib/diary/data-export-service';

interface DataExportProps {
  diaries: any[];
  className?: string;
}

export function DataExport({ diaries, className = '' }: DataExportProps) {
  const [formats] = useState<ExportFormat[]>(DataExportService.getSupportedFormats());
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat['type']>('json');
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeMetadata: true,
    includeStats: true,
    passwordProtect: false,
    encryption: false
  });
  const [backupConfig, setBackupConfig] = useState<BackupConfig>({
    autoBackupEnabled: false,
    backupFrequency: 'weekly',
    retentionDays: 30,
    cloudStorage: false,
    localStorage: true
  });
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // 初始化配置
  useEffect(() => {
    loadConfigs();
  }, []);

  // 加载配置
  const loadConfigs = async () => {
    try {
      const config = await DataExportService.getBackupConfig();
      setBackupConfig(config);
      
      const history = await DataExportService.getVersionHistory();
      setVersionHistory(history);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 处理导出
  const handleExport = async () => {
    if (diaries.length === 0) {
      alert('没有日记可以导出');
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      // 模拟导出进度
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const blob = await DataExportService.exportDiaries(diaries, selectedFormat, exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      const dateStr = new Date().toISOString().split('T')[0];
      const extension = selectedFormat === 'markdown' ? 'md' : selectedFormat;
      const filename = `diary-export-${dateStr}.${extension}`;
      
      DataExportService.downloadExport(blob, filename);

      // 添加到版本历史
      await DataExportService.addVersionRecord({
        timestamp: new Date().toISOString(),
        format: selectedFormat,
        size: blob.size,
        location: 'local',
        version: '1.0'
      });

      // 重新加载版本历史
      const history = await DataExportService.getVersionHistory();
      setVersionHistory(history);

      setTimeout(() => setExportProgress(0), 1000);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 处理备份配置更改
  const handleConfigChange = async (newConfig: BackupConfig) => {
    try {
      await DataExportService.saveBackupConfig(newConfig);
      setBackupConfig(newConfig);
      setShowSettings(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败: ' + (error as Error).message);
    }
  };

  // 手动触发备份
  const handleManualBackup = async () => {
    setLoading(true);
    try {
      const success = await DataExportService.triggerAutoBackup(diaries);
      if (success) {
        alert('备份成功！');
        const history = await DataExportService.getVersionHistory();
        setVersionHistory(history);
      } else {
        alert('备份未启用或失败');
      }
    } catch (error) {
      console.error('手动备份失败:', error);
      alert('手动备份失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 预览导出内容
  const handlePreview = async () => {
    if (diaries.length === 0) {
      setPreviewContent('没有可预览的日记内容');
      setShowPreview(true);
      return;
    }

    try {
      const preview = DataExportService.generatePreview(diaries, selectedFormat);
      setPreviewContent(preview);
      setShowPreview(true);
    } catch (error) {
      setPreviewContent('预览生成失败: ' + (error as Error).message);
      setShowPreview(true);
    }
  };

  // 清理旧备份
  const handleCleanup = async () => {
    if (window.confirm(`确定要删除 ${backupConfig.retentionDays} 天前的备份记录吗？`)) {
      try {
        const deletedCount = await DataExportService.cleanupOldBackups(backupConfig.retentionDays);
        alert(`已清理 ${deletedCount} 条旧备份记录`);
        const history = await DataExportService.getVersionHistory();
        setVersionHistory(history);
      } catch (error) {
        console.error('清理失败:', error);
        alert('清理失败: ' + (error as Error).message);
      }
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-500" />
          数据导出备份
        </h3>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="备份设置"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 备份设置面板 */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">备份配置</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={backupConfig.autoBackupEnabled}
                  onChange={(e) => setBackupConfig({...backupConfig, autoBackupEnabled: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">启用自动备份</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备份频率</label>
              <select
                value={backupConfig.backupFrequency}
                onChange={(e) => setBackupConfig({...backupConfig, backupFrequency: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={backupConfig.localStorage}
                  onChange={(e) => setBackupConfig({...backupConfig, localStorage: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">本地存储</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={backupConfig.cloudStorage}
                  onChange={(e) => setBackupConfig({...backupConfig, cloudStorage: e.target.checked})}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">云存储</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保留天数</label>
              <input
                type="number"
                value={backupConfig.retentionDays}
                onChange={(e) => setBackupConfig({...backupConfig, retentionDays: parseInt(e.target.value) || 30})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleConfigChange(backupConfig)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              保存设置
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                loadConfigs(); // 恢复原始设置
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 导出选项 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">导出选项</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">导出格式</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {formats.map(format => (
                <option key={format.type} value={format.type}>
                  {format.name} ({format.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              预览内容
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={loading || diaries.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              导出日记
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <label className="flex items-center gap-2 p-2 bg-white rounded border">
            <input
              type="checkbox"
              checked={exportOptions.includeImages}
              onChange={(e) => setExportOptions({...exportOptions, includeImages: e.target.checked})}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">包含图片</span>
          </label>
          
          <label className="flex items-center gap-2 p-2 bg-white rounded border">
            <input
              type="checkbox"
              checked={exportOptions.includeMetadata}
              onChange={(e) => setExportOptions({...exportOptions, includeMetadata: e.target.checked})}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">包含元数据</span>
          </label>
          
          <label className="flex items-center gap-2 p-2 bg-white rounded border">
            <input
              type="checkbox"
              checked={exportOptions.includeStats}
              onChange={(e) => setExportOptions({...exportOptions, includeStats: e.target.checked})}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">包含统计</span>
          </label>
          
          <label className="flex items-center gap-2 p-2 bg-white rounded border">
            <input
              type="checkbox"
              checked={exportOptions.passwordProtect}
              onChange={(e) => setExportOptions({...exportOptions, passwordProtect: e.target.checked})}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">密码保护</span>
          </label>
          
          <label className="flex items-center gap-2 p-2 bg-white rounded border">
            <input
              type="checkbox"
              checked={exportOptions.encryption}
              onChange={(e) => setExportOptions({...exportOptions, encryption: e.target.checked})}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">加密</span>
          </label>
        </div>
      </div>

      {/* 导出进度 */}
      {exportProgress > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">导出进度: {exportProgress}%</p>
        </div>
      )}

      {/* 手动备份按钮 */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleManualBackup}
          disabled={loading || diaries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <HardDrive className="w-4 h-4" />
          立即备份
        </button>
        
        <button
          onClick={handleCleanup}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Archive className="w-4 h-4" />
          清理旧备份
        </button>
      </div>

      {/* 版本历史 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4" />
            版本历史 ({versionHistory.length})
          </h4>
        </div>
        
        {versionHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>暂无备份历史</p>
            <p className="text-sm">导出或备份日记后，历史记录将显示在这里</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">格式</th>
                  <th className="px-3 py-2 text-left">时间</th>
                  <th className="px-3 py-2 text-right">大小</th>
                  <th className="px-3 py-2 text-left">位置</th>
                  <th className="px-3 py-2 text-left">版本</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {versionHistory.slice(0, 10).map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{record.format.toUpperCase()}</td>
                    <td className="px-3 py-2">{formatTime(record.timestamp)}</td>
                    <td className="px-3 py-2 text-right">{formatFileSize(record.size)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        record.location === 'cloud' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.location === 'cloud' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        {record.location === 'cloud' ? '云端' : '本地'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{record.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 预览模态框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900">导出预览 - {formats.find(f => f.type === selectedFormat)?.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm bg-gray-50 p-4 rounded">
                {previewContent}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}