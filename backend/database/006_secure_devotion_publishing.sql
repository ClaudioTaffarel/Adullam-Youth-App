begin;

-- Cabut izin INSERT pada tingkat tabel.
revoke insert on table public.devotions
from public, anon, authenticated;

-- Cabut juga izin INSERT per kolom.
-- Izin kolom terpisah dari izin tabel.
revoke insert (
  id,
  user_id,
  author_name,
  book,
  chapter,
  verse_start,
  verse_end,
  reflection,
  created_at,
  devotion_date
)
on public.devotions
from public, anon, authenticated;

drop policy if exists
  "Members can publish their own devotions"
on public.devotions;

-- Backend menggunakan role service_role.
grant select on table public.devotions to service_role;

grant insert (
  user_id,
  book,
  chapter,
  verse_start,
  verse_end,
  reflection
)
on public.devotions
to service_role;

commit;