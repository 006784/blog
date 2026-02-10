import { NextRequest } from 'next/server';
import { NewsCollectionService } from '@/lib/news/news-collection-service';
import { logger } from '@/lib/logger';

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 新闻源管理API
 * GET /api/news/sources - 获取新闻源列表
 * POST /api/news/sources - 测试特定新闻源
 */
export async function GET(request: NextRequest) {
  try {
    const newsService = new NewsCollectionService();
    const sourcesStatus = newsService.getSourcesStatus();
    
    return Response.json({
      success: true,
      data: sourcesStatus.map(status => ({
        id: status.source.id,
        name: status.source.name,
        category: status.source.category,
        language: status.source.language,
        country: status.source.country,
        isActive: status.isActive,
        lastChecked: status.lastChecked
      }))
    });
    
  } catch (error) {
    logger.error('获取新闻源列表失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '获取新闻源列表失败'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId } = body;
    
    if (!sourceId) {
      return Response.json({
        success: false,
        error: '缺少新闻源ID'
      }, { status: 400 });
    }
    
    const newsService = new NewsCollectionService();
    const testResult = await newsService.testSource(sourceId);
    
    return Response.json({
      success: true,
      data: testResult
    });
    
  } catch (error) {
    logger.error('测试新闻源失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '测试新闻源失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}