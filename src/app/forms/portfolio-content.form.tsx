"use client"

import { supabase } from "@/lib/db"
import { ICertificate, IEducation, IExperience, IProjects, ISkills } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { ChangeEvent, useEffect, useMemo, useState } from "react"

type Notice = { tone: "success" | "error"; message: string } | null
type PortfolioEditSection = "about" | "skills" | "projects" | "experience" | "education" | "certificate" | null

type PortfolioContentFormProps = {
  focusSection?: PortfolioEditSection
}

const PROJECT_PHOTOS_BUCKET = "profile-photos"
const MAX_PROJECT_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PROJECT_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 break-words [overflow-wrap:anywhere] dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-500"

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const toCsv = (items: string[]) => items.join(", ")
const normalizeSkillValues = (values: string[]) => {
  const normalized: string[] = []

  values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const exists = normalized.some((item) => item.toLowerCase() === value.toLowerCase())
      if (!exists) {
        normalized.push(value)
      }
    })

  return normalized
}

const fromCsv = (value: string) => normalizeSkillValues([value])

const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")

const normalizeProjectPhotos = (project: IProjects) => {
  const photos = Array.isArray(project.photos) ? project.photos.filter(Boolean) : []

  if (photos.length > 0) {
    return photos
  }

  return project.logo ? [project.logo] : []
}

const getStorageObjectPath = (photoUrl: string) => {
  try {
    const parsedUrl = new URL(photoUrl)
    const marker = `/storage/v1/object/public/${PROJECT_PHOTOS_BUCKET}/`
    const markerIndex = parsedUrl.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

const isProjectConfigured = (project: IProjects) =>
  Boolean(
    project.name.trim() ||
      project.description.trim() ||
      project.duration.trim() ||
      project.gitlink.trim() ||
      project.weblink.trim() ||
      project.skills.length ||
        project.logo.trim() ||
        normalizeProjectPhotos(project).length,
  )

export default function PortfolioContentForm({ focusSection = null }: PortfolioContentFormProps) {
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

  const [skills, setSkillsDraft] = useState<ISkills[]>(() =>
    skillsStore.map((item) => ({
      ...item,
      skills: normalizeSkillValues(item.skills),
    })),
  )
  const [projects, setProjectsDraft] = useState<IProjects[]>(projectsStore)
  const [experience, setExperienceDraft] = useState<IExperience[]>(experienceStore)
  const [education, setEducationDraft] = useState<IEducation[]>(educationStore)
  const [certificates, setCertificatesDraft] = useState<ICertificate[]>(certificateStore)
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingProjectPhotos, setIsUploadingProjectPhotos] = useState(false)
  const [activeSkillTypeRow, setActiveSkillTypeRow] = useState<number | null>(null)
  const [activeSkillValueRow, setActiveSkillValueRow] = useState<number | null>(null)
  const [activeSkillDescriptionRow, setActiveSkillDescriptionRow] = useState<number | null>(null)
  const [activeSkillTypeSuggestionIndex, setActiveSkillTypeSuggestionIndex] = useState(-1)
  const [activeSkillValueSuggestionIndex, setActiveSkillValueSuggestionIndex] = useState(-1)
  const [activeSkillDescriptionSuggestionIndex, setActiveSkillDescriptionSuggestionIndex] = useState(-1)
  const [skillValueInputDrafts, setSkillValueInputDrafts] = useState<Record<string, string>>({})

  const distinctSkillTypes = useMemo(
    () => Array.from(new Set(skills.map((item) => item.skilltype.trim()).filter(Boolean))),
    [skills],
  )

  const distinctSkillValues = useMemo(
    () => normalizeSkillValues(skills.flatMap((item) => item.skills)),
    [skills],
  )

  const distinctSkillDescriptions = useMemo(
    () => Array.from(new Set(skills.map((item) => item.description.trim()).filter(Boolean))),
    [skills],
  )

  const applySkillValueSuggestion = (rowIndex: number, rowKey: string, suggestedValue: string) => {
    const normalizedSuggestion = suggestedValue.trim()
    if (!normalizedSuggestion) {
      return
    }

    const row = skills[rowIndex]
    if (!row) {
      return
    }

    const nextSkills = [...row.skills, normalizedSuggestion]
    const dedupedSkills: string[] = []

    nextSkills.forEach((skill) => {
      const normalizedSkill = skill.trim()
      if (!normalizedSkill) {
        return
      }

      const isDuplicate = dedupedSkills.some((value) => value.toLowerCase() === normalizedSkill.toLowerCase())
      if (!isDuplicate) {
        dedupedSkills.push(normalizedSkill)
      }
    })

    setSkillsDraft((prev) =>
      prev.map((current, index) => (index === rowIndex ? { ...current, skills: dedupedSkills } : current)),
    )
    setSkillValueInputDrafts((prev) => ({ ...prev, [rowKey]: toCsv(dedupedSkills) }))
  }

  useEffect(() => {
    setAboutHeading(about.type || "")
    setAboutBody((about.list || []).join("\n"))
    setAboutVisible(Boolean(about.show))
  }, [about])

  useEffect(() => {
    setSkillsDraft(
      skillsStore.map((item) => ({
        ...item,
        skills: normalizeSkillValues(item.skills),
      })),
    )
    setSkillValueInputDrafts({})
  }, [skillsStore])

  useEffect(() => {
    setProjectsDraft(projectsStore)
  }, [projectsStore])

  const handleProjectPhotoUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const person = user.id || ""

    if (!files.length) {
      return
    }

    if (!person) {
      setNotice({ tone: "error", message: "Sign in again before uploading project photos." })
      event.target.value = ""
      return
    }

    const invalidFile = files.find(
      (file) => !ALLOWED_PROJECT_PHOTO_TYPES.includes(file.type) || file.size > MAX_PROJECT_PHOTO_SIZE,
    )

    if (invalidFile) {
      setNotice({
        tone: "error",
        message: "Only JPG, PNG, or WEBP files up to 5 MB are allowed.",
      })
      event.target.value = ""
      return
    }

    const projectId = projects[index]?.id || createId()
    setIsUploadingProjectPhotos(true)

    try {
      const uploadedUrls: string[] = []

      for (const [fileIndex, file] of files.entries()) {
        const fileExtension = file.name.includes(".") ? file.name.split(".").pop() : undefined
        const safeFileName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "project-photo"
        const objectPath = `${person}/projects/${projectId}/${Date.now()}-${fileIndex}-${safeFileName}${
          fileExtension ? `.${fileExtension.toLowerCase()}` : ""
        }`

        const { error: uploadError } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

        if (uploadError) {
          throw new Error(uploadError.message || "Project photo upload failed.")
        }

        const { data } = supabase.storage.from(PROJECT_PHOTOS_BUCKET).getPublicUrl(objectPath)
        uploadedUrls.push(data.publicUrl)
      }

      setProjectsDraft((prev) =>
        prev.map((row, rowIndex) => {
          if (rowIndex !== index) {
            return row
          }

          const mergedPhotos = Array.from(new Set([...normalizeProjectPhotos(row), ...uploadedUrls]))

          return {
            ...row,
            id: row.id || projectId,
            photos: mergedPhotos,
            logo: mergedPhotos[0] ?? "",
          }
        }),
      )

      setNotice({
        tone: "success",
        message: `${uploadedUrls.length} project photo${uploadedUrls.length > 1 ? "s" : ""} uploaded.`,
      })
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Project photo upload failed.",
      })
    } finally {
      setIsUploadingProjectPhotos(false)
      event.target.value = ""
    }
  }

  const handleProjectPhotoRemove = async (index: number, photoUrl: string) => {
    const objectPath = getStorageObjectPath(photoUrl)

    if (objectPath) {
      await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([objectPath])
    }

    setProjectsDraft((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row
        }

        const nextPhotos = normalizeProjectPhotos(row).filter((photo) => photo !== photoUrl)
        return {
          ...row,
          photos: nextPhotos,
          logo: nextPhotos[0] ?? "",
        }
      }),
    )
  }

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

    const invalidProjectIndex = projects.findIndex((item) => {
      const normalizedPhotos = normalizeProjectPhotos(item)
      return isProjectConfigured(item) && normalizedPhotos.length < 3
    })

    if (invalidProjectIndex !== -1) {
      setNotice({ tone: "error", message: `Project #${invalidProjectIndex + 1} needs at least 3 photos.` })
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
        skills: normalizeSkillValues(item.skills),
        description: item.description.trim(),
      }))

    const projectsPayload = projects.map((item) => {
      const normalizedPhotos = normalizeProjectPhotos(item)

        return {
          ...item,
          id: item.id || createId(),
          person,
          name: item.name.trim(),
          description: item.description.trim(),
          duration: item.duration.trim(),
          gitlink: item.gitlink.trim(),
          weblink: item.weblink.trim(),
          logo: normalizedPhotos[0] ?? item.logo.trim(),
          photos: normalizedPhotos,
          skills: item.skills.map((skill) => skill.trim()).filter(Boolean),
        }
      })

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

  const showAllSections = focusSection === null
  const showAboutEditor = showAllSections || focusSection === "about"
  const showSkillsEditor = showAllSections || focusSection === "skills"
  const showProjectsEditor = showAllSections || focusSection === "projects"
  const showExperienceEditor = showAllSections || focusSection === "experience"
  const showEducationEditor = showAllSections || focusSection === "education"
  const showCertificateEditor = showAllSections || focusSection === "certificate"

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
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            scroll={false}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 transition-transform duration-300 hover:-translate-y-0.5 dark:border-slate-600 dark:bg-slate-950/35 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Portfolio
          </Link>
          <button
            type="button"
            onClick={saveContent}
            disabled={isSaving}
            className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white ${
              isSaving ? "cursor-not-allowed opacity-75" : ""
            }`}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : `Save ${focusSection ? focusSection.charAt(0).toUpperCase() + focusSection.slice(1) : "Portfolio Content"}`}
          </button>
        </div>
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
        {showAboutEditor && <div id="edit-about" className="glass-card scroll-mt-28 p-6">
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
        </div>}

        {showSkillsEditor && <div id="edit-skills" className="glass-card scroll-mt-28 p-6">
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
            {skills.map((item, index) => {
              const skillRowKey = item.id || `skill-row-${index}`
              const normalizedRowSkills = normalizeSkillValues(item.skills)
              const skillValuesInput = skillValueInputDrafts[skillRowKey] ?? toCsv(normalizedRowSkills)
              const filteredSkillTypeSuggestions = distinctSkillTypes
                .filter((type) => type.toLowerCase().includes(item.skilltype.trim().toLowerCase()))
                .slice(0, 8)
              const filteredSkillValueSuggestions = distinctSkillValues
                .filter((value) => {
                  const currentInputTokens = normalizeSkillValues([skillValuesInput])
                  const currentInput = skillValuesInput
                  const lastToken = currentInput.split(",").pop()?.trim().toLowerCase() || ""
                  if (!lastToken) {
                    return false
                  }

                  const alreadyAdded = currentInputTokens.some((skill) => skill.toLowerCase() === value.toLowerCase())
                  return !alreadyAdded && value.toLowerCase().includes(lastToken)
                })
                .slice(0, 8)
              const filteredSkillDescriptionSuggestions = distinctSkillDescriptions
                .filter((description) => description.toLowerCase().includes(item.description.trim().toLowerCase()))
                .slice(0, 8)
              const isDropdownActiveForRow =
                activeSkillTypeRow === index || activeSkillValueRow === index || activeSkillDescriptionRow === index

              return (
              <div
                key={item.id || index}
                className={`relative overflow-visible rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80 ${
                  isDropdownActiveForRow ? "z-40" : "z-0"
                }`}
              >
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
                  <div className="relative">
                    <input
                      value={item.skilltype}
                      onFocus={() => {
                        setActiveSkillTypeRow(index)
                        setActiveSkillTypeSuggestionIndex(-1)
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setActiveSkillTypeRow((current) => (current === index ? null : current))
                          setActiveSkillTypeSuggestionIndex(-1)
                        }, 120)
                      }}
                      onChange={(event) =>
                        {
                          setActiveSkillTypeSuggestionIndex(-1)
                          setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skilltype: event.target.value } : row)))
                        }
                      }
                      onKeyDown={(event) => {
                        if (filteredSkillTypeSuggestions.length === 0) {
                          return
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault()
                          setActiveSkillTypeSuggestionIndex((previous) =>
                            previous < filteredSkillTypeSuggestions.length - 1 ? previous + 1 : 0,
                          )
                          return
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault()
                          setActiveSkillTypeSuggestionIndex((previous) =>
                            previous > 0 ? previous - 1 : filteredSkillTypeSuggestions.length - 1,
                          )
                          return
                        }

                        if (event.key === "Enter" && activeSkillTypeSuggestionIndex >= 0) {
                          event.preventDefault()
                          const selected = filteredSkillTypeSuggestions[activeSkillTypeSuggestionIndex]
                          if (!selected) {
                            return
                          }

                          setSkillsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skilltype: selected } : row)),
                          )
                          setActiveSkillTypeRow(null)
                          setActiveSkillTypeSuggestionIndex(-1)
                          return
                        }

                        if (event.key === "Escape") {
                          event.preventDefault()
                          setActiveSkillTypeRow(null)
                          setActiveSkillTypeSuggestionIndex(-1)
                        }
                      }}
                      className={inputClassName}
                      placeholder="Skill type"
                    />
                    {activeSkillTypeRow === index && filteredSkillTypeSuggestions.length > 0 && (
                      <div className="absolute z-[90] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
                        {filteredSkillTypeSuggestions.map((type, suggestionIndex) => (
                            <button
                              key={`${item.id || index}-skilltype-suggestion-${type}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                setSkillsDraft((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skilltype: type } : row)),
                                )
                                setActiveSkillTypeRow(null)
                                setActiveSkillTypeSuggestionIndex(-1)
                              }}
                              className={`block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors dark:text-slate-200 ${
                                suggestionIndex === activeSkillTypeSuggestionIndex
                                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                                  : "hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-300"
                              }`}
                            >
                              {type}
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      value={skillValuesInput}
                      onFocus={() => {
                        setActiveSkillValueRow(index)
                        setActiveSkillValueSuggestionIndex(-1)
                        setSkillValueInputDrafts((prev) => ({
                          ...prev,
                          [skillRowKey]: prev[skillRowKey] ?? toCsv(normalizedRowSkills),
                        }))
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setActiveSkillValueRow((current) => (current === index ? null : current))
                          setActiveSkillValueSuggestionIndex(-1)
                        }, 120)
                      }}
                      onChange={(event) => {
                        const inputValue = event.target.value
                        setActiveSkillValueSuggestionIndex(-1)
                        setSkillValueInputDrafts((prev) => ({ ...prev, [skillRowKey]: inputValue }))
                        setSkillsDraft((prev) =>
                          prev.map((row, rowIndex) => (rowIndex === index ? { ...row, skills: fromCsv(inputValue) } : row)),
                        )
                      }}
                      onKeyDown={(event) => {
                        if (filteredSkillValueSuggestions.length === 0) {
                          return
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault()
                          setActiveSkillValueSuggestionIndex((previous) =>
                            previous < filteredSkillValueSuggestions.length - 1 ? previous + 1 : 0,
                          )
                          return
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault()
                          setActiveSkillValueSuggestionIndex((previous) =>
                            previous > 0 ? previous - 1 : filteredSkillValueSuggestions.length - 1,
                          )
                          return
                        }

                        if (event.key === "Enter" && activeSkillValueSuggestionIndex >= 0) {
                          event.preventDefault()
                          const selected = filteredSkillValueSuggestions[activeSkillValueSuggestionIndex]
                          if (!selected) {
                            return
                          }

                          applySkillValueSuggestion(index, skillRowKey, selected)
                          setActiveSkillValueRow(null)
                          setActiveSkillValueSuggestionIndex(-1)
                          return
                        }

                        if (event.key === "Escape") {
                          event.preventDefault()
                          setActiveSkillValueRow(null)
                          setActiveSkillValueSuggestionIndex(-1)
                        }
                      }}
                      className={inputClassName}
                      placeholder="React, Next.js, TypeScript"
                    />
                    {activeSkillValueRow === index && filteredSkillValueSuggestions.length > 0 && (
                      <div className="absolute z-[90] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
                        {filteredSkillValueSuggestions.map((value, suggestionIndex) => (
                            <button
                              key={`${item.id || index}-skillvalue-suggestion-${value}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                applySkillValueSuggestion(index, skillRowKey, value)
                                setActiveSkillValueRow(null)
                                setActiveSkillValueSuggestionIndex(-1)
                              }}
                              className={`block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors dark:text-slate-200 ${
                                suggestionIndex === activeSkillValueSuggestionIndex
                                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                                  : "hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-300"
                              }`}
                            >
                              {value}
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      value={item.description}
                      onFocus={() => {
                        setActiveSkillDescriptionRow(index)
                        setActiveSkillDescriptionSuggestionIndex(-1)
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setActiveSkillDescriptionRow((current) => (current === index ? null : current))
                          setActiveSkillDescriptionSuggestionIndex(-1)
                        }, 120)
                      }}
                      onChange={(event) => {
                        setActiveSkillDescriptionSuggestionIndex(-1)
                        setSkillsDraft((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)))
                      }}
                      onKeyDown={(event) => {
                        if (filteredSkillDescriptionSuggestions.length === 0) {
                          return
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault()
                          setActiveSkillDescriptionSuggestionIndex((previous) =>
                            previous < filteredSkillDescriptionSuggestions.length - 1 ? previous + 1 : 0,
                          )
                          return
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault()
                          setActiveSkillDescriptionSuggestionIndex((previous) =>
                            previous > 0 ? previous - 1 : filteredSkillDescriptionSuggestions.length - 1,
                          )
                          return
                        }

                        if (event.key === "Enter" && activeSkillDescriptionSuggestionIndex >= 0) {
                          event.preventDefault()
                          const selected = filteredSkillDescriptionSuggestions[activeSkillDescriptionSuggestionIndex]
                          if (!selected) {
                            return
                          }

                          setSkillsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: selected } : row)),
                          )
                          setActiveSkillDescriptionRow(null)
                          setActiveSkillDescriptionSuggestionIndex(-1)
                          return
                        }

                        if (event.key === "Escape") {
                          event.preventDefault()
                          setActiveSkillDescriptionRow(null)
                          setActiveSkillDescriptionSuggestionIndex(-1)
                        }
                      }}
                      className={inputClassName}
                      placeholder="Short description"
                    />
                    {activeSkillDescriptionRow === index && filteredSkillDescriptionSuggestions.length > 0 && (
                      <div className="absolute z-[90] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
                        {filteredSkillDescriptionSuggestions.map((description, suggestionIndex) => (
                            <button
                              key={`${item.id || index}-skilldescription-suggestion-${description}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                setSkillsDraft((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description } : row)),
                                )
                                setActiveSkillDescriptionRow(null)
                                setActiveSkillDescriptionSuggestionIndex(-1)
                              }}
                              className={`block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors dark:text-slate-200 ${
                                suggestionIndex === activeSkillDescriptionSuggestionIndex
                                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
                                  : "hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-300"
                              }`}
                            >
                              {description}
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>}

        {showProjectsEditor && <div id="edit-projects" className="glass-card scroll-mt-28 p-6">
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
                    photos: [],
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
                  <div className="md:col-span-2">
                    <input
                      type="file"
                      accept={ALLOWED_PROJECT_PHOTO_TYPES.join(",")}
                      multiple
                      onChange={(event) => {
                        void handleProjectPhotoUpload(index, event)
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-cyan-500 disabled:opacity-70 dark:text-slate-300"
                      disabled={isSaving || isUploadingProjectPhotos}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Upload photos directly. Minimum 3 photos per project, and you can add more than 10.
                    </p>
                    {normalizeProjectPhotos(item).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {normalizeProjectPhotos(item).map((photo, photoIndex) => (
                          <div
                            key={`${item.id || index}-photo-${photoIndex}`}
                            className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/40"
                          >
                            <img
                              src={photo}
                              alt={`Project ${index + 1} photo ${photoIndex + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                void handleProjectPhotoRemove(index, photo)
                              }}
                              className="w-full border-t border-slate-200/80 bg-white/80 px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {(showExperienceEditor || showEducationEditor || showCertificateEditor) && (
          <div className="grid gap-8 lg:grid-cols-2">
          {showExperienceEditor && <div id="edit-experience" className="glass-card scroll-mt-28 p-6">
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
          </div>}

          {showEducationEditor && <div id="edit-education" className="glass-card scroll-mt-28 p-6">
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
          </div>}

          {showCertificateEditor && (
            <div id="edit-certificate" className="glass-card scroll-mt-28 p-6">
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
                          setCertificatesDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Certificate name"
                      />
                      <input
                        value={item.duration}
                        onChange={(event) =>
                          setCertificatesDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, duration: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Duration"
                      />
                      <input
                        value={item.link}
                        onChange={(event) =>
                          setCertificatesDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, link: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Credential URL"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </motion.section>
  )
}
