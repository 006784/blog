-- 资源存储表 - 用于存储文件资源信息
-- 请在Supabase SQL Editor中运行此脚本

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 资源表
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,                    -- 资源名称（用户自定义）
    original_name TEXT NOT NULL,           -- 原始文件名
    description TEXT,                      -- 资源描述
    file_url TEXT NOT NULL,                -- 文件URL
    file_size INTEGER NOT NULL,            -- 文件大小(bytes)
    file_type TEXT NOT NULL,               -- MIME类型
    category TEXT DEFAULT 'other',         -- 分类: image, video, document, software, audio, other
    extension TEXT,                        -- 文件扩展名
    is_public BOOLEAN DEFAULT false,       -- 是否公开(默认私有)
    download_count INTEGER DEFAULT 0,      -- 下载次数
    tags TEXT[] DEFAULT '{}',              -- 标签数组
    upload_ip TEXT,                        -- 上传者IP(安全审计)
    checksum TEXT,                         -- 文件MD5校验和
    is_verified BOOLEAN DEFAULT false,     -- 是否已验证安全
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 资源下载记录表 - 用于安全审计和统计
CREATE TABLE IF NOT EXISTS resource_downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    download_ip TEXT,                      -- 下载者IP
    user_agent TEXT,                       -- 浏览器信息
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_name ON resources USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource_id ON resource_downloads(resource_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resources_updated_at ON resources;
CREATE TRIGGER trigger_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resources_updated_at();

-- 启用RLS（行级安全）
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;

-- 资源表策略：公开资源可读，其他需要认证
CREATE POLICY "Public resources are viewable by everyone"
    ON resources FOR SELECT
    USING (is_public = true);

CREATE POLICY "All resources viewable by authenticated users"
    ON resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON resources FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
    ON resources FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users only"
    ON resources FOR DELETE
    TO authenticated
    USING (true);

-- 下载记录策略
CREATE POLICY "Downloads are insertable by everyone"
    ON resource_downloads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Downloads viewable by authenticated users"
    ON resource_downloads FOR SELECT
    TO authenticated
    USING (true);

-- 注意：您还需要在Supabase Dashboard中创建Storage Bucket
-- 1. 进入 Storage -> Create a new bucket
-- 2. 名称: resources
-- 3. 设置为 Public bucket（如果需要公开访问）
-- 4. 配置 RLS 策略允许上传

COMMENT ON TABLE resources IS '资源存储表 - 存储上传的文件信息';
COMMENT ON TABLE resource_downloads IS '资源下载记录 - 用于统计和安全审计';
