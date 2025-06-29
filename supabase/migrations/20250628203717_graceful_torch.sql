/*
  # Tavus.io Video Call Integration

  1. New Tables
    - `tavus_conversations`
      - `id` (uuid, primary key)
      - `persona_id` (text) - Tavus persona identifier
      - `session_id` (uuid, optional) - Link to interview session
      - `challenge_id` (uuid, optional) - Link to challenge
      - `participant_name` (text)
      - `participant_email` (text)
      - `status` (text) - pending, active, completed, failed
      - `start_time` (timestamptz, optional)
      - `end_time` (timestamptz, optional)
      - `duration_minutes` (integer, optional)
      - `conversation_summary` (text, optional)
      - `key_insights` (text[], optional)
      - `technical_assessment` (jsonb, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Table Updates
    - Add video interview fields to `challenges` table

  3. Security
    - Enable RLS on `tavus_conversations` table
    - Add policies for conversation access
*/

-- Add video interview fields to challenges table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'enable_video_interview'
  ) THEN
    ALTER TABLE challenges ADD COLUMN enable_video_interview boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'video_interview_persona'
  ) THEN
    ALTER TABLE challenges ADD COLUMN video_interview_persona text;
  END IF;
END $$;

-- Create tavus_conversations table
CREATE TABLE IF NOT EXISTS tavus_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id text NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  participant_name text NOT NULL,
  participant_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  conversation_summary text,
  key_insights text[] DEFAULT '{}',
  technical_assessment jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE tavus_conversations 
ADD CONSTRAINT tavus_conversations_status_check 
CHECK (status IN ('pending', 'active', 'completed', 'failed'));

-- Add indexes
CREATE INDEX IF NOT EXISTS tavus_conversations_persona_id_idx ON tavus_conversations(persona_id);
CREATE INDEX IF NOT EXISTS tavus_conversations_session_id_idx ON tavus_conversations(session_id);
CREATE INDEX IF NOT EXISTS tavus_conversations_challenge_id_idx ON tavus_conversations(challenge_id);
CREATE INDEX IF NOT EXISTS tavus_conversations_participant_email_idx ON tavus_conversations(participant_email);
CREATE INDEX IF NOT EXISTS tavus_conversations_status_idx ON tavus_conversations(status);
CREATE INDEX IF NOT EXISTS tavus_conversations_created_at_idx ON tavus_conversations(created_at);

-- Enable RLS
ALTER TABLE tavus_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tavus_conversations
CREATE POLICY "Interviewers can manage all conversations"
  ON tavus_conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'interviewer'
    )
  );

CREATE POLICY "Participants can read their own conversations"
  ON tavus_conversations
  FOR SELECT
  TO authenticated
  USING (
    participant_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert conversations"
  ON tavus_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update trigger for tavus_conversations
CREATE OR REPLACE FUNCTION update_tavus_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tavus_conversations_updated_at
  BEFORE UPDATE ON tavus_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_tavus_conversations_updated_at();

-- Add comment
COMMENT ON TABLE tavus_conversations IS 'Stores Tavus.io video conversation data and analytics';