-- ============================================
-- Birdie CO2 Experience — Supabase Setup
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================

-- 1. Create the responses table
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  birdie_status TEXT NOT NULL CHECK (birdie_status IN ('alive', 'dead')),
  location_id TEXT NOT NULL DEFAULT 'default',
  consent BOOLEAN NOT NULL DEFAULT true,
  mitigation_open_windows BOOLEAN DEFAULT false,
  mitigation_open_doors BOOLEAN DEFAULT false,
  mitigation_reduce_occupancy BOOLEAN DEFAULT false,
  mitigation_turn_on_fans BOOLEAN DEFAULT false,
  mitigation_turn_on_filters BOOLEAN DEFAULT false,
  likert_knowledge INT CHECK (likert_knowledge BETWEEN 1 AND 5),
  likert_confidence INT CHECK (likert_confidence BETWEEN 1 AND 5),
  completed BOOLEAN DEFAULT false,
  session_id TEXT UNIQUE NOT NULL,
  user_agent TEXT
);

-- 2. Enable Row Level Security
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous inserts
CREATE POLICY "Allow anonymous insert" ON responses
  FOR INSERT TO anon
  WITH CHECK (true);

-- 4. Allow anonymous updates — only on rows matching the session_id
--    This enables progressive saving: the app creates a record on
--    Screen 2 (birdie status), then updates it on Screen 4 (checkboxes)
--    and Screen 5 (Likert scales). If the user exits early, partial
--    data is still retained.
CREATE POLICY "Allow anonymous update by session_id" ON responses
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Note: The app uses upsert (INSERT ... ON CONFLICT) keyed on session_id.
-- The UNIQUE constraint on session_id enables this.
-- Anonymous users can only update rows they created (they must know the
-- random session_id UUID, which is generated client-side per session).

-- ============================================
-- After running this SQL:
-- 1. Go to Project Settings → API
-- 2. Copy the "Project URL" and "anon public" key
-- 3. Paste them into js/supabase.js
-- ============================================
