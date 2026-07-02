import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pefqwttyxumdzyhgpwyx.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZnF3dHR5eHVtZHp5aGdwd3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDQxMDIsImV4cCI6MjA5ODMyMDEwMn0.GErXjYDP0i18F-TDWsSOd7ygsvBAGeS-sjK-h37UEIw"
  )
}
