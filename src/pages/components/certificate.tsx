"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Award, Calendar, Link as LinkIcon } from "lucide-react"
import Image from "next/image"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

export default function Certificate() {
  const certificates = useStore((state) =>
    state.certificate.filter((item) => item.show && (item.name || item.duration || item.link)),
  )

  if (certificates.length === 0) {
    return null
  }

  return (
    <section id="certificate" className="section-shell">
      <div className="surface-grid relative z-10">
        <AnimatedSectionHeader title="Certificates" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certificates.map((certificate, index) => (
            <motion.div
              key={index}
              className="glass-card h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
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
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute top-8 left-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}

