// RSS新闻收集器
import Parser from 'rss-parser';
import { RawNewsItem, NewsSource } from '../../types/news';
import { logger } from '../../logger';

interface RSSFeedItem {
  title: string;
  content: string;
  contentSnippet?: string;
  link: string;
  pubDate?: string;
  creator?: string;
  isoDate?: string;
  categories?: unknown[];
}

export class RSSCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
  }

  async collectFromSource(source: NewsSource): Promise<RawNewsItem[]> {
    try {
      logger.info(`开始收集RSS源: ${source.name}`, { sourceId: source.id });
      
      const feed = await this.parser.parseURL(source.url);
      const items = feed.items.slice(0, 20); // 限制每次最多20条
      
      const newsItems: RawNewsItem[] = items
        .filter(item => item.title && item.link && (item.pubDate || item.isoDate))
        .map(item => this.transformToNewsItem(item as RSSFeedItem, source));

      logger.info(`RSS源收集完成: ${source.name}`, { 
        sourceId: source.id, 
        itemCount: newsItems.length 
      });

      return newsItems;
    } catch (error) {
      logger.error(`RSS收集失败: ${source.name}`, {
        sourceId: source.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private isValidItem(item: RSSFeedItem): boolean {
    return !!(
      item.title &&
      (item.content || item.contentSnippet) &&
      item.link &&
      (item.pubDate || item.isoDate)
    );
  }

  private transformToNewsItem(item: RSSFeedItem, source: NewsSource): RawNewsItem {
    const publishedAt = new Date(item.pubDate || item.isoDate || new Date());
    
    // 提取内容，优先使用完整内容，否则使用摘要
    const content = item.content || item.contentSnippet || '';
    
    // 提取图片URL（简单实现）
    const imageUrl = this.extractImageUrl(content);
    
    // 提取分类标签
    const categories = this.normalizeCategories(item.categories, source.category);
    const tags = this.extractTags(content, item.title);

    return {
      title: item.title.trim(),
      description: (item.contentSnippet || '').substring(0, 300),
      content: content,
      url: item.link,
      publishedAt,
      source: source.name,
      author: item.creator,
      imageUrl,
      language: source.language,
      categories,
      tags
    };
  }

  private normalizeCategories(rawCategories: unknown[] | undefined, fallback: string): string[] {
    if (!Array.isArray(rawCategories)) {
      return [fallback];
    }

    const normalized = rawCategories
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item === 'object') {
          const obj = item as { term?: unknown; label?: unknown; name?: unknown };
          const candidate = [obj.term, obj.label, obj.name].find(
            (value) => typeof value === 'string' && value.trim().length > 0
          );
          return typeof candidate === 'string' ? candidate.trim() : '';
        }

        return '';
      })
      .filter((value): value is string => value.length > 0);

    return normalized.length > 0 ? normalized : [fallback];
  }

  private extractImageUrl(content: string): string | undefined {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
    const match = content.match(imgRegex);
    return match ? match[1] : undefined;
  }

  private extractTags(content: string, title: string): string[] {
    const text = `${title} ${content}`;
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    
    // 添加基于关键词的标签
    const keywords = ['AI', '人工智能', '科技', '经济', '政治', '文化'];
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword.toLowerCase());
      }
    });
    
    return [...new Set(tags)]; // 去重
  }

  async collectMultipleSources(sources: NewsSource[]): Promise<RawNewsItem[]> {
    const allItems: RawNewsItem[] = [];
    
    for (const source of sources) {
      const items = await this.collectFromSource(source);
      allItems.push(...items);
    }
    
    return allItems;
  }
}
