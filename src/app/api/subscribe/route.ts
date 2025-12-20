import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // 如果配置了 Supabase，保存到数据库
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 检查是否已订阅
      const { data: existing } = await supabase
        .from('subscribers')
        .select('*')
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

        return NextResponse.json(
          { message: '订阅已重新激活！' },
          { status: 200 }
        );
      }

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
    } else {
      // 没有 Supabase 时，只记录日志
      console.log('New subscription:', email);
    }

    return NextResponse.json(
      { message: '订阅成功！感谢您的关注。' },
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
