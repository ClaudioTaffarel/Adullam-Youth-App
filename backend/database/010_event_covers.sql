begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-covers',
  'event-covers',
  true,
  5242880,
  array['image/webp']::text[]
);

commit;