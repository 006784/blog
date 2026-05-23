-- 每日简报表
CREATE TABLE IF NOT EXISTS daily_briefings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date        NOT NULL UNIQUE,        -- 简报日期（每天一条）
  title       text        NOT NULL DEFAULT '',    -- 标题（可选，默认空）
  content     text        NOT NULL DEFAULT '',    -- 正文 Markdown
  mood        text,                               -- 心情关键词
  weather     text,                               -- 天气
  links       jsonb       NOT NULL DEFAULT '[]',  -- [{title, url, comment}]
  is_public   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "briefings_select_public" ON daily_briefings;
CREATE POLICY "briefings_select_public" ON daily_briefings
  FOR SELECT USING (is_public OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "briefings_write" ON daily_briefings;
CREATE POLICY "briefings_write" ON daily_briefings
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_briefings_date ON daily_briefings (date DESC);

CREATE OR REPLACE TRIGGER briefings_updated_at
  BEFORE UPDATE ON daily_briefings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
