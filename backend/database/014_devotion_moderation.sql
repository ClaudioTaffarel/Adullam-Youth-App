begin;

alter table public.devotions
add column is_hidden boolean not null default false;

-- Tambahan syarat pada policy SELECT yang sudah ada.
create policy "Hidden devotions are not readable by members"
on public.devotions
as restrictive
for select
to authenticated
using (is_hidden = false);

-- Backend boleh memperbarui kolom moderasi.
grant update (is_hidden)
on public.devotions
to service_role;

-- Tetap menghitung semua tanggal kontribusi pengguna sendiri,
-- termasuk renungan yang disembunyikan.
create or replace function public.get_my_devotion_streak()
returns table (
  current_streak integer,
  longest_streak integer,
  total_days integer,
  last_devotion_date date,
  completed_today boolean,
  today date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or not public.is_current_account_active() then
    raise exception 'Akun tidak memiliki akses.'
      using errcode = '42501';
  end if;

  return query
  with settings as (
    select
      (now() at time zone 'Asia/Jakarta')::date as today
  ),
  unique_days as (
    select distinct d.devotion_date
    from public.devotions as d
    cross join settings as s
    where d.user_id = (select auth.uid())
      and d.devotion_date <= s.today
  ),
  grouped_days as (
    select
      d.devotion_date,
      d.devotion_date
        - (row_number() over (
            order by d.devotion_date
          ))::integer as group_key
    from unique_days as d
  ),
  streak_runs as (
    select
      max(d.devotion_date) as end_date,
      count(*)::integer as day_count
    from grouped_days as d
    group by d.group_key
  )
  select
    coalesce(
      (
        select max(r.day_count)
        from streak_runs as r
        where r.end_date in (s.today, s.today - 1)
      ),
      0
    )::integer,

    coalesce(
      (select max(r.day_count) from streak_runs as r),
      0
    )::integer,

    (select count(*) from unique_days)::integer,

    (select max(d.devotion_date) from unique_days as d),

    exists (
      select 1
      from unique_days as d
      where d.devotion_date = s.today
    ),

    s.today
  from settings as s;
end;
$$;

revoke all on function public.get_my_devotion_streak()
from public, anon;

grant execute on function public.get_my_devotion_streak()
to authenticated;

notify pgrst, 'reload schema';

commit;