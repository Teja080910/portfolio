/**
 * Translates raw Supabase error messages into user-friendly messages.
 */

const KNOWN_PATTERNS: { pattern: RegExp; message: string }[] = [
  {
    pattern: /Could not find the table.*'?public\.\w+'?.*in the schema cache/i,
    message: "This feature is not set up yet. Please check back later or contact support.",
  },
  {
    pattern: /relation.*does not exist/i,
    message: "This feature is not set up yet. Please check back later or contact support.",
  },
  {
    pattern: /permission denied for table/i,
    message: "You don't have permission to access this data.",
  },
  {
    pattern: /new row violates row-level security policy/i,
    message: "You don't have permission to perform this action.",
  },
  {
    pattern: /duplicate key value violates unique constraint/i,
    message: "This record already exists. Please use a different value.",
  },
  {
    pattern: /insert or update on table.*violates foreign key constraint/i,
    message: "This action references data that doesn't exist. Please try again.",
  },
  {
    pattern: /Failed to fetch|NetworkError|Network request failed/i,
    message: "Unable to connect to the server. Please check your internet connection and try again.",
  },
  {
    pattern: /JWT|invalid.*token|token.*expired/i,
    message: "Your session has expired. Please sign in again.",
  },
  {
    pattern: /timeout/i,
    message: "The request timed out. Please try again.",
  },
]

/**
 * Returns a user-friendly error message from a Supabase error.
 * Falls back to the original message if no pattern matches.
 */
export function getFriendlySupabaseError(error: { message?: string; code?: string } | null | undefined): string {
  if (!error || !error.message) {
    return "An unexpected error occurred. Please try again."
  }

  for (const { pattern, message } of KNOWN_PATTERNS) {
    if (pattern.test(error.message)) {
      return message
    }
  }

  return error.message
}
