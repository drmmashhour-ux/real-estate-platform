-- LECIPM — sales pipeline CRM (run in Supabase SQL editor or any Postgres)
-- Stages (use `stage` column): lead | contacted | demo_booked | demo_done | trial | paid

create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  company text,
  stage text not null default 'lead',
  source text,
  notes text,
  last_contacted_at timestamp,
  created_at timestamp default now()
);

create index if not exists crm_leads_stage_idx on crm_leads (stage);
create index if not exists crm_leads_email_idx on crm_leads (email);

create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references crm_leads(id) on delete cascade,
  type text,
  note text,
  created_at timestamp default now()
);

create index if not exists crm_activities_lead_id_idx on crm_activities (lead_id);
