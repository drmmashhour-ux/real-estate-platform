-- BNHub host experience: in-app notifications, per-booking chat, optional payout columns.
-- Run in Supabase SQL editor (service role / owner).

create extension if not exists "pgcrypto";

-- Host inbox keyed by Supabase Auth user id (matches listings.host_user_id).
create table if not exists public.bnhub_host_notifications (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null,
  type text not null default 'system',
  title text not null,
  message text,
  booking_id uuid references public.bookings (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bnhub_host_notifications_host_created_idx
  on public.bnhub_host_notifications (host_user_id, created_at desc);

create index if not exists bnhub_host_notifications_host_unread_idx
  on public.bnhub_host_notifications (host_user_id)
  where read_at is null;

comment on table public.bnhub_host_notifications is 'BNHub mobile/web host alerts (bookings, payments, payouts).';

-- Per-booking thread for Supabase bookings (parallel to Prisma BookingMessage).
create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_messages_booking_created_idx
  on public.booking_messages (booking_id, created_at);

comment on table public.booking_messages is 'Host/guest chat for public.bookings rows; sender_user_id is Supabase Auth sub.';

-- Optional payout tracking (API fills when known; safe no-ops if unused).
alter table public.bookings add column if not exists payout_status text;
alter table public.bookings add column if not exists payout_at timestamptz;
alter table public.bookings add column if not exists host_estimated_payout_cents int;

comment on column public.bookings.payout_status is 'e.g. pending | scheduled | paid | n/a';
comment on column public.bookings.host_estimated_payout_cents is 'Optional estimate after platform fee; not legal/tax advice.';

-- Listing check-in (guest sees after payment via API; host edits in listing tools).
alter table public.listings add column if not exists access_type text;

comment on column public.listings.access_type is 'e.g. lockbox | smart_lock | meet_host | other';
