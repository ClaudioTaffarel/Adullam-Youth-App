begin;

-- Satu akun memiliki satu profil.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone_number text,
  created_at timestamptz not null default now(),

  constraint profiles_name_length
    check (char_length(trim(display_name)) between 1 and 80),

  constraint profiles_phone_length
    check (
      phone_number is null
      or char_length(phone_number) between 1 and 30
    )
);

-- Aktifkan aturan akses per baris.
alter table public.profiles enable row level security;

-- Batasi hak akses dari aplikasi.
revoke all on table public.profiles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, phone_number)
  on table public.profiles to authenticated;

-- Pengguna hanya boleh membaca profil sendiri.
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Pengguna hanya boleh mengedit profil sendiri.
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Buat profil otomatis ketika ada akun baru.
create function public.create_adullam_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    phone_number
  )
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        'Teman'
      ),
      80
    ),
    left(
      nullif(trim(new.raw_user_meta_data ->> 'phone_number'), ''),
      30
    )
  );

  return new;
end;
$$;

-- Fungsi ini dipakai oleh trigger, bukan dipanggil dari frontend.
revoke execute on function public.create_adullam_profile()
  from public, anon, authenticated;

create trigger on_adullam_user_created
after insert on auth.users
for each row
execute function public.create_adullam_profile();

-- Buat profil untuk akun yang sudah terdaftar sebelumnya.
insert into public.profiles (
  id,
  display_name,
  phone_number
)
select
  id,
  left(
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
      'Teman'
    ),
    80
  ),
  left(
    nullif(trim(raw_user_meta_data ->> 'phone_number'), ''),
    30
  )
from auth.users
on conflict (id) do nothing;

commit;