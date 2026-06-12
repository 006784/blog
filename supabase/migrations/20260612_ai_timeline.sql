-- /timeline 改造为「AI 发展史」时间线：
-- 1. category 从 work/education/life/achievement/travel
--    改为 breakthrough/product/industry/tracking（AI 主题分类）
-- 2. 新增 timeline_event_logs 表：每个时间线节点（尤其是「AI日报追踪」节点）
--    下挂的逐日动态日志，由每日定时任务追加，前端点开节点时按时间展示。

alter table timeline_events drop constraint if exists timeline_events_category_check;
alter table timeline_events add constraint timeline_events_category_check
  check (category in ('breakthrough', 'product', 'industry', 'tracking'));

create table if not exists timeline_event_logs (
  id uuid primary key default gen_random_uuid(),
  timeline_event_id uuid not null references timeline_events(id) on delete cascade,
  date date not null,
  title text not null,
  content text not null,
  link text,
  created_at timestamptz not null default now()
);

alter table timeline_event_logs enable row level security;

drop policy if exists "timeline_event_logs_select" on timeline_event_logs;
create policy "timeline_event_logs_select"
on timeline_event_logs for select using (true);

drop policy if exists "timeline_event_logs_write" on timeline_event_logs;
create policy "timeline_event_logs_write"
on timeline_event_logs for all to authenticated using (true);

create index if not exists idx_timeline_event_logs_event
  on timeline_event_logs (timeline_event_id, date desc);
