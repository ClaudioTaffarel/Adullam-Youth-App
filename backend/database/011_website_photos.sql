begin;

create table public.website_photos (
  slot text primary key check (
    slot in (
      'hero_1', 'hero_2', 'hero_3',
      'hero_4', 'hero_5', 'hero_6',
      'about'
    )
  ),
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.website_photos enable row level security;

revoke all on table public.website_photos
from public, anon, authenticated;

grant select on table public.website_photos
to anon, authenticated;

grant select, update on table public.website_photos
to service_role;

create policy "Website photos are publicly readable"
on public.website_photos
for select
to anon, authenticated
using (true);

insert into public.website_photos (slot, image_url)
values
  ('hero_1', '/images/memories/1.webp'),
  ('hero_2', '/images/memories/2.webp'),
  ('hero_3', '/images/memories/3.webp'),
  ('hero_4', '/images/memories/4.webp'),
  ('hero_5', '/images/memories/5.webp'),
  ('hero_6', '/images/memories/6.webp'),
  ('about', '/images/memories/1.webp');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'website-photos',
  'website-photos',
  true,
  5242880,
  array['image/webp']::text[]
);

commit;