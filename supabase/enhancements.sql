-- =====================================================
-- 访问统计与增强功能表
-- =====================================================

-- 1. 页面访问统计表
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path VARCHAR(500) NOT NULL,           -- 页面路径
    page_title VARCHAR(200),                    -- 页面标题
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- 关联文章
    visitor_id VARCHAR(100),                    -- 访客ID（匿名）
    ip_hash VARCHAR(64),                        -- IP哈希（隐私保护）
    user_agent TEXT,                            -- 用户代理
    referer TEXT,                               -- 来源页面
    country VARCHAR(50),                        -- 国家
    device_type VARCHAR(20),                    -- 设备类型
    browser VARCHAR(50),                        -- 浏览器
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 文章统计汇总表
CREATE TABLE IF NOT EXISTS post_stats (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,              -- 浏览量
    like_count INTEGER DEFAULT 0,              -- 点赞数
    bookmark_count INTEGER DEFAULT 0,          -- 收藏数
    share_count INTEGER DEFAULT 0,             -- 分享数
    comment_count INTEGER DEFAULT 0,           -- 评论数
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 用户互动表（点赞/收藏）
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) NOT NULL,          -- 访客ID
    interaction_type VARCHAR(20) NOT NULL,     -- like/bookmark/share
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, visitor_id, interaction_type)
);

-- 4. 操作日志表
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,               -- create/update/delete
    entity_type VARCHAR(50) NOT NULL,          -- post/resource/category
    entity_id UUID,
    entity_name VARCHAR(200),
    details JSONB,                             -- 详细信息
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 留言板表
CREATE TABLE IF NOT EXISTS guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    content TEXT NOT NULL,
    avatar_url TEXT,
    website VARCHAR(200),
    ip_hash VARCHAR(64),
    is_approved BOOLEAN DEFAULT TRUE,          -- 是否审核通过
    is_pinned BOOLEAN DEFAULT FALSE,           -- 是否置顶
    reply TEXT,                                 -- 博主回复
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 更新 posts 表添加定时发布字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'scheduled_at') THEN
        ALTER TABLE posts ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reading_time') THEN
        ALTER TABLE posts ADD COLUMN reading_time INTEGER DEFAULT 0;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_post ON page_views(post_id);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_post ON user_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_visitor ON user_interactions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_guestbook_date ON guestbook(created_at);

-- 启用 RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- page_views: 允许写入，只有管理员可读
CREATE POLICY "page_views_insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "page_views_select" ON page_views FOR SELECT USING (true);

-- post_stats: 所有人可读
CREATE POLICY "post_stats_select" ON post_stats FOR SELECT USING (true);
CREATE POLICY "post_stats_all" ON post_stats FOR ALL USING (true);

-- user_interactions: 所有人可操作
CREATE POLICY "user_interactions_all" ON user_interactions FOR ALL USING (true);

-- activity_logs: 允许写入
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT USING (true);

-- guestbook: 公开查看已审核的，所有人可留言
CREATE POLICY "guestbook_select" ON guestbook FOR SELECT USING (is_approved = true);
CREATE POLICY "guestbook_insert" ON guestbook FOR INSERT WITH CHECK (true);
CREATE POLICY "guestbook_all" ON guestbook FOR ALL USING (true);

-- 创建更新统计的函数
CREATE OR REPLACE FUNCTION update_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO post_stats (post_id, view_count)
    VALUES (NEW.post_id, 1)
    ON CONFLICT (post_id)
    DO UPDATE SET view_count = post_stats.view_count + 1, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_view_count ON page_views;
CREATE TRIGGER trigger_update_view_count
    AFTER INSERT ON page_views
    FOR EACH ROW
    WHEN (NEW.post_id IS NOT NULL)
    EXECUTE FUNCTION update_post_view_count();
