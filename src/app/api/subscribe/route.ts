import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubscriptionConfirmation } from '@/lib/email';
import { ok, err } from '@/lib/api';

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 验证 Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn('Turnstile secret key not configured, skipping verification');
    return true; // 未配置则跳过验证
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body;

    // 验证邮箱
    if (!email) return err('请输入邮箱地址', 400);

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return err('请输入有效的邮箱地址', 400);

    // 验证 Turnstile（如果配置了）
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) return err('请完成人机验证', 400);

      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) return err('人机验证失败，请重试', 400);
    }

    let isNewSubscriber = false;
    let isReactivated = false;

    // 检查是否已订阅
    const { data: existing } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, is_active')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.is_active) return err('该邮箱已订阅', 400);

      // 重新激活订阅
      const { error } = await supabaseAdmin
        .from('subscribers')
        .update({ is_active: true })
        .eq('email', email);

      if (error) {
        console.error('Supabase error:', error);
        return err('订阅失败，请稍后重试', 500);
      }
      isReactivated = true;
    } else {
      // 新订阅
      const { error } = await supabaseAdmin
        .from('subscribers')
        .insert([{
          email,
          is_active: true,
          subscribed_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Supabase error:', error);
        return err('订阅失败，请稍后重试', 500);
      }
      isNewSubscriber = true;
    }

    // 发送欢迎邮件（包含最近文章）
    if ((isNewSubscriber || isReactivated) && process.env.RESEND_API_KEY) {
      try {
        const { data: posts } = await supabaseAdmin
          .from('posts')
          .select('title, slug, description')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(3);

        await sendSubscriptionConfirmation(email, undefined, posts ?? []);
        console.log('订阅确认邮件已发送:', email);
      } catch (emailError) {
        console.error('发送订阅确认邮件失败:', emailError);
        // 邮件发送失败不影响订阅成功
      }
    }

    return ok({
      message: isReactivated ? '订阅已重新激活！' : '订阅成功！感谢您的关注。',
      emailSent: !!process.env.RESEND_API_KEY,
    });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return err('服务器错误，请稍后重试', 500);
  }
}

// 取消订阅
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) return err('请提供邮箱地址', 400);

    const { error } = await supabaseAdmin
      .from('subscribers')
      .update({ is_active: false })
      .eq('email', email);

    if (error) {
      console.error('Supabase error:', error);
      return err('取消订阅失败', 500);
    }

    return ok({ message: '已取消订阅' });
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return err('服务器错误', 500);
  }
}
