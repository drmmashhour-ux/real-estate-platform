-- Run in Supabase SQL editor (adjust RLS for your app).
-- Guest BNHub mobile uses `listings` + `bookings`; web checkout + webhooks use the service role.
-- After this file, apply in order:
--   1) `supabase-rpc-create-guest-booking.sql` — **only** supported booking creation path (see apps/web create-guest-booking).
--   2) `supabase-reviews-guest-email.sql` — guest reviews via POST /api/reviews/create.
--   3) Optional: `supabase-booked-nights-scaffold.sql` — future DB-level night locking (not wired yet).

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text,
  price_per_night numeric not null check (price_per_night >= 0),
  created_at timestamptz not null default now(),
  -- Optional: link to platform host identity for future earnings dashboards (nullable until wired).
  host_user_id uuid
);

alter table public.listings add column if not exists created_at timestamptz not null default now();
alter table public.listings add column if not exists host_user_id uuid;
-- Optional hero image (HTTPS URL; future: Supabase Storage or CDN).
alter table public.listings add column if not exists cover_image_url text;

-- Extra gallery rows (optional; app falls back to cover only).
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_id_idx on public.listing_images (listing_id);

alter table public.listing_images enable row level security;
drop policy if exists "listing_images_select_public" on public.listing_images;
create policy "listing_images_select_public"
  on public.listing_images for select
  using (true);

-- Reviews foundation (read public; writes later with auth).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_listing_id_idx on public.reviews (listing_id);

alter table public.reviews enable row level security;
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (true);
-- TODO: INSERT policy when review submission ships (auth or signed token).

-- If the table already existed without created_at:
-- (handled by add column if not exists above)

-- Example: allow public read for soft-launch guest browse (tighten when auth ships).
alter table public.listings enable row level security;

drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public"
  on public.listings for select
  using (true);

-- Bookings (guest inserts for dev — tighten RLS when auth ships)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  dates jsonb not null,
  total_price numeric not null check (total_price >= 0),
  guest_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lifecycle: pending | processing | paid | canceled | completed (completed = post-stay ops, optional)
  status text not null default 'pending',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text
);

alter table public.bookings add column if not exists guest_email text;
alter table public.bookings add column if not exists status text not null default 'pending';
alter table public.bookings add column if not exists stripe_checkout_session_id text;
alter table public.bookings add column if not exists stripe_payment_intent_id text;
alter table public.bookings add column if not exists updated_at timestamptz not null default now();

create index if not exists bookings_listing_id_idx on public.bookings (listing_id);
create index if not exists bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

-- Transaction-safe booking creation (recommended): run `supabase-rpc-create-guest-booking.sql`
-- so `apps/web` uses `create_guest_booking` RPC instead of non-atomic read-check-insert.

-- TODO(security): Tighten before production:
--   - INSERT/SELECT scoped by auth.uid() or device-bound token when you add auth.
--   - For minimal anon exposure, prefer a VIEW exposing only id, listing_id, dates, status, total_price for guests
--     and keep guest_email / Stripe ids for service role only.
--   - Add DB-level overlap prevention (e.g. trigger or exclusion) if mobile race conditions become an issue.
drop policy if exists "bookings_insert_guest" on public.bookings;
create policy "bookings_insert_guest"
  on public.bookings for insert
  with check (true);

drop policy if exists "bookings_select_guest" on public.bookings;
create policy "bookings_select_guest"
  on public.bookings for select
  using (true);
