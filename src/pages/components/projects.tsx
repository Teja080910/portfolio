"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ExternalLink, GitBranch, PencilLine, ArrowUpRight, Code2, Calendar, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"
import ImageLightbox from "@/components/ui/image-lightbox"

type ProjectsProps = {
  isReadOnly?: boolean
}

export default function Projects({ isReadOnly = false }: ProjectsProps) {
  const projectsStore = useStore((state) => state.projects)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editProjectsHref = `/u/${encodeURIComponent(username || "me")}/edit-projects`
  const projects = projectsStore.filter((item) => item.show && (item.name || item.description || item.duration || item.startDate || item.endDate || item.skills.length))
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [descModal, setDescModal] = useState<string | null>(null)
  const openDescModal = (desc: string) => {
    setDescModal(desc)
    document.body.style.overflow = "hidden"
  }
  const closeDescModal = () => {
    setDescModal(null)
    document.body.style.overflow = ""
  }

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos)
    setLightboxIndex(index)
    setLightboxSrc(photos[index])
  }

  const prevPhoto = () => {
    const next = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length
    setLightboxIndex(next)
    setLightboxSrc(lightboxPhotos[next])
  }

  const nextPhoto = () => {
    const next = (lightboxIndex + 1) % lightboxPhotos.length
    setLightboxIndex(next)
    setLightboxSrc(lightboxPhotos[next])
  }

  const closeLightbox = () => {
    setLightboxSrc(null)
    setLightboxPhotos([])
    setLightboxIndex(0)
  }

  if (isReadOnly && projects.length === 0) {
    return null
  }

  const projectGradients = [
    "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    "from-blue-500/20 via-cyan-500/10 to-transparent",
    "from-rose-500/20 via-pink-500/10 to-transparent",
    "from-emerald-500/20 via-teal-500/10 to-transparent",
    "from-amber-500/20 via-orange-500/10 to-transparent",
    "from-indigo-500/20 via-purple-500/10 to-transparent",
  ]

  return (
    <section id="projects" className="section-shell">
      <div className="orb left-[-8%] top-[-5%] h-[30%] w-[30%] bg-primary/5 dark:bg-primary/10" />
      <div className="orb right-[-8%] bottom-[-5%] h-[25%] w-[25%] bg-pink-500/5 dark:bg-pink-500/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editProjectsHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Projects
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Projects" subtitle="Things I've built and contributed to." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project, index) => {
              const projectPhotos = (project.photos?.length ? project.photos : (project.logo ? [project.logo] : [])).filter(Boolean)
              const heroImage = projectPhotos[0]
              const moreImagesCount = projectPhotos.length - 1
              const gradient = projectGradients[index % projectGradients.length]

              return (
                <motion.div
                  key={project.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <article className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/30">
                    <div className={`pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gradient-to-br ${gradient} blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-80`} />

                    {heroImage ? (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={heroImage}
                          alt={project.name || "Project screenshot"}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-all duration-700 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => openLightbox(projectPhotos, 0)}
                          className="absolute inset-0 z-0"
                          aria-label="Open gallery"
                        />
                        {moreImagesCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openLightbox(projectPhotos, 1) }}
                            className="absolute bottom-3 right-3 rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                          >
                            +{moreImagesCount} more
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-secondary/50 to-secondary/20">
                        <Code2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    <div className="relative z-10 p-5 pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/30">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {project.projectType?.trim() && (
                          <>
                            <span className="text-muted-foreground/20">·</span>
                            <span className="project-type-badge">{project.projectType}</span>
                          </>
                        )}
                      </div>

                      <h3 className="break-words text-lg font-bold text-foreground [overflow-wrap:anywhere] transition-colors duration-300 group-hover:text-primary">
                        {project.name}
                      </h3>

                      {(project.startDate || project.endDate) && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {project.startDate}{project.startDate && project.endDate && " — "}{project.endDate}
                        </p>
                      )}

                      {project.description && (
                        <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                          {project.description}
                        </p>
                      )}
                      {project.description && project.description.length > 150 && (
                        <button
                          type="button"
                          onClick={() => openDescModal(project.description)}
                          className="mt-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          See more
                        </button>
                      )}

                      {project.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {project.skills.slice(0, 4).map((skill, skillIndex) => (
                            <span
                              key={`${project.id}-${skill}-${skillIndex}`}
                              className="skill-badge"
                            >
                              {skill}
                            </span>
                          ))}
                          {project.skills.length > 4 && (
                            <span className="inline-flex items-center rounded-xl border border-border/50 bg-secondary/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              +{project.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-2 border-t border-border/30 pt-4">
                        {project.gitlink && (
                          <a
                            href={project.gitlink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-sm"
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                            Source
                          </a>
                        )}
                        {project.weblink && (
                          <a
                            href={project.weblink}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:shadow-md"
                          >
                            Live Demo
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card md:col-span-2 xl:col-span-3 text-center text-muted-foreground">
              No projects yet. Use Edit Projects to add your work.
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Project screenshot"
          onClose={closeLightbox}
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}

      {descModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeDescModal() }}
        >
          <div className="pointer-events-none absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative max-h-[75vh] w-full max-w-xl overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-primary/15 via-purple-500/10 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-border/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-lg leading-none">📄</span>
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Description</h4>
                  <p className="text-[11px] text-muted-foreground">Project overview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeDescModal()}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/40 bg-secondary/40 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(75vh - 73px)" }}>
              <p className="text-sm leading-relaxed text-foreground/85">{descModal}</p>
            </div>

            <div className="border-t border-border/30 px-6 py-3">
              <button
                type="button"
                onClick={() => closeDescModal()}
                className="w-full rounded-xl bg-primary/10 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary/20"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
