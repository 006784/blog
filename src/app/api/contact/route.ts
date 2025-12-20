import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // 验证必填字段
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
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
      
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name,
          email,
          subject,
          message,
          is_read: false,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: '保存消息失败，请稍后重试' },
          { status: 500 }
        );
      }
    } else {
      // 没有 Supabase 时，只记录日志
      console.log('Contact form submission:', { name, email, subject, message });
    }

    return NextResponse.json(
      { message: '消息已发送成功！我们会尽快回复您。' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
