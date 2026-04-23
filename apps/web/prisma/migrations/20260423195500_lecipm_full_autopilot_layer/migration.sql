-- LECIPM Full Autopilot Layer v1 (additive)

CREATE TABLE IF NOT EXISTS lecipm_full_autopilot_domain_configs (
    domain_id VARCHAR(64) PRIMARY KEY,
    mode VARCHAR(40) NOT NULL DEFAULT 'ASSIST',
    kill_switch VARCHAR(16) NOT NULL DEFAULT 'ON',
    last_changed_by_id VARCHAR(36),
    last_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lecipm_full_autopilot_global_state (
    id VARCHAR(32) PRIMARY KEY,
    paused_all BOOLEAN NOT NULL DEFAULT FALSE,
    paused_by_id VARCHAR(36),
    paused_reason TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lecipm_full_autopilot_executions (
    id TEXT PRIMARY KEY,
    platform_action_id TEXT UNIQUE,
    domain VARCHAR(64) NOT NULL,
    action_type VARCHAR(160) NOT NULL,
    source_system VARCHAR(80) NOT NULL,
    policy_rule_id VARCHAR(96) NOT NULL,
    decision_outcome VARCHAR(32) NOT NULL,
    risk_level VARCHAR(16) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
    explanation TEXT NOT NULL,
    explanation_detail JSONB,
    candidate_payload JSONB,
    executed_payload JSONB,
    outcome_window VARCHAR(32),
    baseline_before_json JSONB,
    result_after_json JSONB,
    outcome_delta_json JSONB,
    outcome_confidence DOUBLE PRECISION,
    rollback_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    rolled_back_at TIMESTAMP,
    rollback_reason TEXT,
    rollback_actor_id VARCHAR(36),
    actor_user_id VARCHAR(36),
    actor_type VARCHAR(24) NOT NULL DEFAULT 'system',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lecipm_full_autopilot_exec_domain_created
  ON lecipm_full_autopilot_executions (domain, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lecipm_full_autopilot_exec_decision_created
  ON lecipm_full_autopilot_executions (decision_outcome, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lecipm_full_autopilot_exec_source_created
  ON lecipm_full_autopilot_executions (source_system, created_at DESC);
