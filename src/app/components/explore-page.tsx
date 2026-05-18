"use client"

import UserCard from "@/app/components/user-card"
import { Input } from "@/components/ui/input"
import { getFriendlySupabaseError } from "@/utils/supabase-error"
import { supabase } from "@/lib/db"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { IUser, ProfileType } from "@/lib/interfaces"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Building2, ChevronLeft, ChevronRight, Compass, Search, UserRound, Users } from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

const ITEMS_PER_PAGE = 9

type Tab = {
  id: ProfileType | "all"
  label: string
  icon: typeof UserRound
}

const tabs: Tab[] = [
  { id: "all", label: "All", icon: Compass },
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
      } else {
        setLoggedInProfile(null)
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("show", true)
        .order("username", { ascending: true })

      if (error) {
        setProfiles([])
        setErrorMessage(getFriendlySupabaseError(error))
      } else if (data) {
        setProfiles(data.filter((profile) => profile.username))
      }

      setLoading(false)
    }

    void fetchData()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setLoggedInProfile(null)
      }
    })

    return () => {
      authSubscription.subscription.unsubscribe()
    }
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

      <main className="relative min-h-screen overflow-hidden bg-background px-6 py-24 transition-colors duration-300 md:py-32">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:via-transparent dark:to-purple-500/10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full -translate-x-1/2 bg-gradient-radial from-primary/5 to-transparent dark:from-primary/10" />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Explore{" "}
                <span className="gradient-text">Portfolios</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
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
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="text"
                  placeholder="Search by name, role, or username..."
                  className="h-14 rounded-2xl border-border bg-card/50 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-primary/20"
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
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-5 shadow-md backdrop-blur">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-purple-500/10 blur-3xl" />

                  <div className="relative flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-xl font-bold text-white shadow-lg">
                      {loggedInProfile.photo ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={getProxiedImageUrl(loggedInProfile.photo) || ""}
                            alt={`${loggedInProfile.firstname} ${loggedInProfile.lastname}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        (loggedInProfile.firstname?.[0] || loggedInProfile.username?.[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Your Portfolio
                      </p>
                      <h2 className="mt-1 truncate text-lg font-bold text-foreground">
                        {`${loggedInProfile.firstname || ""} ${loggedInProfile.lastname || ""}`.trim() ||
                          loggedInProfile.username}
                      </h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {loggedInProfile.role || "Professional"}
                      </p>
                    </div>
                    <Link
                      href={loggedInProfile.type === "business" ? `/b/${loggedInProfile.username}` : loggedInProfile.type === "team" ? `/t/${loggedInProfile.username}` : `/u/${loggedInProfile.username}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      View Portfolio
                      <Compass className="h-3.5 w-3.5" />
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
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border border-border/50 bg-card/50 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "ml-1 rounded-lg px-2 py-0.5 text-xs tabular-nums",
                      isActive
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-secondary/70 text-muted-foreground",
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
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading amazing people...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 p-12 text-center">
              <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Unable to load portfolios</h3>
              <p className="mt-2 max-w-xl text-muted-foreground">
                {errorMessage}
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

              {/* Pagination */}
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
                      "inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                      currentPage === 1
                        ? "cursor-not-allowed text-muted-foreground/30"
                        : "border border-border/50 bg-card/50 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary",
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
                          className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground/50"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200",
                            page === currentPage
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:bg-secondary/70",
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
                      "inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                      currentPage === totalPages
                        ? "cursor-not-allowed text-muted-foreground/30"
                        : "border border-border/50 bg-card/50 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary",
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/30 p-12 text-center backdrop-blur">
              <div className="mb-4 rounded-full bg-secondary/70 p-4 text-muted-foreground">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">No portfolios found</h3>
              <p className="mt-2 text-muted-foreground">Try adjusting your search or check back later for new profiles.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
