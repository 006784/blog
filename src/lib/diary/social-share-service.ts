// 社交分享服务
// 提供日记分享、社交媒体集成等功能

import type { Diary } from '../supabase';

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
  hashtags?: string[];
  quote?: string;
}

export interface SocialPlatform {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  shareUrl: (options: ShareOptions) => string;
}

export interface ShareStats {
  shareCount: number;
  platformShares: Record<string, number>;
  lastShared: Date | null;
}

interface ShareableDiary extends Diary {
  author?: string;
  avatar?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  media?: unknown[];
  createdAt?: string;
  quote?: string;
  image?: string;
}

interface TimelineEntry {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  media: unknown[];
}

interface TimelineDay {
  date: string;
  entries: TimelineEntry[];
}

export class SocialShareService {
  // 社交平台配置
  private static platforms: SocialPlatform[] = [
    {
      name: 'twitter',
      displayName: 'Twitter',
      color: '#1DA1F2',
      icon: '🐦',
      shareUrl: (options: ShareOptions) => {
        const text = encodeURIComponent(`${options.title}\n${options.text}`);
        const url = encodeURIComponent(options.url);
        const hashtags = options.hashtags ? encodeURIComponent(options.hashtags.join(',')) : '';
        return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
      }
    },
    {
      name: 'facebook',
      displayName: 'Facebook',
      color: '#1877F2',
      icon: '📘',
      shareUrl: (options: ShareOptions) => {
        const url = encodeURIComponent(options.url);
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      }
    },
    {
      name: 'linkedin',
      displayName: 'LinkedIn',
      color: '#0077B5',
      icon: '💼',
      shareUrl: (options: ShareOptions) => {
        const title = encodeURIComponent(options.title);
        const url = encodeURIComponent(options.url);
        const summary = encodeURIComponent(options.text);
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
      }
    },
    {
      name: 'weibo',
      displayName: '微博',
      color: '#E6162D',
      icon: '📸',
      shareUrl: (options: ShareOptions) => {
        const title = encodeURIComponent(`${options.title} ${options.text}`);
        const url = encodeURIComponent(options.url);
        return `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
      }
    },
    {
      name: 'copy',
      displayName: '复制链接',
      color: '#6B7280',
      icon: '🔗',
      shareUrl: (options: ShareOptions) => options.url
    }
  ];

  /**
   * 获取支持的社交平台
   */
  static getSocialPlatforms(): SocialPlatform[] {
    return this.platforms;
  }

  /**
   * 分享到指定平台
   */
  static shareToPlatform(platform: string, options: ShareOptions): boolean {
    const platformConfig = this.platforms.find(p => p.name === platform);
    if (!platformConfig) {
      console.error(`不支持的社交平台: ${platform}`);
      return false;
    }

    if (platform === 'copy') {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(options.url).catch(err => {
        console.error('复制链接失败:', err);
        // 如果无法复制到剪贴板，降级到控制台输出
        console.warn('复制链接失败，链接地址:', options.url);
      });
    } else {
      // 在新窗口打开分享页面
      const shareUrl = platformConfig.shareUrl(options);
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }

    this.trackShare(platform);
    return true;
  }

  /**
   * 使用Web Share API分享（如果支持）
   */
  static async webShare(options: ShareOptions): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url
      });
      this.trackShare('web-share');
      return true;
    } catch (error) {
      console.error('Web Share 失败:', error);
      return false;
    }
  }

  /**
   * 生成公开分享链接
   */
  static generatePublicLink(diaryId: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/diary/public/${diaryId}`;
  }

  /**
   * 生成朋友圈风格的时间线数据
   */
  static generateTimelineData(diaries: ShareableDiary[]): TimelineDay[] {
    // 按日期分组日记
    const groupedByDate = diaries.reduce((acc: Record<string, ShareableDiary[]>, diary) => {
      const createdAt = diary.createdAt || diary.created_at;
      const date = new Date(createdAt).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(diary);
      return acc;
    }, {} as Record<string, ShareableDiary[]>);
    
    // 转换为时间线格式
    return Object.entries(groupedByDate).map(([date, dayDiaries]) => ({
      date,
      entries: dayDiaries.map((diary) => ({
        id: diary.id,
        title: diary.title || '未命名日记',
        content: diary.content.substring(0, 200) + (diary.content.length > 200 ? '...' : ''),
        author: diary.author || '匿名用户',
        avatar: diary.avatar || '/api/placeholder/40/40',
        timestamp: new Date(diary.createdAt || diary.created_at),
        likes: diary.likes || 0,
        comments: diary.comments || 0,
        shares: diary.shares || 0,
        tags: diary.tags || [],
        media: diary.media || []
      }))
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 按日期倒序排列
  }

  /**
   * 生成分享预览数据
   */
  static generateSharePreview(diary: ShareableDiary): ShareOptions {
    const title = diary.title || '日记分享';
    const text = diary.content?.substring(0, 100) + (diary.content?.length > 100 ? '...' : '') || '分享一篇有趣的日记';
    const url = this.generatePublicLink(diary.id);
    const hashtags = diary.tags ? diary.tags.slice(0, 3) : []; // 最多使用3个标签

    return {
      title,
      text,
      url,
      hashtags,
      quote: diary.quote || ''
    };
  }

  /**
   * 追踪分享统计
   */
  private static trackShare(platform: string): void {
    // 这里可以集成实际的统计服务
    const statsStr = localStorage.getItem('share-stats') || '{}';
    const stats: ShareStats = JSON.parse(statsStr);
    
    if (!stats.platformShares) {
      stats.platformShares = {};
    }
    
    stats.shareCount = (stats.shareCount || 0) + 1;
    stats.platformShares[platform] = (stats.platformShares[platform] || 0) + 1;
    stats.lastShared = new Date();
    
    localStorage.setItem('share-stats', JSON.stringify(stats));
  }

  /**
   * 获取分享统计
   */
  static getShareStats(): ShareStats {
    const statsStr = localStorage.getItem('share-stats') || '{}';
    try {
      return JSON.parse(statsStr);
    } catch {
      return {
        shareCount: 0,
        platformShares: {},
        lastShared: null
      };
    }
  }

  /**
   * 创建分享摘要
   */
  static createShareSummary(diaries: ShareableDiary[]): string {
    const total = diaries.length;
    const today = diaries.filter(d => 
      new Date(d.createdAt || d.created_at).toDateString() === new Date().toDateString()
    ).length;
    const weekly = diaries.filter(d => {
      const diaryDate = new Date(d.createdAt || d.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return diaryDate >= weekAgo;
    }).length;

    return `我已记录 ${total} 篇日记，今天写了 ${today} 篇，本周写了 ${weekly} 篇。分享我的生活点滴，一起来记录美好时光吧！`;
  }

  /**
   * 检测是否支持Web Share API
   */
  static isWebShareSupported(): boolean {
    return !!navigator.share;
  }

  /**
   * 生成社交媒体优化的元数据
   */
  static generateSocialMetadata(diary: ShareableDiary): Record<string, string> {
    return {
      'og:title': diary.title || '日记分享',
      'og:description': diary.content?.substring(0, 160) + (diary.content?.length > 160 ? '...' : '') || '分享一篇有趣的日记',
      'og:url': this.generatePublicLink(diary.id),
      'og:type': 'article',
      'og:image': diary.image || `${window.location.origin}/api/placeholder/1200/630`,
      'twitter:card': 'summary_large_image',
      'twitter:title': diary.title || '日记分享',
      'twitter:description': diary.content?.substring(0, 200) + (diary.content?.length > 200 ? '...' : '') || '分享一篇有趣的日记',
      'twitter:image': diary.image || `${window.location.origin}/api/placeholder/1200/630`
    };
  }
}
