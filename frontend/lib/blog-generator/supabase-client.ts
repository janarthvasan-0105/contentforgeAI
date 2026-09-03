import { createClient } from '@supabase/supabase-js'

export const blogGenSupabase = createClient(
  process.env.NEXT_PUBLIC_BLOG_GEN_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_BLOG_GEN_SUPABASE_ANON_KEY!
)
