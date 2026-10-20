begin;

create table public.events (
  id integer generated always as identity primary key,
  title text not null,
  category text not null,
  image text not null,
  description text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

revoke all on table public.events from anon, authenticated;

grant select on table public.events to anon, authenticated;

create policy "Published events are publicly readable"
on public.events
for select
to anon, authenticated
using (is_published = true);

commit;