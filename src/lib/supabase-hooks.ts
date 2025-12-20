'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Post,
  getPublishedPosts,
  getAllPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  incrementPostViews,
  likePost,
  searchPosts,
  getPostsByCategory,
  getPostsByTag,
  subscribe,
  formatDate,
  calculateReadingTime,
} from './supabase';

// ============ 获取已发布文章 Hook ============
export function usePublishedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const data = await getPublishedPosts();
        setPosts(data);
      } catch (err) {
        setError('加载文章失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return { posts, loading, error, refetch: () => getPublishedPosts().then(setPosts) };
}

// ============ 获取所有文章 Hook (包括草稿) ============
export function useAllPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      setError('加载文章失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
}

// ============ 获取单篇文章 Hook ============
export function usePost(slugOrId: string, byId = false) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const data = byId 
          ? await getPostById(slugOrId)
          : await getPostBySlug(slugOrId);
        setPost(data);
        
        // 自动增加浏览量
        if (data && !byId) {
          incrementPostViews(data.id);
        }
      } catch (err) {
        setError('加载文章失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (slugOrId) {
      fetchPost();
    }
  }, [slugOrId, byId]);

  return { post, loading, error };
}

// ============ 文章操作 Hook ============
export function usePostActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (postData: Parameters<typeof createPost>[0]) => {
    try {
      setLoading(true);
      setError(null);
      const post = await createPost(postData);
      return post;
    } catch (err) {
      setError('创建文章失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, updates: Partial<Post>) => {
    try {
      setLoading(true);
      setError(null);
      const post = await updatePost(id, updates);
      return post;
    } catch (err) {
      setError('更新文章失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deletePost(id);
      return true;
    } catch (err) {
      setError('删除文章失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const like = useCallback(async (id: string) => {
    try {
      await likePost(id);
    } catch (err) {
      console.error('点赞失败:', err);
    }
  }, []);

  return { create, update, remove, like, loading, error };
}

// ============ 搜索文章 Hook ============
export function useSearchPosts(query: string) {
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function search() {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const data = await searchPosts(query);
        setResults(data);
      } catch (err) {
        setError('搜索失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, loading, error };
}

// ============ 按分类获取文章 Hook ============
export function usePostsByCategory(category: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      if (!category) return;
      
      try {
        setLoading(true);
        const data = await getPostsByCategory(category);
        setPosts(data);
      } catch (err) {
        setError('加载文章失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [category]);

  return { posts, loading, error };
}

// ============ 按标签获取文章 Hook ============
export function usePostsByTag(tag: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      if (!tag) return;
      
      try {
        setLoading(true);
        const data = await getPostsByTag(tag);
        setPosts(data);
      } catch (err) {
        setError('加载文章失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [tag]);

  return { posts, loading, error };
}

// ============ 订阅 Hook ============
export function useSubscribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await subscribe(email);
      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.message || '订阅失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribe: handleSubscribe, loading, error, success };
}

// 导出工具函数
export { formatDate, calculateReadingTime };
