begin;

-- Hanya mengembalikan ID dan lokasi avatar penulis hari ini.
create function public.get_today_devotion_avatars()
returns table (
  user_id uuid,
  avatar_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id as user_id,
    p.avatar_path
  from public.profiles p
  where (select auth.uid()) is not null
    and exists (
      select 1
      from public.devotions d
      where d.user_id = p.id
        and d.devotion_date =
          (now() at time zone 'Asia/Jakarta')::date
    );
$$;

revoke execute on function public.get_today_devotion_avatars()
from public, anon, authenticated;

grant execute on function public.get_today_devotion_avatars()
to authenticated;

-- Member boleh membaca avatar aktif penulis renungan hari ini.
create policy "Members can read today's devotion avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and name in (
    select a.avatar_path
    from public.get_today_devotion_avatars() a
    where a.avatar_path is not null
  )
);

commit;