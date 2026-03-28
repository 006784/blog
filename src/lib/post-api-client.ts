import type { Post } from '@/lib/supabase';

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function apiCreatePost(body: Partial<Post>): Promise<Post> {
  const res = await fetch('/api/posts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, '创建失败'));
  }

  const data = await res.json();
  return data.post as Post;
}

export async function apiUpdatePost(id: string, body: Partial<Post>): Promise<Post> {
  const res = await fetch(`/api/posts/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, '更新失败'));
  }

  const data = await res.json();
  return data.post as Post;
}
