import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Log for debugging (only logs if not set, doesn't expose actual keys)
if (!supabaseUrl || supabaseUrl === '') {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
}
if (!supabaseAnonKey || supabaseAnonKey === '') {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

// Create client with placeholder values if env vars not set (for build time)
// Will fail at runtime if actually used without proper credentials
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types for type safety
export interface RoomRow {
  id: string
  host_player_id: string
  total_rounds: number
  started: boolean
  game_state: any // Will be parsed as GameState
  created_at: string
  updated_at: string
}
