/*
  # Fix RLS policies for proper user visibility

  1. Security Updates
    - Allow interviewers to read all profiles for admin dashboard
    - Allow interviewers to update user roles and delete users
    - Maintain security for regular users (can only see own data)
    - Fix usage events visibility for reporting
    - Improve message system policies

  2. Changes
    - Add interviewer policies for full user management
    - Fix existing policies that are too restrictive
    - Ensure proper access control for admin functions
*/

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Pending users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop existing usage_events policies
DROP POLICY IF EXISTS "Interviewers can read all events" ON usage_events;
DROP POLICY IF EXISTS "Users can read their own events" ON usage_events;

-- Drop existing user_messages policies that need updating
DROP POLICY IF EXISTS "Interviewers can update any message" ON user_messages;
DROP POLICY IF EXISTS "Interviewers can send messages" ON user_messages;

-- Drop existing invitations policy
DROP POLICY IF EXISTS "Anyone can read pending invitations" ON invitations;

-- Create comprehensive policies for profiles table

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow interviewers to read all profiles (for admin dashboard)
CREATE POLICY "Interviewers can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow interviewers to update any user's role (for admin management)
CREATE POLICY "Interviewers can update user roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

-- Allow interviewers to delete users (for admin management)
CREATE POLICY "Interviewers can delete users"
ON profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

-- Create usage_events policies
CREATE POLICY "Users can read their own events"
ON usage_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Interviewers can read all events"
ON usage_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

-- Create improved user_messages policies
CREATE POLICY "Interviewers can send messages to anyone"
ON user_messages
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

CREATE POLICY "Interviewers can update any message"
ON user_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'interviewer'
  )
);

-- Create policy for public access to pending invitations
CREATE POLICY "Anyone can read pending invitations"
ON invitations
FOR SELECT
TO public
USING (status = 'pending');