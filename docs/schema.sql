-- ============================================================
-- 拾光博客 · 完整数据库建表脚本
-- 版本：2026-03
-- 在 Supabase SQL Editor 中一次性执行
-- 可重复执行：CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS
-- ============================================================
-- 表清单（23 张）：
--   posts, collections, diaries, photos, albums,
--   songs, playlists, guestbook, friend_links,
--   contact_messages, subscribers, notification_logs,
--   resources, resource_categories,
--   now_entries, media_items, timeline_events, uses_items,
--   user_interactions, post_stats, page_views,
--   site_settings, test_table
-- RPC（3 个）：
--   update_updated_at, increment_post_views, decrement_stat
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0. 共享工具函数
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 1. 文章合集 collections
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  cover_image text,
  color       text,
  is_public   boolean     NOT NULL DEFAULT true,
  post_count  integer     NOT NULL DEFAULT 0,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collections_select" ON collections;
CREATE POLICY "collections_select" ON collections
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "collections_write" ON collections;
CREATE POLICY "collections_write" ON collections
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_collections_public ON collections (is_public, sort_order) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collections_sort   ON collections (sort_order);

DROP TRIGGER IF EXISTS t_collections_updated ON collections;
CREATE TRIGGER t_collections_updated
  BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 2. 文章 posts
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  slug             text        NOT NULL UNIQUE,
  description      text,
  content          text,
  category         text,
  tags             text[]      DEFAULT '{}',
  image            text,
  cover_image      text,
  author           text        NOT NULL DEFAULT '博主',
  reading_time     text,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','published')),
  meta_title       text,
  meta_description text,
  views            integer     NOT NULL DEFAULT 0,
  likes            integer     NOT NULL DEFAULT 0,
  is_pinned        boolean     NOT NULL DEFAULT false,
  pinned_at        timestamptz,
  collection_id    uuid        REFERENCES collections (id) ON DELETE SET NULL,
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 补列（已有旧表时自动添加缺失字段）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status           text        NOT NULL DEFAULT 'draft';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS description      text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category         text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags             text[]      DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image            text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image      text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author           text        NOT NULL DEFAULT '博主';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time     text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title       text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views            integer     NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes            integer     NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned        boolean     NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_at        timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collection_id    uuid        REFERENCES collections (id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at     timestamptz;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_published" ON posts;
CREATE POLICY "posts_select_published" ON posts
  FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "posts_write" ON posts;
CREATE POLICY "posts_write" ON posts
  FOR ALL TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug              ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_published         ON posts (status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_status_category          ON posts (status, category, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_pinned                   ON posts (is_pinned, pinned_at DESC) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_posts_collection               ON posts (collection_id, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin                 ON posts USING gin (tags);

DROP TRIGGER IF EXISTS t_posts_updated ON posts;
CREATE TRIGGER t_posts_updated
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 3. 相册 albums
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS albums (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  cover_image text,
  is_public   boolean     NOT NULL DEFAULT true,
  photo_count integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "albums_select" ON albums;
CREATE POLICY "albums_select" ON albums
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "albums_write" ON albums;
CREATE POLICY "albums_write" ON albums
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_albums_public ON albums (is_public, created_at DESC) WHERE is_public = true;

DROP TRIGGER IF EXISTS t_albums_updated ON albums;
CREATE TRIGGER t_albums_updated
  BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 4. 照片 photos
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS photos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id      uuid        REFERENCES albums (id) ON DELETE SET NULL,
  url           text        NOT NULL,
  thumbnail_url text,
  title         text,
  description   text,
  location      text,
  taken_at      timestamptz,
  width         integer,
  height        integer,
  size          bigint,
  exif_data     jsonb,
  tags          text[]      DEFAULT '{}',
  is_favorite   boolean     NOT NULL DEFAULT false,
  views         integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "photos_select" ON photos;
CREATE POLICY "photos_select" ON photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "photos_write" ON photos;
CREATE POLICY "photos_write"  ON photos FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_photos_album     ON photos (album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_favorite  ON photos (is_favorite, created_at DESC) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_photos_tags_gin  ON photos USING gin (tags);


-- ────────────────────────────────────────────────────────────
-- 5. 歌单 playlists
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playlists (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  cover_image text,
  is_public   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlists_select" ON playlists;
CREATE POLICY "playlists_select" ON playlists
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "playlists_write" ON playlists;
CREATE POLICY "playlists_write" ON playlists
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists (is_public) WHERE is_public = true;

DROP TRIGGER IF EXISTS t_playlists_updated ON playlists;
CREATE TRIGGER t_playlists_updated
  BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 6. 歌曲 songs
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS songs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id      uuid        REFERENCES playlists (id) ON DELETE SET NULL,
  title            text        NOT NULL,
  artist           text        NOT NULL,
  album            text,
  cover_image      text,
  duration         text,
  duration_seconds integer,
  music_url        text,
  audio_url        text,
  lyrics           text,
  platform         text        NOT NULL DEFAULT 'other'
                               CHECK (platform IN ('netease','qq','spotify','apple','local','other')),
  platform_id      text,
  note             text,
  mood             text,
  is_favorite      boolean     NOT NULL DEFAULT false,
  play_count       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "songs_select" ON songs;
CREATE POLICY "songs_select" ON songs FOR SELECT USING (true);
DROP POLICY IF EXISTS "songs_write" ON songs;
CREATE POLICY "songs_write"  ON songs FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_songs_playlist   ON songs (playlist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_favorite   ON songs (is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_songs_platform   ON songs (platform);


-- ────────────────────────────────────────────────────────────
-- 7. 日记 diaries
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS diaries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text,
  content          text        NOT NULL DEFAULT '',
  mood             text,
  weather          text,
  location         text,
  images           text[]      DEFAULT '{}',
  tags             text[]      DEFAULT '{}',
  is_public        boolean     NOT NULL DEFAULT false,
  word_count       integer     NOT NULL DEFAULT 0,
  diary_date       date        NOT NULL DEFAULT CURRENT_DATE,
  environment_data jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diaries_select" ON diaries;
CREATE POLICY "diaries_select" ON diaries
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "diaries_write" ON diaries;
CREATE POLICY "diaries_write" ON diaries
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_diaries_date      ON diaries (diary_date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_mood      ON diaries (mood, diary_date DESC) WHERE mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diaries_public    ON diaries (is_public, diary_date DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_diaries_tags_gin  ON diaries USING gin (tags);

DROP TRIGGER IF EXISTS t_diaries_updated ON diaries;
CREATE TRIGGER t_diaries_updated
  BEFORE UPDATE ON diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 8. 留言本 guestbook
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guestbook (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    text        NOT NULL,
  email       text,
  content     text        NOT NULL,
  website     text,
  avatar_url  text,
  ip_hash     text,
  is_pinned   boolean     NOT NULL DEFAULT false,
  is_approved boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guestbook_select" ON guestbook;
CREATE POLICY "guestbook_select" ON guestbook
  FOR SELECT USING (is_approved OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "guestbook_insert" ON guestbook;
CREATE POLICY "guestbook_insert" ON guestbook FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "guestbook_update" ON guestbook;
CREATE POLICY "guestbook_update" ON guestbook FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "guestbook_delete" ON guestbook;
CREATE POLICY "guestbook_delete" ON guestbook FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_guestbook_created  ON guestbook (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_pinned   ON guestbook (is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_guestbook_ip_hash  ON guestbook (ip_hash, created_at DESC);

DROP TRIGGER IF EXISTS t_guestbook_updated ON guestbook;
CREATE TRIGGER t_guestbook_updated
  BEFORE UPDATE ON guestbook FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 9. 友情链接 friend_links
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  url         text        NOT NULL,
  description text,
  avatar      text,
  category    text        NOT NULL DEFAULT '其他',
  is_featured boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE friend_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friend_links_select" ON friend_links;
CREATE POLICY "friend_links_select" ON friend_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "friend_links_write" ON friend_links;
CREATE POLICY "friend_links_write"  ON friend_links FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_friend_links_featured ON friend_links (is_featured, sort_order) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_friend_links_category ON friend_links (category, sort_order);

DROP TRIGGER IF EXISTS t_friend_links_updated ON friend_links;
CREATE TRIGGER t_friend_links_updated
  BEFORE UPDATE ON friend_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 10. 联系消息 contact_messages
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text,
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'unread'
                         CHECK (status IN ('unread','read','replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status  text NOT NULL DEFAULT 'unread';

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_messages_insert" ON contact_messages;
CREATE POLICY "contact_messages_insert" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "contact_messages_select" ON contact_messages;
CREATE POLICY "contact_messages_select" ON contact_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "contact_messages_update" ON contact_messages;
CREATE POLICY "contact_messages_update" ON contact_messages FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "contact_messages_delete" ON contact_messages;
CREATE POLICY "contact_messages_delete" ON contact_messages FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_contact_status  ON contact_messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages (created_at DESC);


-- ────────────────────────────────────────────────────────────
-- 11. 邮件订阅者 subscribers
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscribers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  is_active     boolean     NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscribers_insert" ON subscribers;
CREATE POLICY "subscribers_insert" ON subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "subscribers_select" ON subscribers;
CREATE POLICY "subscribers_select" ON subscribers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "subscribers_update" ON subscribers;
CREATE POLICY "subscribers_update" ON subscribers FOR UPDATE TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email  ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active        ON subscribers (is_active, subscribed_at DESC) WHERE is_active = true;


-- ────────────────────────────────────────────────────────────
-- 12. 推送通知日志 notification_logs
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_logs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text        NOT NULL DEFAULT 'new_post',
  post_id           uuid        REFERENCES posts (id) ON DELETE SET NULL,
  post_title        text,
  total_subscribers integer     NOT NULL DEFAULT 0,
  successful        integer     NOT NULL DEFAULT 0,
  failed            integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_logs_select" ON notification_logs;
CREATE POLICY "notification_logs_select" ON notification_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "notification_logs_insert" ON notification_logs;
CREATE POLICY "notification_logs_insert" ON notification_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_post    ON notification_logs (post_id);


-- ────────────────────────────────────────────────────────────
-- 13. 资源分类 resource_categories
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resource_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  icon        text        NOT NULL DEFAULT 'folder',
  color       text        NOT NULL DEFAULT 'gray',
  sort_order  integer     NOT NULL DEFAULT 0,
  is_system   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resource_categories_select" ON resource_categories;
CREATE POLICY "resource_categories_select" ON resource_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "resource_categories_write" ON resource_categories;
CREATE POLICY "resource_categories_write"  ON resource_categories FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_resource_categories_sort ON resource_categories (sort_order);

INSERT INTO resource_categories (name, slug, icon, color, sort_order, is_system) VALUES
  ('图片',   'image',   'image',     'purple', 1,  true),
  ('视频',   'video',   'video',     'blue',   2,  true),
  ('文档',   'doc',     'file-text', 'green',  3,  true),
  ('压缩包', 'archive', 'archive',   'orange', 4,  true),
  ('音频',   'audio',   'music',     'pink',   5,  true),
  ('代码',   'code',    'code',      'cyan',   6,  true),
  ('其他',   'other',   'folder',    'gray',   99, true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 14. 资源文件 resources
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  original_name  text        NOT NULL,
  description    text        NOT NULL DEFAULT '',
  file_url       text        NOT NULL,
  file_size      bigint      NOT NULL DEFAULT 0,
  file_type      text        NOT NULL DEFAULT 'application/octet-stream',
  category       text        NOT NULL DEFAULT 'other',
  extension      text        NOT NULL DEFAULT '',
  is_public      boolean     NOT NULL DEFAULT true,
  download_count integer     NOT NULL DEFAULT 0,
  tags           text[]      DEFAULT '{}',
  upload_ip      text,
  checksum       text,
  is_verified    boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_select" ON resources;
CREATE POLICY "resources_select" ON resources
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "resources_write" ON resources;
CREATE POLICY "resources_write"  ON resources FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "resources_insert_anon" ON resources;
CREATE POLICY "resources_insert_anon" ON resources FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_resources_category  ON resources (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_public    ON resources (is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_resources_tags_gin  ON resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_resources_extension ON resources (extension);

DROP TRIGGER IF EXISTS t_resources_updated ON resources;
CREATE TRIGGER t_resources_updated
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 15. 此刻 now_entries
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS now_entries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text        NOT NULL DEFAULT 'doing',
  content    text        NOT NULL,
  emoji      text,
  link       text,
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE now_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "now_entries_select" ON now_entries;
CREATE POLICY "now_entries_select" ON now_entries
  FOR SELECT USING (is_active OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "now_entries_write" ON now_entries;
CREATE POLICY "now_entries_write"  ON now_entries FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_now_active    ON now_entries (is_active, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_now_category  ON now_entries (category, sort_order);

DROP TRIGGER IF EXISTS t_now_entries_updated ON now_entries;
CREATE TRIGGER t_now_entries_updated
  BEFORE UPDATE ON now_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 16. 书影音 media_items
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL
                            CHECK (type IN ('book','movie','tv','music','podcast','game')),
  title         text        NOT NULL,
  author        text,
  cover_image   text,
  rating        numeric(3,1) CHECK (rating >= 1 AND rating <= 10),
  status        text        NOT NULL DEFAULT 'want'
                            CHECK (status IN ('want','doing','done')),
  review        text,
  finish_date   date,
  external_link text,
  tags          text[]      DEFAULT '{}',
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_items_select" ON media_items;
CREATE POLICY "media_items_select" ON media_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "media_items_write" ON media_items;
CREATE POLICY "media_items_write"  ON media_items FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_media_type    ON media_items (type, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_status  ON media_items (status, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_finish  ON media_items (finish_date DESC NULLS LAST);

DROP TRIGGER IF EXISTS t_media_items_updated ON media_items;
CREATE TRIGGER t_media_items_updated
  BEFORE UPDATE ON media_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 17. 时间线 timeline_events
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timeline_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  description  text,
  date         date        NOT NULL,
  category     text        NOT NULL DEFAULT 'life'
                           CHECK (category IN ('work','education','life','achievement','travel')),
  icon         text,
  image        text,
  link         text,
  is_milestone boolean     NOT NULL DEFAULT false,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timeline_events_select" ON timeline_events;
CREATE POLICY "timeline_events_select" ON timeline_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "timeline_events_write" ON timeline_events;
CREATE POLICY "timeline_events_write"  ON timeline_events FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_timeline_date      ON timeline_events (date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_category  ON timeline_events (category, date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_milestone ON timeline_events (is_milestone, date DESC) WHERE is_milestone = true;

DROP TRIGGER IF EXISTS t_timeline_events_updated ON timeline_events;
CREATE TRIGGER t_timeline_events_updated
  BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 18. 工具箱 uses_items
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uses_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL,
  name        text        NOT NULL,
  description text,
  icon_url    text,
  link        text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uses_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uses_items_select" ON uses_items;
CREATE POLICY "uses_items_select" ON uses_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "uses_items_write" ON uses_items;
CREATE POLICY "uses_items_write"  ON uses_items FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_uses_category   ON uses_items (category, sort_order);
CREATE INDEX IF NOT EXISTS idx_uses_sort_order ON uses_items (sort_order);

DROP TRIGGER IF EXISTS t_uses_items_updated ON uses_items;
CREATE TRIGGER t_uses_items_updated
  BEFORE UPDATE ON uses_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 19. 用户互动 user_interactions（点赞 / 收藏）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_interactions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  visitor_id       text        NOT NULL,
  interaction_type text        NOT NULL CHECK (interaction_type IN ('like','bookmark')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_id, interaction_type)
);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_interactions_select" ON user_interactions;
CREATE POLICY "user_interactions_select" ON user_interactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_interactions_insert" ON user_interactions;
CREATE POLICY "user_interactions_insert" ON user_interactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "user_interactions_delete" ON user_interactions;
CREATE POLICY "user_interactions_delete" ON user_interactions FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_interactions_post     ON user_interactions (post_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_visitor  ON user_interactions (visitor_id, post_id);


-- ────────────────────────────────────────────────────────────
-- 20. 文章统计 post_stats
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_stats (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        uuid        NOT NULL UNIQUE REFERENCES posts (id) ON DELETE CASCADE,
  view_count     integer     NOT NULL DEFAULT 0,
  like_count     integer     NOT NULL DEFAULT 0,
  bookmark_count integer     NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_stats_select" ON post_stats;
CREATE POLICY "post_stats_select" ON post_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "post_stats_write" ON post_stats;
CREATE POLICY "post_stats_write"  ON post_stats FOR ALL WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_stats_post_id ON post_stats (post_id);
CREATE INDEX IF NOT EXISTS idx_post_stats_views          ON post_stats (view_count DESC);

-- RPC：自增文章浏览数
CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO post_stats (post_id, view_count)
    VALUES (post_id, 1)
    ON CONFLICT (post_id) DO UPDATE
      SET view_count = post_stats.view_count + 1,
          updated_at = now();
END;
$$;

-- RPC：减少统计字段（取消点赞/收藏时调用）
CREATE OR REPLACE FUNCTION decrement_stat(p_post_id uuid, p_field text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_field = 'like_count' THEN
    UPDATE post_stats
       SET like_count = GREATEST(like_count - 1, 0), updated_at = now()
     WHERE post_id = p_post_id;
  ELSIF p_field = 'bookmark_count' THEN
    UPDATE post_stats
       SET bookmark_count = GREATEST(bookmark_count - 1, 0), updated_at = now()
     WHERE post_id = p_post_id;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 21. 页面访问记录 page_views
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path   text        NOT NULL,
  page_title  text,
  post_id     uuid        REFERENCES posts (id) ON DELETE SET NULL,
  visitor_id  text        NOT NULL,
  ip_hash     text,
  user_agent  text,
  referer     text,
  device_type text,
  browser     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "page_views_insert" ON page_views;
CREATE POLICY "page_views_insert" ON page_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "page_views_select" ON page_views;
CREATE POLICY "page_views_select" ON page_views FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path    ON page_views (page_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views (visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_post    ON page_views (post_id, created_at DESC) WHERE post_id IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- 22. 网站配置 site_settings
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        NOT NULL UNIQUE,
  value      jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_settings_select" ON site_settings;
CREATE POLICY "site_settings_select" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_settings_write" ON site_settings;
CREATE POLICY "site_settings_write"  ON site_settings FOR ALL TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (key);

INSERT INTO site_settings (key, value) VALUES (
  'profile',
  '{
    "name": "博主",
    "bio": "记录生活，分享思考",
    "avatar": "",
    "location": "",
    "website": "",
    "github": "",
    "twitter": "",
    "email": ""
  }'::jsonb
) ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 23. 健康检查表 test_table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS test_table (
  id         serial      PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "test_table_select" ON test_table;
CREATE POLICY "test_table_select" ON test_table FOR SELECT USING (true);


-- ============================================================
-- 完成！共建 23 张表，3 个 RPC 函数
-- ============================================================
