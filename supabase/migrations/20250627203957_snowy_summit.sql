/*
  # Update profiles table to support pending role

  1. Changes
    - Update role constraint to include 'pending' status
    - Update default role to 'pending' for new signups
    - Add migration for existing users

  2. Security
    - Maintain existing RLS policies
    - Add policy for pending users to read their own profile
*/

-- Update the role constraint to include 'pending'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['interviewer'::text, 'candidate'::text, 'pending'::text]));

-- Update default role to 'pending'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'pending'::text;

-- Add RLS policy for pending users
CREATE POLICY "Pending users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND role = 'pending');

-- Update the trigger function to handle pending users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;