import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** POST /api/ai-summary  body: { postId: string } */
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ error: 'postId 必填' }, { status: 400 });

    // 已有缓存直接返回
    const { data: post } = await supabase
      .from('posts')
      .select('ai_summary, content, title')
      .eq('id', postId)
      .single();

    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    if (post.ai_summary) return NextResponse.json({ summary: post.ai_summary });

    // 截取正文前 6000 字，避免超出 token
    const excerpt = (post.content || '').slice(0, 6000);

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的中文内容编辑，擅长提炼文章核心要点。请用简洁、流畅的中文，以 3-5 条要点总结文章内容，每条要点 20-40 字，格式为纯文本（每条以"· "开头，用换行分隔）。不要添加标题，不要使用 Markdown，不要废话。',
          },
          {
            role: 'user',
            content: `文章标题：${post.title}\n\n正文：\n${excerpt}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('DeepSeek error:', err);
      return NextResponse.json({ error: 'AI 生成失败' }, { status: 502 });
    }

    const json = await resp.json();
    const summary: string = json.choices?.[0]?.message?.content?.trim() ?? '';

    if (summary) {
      await supabase
        .from('posts')
        .update({ ai_summary: summary })
        .eq('id', postId);
    }

    return NextResponse.json({ summary });
  } catch (e) {
    console.error('ai-summary error:', e);
    return NextResponse.json({ error: '服务错误' }, { status: 500 });
  }
}
