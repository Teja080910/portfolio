"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Award, Calendar, Link as LinkIcon, PencilLine } from "lucide-react"
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

  return (
    <section id="certificate" className="section-shell">
      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-4 flex justify-end">
            <Link
              href={editCertificateHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Certificates
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="Certificates" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certificates.length > 0 ? certificates.map((certificate, index) => (
            <motion.div
              key={index}
              className="glass-card h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <Award className="h-10 w-10 text-cyan-500" />
                <h3 className="ml-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{certificate.name}</h3>
              </div>
              {certificate.duration && (
                <p className="mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4" />
                  {certificate.duration}
                </p>
              )}
              {certificate.link && (
                <a
                  href={certificate.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-300"
                >
                  <LinkIcon className="h-4 w-4" />
                  View Credential
                </a>
              )}
            </motion.div>
          )) : (
            <div className="glass-card md:col-span-2 text-center text-slate-600 dark:text-slate-300">
              No certificates added yet. Use Edit Certificates to publish your credentials.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
