import { supabase } from "./db"

let inFlightSessionPromise: ReturnType<typeof supabase.auth.getSession> | null = null

export const getCurrentSession = () => {
  if (!inFlightSessionPromise) {
    inFlightSessionPromise = supabase.auth.getSession().finally(() => {
      inFlightSessionPromise = null
    })
  }

  return inFlightSessionPromise
}
