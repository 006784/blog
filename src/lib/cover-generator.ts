/**
 * 封面自动生成
 * 流程：DeepSeek 从中文标题提取英文搜图关键词 → Unsplash 搜索高清图 → 返回稳定 CDN URL
 */

const CATEGORY_KEYWORDS: Record<string, string> = {
  tech:        'technology programming computer code',
  life:        'lifestyle coffee minimalist morning',
  travel:      'travel landscape nature adventure',
  food:        'food cooking kitchen ingredients',
  reading:     'books reading library study',
  music:       'music headphones audio studio',
  photography: 'photography camera lens street',
  essay:       'writing journal notebook pen',
  default:     'minimal desk workspace clean',
};

async function extractKeywords(title: string, description?: string): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return '';

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.3,
        max_tokens: 30,
        messages: [
          {
            role: 'system',
            content: 'Return 3-5 English Unsplash photo search keywords, comma-separated, no explanation. Focus on concrete visual themes.',
          },
          {
            role: 'user',
            content: `Title: ${title}${description ? `\nDescription: ${description}` : ''}`,
          },
        ],
      }),
    });
    if (!res.ok) return '';
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

export async function generateCoverImage(options: {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
}): Promise<string | null> {
  const { title, description, tags = [], category } = options;

  const aiKeywords   = await extractKeywords(title, description);
  const englishTags  = tags.filter(t => /^[a-zA-Z]/.test(t)).join(',');
  const catKeywords  = CATEGORY_KEYWORDS[category ?? ''] ?? CATEGORY_KEYWORDS.default;

  const query = [aiKeywords, englishTags, catKeywords]
    .filter(Boolean)
    .join(',');

  const sourceUrl = `https://source.unsplash.com/featured/1920x1080/?${encodeURIComponent(query)}`;

  try {
    const res = await fetch(sourceUrl, { redirect: 'follow' });
    if (!res.ok) return null;

    // 最终 URL 形如 https://images.unsplash.com/photo-xxx?...
    // 去掉 query string，只保留干净的图片路径
    const finalUrl = res.url.split('?')[0];
    if (!finalUrl.includes('images.unsplash.com')) return null;

    // 附加高清参数
    return `${finalUrl}?w=1920&q=85&fit=crop&auto=format`;
  } catch {
    return null;
  }
}
