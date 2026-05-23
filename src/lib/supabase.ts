import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY son requeridas');
}

// Cliente público (solo lectura, respeta RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
