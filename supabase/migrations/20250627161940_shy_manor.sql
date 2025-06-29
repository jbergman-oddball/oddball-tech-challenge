/*
  # Create sessions table for candidate challenge sessions

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `candidate_name` (text, not null)
      - `candidate_email` (text, not null)
      - `challenge_id` (uuid, references challenges.id)
      - `status` (text, check constraint)
      - `start_time` (timestamp with timezone, optional)
      - `end_time` (timestamp with timezone, optional)
      - `score` (integer, optional, 0-100)
      - `submitted_code` (text, optional)
      - `time_spent` (integer, optional, in minutes)
      - `created_by` (uuid, references profiles.id)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `sessions` table
    - Add policy for interviewers to manage sessions they created
    - Add policy for candidates to read/update their own sessions
    - Add policy for session creators to view all session data

  3. Indexes
    - Index on challenge_id for faster queries
    - Index on candidate_email for candidate access
    - Index on created_by for interviewer queries
    - Index on status for filtering
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_name text NOT NULL,
  candidate_email text NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'in-progress', 'completed', 'expired')) NOT NULL DEFAULT 'pending',
  start_time timestamptz,
  end_time timestamptz,
  score integer CHECK (score >= 0 AND score <= 100),
  submitted_code text,
  time_spent integer, -- in minutes
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Interviewers can manage their sessions" ON sessions
  FOR ALL USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

CREATE POLICY "Candidates can access their own sessions" ON sessions
  FOR SELECT USING (
    candidate_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'candidate'
    )
  );

CREATE POLICY "Candidates can update their own sessions" ON sessions
  FOR UPDATE USING (
    candidate_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'candidate'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS sessions_challenge_id_idx ON sessions(challenge_id);
CREATE INDEX IF NOT EXISTS sessions_candidate_email_idx ON sessions(candidate_email);
CREATE INDEX IF NOT EXISTS sessions_created_by_idx ON sessions(created_by);
CREATE INDEX IF NOT EXISTS sessions_status_idx ON sessions(status);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();