-- ============================================================
-- Lumen · 数据库索引优化脚本
-- 在 Supabase SQL Editor 中执行，执行前先用 EXPLAIN ANALYZE 验证
-- ============================================================

-- ——— posts 表 ———

-- 已发布文章按发布时间倒序（最常用查询）
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
  ON posts (status, published_at DESC)
  WHERE status = 'published';

-- 按分类过滤已发布文章
CREATE INDEX IF NOT EXISTS idx_posts_status_category
  ON posts (status, category, published_at DESC)
  WHERE status = 'published';

-- slug 唯一查找（详情页）
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug
  ON posts (slug);

-- 置顶文章快速查找
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned
  ON posts (is_pinned, pinned_at DESC)
  WHERE is_pinned = true;

-- collection_id 过滤（文章合集）
CREATE INDEX IF NOT EXISTS idx_posts_collection_id
  ON posts (collection_id, published_at DESC)
  WHERE status = 'published';

-- tags GIN 索引（支持 .contains() 数组查询）
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin
  ON posts USING gin (tags);

-- 全文搜索 GIN 索引（title + description）
CREATE INDEX IF NOT EXISTS idx_posts_fts
  ON posts USING gin (
    to_tsvector('chinese', coalesce(title, '') || ' ' || coalesce(description, ''))
  );

-- ——— diaries 表 ———

-- 按日记日期倒序
CREATE INDEX IF NOT EXISTS idx_diaries_diary_date
  ON diaries (diary_date DESC);

-- 按情绪过滤
CREATE INDEX IF NOT EXISTS idx_diaries_mood
  ON diaries (mood, diary_date DESC)
  WHERE mood IS NOT NULL;

-- 公开日记过滤
CREATE INDEX IF NOT EXISTS idx_diaries_is_public
  ON diaries (is_public, diary_date DESC)
  WHERE is_public = true;

-- tags GIN 索引
CREATE INDEX IF NOT EXISTS idx_diaries_tags_gin
  ON diaries USING gin (tags);

-- ——— photos 表 ———

-- 按相册过滤
CREATE INDEX IF NOT EXISTS idx_photos_album_id
  ON photos (album_id, created_at DESC);

-- 收藏照片
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite
  ON photos (is_favorite, created_at DESC)
  WHERE is_favorite = true;

-- ——— songs 表 ———

-- 按歌单过滤
CREATE INDEX IF NOT EXISTS idx_songs_playlist_id
  ON songs (playlist_id, created_at DESC);

-- 收藏歌曲
CREATE INDEX IF NOT EXISTS idx_songs_is_favorite
  ON songs (is_favorite)
  WHERE is_favorite = true;

-- ——— subscribers 表 ———

-- email 唯一查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email
  ON subscribers (email);

-- 活跃订阅者
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active
  ON subscribers (is_active, subscribed_at DESC)
  WHERE is_active = true;

-- ——— guestbook 表（如存在）———
-- CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook (created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_guestbook_is_pinned ON guestbook (is_pinned) WHERE is_pinned = true;

-- ——— collections 表 ———

CREATE INDEX IF NOT EXISTS idx_collections_sort      ON collections (sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections (is_public, sort_order) WHERE is_public = true;

-- ——— media_items 表 ———

CREATE INDEX IF NOT EXISTS idx_media_items_type   ON media_items (type, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items (status, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_items_finish ON media_items (finish_date DESC NULLS LAST);

-- ——— timeline_events 表 ———

CREATE INDEX IF NOT EXISTS idx_timeline_date      ON timeline_events (date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_category  ON timeline_events (category, date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_milestone ON timeline_events (is_milestone, date DESC) WHERE is_milestone = true;

-- ——— uses_items 表 ———

CREATE INDEX IF NOT EXISTS idx_uses_category   ON uses_items (category, sort_order);
CREATE INDEX IF NOT EXISTS idx_uses_sort_order ON uses_items (sort_order);

-- ——— friend_links 表 ———

CREATE INDEX IF NOT EXISTS idx_friend_links_featured ON friend_links (is_featured, sort_order) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_friend_links_category ON friend_links (category, sort_order);

-- ——— resources 表 ———

CREATE INDEX IF NOT EXISTS idx_resources_category  ON resources (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources (is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_resources_tags_gin  ON resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_resources_extension ON resources (extension);
