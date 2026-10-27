begin;

create or replace function public.get_admin_dashboard_stats()
returns table (
  registered_members bigint,
  devotions_today bigint,
  authors_today bigint,
  published_events bigint,
  today date
)
language sql
stable
security definer
set search_path = ''
as $$
  with current_day as (
    select (now() at time zone 'Asia/Jakarta')::date as value
  ),
  devotion_counts as (
    select
      count(*) as total,
      count(distinct d.user_id) as authors
    from public.devotions as d
    where d.devotion_date = (select value from current_day)
  )
  select
    (select count(*) from auth.users),
    dc.total,
    dc.authors,
    (
      select count(*)
      from public.events as e
      where e.is_published = true
    ),
    cd.value
  from current_day as cd
  cross join devotion_counts as dc;
$$;

-- Hanya backend dengan service role yang boleh menjalankan fungsi ini.
revoke all on function public.get_admin_dashboard_stats()
from public, anon, authenticated;

grant execute on function public.get_admin_dashboard_stats()
to service_role;

commit;