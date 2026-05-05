"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { IUser } from "@/lib/interfaces"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface UserCardProps {
  user: IUser
}

export default function UserCard({ user }: UserCardProps) {
  const displayName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username || user.email
  const avatarText = (user.firstname?.[0] || user.username?.[0] || "U").toUpperCase()

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-slate-200/60 bg-white/70 backdrop-blur-md transition-all hover:border-cyan-300/50 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/75">
        <CardHeader className="relative h-32 bg-gradient-to-br from-cyan-600 to-teal-500 p-0">
          <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg dark:border-slate-900 dark:bg-slate-800">
            {user.photo ? (
              <img src={user.photo} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-2xl font-bold text-slate-400 dark:from-slate-800 dark:to-slate-700">
                {avatarText}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-12 p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{displayName}</h3>
          <p className="mt-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
            {user.role || "Professional"}
          </p>
          <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            {user.description || `View ${user.username}'s professional portfolio and experience.`}
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link
            href={user.type === "business" ? `/b/${user.username}` : `/u/${user.username}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            View Portfolio
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
