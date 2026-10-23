begin;

-- Simpan lokasi foto profil.
alter table public.profiles
add column avatar_path text;

-- Lokasi foto harus berada dalam folder milik pengguna.
alter table public.profiles
add constraint profiles_avatar_path_owner
check (
  avatar_path is null
  or (
    split_part(avatar_path, '/', 1) = id::text
    and length(split_part(avatar_path, '/', 2)) > 0
  )
);

-- Izinkan pengguna memperbarui lokasi foto.
-- Policy profiles sebelumnya tetap membatasi ke profil sendiri.
grant update (avatar_path)
on public.profiles
to authenticated;

-- Pengguna boleh membaca foto dalam foldernya sendiri.
create policy "Users can read their own avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Pengguna boleh upload foto ke foldernya sendiri.
create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Pengguna boleh mengganti foto dalam foldernya sendiri.
create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Pengguna boleh menghapus foto dalam foldernya sendiri.
create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;