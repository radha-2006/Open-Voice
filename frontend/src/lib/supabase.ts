import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oqjqcaujsgjikdtctidp.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xanFjYXVqc2dqaWtkdGN0aWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTIzNTYsImV4cCI6MjA5MTk2ODM1Nn0.AeieR8SBXeaDOnxrw6ErRZDO_Ga_5HWsYeRqZA0AQmQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}
