import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This client uses the service role key and bypasses RLS.
// It MUST NEVER be used on the client-side or exposed to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
