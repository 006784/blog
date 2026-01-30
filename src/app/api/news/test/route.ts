import { NextRequest } from 'next/server';
import { NewsCollectionService } from '@/lib/news/news-collection-service';
import { logger } from '@/lib/logger';

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 0;

/**
 * 测试新闻收集API
 * GET /api/news/test - 测试新闻收集功能
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test') === 'true';
    
    logger.info('开始测试新闻收集功能');

    const newsService = new NewsCollectionService();
    
    // 简单测试模式 - 只收集少量新闻
    if (testMode) {
      const testConfig = {
        recipientEmail: 'test@example.com',
        sendTime: '09:00',
        timezone: 'Asia/Shanghai',
        categories: ['technology', 'international'],
        minImportanceScore: 60,
        maxItemsPerCategory: 3,
        includeSummary: true,
        includeImages: false
      };
      
      const result = await newsService.collectDailyNews(testConfig);
      
      return Response.json({
        success: true,
        message: '新闻收集测试成功',
        data: {
          newsletterId: result.id,
          title: result.title,
          totalItems: result.totalItems,
          categories: result.categories.map(cat => ({
            name: cat.category.displayName,
            itemCount: cat.items.length
          })),
          sampleItems: result.categories
            .flatMap(cat => cat.items)
            .slice(0, 5)
            .map(item => ({
              title: item.translatedTitle,
              source: item.source,
              category: item.categories[0],
              importanceScore: item.importanceScore
            }))
        }
      });
    }
    
    // 完整测试
    const fullResult = await newsService.collectDailyNews();
    
    return Response.json({
      success: true,
      message: '完整新闻收集测试成功',
      data: {
        newsletterId: fullResult.id,
        title: fullResult.title,
        totalItems: fullResult.totalItems,
        categories: fullResult.categories.length
      }
    });
    
  } catch (error) {
    logger.error('新闻收集测试失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '新闻收集测试失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/**
 * 手动触发新闻收集
 * POST /api/news/collect - 手动收集并发送新闻
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipientEmail,
      categories = ['international', 'technology', 'business', 'politics'],
      minImportanceScore = 50,
      maxItemsPerCategory = 5
    } = body;
    
    if (!recipientEmail) {
      return Response.json({
        success: false,
        error: '缺少收件人邮箱'
      }, { status: 400 });
    }
    
    logger.info('手动触发新闻收集', { recipientEmail });
    
    const newsService = new NewsCollectionService();
    const config = {
      recipientEmail,
      sendTime: '09:00',
      timezone: 'Asia/Shanghai',
      categories,
      minImportanceScore,
      maxItemsPerCategory,
      includeSummary: true,
      includeImages: true
    };
    
    const result = await newsService.collectDailyNews(config);
    
    return Response.json({
      success: true,
      message: '新闻收集并发送成功',
      data: {
        newsletterId: result.id,
        itemsCount: result.totalItems,
        categoriesCount: result.categories.length
      }
    });
    
  } catch (error) {
    logger.error('手动新闻收集失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '新闻收集失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}