/*
  # Create usage_events table for tracking user activity

  1. New Tables
    - `usage_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `event_type` (text, not null)
      - `event_data` (jsonb, optional)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `usage_events` table
    - Add policy for users to insert their own events
    - Add policy for interviewers to read all events (for reporting)
    - Add policy for users to read their own events

  3. Indexes
    - Index on user_id for faster queries
    - Index on event_type for filtering
    - Index on created_at for time-based queries
*/

-- Create usage_events table
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own events" ON usage_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own events" ON usage_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Interviewers can read all events" ON usage_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'interviewer'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS usage_events_user_id_idx ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS usage_events_event_type_idx ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events(created_at);