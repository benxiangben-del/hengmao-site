# Supabase setup for hengmao-site

The repository contains a Supabase-backed admin prototype, but the currently
approved public preview still reads local demo content. Supabase is not yet the
only live content source for the redesigned public site.

Two schema documents now exist:

- `docs/supabase-schema.sql`: legacy single-language admin prototype.
- `docs/supabase-content-model-v2.sql`: isolated bilingual v2 structure-review
  draft in the `content_v2` schema.

Do not run the v2 draft against production as a migration. The next backend
phase must add a reviewed migration, RLS roles, Storage policies, validation,
and rollback instructions.

## Environment variables

Create a local `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Add the same variables in Vercel and Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only use the anon key in this frontend project. Do not use the service role key.

## Database

For the legacy admin prototype only, the existing reference is:

```sql
-- See docs/supabase-schema.sql
```

The legacy schema creates:

- `products`
- `product_images`
- `site_settings`

It also enables RLS and adds public read policies plus authenticated write policies.

## Storage

Create two public buckets:

- `product-images`
- `product-videos`

Uploads are performed from `/admin.html` after Supabase Auth login. Public display URLs are generated with `getPublicUrl`.

## Auth

Create an admin user in Supabase Dashboard:

Authentication -> Users -> Add user

Use that email and password to log in at `/admin.html`.

The old `admin/admin123` local demo login has been removed.

## Approved bilingual model

The field contract is defined in:

- `docs/06-content-model.md`
- `docs/content-inventory/product-record-template.md`
- `docs/content-schema/product-record-v1.schema.json`
- `docs/supabase-content-model-v2.sql`
