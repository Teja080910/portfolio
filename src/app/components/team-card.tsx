"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { ITeam } from "@/lib/interfaces"
import { motion } from "framer-motion"
import { ExternalLink, Users } from "lucide-react"
import Link from "next/link"

interface TeamCardProps {
  team: ITeam
}

export default function TeamCard({ team }: TeamCardProps) {
  const logo = getProxiedImageUrl(team.logo)
  const initials = (team.name || team.slug || "T").charAt(0).toUpperCase()
  const memberCount = team.member_count ?? 0
  const placeholderImg = `https://picsum.photos/seed/${team.slug || "team"}/400/200`

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="group h-full overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <div
          className="relative h-32 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-0"
          style={{
            backgroundImage: `url(${logo || placeholderImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Users className="h-3 w-3" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
          <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-secondary text-2xl font-bold text-white shadow-lg">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={team.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 to-teal-500">
                {initials}
              </div>
            )}
          </div>
        </div>

        <CardContent className="mt-12 p-6">
          <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
          <p className="mt-1 text-sm font-medium text-primary">@{team.slug}</p>
          <p className="mt-3 line-clamp-2 break-words text-sm text-muted-foreground">
            {team.tagline || team.description || `Explore the ${team.name} team portfolio.`}
          </p>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Link
            href={`/t/${encodeURIComponent(team.slug)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            View Team
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
