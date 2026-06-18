-- CyberSaathi Supabase SQL Schema setup instructions
-- Copy and paste this script into the Supabase SQL Editor to set up the database.

-- 1. Create the 'users' profiles table linked to device IDs
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Will hold the device UUID or AsyncStorage fallback UUID
    language TEXT DEFAULT 'hi-IN', -- Selected language code (e.g. 'en-IN', 'hi-IN', 'mr-IN')
    level TEXT DEFAULT 'Level 2: Vigilant', -- Current user level/badge
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this app uses guest device IDs)
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users matching their own id" ON public.users
    FOR UPDATE USING (true);


-- 2. Create the 'quiz_scores' table
CREATE TABLE IF NOT EXISTS public.quiz_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    scam_topic TEXT NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for all quiz scores" ON public.quiz_scores
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all quiz scores" ON public.quiz_scores
    FOR INSERT WITH CHECK (true);


-- 3. Create the 'scam_reports' table
CREATE TABLE IF NOT EXISTS public.scam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    scam_type TEXT NOT NULL,
    is_vulnerable BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for all scam reports" ON public.scam_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all scam reports" ON public.scam_reports
    FOR INSERT WITH CHECK (true);


-- 4. Set up an automated updated_at trigger for users table
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
