import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';
import { parseBody, ok, err, z } from '@/lib/api';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const guestbookSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称最多50字'),
  content: z.string().min(1, '内容不能为空').max(1000, '内容最多1000字'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  website: z.string().url('网址格式不正确').optional().or(z.literal('')),
});

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 哈希IP
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
}

// GET - 获取留言列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const all = searchParams.get('all') === 'true'; // 管理员查看全部
    
    let query = supabase
      .from('guestbook')
      .select('*', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (!all) {
      query = query.eq('is_approved', true);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ messages: [], error: error.message }, { status: 500 });
    }
    
    // 隐藏敏感信息
    const safeData = data?.map(m => ({
      ...m,
      email: m.email ? m.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
      ip_hash: undefined,
    }));
    
    return NextResponse.json({ messages: safeData || [], total: count || 0, page, limit });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ messages: [], error: '服务器错误' }, { status: 500 });
  }
}

// POST - 发布留言
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, guestbookSchema);
    if (parsed instanceof NextResponse) return parsed;
    const { nickname, email, content, website } = parsed;

    // 垃圾内容检测
    const spamPatterns = [/https?:\/\/[^\s]+/gi, /<[^>]+>/g];
    for (const pattern of spamPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) return err('内容包含过多链接', 400);
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIP(ip);

    // 频率限制（同 IP 1 分钟内只能发 1 条）
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recent } = await supabase
      .from('guestbook')
      .select('id')
      .eq('ip_hash', ipHash)
      .gte('created_at', oneMinuteAgo);

    if (recent && recent.length > 0) return err('请稍后再试', 429);

    // 生成头像 URL
    const avatarUrl = email
      ? `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')}?d=identicon`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`;

    const { data, error } = await supabase
      .from('guestbook')
      .insert({
        nickname: nickname.trim(),
        email: email?.trim() || null,
        content: content.trim(),
        website: website?.trim() || null,
        avatar_url: avatarUrl,
        ip_hash: ipHash,
        is_approved: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return err('发布失败', 500);
    }

    return ok(data, 201);
  } catch (error) {
    console.error('POST error:', error);
    return err('服务器错误', 500);
  }
}

// PUT - 管理员回复/审核/置顶
export async function PUT(request: NextRequest) {
  try {
    if (!await requireAdminSession(request)) {
      logger.warn('留言管理操作未授权', { module: 'guestbook', action: 'put_unauthorized' });
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }
    const body = await request.json();
    const { id, reply, is_approved, is_pinned } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少留言ID' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (reply !== undefined) {
      updateData.reply = reply;
      updateData.replied_at = new Date().toISOString();
    }
    if (is_approved !== undefined) updateData.is_approved = is_approved;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const { data, error } = await supabase
      .from('guestbook')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.info('留言管理操作成功', { module: 'guestbook', action: 'put', id, fields: Object.keys(updateData) });
    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 管理员删除留言
export async function DELETE(request: NextRequest) {
  try {
    if (!await requireAdminSession(request)) {
      logger.warn('留言删除操作未授权', { module: 'guestbook', action: 'delete_unauthorized' });
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少留言ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('guestbook')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.info('留言删除成功', { module: 'guestbook', action: 'delete', id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
