-- Account-linked reviews (optional). Guest reviews still use guest_email + server validation.
alter table public.reviews add column if not exists reviewer_user_id uuid;

create index if not exists reviews_reviewer_user_id_idx on public.reviews (reviewer_user_id);
