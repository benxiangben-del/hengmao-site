-- HENGMAO content_v2 production access policies
-- Run only AFTER docs/supabase-content-model-v2.sql has been reviewed and applied.
-- Before running: back up the current project and expose `content_v2` in
-- Supabase Dashboard > Project Settings > API > Exposed schemas.

begin;

create or replace function content_v2.is_content_staff()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'content_role') in ('admin', 'editor', 'reviewer'),
    false
  );
$$;

grant usage on schema content_v2 to anon, authenticated;
grant execute on function content_v2.is_content_staff() to anon, authenticated;
grant select on all tables in schema content_v2 to anon;
grant select, insert, update, delete on all tables in schema content_v2 to authenticated;

-- Every authenticated content staff member can work with drafts. RLS still
-- rejects authenticated accounts without an approved app_metadata role.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'product_categories', 'products', 'product_translations',
    'product_specifications', 'product_package_items', 'media_assets',
    'product_media', 'guides', 'guide_translations', 'product_guides',
    'product_documents', 'product_relations', 'content_placements'
  ]
  loop
    execute format(
      'create policy %I on content_v2.%I for all to authenticated using (content_v2.is_content_staff()) with check (content_v2.is_content_staff())',
      table_name || '_staff_all', table_name
    );
  end loop;
end;
$$;

-- Public website: only records that are both active and formally published.
create policy product_categories_public_read
on content_v2.product_categories for select to anon, authenticated
using (is_active = true);

create policy products_public_read
on content_v2.products for select to anon, authenticated
using (status = 'published');

create policy product_translations_public_read
on content_v2.product_translations for select to anon, authenticated
using (
  translation_status = 'published'
  and exists (
    select 1 from content_v2.products p
    where p.id = product_translations.product_id and p.status = 'published'
  )
);

create policy product_specifications_public_read
on content_v2.product_specifications for select to anon, authenticated
using (
  verification_status = 'approved'
  and exists (
    select 1 from content_v2.products p
    where p.id = product_specifications.product_id and p.status = 'published'
  )
);

create policy product_package_items_public_read
on content_v2.product_package_items for select to anon, authenticated
using (exists (
  select 1 from content_v2.products p
  where p.id = product_package_items.product_id and p.status = 'published'
));

create policy product_media_public_read
on content_v2.product_media for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from content_v2.products p
    where p.id = product_media.product_id and p.status = 'published'
  )
);

create policy media_assets_public_read
on content_v2.media_assets for select to anon, authenticated
using (
  rights_status = 'approved'
  and cleanup_status = 'active'
  and (
    exists (
      select 1
      from content_v2.product_media pm
      join content_v2.products p on p.id = pm.product_id
      where pm.media_asset_id = media_assets.id and pm.is_active = true and p.status = 'published'
    )
    or exists (
      select 1
      from content_v2.product_documents pd
      join content_v2.products p on p.id = pd.product_id
      where pd.media_asset_id = media_assets.id and pd.publication_status = 'published' and p.status = 'published'
    )
  )
);

create policy guides_public_read
on content_v2.guides for select to anon, authenticated
using (
  status = 'published'
  and technical_review_status = 'approved'
);

create policy guide_translations_public_read
on content_v2.guide_translations for select to anon, authenticated
using (
  translation_status = 'published'
  and exists (
    select 1 from content_v2.guides g
    where g.id = guide_translations.guide_id and g.status = 'published' and g.technical_review_status = 'approved'
  )
);

create policy product_guides_public_read
on content_v2.product_guides for select to anon, authenticated
using (
  exists (select 1 from content_v2.products p where p.id = product_guides.product_id and p.status = 'published')
  and exists (select 1 from content_v2.guides g where g.id = product_guides.guide_id and g.status = 'published')
);

create policy product_documents_public_read
on content_v2.product_documents for select to anon, authenticated
using (
  publication_status = 'published'
  and is_current = true
  and exists (select 1 from content_v2.products p where p.id = product_documents.product_id and p.status = 'published')
);

create policy product_relations_public_read
on content_v2.product_relations for select to anon, authenticated
using (
  is_active = true
  and exists (select 1 from content_v2.products p where p.id = product_relations.source_product_id and p.status = 'published')
  and exists (select 1 from content_v2.products p where p.id = product_relations.target_product_id and p.status = 'published')
);

create policy content_placements_public_read
on content_v2.content_placements for select to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and exists (select 1 from content_v2.products p where p.id = content_placements.product_id and p.status = 'published')
);

-- One public bucket is used for non-confidential product images, videos and
-- documents. Metadata controls whether URLs appear on the website, but anyone
-- who already knows a public object URL can open it. Never upload confidential
-- certificates, contracts, customer data or unreleased material to this bucket.
insert into storage.buckets (id, name, public)
values ('hengmao-content-v2', 'hengmao-content-v2', true)
on conflict (id) do update set public = excluded.public;

create policy hengmao_content_staff_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'hengmao-content-v2' and content_v2.is_content_staff());

create policy hengmao_content_staff_update
on storage.objects for update to authenticated
using (bucket_id = 'hengmao-content-v2' and content_v2.is_content_staff())
with check (bucket_id = 'hengmao-content-v2' and content_v2.is_content_staff());

create policy hengmao_content_staff_delete
on storage.objects for delete to authenticated
using (bucket_id = 'hengmao-content-v2' and content_v2.is_content_staff());

commit;

notify pgrst, 'reload schema';
