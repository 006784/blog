-- =====================================================
-- 资源分类表 (Resource Categories)
-- 用于自定义资源分类管理
-- =====================================================

-- 如果表已存在，先删除相关策略
DROP POLICY IF EXISTS "resource_categories_select" ON resource_categories;
DROP POLICY IF EXISTS "resource_categories_insert" ON resource_categories;
DROP POLICY IF EXISTS "resource_categories_update" ON resource_categories;
DROP POLICY IF EXISTS "resource_categories_delete" ON resource_categories;

-- 删除表（如果存在）
DROP TABLE IF EXISTS resource_categories CASCADE;

-- 创建资源分类表
CREATE TABLE resource_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,           -- 分类名称（唯一）
    slug VARCHAR(50) NOT NULL UNIQUE,           -- 分类标识符
    description TEXT,                            -- 分类描述
    icon VARCHAR(50) DEFAULT 'folder',           -- 图标名称
    color VARCHAR(20) DEFAULT 'gray',            -- 颜色
    sort_order INTEGER DEFAULT 0,                -- 排序顺序
    is_system BOOLEAN DEFAULT FALSE,             -- 是否系统预设分类
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_resource_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resource_categories_updated_at ON resource_categories;
CREATE TRIGGER trigger_update_resource_categories_updated_at
    BEFORE UPDATE ON resource_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_categories_updated_at();

-- 插入默认分类
INSERT INTO resource_categories (name, slug, description, icon, color, sort_order, is_system) VALUES
    ('图片', 'image', '图片文件 (JPG, PNG, GIF, WebP等)', 'image', 'blue', 1, TRUE),
    ('视频', 'video', '视频文件 (MP4, WebM, MOV等)', 'video', 'purple', 2, TRUE),
    ('文档', 'document', '文档文件 (PDF, DOC, TXT等)', 'file-text', 'green', 3, TRUE),
    ('软件', 'software', '软件安装包 (DMG, EXE, ZIP等)', 'package', 'orange', 4, TRUE),
    ('音频', 'audio', '音频文件 (MP3, WAV, FLAC等)', 'music', 'pink', 5, TRUE),
    ('其他', 'other', '其他类型文件', 'file', 'gray', 99, TRUE);

-- 启用 RLS
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
-- 所有人可以查看分类
CREATE POLICY "resource_categories_select" ON resource_categories
    FOR SELECT USING (true);

-- 只允许通过 API（anon key）进行写操作
CREATE POLICY "resource_categories_insert" ON resource_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "resource_categories_update" ON resource_categories
    FOR UPDATE USING (true);

CREATE POLICY "resource_categories_delete" ON resource_categories
    FOR DELETE USING (is_system = FALSE);  -- 系统分类不可删除

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_resource_categories_slug ON resource_categories(slug);
CREATE INDEX IF NOT EXISTS idx_resource_categories_sort ON resource_categories(sort_order);

-- 验证
SELECT * FROM resource_categories ORDER BY sort_order;
