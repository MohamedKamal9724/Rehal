-- migrations/001_multi_tenant_rls.sql
-- Production Multi-Tenant Schema with Row-Level Security (RLS),
-- Immutable Rate Versioning, Quote Line Snapshots & Append-Only Audit Logging.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Workspaces & Multi-Tenant Memberships
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ministry_license_number TEXT,
  tax_id TEXT,
  default_currency CHAR(3) NOT NULL DEFAULT 'USD',
  minimum_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  ai_credits_limit INTEGER NOT NULL DEFAULT 250,
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'sales_agent', 'operations', 'viewer')),
  PRIMARY KEY (user_id, workspace_id)
);

-- 2. Immutable Contract Rate Versioning (Never UPDATE price in place)
CREATE TABLE IF NOT EXISTS rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_id UUID NOT NULL REFERENCES rates(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  currency CHAR(3) NOT NULL,
  net_unit_cost NUMERIC(12,2) NOT NULL CHECK (net_unit_cost >= 0),
  single_supplement NUMERIC(12,2) NOT NULL DEFAULT 0,
  nationality_tier TEXT NOT NULL CHECK (nationality_tier IN ('Foreign', 'Arab', 'Egyptian', 'All')),
  occupancy_type TEXT NOT NULL DEFAULT 'double',
  max_vehicle_pax INTEGER,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rate_id, version_number),
  CHECK (valid_to >= valid_from)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_rates_current_version'
  ) THEN
    ALTER TABLE rates
      ADD CONSTRAINT fk_rates_current_version
      FOREIGN KEY (current_version_id) REFERENCES rate_versions(id);
  END IF;
END $$;

-- 3. Quotes & Deterministic Line Snapshots
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  adults INTEGER NOT NULL CHECK (adults >= 1),
  children INTEGER NOT NULL DEFAULT 0,
  target_margin_percent NUMERIC(5,2) NOT NULL,
  fx_snapshot JSONB NOT NULL, -- Immutable snapshot of exchange rates at quote lock
  total_cost_egp NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_sell_egp NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft',
  public_token_hash CHAR(64) UNIQUE,
  token_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  valid_until DATE,
  requires_admin_approval BOOLEAN NOT NULL DEFAULT FALSE,
  admin_approved_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rate_version_id UUID REFERENCES rate_versions(id), -- Ties line to immutable historical rate
  service_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_person', 'group')),
  cost_egp NUMERIC(14,2) NOT NULL,
  price_egp NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'OK'
);

-- 4. Append-Only Audit Log (Insert-only grants, zero UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  payload_diff JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;

-- 5. Enforce Row-Level Security (RLS) Across All Tenant Tables
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_rates ON rates;
CREATE POLICY tenant_isolation_rates ON rates
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

DROP POLICY IF EXISTS tenant_isolation_rate_versions ON rate_versions;
CREATE POLICY tenant_isolation_rate_versions ON rate_versions
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

DROP POLICY IF EXISTS tenant_isolation_quotes ON quotes;
CREATE POLICY tenant_isolation_quotes ON quotes
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

DROP POLICY IF EXISTS tenant_isolation_quote_lines ON quote_lines;
CREATE POLICY tenant_isolation_quote_lines ON quote_lines
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

DROP POLICY IF EXISTS tenant_isolation_audit_log ON audit_log;
CREATE POLICY tenant_isolation_audit_log ON audit_log
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

COMMIT;
