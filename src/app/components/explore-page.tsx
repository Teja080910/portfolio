"use client"

import UserCard from "@/app/components/user-card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/db"
import { IUser, ProfileType } from "@/lib/interfaces"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Building2, ChevronLeft, ChevronRight, ExternalLink, Search, UserRound, Users } from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const ITEMS_PER_PAGE = 9

type Tab = {
  id: ProfileType | "all"
  label: string
  icon: typeof UserRound
}

const tabs: Tab[] = [
  { id: "all", label: "All", icon: Users },
  { id: "user", label: "Users", icon: UserRound },
  { id: "team", label: "Teams", icon: Users },
  { id: "business", label: "Business", icon: Building2 },
]

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [activeTab, setActiveTab] = useState<ProfileType | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loggedInProfile, setLoggedInProfile] = useState<IUser | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setErrorMessage("")

      // Fetch logged-in user's profile
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data: ownProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle()

        if (ownProfile?.username) {
          setLoggedInProfile(ownProfile as IUser)
        }
      }

      // Fetch all visible public profiles (keep full list for accurate counts)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("show", true)
        .order("username", { ascending: true })

      if (error) {
        setProfiles([])
        setErrorMessage(error.message)
      } else if (data) {
        setProfiles(data.filter((profile) => profile.username))
      }

      setLoading(false)
    }

    void fetchData()
  }, [])

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.toLowerCase()

      const matchesSearch =
        profile.username.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        (profile.role || "").toLowerCase().includes(searchLower)

      const matchesTab = activeTab === "all" || profile.type === activeTab

      return matchesSearch && matchesTab
    })
  }, [profiles, searchQuery, activeTab])

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE))
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const tabCounts = useMemo(() => ({
    all: profiles.length,
    user: profiles.filter((p) => p.type === "user" || !p.type).length,
    team: profiles.filter((p) => p.type === "team").length,
    business: profiles.filter((p) => p.type === "business").length,
  }), [profiles])

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <>
      <Head>
        <title>Explore Portfolios | Portfolio Builder</title>
        <meta name="description" content="Discover amazing portfolios from professionals around the world." />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-slate-50 px-6 py-24 transition-colors duration-300 dark:bg-slate-950 md:py-32">
        {/* Light-mode subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.06),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_25%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
                Explore <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent dark:from-cyan-400 dark:to-teal-400">Portfolios</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
                Discover talent, get inspired, and connect with professionals across various industries.
              </p>
            </motion.div>

            <motion.div
              className="mx-auto mt-10 max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="group relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-500 dark:group-focus-within:text-cyan-400" />
                <Input
                  type="text"
                  placeholder="Search by name, role, or username..."
                  className="h-14 rounded-2xl border-slate-200 bg-white pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </motion.div>
          </header>

          {/* Logged-in user's own portfolio */}
          {loggedInProfile && (
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <div className="mx-auto max-w-xl">
                <div className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 to-teal-50 p-5 shadow-md shadow-cyan-500/10 backdrop-blur dark:border-cyan-500/30 dark:from-cyan-950/40 dark:to-teal-950/40 dark:shadow-cyan-500/5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/10" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-500/10" />

                  <div className="relative flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-500 text-xl font-bold text-white shadow-lg">
                      {loggedInProfile.photo ? (
                        <img
                          src={loggedInProfile.photo}
                          alt={`${loggedInProfile.firstname} ${loggedInProfile.lastname}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (loggedInProfile.firstname?.[0] || loggedInProfile.username?.[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                        Your Portfolio
                      </p>
                      <h2 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">
                        {`${loggedInProfile.firstname || ""} ${loggedInProfile.lastname || ""}`.trim() ||
                          loggedInProfile.username}
                      </h2>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {loggedInProfile.role || "Professional"}
                      </p>
                    </div>
                    <Link
                      href={loggedInProfile.type === "business" ? `/b/${loggedInProfile.username}` : loggedInProfile.type === "team" ? `/t/${loggedInProfile.username}` : `/u/${loggedInProfile.username}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      View Portfolio
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <motion.div
            className="mb-10 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const count = tabCounts[tab.id]

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-slate-200 bg-white/70 text-slate-600 hover:border-cyan-300/50 hover:text-cyan-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "ml-1 rounded-full px-2 py-0.5 text-xs tabular-nums",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </motion.div>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent dark:border-cyan-400" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">Loading amazing people...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-rose-400/20 bg-rose-500/5 p-12 text-center">
              <div className="mb-4 rounded-full bg-rose-500/10 p-4 text-rose-500 dark:text-rose-300">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Unable to load portfolios</h3>
              <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                Supabase returned an error while fetching public profiles: {errorMessage}
              </p>
            </div>
          ) : paginatedProfiles.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {paginatedProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id || profile.username}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index % 6), duration: 0.4 }}
                  >
                    <UserCard user={profile} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  className="mt-12 flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                      currentPage === 1
                        ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                        : "border border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-300/50 hover:text-cyan-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300",
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex h-9 w-9 items-center justify-center text-sm text-slate-400 dark:text-slate-500"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                            page === currentPage
                              ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-500/20"
                              : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800/70",
                          )}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                      currentPage === totalPages
                        ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                        : "border border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-300/50 hover:text-cyan-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300",
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-100/50 p-12 text-center dark:border-white/5 dark:bg-white/[0.02]">
              <div className="mb-4 rounded-full bg-slate-200 p-4 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No portfolios found</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Try adjusting your search or check back later for new profiles.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
