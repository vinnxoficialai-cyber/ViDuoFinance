import { createClient } from '@supabase/supabase-js'

// Pega as variáveis que colocamos no arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase no arquivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)