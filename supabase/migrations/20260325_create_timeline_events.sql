create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  category text not null default 'life'
    check (category in ('work', 'education', 'life', 'achievement', 'travel')),
  icon text,
  image text,
  link text,
  is_milestone boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table timeline_events enable row level security;

drop policy if exists "timeline_events_select" on timeline_events;
create policy "timeline_events_select"
on timeline_events for select using (true);

drop policy if exists "timeline_events_write" on timeline_events;
create policy "timeline_events_write"
on timeline_events for all to authenticated using (true);

create index if not exists idx_timeline_date on timeline_events (date desc);
create index if not exists idx_timeline_category on timeline_events (category, date desc);
create index if not exists idx_timeline_milestone
on timeline_events (is_milestone, date desc)
where is_milestone = true;

drop trigger if exists t_timeline_events_updated on timeline_events;
create trigger t_timeline_events_updated
before update on timeline_events
for each row execute function update_updated_at();
