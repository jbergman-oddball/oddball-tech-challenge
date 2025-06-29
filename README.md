# Oddball's Tech Challenge - Simplified Version

A simplified version of the Oddball Tech Challenge platform with Supabase authentication and basic user roles.

## Features

- **Authentication**: Email/password authentication with Supabase
- **User Roles**: Support for interviewer and candidate roles
- **Admin Approval**: New users start with 'pending' status and require admin approval
- **Modern UI**: Clean, responsive interface with Tailwind CSS

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the development server with `npm run dev`

## Supabase Setup

This application requires a Supabase project with the following:

1. Email authentication enabled
2. A `profiles` table with the following schema:
   - `id` (uuid, primary key, references auth.users.id)
   - `email` (text, not null)
   - `full_name` (text, nullable)
   - `role` (text, not null, default 'pending', check constraint: 'interviewer', 'candidate', or 'pending')
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

3. Row Level Security (RLS) policies for the `profiles` table:
   - Users can read their own profile
   - Interviewers can read all profiles
   - Users can update their own profile
   - Interviewers can update any profile

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React (for icons)