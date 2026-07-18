-- HENGMAO bilingual content model v2
-- Version: 1.0 (2026-07-18)
-- Status: STRUCTURE REVIEW ONLY
--
-- This file creates an isolated `content_v2` schema so it can be reviewed or
-- validated without overwriting the current public.products/product_images
-- tables. Do not expose this schema to the public API or use it in production
-- until migrations, role policies, backups, and rollback tests are approved.

begin;

create extension if not exists pgcrypto;
create schema if not exists content_v2;

create or replace function content_v2.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table content_v2.product_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_zh text not null,
  name_en text not null,
  description_zh text,
  description_en text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table content_v2.products (
  id uuid primary key default gen_random_uuid(),
  model text not null unique check (length(btrim(model)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid not null references content_v2.product_categories(id),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'discontinued', 'upcoming')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table content_v2.product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  locale text not null check (locale in ('zh-CN', 'en')),
  name text,
  short_description text,
  description text,
  features jsonb not null default '[]'::jsonb
    check (jsonb_typeof(features) = 'array'),
  applications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(applications) = 'array'),
  seo_title text,
  seo_description text,
  translation_status text not null default 'draft'
    check (translation_status in ('draft', 'review', 'published')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, locale),
  check (
    translation_status <> 'published'
    or (
      length(btrim(coalesce(name, ''))) > 0
      and length(btrim(coalesce(short_description, ''))) > 0
      and length(btrim(coalesce(description, ''))) > 0
      and length(btrim(coalesce(seo_title, ''))) > 0
      and length(btrim(coalesce(seo_description, ''))) > 0
      and reviewed_by is not null
      and reviewed_at is not null
    )
  )
);

create table content_v2.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  spec_key text not null check (spec_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  group_key text not null
    check (group_key in ('performance', 'electrical', 'dimensions', 'connection', 'package', 'other')),
  label_zh text not null,
  label_en text not null,
  value_text text,
  value_number numeric,
  unit_code text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_key_spec boolean not null default false,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'review', 'approved', 'rejected')),
  source_reference text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, spec_key),
  check (value_text is not null or value_number is not null),
  check (
    verification_status <> 'approved'
    or (
      length(btrim(coalesce(source_reference, ''))) > 0
      and reviewed_by is not null
      and reviewed_at is not null
    )
  )
);

create table content_v2.product_package_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  item_key text not null check (item_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  quantity numeric not null check (quantity > 0),
  unit_code text not null,
  name_zh text not null,
  name_en text not null,
  notes_zh text,
  notes_en text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, item_key)
);

create table content_v2.media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique check (asset_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null check (kind in ('image', 'video', 'document')),
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint check (file_size is null or file_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  checksum text,
  rights_status text not null default 'pending'
    check (rights_status in ('pending', 'approved', 'restricted', 'rejected')),
  rights_source text,
  cleanup_status text not null default 'active'
    check (cleanup_status in ('active', 'orphaned', 'pending_delete')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (storage_bucket, storage_path)
);

create table content_v2.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  media_asset_id uuid not null references content_v2.media_assets(id),
  role text not null check (role in (
    'cover',
    'gallery',
    'detail',
    'application',
    'package',
    'video-demo',
    'video-installation',
    'video-usage',
    'video-maintenance',
    'poster'
  )),
  locale text check (locale is null or locale in ('zh-CN', 'en')),
  alt_zh text,
  alt_en text,
  caption_zh text,
  caption_en text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, media_asset_id, role, locale)
);

create unique index product_media_one_active_cover
on content_v2.product_media(product_id)
where role = 'cover' and is_active = true;

create table content_v2.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  guide_type text not null check (guide_type in (
    'installation',
    'usage',
    'safety',
    'maintenance',
    'troubleshooting',
    'faq'
  )),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  version text not null default '1.0',
  effective_at timestamptz,
  technical_review_status text not null default 'unverified'
    check (technical_review_status in ('unverified', 'review', 'approved', 'changes_requested')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    technical_review_status <> 'approved'
    or (reviewed_by is not null and reviewed_at is not null)
  )
);

create table content_v2.guide_translations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references content_v2.guides(id) on delete cascade,
  locale text not null check (locale in ('zh-CN', 'en')),
  title text,
  summary text,
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  body text,
  seo_title text,
  seo_description text,
  translation_status text not null default 'draft'
    check (translation_status in ('draft', 'review', 'published')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (guide_id, locale),
  check (
    translation_status <> 'published'
    or (
      length(btrim(coalesce(title, ''))) > 0
      and reviewed_by is not null
      and reviewed_at is not null
    )
  )
);

create table content_v2.product_guides (
  product_id uuid not null references content_v2.products(id) on delete cascade,
  guide_id uuid not null references content_v2.guides(id) on delete cascade,
  relationship text not null default 'dedicated'
    check (relationship in ('dedicated', 'compatible', 'general')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  primary key (product_id, guide_id)
);

create table content_v2.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  media_asset_id uuid not null references content_v2.media_assets(id),
  document_type text not null check (document_type in (
    'manual',
    'spec-sheet',
    'installation-drawing',
    'certificate',
    'warranty',
    'other'
  )),
  locale text not null check (locale in ('zh-CN', 'en', 'multilingual')),
  title text not null,
  version text not null,
  effective_at date,
  is_current boolean not null default true,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'review', 'published', 'archived')),
  applicable_models text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, media_asset_id, version)
);

create table content_v2.product_relations (
  id uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references content_v2.products(id) on delete cascade,
  target_product_id uuid not null references content_v2.products(id) on delete cascade,
  relation_type text not null check (relation_type in ('accessory', 'compatible', 'replacement', 'related')),
  note_zh text,
  note_en text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_product_id, target_product_id, relation_type),
  check (source_product_id <> target_product_id)
);

create table content_v2.content_placements (
  id uuid primary key default gen_random_uuid(),
  placement_key text not null check (placement_key in ('home-hero', 'home-featured')),
  product_id uuid not null references content_v2.products(id) on delete cascade,
  media_asset_id uuid references content_v2.media_assets(id),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (placement_key, product_id),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index products_category_status_idx
  on content_v2.products(category_id, status, sort_order);
create index product_translations_locale_status_idx
  on content_v2.product_translations(locale, translation_status);
create index product_specifications_product_sort_idx
  on content_v2.product_specifications(product_id, group_key, sort_order);
create index product_package_items_product_sort_idx
  on content_v2.product_package_items(product_id, sort_order);
create index product_media_product_sort_idx
  on content_v2.product_media(product_id, role, sort_order);
create index product_guides_product_sort_idx
  on content_v2.product_guides(product_id, sort_order);
create index content_placements_key_sort_idx
  on content_v2.content_placements(placement_key, is_active, sort_order);

create trigger product_categories_set_updated_at
before update on content_v2.product_categories
for each row execute function content_v2.set_updated_at();

create trigger products_set_updated_at
before update on content_v2.products
for each row execute function content_v2.set_updated_at();

create trigger product_translations_set_updated_at
before update on content_v2.product_translations
for each row execute function content_v2.set_updated_at();

create trigger product_specifications_set_updated_at
before update on content_v2.product_specifications
for each row execute function content_v2.set_updated_at();

create trigger product_package_items_set_updated_at
before update on content_v2.product_package_items
for each row execute function content_v2.set_updated_at();

create trigger media_assets_set_updated_at
before update on content_v2.media_assets
for each row execute function content_v2.set_updated_at();

create trigger product_media_set_updated_at
before update on content_v2.product_media
for each row execute function content_v2.set_updated_at();

create trigger guides_set_updated_at
before update on content_v2.guides
for each row execute function content_v2.set_updated_at();

create trigger guide_translations_set_updated_at
before update on content_v2.guide_translations
for each row execute function content_v2.set_updated_at();

create trigger product_documents_set_updated_at
before update on content_v2.product_documents
for each row execute function content_v2.set_updated_at();

create trigger product_relations_set_updated_at
before update on content_v2.product_relations
for each row execute function content_v2.set_updated_at();

create trigger content_placements_set_updated_at
before update on content_v2.content_placements
for each row execute function content_v2.set_updated_at();

alter table content_v2.product_categories enable row level security;
alter table content_v2.products enable row level security;
alter table content_v2.product_translations enable row level security;
alter table content_v2.product_specifications enable row level security;
alter table content_v2.product_package_items enable row level security;
alter table content_v2.media_assets enable row level security;
alter table content_v2.product_media enable row level security;
alter table content_v2.guides enable row level security;
alter table content_v2.guide_translations enable row level security;
alter table content_v2.product_guides enable row level security;
alter table content_v2.product_documents enable row level security;
alter table content_v2.product_relations enable row level security;
alter table content_v2.content_placements enable row level security;

-- Deliberately no grants or permissive policies are created in this review file.
-- A later production migration must add admin/editor/reviewer roles, public
-- published-only reads, Storage policies, migration transforms, and rollback.

insert into content_v2.product_categories
  (key, slug, name_zh, name_en, sort_order)
values
  ('portable-washer', 'portable-washers', '便携式清洗设备', 'Portable Washers', 10),
  ('trolley-washer', 'trolley-washers', '推车式清洗设备', 'Trolley Washers', 20),
  ('spray-gun', 'spray-guns', '水枪', 'Spray Guns', 30),
  ('high-pressure-hose', 'high-pressure-hoses', '高压管', 'High-pressure Hoses', 40),
  ('steel-wire-hose', 'steel-wire-hoses', '钢丝管', 'Steel-wire Hoses', 50),
  ('accessory', 'accessories', '其他配件', 'Other Accessories', 60)
on conflict (key) do nothing;

commit;
