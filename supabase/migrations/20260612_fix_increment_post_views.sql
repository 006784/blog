-- 修复 increment_post_views：
-- 1. 参数名 post_id 与 post_stats.post_id 列名冲突，导致 PostgreSQL 报错
--    42702 "column reference post_id is ambiguous"，每次调用都失败
--    （被前端静默捕获），阅读量从未真正自增。改参数名为 p_post_id。
-- 2. 同步更新 posts.views，保持 admin/archive 页面显示的数值一致。
--    posts 表的写权限仅限 authenticated（posts_write 策略），匿名访客
--    访问文章页时以 anon 角色调用本函数，无法直接 UPDATE posts，
--    因此设为 SECURITY DEFINER，以函数所有者权限执行这一受限的计数自增。

DROP FUNCTION IF EXISTS increment_post_views(uuid);

CREATE OR REPLACE FUNCTION increment_post_views(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO post_stats (post_id, view_count)
    VALUES (p_post_id, 1)
    ON CONFLICT (post_id) DO UPDATE
      SET view_count = post_stats.view_count + 1,
          updated_at = now();

  UPDATE posts SET views = views + 1 WHERE id = p_post_id;
END;
$$;
