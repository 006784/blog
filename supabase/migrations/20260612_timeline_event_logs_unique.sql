-- 为 timeline_event_logs 增加 (timeline_event_id, date) 唯一约束，
-- 支持每日定时任务用 upsert（按日期）写入，避免重复运行产生重复日志。

alter table timeline_event_logs
  add constraint timeline_event_logs_event_date_unique unique (timeline_event_id, date);
