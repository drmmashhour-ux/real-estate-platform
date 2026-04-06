-- BNHub soft launch: feedback, lightweight events, host interest leads.
-- Apply in Supabase SQL editor. Service role (apps/web API) inserts; no anon writes.

create table if not exists public.bnhub_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  email text,
  screen text,
  booking_id text,
  created_at timestamptz not null default now()
);

create index if not exists bnhub_feedback_created_at_idx on public.bnhub_feedback (created_at desc);

create table if not exists public.bnhub_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bnhub_events_name_created_idx on public.bnhub_events (event_name, created_at desc);

create table if not exists public.bnhub_host_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  property_type text,
  location text,
  created_at timestamptz not null default now()
);

create index if not exists bnhub_host_leads_created_idx on public.bnhub_host_leads (created_at desc);

comment on table public.bnhub_feedback is 'BNHub mobile/web feedback; platform API only.';
comment on table public.bnhub_events is 'Lightweight product events (no PII in metadata by contract).';
comment on table public.bnhub_host_leads is 'Early host supply capture; not full CMS.';

alter table public.bnhub_feedback enable row level security;
alter table public.bnhub_events enable row level security;
alter table public.bnhub_host_leads enable row level security;

-- No policies for anon/authenticated users — inserts via service role only.
