import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';


// 配置静态导出
export const dynamic = "force-static";
export const revalidate = 0;
export async function GET(request: NextRequest) {
  try {
    logger.info('收到测试日志API请求', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });
    
    // 模拟一些操作
    logger.debug('开始处理测试请求');
    
    // 模拟可能的错误
    if (Math.random() > 0.8) {
      throw new Error('模拟的随机错误');
    }
    
    const testData = {
      message: '日志系统测试成功',
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7)
    };
    
    logger.info('测试请求处理完成', { testData });
    
    return NextResponse.json({ 
      success: true, 
      data: testData,
      logsEnabled: true
    });
    
  } catch (error) {
    logger.error('测试API发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: '测试API错误',
        message: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.info('收到POST测试请求', { body: body.data || '无数据' });
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({ 
      success: true, 
      received: body,
      processed: true
    });
    
  } catch (error) {
    logger.error('POST测试请求处理失败', { error });
    return NextResponse.json(
      { success: false, error: 'POST请求处理失败' }, 
      { status: 400 }
    );
  }
}