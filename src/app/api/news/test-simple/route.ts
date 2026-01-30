// 简化测试版本 - 避免复杂对象序列化问题
import { NextRequest } from 'next/server';
import { NewsCollectionService } from '@/lib/news/news-collection-service';
import { logger } from '@/lib/logger';

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail } = body;
    
    if (!recipientEmail) {
      return Response.json({
        success: false,
        error: '缺少收件人邮箱'
      }, { status: 400 });
    }
    
    logger.info('手动触发新闻收集', { recipientEmail });
    
    // 创建简化配置
    const config = {
      recipientEmail,
      sendTime: '09:00',
      timezone: 'Asia/Shanghai',
      categories: ['technology'],
      minImportanceScore: 70,
      maxItemsPerCategory: 2,
      includeSummary: true,
      includeImages: false
    };
    
    // 先测试收集功能（不发送邮件）
    const newsService = new NewsCollectionService();
    
    // 只收集科技类新闻进行测试
    const testSources = [
      { id: 'techcrunch', name: 'TechCrunch', url: 'http://feeds.feedburner.com/TechCrunch/', type: 'rss', category: 'technology', language: 'en', country: 'US', isActive: true },
      { id: 'the-verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss', category: 'technology', language: 'en', country: 'US', isActive: true }
    ] as any;
    
    // 模拟收集结果
    const mockResult = {
      id: `test_${Date.now()}`,
      date: new Date().toISOString(),
      title: `测试新闻简报 - ${new Date().toLocaleDateString('zh-CN')}`,
      categories: [
        {
          category: {
            id: 'technology',
            name: '科技',
            displayName: '💻 科技前沿',
            description: '科技创新、互联网、人工智能',
            color: '#8b5cf6',
            icon: '💻'
          },
          items: [
            {
              translatedTitle: '人工智能技术最新进展',
              summary: 'AI技术在各个领域的应用持续扩展，包括自然语言处理、计算机视觉等方面的重要突破。',
              source: 'TechCrunch',
              publishedAt: new Date().toISOString(),
              url: 'https://techcrunch.com',
              importanceScore: 85
            },
            {
              translatedTitle: '云计算服务市场快速增长',
              summary: '随着数字化转型加速，云服务需求激增，各大厂商纷纷扩大基础设施投入。',
              source: 'The Verge',
              publishedAt: new Date().toISOString(),
              url: 'https://theverge.com',
              importanceScore: 78
            }
          ]
        }
      ],
      totalItems: 2,
      createdAt: new Date().toISOString()
    };
    
    // 发送测试邮件
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>测试新闻简报</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">📰 测试新闻简报</h1>
          <p>日期: ${new Date().toLocaleDateString('zh-CN')}</p>
          
          <div style="background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #8b5cf6;">💻 科技前沿</h2>
            <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
              <h3><a href="https://techcrunch.com" style="color: #667eea;">人工智能技术最新进展</a></h3>
              <p>AI技术在各个领域的应用持续扩展，包括自然语言处理、计算机视觉等方面的重要突破。</p>
              <small>来源: TechCrunch</small>
            </div>
            <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
              <h3><a href="https://theverge.com" style="color: #667eea;">云计算服务市场快速增长</a></h3>
              <p>随着数字化转型加速，云服务需求激增，各大厂商纷纷扩大基础设施投入。</p>
              <small>来源: The Verge</small>
            </div>
          </div>
          
          <hr>
          <p style="color: #666; font-size: 12px;">这是测试邮件，验证新闻收集系统功能</p>
        </body>
        </html>
      `;
      
      const textContent = `
📰 测试新闻简报
日期: ${new Date().toLocaleDateString('zh-CN')}

💻 科技前沿
============
1. 人工智能技术最新进展
   AI技术在各个领域的应用持续扩展，包括自然语言处理、计算机视觉等方面的重要突破。
   来源: TechCrunch

2. 云计算服务市场快速增长
   随着数字化转型加速，云服务需求激增，各大厂商纷纷扩大基础设施投入。
   来源: The Verge

---
这是测试邮件，验证新闻收集系统功能
      `;
      
      // 使用Resend发送邮件
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: '拾光博客新闻 <news@artchain.icu>',
        to: recipientEmail,
        subject: mockResult.title,
        text: textContent,
        html: htmlContent
      });
      
      logger.info('测试邮件发送成功', { recipientEmail });
      
      return Response.json({
        success: true,
        message: '测试邮件发送成功',
        data: {
          newsletterId: mockResult.id,
          itemsCount: mockResult.totalItems,
          categoriesCount: mockResult.categories.length,
          recipient: recipientEmail
        }
      });
      
    } catch (emailError) {
      logger.error('邮件发送失败', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
        recipient: recipientEmail
      });
      
      return Response.json({
        success: false,
        error: '邮件发送失败',
        message: emailError instanceof Error ? emailError.message : '未知错误',
        debug: {
          recipient: recipientEmail,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error('测试失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return Response.json({
      success: false,
      error: '测试失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}