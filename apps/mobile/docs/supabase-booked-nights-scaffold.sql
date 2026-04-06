-- =============================================================================
-- FUTURE HARDENING (scaffold only — not wired to create_guest_booking yet)
-- =============================================================================
-- Current source of truth for booking creation + overlap: `public.create_guest_booking`
--   (see supabase-rpc-create-guest-booking.sql). This table is a planned second layer:
--   one row per calendar night, unique (listing_id, night_date), optional exclusion
--   constraint for strongest DB-level double-book prevention once populated by trigger/RPC.
-- Do not drop JSON `bookings.dates` until migration is complete and tested.

create table if not exists public.booked_nights (
  listing_id uuid not null references public.listings (id) on delete cascade,
  night_date date not null,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, night_date)
);

create index if not exists booked_nights_booking_id_idx on public.booked_nights (booking_id);

comment on table public.booked_nights is 'Future: normalized nights; unique(listing_id, night_date). Populate from RPC/trigger; then optional exclusion constraint.';

alter table public.booked_nights enable row level security;
-- No anon policies until migration — service role / triggers only.
