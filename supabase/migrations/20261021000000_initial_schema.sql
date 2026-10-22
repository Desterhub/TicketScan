-- ==============================================================================
-- TicketScan Database Migration: Initial Schema & Row-Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_login_at TIMESTAMPTZ
);

-- Index for email lookups and active user status
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image')) NOT NULL,
  transport_mode TEXT CHECK (transport_mode IN ('train', 'flight', 'bus', 'unknown')) DEFAULT 'unknown',
  passenger_name TEXT,
  passenger_age INTEGER CHECK (passenger_age >= 0 AND passenger_age <= 125),
  booking_status TEXT CHECK (booking_status IN ('confirmed', 'waitlisted', 'rac', 'cancelled', 'unknown')) DEFAULT 'unknown',
  pnr_booking_id TEXT,
  boarding_place TEXT,
  destination_place TEXT,
  departure_datetime TIMESTAMPTZ,
  arrival_datetime TIMESTAMPTZ,
  carrier_name TEXT,
  seat_class_coach TEXT,
  raw_extraction_json JSONB,
  extraction_confidence NUMERIC(3,2) CHECK (extraction_confidence >= 0.00 AND extraction_confidence <= 1.00),
  tamper_risk_score NUMERIC(3,2) CHECK (tamper_risk_score >= 0.00 AND tamper_risk_score <= 1.00),
  tamper_signals JSONB DEFAULT '[]'::jsonb,
  manually_corrected BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance & dashboard queries
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_pnr ON public.tickets(pnr_booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_transport_mode ON public.tickets(transport_mode);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_status ON public.tickets(booking_status);
CREATE INDEX IF NOT EXISTS idx_tickets_tamper_score ON public.tickets(tamper_risk_score);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT CHECK (action IN (
    'upload',
    'extract',
    'edit_field',
    'delete_ticket',
    'admin_view',
    'export',
    'login',
    'failed_login',
    'password_change'
  )) NOT NULL,
  target_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_ticket ON public.audit_logs(target_ticket_id);

-- 5. AUTOMATIC updated_at TRIGGER FOR TICKETS
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tickets_updated_at ON public.tickets;
CREATE TRIGGER trigger_set_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 6. SECURITY DEFINER HELPER: Check if current caller is an active Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

-- 7. ENABLE ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR USERS TABLE
-- Users can read their own profile; Admins can read all profiles
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.users;
CREATE POLICY "Users can read own profile or admin can read all"
ON public.users
FOR SELECT
USING (
  auth.uid() = id OR public.is_admin()
);

-- Users can update their own profile (name/password); Admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile or admin" ON public.users;
CREATE POLICY "Users can update own profile or admin"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin()
);

-- Admins or signup process can insert users
DROP POLICY IF EXISTS "Admin or service role can insert users" ON public.users;
CREATE POLICY "Admin or service role can insert users"
ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id OR public.is_admin() OR auth.uid() IS NULL
);

-- 9. RLS POLICIES FOR TICKETS TABLE
-- Users read their own tickets; Admins can read all tickets
DROP POLICY IF EXISTS "Users view own tickets or admin views all" ON public.tickets;
CREATE POLICY "Users view own tickets or admin views all"
ON public.tickets
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- Users insert their own tickets; Admins can insert
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets"
ON public.tickets
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

-- Users can update their own tickets (e.g. manual corrections); Admins can update all
DROP POLICY IF EXISTS "Users can update own tickets or admin" ON public.tickets;
CREATE POLICY "Users can update own tickets or admin"
ON public.tickets
FOR UPDATE
USING (
  auth.uid() = user_id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

-- Users can delete their own tickets; Admins can delete all
DROP POLICY IF EXISTS "Users can delete own tickets or admin" ON public.tickets;
CREATE POLICY "Users can delete own tickets or admin"
ON public.tickets
FOR DELETE
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- 10. RLS POLICIES FOR AUDIT LOGS
-- Admins can view all audit logs; regular users can view their own
DROP POLICY IF EXISTS "Users view own audit logs or admin views all" ON public.audit_logs;
CREATE POLICY "Users view own audit logs or admin views all"
ON public.audit_logs
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- Any authenticated user or service can insert audit logs
DROP POLICY IF EXISTS "Authenticated users or system can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users or system can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR public.is_admin() OR auth.uid() IS NULL
);

-- 11. STORAGE BUCKET: tickets_vault (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tickets_vault',
  'tickets_vault',
  false,
  15728640, -- 15MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];

-- Storage RLS: Users can only upload and read files in their own folder (folder named by user_id)
DROP POLICY IF EXISTS "Allow user upload to their folder in tickets_vault" ON storage.objects;
CREATE POLICY "Allow user upload to their folder in tickets_vault"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tickets_vault' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Allow user read from their folder in tickets_vault" ON storage.objects;
CREATE POLICY "Allow user read from their folder in tickets_vault"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tickets_vault' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Allow user delete from their folder in tickets_vault" ON storage.objects;
CREATE POLICY "Allow user delete from their folder in tickets_vault"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tickets_vault' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
  )
);

-- 12. SEED DEFAULT ADMIN USER (Username: tirth | Password: 010205)
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'tirth@ticketscan.local',
  '$2b$10$ZJiU3FDQWjgV1KGbgaPfJ.0tJrJ0iGbxzzj0Z3ZwmK1xd3RNdaK3q',
  'tirth',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$10$ZJiU3FDQWjgV1KGbgaPfJ.0tJrJ0iGbxzzj0Z3ZwmK1xd3RNdaK3q',
  full_name = 'tirth',
  role = 'admin',
  is_active = true;

