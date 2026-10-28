begin;

create or replace function public.get_admin_members(
  p_search text default '',
  p_page integer default 1
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := trim(coalesce(p_search, ''));
  v_page_size integer := 20;
  v_result jsonb;
begin
  if p_page is null or p_page < 1 or p_page > 100000 then
    raise exception 'Nomor halaman tidak valid.';
  end if;

  if char_length(v_search) > 100 then
    raise exception 'Pencarian maksimal 100 karakter.';
  end if;

  with filtered_members as (
    select
      u.id,
      coalesce(nullif(trim(p.display_name), ''), 'Teman') as display_name,
      u.email::text as email,
      p.phone_number,
      coalesce(r.role, 'member') as role,
      u.created_at
    from auth.users as u
    left join public.profiles as p
      on p.id = u.id
    left join public.user_roles as r
      on r.user_id = u.id
    where
      v_search = ''
      or strpos(
        lower(coalesce(p.display_name, '')),
        lower(v_search)
      ) > 0
      or strpos(
        lower(coalesce(u.email::text, '')),
        lower(v_search)
      ) > 0
  ),
  paged_members as (
    select *
    from filtered_members
    order by created_at desc, id desc
    limit v_page_size
    offset ((p_page - 1) * v_page_size)
  )
  select jsonb_build_object(
    'data',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(m)
          order by m.created_at desc, m.id desc
        )
        from paged_members as m
      ),
      '[]'::jsonb
    ),
    'pagination',
    jsonb_build_object(
      'page', p_page,
      'page_size', v_page_size,
      'total', (select count(*) from filtered_members),
      'total_pages', (
        select ceil(count(*)::numeric / v_page_size)::integer
        from filtered_members
      )
    )
  )
  into v_result;

  return v_result;
end;
$$;

-- Data akun hanya diambil backend setelah pemeriksaan admin.
revoke all on function public.get_admin_members(text, integer)
from public, anon, authenticated;

grant execute on function public.get_admin_members(text, integer)
to service_role;

commit;