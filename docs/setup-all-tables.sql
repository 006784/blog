-- ============================================================
-- 拾光博客 — 全量建表脚本（collections / media / timeline / uses / links / resources）
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. 此刻 now_entries
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS now_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text NOT NULL DEFAULT 'doing',
  content    text NOT NULL,
  emoji      text,
  link       text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE now_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "now_entries_select" ON now_entries
  FOR SELECT USING (is_active OR auth.role() = 'authenticated');

CREATE POLICY "now_entries_write" ON now_entries
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_now_entries_active ON now_entries (is_active, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_now_entries_category ON now_entries (category, sort_order);

DROP TRIGGER IF EXISTS now_entries_updated_at ON now_entries;
CREATE TRIGGER now_entries_updated_at
  BEFORE UPDATE ON now_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 1. 文章合集 collections
-- ──────────────────────────────────────────────────────────────





-- ──────────────────────────────────────────────────────────────
-- 1. 书影音 media_items
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL CHECK (type IN ('book','movie','tv','music','podcast','game')),
  title         text NOT NULL,
  author        text,
  cover_image   text,
  rating        numeric(3,1) CHECK (rating >= 1 AND rating <= 10),
  status        text NOT NULL DEFAULT 'want' CHECK (status IN ('want','doing','done')),
  review        text,
  finish_date   date,
  external_link text,
  tags          text[] DEFAULT '{}',
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "media_items_select" ON media_items
  FOR SELECT USING (true);

-- 只有 authenticated（管理员）可写
CREATE POLICY "media_items_insert" ON media_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "media_items_update" ON media_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "media_items_delete" ON media_items
  FOR DELETE TO authenticated USING (true);

-- 索引
CREATE INDEX IF NOT EXISTS idx_media_items_type    ON media_items (type, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_items_status  ON media_items (status, finish_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_media_items_finish  ON media_items (finish_date DESC NULLS LAST);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS media_items_updated_at ON media_items;
CREATE TRIGGER media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 2. 时间线 timeline_events
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timeline_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  date         date NOT NULL,
  category     text NOT NULL DEFAULT 'life'
                 CHECK (category IN ('work','education','life','achievement','travel')),
  icon         text,
  image        text,
  link         text,
  is_milestone boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_events_select" ON timeline_events
  FOR SELECT USING (true);

CREATE POLICY "timeline_events_insert" ON timeline_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "timeline_events_update" ON timeline_events
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "timeline_events_delete" ON timeline_events
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_timeline_date      ON timeline_events (date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_category  ON timeline_events (category, date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_milestone ON timeline_events (is_milestone, date DESC)
  WHERE is_milestone = true;

DROP TRIGGER IF EXISTS timeline_events_updated_at ON timeline_events;
CREATE TRIGGER timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 3. 工具箱 uses_items
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uses_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,   -- hardware / software / dev-tools / services / design / daily
  name        text NOT NULL,
  description text,
  icon_url    text,
  link        text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uses_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uses_items_select" ON uses_items
  FOR SELECT USING (true);

CREATE POLICY "uses_items_insert" ON uses_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "uses_items_update" ON uses_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "uses_items_delete" ON uses_items
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_uses_category   ON uses_items (category, sort_order);
CREATE INDEX IF NOT EXISTS idx_uses_sort_order ON uses_items (sort_order);

DROP TRIGGER IF EXISTS uses_items_updated_at ON uses_items;
CREATE TRIGGER uses_items_updated_at
  BEFORE UPDATE ON uses_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 示例数据（可选，删除后不影响功能）
-- ──────────────────────────────────────────────────────────────

-- 书影音示例
INSERT INTO media_items (type, title, author, status, rating, review, finish_date) VALUES
  ('book',  '人类简史',       '赫拉利',   'done',  8.5, '颠覆认知的宏大叙事',       '2024-03-01'),
  ('movie', '星际穿越',       '诺兰',     'done',  9.0, '时间与爱是宇宙的语言',     '2024-01-15'),
  ('tv',    '黑镜',           'Netflix',  'doing', NULL, NULL,                      NULL),
  ('book',  '置身事内',       '兰小欢',   'done',  8.0, '理解中国经济的入门书',     '2024-06-20'),
  ('music', 'Currents',       'Tame Impala','done', 9.5, '迷幻流行的极致',          '2023-12-01'),
  ('game',  'Hollow Knight',  'Team Cherry','done', 9.0, '精心雕琢的地下世界',      '2024-02-10')
ON CONFLICT DO NOTHING;

-- 时间线示例
INSERT INTO timeline_events (title, description, date, category, icon, is_milestone) VALUES
  ('开始写博客',    '搭建个人博客，记录生活与思考', '2023-01-01', 'life',        '✍️', true),
  ('完成博客重构',  '从 WordPress 迁移到 Next.js',  '2024-06-01', 'achievement', '🚀', true),
  ('第一份工作',    '加入第一家公司，正式步入职场',  '2022-07-01', 'work',        '💼', true)
ON CONFLICT DO NOTHING;

-- 工具箱示例
INSERT INTO uses_items (category, name, description, link, sort_order) VALUES
  ('hardware',   'MacBook Pro M3',   '主力开发机',                    'https://apple.com', 1),
  ('hardware',   'iPhone 15 Pro',    '日常使用',                      'https://apple.com', 2),
  ('software',   'Cursor',           'AI 驱动的代码编辑器',           'https://cursor.sh', 1),
  ('software',   'Arc Browser',      '颜值与效率兼备的浏览器',        'https://arc.net',   2),
  ('dev-tools',  'Supabase',         '开源 Firebase 替代品',          'https://supabase.com', 1),
  ('dev-tools',  'Vercel',           '前端部署平台',                   'https://vercel.com',   2),
  ('design',     'Figma',            'UI/UX 设计协作工具',            'https://figma.com',    1),
  ('daily',      'Notion',           '笔记与知识管理',                'https://notion.so',    1),
  ('daily',      'Raycast',          'Mac 效率启动器',                'https://raycast.com',  2)
ON CONFLICT DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- 4. 友链 friend_links
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  url         text NOT NULL,
  description text,
  avatar      text,
  category    text DEFAULT '其他',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE friend_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_links_select" ON friend_links FOR SELECT USING (true);
CREATE POLICY "friend_links_insert" ON friend_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "friend_links_update" ON friend_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "friend_links_delete" ON friend_links FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_friend_links_featured ON friend_links (is_featured, sort_order) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_friend_links_category ON friend_links (category, sort_order);

DROP TRIGGER IF EXISTS friend_links_updated_at ON friend_links;
CREATE TRIGGER friend_links_updated_at
  BEFORE UPDATE ON friend_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 5. 资源分类 resource_categories
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resource_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  icon        text NOT NULL DEFAULT 'folder',
  color       text NOT NULL DEFAULT 'gray',
  sort_order  integer NOT NULL DEFAULT 0,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_categories_select" ON resource_categories FOR SELECT USING (true);
CREATE POLICY "resource_categories_write"  ON resource_categories FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_resource_categories_sort ON resource_categories (sort_order);

-- 内置默认分类
INSERT INTO resource_categories (name, slug, icon, color, sort_order, is_system) VALUES
  ('图片',     'image',    'image',     'purple', 1, true),
  ('视频',     'video',    'video',     'blue',   2, true),
  ('文档',     'doc',      'file-text', 'green',  3, true),
  ('压缩包',   'archive',  'archive',   'orange', 4, true),
  ('音频',     'audio',    'music',     'pink',   5, true),
  ('代码',     'code',     'code',      'cyan',   6, true),
  ('其他',     'other',    'folder',    'gray',   99, true)
ON CONFLICT (slug) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- 6. 资源文件 resources
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  original_name  text NOT NULL,
  description    text DEFAULT '',
  file_url       text NOT NULL,
  file_size      bigint NOT NULL DEFAULT 0,
  file_type      text NOT NULL DEFAULT 'application/octet-stream',
  category       text NOT NULL DEFAULT 'other',
  extension      text NOT NULL DEFAULT '',
  is_public      boolean NOT NULL DEFAULT true,
  download_count integer NOT NULL DEFAULT 0,
  tags           text[] DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 公开资源所有人可读
CREATE POLICY "resources_select_public" ON resources
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');

CREATE POLICY "resources_write" ON resources FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_resources_category   ON resources (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_public  ON resources (is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_resources_tags_gin   ON resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_resources_extension  ON resources (extension);

DROP TRIGGER IF EXISTS resources_updated_at ON resources;
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
