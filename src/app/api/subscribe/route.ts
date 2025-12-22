import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionConfirmation } from '@/lib/email';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 验证邮箱
    if (!email) {
      return NextResponse.json(
        { error: '请输入邮箱地址' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    let isNewSubscriber = false;
    let isReactivated = false;

    // 如果配置了 Supabase，保存到数据库
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 检查是否已订阅
      const { data: existing } = await supabase
        .from('subscribers')
        .select('id, email, is_active')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.is_active) {
          return NextResponse.json(
            { error: '该邮箱已订阅' },
            { status: 400 }
          );
        }
        
        // 重新激活订阅
        const { error } = await supabase
          .from('subscribers')
          .update({ is_active: true })
          .eq('email', email);

        if (error) {
          console.error('Supabase error:', error);
          return NextResponse.json(
            { error: '订阅失败，请稍后重试' },
            { status: 500 }
          );
        }
        isReactivated = true;
      } else {
        // 新订阅
        const { error } = await supabase
          .from('subscribers')
          .insert([{
            email,
            is_active: true,
            subscribed_at: new Date().toISOString(),
          }]);

        if (error) {
          console.error('Supabase error:', error);
          return NextResponse.json(
            { error: '订阅失败，请稍后重试' },
            { status: 500 }
          );
        }
        isNewSubscriber = true;
      }
    } else {
      console.log('New subscription:', email);
      isNewSubscriber = true;
    }

    // 发送欢迎邮件（包含最近文章）
    if ((isNewSubscriber || isReactivated) && process.env.RESEND_API_KEY) {
      try {
        // 获取最近的文章
        let recentPosts: { title: string; slug: string; description: string }[] = [];
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: posts } = await supabase
            .from('posts')
            .select('title, slug, description')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(3);
          
          if (posts) {
            recentPosts = posts;
          }
        }
        
        await sendSubscriptionConfirmation(email, undefined, recentPosts);
        console.log('订阅确认邮件已发送:', email);
      } catch (emailError) {
        console.error('发送订阅确认邮件失败:', emailError);
        // 邮件发送失败不影响订阅成功
      }
    }

    return NextResponse.json(
      { 
        message: isReactivated ? '订阅已重新激活！' : '订阅成功！感谢您的关注。',
        emailSent: !!process.env.RESEND_API_KEY 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscribe API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 取消订阅
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('subscribers')
        .update({ is_active: false })
        .eq('email', email);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: '取消订阅失败' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: '已取消订阅' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
