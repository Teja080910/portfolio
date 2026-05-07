"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Award, Calendar, ExternalLink, PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type CertificateProps = {
  isReadOnly?: boolean
}

export default function Certificate({ isReadOnly = false }: CertificateProps) {
  const certificateStore = useStore((state) => state.certificate)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editCertificateHref = `/u/${encodeURIComponent(username || "me")}/edit-certificate`
  const certificates = certificateStore.filter((item) => item.show && (item.name || item.duration || item.link))

  if (isReadOnly && certificates.length === 0) {
    return null
  }

  const borderColors = [
    "border-primary/30",
    "border-purple-500/30",
    "border-pink-500/30",
    "border-cyan-500/30",
    "border-amber-500/30",
    "border-emerald-500/30",
  ]

  return (
    <section id="certificate" className="section-shell">
      {/* Background */}
      <div className="orb right-[-10%] top-[-5%] h-[30%] w-[30%] bg-pink-500/5 dark:bg-pink-500/10" />
      <div className="orb left-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-primary/5 dark:bg-primary/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editCertificateHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Certificates
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Certificates" subtitle="Professional certifications and credentials." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.length > 0 ? (
            certificates.map((cert, index) => {
              const borderColor = borderColors[index % borderColors.length]

              return (
                <motion.div
                  key={cert.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card group relative h-full overflow-hidden border ${borderColor}`}>
                    {/* Icon */}
                    <div className="mb-4 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5">
                      <Award className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    {/* Name */}
                    <h3 className="break-words text-base font-bold text-foreground [overflow-wrap:anywhere]">
                      {cert.name}
                    </h3>

                    {/* Duration */}
                    {cert.duration && (
                      <p className="mt-2 inline-flex items-center gap-1.5 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {cert.duration}
                      </p>
                    )}

                    {/* Link */}
                    {cert.link && (
                      <div className="mt-4">
                        <a
                          href={cert.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Credential
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No certificates added yet. Use Edit Certificates to publish your credentials.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
