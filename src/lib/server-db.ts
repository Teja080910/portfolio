import { supabase } from "./db"

// The platform keeps privileged operations on the NestJS API. Server code uses
// the same facade; the API decides what the caller may do from the JWT.
export function getServerClient() {
  return supabase
}
