/*
  # Create invitations table for user invitations

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `email` (text, not null) - Email of the person being invited
      - `role` (text, not null) - Role to assign (interviewer/candidate)
      - `challenge_id` (uuid, optional) - Specific challenge for candidates
      - `status` (text, not null) - pending, accepted, expired
      - `expires_at` (timestamptz, not null) - When the invitation expires
      - `created_by` (uuid, not null) - Who sent the invitation
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `invitations` table
    - Add policy for interviewers to manage their invitations
    - Add policy for anyone to read pending invitations (for acceptance)

  3. Indexes
    - Index on email for quick lookups
    - Index on status for filtering
    - Index on created_by for user's invitations
    - Index on expires_at for cleanup
*/

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text CHECK (role IN ('interviewer', 'candidate')) NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  status text CHECK (status IN ('pending', 'accepted', 'expired')) NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Interviewers can manage their invitations" ON invitations
  FOR ALL USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

CREATE POLICY "Anyone can read pending invitations" ON invitations
  FOR SELECT USING (status = 'pending');

CREATE POLICY "Anyone can update invitation status" ON invitations
  FOR UPDATE USING (status = 'pending')
  WITH CHECK (status IN ('accepted', 'expired'));

-- Create indexes
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_status_idx ON invitations(status);
CREATE INDEX IF NOT EXISTS invitations_created_by_idx ON invitations(created_by);
CREATE INDEX IF NOT EXISTS invitations_expires_at_idx ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS invitations_challenge_id_idx ON invitations(challenge_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function to run daily (this would be set up in Supabase dashboard)
-- SELECT cron.schedule('expire-invitations', '0 0 * * *', 'SELECT expire_old_invitations();');