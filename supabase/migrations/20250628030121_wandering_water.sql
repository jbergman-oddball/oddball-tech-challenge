/*
  # Fix Profiles Table RLS Policies

  This migration fixes the infinite recursion issue in the profiles table RLS policies
  by creating simplified policies that don't reference the profiles table within their own evaluation.

  ## Changes Made:
  1. Remove all existing problematic policies
  2. Create simplified policies using direct auth checks
  3. Add helper function for role checking
  4. Avoid circular dependencies in policy evaluation
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "01_users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "02_interviewers_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "03_users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "04_users_update_own_profile_data" ON profiles;
DROP POLICY IF EXISTS "05_interviewers_update_any_profile" ON profiles;
DROP POLICY IF EXISTS "06_interviewers_delete_users" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_all_access" ON profiles;
DROP POLICY IF EXISTS "interviewers_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "interviewers_update_profiles" ON profiles;
DROP POLICY IF EXISTS "interviewers_delete_profiles" ON profiles;

-- Create a function to safely check if a user is an interviewer
-- This avoids recursion by checking auth metadata directly
CREATE OR REPLACE FUNCTION is_interviewer(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND (
      (raw_user_meta_data->>'role') = 'interviewer'
      OR 
      (raw_app_meta_data->>'role') = 'interviewer'
    )
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_interviewer TO authenticated, anon, service_role;

-- Create new simplified policies without recursion

-- Policy 1: Users can read their own profile
CREATE POLICY "01_users_read_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Interviewers can read all profiles (using helper function)
CREATE POLICY "02_interviewers_read_all_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_interviewer());

-- Policy 3: Users can insert their own profile
CREATE POLICY "03_users_insert_own_profile" ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own profile data
CREATE POLICY "04_users_update_own_profile_data" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Interviewers can update any profile (using helper function)
CREATE POLICY "05_interviewers_update_any_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_interviewer())
  WITH CHECK (is_interviewer());

-- Policy 6: Interviewers can delete users (using helper function)
CREATE POLICY "06_interviewers_delete_users" ON profiles
  FOR DELETE
  TO authenticated
  USING (is_interviewer());

-- Create a trigger function to prevent admin lockout
CREATE OR REPLACE FUNCTION prevent_admin_lockout()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing the role of the last interviewer to something else
  IF OLD.role = 'interviewer' AND NEW.role != 'interviewer' THEN
    -- Check if this is the last interviewer
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'interviewer' AND id != NEW.id) = 0 THEN
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
BEGIN
  IF (SELECT COUNT(*) FROM profiles WHERE role = 'interviewer') = 0 THEN
    UPDATE profiles 
    SET role = 'interviewer', updated_at = now()
    WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE 'Promoted first user to interviewer to prevent admin lockout';
  END IF;
END $$;