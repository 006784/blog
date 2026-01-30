import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 配置静态导出
export const dynamic = "force-static";
export const revalidate = 0;

// 生成访客ID（基于IP和User-Agent的哈希）
function generateVisitorId(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// 哈希IP地址（隐私保护）
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
}

// 解析User-Agent获取设备信息
function parseUserAgent(ua: string): { device: string; browser: string } {
  let device = 'desktop';
  let browser = 'unknown';
  
  // 设备检测
  if (/mobile/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';
  
  // 浏览器检测
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  
  return { device, browser };
}

// POST - 记录页面访问
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, title, postId } = body;
    
    if (!path) {
      return NextResponse.json({ success: false, error: '缺少页面路径' }, { status: 400 });
    }
    
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    const visitorId = generateVisitorId(ip, userAgent);
    const ipHash = hashIP(ip);
    const { device, browser } = parseUserAgent(userAgent);
    
    // 插入访问记录
    await supabase.from('page_views').insert({
      page_path: path,
      page_title: title || null,
      post_id: postId || null,
      visitor_id: visitorId,
      ip_hash: ipHash,
      user_agent: userAgent.substring(0, 500),
      referer: referer.substring(0, 500),
      device_type: device,
      browser: browser,
    });
    
    return NextResponse.json({ success: true, visitorId });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// GET - 获取统计数据（仅管理员）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    if (type === 'overview') {
      // 总览数据
      const [pvResult, uvResult, postsResult, topPagesResult] = await Promise.all([
        // 总PV
        supabase.from('page_views')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        // 总UV
        supabase.from('page_views')
          .select('visitor_id')
          .gte('created_at', startDate.toISOString()),
        // 文章统计
        supabase.from('post_stats')
          .select('view_count, like_count, bookmark_count'),
        // 热门页面
        supabase.from('page_views')
          .select('page_path, page_title')
          .gte('created_at', startDate.toISOString())
          .limit(100),
      ]);
      
      const uniqueVisitors = new Set(uvResult.data?.map(v => v.visitor_id)).size;
      
      // 统计热门页面
      const pageCounts: Record<string, { count: number; title: string }> = {};
      topPagesResult.data?.forEach(p => {
        if (!pageCounts[p.page_path]) {
          pageCounts[p.page_path] = { count: 0, title: p.page_title || p.page_path };
        }
        pageCounts[p.page_path].count++;
      });
      
      const topPages = Object.entries(pageCounts)
        .map(([path, data]) => ({ path, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // 计算总互动
      const totalStats = postsResult.data?.reduce((acc, s) => ({
        views: acc.views + (s.view_count || 0),
        likes: acc.likes + (s.like_count || 0),
        bookmarks: acc.bookmarks + (s.bookmark_count || 0),
      }), { views: 0, likes: 0, bookmarks: 0 }) || { views: 0, likes: 0, bookmarks: 0 };
      
      return NextResponse.json({
        success: true,
        data: {
          pv: pvResult.count || 0,
          uv: uniqueVisitors,
          totalViews: totalStats.views,
          totalLikes: totalStats.likes,
          totalBookmarks: totalStats.bookmarks,
          topPages,
        }
      });
    }
    
    if (type === 'trend') {
      // 趋势数据（按天）
      const { data } = await supabase
        .from('page_views')
        .select('created_at, visitor_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      // 按天分组
      const dailyData: Record<string, { pv: number; visitors: Set<string> }> = {};
      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { pv: 0, visitors: new Set() };
        }
        dailyData[date].pv++;
        dailyData[date].visitors.add(item.visitor_id);
      });
      
      const trend = Object.entries(dailyData).map(([date, d]) => ({
        date,
        pv: d.pv,
        uv: d.visitors.size,
      }));
      
      return NextResponse.json({ success: true, data: trend });
    }
    
    if (type === 'devices') {
      // 设备分布
      const { data } = await supabase
        .from('page_views')
        .select('device_type, browser')
        .gte('created_at', startDate.toISOString());
      
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      
      data?.forEach(item => {
        devices[item.device_type] = (devices[item.device_type] || 0) + 1;
        browsers[item.browser] = (browsers[item.browser] || 0) + 1;
      });
      
      return NextResponse.json({
        success: true,
        data: {
          devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
          browsers: Object.entries(browsers).map(([name, value]) => ({ name, value })),
        }
      });
    }
    
    if (type === 'posts') {
      // 文章排行
      const { data } = await supabase
        .from('post_stats')
        .select(`
          post_id,
          view_count,
          like_count,
          bookmark_count,
          posts!inner(title, slug)
        `)
        .order('view_count', { ascending: false })
        .limit(20);
      
      return NextResponse.json({ success: true, data });
    }
    
    return NextResponse.json({ success: false, error: '未知类型' }, { status: 400 });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 });
  }
}
