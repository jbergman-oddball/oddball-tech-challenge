/*
  # Create challenges table for coding challenges

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `difficulty` (text, check constraint)
      - `points` (integer, not null)
      - `time_limit` (integer, not null, in minutes)
      - `category` (text, not null)
      - `starter_code` (text, optional)
      - `test_cases` (text array, not null)
      - `created_by` (uuid, references profiles.id)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)
      - `status` (text, check constraint)

  2. Security
    - Enable RLS on `challenges` table
    - Add policy for authenticated users to read active challenges
    - Add policy for interviewers to create/update/delete challenges
    - Add policy for challenge creators to manage their own challenges

  3. Indexes
    - Index on created_by for faster queries
    - Index on status for filtering
    - Index on difficulty and category for filtering
*/

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) NOT NULL,
  points integer NOT NULL,
  time_limit integer NOT NULL, -- in minutes
  category text NOT NULL,
  starter_code text,
  test_cases text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text CHECK (status IN ('draft', 'active', 'archived')) NOT NULL DEFAULT 'active'
);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active challenges" ON challenges
  FOR SELECT USING (status = 'active');

CREATE POLICY "Interviewers can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

CREATE POLICY "Challenge creators can update their challenges" ON challenges
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

CREATE POLICY "Challenge creators can delete their challenges" ON challenges
  FOR DELETE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS challenges_created_by_idx ON challenges(created_by);
CREATE INDEX IF NOT EXISTS challenges_status_idx ON challenges(status);
CREATE INDEX IF NOT EXISTS challenges_difficulty_idx ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS challenges_category_idx ON challenges(category);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();