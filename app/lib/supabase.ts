// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

// ZMIENNE Z .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Brakuje zmiennych środowiskowych dla Supabase! Sprawdź .env.local")
}

// CLIENT – do użycia po stronie przeglądarki (login, sign-up, realtime)
export const supabaseBrowser = () =>
  createClient(supabaseUrl, supabaseAnonKey)

// SERVER – do użycia w API routes / server actions (zapytania do DB bez limitów)
export const supabaseServer = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
  