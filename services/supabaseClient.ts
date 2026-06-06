import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oguvupgbutzkudpeurgr.supabase.co'
const supabaseAnonKey = 'sua_anon_key_aqui'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)