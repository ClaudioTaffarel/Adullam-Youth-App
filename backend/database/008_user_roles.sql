begin;

create table public.user_roles (
  user_id uuid primary key
    references auth.users(id) on delete cascade,

  role text not null default 'member'
    check (role in ('member', 'admin')),

  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Browser hanya boleh membaca role sendiri.
revoke all on table public.user_roles
from public, anon, authenticated;

grant select on table public.user_roles
to authenticated;

create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

commit;