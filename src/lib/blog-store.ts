'use client';

import { Post } from './types';

// 检查是否配置了 Supabase
const hasSupabase = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface BlogPost extends Post {
  id: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
}

const STORAGE_KEY = 'blog_posts';

// ============ 本地存储实现 ============

// 获取所有文章（本地）
function getAllPostsLocal(): BlogPost[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 获取单篇文章（本地）
function getPostByIdLocal(id: string): BlogPost | null {
  const posts = getAllPostsLocal();
  return posts.find(p => p.id === id) || null;
}

// 获取已发布文章（本地）
function getPublishedPostsLocal(): BlogPost[] {
  return getAllPostsLocal().filter(p => p.status === 'published');
}

// 获取草稿（本地）
function getDraftPostsLocal(): BlogPost[] {
  return getAllPostsLocal().filter(p => p.status === 'draft');
}

// 保存文章（本地）
function savePostLocal(post: Partial<BlogPost>): BlogPost {
  const posts = getAllPostsLocal();
  const now = new Date().toISOString();
  
  if (post.id) {
    const index = posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      const updatedPost = {
        ...posts[index],
        ...post,
        updatedAt: now,
      };
      posts[index] = updatedPost;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      return updatedPost;
    }
  }
  
  const newPost: BlogPost = {
    id: generateId(),
    slug: post.slug || generateSlug(post.title || '未命名文章'),
    title: post.title || '未命名文章',
    description: post.description || '',
    content: post.content || '',
    date: post.date || now.split('T')[0],
    category: post.category || 'tech',
    tags: post.tags || [],
    image: post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: calculateReadingTime(post.content || ''),
    status: post.status || 'draft',
    createdAt: now,
    updatedAt: now,
    coverImage: post.coverImage,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
  };
  
  posts.unshift(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}

// 删除文章（本地）
function deletePostLocal(id: string): boolean {
  const posts = getAllPostsLocal();
  const filtered = posts.filter(p => p.id !== id);
  if (filtered.length !== posts.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

// ============ Supabase 实现 (异步) ============

async function getAllPostsSupabase(): Promise<BlogPost[]> {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  
  return (data || []).map(transformSupabasePost);
}

async function getPostByIdSupabase(id: string): Promise<BlogPost | null> {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  
  return data ? transformSupabasePost(data) : null;
}

async function savePostSupabase(post: Partial<BlogPost>): Promise<BlogPost> {
  const { supabase } = await import('./supabase');
  const now = new Date().toISOString();
  
  if (post.id) {
    // 更新
    const { data, error } = await supabase
      .from('posts')
      .update({
        title: post.title,
        slug: post.slug,
        description: post.description,
        content: post.content,
        category: post.category,
        tags: post.tags,
        image: post.image,
        cover_image: post.coverImage,
        meta_title: post.metaTitle,
        meta_description: post.metaDescription,
        status: post.status,
        reading_time: calculateReadingTime(post.content || ''),
        updated_at: now,
        published_at: post.status === 'published' ? now : null,
      })
      .eq('id', post.id)
      .select()
      .single();
    
    if (error) throw error;
    return transformSupabasePost(data);
  }
  
  // 创建
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      title: post.title || '未命名文章',
      slug: post.slug || generateSlug(post.title || '未命名文章'),
      description: post.description || '',
      content: post.content || '',
      category: post.category || 'tech',
      tags: post.tags || [],
      image: post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
      cover_image: post.coverImage,
      author: '拾光',
      reading_time: calculateReadingTime(post.content || ''),
      status: post.status || 'draft',
      meta_title: post.metaTitle,
      meta_description: post.metaDescription,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return transformSupabasePost(data);
}

async function deletePostSupabase(id: string): Promise<boolean> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }
  return true;
}

// 转换 Supabase 数据格式到 BlogPost 格式
function transformSupabasePost(data: any): BlogPost {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description || '',
    content: data.content || '',
    date: data.published_at?.split('T')[0] || data.created_at?.split('T')[0],
    category: data.category || 'tech',
    tags: data.tags || [],
    image: data.image || '',
    author: data.author || '拾光',
    readingTime: data.reading_time || '5 min read',
    status: data.status || 'draft',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    coverImage: data.cover_image,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
  };
}

// ============ 导出的统一接口 ============

// 获取所有文章
export function getAllPosts(): BlogPost[] {
  // 同步版本只用本地存储
  return getAllPostsLocal();
}

// 异步获取所有文章
export async function getAllPostsAsync(): Promise<BlogPost[]> {
  if (hasSupabase) {
    try {
      return await getAllPostsSupabase();
    } catch (error) {
      console.warn('Supabase error, falling back to local storage:', error);
      return getAllPostsLocal();
    }
  }
  return getAllPostsLocal();
}

// 获取单篇文章
export function getPostById(id: string): BlogPost | null {
  return getPostByIdLocal(id);
}

// 异步获取单篇文章
export async function getPostByIdAsync(id: string): Promise<BlogPost | null> {
  if (hasSupabase) {
    try {
      return await getPostByIdSupabase(id);
    } catch (error) {
      console.warn('Supabase error, falling back to local storage:', error);
      return getPostByIdLocal(id);
    }
  }
  return getPostByIdLocal(id);
}

// 获取已发布文章
export function getPublishedPosts(): BlogPost[] {
  return getPublishedPostsLocal();
}

// 获取草稿
export function getDraftPosts(): BlogPost[] {
  return getDraftPostsLocal();
}

// 保存文章
export function savePost(post: Partial<BlogPost>): BlogPost {
  // 同步版本只用本地存储
  const savedPost = savePostLocal(post);
  
  // 如果有 Supabase，异步同步到云端
  if (hasSupabase) {
    savePostSupabase(post).catch(err => {
      console.warn('Failed to sync to Supabase:', err);
    });
  }
  
  return savedPost;
}

// 异步保存文章
export async function savePostAsync(post: Partial<BlogPost>): Promise<BlogPost> {
  if (hasSupabase) {
    try {
      const savedPost = await savePostSupabase(post);
      // 同时保存到本地作为缓存
      savePostLocal({ ...savedPost });
      return savedPost;
    } catch (error) {
      console.warn('Supabase error, falling back to local storage:', error);
      return savePostLocal(post);
    }
  }
  return savePostLocal(post);
}

// 删除文章
export function deletePost(id: string): boolean {
  const result = deletePostLocal(id);
  
  // 如果有 Supabase，异步删除云端数据
  if (hasSupabase) {
    deletePostSupabase(id).catch(err => {
      console.warn('Failed to delete from Supabase:', err);
    });
  }
  
  return result;
}

// 异步删除文章
export async function deletePostAsync(id: string): Promise<boolean> {
  if (hasSupabase) {
    try {
      await deletePostSupabase(id);
      deletePostLocal(id);
      return true;
    } catch (error) {
      console.warn('Supabase error, falling back to local storage:', error);
      return deletePostLocal(id);
    }
  }
  return deletePostLocal(id);
}

// 发布文章
export function publishPost(id: string): BlogPost | null {
  const post = getPostById(id);
  if (post) {
    return savePost({ ...post, status: 'published' });
  }
  return null;
}

// 取消发布（转为草稿）
export function unpublishPost(id: string): BlogPost | null {
  const post = getPostById(id);
  if (post) {
    return savePost({ ...post, status: 'draft' });
  }
  return null;
}

// ============ 辅助函数 ============

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').trim().length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${Math.max(1, minutes)} 分钟`;
}

// 文章分类
export const categories = [
  { value: 'tech', label: '技术', color: 'bg-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'design', label: '设计', color: 'bg-purple-500', gradient: 'from-purple-500 to-pink-500' },
  { value: 'life', label: '生活', color: 'bg-green-500', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'thoughts', label: '随想', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
];

// 获取分类信息
export function getCategoryInfo(value: string) {
  return categories.find(c => c.value === value) || categories[0];
}

// 检查 Supabase 是否已配置
export function isSupabaseConfigured(): boolean {
  return hasSupabase;
}
