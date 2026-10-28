begin;

-- Memeriksa akun pemilik token yang sedang digunakan.
create or replace function public.is_current_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = (select auth.uid())
      and (
        u.banned_until is null
        or u.banned_until <= now()
      )
  );
$$;

revoke all on function public.is_current_account_active()
from public, anon;

grant execute on function public.is_current_account_active()
to authenticated;

-- Restrictive policy menambahkan syarat pada policy yang sudah ada.
-- Policy lama tetap menentukan data mana yang boleh diakses.
create policy "Active accounts only on profiles"
on public.profiles
as restrictive
for all
to authenticated
using ((select public.is_current_account_active()))
with check ((select public.is_current_account_active()));

create policy "Active accounts only on devotions"
on public.devotions
as restrictive
for all
to authenticated
using ((select public.is_current_account_active()))
with check ((select public.is_current_account_active()));

create policy "Active accounts only on user roles"
on public.user_roles
as restrictive
for all
to authenticated
using ((select public.is_current_account_active()))
with check ((select public.is_current_account_active()));

create policy "Active accounts only on authenticated storage"
on storage.objects
as restrictive
for all
to authenticated
using ((select public.is_current_account_active()))
with check ((select public.is_current_account_active()));

commit;