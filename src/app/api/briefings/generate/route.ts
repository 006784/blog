import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 精选 RSS 源（稳定性强，内容质量高）
const CURATED_FEEDS = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage?count=15', lang: 'en' },
  { name: 'TechCrunch',  url: 'https://techcrunch.com/feed/',          lang: 'en' },
  { name: '36Kr',        url: 'https://36kr.com/feed',                 lang: 'zh' },
  { name: 'The Verge',   url: 'https://www.theverge.com/rss/index.xml', lang: 'en' },
];

interface FeedItem { title: string; link: string; summary?: string }

async function fetchFeed(url: string): Promise<FeedItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Briefing-Bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: FeedItem[] = [];
    // 简单正则解析 <item> / <entry>
    const itemRe = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) !== null && items.length < 8) {
      const block = m[1];
      const title = (/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(block)?.[1] ?? '').trim();
      const link  = (/<link[^>]*>([^<]+)<\/link>/i.exec(block)?.[1]
                  ?? /<link[^>]+href="([^"]+)"/i.exec(block)?.[1] ?? '').trim();
      const desc  = (/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/i.exec(block)?.[1] ?? '')
                    .replace(/<[^>]+>/g, '').trim().slice(0, 200);
      if (title && link) items.push({ title, link, summary: desc });
    }
    return items;
  } catch {
    return [];
  }
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('未配置 DEEPSEEK_API_KEY');

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API 错误: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

export async function POST(request: NextRequest) {
  // 允许：管理员 cookie 会话 OR Vercel cron secret header
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && request.headers.get('x-cron-secret') === cronSecret;
  if (!isCron && !await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    // 1. 并发抓取多个 RSS 源
    const results = await Promise.allSettled(CURATED_FEEDS.map(f => fetchFeed(f.url)));
    const allItems: { source: string; item: FeedItem }[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        r.value.forEach(item => allItems.push({ source: CURATED_FEEDS[i].name, item }));
      }
    });

    if (allItems.length === 0) {
      return NextResponse.json({ error: '未能获取到任何新闻条目，请检查网络' }, { status: 502 });
    }

    // 2. 构造 prompt
    const newsText = allItems
      .slice(0, 30)
      .map(({ source, item }) => `[${source}] ${item.title}${item.summary ? `\n摘要：${item.summary}` : ''}`)
      .join('\n\n');

    const todayStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    const prompt = `你是一位优秀的中文科技媒体编辑。今天是 ${todayStr}。

以下是今天从多个媒体源收集的新闻标题和摘要：

${newsText}

请根据以上内容，用中文写一篇精炼的每日简报，要求：
1. 标题：用一句话概括今日最重要的主题（15字以内）
2. 正文：分 2-3 个小节（用 ## 标题），每节 2-3 句话，选取最值得关注的新闻进行解读，避免简单罗列
3. 语言风格：简洁、克制、像杂志编辑，不要过度渲染
4. 最后用一句话写今日总结（不加标题）

输出格式（严格遵守）：
TITLE: <标题>
---
<正文 Markdown>`;

    const raw = await callDeepSeek(prompt);

    // 3. 解析输出
    const titleMatch = /TITLE:\s*(.+)/i.exec(raw);
    const title = titleMatch?.[1]?.trim() ?? `${new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 简报`;
    const content = raw.replace(/TITLE:\s*.+\n?---?\n?/i, '').trim();

    // 4. 提取相关链接（取前 5 条有 title+url 的条目）
    const links = allItems.slice(0, 5).map(({ item }) => ({
      title: item.title.slice(0, 60),
      url: item.link,
    }));

    // 5. Upsert 到 daily_briefings
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseAdmin
      .from('daily_briefings')
      .upsert(
        { date: today, title, content, links, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'date' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ briefing: data, newsCount: allItems.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
