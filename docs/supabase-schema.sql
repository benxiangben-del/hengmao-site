create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text not null unique,
  category text not null,
  cover_url text,
  short_description text,
  description text,
  specs jsonb default '{}'::jsonb,
  features jsonb default '[]'::jsonb,
  video_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products for select
using (true);

drop policy if exists "Authenticated users can write products" on public.products;
create policy "Authenticated users can write products"
on public.products for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
using (true);

drop policy if exists "Authenticated users can write product images" on public.product_images;
create policy "Authenticated users can write product images"
on public.product_images for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Authenticated users can write site settings" on public.site_settings;
create policy "Authenticated users can write site settings"
on public.site_settings for all
to authenticated
using (true)
with check (true);

insert into public.site_settings (key, value)
values
  ('branding', '{"zhName":"上海恒猫机电","enName":"Shanghai Hengmao Machinery","zhSub":"洗车机与清洁配件供应商","enSub":"Car Washer and Cleaning Accessories Supplier"}'::jsonb),
  ('home', '{"heroTag":"专业清洁设备供应商","heroTitle":"洗车机与清洁配件解决方案","heroDesc":"上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品。"}'::jsonb),
  ('about', '{"title":"公司介绍","body":"上海恒猫机电专注于洗车机及清洁配件的展示与供应。"}'::jsonb),
  ('contact', '{"email":"sales@hengmao.com","phone":"+86-000-0000-0000","address":"中国上海","description":"欢迎联系上海恒猫机电获取产品资料和报价支持。"}'::jsonb)
on conflict (key) do nothing;

-- Storage:
-- 1. Create public buckets named product-images and product-videos in Supabase Storage.
-- 2. Public buckets can be read by public URLs returned from getPublicUrl.
-- 3. Keep uploads/deletes limited to authenticated users with Storage policies in the dashboard.
