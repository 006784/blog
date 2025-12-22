import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewPostNotification } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 发送新文章通知给所有订阅者
export async function POST(request: NextRequest) {
  try {
    // 验证管理员密码
    const authHeader = request.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, postSlug, title, description, author } = body;

    if (!postId && !postSlug) {
      return NextResponse.json(
        { error: '请提供文章ID或Slug' },
        { status: 400 }
      );
    }

    // 检查 Resend API Key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: '邮件服务未配置，请设置 RESEND_API_KEY' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取文章信息（如果没有传入完整信息）
    let post = { title, description, slug: postSlug, author };
    
    if (!title || !description) {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('title, description, slug, author')
        .eq(postId ? 'id' : 'slug', postId || postSlug)
        .single();

      if (postError || !postData) {
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        );
      }
      post = postData;
    }

    // 获取所有活跃订阅者
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_active', true);

    if (subError) {
      console.error('获取订阅者失败:', subError);
      return NextResponse.json(
        { error: '获取订阅者列表失败' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { message: '暂无订阅者', sent: 0 },
        { status: 200 }
      );
    }

    // 发送邮件通知
    const result = await sendNewPostNotification(subscribers, post);

    // 记录推送日志
    try {
      await supabase.from('notification_logs').insert([{
        type: 'new_post',
        post_id: postId,
        post_title: post.title,
        total_subscribers: result.total,
        successful: result.successful,
        failed: result.failed,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      console.error('记录推送日志失败:', err);
    }

    return NextResponse.json({
      message: `已向 ${result.successful} 位订阅者发送通知`,
      ...result,
    });
  } catch (error) {
    console.error('发送通知失败:', error);
    return NextResponse.json(
      { error: '发送通知失败' },
      { status: 500 }
    );
  }
}

// 获取推送记录
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: '获取记录失败' }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
