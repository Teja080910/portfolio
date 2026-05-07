"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { IUser } from "@/lib/interfaces"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface UserCardProps {
  user: IUser
}

export default function UserCard({ user }: UserCardProps) {
  const displayName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username || user.email
  const avatarText = (user.firstname?.[0] || user.username?.[0] || "U").toUpperCase()
  const userPhoto = getProxiedImageUrl(user.photo)
  const placeholderImg = `https://picsum.photos/seed/${user.username || user.email || "user"}/400/200`

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        {/* Card header — photo as background or seeded placeholder */}
        <div
          className="relative h-32 bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-0"
          style={{
            backgroundImage: `url(${userPhoto || placeholderImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay so avatar/text remain readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-secondary shadow-lg">
            {user.photo ? (
              <Image
                src={userPhoto || ""}
                alt={displayName}
                fill
                className="object-cover"
                sizes="80px"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 text-2xl font-bold text-primary">
                {avatarText}
              </div>
            )}
          </div>
        </div>

        <CardContent className="mt-12 p-6">
          <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
          <p className="mt-1 text-sm font-medium text-primary">
            {user.role || "Professional"}
          </p>
          <p className="mt-3 line-clamp-2 break-words text-sm text-muted-foreground">
            {user.description || `View ${user.username}'s professional portfolio and experience.`}
          </p>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Link
            href={user.type === "business" ? `/b/${user.username}` : user.type === "team" ? `/t/${user.username}` : `/u/${user.username}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            View Portfolio
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
