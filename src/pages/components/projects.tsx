"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ExternalLink, GitBranch, PencilLine, X } from "lucide-react"
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
  const projects = projectsStore.filter((item) => item.show && (item.name || item.description || item.duration || item.skills.length))
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  if (isReadOnly && projects.length === 0) {
    return null
  }

  const projectColors = [
    "from-primary/10 via-purple-500/5 to-transparent",
    "from-purple-500/10 via-pink-500/5 to-transparent",
    "from-pink-500/10 via-rose-500/5 to-transparent",
    "from-cyan-500/10 via-primary/5 to-transparent",
    "from-amber-500/10 via-orange-500/5 to-transparent",
    "from-emerald-500/10 via-teal-500/5 to-transparent",
  ]

  return (
    <section id="projects" className="section-shell">
      {/* Background */}
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {projects.length > 0 ? (
            projects.map((project, index) => {
              const projectPhotos = (project.photos?.length ? project.photos : (project.logo ? [project.logo] : [])).filter(Boolean)
              const gradientClass = projectColors[index % projectColors.length]

              return (
                <motion.div
                  key={project.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <article className="glass-card group relative h-full overflow-hidden">
                    {/* Gradient accent */}
                    <div className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${gradientClass} blur-3xl`} />

                    <div className="relative z-10">
                      {/* Project number */}
                      <span className="absolute right-2 top-2 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/20">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="flex flex-wrap items-start gap-3">
                      {/* Project name */}
                      <h3 className="break-words text-xl font-bold text-foreground [overflow-wrap:anywhere] transition-colors duration-300 group-hover:text-primary">
                        {project.name}
                      </h3>
                      {/* Project type badge */}
                      {project.projectType?.trim() && (
                        <span className="project-type-badge">
                          {project.projectType}
                        </span>
                      )}
                      </div>

                      {/* Duration */}
                      {project.duration && (
                        <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                          {project.duration}
                        </p>
                      )}

                      {/* Description */}
                      {project.description && (
                        <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                          {project.description}
                        </p>
                      )}

                      {/* Photos */}
                      {projectPhotos.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {projectPhotos.slice(0, 3).map((photo, photoIndex) => (
                            <button
                              type="button"
                              key={`${project.id}-${photoIndex}`}
                              onClick={() => setLightboxSrc(photo)}
                              className="overflow-hidden rounded-xl border border-border/50 bg-secondary/30 text-left"
                            >
                              <div className="relative h-20 w-full overflow-hidden">
                                <Image
                                  src={photo}
                                  alt={`${project.name || "Project"} screenshot ${photoIndex + 1}`}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-500 hover:scale-110"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Skills */}
                      {project.skills.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {project.skills.map((skill, skillIndex) => (
                            <span
                              key={`${project.id}-${skill}-${skillIndex}`}
                              className="skill-badge"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      <div className="mt-6 flex flex-wrap gap-3">
                        {project.gitlink && (
                          <a
                            href={project.gitlink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-sm font-medium text-foreground/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                          >
                            <GitBranch className="h-4 w-4" />
                            Source
                          </a>
                        )}
                        {project.weblink && (
                          <a
                            href={project.weblink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card lg:col-span-2 text-center text-muted-foreground">
              No projects yet. Use Edit Projects to add your work.
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Project screenshot"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </section>
  )
}
