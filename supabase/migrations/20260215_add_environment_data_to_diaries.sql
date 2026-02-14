-- Ensure diaries can persist geolocation/weather snapshot
alter table if exists diaries
add column if not exists environment_data jsonb;

create index if not exists idx_diaries_environment
on diaries using gin (environment_data);

-- Backfill basic environment payload from legacy columns when possible
update diaries
set environment_data = jsonb_strip_nulls(
  jsonb_build_object(
    'location', case
      when location is not null and length(trim(location)) > 0
      then jsonb_build_object('address', location)
      else null
    end,
    'weather', case
      when weather is not null and length(trim(weather)) > 0
      then jsonb_build_object('condition', weather)
      else null
    end
  )
)
where environment_data is null
  and (
    (location is not null and length(trim(location)) > 0)
    or (weather is not null and length(trim(weather)) > 0)
  );

-- Refresh PostgREST schema cache (Supabase API)
select pg_notify('pgrst', 'reload schema');
