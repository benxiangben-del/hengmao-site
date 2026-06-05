# Supabase setup for hengmao-site

This project now uses Supabase as the only live content backend for the public site and `/admin.html`.

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

Open Supabase SQL Editor and run:

```sql
-- See docs/supabase-schema.sql
```

The schema creates:

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
