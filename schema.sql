-- SUPABASE SCHEMA SETUP FOR CYBERSAATHI

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  preferred_language text DEFAULT 'hi-IN',
  created_at timestamp DEFAULT now()
);

CREATE TABLE scam_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  scammer_phone text,
  amount_lost numeric,
  description text,
  scam_type text,
  status text DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

CREATE TABLE quiz_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  quiz_topic text,
  score int,
  total_questions int,
  completed_at timestamp DEFAULT now()
);

CREATE TABLE link_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  url_scanned text,
  verdict text,
  ai_explanation text,
  scanned_at timestamp DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_scans ENABLE ROW LEVEL SECURITY;

-- Allow anon operations since the app relies on device_id for identity
CREATE POLICY "Allow anon all on users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on scam_reports" ON scam_reports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on quiz_scores" ON quiz_scores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on link_scans" ON link_scans FOR ALL TO anon USING (true) WITH CHECK (true);
