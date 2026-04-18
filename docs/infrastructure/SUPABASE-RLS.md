# Supabase Row Level Security (RLS)

## Important: Prisma vs RLS

- **Prisma** connects with `DATABASE_URL`, typically a **database role** that can **bypass RLS** (e.g. `postgres` or a service role). **Application code** must enforce who can read/write which rows.
- **RLS** in Supabase protects data accessed via **Supabase PostgREST** or **client SDK** using the **anon** or **authenticated** keys when policies are defined.

## Service role & Storage

`SUPABASE_SERVICE_ROLE_KEY` **bypasses RLS**. Use only on the server (`getSupabaseAdmin()`), **after** you have verified the user is allowed to perform the action (upload path, delete, etc.).

## Starter policy themes (SQL — apply in Supabase SQL editor)

Policies depend on your actual schema. Typical patterns:

1. **`auth.users`** — managed by Supabase Auth.
2. **Application tables** — if exposed via PostgREST, use `auth.uid()` in policies to tie rows to the Supabase user id (may need mapping to your Prisma `User.id` if you sync identities).

Example pattern (illustrative only — adjust table/column names):

```sql
-- Enable RLS
ALTER TABLE public.some_table ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own rows
CREATE POLICY "read_own" ON public.some_table
  FOR SELECT USING (auth.uid()::text = user_id);
```

**LECIPM** uses Prisma for most business data; review each table that is also exposed through Supabase APIs. Do **not** grant broad anon access to PII.

## Storage buckets

Create buckets: `listings`, `user-avatars`, `documents` (see `lib/supabase/buckets.ts`). Configure **public vs private** per bucket; use signed URLs for private objects where applicable.
