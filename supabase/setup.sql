create extension if not exists "pgcrypto";

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.site_content (id, content)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can write site content" on public.site_content;
create policy "Authenticated can write site content"
on public.site_content
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read media bucket" on storage.objects;
create policy "Public can read media bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "Authenticated can upload media bucket" on storage.objects;
create policy "Authenticated can upload media bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-images');

drop policy if exists "Authenticated can update media bucket" on storage.objects;
create policy "Authenticated can update media bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-images')
with check (bucket_id = 'site-images');

drop policy if exists "Authenticated can delete media bucket" on storage.objects;
create policy "Authenticated can delete media bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-images');
