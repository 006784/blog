/**
 * 封面自动生成
 * 优先从相册随机取一张照片，没有相册照片时回退到 Unsplash 搜图
 */
import { supabaseAdmin } from '@/lib/supabase';

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

async function pickFromGallery(): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('photos')
      .select('url')
      .not('url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return null;

    const pick = data[Math.floor(Math.random() * data.length)];
    return (pick.url as string) ?? null;
  } catch {
    return null;
  }
}

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
          { role: 'system', content: 'Return 3-5 English Unsplash photo search keywords, comma-separated, no explanation. Focus on concrete visual themes.' },
          { role: 'user',   content: `Title: ${title}${description ? `\nDescription: ${description}` : ''}` },
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

async function pickFromUnsplash(title: string, description?: string, tags: string[] = [], category?: string): Promise<string | null> {
  const aiKeywords  = await extractKeywords(title, description);
  const englishTags = tags.filter(t => /^[a-zA-Z]/.test(t)).join(',');
  const catKeywords = CATEGORY_KEYWORDS[category ?? ''] ?? CATEGORY_KEYWORDS.default;
  const query = [aiKeywords, englishTags, catKeywords].filter(Boolean).join(',');

  try {
    const res = await fetch(
      `https://source.unsplash.com/featured/1920x1080/?${encodeURIComponent(query)}`,
      { redirect: 'follow' },
    );
    if (!res.ok) return null;
    const finalUrl = res.url.split('?')[0];
    if (!finalUrl.includes('images.unsplash.com')) return null;
    return `${finalUrl}?w=1920&q=85&fit=crop&auto=format`;
  } catch {
    return null;
  }
}

export async function generateCoverImage(options: {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
}): Promise<string | null> {
  const { title, description, tags, category } = options;

  // 1. 优先用相册里的照片
  const galleryUrl = await pickFromGallery();
  if (galleryUrl) return galleryUrl;

  // 2. 回退：Unsplash 搜图
  return pickFromUnsplash(title, description, tags, category);
}
