begin;

create or replace function public.get_my_devotion_streak()
returns table (
  current_streak integer,
  longest_streak integer,
  total_days integer,
  last_devotion_date date,
  completed_today boolean,
  today date
)
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select
      (now() at time zone 'Asia/Jakarta')::date as today
  ),

  -- Beberapa renungan pada tanggal yang sama dihitung sekali.
  unique_days as (
    select distinct d.devotion_date
    from public.devotions d
    cross join settings s
    where d.user_id = (select auth.uid())
      and d.devotion_date <= s.today
  ),

  -- Tanggal berurutan akan mendapatkan group_key yang sama.
  grouped_days as (
    select
      devotion_date,
      devotion_date
        - (row_number() over (
            order by devotion_date
          ))::integer as group_key
    from unique_days
  ),

  streak_runs as (
    select
      min(devotion_date) as start_date,
      max(devotion_date) as end_date,
      count(*)::integer as day_count
    from grouped_days
    group by group_key
  )

  select
    coalesce(
      (
        select max(r.day_count)
        from streak_runs r
        where r.end_date in (s.today, s.today - 1)
      ),
      0
    )::integer as current_streak,

    coalesce(
      (select max(r.day_count) from streak_runs r),
      0
    )::integer as longest_streak,

    (select count(*) from unique_days)::integer as total_days,

    (select max(d.devotion_date) from unique_days d)
      as last_devotion_date,

    exists (
      select 1
      from unique_days d
      where d.devotion_date = s.today
    ) as completed_today,

    s.today

  from settings s;
$$;

revoke execute
on function public.get_my_devotion_streak()
from public, anon;

grant execute
on function public.get_my_devotion_streak()
to authenticated;

commit;