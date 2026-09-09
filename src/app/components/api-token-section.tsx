import { supabase } from "@/lib/db"
import { Copy, KeyRound, Plus, ShieldCheck, Sparkles, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const SAMPLE_PROMPTS = [
  {
    label: "Read my portfolio",
    prompt: "Read my portfolio and summarize what sections I have, how many items in each, and what my profile looks like.",
  },
  {
    label: "Add a new project",
    prompt: 'Add a new project called "My App" with description "A full-stack web app built with Next.js and Supabase" and skills ["Next.js", "Supabase", "TypeScript"].',
  },
  {
    label: "Update my skills",
    prompt: 'Add a new skill category called "DevOps" with skills ["Docker", "AWS", "CI/CD", "GitHub Actions"].',
  },
  {
    label: "Remove old experience",
    prompt: "Remove my oldest experience entry from the portfolio.",
  },
  {
    label: "Add education entry",
    prompt: 'Add a new education entry: institution "University of California", course "Bachelor of Science", branch "Computer Science", duration "2020-2024".',
  },
  {
    label: "Scrape and fill from a website",
    prompt: "Scrape the portfolio at https://portfoli.store/u/tejasimma36 and push all the data to my portfolio using the API.",
  },
]

interface TokenRow {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
  revoked: boolean
}

export default function ApiTokenSection() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : null
  }, [])

  const loadTokens = useCallback(async () => {
    const headers = await authHeaders()
    if (!headers) return
    const res = await fetch("/api/token", { headers })
    const json = await res.json()
    if (res.ok && json.tokens) {
      setTokens(json.tokens.filter((t: TokenRow) => !t.revoked))
    }
    setLoaded(true)
  }, [authHeaders])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  const handleGenerate = async () => {
    setError(null)
    setCreating(true)
    setCopied(false)
    try {
      const headers = await authHeaders()
      if (!headers) throw new Error("Not signed in")
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "AI access" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to create token")
      setNewToken(json.token)
      setName("")
      await loadTokens()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create token")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    const headers = await authHeaders()
    if (!headers) return
    const res = await fetch(`/api/token/${id}`, { method: "DELETE", headers })
    if (res.ok) setTokens((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCopy = async () => {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedPrompt(index)
    window.setTimeout(() => setCopiedPrompt(null), 2000)
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return "never"
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-300">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">API Access Tokens</h2>
          <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-teal-500" />
            Let AI agents or scripts update your portfolio using a token.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-950/95 p-4 text-sm font-mono text-teal-300 shadow-inner">
        <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">How to use</p>
        <p className="text-slate-200">
          <span className="text-teal-300">GET</span> /api/portfolio &nbsp;— read your sections
        </p>
        <p className="text-slate-200">
          <span className="text-teal-300">POST</span> /api/portfolio &nbsp;— update sections
        </p>
        <p className="mt-2 text-slate-400">
          Header: <span className="text-amber-300">Authorization: Bearer folio_xxxx</span>
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sample Prompts</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Copy a prompt and paste it into an AI agent (like OpenCode, ChatGPT, or Claude) to manage your portfolio.
        </p>
        <div className="space-y-2">
          {SAMPLE_PROMPTS.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-cyan-600"
            >
              <p className="min-w-0 flex-1 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}:</span>{" "}
                {item.prompt}
              </p>
              <button
                onClick={() => handleCopyPrompt(item.prompt, i)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <Copy className="h-3 w-3" />
                {copiedPrompt === i ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. opencode, zapier)"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          onClick={handleGenerate}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Generating..." : "Generate token"}
        </button>
      </div>

      {newToken && (
        <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
          <p className="text-sm font-semibold text-amber-500">Copy your token now — it won&apos;t be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-amber-200">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Active tokens{loaded ? ` (${tokens.length})` : ""}
        </h3>
        {tokens.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No tokens yet. Generate one to connect a tool.</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created {formatDate(t.created_at)} · Last used {formatDate(t.last_used_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(t.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
