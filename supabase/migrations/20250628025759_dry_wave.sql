/*
  # Fix Admin Access and RLS Policies

  1. Security Updates
    - Fix RLS policies to prevent admin lockout
    - Ensure proper role management
    - Add safeguards against losing all admin access

  2. Policy Updates
    - Recreate all policies with proper ordering
    - Fix conflicts and ensure proper access control
    - Add admin lockout prevention
*/

-- First, let's check and fix any data inconsistencies
-- Ensure all existing interviewers maintain their role
UPDATE profiles 
SET role = 'interviewer', updated_at = now()
WHERE role = 'interviewer' OR id IN (
  SELECT DISTINCT created_by 
  FROM challenges 
  WHERE created_by IS NOT NULL
);

-- Drop all existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Interviewers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Interviewers can update user roles" ON profiles;
DROP POLICY IF EXISTS "Interviewers can delete users" ON profiles;

-- Create new, properly ordered policies for profiles

-- 1. Allow users to read their own profile (highest priority)
CREATE POLICY "01_users_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Allow interviewers to read all profiles
CREATE POLICY "02_interviewers_read_all_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

-- 3. Allow profile creation (for new signups)
CREATE POLICY "03_users_insert_own_profile"
ON profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- 4. Allow users to update their own profile data (but not role unless they're admin)
CREATE POLICY "04_users_update_own_profile_data"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Allow interviewers to update any user's role and data
CREATE POLICY "05_interviewers_update_any_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

-- 6. Allow interviewers to delete users
CREATE POLICY "06_interviewers_delete_users"
ON profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

-- Fix usage_events policies
DROP POLICY IF EXISTS "Users can read their own events" ON usage_events;
DROP POLICY IF EXISTS "Interviewers can read all events" ON usage_events;

CREATE POLICY "01_users_read_own_events"
ON usage_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "02_interviewers_read_all_events"
ON usage_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

-- Fix user_messages policies
DROP POLICY IF EXISTS "Interviewers can send messages to anyone" ON user_messages;
DROP POLICY IF EXISTS "Interviewers can update any message" ON user_messages;
DROP POLICY IF EXISTS "Users can mark their messages as read" ON user_messages;
DROP POLICY IF EXISTS "Users can read messages sent to them" ON user_messages;
DROP POLICY IF EXISTS "Users can read messages they sent" ON user_messages;
DROP POLICY IF EXISTS "Users can reply to interviewers" ON user_messages;

-- Recreate user_messages policies with proper ordering
CREATE POLICY "01_users_read_received_messages"
ON user_messages
FOR SELECT
TO authenticated
USING (to_user_id = auth.uid());

CREATE POLICY "02_users_read_sent_messages"
ON user_messages
FOR SELECT
TO authenticated
USING (from_user_id = auth.uid());

CREATE POLICY "03_interviewers_send_messages"
ON user_messages
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

CREATE POLICY "04_users_reply_to_interviewers"
ON user_messages
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_messages.to_user_id 
    AND p.role = 'interviewer'
  )
);

CREATE POLICY "05_users_mark_messages_read"
ON user_messages
FOR UPDATE
TO authenticated
USING (to_user_id = auth.uid())
WITH CHECK (to_user_id = auth.uid());

CREATE POLICY "06_interviewers_update_any_message"
ON user_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'interviewer'
  )
);

-- Ensure invitations policy exists
DROP POLICY IF EXISTS "Anyone can read pending invitations" ON invitations;

CREATE POLICY "01_public_read_pending_invitations"
ON invitations
FOR SELECT
TO public
USING (status = 'pending');

-- Add a function to prevent admin lockout
CREATE OR REPLACE FUNCTION prevent_admin_lockout()
RETURNS TRIGGER AS $$
DECLARE
  interviewer_count INTEGER;
BEGIN
  -- Prevent changing the role of the last interviewer to something else
  IF OLD.role = 'interviewer' AND NEW.role != 'interviewer' THEN
    -- Check if this is the last interviewer
    SELECT COUNT(*) INTO interviewer_count 
    FROM profiles 
    WHERE role = 'interviewer' AND id != NEW.id;
    
    IF interviewer_count = 0 THEN
      RAISE EXCEPTION 'Cannot change role: This is the last interviewer account';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent admin lockout
DROP TRIGGER IF EXISTS prevent_admin_lockout_trigger ON profiles;
CREATE TRIGGER prevent_admin_lockout_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_lockout();

-- Ensure there's at least one interviewer account
-- If no interviewers exist, promote the first user to interviewer
DO $$
DECLARE
  interviewer_count INTEGER;
  first_user_id UUID;
BEGIN
  SELECT COUNT(*) INTO interviewer_count FROM profiles WHERE role = 'interviewer';
  
  IF interviewer_count = 0 THEN
    SELECT id INTO first_user_id FROM profiles ORDER BY created_at LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      UPDATE profiles 
      SET role = 'interviewer', updated_at = now()
      WHERE id = first_user_id;
      
      RAISE NOTICE 'Promoted first user (%) to interviewer to prevent admin lockout', first_user_id;
    END IF;
  END IF;
END $$;