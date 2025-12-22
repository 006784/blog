import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 生成访客ID
function getVisitorId(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex').substring(0, 16);
}

// POST - 点赞/收藏
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, type } = body;
    
    if (!postId || !type) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }
    
    if (!['like', 'bookmark'].includes(type)) {
      return NextResponse.json({ success: false, error: '无效的互动类型' }, { status: 400 });
    }
    
    const visitorId = getVisitorId(request);
    
    // 检查是否已经互动过
    const { data: existing } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
      .eq('interaction_type', type)
      .single();
    
    if (existing) {
      // 取消互动
      await supabase
        .from('user_interactions')
        .delete()
        .eq('id', existing.id);
      
      // 更新统计
      const field = type === 'like' ? 'like_count' : 'bookmark_count';
      await supabase.rpc('decrement_stat', { p_post_id: postId, p_field: field });
      
      return NextResponse.json({ success: true, action: 'removed', visitorId });
    } else {
      // 添加互动
      await supabase
        .from('user_interactions')
        .insert({
          post_id: postId,
          visitor_id: visitorId,
          interaction_type: type,
        });
      
      // 更新统计（使用upsert确保记录存在）
      const field = type === 'like' ? 'like_count' : 'bookmark_count';
      const { data: stats } = await supabase
        .from('post_stats')
        .select('like_count, bookmark_count')
        .eq('post_id', postId)
        .single();
      
      if (stats) {
        const currentValue = (stats as Record<string, number>)[field] || 0;
        await supabase
          .from('post_stats')
          .update({ [field]: currentValue + 1, updated_at: new Date().toISOString() })
          .eq('post_id', postId);
      } else {
        await supabase
          .from('post_stats')
          .insert({ post_id: postId, [field]: 1 });
      }
      
      return NextResponse.json({ success: true, action: 'added', visitorId });
    }
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

// GET - 获取互动状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json({ success: false, error: '缺少文章ID' }, { status: 400 });
    }
    
    const visitorId = getVisitorId(request);
    
    // 获取统计数据
    const { data: stats } = await supabase
      .from('post_stats')
      .select('view_count, like_count, bookmark_count')
      .eq('post_id', postId)
      .single();
    
    // 获取当前用户的互动状态
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('interaction_type')
      .eq('post_id', postId)
      .eq('visitor_id', visitorId);
    
    const userLiked = interactions?.some(i => i.interaction_type === 'like') || false;
    const userBookmarked = interactions?.some(i => i.interaction_type === 'bookmark') || false;
    
    return NextResponse.json({
      success: true,
      data: {
        views: stats?.view_count || 0,
        likes: stats?.like_count || 0,
        bookmarks: stats?.bookmark_count || 0,
        userLiked,
        userBookmarked,
      }
    });
  } catch (error) {
    console.error('Get interaction error:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
