/**
 * POST /api/timeline/generate
 * 使用 DeepSeek 根据用户描述自动生成时间线事件
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `你是一个帮助整理人生时间线的助手。
用户会描述他们的经历，你需要将其结构化为时间线事件列表。

每个事件必须是合法 JSON，格式：
{
  "title": "事件标题（简洁，10字以内）",
  "description": "事件描述（可选，不超过100字）",
  "date": "YYYY-MM-DD（只有年份则用YYYY-01-01，只有年月则用YYYY-MM-01）",
  "category": "work|education|life|achievement|travel 之一",
  "icon": "一个相关的 emoji",
  "is_milestone": true|false（重要节点设为true）
}

规则：
- 只输出 JSON 数组，不要任何额外文字或 Markdown 代码块
- category 必须严格是 work/education/life/achievement/travel 之一
- date 必须是合法日期字符串
- 按时间从早到晚排序
- 如果无法从描述中提取具体日期，合理推断
- 最多生成 20 个事件`;

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '未配置 DEEPSEEK_API_KEY，请在 .env.local 中添加' }, { status: 503 });
  }

  try {
    const { description } = await request.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: '请提供经历描述' }, { status: 400 });
    }

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description.trim() },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `DeepSeek 调用失败: ${resp.status} ${errText}` }, { status: 502 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // 解析 JSON
    let events: unknown[];
    try {
      // 去掉可能的 markdown 代码块包裹
      const cleaned = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      events = JSON.parse(cleaned);
      if (!Array.isArray(events)) throw new Error('not array');
    } catch {
      return NextResponse.json({ error: 'AI 返回格式错误，请重试', raw: content }, { status: 500 });
    }

    // 验证和清理每个事件
    const VALID_CATEGORIES = new Set(['work', 'education', 'life', 'achievement', 'travel']);
    const cleaned = events
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => ({
        title: String(e.title ?? '').slice(0, 50),
        description: e.description ? String(e.description).slice(0, 200) : undefined,
        date: String(e.date ?? '').match(/^\d{4}-\d{2}-\d{2}$/)
          ? String(e.date)
          : String(e.date ?? '2020-01-01').replace(/^(\d{4})$/, '$1-01-01'),
        category: VALID_CATEGORIES.has(String(e.category)) ? String(e.category) : 'life',
        icon: String(e.icon ?? '').slice(0, 4) || undefined,
        is_milestone: Boolean(e.is_milestone),
      }))
      .filter((e) => e.title && e.date);

    return NextResponse.json({ events: cleaned, count: cleaned.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}
