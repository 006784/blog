// 日记搜索和过滤服务
// 提供全文搜索、高级筛选和结果高亮功能

export interface SearchOptions {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  emotions?: string[];
  activities?: string[];
  weather?: string[];
  tags?: string[];
  sortBy?: 'date' | 'relevance' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  date: string;
  excerpt: string;
  highlights: Highlight[];
  score: number;
  metadata: {
    emotion?: string;
    activity?: string;
    weather?: string;
    tags?: string[];
  };
}

export interface Highlight {
  type: 'title' | 'content';
  text: string;
  position: number;
  matched: boolean;
}

export class DiarySearchService {
  /**
   * 全文搜索日记
   */
  static searchDiaries(diaries: any[], options: SearchOptions): SearchResult[] {
    let results = [...diaries];

    // 应用过滤条件
    results = this.applyFilters(results, options);

    // 应用搜索查询
    if (options.query && options.query.trim()) {
      results = this.performTextSearch(results, options.query);
    }

    // 排序结果
    results = this.sortResults(results, options);

    // 生成搜索结果
    return results.map(diary => this.createSearchResult(diary, options.query || ''));
  }

  /**
   * 应用各种过滤条件
   */
  private static applyFilters(diaries: any[], options: SearchOptions): any[] {
    return diaries.filter(diary => {
      // 日期过滤
      if (options.dateFrom || options.dateTo) {
        const diaryDate = new Date(diary.diary_date);
        if (options.dateFrom && diaryDate < new Date(options.dateFrom)) return false;
        if (options.dateTo && diaryDate > new Date(options.dateTo)) return false;
      }

      // 情绪过滤
      if (options.emotions && options.emotions.length > 0) {
        if (!diary.mood || !options.emotions.includes(diary.mood)) return false;
      }

      // 活动过滤
      if (options.activities && options.activities.length > 0) {
        // 这里需要根据实际的活动标签系统来实现
        const hasActivity = options.activities.some(activity => 
          diary.content?.includes(activity) || diary.title?.includes(activity)
        );
        if (!hasActivity) return false;
      }

      // 天气过滤
      if (options.weather && options.weather.length > 0) {
        if (!diary.weather || !options.weather.includes(diary.weather)) return false;
      }

      // 标签过滤
      if (options.tags && options.tags.length > 0) {
        // 这里需要根据实际的标签系统来实现
        const hasTag = options.tags.some(tag => 
          diary.content?.includes(tag) || diary.title?.includes(tag)
        );
        if (!hasTag) return false;
      }

      return true;
    });
  }

  /**
   * 执行文本搜索
   */
  private static performTextSearch(diaries: any[], query: string): any[] {
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    return diaries.map(diary => {
      // 计算相关性分数
      const score = this.calculateRelevanceScore(diary, queryTerms);
      return { ...diary, _searchScore: score };
    })
    .filter(diary => diary._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
  }

  /**
   * 计算相关性分数
   */
  private static calculateRelevanceScore(diary: any, queryTerms: string[]): number {
    let score = 0;
    const title = (diary.title || '').toLowerCase();
    const content = (diary.content || '').toLowerCase();

    queryTerms.forEach(term => {
      // 标题匹配权重更高
      const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
      score += titleMatches * 10;

      // 内容匹配
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 2;

      // 完全匹配加分
      if (title.includes(term)) score += 5;
      if (content.includes(term)) score += 1;
    });

    return score;
  }

  /**
   * 排序结果
   */
  private static sortResults(diaries: any[], options: SearchOptions): any[] {
    const sortBy = options.sortBy || 'date';
    const sortOrder = options.sortOrder || 'desc';

    return diaries.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.diary_date).getTime() - new Date(b.diary_date).getTime();
          break;
        case 'relevance':
          comparison = (a._searchScore || 0) - (b._searchScore || 0);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 创建搜索结果对象
   */
  private static createSearchResult(diary: any, query: string): SearchResult {
    const highlights = this.generateHighlights(diary, query);
    const excerpt = this.generateExcerpt(diary.content || '', query);

    return {
      id: diary.id,
      title: diary.title || '未命名日记',
      content: diary.content || '',
      date: diary.diary_date,
      excerpt,
      highlights,
      score: diary._searchScore || 0,
      metadata: {
        emotion: diary.mood,
        activity: diary.activity,
        weather: diary.weather,
        tags: diary.tags || []
      }
    };
  }

  /**
   * 生成高亮文本
   */
  private static generateHighlights(diary: any, query: string): Highlight[] {
    if (!query.trim()) return [];

    const highlights: Highlight[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    const title = diary.title || '';
    const content = diary.content || '';

    // 标题高亮
    highlights.push(...this.highlightText(title, queryTerms, 'title'));

    // 内容高亮（取前几个匹配段落）
    const contentHighlights = this.highlightText(content, queryTerms, 'content');
    highlights.push(...contentHighlights.slice(0, 3));

    return highlights;
  }

  /**
   * 高亮文本中的匹配项
   */
  private static highlightText(text: string, queryTerms: string[], type: 'title' | 'content'): Highlight[] {
    if (!text) return [];

    const highlights: Highlight[] = [];
    let currentPosition = 0;

    // 按位置排序的匹配项
    const matches: { term: string; index: number }[] = [];
    queryTerms.forEach(term => {
      let index = -1;
      while ((index = text.toLowerCase().indexOf(term, index + 1)) !== -1) {
        matches.push({ term, index });
      }
    });

    matches.sort((a, b) => a.index - b.index);

    // 生成高亮片段
    matches.forEach(({ term, index }) => {
      // 添加匹配前的文本
      if (index > currentPosition) {
        highlights.push({
          type,
          text: text.substring(currentPosition, index),
          position: currentPosition,
          matched: false
        });
      }

      // 添加匹配的文本
      highlights.push({
        type,
        text: text.substring(index, index + term.length),
        position: index,
        matched: true
      });

      currentPosition = index + term.length;
    });

    // 添加剩余文本
    if (currentPosition < text.length) {
      highlights.push({
        type,
        text: text.substring(currentPosition),
        position: currentPosition,
        matched: false
      });
    }

    return highlights;
  }

  /**
   * 生成内容摘要
   */
  private static generateExcerpt(content: string, query: string): string {
    if (!content) return '';

    const maxLength = 150;
    if (content.length <= maxLength) return content;

    // 如果有搜索查询，尝试围绕查询词生成摘要
    if (query.trim()) {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      for (const term of queryTerms) {
        const index = content.toLowerCase().indexOf(term);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + term.length + 100);
          let excerpt = content.substring(start, end);
          
          if (start > 0) excerpt = '...' + excerpt;
          if (end < content.length) excerpt = excerpt + '...';
          
          return excerpt;
        }
      }
    }

    // 默认截取开头部分
    return content.substring(0, maxLength) + '...';
  }

  /**
   * 获取搜索建议
   */
  static getSuggestions(diaries: any[], query: string): string[] {
    if (!query.trim() || diaries.length === 0) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    diaries.forEach(diary => {
      // 从标题获取建议
      if (diary.title) {
        const titleWords = diary.title.split(/\s+/);
        titleWords.forEach((word: string) => {
          if (word.toLowerCase().startsWith(queryLower) && word.length > query.length) {
            suggestions.add(word);
          }
        });
      }

      // 从内容获取建议
      if (diary.content) {
        const contentWords = diary.content.split(/\s+/);
        contentWords.forEach((word: string) => {
          if (word.toLowerCase().startsWith(queryLower) && word.length > query.length) {
            suggestions.add(word);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * 获取搜索统计信息
   */
  static getSearchStats(diaries: any[], options: SearchOptions): {
    totalResults: number;
    dateRange: { min: string; max: string } | null;
    emotionDistribution: Record<string, number>;
    weatherDistribution: Record<string, number>;
  } {
    const results = this.searchDiaries(diaries, options);

    // 日期范围
    let dateRange = null;
    if (results.length > 0) {
      const dates = results.map(r => new Date(r.date));
      dateRange = {
        min: new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0],
        max: new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0]
      };
    }

    // 情绪分布
    const emotionDistribution: Record<string, number> = {};
    results.forEach(result => {
      if (result.metadata.emotion) {
        emotionDistribution[result.metadata.emotion] = 
          (emotionDistribution[result.metadata.emotion] || 0) + 1;
      }
    });

    // 天气分布
    const weatherDistribution: Record<string, number> = {};
    results.forEach(result => {
      if (result.metadata.weather) {
        weatherDistribution[result.metadata.weather] = 
          (weatherDistribution[result.metadata.weather] || 0) + 1;
      }
    });

    return {
      totalResults: results.length,
      dateRange,
      emotionDistribution,
      weatherDistribution
    };
  }
}