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

const POST_AUTH_REDIRECT_KEY = "folio:post-auth-redirect"

export const setPostAuthRedirect = (path: string) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path)
}

export const peekPostAuthRedirect = (): string | null => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)
}

export const consumePostAuthRedirect = (): string | null => {
  if (typeof window === "undefined") return null
  const value = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)
  if (value) sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
  return value
}
