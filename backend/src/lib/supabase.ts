import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY belum diisi di backend/.env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

export function createUserClient(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Konfigurasi Supabase belum lengkap.')
  }

  return createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => accessToken,
  })
}