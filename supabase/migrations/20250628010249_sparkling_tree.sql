/*
  # Create user messages table for admin communication

  1. New Tables
    - `user_messages`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, references profiles.id)
      - `to_user_id` (uuid, references profiles.id)
      - `subject` (text)
      - `message` (text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_messages` table
    - Add policies for users to read their own messages
    - Add policies for interviewers to send messages to any user
    - Add policies for users to mark messages as read

  3. Indexes
    - Index on from_user_id for efficient sender queries
    - Index on to_user_id for efficient recipient queries
    - Index on is_read for unread message queries
    - Index on created_at for chronological ordering
*/

-- Create user_messages table
CREATE TABLE IF NOT EXISTS user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_messages_from_user_id_idx ON user_messages(from_user_id);
CREATE INDEX IF NOT EXISTS user_messages_to_user_id_idx ON user_messages(to_user_id);
CREATE INDEX IF NOT EXISTS user_messages_is_read_idx ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS user_messages_created_at_idx ON user_messages(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_messages_updated_at
  BEFORE UPDATE ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_messages_updated_at();

-- RLS Policies

-- Users can read messages sent to them
CREATE POLICY "Users can read messages sent to them"
  ON user_messages
  FOR SELECT
  TO authenticated
  USING (to_user_id = auth.uid());

-- Users can read messages they sent
CREATE POLICY "Users can read messages they sent"
  ON user_messages
  FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid());

-- Interviewers can send messages to any user
CREATE POLICY "Interviewers can send messages"
  ON user_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

-- Users can send messages to interviewers (for replies)
CREATE POLICY "Users can reply to interviewers"
  ON user_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = to_user_id AND role = 'interviewer'
    )
  );

-- Users can update read status of messages sent to them
CREATE POLICY "Users can mark their messages as read"
  ON user_messages
  FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Interviewers can update any message (for admin purposes)
CREATE POLICY "Interviewers can update any message"
  ON user_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );