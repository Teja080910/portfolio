import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as { __supabaseClient?: SupabaseClient };

export const supabase =
  globalForSupabase.__supabaseClient ??
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabaseClient = supabase;
}
