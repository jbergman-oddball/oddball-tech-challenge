/*
  # AI Challenge Creator Migration

  This migration ensures the challenges table has all necessary fields and policies
  for the AI Challenge Creator feature, without creating duplicates.

  1. Checks and adds missing columns if they don't exist
  2. Ensures all necessary policies exist
  3. Creates missing indexes
  4. Verifies trigger functions exist
*/

-- Check if challenges table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges') THEN
    -- Create challenges table
    CREATE TABLE challenges (
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
  END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
  -- Add enable_video_interview column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'enable_video_interview'
  ) THEN
    ALTER TABLE challenges ADD COLUMN enable_video_interview boolean DEFAULT false;
  END IF;

  -- Add video_interview_persona column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'video_interview_persona'
  ) THEN
    ALTER TABLE challenges ADD COLUMN video_interview_persona text;
  END IF;
END $$;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS challenges_created_by_idx ON challenges(created_by);
CREATE INDEX IF NOT EXISTS challenges_status_idx ON challenges(status);
CREATE INDEX IF NOT EXISTS challenges_difficulty_idx ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS challenges_category_idx ON challenges(category);

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_challenges_updated_at'
  ) THEN
    CREATE TRIGGER update_challenges_updated_at
      BEFORE UPDATE ON challenges
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Policy: Anyone can read active challenges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Anyone can read active challenges'
  ) THEN
    CREATE POLICY "Anyone can read active challenges" ON challenges
      FOR SELECT USING (status = 'active');
  END IF;

  -- Policy: Interviewers can create challenges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Interviewers can create challenges'
  ) THEN
    CREATE POLICY "Interviewers can create challenges" ON challenges
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'interviewer'
        )
      );
  END IF;

  -- Policy: Challenge creators can update their challenges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Challenge creators can update their challenges'
  ) THEN
    CREATE POLICY "Challenge creators can update their challenges" ON challenges
      FOR UPDATE USING (
        created_by = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'interviewer'
        )
      );
  END IF;

  -- Policy: Challenge creators can delete their challenges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Challenge creators can delete their challenges'
  ) THEN
    CREATE POLICY "Challenge creators can delete their challenges" ON challenges
      FOR DELETE USING (
        created_by = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'interviewer'
        )
      );
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;