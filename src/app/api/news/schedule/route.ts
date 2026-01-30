import { NextRequest } from 'next/server';
import { NewsCollectionService } from '@/lib/news/news-collection-service';
import { ScheduleManager, DEFAULT_SCHEDULED_CONFIG } from '@/lib/news/schedule-config';
import { logger } from '@/lib/logger';

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 0;

/**
 * 定时新闻发送管理API
 * GET /api/news/schedule - 获取定时任务状态
 * POST /api/news/schedule - 创建/更新定时任务
 * DELETE /api/news/schedule - 删除定时任务
 * PUT /api/news/schedule/run - 立即执行定时任务
 */
export async function GET(request: NextRequest) {
  try {
    const scheduleManager = ScheduleManager.getInstance();
    const schedules = scheduleManager.getAllSchedules();
    
    return Response.json({
      success: true,
      data: {
        schedules: schedules.map(s => ({
          id: s.id,
          config: {
            cronExpression: s.config.cronExpression,
            sendTime: s.config.sendTime,
            timezone: s.config.timezone,
            recipientEmail: s.config.recipientEmail,
            enabled: s.config.enabled,
            categories: s.config.categories,
            minImportanceScore: s.config.minImportanceScore,
            maxItemsPerCategory: s.config.maxItemsPerCategory
          },
          status: {
            lastRun: s.status.lastRun,
            nextRun: s.status.nextRun,
            totalRuns: s.status.totalRuns,
            successCount: s.status.successCount,
            failureCount: s.status.failureCount,
            lastError: s.status.lastError
          }
        }))
      }
    });
    
  } catch (error) {
    logger.error('获取定时任务状态失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '获取定时任务状态失败'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      scheduleId = 'default',
      cronExpression,
      sendTime,
      timezone = 'Asia/Shanghai',
      recipientEmail = '2047389870@qq.com',
      enabled = true,
      categories = ['international', 'technology', 'business', 'politics', 'science'],
      minImportanceScore = 60,
      maxItemsPerCategory = 5
    } = body;
    
    // 验证必要参数
    if (!cronExpression || !sendTime) {
      return Response.json({
        success: false,
        error: '缺少必要的定时配置参数'
      }, { status: 400 });
    }
    
    const scheduleConfig = {
      cronExpression,
      sendTime,
      timezone,
      recipientEmail,
      enabled,
      categories,
      minImportanceScore,
      maxItemsPerCategory
    };
    
    const scheduleManager = ScheduleManager.getInstance();
    scheduleManager.addSchedule(scheduleId, scheduleConfig);
    
    logger.info('定时任务创建成功', { scheduleId, recipientEmail });
    
    return Response.json({
      success: true,
      message: '定时任务创建成功',
      data: {
        scheduleId,
        config: scheduleConfig
      }
    });
    
  } catch (error) {
    logger.error('创建定时任务失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '创建定时任务失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'run') {
      // 立即执行定时任务
      const body = await request.json();
      const { scheduleId = 'default' } = body;
      
      const scheduleManager = ScheduleManager.getInstance();
      const schedules = scheduleManager.getAllSchedules();
      const schedule = schedules.find(s => s.id === scheduleId);
      
      if (!schedule) {
        return Response.json({
          success: false,
          error: '定时任务不存在'
        }, { status: 404 });
      }
      
      if (!schedule.config.enabled) {
        return Response.json({
          success: false,
          error: '定时任务已被禁用'
        }, { status: 400 });
      }
      
      logger.info('立即执行定时任务', { scheduleId });
      
      try {
        const newsService = new NewsCollectionService();
        const newsletterConfig = {
          recipientEmail: schedule.config.recipientEmail,
          sendTime: schedule.config.sendTime,
          timezone: schedule.config.timezone,
          categories: schedule.config.categories,
          minImportanceScore: schedule.config.minImportanceScore,
          maxItemsPerCategory: schedule.config.maxItemsPerCategory,
          includeSummary: true,
          includeImages: true
        };
        const result = await newsService.collectDailyNews(newsletterConfig);
        
        scheduleManager.updateStatus(scheduleId, true);
        
        return Response.json({
          success: true,
          message: '定时任务执行成功',
          data: {
            newsletterId: result.id,
            itemsCount: result.totalItems,
            categoriesCount: result.categories.length
          }
        });
        
      } catch (executionError) {
        scheduleManager.updateStatus(scheduleId, false, 
          executionError instanceof Error ? executionError.message : '执行失败');
        
        throw executionError;
      }
    }
    
    return Response.json({
      success: false,
      error: '不支持的操作'
    }, { status: 400 });
    
  } catch (error) {
    logger.error('执行定时任务失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '执行定时任务失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id') || 'default';
    
    // 这里应该从存储中删除定时任务
    // 目前只是模拟删除操作
    
    logger.info('定时任务删除成功', { scheduleId });
    
    return Response.json({
      success: true,
      message: '定时任务删除成功'
    });
    
  } catch (error) {
    logger.error('删除定时任务失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '删除定时任务失败'
    }, { status: 500 });
  }
}