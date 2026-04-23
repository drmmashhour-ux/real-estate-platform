-- Optional ownership on BNHub bookings (Supabase Auth user id). Nullable for guest-only bookings.
alter table public.bookings add column if not exists user_id uuid;

comment on column public.bookings.user_id is 'Supabase Auth user id when booked while signed in; NULL for pure guest bookings.';
