-- 安全监控：记录 HTTP 层可疑请求（扫描器探测 / SQLi-XSS 模式 / 恶意 UA / 登录封禁等）
-- 仅 service_role 可访问，管理后台「安全」标签页通过 /api/admin/security-events 读取

CREATE TABLE IF NOT EXISTS security_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text        NOT NULL CHECK (event_type IN (
                'scanner_probe', 'sqli_xss_pattern', 'malicious_ua',
                'unknown_404', 'login_failure', 'ip_banned'
              )),
  severity    text        NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address  text        NOT NULL,
  path        text,
  method      text,
  user_agent  text,
  referer     text,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_deny_all" ON security_events;
CREATE POLICY "security_events_deny_all"
  ON security_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type    ON security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip      ON security_events (ip_address, created_at DESC);

COMMENT ON TABLE security_events IS '安全监控事件 - 扫描器探测/可疑请求/登录封禁记录';
