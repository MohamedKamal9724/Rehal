-- RIHAL (ريحال) — Neon PostgreSQL Production Schema
-- Project: RIHAL | Branch: production | Target: Neon Serverless Postgres
-- This schema supports both the B2B Operator Portal and B2C Traveler Portal.

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    arabic_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Traveler', 'Owner', 'Admin', 'Operations', 'Sales Agent', 'Viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    password_hash TEXT,
    password_salt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migration columns for existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;


CREATE TABLE IF NOT EXISTS company_members (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Operations', 'Sales Agent', 'Viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    file_number TEXT NOT NULL,
    traveler_name TEXT NOT NULL,
    traveler_email TEXT,
    traveler_phone TEXT,
    trip_code TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    start_date DATE,
    duration_days INTEGER NOT NULL DEFAULT 8,
    itinerary_json JSONB,
    vouchers_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    supplier_type TEXT NOT NULL,
    city TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rates (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    supplier_type TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    cost_price NUMERIC NOT NULL,
    selling_price NUMERIC NOT NULL,
    valid_from DATE,
    valid_to DATE,
    metadata_json JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    traveler_name TEXT NOT NULL,
    traveler_email TEXT,
    traveler_phone TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    currency TEXT NOT NULL DEFAULT 'USD',
    total_price NUMERIC NOT NULL DEFAULT 0,
    margin_percent NUMERIC NOT NULL DEFAULT 20,
    version INTEGER NOT NULL DEFAULT 1,
    days_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    traveler_name TEXT NOT NULL,
    traveler_email TEXT,
    traveler_phone TEXT,
    raw_text TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    requirements_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid tenant lookups & traveler trip code verification
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_code ON trips(trip_code);
CREATE INDEX IF NOT EXISTS idx_rates_company ON rates(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_company ON inquiries(company_id);

-- Onboarding drafts persistence table
CREATE TABLE IF NOT EXISTS onboarding_drafts (
    key TEXT PRIMARY KEY,
    draft_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

