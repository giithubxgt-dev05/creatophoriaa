-- ══════════════════════════════════════════════════════════════════════
-- CREATOPHORIA STUDIO — SUPABASE DATABASE SCHEMA
-- Project Reference: izckruhjcmrxyfpuzxyo
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/izckruhjcmrxyfpuzxyo/sql/new
-- ══════════════════════════════════════════════════════════════════════

-- 1. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    service TEXT NOT NULL,
    budget TEXT DEFAULT 'Flexible',
    timeline TEXT DEFAULT 'Flexible',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_discussion', 'booked', 'archived')),
    notes TEXT DEFAULT '',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for Query Performance & Analytics
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_service ON public.leads (service);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_leads_updated ON public.leads;
CREATE TRIGGER on_leads_updated
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Allow prospective clients (anon & authenticated) to submit project inquiries
DROP POLICY IF EXISTS "Allow public insert to leads" ON public.leads;
CREATE POLICY "Allow public insert to leads"
    ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow backend / service role to view, update, and manage all leads
DROP POLICY IF EXISTS "Allow service_role full management" ON public.leads;
CREATE POLICY "Allow service_role full management"
    ON public.leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
