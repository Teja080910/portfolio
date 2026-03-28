"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Calendar, ExternalLink, Github, Layers, PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type ProjectsProps = {
  isReadOnly?: boolean
}

export default function Projects({ isReadOnly = false }: ProjectsProps) {
  const projectsStore = useStore((state) => state.projects)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editProjectsHref = `/u/${encodeURIComponent(username || "me")}/edit-projects`
  const projects = projectsStore.filter((item) => item.show && (item.name || item.description || item.duration || item.skills.length))

  if (isReadOnly && projects.length === 0) {
    return null
  }

  return (
    <section id="projects" className="section-shell">
      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-4 flex justify-end">
            <Link
              href={editProjectsHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Projects
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="Projects" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {projects.length > 0 ? projects.map((project, index) => {
            const projectPhotos = (project.photos?.length ? project.photos : (project.logo ? [project.logo] : [])).filter(Boolean)

            return (
              <motion.article
                key={project.id || index}
                className="glass-card h-full"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
              {project.duration && (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4" />
                  {project.duration}
                </p>
              )}

              {project.description && (
                <p className="mt-4 text-slate-700 dark:text-slate-300">{project.description}</p>
              )}

              {projectPhotos.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {projectPhotos.map((photo, photoIndex) => (
                    <div key={`${project.id}-${photoIndex}`} className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100 dark:border-slate-700/70 dark:bg-slate-800/60">
                      <img
                        src={photo}
                        alt={`${project.name || "Project"} screenshot ${photoIndex + 1}`}
                        className="h-24 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}

              {project.skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.skills.map((skill, skillIndex) => (
                    <span
                      key={`${project.id}-${skill}-${skillIndex}`}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {project.gitlink && (
                  <a
                    href={project.gitlink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
                  >
                    <Github className="h-4 w-4" />
                    Source
                  </a>
                )}
                {project.weblink && (
                  <a
                    href={project.weblink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live Demo
                  </a>
                )}
              </div>
              </motion.article>
            )
          }) : (
            <div className="glass-card lg:col-span-2 text-center text-slate-600 dark:text-slate-300">
              No projects yet. Use Edit Projects to add your work.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
