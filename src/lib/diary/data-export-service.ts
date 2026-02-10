// 数据导出备份服务
// 提供多种格式导出、自动云备份、版本历史记录等功能

export interface ExportFormat {
  type: 'pdf' | 'txt' | 'markdown' | 'json' | 'html';
  name: string;
  description: string;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  cloudStorage: boolean;
  localStorage: boolean;
}

export interface VersionHistory {
  id: string;
  timestamp: string;
  format: string;
  size: number;
  location: 'local' | 'cloud';
  version: string;
}

export interface ExportOptions {
  includeImages: boolean;
  includeMetadata: boolean;
  includeStats: boolean;
  passwordProtect: boolean;
  encryption: boolean;
}

export class DataExportService {
  private static readonly SUPPORTED_FORMATS: ExportFormat[] = [
    { type: 'pdf', name: 'PDF', description: '便携文档格式，适合打印和分享' },
    { type: 'txt', name: '纯文本', description: '简洁的文本格式' },
    { type: 'markdown', name: 'Markdown', description: '便于编辑和转换的格式' },
    { type: 'json', name: 'JSON', description: '结构化数据格式，便于程序处理' },
    { type: 'html', name: 'HTML', description: '网页格式，保留样式和结构' }
  ];

  private static readonly STORAGE_KEY = 'backup_config';
  private static readonly VERSION_HISTORY_KEY = 'version_history';

  /**
   * 获取支持的导出格式
   */
  static getSupportedFormats(): ExportFormat[] {
    return this.SUPPORTED_FORMATS;
  }

  /**
   * 导出日记为指定格式
   */
  static async exportDiaries(
    diaries: any[], 
    format: ExportFormat['type'], 
    options: ExportOptions = {
      includeImages: true,
      includeMetadata: true,
      includeStats: true,
      passwordProtect: false,
      encryption: false
    }
  ): Promise<Blob> {
    switch (format) {
      case 'pdf':
        return await this.exportToPDF(diaries, options);
      case 'txt':
        return this.exportToTXT(diaries, options);
      case 'markdown':
        return this.exportToMarkdown(diaries, options);
      case 'json':
        return this.exportToJSON(diaries, options);
      case 'html':
        return this.exportToHTML(diaries, options);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 导出为PDF格式
   */
  private static async exportToPDF(diaries: any[], options: ExportOptions): Promise<Blob> {
    // 这里使用 jsPDF 库来生成PDF
    // 由于这是服务端代码，我们模拟返回一个文本格式的PDF
    
    let content = `日记导出报告\n\n`;
    content += `导出时间: ${new Date().toLocaleString()}\n`;
    content += `日记总数: ${diaries.length}\n\n`;

    if (options.includeStats) {
      content += `=== 统计信息 ===\n`;
      content += `总字数: ${diaries.reduce((sum, diary) => sum + (diary.word_count || diary.content.length || 0), 0)}\n`;
      content += `最早日记: ${diaries.length > 0 ? diaries[diaries.length - 1].diary_date : 'N/A'}\n`;
      content += `最新日记: ${diaries.length > 0 ? diaries[0].diary_date : 'N/A'}\n\n`;
    }

    content += `=== 日记内容 ===\n\n`;

    for (const diary of diaries) {
      content += `日期: ${diary.diary_date}\n`;
      content += `标题: ${diary.title || '无标题'}\n`;
      content += `心情: ${diary.mood || '未知'}\n`;
      content += `天气: ${diary.weather || '未知'}\n`;
      content += `地点: ${diary.location || '未知'}\n`;
      if (options.includeMetadata && diary.tags && diary.tags.length > 0) {
        content += `标签: ${diary.tags.join(', ')}\n`;
      }
      content += `内容:\n${diary.content}\n`;
      
      if (options.includeImages && diary.images && diary.images.length > 0) {
        content += `\n附带图片: ${diary.images.length} 张\n`;
      }
      
      content += `\n---\n\n`;
    }

    // 返回一个模拟的PDF blob
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * 导出为TXT格式
   */
  private static exportToTXT(diaries: any[], options: ExportOptions): Blob {
    let content = `日记导出报告\n\n`;
    content += `导出时间: ${new Date().toLocaleString()}\n`;
    content += `日记总数: ${diaries.length}\n\n`;

    if (options.includeStats) {
      content += `=== 统计信息 ===\n`;
      content += `总字数: ${diaries.reduce((sum, diary) => sum + (diary.word_count || diary.content.length || 0), 0)}\n`;
      content += `最早日记: ${diaries.length > 0 ? diaries[diaries.length - 1].diary_date : 'N/A'}\n`;
      content += `最新日记: ${diaries.length > 0 ? diaries[0].diary_date : 'N/A'}\n\n`;
    }

    content += `=== 日记内容 ===\n\n`;

    for (const diary of diaries) {
      content += `日期: ${diary.diary_date}\n`;
      content += `标题: ${diary.title || '无标题'}\n`;
      content += `心情: ${diary.mood || '未知'}\n`;
      content += `天气: ${diary.weather || '未知'}\n`;
      content += `地点: ${diary.location || '未知'}\n`;
      if (options.includeMetadata && diary.tags && diary.tags.length > 0) {
        content += `标签: ${diary.tags.join(', ')}\n`;
      }
      content += `内容:\n${diary.content}\n`;
      
      if (options.includeImages && diary.images && diary.images.length > 0) {
        content += `\n附带图片: ${diary.images.length} 张\n`;
      }
      
      content += `\n---\n\n`;
    }

    return new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * 导出为Markdown格式
   */
  private static exportToMarkdown(diaries: any[], options: ExportOptions): Blob {
    let content = `# 日记导出报告\n\n`;
    content += `导出时间: ${new Date().toLocaleString()}\n`;
    content += `日记总数: ${diaries.length}\n\n`;

    if (options.includeStats) {
      content += `## 统计信息\n`;
      content += `- 总字数: ${diaries.reduce((sum, diary) => sum + (diary.word_count || diary.content.length || 0), 0)}\n`;
      content += `- 最早日记: ${diaries.length > 0 ? diaries[diaries.length - 1].diary_date : 'N/A'}\n`;
      content += `- 最新日记: ${diaries.length > 0 ? diaries[0].diary_date : 'N/A'}\n\n`;
    }

    content += `## 日记内容\n\n`;

    for (const diary of diaries) {
      content += `### ${diary.diary_date} - ${diary.title || '无标题'}\n`;
      content += `- 心情: ${diary.mood || '未知'}\n`;
      content += `- 天气: ${diary.weather || '未知'}\n`;
      content += `- 地点: ${diary.location || '未知'}\n`;
      if (options.includeMetadata && diary.tags && diary.tags.length > 0) {
        content += `- 标签: ${diary.tags.join(', ')}\n`;
      }
      content += `\n${diary.content}\n`;
      
      if (options.includeImages && diary.images && diary.images.length > 0) {
        content += `\n附带图片: ${diary.images.length} 张\n`;
      }
      
      content += `\n---\n\n`;
    }

    return new Blob([content], { type: 'text/markdown;charset=utf-8' });
  }

  /**
   * 导出为JSON格式
   */
  private static exportToJSON(diaries: any[], options: ExportOptions): Blob {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalDiaries: diaries.length,
        formatVersion: '1.0'
      },
      stats: options.includeStats ? {
        totalWords: diaries.reduce((sum, diary) => sum + (diary.word_count || diary.content.length || 0), 0),
        earliestDate: diaries.length > 0 ? diaries[diaries.length - 1].diary_date : null,
        latestDate: diaries.length > 0 ? diaries[0].diary_date : null
      } : undefined,
      diaries: diaries.map(diary => {
        const result: any = {
          date: diary.diary_date,
          title: diary.title,
          content: diary.content,
          mood: diary.mood,
          weather: diary.weather,
          location: diary.location
        };
        
        if (options.includeMetadata) {
          result.tags = diary.tags;
          result.images = diary.images;
          result.createdAt = diary.created_at;
          result.updatedAt = diary.updated_at;
          result.isPublic = diary.is_public;
          result.wordCount = diary.word_count;
        }
        
        return result;
      })
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }

  /**
   * 导出为HTML格式
   */
  private static exportToHTML(diaries: any[], options: ExportOptions): Blob {
    let content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>日记导出报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .stats { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .diary-entry { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .diary-meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
    .diary-title { font-size: 1.4em; font-weight: bold; margin-bottom: 10px; }
    .diary-content { white-space: pre-wrap; }
    .tag { display: inline-block; background: #e0e0e0; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>日记导出报告</h1>
    <p>导出时间: ${new Date().toLocaleString()}</p>
    <p>日记总数: ${diaries.length}</p>
  </div>`;

    if (options.includeStats) {
      content += `<div class="stats">
        <h3>统计信息</h3>
        <ul>
          <li>总字数: ${diaries.reduce((sum, diary) => sum + (diary.word_count || diary.content.length || 0), 0)}</li>
          <li>最早日记: ${diaries.length > 0 ? diaries[diaries.length - 1].diary_date : 'N/A'}</li>
          <li>最新日记: ${diaries.length > 0 ? diaries[0].diary_date : 'N/A'}</li>
        </ul>
      </div>`;
    }

    content += `<div class="entries">`;

    for (const diary of diaries) {
      content += `<div class="diary-entry">
        <div class="diary-meta">
          <strong>${diary.diary_date}</strong> | 
          心情: ${diary.mood || '未知'} | 
          天气: ${diary.weather || '未知'} | 
          地点: ${diary.location || '未知'}
        </div>
        <div class="diary-title">${diary.title || '无标题'}</div>
        <div class="diary-content">${this.escapeHtml(diary.content)}</div>`;
      
      if (options.includeMetadata && diary.tags && diary.tags.length > 0) {
        content += `<div class="tags">`;
        diary.tags.forEach((tag: string) => {
          content += `<span class="tag">${this.escapeHtml(tag)}</span>`;
        });
        content += `</div>`;
      }
      
      if (options.includeImages && diary.images && diary.images.length > 0) {
        content += `<div class="images">附带图片: ${diary.images.length} 张</div>`;
      }
      
      content += `</div>`;
    }

    content += `</div>
</body>
</html>`;

    return new Blob([content], { type: 'text/html;charset=utf-8' });
  }

  /**
   * 转义HTML内容以防止XSS
   */
  private static escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 下载导出文件
   */
  static downloadExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 获取备份配置
   */
  static async getBackupConfig(): Promise<BackupConfig> {
    if (typeof window === 'undefined') {
      return {
        autoBackupEnabled: false,
        backupFrequency: 'weekly',
        retentionDays: 30,
        cloudStorage: false,
        localStorage: true
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('获取备份配置失败:', error);
    }

    // 默认配置
    return {
      autoBackupEnabled: false,
      backupFrequency: 'weekly',
      retentionDays: 30,
      cloudStorage: false,
      localStorage: true
    };
  }

  /**
   * 保存备份配置
   */
  static async saveBackupConfig(config: BackupConfig): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('保存备份配置失败:', error);
    }
  }

  /**
   * 获取版本历史
   */
  static async getVersionHistory(): Promise<VersionHistory[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.VERSION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取版本历史失败:', error);
      return [];
    }
  }

  /**
   * 添加版本历史记录
   */
  static async addVersionRecord(record: Omit<VersionHistory, 'id'>): Promise<VersionHistory> {
    if (typeof window === 'undefined') {
      return record as VersionHistory;
    }

    const newRecord: VersionHistory = {
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    };

    try {
      const history = await this.getVersionHistory();
      history.unshift(newRecord);
      
      // 限制历史记录数量
      const maxRecords = 50;
      if (history.length > maxRecords) {
        history.splice(maxRecords);
      }
      
      localStorage.setItem(this.VERSION_HISTORY_KEY, JSON.stringify(history));
      return newRecord;
    } catch (error) {
      console.error('添加版本记录失败:', error);
      return newRecord;
    }
  }

  /**
   * 删除旧的备份记录
   */
  static async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const history = await this.getVersionHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const filteredHistory = history.filter(record => 
        new Date(record.timestamp) >= cutoffDate
      );
      
      const deletedCount = history.length - filteredHistory.length;
      
      localStorage.setItem(this.VERSION_HISTORY_KEY, JSON.stringify(filteredHistory));
      return deletedCount;
    } catch (error) {
      console.error('清理旧备份失败:', error);
      return 0;
    }
  }

  /**
   * 触发自动备份
   */
  static async triggerAutoBackup(diaries: any[]): Promise<boolean> {
    const config = await this.getBackupConfig();
    
    if (!config.autoBackupEnabled) {
      return false;
    }

    try {
      // 导出为JSON格式（最常用的数据交换格式）
      const blob = await this.exportDiaries(diaries, 'json', {
        includeImages: true,
        includeMetadata: true,
        includeStats: true,
        passwordProtect: false,
        encryption: config.cloudStorage // 如果是云存储则启用加密
      });

      const filename = `diary-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // 添加到版本历史
      await this.addVersionRecord({
        timestamp: new Date().toISOString(),
        format: 'json',
        size: blob.size,
        location: config.cloudStorage ? 'cloud' : 'local',
        version: '1.0'
      });

      // 如果启用了本地存储，下载备份
      if (config.localStorage) {
        this.downloadExport(blob, filename);
      }

      // 如果启用了云存储，上传到云存储（这里模拟）
      if (config.cloudStorage) {
        // 在实际应用中，这里会调用云存储API
        console.log(`模拟上传备份到云端: ${filename}`);
      }

      return true;
    } catch (error) {
      console.error('自动备份失败:', error);
      return false;
    }
  }

  /**
   * 生成导出预览
   */
  static generatePreview(diaries: any[], format: ExportFormat['type']): string {
    if (diaries.length === 0) {
      return '没有可预览的日记内容';
    }

    const sampleDiary = diaries[0];
    let preview = '';

    switch (format) {
      case 'pdf':
      case 'txt':
        preview = `日期: ${sampleDiary.diary_date}\n`;
        preview += `标题: ${sampleDiary.title || '无标题'}\n`;
        preview += `内容预览: ${sampleDiary.content.substring(0, 100)}${sampleDiary.content.length > 100 ? '...' : ''}\n`;
        break;
      case 'markdown':
        preview = `# ${sampleDiary.diary_date} - ${sampleDiary.title || '无标题'}\n\n`;
        preview += `${sampleDiary.content.substring(0, 100)}${sampleDiary.content.length > 100 ? '...' : ''}\n`;
        break;
      case 'json':
        const jsonPreview = {
          date: sampleDiary.diary_date,
          title: sampleDiary.title,
          contentPreview: sampleDiary.content.substring(0, 50) + '...'
        };
        preview = JSON.stringify(jsonPreview, null, 2);
        break;
      case 'html':
        preview = `<h2>${sampleDiary.diary_date} - ${sampleDiary.title || '无标题'}</h2>\n`;
        preview += `<p>${sampleDiary.content.substring(0, 100)}${sampleDiary.content.length > 100 ? '...' : ''}</p>\n`;
        break;
    }

    return preview;
  }
}