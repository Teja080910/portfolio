"use client"

import { supabase } from "@/lib/db"
import { ICertificate, IEducation, IExperience, IProjects, ISkills } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

type Notice = { tone: "success" | "error"; message: string } | null

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-500"

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const toCsv = (items: string[]) => items.join(", ")
const fromCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export default function PortfolioContentForm() {
  const user = useStore((state) => state.user)
  const about = useStore((state) => state.about)
  const skillsStore = useStore((state) => state.skills)
  const projectsStore = useStore((state) => state.projects)
  const experienceStore = useStore((state) => state.experience)
  const educationStore = useStore((state) => state.education)
  const certificateStore = useStore((state) => state.certificate)

  const setAbout = useStore((state) => state.setAbout)
  const setSkills = useStore((state) => state.setSkills)
  const setProjects = useStore((state) => state.setProjects)
  const setExperience = useStore((state) => state.setExperience)
  const setEducation = useStore((state) => state.setEducation)
  const setCertificate = useStore((state) => state.setCertificate)

  const [aboutHeading, setAboutHeading] = useState(about.type || "")
  const [aboutBody, setAboutBody] = useState((about.list || []).join("\n"))
  const [aboutVisible, setAboutVisible] = useState(Boolean(about.show))

  const [skills, setSkillsDraft] = useState<ISkills[]>(skillsStore)
  const [projects, setProjectsDraft] = useState<IProjects[]>(projectsStore)
  const [experience, setExperienceDraft] = useState<IExperience[]>(experienceStore)
  const [education, setEducationDraft] = useState<IEducation[]>(educationStore)
  const [certificates, setCertificatesDraft] = useState<ICertificate[]>(certificateStore)
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setAboutHeading(about.type || "")
    setAboutBody((about.list || []).join("\n"))
    setAboutVisible(Boolean(about.show))
  }, [about])

  useEffect(() => {
    setSkillsDraft(skillsStore)
  }, [skillsStore])

  useEffect(() => {
    setProjectsDraft(projectsStore)
  }, [projectsStore])

  useEffect(() => {
    setExperienceDraft(experienceStore)
  }, [experienceStore])

  useEffect(() => {
    setEducationDraft(educationStore)
  }, [educationStore])

  useEffect(() => {
    setCertificatesDraft(certificateStore)
  }, [certificateStore])

  const saveContent = async () => {
    const person = user.id || ""

    if (!person) {
      setNotice({ tone: "error", message: "Sign in again before saving portfolio content." })
      return
    }

    setIsSaving(true)

    const aboutPayload = {
      id: about.id || createId(),
      person,
      type: aboutHeading.trim(),
      list: aboutBody
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      show: aboutVisible,
    }

    const skillsPayload = skills.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        skilltype: item.skilltype.trim(),
        skills: item.skills.map((skill) => skill.trim()).filter(Boolean),
        description: item.description.trim(),
      }))

    const projectsPayload = projects.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        name: item.name.trim(),
        description: item.description.trim(),
        duration: item.duration.trim(),
        gitlink: item.gitlink.trim(),
        weblink: item.weblink.trim(),
        logo: item.logo.trim(),
        skills: item.skills.map((skill) => skill.trim()).filter(Boolean),
      }))

    const experiencePayload = experience.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        type: item.type.trim(),
        location: item.location.trim(),
        duration: item.duration.trim(),
        role: item.role.trim(),
        decription: item.decription.trim(),
      }))

    const educationPayload = education.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        name: item.name.trim(),
        duration: item.duration.trim(),
        course: item.course.trim(),
        branch: item.branch.trim(),
        keyachivements: item.keyachivements.trim(),
      }))

    const certificatesPayload = certificates.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        name: item.name.trim(),
        duration: item.duration.trim(),
        link: item.link.trim(),
        photo: item.photo.trim(),
      }))

    setAbout(aboutPayload)
    setSkills(skillsPayload)
    setProjects(projectsPayload)
    setExperience(experiencePayload)
    setEducation(educationPayload)
    setCertificate(certificatesPayload)

    const { error } = await supabase.from("portfolio_contents").upsert(
      {
        user_id: person,
        about: aboutPayload,
        skills: skillsPayload,
        projects: projectsPayload,
        experience: experiencePayload,
        education: educationPayload,
        certificates: certificatesPayload,
      },
      { onConflict: "user_id" },
    )

    if (error) {
      setNotice({ tone: "error", message: error.message || "Portfolio content saved locally but not synced to cloud." })
      setIsSaving(false)
      return
    }

    setNotice({ tone: "success", message: "Portfolio content saved and synced to Supabase." })
    setIsSaving(false)
  }

  return (
    <motion.section
      id="portfolio-content"
      className="scroll-mt-28 mt-8 rounded-[2rem] border border-slate-200/70 bg-white/75 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75 md:p-8 lg:p-10"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 dark:border-slate-700/70 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="accent-chip">Edit Portfolio Content</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Manage what appears on your portfolio</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Update section content, visibility, and order from one place. Your homepage will reflect only the data you configure here.
          </p>
        </div>
        <button
          type="button"
          onClick={saveContent}
          disabled={isSaving}
          className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white ${
            isSaving ? "cursor-not-allowed opacity-75" : ""
          }`}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Portfolio Content"}
        </button>
      </div>

      {notice && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="mt-8 space-y-8">
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">About Section</h3>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={aboutVisible} onChange={(event) => setAboutVisible(event.target.checked)} />
              Show
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={aboutHeading}
              onChange={(event) => setAboutHeading(event.target.value)}
              className={inputClassName}
              placeholder="About heading"
            />
            <textarea
              value={aboutBody}
              onChange={(event) => setAboutBody(event.target.value)}
              rows={5}
              className={inputClassName}
              placeholder="Write one point per line"
            />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Skills</h3>
            <button
              type="button"
              onClick={() =>
                setSkillsDraft((prev) => [
                  ...prev,
                  { id: createId(), person: user.id || "", skilltype: "", skills: [], description: "", show: true },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Skill Group
            </button>
          </div>
          <div className="space-y-4">
            {skills.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Skill Group #{index + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.show}
                        onChange={(event) =>
                          setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)))
                        }
                      />
                      Show
                    </label>
                    <button
                      type="button"
                      onClick={() => setSkillsDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={item.skilltype}
                    onChange={(event) =>
                      setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skilltype: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Skill type"
                  />
                  <input
                    value={toCsv(item.skills)}
                    onChange={(event) =>
                      setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skills: fromCsv(event.target.value) } : row)))
                    }
                    className={inputClassName}
                    placeholder="React, Next.js, TypeScript"
                  />
                  <input
                    value={item.description}
                    onChange={(event) =>
                      setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Short description"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h3>
            <button
              type="button"
              onClick={() =>
                setProjectsDraft((prev) => [
                  ...prev,
                  {
                    id: createId(),
                    person: user.id || "",
                    name: "",
                    description: "",
                    duration: "",
                    gitlink: "",
                    weblink: "",
                    logo: "",
                    skills: [],
                    show: true,
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          </div>
          <div className="space-y-4">
            {projects.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Project #{index + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.show}
                        onChange={(event) =>
                          setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)))
                        }
                      />
                      Show
                    </label>
                    <button
                      type="button"
                      onClick={() => setProjectsDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Project name"
                  />
                  <input
                    value={item.duration}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, duration: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Duration"
                  />
                  <input
                    value={item.gitlink}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, gitlink: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="GitHub link"
                  />
                  <input
                    value={item.weblink}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, weblink: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Live demo link"
                  />
                  <input
                    value={toCsv(item.skills)}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skills: fromCsv(event.target.value) } : row)))
                    }
                    className={inputClassName}
                    placeholder="Tech stack (comma separated)"
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)))
                    }
                    className={inputClassName}
                    rows={3}
                    placeholder="Project description"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Experience</h3>
              <button
                type="button"
                onClick={() =>
                  setExperienceDraft((prev) => [
                    ...prev,
                    {
                      id: createId(),
                      person: user.id || "",
                      type: "",
                      location: "",
                      duration: "",
                      role: "",
                      decription: "",
                      show: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-4">
              {experience.map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.show}
                        onChange={(event) =>
                          setExperienceDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                          )
                        }
                      />
                      Show
                    </label>
                    <button
                      type="button"
                      onClick={() => setExperienceDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={item.type}
                      onChange={(event) =>
                        setExperienceDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, type: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Company / Type"
                    />
                    <input
                      value={item.role}
                      onChange={(event) =>
                        setExperienceDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, role: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Role"
                    />
                    <input
                      value={item.location}
                      onChange={(event) =>
                        setExperienceDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, location: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Location"
                    />
                    <input
                      value={item.duration}
                      onChange={(event) =>
                        setExperienceDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, duration: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Duration"
                    />
                    <textarea
                      value={item.decription}
                      onChange={(event) =>
                        setExperienceDraft((prev) =>
                          prev.map((row, rowIndex) => (rowIndex === index ? { ...row, decription: event.target.value } : row)),
                        )
                      }
                      rows={4}
                      className={inputClassName}
                      placeholder="Responsibilities. You can separate points with new lines."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Education</h3>
              <button
                type="button"
                onClick={() =>
                  setEducationDraft((prev) => [
                    ...prev,
                    {
                      id: createId(),
                      person: user.id || "",
                      name: "",
                      duration: "",
                      course: "",
                      branch: "",
                      keyachivements: "",
                      show: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-4">
              {education.map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.show}
                        onChange={(event) =>
                          setEducationDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                          )
                        }
                      />
                      Show
                    </label>
                    <button
                      type="button"
                      onClick={() => setEducationDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={item.name}
                      onChange={(event) =>
                        setEducationDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Institution"
                    />
                    <input
                      value={item.course}
                      onChange={(event) =>
                        setEducationDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, course: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Course / Degree"
                    />
                    <input
                      value={item.branch}
                      onChange={(event) =>
                        setEducationDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, branch: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Branch / Specialization"
                    />
                    <input
                      value={item.duration}
                      onChange={(event) =>
                        setEducationDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, duration: event.target.value } : row)))
                      }
                      className={inputClassName}
                      placeholder="Duration"
                    />
                    <textarea
                      value={item.keyachivements}
                      onChange={(event) =>
                        setEducationDraft((prev) =>
                          prev.map((row, rowIndex) => (rowIndex === index ? { ...row, keyachivements: event.target.value } : row)),
                        )
                      }
                      rows={4}
                      className={inputClassName}
                      placeholder="Key achievements"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Certificates</h3>
            <button
              type="button"
              onClick={() =>
                setCertificatesDraft((prev) => [
                  ...prev,
                  { id: createId(), person: user.id || "", name: "", duration: "", link: "", photo: "", show: true },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Certificate
            </button>
          </div>
          <div className="space-y-4">
            {certificates.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                <div className="mb-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={item.show}
                      onChange={(event) =>
                        setCertificatesDraft((prev) =>
                          prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                        )
                      }
                    />
                    Show
                  </label>
                  <button
                    type="button"
                    onClick={() => setCertificatesDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setCertificatesDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Certificate name"
                  />
                  <input
                    value={item.duration}
                    onChange={(event) =>
                      setCertificatesDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, duration: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Duration"
                  />
                  <input
                    value={item.link}
                    onChange={(event) =>
                      setCertificatesDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, link: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Credential URL"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
