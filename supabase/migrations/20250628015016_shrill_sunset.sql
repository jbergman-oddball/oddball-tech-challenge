/*
  # Add Extended Profile Fields

  1. New Profile Fields
    - `bio` (text) - User biography/description
    - `location` (text) - User location
    - `profile_picture_url` (text) - URL to profile picture
    - `website` (text) - Personal website URL
    - `linkedin_url` (text) - LinkedIn profile URL
    - `github_url` (text) - GitHub profile URL
    - `skills` (text[]) - Array of user skills
    - `years_experience` (integer) - Years of professional experience

  2. Storage
    - Create profile-pictures bucket for storing profile images
    - Set up RLS policies for secure file access

  3. Constraints
    - Data validation for URLs and experience range
    - Performance indexes for searchable fields

  4. Security
    - Update RLS policies to allow profile updates
    - Secure file upload/access policies
*/

-- Add new profile fields
DO $$
BEGIN
  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Add location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  -- Add profile_picture_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;

  -- Add website column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;

  -- Add linkedin_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url text;
  END IF;

  -- Add github_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_url text;
  END IF;

  -- Add skills column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills text[] DEFAULT '{}';
  END IF;

  -- Add years_experience column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE profiles ADD COLUMN years_experience integer;
  END IF;
END $$;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

  CREATE POLICY "Users can upload their own profile pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can update their own profile pictures"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can delete their own profile pictures"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
END $$;

-- Add constraints for data validation
DO $$
BEGIN
  -- Constraint for years_experience (0-50 years)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_years_experience_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_years_experience_check 
    CHECK (years_experience >= 0 AND years_experience <= 50);
  END IF;

  -- Constraint for website URL format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_website_url_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_website_url_check 
    CHECK (website IS NULL OR website ~* '^https?://');
  END IF;

  -- Constraint for LinkedIn URL format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_linkedin_url_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_linkedin_url_check 
    CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://(www\.)?linkedin\.com/');
  END IF;

  -- Constraint for GitHub URL format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_github_url_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_github_url_check 
    CHECK (github_url IS NULL OR github_url ~* '^https?://(www\.)?github\.com/');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(location);
CREATE INDEX IF NOT EXISTS profiles_skills_idx ON profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS profiles_years_experience_idx ON profiles(years_experience);

-- Update RLS policies to allow users to update their extended profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);