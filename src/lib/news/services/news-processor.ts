// 新闻处理和去重服务
import { RawNewsItem, ProcessedNewsItem, NewsAggregationStats } from '../../types/news';
import { TranslationService } from './translation-service';
import { logger } from '../../logger';
import crypto from 'crypto';

export class NewsProcessor {
  private processedItems: Set<string> = new Set(); // 用于快速去重检查

  /**
   * 处理原始新闻项
   */
  async processNewsItems(rawItems: RawNewsItem[]): Promise<{
    processedItems: ProcessedNewsItem[];
    stats: NewsAggregationStats;
  }> {
    const startTime = Date.now();
    
    // 1. 去重
    const uniqueItems = this.removeDuplicates(rawItems);
    const duplicatesRemoved = rawItems.length - uniqueItems.length;
    
    // 2. 翻译
    const translatedItems = await this.translateItems(uniqueItems);
    const translationsCompleted = translatedItems.length;
    
    // 3. 评分和排序
    const scoredItems = this.scoreAndSortItems(translatedItems);
    
    // 4. 生成统计信息
    const stats: NewsAggregationStats = {
      totalCollected: rawItems.length,
      totalProcessed: scoredItems.length,
      duplicatesRemoved,
      translationsCompleted,
      categoriesDistribution: this.getCategoriesDistribution(scoredItems),
      sourcesDistribution: this.getSourcesDistribution(scoredItems),
      processingTime: Date.now() - startTime
    };

    logger.info('新闻处理完成', stats);

    return {
      processedItems: scoredItems,
      stats
    };
  }

  /**
   * 去重处理
   */
  private removeDuplicates(items: RawNewsItem[]): RawNewsItem[] {
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueItems: RawNewsItem[] = [];

    for (const item of items) {
      // 生成标题哈希用于模糊匹配
      const titleHash = this.generateTitleHash(item.title);
      const urlHash = this.generateUrlHash(item.url);

      // 检查是否已存在相似内容
      if (!seenTitles.has(titleHash) && !seenUrls.has(urlHash)) {
        seenTitles.add(titleHash);
        seenUrls.add(urlHash);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  }

  /**
   * 生成标题哈希（用于相似度比较）
   */
  private generateTitleHash(title: string): string {
    // 移除标点符号和多余空格，转换为小写
    const normalized = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 16);
  }

  /**
   * 生成URL哈希
   */
  private generateUrlHash(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * 翻译新闻项
   */
  private async translateItems(items: RawNewsItem[]): Promise<ProcessedNewsItem[]> {
    const processedItems: ProcessedNewsItem[] = [];

    for (const item of items) {
      try {
        // 翻译标题
        const titleTranslation = await TranslationService.translateToChinese(
          item.title, 
          item.language
        );

        // 翻译内容（如果非中文）
        let contentTranslation = { translatedText: item.content };
        if (item.language !== 'zh') {
          contentTranslation = await TranslationService.translateToChinese(
            item.content.substring(0, 1000), // 限制长度
            item.language
          );
        }

        // 生成摘要
        const summary = this.generateSummary(
          contentTranslation.translatedText || item.content
        );

        const processedItem: ProcessedNewsItem = {
          id: this.generateItemId(item),
          originalTitle: item.title,
          translatedTitle: titleTranslation.translatedText,
          originalContent: item.content,
          translatedContent: contentTranslation.translatedText,
          summary,
          url: item.url,
          publishedAt: item.publishedAt,
          source: item.source,
          author: item.author,
          imageUrl: item.imageUrl,
          originalLanguage: item.language,
          categories: item.categories,
          tags: item.tags,
          importanceScore: 0, // 稍后计算
          isDuplicate: false,
          createdAt: new Date()
        };

        processedItems.push(processedItem);
      } catch (error) {
        logger.error('处理新闻项失败', {
          title: item.title,
          source: item.source,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return processedItems;
  }

  /**
   * 生成项目ID
   */
  private generateItemId(item: RawNewsItem): string {
    const content = `${item.title}-${item.source}-${item.publishedAt.getTime()}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 生成摘要
   */
  private generateSummary(content: string): string {
    // 简单的摘要生成：提取前几句
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const summarySentences = sentences.slice(0, 2); // 取前两句
    
    let summary = summarySentences.join('。');
    if (summary.length > 200) {
      summary = summary.substring(0, 200) + '...';
    }
    
    return summary || '暂无摘要';
  }

  /**
   * 评分和排序
   */
  private scoreAndSortItems(items: ProcessedNewsItem[]): ProcessedNewsItem[] {
    return items
      .map(item => ({
        ...item,
        importanceScore: this.calculateImportanceScore(item)
      }))
      .sort((a, b) => b.importanceScore - a.importanceScore);
  }

  /**
   * 计算重要性评分
   */
  private calculateImportanceScore(item: ProcessedNewsItem): number {
    let score = 50; // 基础分数

    // 来源权重 (更新后的权重)
    const sourceWeights: Record<string, number> = {
      // 国际权威媒体
      '路透社': 25,
      'BBC': 25,
      '美联社': 25,
      'CNN International': 22,
      '半岛电视台': 20,
      
      // 科技专业媒体
      'TechCrunch': 22,
      'The Verge': 20,
      'Wired': 20,
      'Ars Technica': 18,
      '36氪': 18,
      'Engadget': 15,
      
      // 财经商业媒体
      '彭博社': 22,
      'CNBC': 20,
      '华尔街日报': 20,
      '经济学人': 18,
      '财新网': 18,
      '金融时报': 15,
      
      // 政治时事媒体
      'Politico': 20,
      '卫报政治': 18,
      'Axios Politics': 15,
      
      // 娱乐文化媒体
      'Variety': 15,
      '滚石杂志': 12,
      'Billboard': 12,
      
      // 体育媒体
      'ESPN': 15,
      '体育画报': 12,
      'The Athletic': 10,
      
      // 科学媒体
      '科学美国人': 18,
      '自然杂志': 18,
      '科学杂志': 15,
      'Phys.org': 12
    };
    score += sourceWeights[item.source] || 5;

    // 分类权重 (调整后的权重)
    const categoryWeights: Record<string, number> = {
      'international': 20,   // 国际新闻最高权重
      'technology': 15,      // 科技新闻
      'business': 12,        // 商业财经
      'politics': 10,        // 政治时事
      'science': 8,          // 科学探索
      'entertainment': 5,    // 娱乐文化
      'sports': 3            // 体育新闻
    };
    const primaryCategory = this.getPrimaryCategory(item);
    score += categoryWeights[primaryCategory] || 3;

    // 内容质量加分
    if (item.translatedContent && item.translatedContent.length > 500) {
      score += 8;  // 长内容加分
    } else if (item.translatedContent && item.translatedContent.length > 300) {
      score += 5;
    }
    
    if (item.imageUrl) {
      score += 4;   // 有图片加分
    }
    
    if (item.summary && item.summary.length > 100) {
      score += 3;   // 详细摘要加分
    }

    // 时间衰减（越新的新闻分数越高）
    const hoursOld = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.max(0, 25 - hoursOld * 0.8);  // 调整衰减速度
    score += timeDecay;

    // 特殊关键词加权
    const title = item.translatedTitle.toLowerCase();
    const content = (item.translatedContent || '').toLowerCase();
    const fullText = title + ' ' + content;
    
    // 重大事件关键词
    const majorEventKeywords = [
      '战争', '冲突', '危机', '灾难', '疫情', 'election', 'elections',
      'breaking', '紧急', '突发', '重磅', '重大', '历史性', 'historic'
    ];
    
    // 科技突破关键词
    const techKeywords = [
      '人工智能', 'ai', 'machine learning', '突破', 'revolutionary',
      '创新', 'innovation', '发现', 'discovery', '研究成果'
    ];
    
    majorEventKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 15;
    });
    
    techKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 10;
    });

    return Math.min(100, Math.max(0, score)); // 限制在0-100之间
  }

  /**
   * 获取分类分布统计
   */
  private getCategoriesDistribution(items: ProcessedNewsItem[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    items.forEach(item => {
      const category = this.getPrimaryCategory(item);
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  /**
   * 获取来源分布统计
   */
  private getSourcesDistribution(items: ProcessedNewsItem[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    items.forEach(item => {
      distribution[item.source] = (distribution[item.source] || 0) + 1;
    });
    return distribution;
  }

  private getPrimaryCategory(item: Pick<ProcessedNewsItem, 'categories'>): string {
    const raw = item.categories?.[0];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
    return 'other';
  }
}
