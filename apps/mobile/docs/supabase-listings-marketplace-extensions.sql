-- Optional marketplace fields for BNHub listings (run after `supabase-listings.sql`).
-- Enables map pins, radius search on the platform API, and future Stripe Connect payouts.

-- Structured browse (`GET /api/bnhub/public/listings?country=&city=`) — use full names matching the mobile picker (e.g. Canada, Montreal).
alter table public.listings add column if not exists country text;

comment on column public.listings.country is 'Country label for structured guest browse filters (e.g. Canada, USA).';

-- Geo (WGS84) — nullable until hosts set coordinates or you geocode cities.
alter table public.listings add column if not exists latitude double precision;
alter table public.listings add column if not exists longitude double precision;

comment on column public.listings.latitude is 'Optional listing latitude for map search (platform API filters).';
comment on column public.listings.longitude is 'Optional listing longitude for map search (platform API filters).';

-- Stripe Connect: host account to receive destination charges / transfers (future wiring).
alter table public.listings add column if not exists stripe_connect_account_id text;

comment on column public.listings.stripe_connect_account_id is 'Stripe Connect account id (acct_…) for this listing payout; set by platform after onboarding.';

create index if not exists listings_lat_lng_idx on public.listings (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Guest property page + filters (optional; platform API retries if columns are missing).
alter table public.listings add column if not exists amenities jsonb default '[]'::jsonb;
alter table public.listings add column if not exists star_rating numeric;
alter table public.listings add column if not exists max_guests int;
alter table public.listings add column if not exists house_rules text;
alter table public.listings add column if not exists check_in_instructions text;
