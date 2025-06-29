import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  // Create a mock client to prevent app crashes
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
} else if (supabaseUrl === 'your-supabase-url' || supabaseUrl.includes('your-supabase')) {
  console.error('Please replace placeholder Supabase URL')
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
} else if (supabaseAnonKey === 'your-supabase-anon-key' || supabaseAnonKey.includes('your-supabase')) {
  console.error('Please replace placeholder Supabase anon key')
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
} else {
  // Validate URL format
  try {
    new URL(supabaseUrl)
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch {
    console.error(`Invalid Supabase URL format: ${supabaseUrl}`)
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
}

export { supabase }