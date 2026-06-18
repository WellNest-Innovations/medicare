-- ================================================================
-- MEDPLATFORM: COMPLETE DATABASE SCHEMA
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ──────────────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE vital_type         AS ENUM ('HEART_RATE','BLOOD_PRESSURE','BLOOD_GLUCOSE','OXYGEN_SATURATION','BODY_TEMPERATURE');
CREATE TYPE record_category    AS ENUM ('LAB_RESULT','CLINICAL_NOTE','DIAGNOSIS','PRESCRIPTION','ALLERGY');
CREATE TYPE appointment_status AS ENUM ('PENDING','CONFIRMED','COMPLETED','CANCELLED');
CREATE TYPE audit_action       AS ENUM ('LOGIN','LOGOUT','RECORD_VIEW','RECORD_CREATE','VITALS_SUBMIT','APPOINTMENT_CREATE','APPOINTMENT_UPDATE','ROLE_ASSIGN','BREAK_GLASS_ACCESS','UNAUTHORIZED_ATTEMPT','SOS_TRIGGERED');

-- ── PROFILES ───────────────────────────────────────────────────
CREATE TABLE public.profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role            user_role   NOT NULL DEFAULT 'PATIENT',
    full_name       TEXT        NOT NULL,
    date_of_birth   DATE,
    phone_number    TEXT,
    blood_type      TEXT        CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN')),
    known_allergies TEXT[]      DEFAULT '{}',
    emergency_contact JSONB     DEFAULT '{}',
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCTOR–PATIENT ASSIGNMENTS ─────────────────────────────────
CREATE TABLE public.doctor_patient_assignments (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID        NOT NULL REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_doctor_patient UNIQUE (doctor_id, patient_id)
);

-- ── CONSENT GRANTS ─────────────────────────────────────────────
CREATE TABLE public.consent_grants (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grantee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scope       TEXT[]      NOT NULL DEFAULT '{}',
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ,
    CONSTRAINT no_self_consent  CHECK (patient_id <> grantee_id),
    CONSTRAINT valid_expiry     CHECK (expires_at > granted_at)
);

-- ── MEDICAL RECORDS (append-only) ─────────────────────────────
CREATE TABLE public.medical_records (
    id          UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id  UUID             NOT NULL REFERENCES public.profiles(id),
    authored_by UUID             NOT NULL REFERENCES public.profiles(id),
    category    record_category  NOT NULL,
    title       TEXT             NOT NULL,
    content     TEXT             NOT NULL,
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION block_record_edits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Medical records are immutable. Append a new record instead.';
END;
$$;
CREATE TRIGGER trg_no_record_edits
    BEFORE UPDATE OR DELETE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION block_record_edits();

-- ── VITALS LOGS ────────────────────────────────────────────────
CREATE TABLE public.vitals_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID        NOT NULL REFERENCES public.profiles(id),
    vital_type      vital_type  NOT NULL,
    value_primary   NUMERIC(8,2) NOT NULL,
    value_secondary NUMERIC(8,2),
    unit            TEXT        NOT NULL,
    measured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_offline_sync BOOLEAN     NOT NULL DEFAULT FALSE,
    notes           TEXT
);

-- ── APPOINTMENTS ───────────────────────────────────────────────
CREATE TABLE public.appointments (
    id              UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID               NOT NULL REFERENCES public.profiles(id),
    doctor_id       UUID               NOT NULL REFERENCES public.profiles(id),
    status          appointment_status NOT NULL DEFAULT 'PENDING',
    scheduled_at    TIMESTAMPTZ        NOT NULL,
    duration_mins   SMALLINT           NOT NULL DEFAULT 30,
    chief_complaint TEXT               NOT NULL,
    location        TEXT               NOT NULL DEFAULT 'TELEHEALTH',
    meeting_url     TEXT,
    doctor_notes    TEXT,
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS (immutable) ─────────────────────────────────────
CREATE TABLE public.audit_logs (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID         REFERENCES auth.users(id),
    actor_role      user_role,
    action          audit_action NOT NULL,
    target_table    TEXT,
    target_id       UUID,
    patient_context UUID         REFERENCES public.profiles(id),
    ip_address      TEXT,
    metadata        JSONB        DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION block_audit_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable.';
END;
$$;
CREATE TRIGGER trg_no_audit_update BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION block_audit_changes();
CREATE TRIGGER trg_no_audit_delete BEFORE DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION block_audit_changes();

-- ── INDEXES ────────────────────────────────────────────────────
CREATE INDEX idx_profiles_role       ON public.profiles(role);
CREATE INDEX idx_dpa_doctor          ON public.doctor_patient_assignments(doctor_id)  WHERE is_active = TRUE;
CREATE INDEX idx_dpa_patient         ON public.doctor_patient_assignments(patient_id) WHERE is_active = TRUE;
CREATE INDEX idx_records_patient     ON public.medical_records(patient_id);
CREATE INDEX idx_records_author      ON public.medical_records(authored_by);
CREATE INDEX idx_vitals_patient_type ON public.vitals_logs(patient_id, vital_type, measured_at DESC);
CREATE INDEX idx_appts_patient       ON public.appointments(patient_id, scheduled_at DESC);
CREATE INDEX idx_appts_doctor        ON public.appointments(doctor_id,  scheduled_at DESC);
CREATE INDEX idx_audit_actor         ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_created       ON public.audit_logs(created_at DESC);

-- ── UPDATED_AT TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated_at     BEFORE UPDATE ON public.profiles     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        'PATIENT'
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────
ALTER TABLE public.profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_grants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                  ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_my_patient(p_patient_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.doctor_patient_assignments
        WHERE doctor_id = auth.uid() AND patient_id = p_patient_id AND is_active = TRUE
    );
$$;

-- PROFILES policies
CREATE POLICY "own profile"              ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin reads all profiles" ON public.profiles FOR SELECT USING (get_my_role() = 'ADMIN');
CREATE POLICY "doctor reads patient"     ON public.profiles FOR SELECT USING (get_my_role() = 'DOCTOR' AND is_my_patient(id));
CREATE POLICY "update own profile"       ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "insert on signup"         ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- MEDICAL RECORDS policies (patients read-only; doctors append for assigned patients)
CREATE POLICY "patient reads own records"  ON public.medical_records FOR SELECT USING (patient_id = auth.uid() AND get_my_role() = 'PATIENT');
CREATE POLICY "doctor reads assigned"      ON public.medical_records FOR SELECT USING (get_my_role() = 'DOCTOR' AND is_my_patient(patient_id));
CREATE POLICY "doctor appends records"     ON public.medical_records FOR INSERT WITH CHECK (get_my_role() = 'DOCTOR' AND authored_by = auth.uid() AND is_my_patient(patient_id));

-- VITALS policies
CREATE POLICY "patient owns vitals"   ON public.vitals_logs FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "patient logs vitals"   ON public.vitals_logs FOR INSERT WITH CHECK (patient_id = auth.uid() AND get_my_role() = 'PATIENT');
CREATE POLICY "doctor reads vitals"   ON public.vitals_logs FOR SELECT USING (get_my_role() = 'DOCTOR' AND is_my_patient(patient_id));

-- APPOINTMENTS policies
CREATE POLICY "patient reads appts"   ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "patient creates appts" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid() AND get_my_role() = 'PATIENT');
CREATE POLICY "patient cancels appts" ON public.appointments FOR UPDATE USING (patient_id = auth.uid()) WITH CHECK (status = 'CANCELLED');
CREATE POLICY "doctor reads schedule" ON public.appointments FOR SELECT USING (doctor_id = auth.uid() AND get_my_role() = 'DOCTOR');
CREATE POLICY "doctor updates appts"  ON public.appointments FOR UPDATE USING (doctor_id = auth.uid() AND get_my_role() = 'DOCTOR');
CREATE POLICY "admin reads all appts" ON public.appointments FOR SELECT USING (get_my_role() = 'ADMIN');

-- AUDIT LOGS policies (admin read; backend service_role writes)
CREATE POLICY "admin reads audit" ON public.audit_logs FOR SELECT USING (get_my_role() = 'ADMIN');

-- ASSIGNMENTS policies
CREATE POLICY "doctor sees assignments"  ON public.doctor_patient_assignments FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "patient sees assignments" ON public.doctor_patient_assignments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "admin manages assignments" ON public.doctor_patient_assignments FOR ALL USING (get_my_role() = 'ADMIN') WITH CHECK (get_my_role() = 'ADMIN');

-- CONSENT policies
CREATE POLICY "patient manages consent" ON public.consent_grants FOR ALL USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "grantee reads consent"   ON public.consent_grants FOR SELECT USING (grantee_id = auth.uid());

-- ================================================================
-- SCHEMA COMPLETE ✅
-- ================================================================
