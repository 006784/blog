-- =============================================
-- 拾光博客 - Supabase 数据库完整初始化脚本
-- 包含：文章、歌单、相册、日记功能
-- =============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 文章表
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT DEFAULT 'tech',
    tags TEXT[] DEFAULT '{}',
    image TEXT DEFAULT 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    cover_image TEXT,
    author TEXT DEFAULT '拾光',
    reading_time TEXT DEFAULT '5 分钟',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    meta_title TEXT,
    meta_description TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- =============================================
-- 歌单表 - 歌曲推荐
-- =============================================
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 歌曲表
CREATE TABLE IF NOT EXISTS songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    cover_image TEXT,
    duration TEXT,
    duration_seconds INTEGER, -- 歌曲时长(秒)
    music_url TEXT, -- 外部链接
    audio_url TEXT, -- 上传的音频文件URL
    lyrics TEXT, -- 歌词内容 (LRC格式)
    platform TEXT DEFAULT 'other', -- netease, qq, spotify, apple, local, other
    platform_id TEXT, -- 平台歌曲ID，用于外链
    note TEXT, -- 推荐理由/心情
    mood TEXT, -- 心情标签：happy, sad, chill, energetic 等
    is_favorite BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_playlist ON songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_songs_mood ON songs(mood);

-- =============================================
-- 相册表
-- =============================================
CREATE TABLE IF NOT EXISTS albums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT true,
    photo_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 照片表
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    location TEXT,
    taken_at TIMESTAMPTZ,
    width INTEGER,
    height INTEGER,
    size INTEGER, -- 文件大小 bytes
    exif_data JSONB, -- 相机信息等
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);

-- =============================================
-- 日记表
-- =============================================
CREATE TABLE IF NOT EXISTS diaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT, -- 心情: happy, sad, calm, excited, tired, anxious 等
    weather TEXT, -- 天气: sunny, cloudy, rainy, snowy 等
    location TEXT,
    images TEXT[] DEFAULT '{}', -- 日记配图
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false, -- 日记默认私密
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    diary_date DATE DEFAULT CURRENT_DATE -- 日记日期
);

CREATE INDEX IF NOT EXISTS idx_diaries_date ON diaries(diary_date);
CREATE INDEX IF NOT EXISTS idx_diaries_mood ON diaries(mood);
CREATE INDEX IF NOT EXISTS idx_diaries_public ON diaries(is_public);

-- =============================================
-- 分类表
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#667eea',
    icon TEXT,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, description, color, icon) VALUES
    ('技术', 'tech', '技术文章和教程', '#3b82f6', 'Code2'),
    ('设计', 'design', '设计思考和灵感', '#8b5cf6', 'Palette'),
    ('生活', 'life', '生活随笔和感悟', '#10b981', 'Coffee'),
    ('随想', 'thoughts', '随想和杂记', '#f59e0b', 'Lightbulb')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 订阅者表
-- =============================================
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 联系消息表
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 函数：增加文章浏览量
-- =============================================
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts SET views = views + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 函数：增加文章点赞数
-- =============================================
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 函数：更新相册照片数量
-- =============================================
CREATE OR REPLACE FUNCTION update_album_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE albums SET photo_count = photo_count + 1 WHERE id = NEW.album_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE albums SET photo_count = photo_count - 1 WHERE id = OLD.album_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_album_count ON photos;
CREATE TRIGGER update_album_count
    AFTER INSERT OR DELETE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_album_photo_count();

-- =============================================
-- 函数：自动更新 updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建 updated_at 触发器
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diaries_updated_at ON diaries;
CREATE TRIGGER update_diaries_updated_at
    BEFORE UPDATE ON diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 行级安全策略 (RLS)
-- =============================================

-- 启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 文章策略
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (true);

-- 歌单策略
CREATE POLICY "playlists_select" ON playlists FOR SELECT USING (true);
CREATE POLICY "playlists_insert" ON playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "playlists_update" ON playlists FOR UPDATE USING (true);
CREATE POLICY "playlists_delete" ON playlists FOR DELETE USING (true);

-- 歌曲策略
CREATE POLICY "songs_select" ON songs FOR SELECT USING (true);
CREATE POLICY "songs_insert" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "songs_update" ON songs FOR UPDATE USING (true);
CREATE POLICY "songs_delete" ON songs FOR DELETE USING (true);

-- 相册策略
CREATE POLICY "albums_select" ON albums FOR SELECT USING (true);
CREATE POLICY "albums_insert" ON albums FOR INSERT WITH CHECK (true);
CREATE POLICY "albums_update" ON albums FOR UPDATE USING (true);
CREATE POLICY "albums_delete" ON albums FOR DELETE USING (true);

-- 照片策略
CREATE POLICY "photos_select" ON photos FOR SELECT USING (true);
CREATE POLICY "photos_insert" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "photos_update" ON photos FOR UPDATE USING (true);
CREATE POLICY "photos_delete" ON photos FOR DELETE USING (true);

-- 日记策略
CREATE POLICY "diaries_select" ON diaries FOR SELECT USING (true);
CREATE POLICY "diaries_insert" ON diaries FOR INSERT WITH CHECK (true);
CREATE POLICY "diaries_update" ON diaries FOR UPDATE USING (true);
CREATE POLICY "diaries_delete" ON diaries FOR DELETE USING (true);

-- 分类策略
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);

-- 订阅策略
CREATE POLICY "subscribers_insert" ON subscribers FOR INSERT WITH CHECK (true);

-- 联系消息策略
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- =============================================
-- 插入示例数据
-- =============================================

-- =============================================
-- 友情链接表
-- =============================================
CREATE TABLE IF NOT EXISTS friend_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    category TEXT DEFAULT '其他',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_links_category ON friend_links(category);
CREATE INDEX IF NOT EXISTS idx_friend_links_featured ON friend_links(is_featured);

-- 友情链接策略
ALTER TABLE friend_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friend_links_select" ON friend_links FOR SELECT USING (true);
CREATE POLICY "friend_links_insert" ON friend_links FOR INSERT WITH CHECK (true);
CREATE POLICY "friend_links_update" ON friend_links FOR UPDATE USING (true);
CREATE POLICY "friend_links_delete" ON friend_links FOR DELETE USING (true);

-- 示例歌单
INSERT INTO playlists (name, description, cover_image) VALUES
(
    '深夜听歌',
    '适合深夜独处时听的歌曲，安静、治愈',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
),
(
    '工作专注',
    '帮助专注工作的纯音乐和轻音乐',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop'
)
ON CONFLICT DO NOTHING;

-- 示例相册
INSERT INTO albums (name, description, cover_image) VALUES
(
    '生活日常',
    '记录生活中的美好瞬间',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
),
(
    '旅行足迹',
    '走过的路，看过的风景',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop'
)
ON CONFLICT DO NOTHING;

-- 示例日记
INSERT INTO diaries (title, content, mood, weather, is_public, diary_date) VALUES
(
    '新的开始',
    '今天搭建了自己的博客网站，感觉很有成就感。希望能坚持记录下去，把生活中的点点滴滴都留存下来。',
    'happy',
    'sunny',
    true,
    CURRENT_DATE
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 资源存储表 - 安全文件存储
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    extension TEXT,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    upload_ip TEXT,
    checksum TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON resources FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update" ON resources FOR UPDATE USING (true);
CREATE POLICY "resources_delete" ON resources FOR DELETE USING (true);

-- 资源下载记录表
CREATE TABLE IF NOT EXISTS resource_downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    download_ip TEXT,
    user_agent TEXT,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_resource ON resource_downloads(resource_id);
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "downloads_insert" ON resource_downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "downloads_select" ON resource_downloads FOR SELECT USING (true);

-- =============================================
-- 完成
-- =============================================
-- 请在 Supabase SQL Editor 中运行此脚本
