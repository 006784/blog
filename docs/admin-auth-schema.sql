-- ============================================================
-- 管理员认证增强 — 补充表
-- 在 Supabase SQL Editor 执行（需先执行 schema.sql）
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. 管理员 Session 表（多设备管理 / 强制踢出）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text        NOT NULL UNIQUE,   -- SHA-256(sessionId + JWT_SECRET)
  ip_address    text,
  user_agent    text,
  last_activity timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL
);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 只允许服务端（service role）读写，anon/authenticated 均无权访问
DROP POLICY IF EXISTS "admin_sessions_deny_all" ON admin_sessions;
CREATE POLICY "admin_sessions_deny_all" ON admin_sessions
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token      ON admin_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires    ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_activity   ON admin_sessions (last_activity DESC);

-- 自动清理过期 session（需要 pg_cron 扩展，或手动定期运行）
-- SELECT cron.schedule('cleanup-admin-sessions', '0 * * * *',
--   $$DELETE FROM admin_sessions WHERE expires_at < now()$$);


-- ────────────────────────────────────────────────────────────
-- 2. 登录尝试日志（审计 + 封禁依据）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip         text        NOT NULL,
  success    boolean     NOT NULL DEFAULT false,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_login_attempts_deny_all" ON admin_login_attempts;
CREATE POLICY "admin_login_attempts_deny_all" ON admin_login_attempts
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_admin_attempts_ip      ON admin_login_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_attempts_created ON admin_login_attempts (created_at DESC);


-- ────────────────────────────────────────────────────────────
-- 3. site_settings 追加 admin_totp key（初始值：未启用）
-- ────────────────────────────────────────────────────────────

INSERT INTO site_settings (key, value)
VALUES ('admin_totp', '{"enabled": false}'::jsonb)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 环境变量（在 .env.local 中添加）：
--
--   JWT_SECRET=<随机 64 字符，用于签发 JWT>
--   ADMIN_EMAIL=<你的邮箱，接收安全告警>
--   RESEND_API_KEY=<Resend API Key，用于发送封禁告警邮件>
--   RESEND_FROM=<发件人，如 security@yourdomain.com>
-- ============================================================

