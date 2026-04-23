-- Host-written guest instructions on BNHub Supabase `bookings`.
-- Guests see this field only after payment (enforced in platform API).
-- Run in Supabase SQL editor after `supabase-listings.sql`.

alter table public.bookings add column if not exists instructions text;

comment on column public.bookings.instructions is 'Host notes: location, entry, rules — visible to guest via API only when booking is paid or completed.';
