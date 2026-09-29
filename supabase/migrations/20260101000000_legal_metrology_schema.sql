-- Legal Metrology Online Verification System Schema
-- SIH Problem Statement 26036
-- Department of Consumer Affairs, Government of India

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users and Organizations
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BUSINESS', 'LMO', 'GATC', 'CONTROLLER', 'STATE_ADMIN', 'CENTRAL_ADMIN')),
    phone TEXT,
    address TEXT,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    designation TEXT,
    badge_number TEXT,
    gatc_code TEXT,
    jurisdiction_office TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Instruments Registry (The Core Domain Object: One Instrument -> One Digital Identity)
CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY, -- e.g. LM-DL-2026-001290
    category TEXT NOT NULL,
    category_name TEXT NOT NULL,
    accuracy_class TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    model_approval_number TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    capacity TEXT NOT NULL,
    scale_interval TEXT NOT NULL,
    purchase_date DATE,
    installation_date DATE,
    owner_id UUID REFERENCES users(id),
    owner_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    installation_address TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    status TEXT NOT NULL CHECK (status IN ('REGISTERED', 'UNDER_VERIFICATION', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'RE_VERIFICATION_PENDING')),
    last_verification_date DATE,
    next_verification_due_date DATE NOT NULL,
    current_certificate_id TEXT,
    current_stamp_id TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Applications
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY, -- e.g. APP-2026-00101
    instrument_id TEXT REFERENCES instruments(id) ON DELETE RESTRICT,
    applicant_id UUID REFERENCES users(id),
    applicant_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT NOT NULL,
    preferred_date DATE,
    assigned_to_type TEXT CHECK (assigned_to_type IN ('LMO', 'GATC')),
    assigned_to_id UUID REFERENCES users(id),
    assigned_to_name TEXT,
    assignment_reason TEXT,
    scheduled_date DATE,
    scheduled_time_slot TEXT,
    fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fee_status TEXT DEFAULT 'UNPAID',
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    correction_remarks TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Application Documents
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Field Inspections
CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY, -- e.g. INSP-2026-00814
    application_id TEXT REFERENCES applications(id),
    instrument_id TEXT REFERENCES instruments(id),
    inspector_id UUID REFERENCES users(id),
    inspector_name TEXT NOT NULL,
    inspector_role TEXT NOT NULL,
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    location TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_readings JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    inspector_remarks TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL', 'ADJUSTMENT_REQUIRED', 'RETEST_REQUIRED')),
    adjustment_details TEXT,
    officer_signature_confirmation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Stampings
CREATE TABLE IF NOT EXISTS stampings (
    id TEXT PRIMARY KEY, -- e.g. STAMP-DL-26-0842
    instrument_id TEXT REFERENCES instruments(id),
    application_id TEXT REFERENCES applications(id),
    inspection_id TEXT REFERENCES inspections(id),
    officer_id UUID REFERENCES users(id),
    officer_name TEXT NOT NULL,
    stamp_type TEXT NOT NULL,
    quarter_and_year TEXT NOT NULL,
    stamped_at TIMESTAMPTZ DEFAULT NOW(),
    location TEXT NOT NULL,
    remarks TEXT
);

-- 7. Verification Certificates (Schedule IX Compliance)
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY, -- e.g. CERT-2026-08912
    certificate_number TEXT UNIQUE NOT NULL,
    instrument_id TEXT REFERENCES instruments(id),
    application_id TEXT REFERENCES applications(id),
    inspection_id TEXT REFERENCES inspections(id),
    stamp_id TEXT REFERENCES stampings(id),
    issued_to_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    category TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    model_approval_number TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    capacity TEXT NOT NULL,
    scale_interval TEXT NOT NULL,
    accuracy_class TEXT NOT NULL,
    verification_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    validity_months INT NOT NULL DEFAULT 12,
    issuing_authority TEXT NOT NULL,
    issuing_officer_name TEXT NOT NULL,
    issuing_officer_designation TEXT NOT NULL,
    issuing_officer_badge_or_gatc TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'EXPIRED', 'REVOKED', 'SUPERSEDED')),
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    sha256_hash TEXT NOT NULL,
    qr_payload_url TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Statutory Fee Rules
CREATE TABLE IF NOT EXISTS fee_rules (
    id TEXT PRIMARY KEY,
    jurisdiction TEXT NOT NULL,
    category TEXT NOT NULL,
    capacity_range TEXT NOT NULL,
    statutory_fee NUMERIC(10, 2) NOT NULL,
    user_charge NUMERIC(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    rule_citation TEXT NOT NULL
);

-- 9. Enforcement Cases
CREATE TABLE IF NOT EXISTS enforcement_cases (
    id TEXT PRIMARY KEY, -- e.g. ENF-2026-0031
    instrument_id TEXT REFERENCES instruments(id),
    business_name TEXT NOT NULL,
    violator_name TEXT NOT NULL,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    offense_category TEXT NOT NULL,
    act_section TEXT NOT NULL,
    officer_id UUID REFERENCES users(id),
    officer_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'SEIZED', 'COMPOUNDED', 'CLOSED')),
    action_taken TEXT NOT NULL,
    penalty_amount NUMERIC(10, 2),
    evidence_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_instruments_owner ON instruments(owner_id);
CREATE INDEX IF NOT EXISTS idx_instruments_status ON instruments(status);
CREATE INDEX IF NOT EXISTS idx_instruments_state_district ON instruments(state, district);
CREATE INDEX IF NOT EXISTS idx_applications_instrument ON applications(instrument_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_certificates_instrument ON certificates(instrument_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_num ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
