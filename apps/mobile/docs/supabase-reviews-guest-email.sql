-- Guest-attributed reviews (no auth): applied by server via service role.
-- Run after supabase-listings.sql

alter table public.reviews add column if not exists guest_email text;

-- One review per listing per guest email (MVP anti-spam). Drop if you allow multiple stays later.
create unique index if not exists reviews_one_guest_per_listing
  on public.reviews (listing_id, lower(trim(guest_email)))
  where guest_email is not null and length(trim(guest_email)) > 0;
