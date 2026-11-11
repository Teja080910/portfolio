/**
 * Supabase-compatible facade over the platform API.
 *
 * The app was written against `@supabase/supabase-js` and its fluent query
 * builder. This module keeps that surface for the small set of tables and
 * RPCs folio actually uses, but every call goes to the NestJS platform API:
 *
 *   - auth.*  -> Better Auth at AUTH_URL
 *   - from()  -> /api/data/:table  (server-side authorization)
 *   - rpc()   -> /api/public/portfolio/* and /api/portfolio/*
 *   - storage -> presigned MinIO uploads
 *
 * Keeping the shape means application code barely changes while all
 * authorization moves to the server.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4104"
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://127.0.0.1:4100"
const FILES_URL = process.env.NEXT_PUBLIC_FILES_URL ?? "http://127.0.0.1:19000/portfolio-profile-photos"

export type QueryError = { message: string; code?: string; details?: string; hint?: string }
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase-style builder erases row types on purpose */
export type QueryResult<T = any> = { data: T | null; error: QueryError | null }

type Row = Record<string, unknown>

const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

function camelizeRow(row: Row): Row {
  const out: Row = {}
  for (const [key, value] of Object.entries(row)) out[camel(key)] = value
  return out
}

function snakeize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeize)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = snakeize(entry)
    }
    return out
  }
  return value
}

async function readToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/token`, { credentials: "include" })
    if (!response.ok) return null
    const data = (await response.json()) as { token?: string }
    return data.token ?? null
  } catch {
    return null
  }
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await readToken()
  const headers = new Headers(init.headers)
  if (token) headers.set("authorization", `Bearer ${token}`)
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json")
  return fetch(`${API_URL}${path}`, { ...init, headers })
}

function toError(response: Response, body: unknown): QueryError {
  const payload = body as { error?: { message?: string; code?: string } } | null
  return {
    message: payload?.error?.message ?? response.statusText ?? "Request failed",
    code: payload?.error?.code ?? String(response.status),
  }
}

type Filter =
  | { op: "eq"; column: string; value: unknown }
  | { op: "in"; column: string; values: unknown[] }
  | { op: "not_is_null"; column: string }
  | { op: "is"; column: string; value: unknown }

function buildQuery(filters: Filter[], order?: { column: string; ascending: boolean }, limit?: number): string {
  const params = new URLSearchParams()
  const eq: string[] = []
  const inPairs: string[] = []
  for (const filter of filters) {
    if (filter.op === "eq" && filter.value !== null && filter.value !== undefined) {
      eq.push(`${filter.column}:${String(filter.value)}`)
    }
    if (filter.op === "in") inPairs.push(`${filter.column}:${filter.values.map(String).join("|")}`)
    if (filter.op === "not_is_null") eq.push(`${filter.column}:`)
  }
  if (eq.length) params.set("eq", eq.join(","))
  if (inPairs.length) params.set("in", inPairs.join(","))
  if (order) params.set("order", `${order.column}:${order.ascending ? "asc" : "desc"}`)
  if (limit) params.set("limit", String(limit))
  return params.toString()
}

class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private filters: Filter[] = []
  private orderBy?: { column: string; ascending: boolean }
  private limitCount?: number
  private singleMode?: "true" | "maybe"
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select"
  private payload?: unknown
  private conflict?: string

  constructor(private readonly table: string) {}

  select(_columns?: string) {
    if (this.action === "select") this.action = "select"
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value })
    return this
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ op: "in", column, values })
    return this
  }

  is(column: string, value: unknown) {
    this.filters.push({ op: "is", column, value })
    return this
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "is" && value === null) this.filters.push({ op: "not_is_null", column })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.singleMode = "true"
    return this
  }

  maybeSingle() {
    this.singleMode = "maybe"
    return this
  }

  insert(value: unknown) {
    this.action = "insert"
    this.payload = value
    return this
  }

  upsert(value: unknown, options?: { onConflict?: string }) {
    this.action = "upsert"
    this.payload = value
    this.conflict = options?.onConflict
    return this
  }

  update(value: unknown) {
    this.action = "update"
    this.payload = value
    return this
  }

  delete() {
    this.action = "delete"
    return this
  }

  async execute(): Promise<QueryResult<T>> {
    try {
      const query = buildQuery(this.filters, this.orderBy, this.limitCount)
      const suffix = this.singleMode ? `&single=${this.singleMode}` : ""
      const withQuery = query ? `?${query}${suffix}` : this.singleMode ? `?single=${this.singleMode}` : ""

      if (this.action === "select") {
        const response = await apiFetch(`/api/data/${this.table}${withQuery}`)
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: null, error: toError(response, body) }
        return { data: body as unknown as T, error: null }
      }

      if (this.action === "insert") {
        const response = await apiFetch(`/api/data/${this.table}`, {
          method: "POST",
          body: JSON.stringify(snakeize(this.payload)),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: null, error: toError(response, body) }
        return { data: body as unknown as T, error: null }
      }

      if (this.action === "upsert") {
        const response = await apiFetch(`/api/data/${this.table}/upsert`, {
          method: "POST",
          body: JSON.stringify({ value: snakeize(this.payload), conflict: this.conflict ?? "" }),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: null, error: toError(response, body) }
        return { data: body as unknown as T, error: null }
      }

      if (this.action === "update") {
        const response = await apiFetch(`/api/data/${this.table}${withQuery}`, {
          method: "PATCH",
          body: JSON.stringify(snakeize(this.payload)),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: null, error: toError(response, body) }
        return { data: body as unknown as T, error: null }
      }

      const response = await apiFetch(`/api/data/${this.table}${withQuery}`, { method: "DELETE" })
      const body = await response.json().catch(() => null)
      if (!response.ok) return { data: null, error: toError(response, body) }
      return { data: body as unknown as T, error: null }
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "Network error" },
      }
    }
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

type AuthUser = {
  id: string
  email: string
  name: string
  image: string | null
  emailVerified: boolean
  createdAt: string
  created_at: string
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  aud: string
  role: string
  [key: string]: unknown
}

type AuthSession = {
  access_token: string
  refresh_token: string
  user: AuthUser
  expires_at: number
}

async function fetchSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/get-session`, {
      credentials: "include",
      cache: "no-store",
    })
    if (!response.ok) return null
    const body = (await response.json()) as { session?: Row; user?: Row } | null
    if (!body?.session || !body.user) return null
    const tokenRes = await fetch(`${AUTH_URL}/api/auth/token`, {
      credentials: "include",
      cache: "no-store",
    })
    const tokenBody = tokenRes.ok ? ((await tokenRes.json()) as { token?: string }) : null
    return {
      access_token: tokenBody?.token ?? "",
      refresh_token: "",
      user: {
        id: String(body.user.id),
        email: String(body.user.email ?? ""),
        name: String(body.user.name ?? ""),
        image: (body.user.image as string | null) ?? null,
        emailVerified: Boolean(body.user.emailVerified),
        createdAt: String(body.user.createdAt ?? new Date().toISOString()),
        user_metadata: { full_name: body.user.name, name: body.user.name, avatar_url: body.user.image },
        app_metadata: { role: (body.user as { role?: string }).role ?? "user" },
        aud: "authenticated",
        role: String((body.user as { role?: string }).role ?? "authenticated"),
        created_at: String(body.user.createdAt ?? new Date().toISOString()),
      },
      expires_at: new Date(String(body.session.expiresAt ?? Date.now())).getTime() / 1000,
    }
  } catch {
    return null
  }
}

type AuthChangeHandler = (event: string, session: AuthSession | null) => void
const authListeners = new Set<AuthChangeHandler>()

function notifyAuth(event: string, session: AuthSession | null) {
  if (typeof window === "undefined") return
  for (const listener of authListeners) listener(event, session)
}

export const supabase = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table)
  },

  async rpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<QueryResult<T>> {
    try {
      const routes: Record<string, { path: string; method?: string }> = {
        folio_get_team_members: { path: `/api/portfolio/teams/${args.p_team_id}/members` },
        folio_get_team_invite: { path: `/api/public/portfolio/invites/${args.p_token}` },
        folio_accept_team_invite: { path: `/api/public/portfolio/invites/${args.p_token}/accept`, method: "POST" },
        folio_get_my_pending_invites: { path: "/api/public/portfolio/invites/pending" },
        folio_get_team_portfolio: { path: `/api/public/portfolio/teams/${args.p_slug}` },
        folio_get_public_teams: { path: "/api/public/portfolio/teams" },
      }
      const route = routes[name]
      if (!route) return { data: null, error: { message: `Unknown RPC ${name}` } }

      const response = await apiFetch(route.path, { method: route.method ?? "GET" })
      const body = await response.json().catch(() => null)
      if (!response.ok) return { data: null, error: toError(response, body) }

      if (name === "folio_get_team_members") {
        return { data: ((body as { members?: unknown }).members ?? []) as T, error: null }
      }
      if (name === "folio_get_public_teams") {
        return { data: ((body as { teams?: unknown }).teams ?? []) as T, error: null }
      }
      if (name === "folio_get_my_pending_invites") {
        return { data: ((body as { invites?: unknown }).invites ?? []) as T, error: null }
      }
      return { data: body as unknown as T, error: null }
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Network error" } }
    }
  },

  auth: {
    async getUser(jwt?: string) {
      if (jwt && jwt.split(".").length !== 3) {
        // Could be a Better Auth session token; resolve it locally instead.
        const token = await readToken()
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as {
            sub?: string
            email?: string
          }
          const session = await fetchSession()
          if (session?.user) return { data: { user: session.user }, error: null }
          if (!payload.sub) return { data: { user: null }, error: null }
          return {
            data: {
              user: {
                id: payload.sub,
                email: payload.email ?? "",
                name: "",
                image: null,
                emailVerified: false,
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
                user_metadata: {},
                app_metadata: {},
                aud: "authenticated",
                role: "authenticated",
              },
            },
            error: null,
          }
        }
      }
      const session = await fetchSession()
      return { data: { user: session?.user ?? null }, error: null }
    },

    async getSession(): Promise<{ data: { session: AuthSession | null }; error: QueryError | null }> {
      const session = await fetchSession()
      return { data: { session }, error: null }
    },

    onAuthStateChange(handler: AuthChangeHandler) {
      authListeners.add(handler)
      void fetchSession().then((session) => handler(session ? "SIGNED_IN" : "SIGNED_OUT", session))
      return { data: { subscription: { unsubscribe: () => authListeners.delete(handler) } } }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const response = await fetch(`${AUTH_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return { data: { user: null, session: null }, error: { message: body?.message ?? "Invalid credentials" } }
      }
      const session = await fetchSession()
      notifyAuth("SIGNED_IN", session)
      return { data: { user: session?.user ?? null, session }, error: null }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      const name = String(options?.data?.firstname ?? options?.data?.name ?? email.split("@")[0])
      const response = await fetch(`${AUTH_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return { data: { user: null, session: null }, error: { message: body?.message ?? "Could not sign up" } }
      }
      const session = await fetchSession()
      notifyAuth("SIGNED_IN", session)
      return { data: { user: session?.user ?? null, session }, error: null }
    },

    async signInWithOAuth({ provider, options }: { provider: string; options?: { redirectTo?: string } }) {
      const callbackURL = options?.redirectTo ?? `${window.location.origin}/auth/callback`
      const errorCallbackURL = `${window.location.origin}/sign-in?error=auth`
      const response = await fetch(`${AUTH_URL}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider, callbackURL, errorCallbackURL }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return { data: null, error: { message: body?.message ?? "OAuth unavailable" } }
      }
      const data = (await response.json()) as { url?: string }
      if (data.url) window.location.href = data.url
      return { data: null, error: null }
    },

    async signOut() {
      await fetch(`${AUTH_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      }).catch(() => undefined)
      notifyAuth("SIGNED_OUT", null)
      return { error: null }
    },

    async updateUser({ password, data }: { password?: string; data?: Record<string, unknown> }) {
      const response = await fetch(`${AUTH_URL}/api/auth/update-user`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...(data ?? {}), ...(password ? { password } : {}) }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return { data: { user: null }, error: { message: body?.message ?? "Could not update account" } }
      }
      return { data: { user: null }, error: null }
    },

    async setSession(_: { access_token: string; refresh_token?: string }) {
      const session = await fetchSession()
      return { data: { session }, error: null }
    },

    async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
      const response = await fetch(`${AUTH_URL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, redirectTo: options?.redirectTo }),
      })
      if (!response.ok) return { data: null, error: { message: "Could not send reset email" } }
      return { data: {}, error: null }
    },

    admin: {
      async createUser(input: { email: string; password?: string; email_confirm?: boolean; user_metadata?: Record<string, unknown> }) {
        const token = await readToken()
        const response = await fetch(`${AUTH_URL}/admin/users`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            email: input.email,
            password: input.password,
            name: String(input.user_metadata?.full_name ?? input.email.split("@")[0]),
          }),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: { user: null }, error: toError(response, body) }
        return { data: body, error: null }
      },
      async listUsers() {
        const token = await readToken()
        const response = await fetch(`${AUTH_URL}/admin/users`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) return { data: { users: [] }, error: toError(response, body) }
        return { data: body, error: null }
      },
    },
  },

  storage: {
    from(bucket: string) {
      const base = bucket === "profile-photos" ? FILES_URL : FILES_URL
      return {
        async upload(objectPath: string, file: File, options?: { upsert?: boolean; contentType?: string; cacheControl?: string }) {
          const token = await readToken()
          if (!token) return { data: null, error: { message: "Not signed in" } }
          const presignRes = await fetch(`${API_URL}/api/portfolio/uploads/presign`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileName: objectPath.split("/").pop() ?? "file", contentType: options?.contentType ?? file.type }),
          })
          if (!presignRes.ok) return { data: null, error: { message: "Could not prepare upload" } }
          const presign = (await presignRes.json()) as { uploadUrl: string; objectKey: string; headers: Record<string, string> }
          const put = await fetch(presign.uploadUrl, {
            method: "PUT",
            headers: { ...presign.headers, "content-type": options?.contentType ?? file.type },
            body: file,
          })
          if (!put.ok) return { data: null, error: { message: "Upload failed" } }
          return { data: { path: presign.objectKey }, error: null }
        },
        getPublicUrl(objectPath: string) {
          const clean = objectPath.replace(/^\/+/, "")
          return { data: { publicUrl: `${base.replace(/\/$/, "")}/${clean}` } }
        },
        async remove(paths: string[]) {
          const token = await readToken()
          if (!token) return { data: null, error: { message: "Not signed in" } }
          for (const path of paths) {
            await fetch(`${API_URL}/api/portfolio/uploads?key=${encodeURIComponent(path)}`, {
              method: "DELETE",
              headers: { authorization: `Bearer ${token}` },
            }).catch(() => undefined)
          }
          return { data: {}, error: null }
        },
        async list(prefix?: string) {
          const { data } = await supabase.from("portfolio_contents").select("*")
          void data
          return { data: [], error: null }
        },
      }
    },
  },
}

export type SupabaseClient = typeof supabase
export { snakeize }


export type User = AuthUser
export type Session = AuthSession
