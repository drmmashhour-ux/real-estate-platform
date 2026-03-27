-- Enable pgcrypto for gen_random_uuid if not already enabled
create extension if not exists pgcrypto;

-- ================================
-- ENUMS
-- ================================

do $$ begin
  create type "VerificationEntityType" as enum (
    'LISTING',
    'SELLER',
    'BUYER',
    'TENANT',
    'GUEST',
    'BROKER',
    'BOOKING',
    'OFFER',
    'RENTAL_APPLICATION',
    'MORTGAGE_FILE',
    'SELLER_DECLARATION'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "VerificationCaseStatus" as enum (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'needs_info',
    'escalated'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "TrustLevel" as enum (
    'low',
    'medium',
    'high',
    'verified'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "ReadinessLevel" as enum (
    'not_ready',
    'partial',
    'ready',
    'action_required'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "VerificationSignalCategory" as enum (
    'identity',
    'address',
    'media',
    'legal',
    'financial',
    'behavior',
    'fraud',
    'compliance',
    'quality'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "VerificationSeverity" as enum (
    'info',
    'low',
    'medium',
    'high',
    'critical'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "VerificationSignalStatus" as enum (
    'open',
    'accepted',
    'dismissed',
    'resolved'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "TrustProfileSubjectType" as enum (
    'user',
    'broker',
    'listing',
    'property_owner',
    'host'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "HumanReviewActionType" as enum (
    'approve',
    'reject',
    'request_info',
    'override_score',
    'dismiss_signal',
    'escalate',
    'assign'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "NextBestActionPriority" as enum (
    'low',
    'medium',
    'high',
    'urgent'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "NextBestActionActorType" as enum (
    'user',
    'broker',
    'admin',
    'legal',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "NextBestActionStatus" as enum (
    'pending',
    'completed',
    'dismissed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "MediaVerificationJobStatus" as enum (
    'queued',
    'processing',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "MediaVerificationType" as enum (
    'exterior',
    'interior',
    'street',
    'document',
    'id',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

-- ================================
-- TABLES
-- ================================

create table if not exists verification_cases (
  id uuid primary key default gen_random_uuid(),
  entity_type "VerificationEntityType" not null,
  entity_id text not null,
  status "VerificationCaseStatus" not null default 'pending',
  overall_score integer,
  trust_level "TrustLevel",
  readiness_level "ReadinessLevel",
  summary jsonb,
  score_breakdown jsonb,
  explanation text,
  created_by text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists verification_signals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  signal_code text not null,
  signal_name text not null,
  category "VerificationSignalCategory" not null,
  severity "VerificationSeverity" not null,
  status "VerificationSignalStatus" not null default 'open',
  score_impact integer not null default 0,
  confidence numeric(5,4),
  evidence jsonb,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_rule_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  rule_code text not null,
  rule_version text not null default '1',
  passed boolean not null default false,
  score_delta integer not null default 0,
  confidence numeric(5,4),
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists trust_profiles (
  id uuid primary key default gen_random_uuid(),
  subject_type "TrustProfileSubjectType" not null,
  subject_id text not null,
  trust_score integer not null default 0,
  fraud_score integer not null default 0,
  completion_score integer not null default 0,
  quality_score integer not null default 0,
  legal_score integer not null default 0,
  badges jsonb,
  last_case_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_trust_profiles_subject unique (subject_type, subject_id)
);

create table if not exists human_review_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  reviewer_id text not null,
  action_type "HumanReviewActionType" not null,
  notes text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists next_best_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  action_code text not null,
  title text not null,
  description text not null,
  priority "NextBestActionPriority" not null default 'medium',
  actor_type "NextBestActionActorType" not null,
  status "NextBestActionStatus" not null default 'pending',
  due_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_verification_jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  case_id uuid references verification_cases(id) on delete set null,
  job_status "MediaVerificationJobStatus" not null default 'queued',
  media_type "MediaVerificationType" not null,
  file_path text not null,
  extracted_metadata jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entity_verification_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  linked_entity_type text not null,
  linked_entity_id text not null,
  relation_type text not null,
  created_at timestamptz not null default now()
);

alter table verification_cases add column if not exists score_breakdown jsonb;

-- FK for Prisma relation TrustProfile.lastCase (optional; safe if already present)
do $$ begin
  alter table trust_profiles
    add constraint trust_profiles_last_case_id_fkey
    foreign key (last_case_id) references verification_cases(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- ================================
-- INDEXES
-- ================================

create index if not exists idx_verification_cases_entity
  on verification_cases(entity_type, entity_id);

create index if not exists idx_verification_cases_status
  on verification_cases(status);

create index if not exists idx_verification_cases_trust_level
  on verification_cases(trust_level);

create index if not exists idx_verification_cases_readiness_level
  on verification_cases(readiness_level);

create index if not exists idx_verification_cases_assigned_to
  on verification_cases(assigned_to);

create index if not exists idx_verification_cases_updated_at
  on verification_cases(updated_at desc);

create index if not exists idx_verification_signals_case_id
  on verification_signals(case_id);

create index if not exists idx_verification_signals_signal_code
  on verification_signals(signal_code);

create index if not exists idx_verification_signals_category
  on verification_signals(category);

create index if not exists idx_verification_signals_severity
  on verification_signals(severity);

create index if not exists idx_verification_signals_status
  on verification_signals(status);

create index if not exists idx_verification_rule_results_case_id
  on verification_rule_results(case_id);

create index if not exists idx_verification_rule_results_rule_code
  on verification_rule_results(rule_code);

create index if not exists idx_trust_profiles_subject
  on trust_profiles(subject_type, subject_id);

create index if not exists idx_trust_profiles_last_case_id
  on trust_profiles(last_case_id);

create index if not exists idx_human_review_actions_case_id
  on human_review_actions(case_id);

create index if not exists idx_human_review_actions_reviewer_id
  on human_review_actions(reviewer_id);

create index if not exists idx_human_review_actions_action_type
  on human_review_actions(action_type);

create index if not exists idx_next_best_actions_case_id
  on next_best_actions(case_id);

create index if not exists idx_next_best_actions_status
  on next_best_actions(status);

create index if not exists idx_next_best_actions_priority
  on next_best_actions(priority);

create index if not exists idx_next_best_actions_actor_type
  on next_best_actions(actor_type);

create index if not exists idx_media_verification_jobs_listing_id
  on media_verification_jobs(listing_id);

create index if not exists idx_media_verification_jobs_case_id
  on media_verification_jobs(case_id);

create index if not exists idx_media_verification_jobs_status
  on media_verification_jobs(job_status);

create index if not exists idx_media_verification_jobs_media_type
  on media_verification_jobs(media_type);

create index if not exists idx_entity_verification_links_case_id
  on entity_verification_links(case_id);

create index if not exists idx_entity_verification_links_entity
  on entity_verification_links(linked_entity_type, linked_entity_id);

create index if not exists idx_entity_verification_links_relation_type
  on entity_verification_links(relation_type);

-- ================================
-- UPDATED_AT TRIGGERS
-- ================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_verification_cases_updated_at on verification_cases;
create trigger trg_verification_cases_updated_at
before update on verification_cases
for each row
execute function set_updated_at();

drop trigger if exists trg_verification_signals_updated_at on verification_signals;
create trigger trg_verification_signals_updated_at
before update on verification_signals
for each row
execute function set_updated_at();

drop trigger if exists trg_trust_profiles_updated_at on trust_profiles;
create trigger trg_trust_profiles_updated_at
before update on trust_profiles
for each row
execute function set_updated_at();

drop trigger if exists trg_next_best_actions_updated_at on next_best_actions;
create trigger trg_next_best_actions_updated_at
before update on next_best_actions
for each row
execute function set_updated_at();

drop trigger if exists trg_media_verification_jobs_updated_at on media_verification_jobs;
create trigger trg_media_verification_jobs_updated_at
before update on media_verification_jobs
for each row
execute function set_updated_at();
