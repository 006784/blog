import { createClient } from '@supabase/supabase-js';

// 获取环境变量（不验证服务端专用变量，因为可能在客户端使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 在开发环境给出更详细的错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error(
      '❌ Supabase 配置缺失。\n' +
      '请设置以下环境变量：\n' +
      '  - NEXT_PUBLIC_SUPABASE_URL\n' +
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      '参考 .env.example 文件了解所需配置。'
    );
  }
  // 在客户端，使用空字符串避免错误
  // 在服务端，抛出错误
  if (typeof window === 'undefined') {
    throw new Error(
      'Supabase 配置缺失。请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量。'
    );
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// 服务端专用客户端（使用 service_role key，绕过 RLS），仅在服务端代码中使用
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ============ 类型定义 ============

export interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** 仅在详情页加载，列表查询中可能为 undefined */
  content?: string;
  category: string;
  tags: string[];
  image: string;
  cover_image?: string;
  author: string;
  reading_time: string;
  status: 'draft' | 'published';
  meta_title?: string;
  meta_description?: string;
  views: number;
  likes: number;
  is_pinned?: boolean;
  pinned_at?: string | null;
  collection_id?: string; // 文章集合ID
  created_at: string;
  updated_at: string;
  published_at?: string;
}

function isRenderablePostRecord(post: Partial<Post> | null | undefined): post is Post {
  return Boolean(
    post &&
      post.status === 'published' &&
      typeof post.slug === 'string' &&
      post.slug.trim() &&
      typeof post.title === 'string' &&
      post.title.trim() &&
      typeof post.created_at === 'string' &&
      typeof post.updated_at === 'string'
  );
}

// 文章集合（系列/专题）
export interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  color?: string; // 主题色
  is_public: boolean;
  post_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  playlist_id?: string;
  title: string;
  artist: string;
  album?: string;
  cover_image?: string;
  duration?: string;
  duration_seconds?: number; // 歌曲时长(秒)
  music_url?: string;
  audio_url?: string; // 上传的音频文件URL
  lyrics?: string; // 歌词内容 (LRC格式)
  platform: 'netease' | 'qq' | 'spotify' | 'apple' | 'local' | 'other';
  platform_id?: string;
  note?: string;
  mood?: string;
  is_favorite: boolean;
  play_count: number;
  created_at: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  is_public: boolean;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id?: string;
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  location?: string;
  taken_at?: string;
  width?: number;
  height?: number;
  size?: number;
  exif_data?: Record<string, unknown> | null;
  tags: string[];
  is_favorite: boolean;
  views: number;
  created_at: string;
}

export interface Diary {
  id: string;
  title?: string;
  content: string;
  mood?: string;
  weather?: string;
  location?: string;
  images: string[];
  tags: string[];
  is_public: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
  diary_date: string;
  environment_data?: {
    location?: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
      address: string;
    };
    weather?: {
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      location: string;
      timestamp: number;
    };
  } | null;
}

// ============ 查询字段常量 ============

/**
 * 列表视图所需字段（排除 content 大字段，减少传输量）
 * 详情页使用 select('*') 获取全部字段
 */
const POST_LIST_FIELDS_BASE = 'id,title,slug,description,category,tags,image,cover_image,author,reading_time,status,meta_title,meta_description,views,likes,collection_id,created_at,updated_at,published_at' as const;
const POST_LIST_FIELDS = `${POST_LIST_FIELDS_BASE},is_pinned,pinned_at` as const;

/** 列表最大条数，防止全表扫描 */
const LIST_LIMIT = 100;

function isMissingPostPinColumnsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === '42703' &&
    typeof err.message === 'string' &&
    (err.message.includes('posts.is_pinned') || err.message.includes('posts.pinned_at'))
  );
}

type PostListQueryResult = {
  data: unknown;
  error: unknown;
};

async function fetchPostList(
  buildQuery: (fields: string) => PromiseLike<PostListQueryResult>
): Promise<Post[]> {
  const result = await buildQuery(POST_LIST_FIELDS);
  if (!isMissingPostPinColumnsError(result.error)) {
    if (result.error) throw result.error;
    return (result.data as Post[]) || [];
  }

  const fallbackResult = await buildQuery(POST_LIST_FIELDS_BASE);
  if (fallbackResult.error) throw fallbackResult.error;

  return ((fallbackResult.data as Array<Omit<Post, 'is_pinned' | 'pinned_at'>> | null) || []).map(
    (post) => ({
      ...post,
      is_pinned: false,
      pinned_at: null,
    })
  ) as Post[];
}

// ============ 文章操作 ============

export async function getPublishedPosts() {
  const posts = await fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(LIST_LIMIT)
  );
  return posts.filter(isRenderablePostRecord);
}

export async function getAllPosts() {
  return fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .order('updated_at', { ascending: false })
      .limit(LIST_LIMIT)
  );
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as Post;
}

export async function getPublicPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !isRenderablePostRecord(data as Post | null)) return null;
  return data as Post;
}

export async function getPostById(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Post;
}

export async function createPost(post: Partial<Post>) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      ...post,
      slug: post.slug || generateSlug(post.title || ''),
      views: 0,
      likes: 0,
    }])
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function setPostPinStatus(postId: string, pin: boolean) {
  if (pin) {
    const pinnedAt = new Date().toISOString();
    const { error: clearError } = await supabase
      .from('posts')
      .update({ is_pinned: false })
      .eq('is_pinned', true)
      .neq('id', postId);

    if (clearError) throw clearError;

    const { data, error } = await supabase
      .from('posts')
      .update({ is_pinned: true, pinned_at: pinnedAt })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data as Post;
  }

  const { data, error } = await supabase
    .from('posts')
    .update({ is_pinned: false, pinned_at: null })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementPostViews(id: string) {
  await supabase.rpc('increment_post_views', { post_id: id });
}

export async function likePost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .update({ likes: supabase.rpc('increment', { x: 1 }) })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    // 如果 rpc 不存在，使用普通方式
    const post = await getPostById(id);
    if (post) {
      await supabase.from('posts').update({ likes: (post.likes || 0) + 1 }).eq('id', id);
    }
  }
  return data as Post;
}

export async function searchPosts(query: string) {
  return fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(50)
  );
}

export async function getPostsByCategory(category: string) {
  return fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .eq('status', 'published')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(LIST_LIMIT)
  );
}

export async function getPostsByTag(tag: string) {
  return fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .eq('status', 'published')
      .contains('tags', [tag])
      .order('published_at', { ascending: false })
      .limit(LIST_LIMIT)
  );
}

// ============ 文章集合操作 ============

export async function getCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('获取集合失败:', error);
    return [];
  }
  return data as Collection[];
}

export async function getCollectionById(id: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Collection;
}

export async function createCollection(collection: Partial<Collection>) {
  const { data, error } = await supabase
    .from('collections')
    .insert([{
      ...collection,
      post_count: 0,
      sort_order: 0,
      is_public: true,
    }])
    .select()
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function updateCollection(id: string, updates: Partial<Collection>) {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(id: string) {
  // 先将该集合下的文章解绑
  await supabase.from('posts').update({ collection_id: null }).eq('collection_id', id);
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function getPostsByCollection(collectionId: string) {
  return fetchPostList((fields) =>
    supabase
      .from('posts')
      .select(fields)
      .eq('collection_id', collectionId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(LIST_LIMIT)
  );
}

export async function updateCollectionPostCount(collectionId: string) {
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId);
  
  await supabase
    .from('collections')
    .update({ post_count: count || 0 })
    .eq('id', collectionId);
}

// ============ 此刻 now_entries ============

export interface NowEntry {
  id: string;
  category: string;
  content: string;
  emoji?: string;
  link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getNowEntries() {
  const { data, error } = await supabase
    .from('now_entries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) { console.error('获取此刻失败:', error); return []; }
  return data as NowEntry[];
}

export async function getAllNowEntries() {
  const { data, error } = await supabase
    .from('now_entries')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('获取此刻失败:', error); return []; }
  return data as NowEntry[];
}

export async function createNowEntry(entry: Partial<NowEntry>) {
  const { data, error } = await supabase
    .from('now_entries')
    .insert([{ is_active: true, sort_order: 0, ...entry }])
    .select()
    .single();
  if (error) throw error;
  return data as NowEntry;
}

export async function updateNowEntry(id: string, updates: Partial<NowEntry>) {
  const { data, error } = await supabase
    .from('now_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as NowEntry;
}

export async function deleteNowEntry(id: string) {
  const { error } = await supabase.from('now_entries').delete().eq('id', id);
  if (error) throw error;
}

// ============ 书影音 media_items ============

export interface MediaItem {
  id: string;
  type: 'book' | 'movie' | 'tv' | 'music' | 'podcast' | 'game';
  title: string;
  author?: string;
  cover_image?: string;
  rating?: number;
  status: 'want' | 'doing' | 'done';
  review?: string;
  finish_date?: string;
  external_link?: string;
  tags?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getMediaItems() {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .order('finish_date', { ascending: false, nullsFirst: false });
  if (error) { console.error('获取书影音失败:', error); return []; }
  return data as MediaItem[];
}

export async function createMediaItem(item: Partial<MediaItem>) {
  const { data, error } = await supabase
    .from('media_items')
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data as MediaItem;
}

export async function updateMediaItem(id: string, updates: Partial<MediaItem>) {
  const { data, error } = await supabase
    .from('media_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MediaItem;
}

export async function deleteMediaItem(id: string) {
  const { error } = await supabase.from('media_items').delete().eq('id', id);
  if (error) throw error;
}

// ============ 时间线 timeline_events ============

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: 'work' | 'education' | 'life' | 'achievement' | 'travel';
  icon?: string;
  image?: string;
  link?: string;
  is_milestone: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getTimelineEvents() {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('获取时间线失败:', error); return []; }
  return data as TimelineEvent[];
}

export async function createTimelineEvent(event: Partial<TimelineEvent>) {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert([event])
    .select()
    .single();
  if (error) throw error;
  return data as TimelineEvent;
}

export async function updateTimelineEvent(id: string, updates: Partial<TimelineEvent>) {
  const { data, error } = await supabase
    .from('timeline_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TimelineEvent;
}

export async function deleteTimelineEvent(id: string) {
  const { error } = await supabase.from('timeline_events').delete().eq('id', id);
  if (error) throw error;
}

// ============ 工具箱 uses_items ============

export interface UsesItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  icon_url?: string;
  link?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getUsesItems() {
  const { data, error } = await supabase
    .from('uses_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('获取工具箱失败:', error); return []; }
  return data as UsesItem[];
}

export async function createUsesItem(item: Partial<UsesItem>) {
  const { data, error } = await supabase
    .from('uses_items')
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data as UsesItem;
}

export async function updateUsesItem(id: string, updates: Partial<UsesItem>) {
  const { data, error } = await supabase
    .from('uses_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as UsesItem;
}

export async function deleteUsesItem(id: string) {
  const { error } = await supabase.from('uses_items').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeRealtime(table: string, callback: (payload: unknown) => void) {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// 邮箱订阅
export async function subscribe(email: string) {
  // 这里可以实现邮箱订阅功能，保存到数据库或发送到邮件服务
  void email;
  // 如果有 subscribers 表，可以保存
  // const { error } = await supabase.from('subscribers').insert([{ email }]);
  // if (error) throw error;
}

// ============ 联系消息 ============

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'unread' | 'read' | 'replied';
  created_at?: string;
}

export async function createContactMessage(data: Omit<ContactMessage, 'id' | 'created_at' | 'status'>) {
  const { data: result, error } = await supabase
    .from('contact_messages')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result as ContactMessage;
}

export async function getContactMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ContactMessage[];
}

export async function updateMessageStatus(id: string, status: 'unread' | 'read' | 'replied') {
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteContactMessage(id: string) {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ 订阅者 ============

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export async function addSubscriber(email: string) {
  const { data, error } = await supabase
    .from('subscribers')
    .insert([{ email, is_active: true }])
    .select('id, email, is_active, subscribed_at')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('该邮箱已经订阅');
    }
    throw error;
  }
  return data as Subscriber;
}

export async function getActiveSubscribers() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data as Subscriber[];
}

export async function unsubscribe(email: string) {
  const { error } = await supabase
    .from('subscribers')
    .update({ is_active: false })
    .eq('email', email);
  if (error) throw error;
}

export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 300;
  const words = content.length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

// ============ 歌单操作 ============

export async function getPlaylists() {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Playlist[];
}

export async function getPlaylistById(id: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Playlist;
}

export async function createPlaylist(playlist: Partial<Playlist>) {
  const { data, error } = await supabase
    .from('playlists')
    .insert([playlist])
    .select()
    .single();
  if (error) throw error;
  return data as Playlist;
}

export async function updatePlaylist(id: string, updates: Partial<Playlist>) {
  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Playlist;
}

export async function deletePlaylist(id: string) {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) throw error;
}

// ============ 歌曲操作 ============

export async function getSongs(playlistId?: string) {
  let query = supabase.from('songs').select('*');
  if (playlistId) {
    query = query.eq('playlist_id', playlistId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Song[];
}

export async function getAllSongs() {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Song[];
}

export async function getFavoriteSongs() {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Song[];
}

export async function createSong(song: Partial<Song>) {
  const { data, error } = await supabase
    .from('songs')
    .insert([{ ...song, play_count: 0 }])
    .select()
    .single();
  if (error) throw error;
  return data as Song;
}

export async function updateSong(id: string, updates: Partial<Song>) {
  const { data, error } = await supabase
    .from('songs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Song;
}

export async function deleteSong(id: string) {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleSongFavorite(id: string, isFavorite: boolean) {
  const { error } = await supabase
    .from('songs')
    .update({ is_favorite: isFavorite })
    .eq('id', id);
  if (error) throw error;
}

// ============ 相册操作 ============

export async function getAlbums(opts?: { limit?: number; offset?: number; all?: boolean }) {
  let query = supabase.from('albums').select('*');
  if (!opts?.all) query = query.eq('is_public', true);
  query = query.order('created_at', { ascending: false });
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data as Album[];
}

export async function getAlbumById(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Album;
}

export async function createAlbum(album: Partial<Album>) {
  const { data, error } = await supabase
    .from('albums')
    .insert([{ ...album, photo_count: 0 }])
    .select()
    .single();
  if (error) throw error;
  return data as Album;
}

export async function updateAlbum(id: string, updates: Partial<Album>) {
  const { data, error } = await supabase
    .from('albums')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Album;
}

export async function deleteAlbum(id: string) {
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw error;
}

// ============ 照片操作 ============

export async function getPhotos(albumId?: string) {
  let query = supabase.from('photos').select('*');
  if (albumId) {
    query = query.eq('album_id', albumId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Photo[];
}

export async function getAllPhotos(opts?: { limit?: number; offset?: number }) {
  let query = supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data as Photo[];
}

export async function getFavoritePhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Photo[];
}

export async function createPhoto(photo: Partial<Photo>) {
  const { data, error } = await supabase
    .from('photos')
    .insert([{ ...photo, views: 0 }])
    .select()
    .single();
  if (error) throw error;
  return data as Photo;
}

export async function updatePhoto(id: string, updates: Partial<Photo>) {
  const { data, error } = await supabase
    .from('photos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Photo;
}

export async function deletePhoto(id: string) {
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
}

// ============ 日记操作 ============

export async function getDiaries(onlyPublic = true, opts?: { limit?: number; offset?: number }) {
  let query = supabase.from('diaries').select('*');
  if (onlyPublic) {
    query = query.eq('is_public', true);
  }
  query = query.order('diary_date', { ascending: false });
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data as Diary[];
}

export async function getDiaryById(id: string) {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Diary;
}

export async function getDiariesByMonth(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .gte('diary_date', startDate)
    .lt('diary_date', endDate)
    .order('diary_date', { ascending: false });
  if (error) throw error;
  return data as Diary[];
}

export async function getDiariesByMood(mood: string) {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('mood', mood)
    .eq('is_public', true)
    .order('diary_date', { ascending: false });
  if (error) throw error;
  return data as Diary[];
}

export async function createDiary(diary: Partial<Diary>) {
  const content = diary.content || '';
  const { data, error } = await supabase
    .from('diaries')
    .insert([{
      ...diary,
      word_count: content.length,
      diary_date: diary.diary_date || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;
  return data as Diary;
}

export async function updateDiary(id: string, updates: Partial<Diary>) {
  const updateData = { ...updates };
  if (updates.content) {
    updateData.word_count = updates.content.length;
  }
  const { data, error } = await supabase
    .from('diaries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Diary;
}

export async function deleteDiary(id: string) {
  const { error } = await supabase.from('diaries').delete().eq('id', id);
  if (error) throw error;
}

// ============ 辅助函数 ============

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    + '-' + Date.now().toString(36);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 心情图标映射
export const moodIcons: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: '开心', color: '#fbbf24' },
  sad: { emoji: '😢', label: '难过', color: '#60a5fa' },
  calm: { emoji: '😌', label: '平静', color: '#34d399' },
  excited: { emoji: '🎉', label: '兴奋', color: '#f472b6' },
  tired: { emoji: '😴', label: '疲惫', color: '#a78bfa' },
  anxious: { emoji: '😰', label: '焦虑', color: '#fb923c' },
  angry: { emoji: '😤', label: '生气', color: '#ef4444' },
  love: { emoji: '🥰', label: '恋爱', color: '#ec4899' },
  chill: { emoji: '😎', label: '放松', color: '#06b6d4' },
};

// 天气图标映射
export const weatherIcons: Record<string, { emoji: string; label: string }> = {
  sunny: { emoji: '☀️', label: '晴天' },
  cloudy: { emoji: '☁️', label: '多云' },
  rainy: { emoji: '🌧️', label: '雨天' },
  snowy: { emoji: '❄️', label: '下雪' },
  windy: { emoji: '💨', label: '大风' },
  foggy: { emoji: '🌫️', label: '雾天' },
  stormy: { emoji: '⛈️', label: '暴风雨' },
};

// 音乐平台图标
export const platformIcons: Record<string, { name: string; color: string }> = {
  netease: { name: '网易云音乐', color: '#e60026' },
  qq: { name: 'QQ音乐', color: '#31c27c' },
  spotify: { name: 'Spotify', color: '#1db954' },
  apple: { name: 'Apple Music', color: '#fa243c' },
  local: { name: '本地上传', color: '#10b981' },
  other: { name: '其他', color: '#6b7280' },
};
