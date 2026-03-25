import { supabaseAdmin, type Post } from '@/lib/supabase';

const COMPAT_POST_FIELDS = ['is_pinned', 'pinned_at', 'collection_id'] as const;
type MutablePostPayload = {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  image?: string;
  cover_image?: string;
  author?: string;
  reading_time?: string;
  status?: Post['status'];
  meta_title?: string | null;
  meta_description?: string | null;
  published_at?: string | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  collection_id?: string | null;
};

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function normalizeTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];

  const tags = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function generatePostSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'untitled'
  ) + '-' + Date.now().toString(36);
}

function getMissingPostColumn(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as { code?: string; message?: string };
  if (err.code !== '42703' || typeof err.message !== 'string') return null;
  const match = err.message.match(/posts\.([a-zA-Z0-9_]+)/);
  return match?.[1] ?? null;
}

function isCompatPostField(field: string): field is (typeof COMPAT_POST_FIELDS)[number] {
  return (COMPAT_POST_FIELDS as readonly string[]).includes(field);
}

async function withCompatFallback<T>(
  payload: MutablePostPayload,
  action: (currentPayload: MutablePostPayload) => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  const currentPayload: MutablePostPayload = { ...payload };

  while (true) {
    const { data, error } = await action(currentPayload);

    if (!error && data) {
      return data;
    }

    const missingColumn = getMissingPostColumn(error);
    if (missingColumn && isCompatPostField(missingColumn) && missingColumn in currentPayload) {
      delete currentPayload[missingColumn];
      continue;
    }

    throw error;
  }
}

export function sanitizePostPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
): MutablePostPayload {
  const title = normalizeRequiredText(body.title);
  const payload: MutablePostPayload = {};

  if (mode === 'create' || title) {
    payload.title = title || '未命名文章';
  }

  const slug = normalizeOptionalText(body.slug);
  if (mode === 'create') {
    payload.slug = slug || generatePostSlug(payload.title || title || 'untitled');
  } else if (slug) {
    payload.slug = slug;
  }

  const description = normalizeOptionalText(body.description);
  if (description !== undefined) payload.description = description ?? '';

  const content = normalizeOptionalText(body.content);
  if (content !== undefined) payload.content = content ?? '';

  const category = normalizeOptionalText(body.category);
  if (category !== undefined) payload.category = category ?? 'tech';

  const tags = normalizeTags(body.tags);
  if (tags !== undefined) payload.tags = tags;

  const image = normalizeOptionalText(body.image);
  if (image !== undefined) payload.image = image ?? '';

  const coverImage = normalizeOptionalText(body.cover_image);
  if (coverImage !== undefined) payload.cover_image = coverImage ?? '';

  const author = normalizeOptionalText(body.author);
  if (author !== undefined) payload.author = author ?? 'Lumen';

  const readingTime = normalizeOptionalText(body.reading_time);
  if (readingTime !== undefined) payload.reading_time = readingTime ?? '1 min read';

  const status = normalizeOptionalText(body.status);
  if (status === 'draft' || status === 'published') {
    payload.status = status;
  } else if (mode === 'create') {
    payload.status = 'draft';
  }

  const metaTitle = normalizeOptionalText(body.meta_title);
  if (metaTitle !== undefined) payload.meta_title = metaTitle;

  const metaDescription = normalizeOptionalText(body.meta_description);
  if (metaDescription !== undefined) payload.meta_description = metaDescription;

  if (body.published_at === null) {
    payload.published_at = null;
  } else {
    const publishedAt = normalizeOptionalText(body.published_at);
    if (publishedAt !== undefined) {
      payload.published_at = publishedAt;
    } else if (payload.status === 'published' && mode === 'create') {
      payload.published_at = new Date().toISOString();
    }
  }

  if (typeof body.is_pinned === 'boolean') {
    payload.is_pinned = body.is_pinned;
  }

  if (body.pinned_at === null) {
    payload.pinned_at = null;
  } else {
    const pinnedAt = normalizeOptionalText(body.pinned_at);
    if (pinnedAt !== undefined) payload.pinned_at = pinnedAt;
  }

  if (body.collection_id === null) {
    payload.collection_id = null;
  } else {
    const collectionId = normalizeOptionalText(body.collection_id);
    if (collectionId !== undefined) payload.collection_id = collectionId;
  }

  return payload;
}

export async function createPostRecord(payload: MutablePostPayload): Promise<Post> {
  return withCompatFallback(payload, async (currentPayload) =>
    supabaseAdmin
      .from('posts')
      .insert([{ ...currentPayload, views: 0, likes: 0 }])
      .select()
      .single()
  ) as Promise<Post>;
}

export async function updatePostRecord(id: string, payload: MutablePostPayload): Promise<Post> {
  return withCompatFallback(payload, async (currentPayload) =>
    supabaseAdmin
      .from('posts')
      .update(currentPayload)
      .eq('id', id)
      .select()
      .single()
  ) as Promise<Post>;
}

export async function clearOtherPinnedPosts(postId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('posts')
    .update({ is_pinned: false })
    .eq('is_pinned', true)
    .neq('id', postId);

  const missingColumn = getMissingPostColumn(error);
  if (missingColumn === 'is_pinned') return;
  if (error) throw error;
}
