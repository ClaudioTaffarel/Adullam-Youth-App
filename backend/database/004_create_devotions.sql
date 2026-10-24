begin;

create table public.devotions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    default auth.uid()
    references public.profiles(id)
    on delete cascade,

  author_name text not null,

  book text not null,
  chapter integer not null,
  verse_start integer not null,
  verse_end integer,

  reflection text not null,

  created_at timestamptz not null default now(),

  devotion_date date generated always as (
    (created_at at time zone 'Asia/Jakarta')::date
  ) stored,

  constraint devotions_book_length
    check (char_length(trim(book)) between 1 and 50),

  constraint devotions_chapter_positive
    check (chapter > 0),

  constraint devotions_verse_start_positive
    check (verse_start > 0),

  constraint devotions_verse_range
    check (
      verse_end is null
      or verse_end >= verse_start
    ),

  constraint devotions_reflection_length
    check (char_length(trim(reflection)) between 1 and 3000)
);

-- Mempercepat pengambilan feed harian.
create index devotions_daily_feed_idx
on public.devotions (devotion_date, created_at desc);

-- Mendukung pengambilan riwayat dan perhitungan streak.
create index devotions_user_date_idx
on public.devotions (user_id, devotion_date);

alter table public.devotions enable row level security;

revoke all on table public.devotions from anon, authenticated;

grant select on table public.devotions to authenticated;

-- Pengguna hanya boleh mengirim isi renungan.
-- Identitas, nama penulis, dan waktu ditentukan sistem.
grant insert (
  book,
  chapter,
  verse_start,
  verse_end,
  reflection
)
on public.devotions
to authenticated;

create policy "Members can read today's devotions and their own history"
on public.devotions
for select
to authenticated
using (
  devotion_date = (now() at time zone 'Asia/Jakarta')::date
  or user_id = (select auth.uid())
);

create policy "Members can publish their own devotions"
on public.devotions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

-- Ambil nama penulis dari profil ketika renungan diterbitkan.
create function public.set_devotion_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select display_name
  into new.author_name
  from public.profiles
  where id = new.user_id;

  if new.author_name is null then
    raise exception 'Profil penulis belum ditemukan.';
  end if;

  return new;
end;
$$;

revoke execute on function public.set_devotion_author()
from public, anon, authenticated;

create trigger before_devotion_insert
before insert on public.devotions
for each row
execute function public.set_devotion_author();

commit;