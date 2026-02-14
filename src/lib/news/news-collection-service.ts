// 主新闻收集服务
import { NEWS_SOURCES, getActiveSources, NEWS_CATEGORIES } from './sources';
import { RSSCollector } from './collectors/rss-collector';
import { NewsProcessor } from './services/news-processor';
import { 
  NewsSource, 
  RawNewsItem, 
  ProcessedNewsItem, 
  DailyNewsletter,
  NewsletterConfig,
  NewsCategory
} from '../types/news';
import { logger } from '../logger';
import { Resend } from 'resend';

export class NewsCollectionService {
  private rssCollector: RSSCollector;
  private newsProcessor: NewsProcessor;

  constructor() {
    this.rssCollector = new RSSCollector();
    this.newsProcessor = new NewsProcessor();
  }

  /**
   * 执行完整的新闻收集流程
   */
  async collectDailyNews(config?: NewsletterConfig): Promise<DailyNewsletter> {
    const startTime = Date.now();
    logger.info('开始每日新闻收集');

    try {
      // 1. 收集原始新闻
      const activeSources = getActiveSources();
      const rawItems = await this.rssCollector.collectMultipleSources(activeSources);
      
      logger.info(`收集到原始新闻: ${rawItems.length} 条`);

      // 2. 处理和翻译新闻
      const { processedItems, stats } = await this.newsProcessor.processNewsItems(rawItems);
      
      logger.info('新闻处理完成', stats);

      // 3. 按分类组织
      const categorizedNews = this.organizeByCategory(processedItems, config);

      // 4. 生成日报
      const newsletter: DailyNewsletter = {
        id: this.generateNewsletterId(),
        date: new Date(),
        title: `今日新闻简报 - ${new Date().toLocaleDateString('zh-CN')}`,
        categories: categorizedNews,
        totalItems: processedItems.length,
        createdAt: new Date()
      };

      // 5. 发送邮件（如果有配置）
      if (config?.recipientEmail) {
        await this.sendNewsletter(newsletter, config);
      }

      logger.info(`新闻收集完成，耗时: ${Date.now() - startTime}ms`);

      return newsletter;
    } catch (error) {
      logger.error('新闻收集失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 按分类组织新闻
   */
  private organizeByCategory(
    items: ProcessedNewsItem[], 
    config?: NewsletterConfig
  ): { category: NewsCategory; items: ProcessedNewsItem[] }[] {
    const categoryMap = new Map<string, ProcessedNewsItem[]>();
    
    // 初始化所有分类
    NEWS_CATEGORIES.forEach(category => {
      categoryMap.set(category.id, []);
    });

    // 分类新闻项
    items.forEach(item => {
      const primaryCategory = typeof item.categories?.[0] === 'string' && item.categories[0]
        ? item.categories[0]
        : 'other';
      if (categoryMap.has(primaryCategory)) {
        categoryMap.get(primaryCategory)?.push(item);
      } else {
        categoryMap.get('other')?.push(item);
      }
    });

    // 应用配置过滤
    const filteredCategories = Array.from(categoryMap.entries())
      .map(([categoryId, categoryItems]) => {
        const category = NEWS_CATEGORIES.find(c => c.id === categoryId) || 
                        NEWS_CATEGORIES.find(c => c.id === 'other')!;
        
        // 过滤低重要性新闻
        let filteredItems = categoryItems;
        if (config?.minImportanceScore) {
          filteredItems = categoryItems.filter(
            item => item.importanceScore >= config.minImportanceScore
          );
        }

        // 限制每分类数量
        if (config?.maxItemsPerCategory) {
          filteredItems = filteredItems.slice(0, config.maxItemsPerCategory);
        }

        return {
          category,
          items: filteredItems
        };
      })
      .filter(result => result.items.length > 0); // 移除空分类

    return filteredCategories;
  }

  /**
   * 发送新闻简报邮件
   */
  private async sendNewsletter(newsletter: DailyNewsletter, config: NewsletterConfig) {
    try {
      const htmlContent = this.generateNewsletterHTML(newsletter, config);
      const textContent = this.generateNewsletterText(newsletter, config);
      
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: '拾光博客新闻 <news@artchain.icu>',
        to: config.recipientEmail,
        subject: newsletter.title,
        text: textContent,
        html: htmlContent
      });

      logger.info(`新闻简报邮件发送成功: ${config.recipientEmail}`);
    } catch (error) {
      logger.error('发送新闻简报邮件失败', {
        email: config.recipientEmail,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 生成HTML格式的新闻简报
   */
  private generateNewsletterHTML(newsletter: DailyNewsletter, config: NewsletterConfig): string {
    const categoriesHtml = newsletter.categories
      .map((categoryGroup: { category: NewsCategory; items: ProcessedNewsItem[] }) => {
        if (categoryGroup.items.length === 0) return '';

        const itemsHtml = categoryGroup.items
          .map((item: ProcessedNewsItem) => `
            <div style="margin-bottom: 25px; padding: 20px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.3s ease;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600; line-height: 1.4; flex: 1;">
                  <a href="${item.url}" style="color: #3b82f6; text-decoration: none; transition: color 0.2s ease;" target="_blank" rel="noopener noreferrer">
                    ${item.translatedTitle}
                  </a>
                </h3>
                <div style="background-color: ${categoryGroup.category.color}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-left: 15px; white-space: nowrap;">
                  ${categoryGroup.category.icon} ${categoryGroup.category.name}
                </div>
              </div>
              
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                ${item.summary}
              </p>
              
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 15px;">
                <div>
                  <span style="margin-right: 15px;">📰 ${item.source}</span>
                  <span>⏰ ${item.publishedAt.toLocaleString('zh-CN')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background-color: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 12px; font-size: 11px;">
                    重要度: ${Math.round(item.importanceScore)}
                  </span>
                  ${item.imageUrl ? '<span style="color: #10b981;">📸 有图片</span>' : ''}
                </div>
              </div>
              
              ${item.imageUrl ? `
                <div style="margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                  <img src="${item.imageUrl}" alt="新闻图片" style="width: 100%; height: auto; display: block;" onerror="this.style.display='none'">
                </div>
              ` : ''}
            </div>
          `).join('');

        return `
          <div style="margin-bottom: 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid ${categoryGroup.category.color};">
              <h2 style="color: ${categoryGroup.category.color}; font-size: 24px; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                ${categoryGroup.category.icon} ${categoryGroup.category.displayName}
              </h2>
              <span style="background-color: ${categoryGroup.category.color}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; margin-left: 15px;">
                ${categoryGroup.items.length} 条
              </span>
            </div>
            ${itemsHtml}
          </div>
        `;
      }).join('');

    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${newsletter.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          a:hover { opacity: 0.8; }
        </style>
      </head>
      <body style="font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden;">
          
          <!-- 头部横幅 -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center; color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white"/><circle cx="50" cy="50" r="1.5" fill="white"/><circle cx="80" cy="30" r="1" fill="white"/></svg>');"></div>
            <div style="position: relative; z-index: 1;">
              <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: 1px;">
                📰 每日新闻简报
              </h1>
              <p style="font-size: 18px; margin: 0; opacity: 0.9; font-weight: 300;">
                ${new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style="font-size: 14px; margin: 15px 0 0 0; opacity: 0.8;">
                为您精选的全球新闻资讯
              </p>
            </div>
          </div>

          <!-- 统计信息卡片 -->
          <div style="background-color: #eff6ff; padding: 25px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${newsletter.totalItems}</div>
                <div style="font-size: 14px; color: #4b5563;">总新闻数</div>
              </div>
              <div>
                <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${newsletter.categories.length}</div>
                <div style="font-size: 14px; color: #4b5563;">新闻分类</div>
              </div>
              <div>
                <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${Math.round(newsletter.totalItems / newsletter.categories.length)}</div>
                <div style="font-size: 14px; color: #4b5563;">平均每类</div>
              </div>
            </div>
          </div>

          <!-- 新闻内容主体 -->
          <div style="padding: 40px 30px;">
            ${categoriesHtml}
          </div>

          <!-- 底部信息 -->
          <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px; text-align: center; color: #6b7280; font-size: 13px;">
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 10px 0; font-weight: 500;">📬 邮件信息</p>
              <p style="margin: 0;">此邮件由拾光博客新闻收集系统自动生成</p>
              <p style="margin: 5px 0 0 0;">如需调整订阅设置，请联系管理员</p>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0;">© 2026 拾光博客 • 致力于为您提供优质的新闻资讯服务</p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成纯文本格式的新闻简报
   */
  private generateNewsletterText(newsletter: DailyNewsletter, config: NewsletterConfig): string {
    let text = `📰 ${newsletter.title}\n`;
    text += `日期: ${new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    text += `今日共收集 ${newsletter.totalItems} 条新闻，涵盖 ${newsletter.categories.length} 个分类\n\n`;

    newsletter.categories.forEach((categoryGroup: { category: NewsCategory; items: ProcessedNewsItem[] }) => {
      if (categoryGroup.items.length === 0) return;
      
      text += `\n${categoryGroup.category.displayName}\n`;
      text += '='.repeat(30) + '\n\n';
      
      categoryGroup.items.forEach((item: ProcessedNewsItem, index: number) => {
        text += `${index + 1}. ${item.translatedTitle}\n`;
        text += `   ${item.summary}\n`;
        text += `   来源: ${item.source} | 时间: ${item.publishedAt.toLocaleString('zh-CN')}\n`;
        text += `   链接: ${item.url}\n\n`;
      });
    });

    text += '\n--\n本邮件由拾光博客新闻收集系统自动生成\n如需调整订阅设置，请联系管理员';

    return text;
  }

  /**
   * 生成简报ID
   */
  private generateNewsletterId(): string {
    return `newsletter_${new Date().toISOString().slice(0, 10)}_${Date.now()}`;
  }

  /**
   * 获取新闻源状态
   */
  getSourcesStatus(): { source: NewsSource; isActive: boolean; lastChecked?: Date }[] {
    return NEWS_SOURCES.map(source => ({
      source,
      isActive: source.isActive,
      lastChecked: source.lastFetched
    }));
  }

  /**
   * 测试单个新闻源
   */
  async testSource(sourceId: string): Promise<{ success: boolean; itemCount: number; error?: string }> {
    const source = NEWS_SOURCES.find(s => s.id === sourceId);
    if (!source) {
      return { success: false, itemCount: 0, error: '新闻源不存在' };
    }

    try {
      const items = await this.rssCollector.collectFromSource(source);
      return { success: true, itemCount: items.length };
    } catch (error) {
      return { 
        success: false, 
        itemCount: 0, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}
