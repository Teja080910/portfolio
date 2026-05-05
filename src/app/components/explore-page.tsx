"use client"

import UserCard from "@/app/components/user-card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/db"
import { IUser } from "@/lib/interfaces"
import { motion } from "framer-motion"
import { Search, Users } from "lucide-react"
import Head from "next/head"
import { useEffect, useState } from "react"

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true)
      setErrorMessage("")

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

    void fetchProfiles()
  }, [])

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchQuery.toLowerCase()
    const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.toLowerCase()

    return (
      profile.username.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      (profile.role || "").toLowerCase().includes(searchLower)
    )
  })

  return (
    <>
      <Head>
        <title>Explore Portfolios | Portfolio Builder</title>
        <meta name="description" content="Discover amazing portfolios from professionals around the world." />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_25%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Explore <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Portfolios</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
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
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                <Input
                  type="text"
                  placeholder="Search by name, role, or username..."
                  className="h-14 rounded-2xl border-white/10 bg-white/5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </motion.div>
          </header>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p className="mt-4 text-slate-400">Loading amazing people...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-rose-400/20 bg-rose-500/5 p-12 text-center">
              <div className="mb-4 rounded-full bg-rose-500/10 p-4 text-rose-300">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-white">Unable to load portfolios</h3>
              <p className="mt-2 max-w-xl text-slate-300">
                Supabase returned an error while fetching public profiles: {errorMessage}
              </p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {filteredProfiles.map((profile, index) => (
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
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-800/50 p-4 text-slate-500">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-white">No portfolios found</h3>
              <p className="mt-2 text-slate-400">Try adjusting your search or check back later for new profiles.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
