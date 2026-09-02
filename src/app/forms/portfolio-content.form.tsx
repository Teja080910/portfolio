"use client"

import {
  ABOUT_HIGHLIGHT_ICONS,
  asBoolean,
  asString,
  createId,
  mapAboutContent,
  mapCertificatesContent,
  mapCollaborationsContent,
  mapContentChannelsContent,
  mapContentWorksContent,
  mapCreatorToolsContent,
  mapEducationContent,
  mapExperienceContent,
  mapProjectsContent,
  mapSkillsContent,
  normalizeProjectPhotos,
  normalizeSkillValues,
  parseProjectTypes,
} from "@/lib/content-mappers"
import { supabase } from "@/lib/db"
import { detectLink, getPlatformLabel } from "@/lib/detect-link"
import { getCurrentSession } from "@/lib/auth-session"
import { getFriendlySupabaseError } from "@/utils/supabase-error"
import { AboutHighlightIcon, IAboutHighlight, ICertificate, ICollaboration, IContentChannel, IContentWork, ICreatorTool, IEducation, IExperience, IProjects, ISkills } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import Image from "next/image"
import { motion } from "framer-motion"
import DatePicker from "@/components/ui/date-picker"
import { ArrowDown, ArrowLeft, ArrowUp, Compass, Plus, Rocket, Save, Sparkles, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"

type Notice = { tone: "success" | "error"; message: string } | null
type PortfolioEditSection = "about" | "skills" | "projects" | "experience" | "education" | "certificate" | "content_channels" | "content_portfolio" | "collaborations" | "creator_tools" | null

type PortfolioContentFormProps = {
  focusSection?: PortfolioEditSection
}

const PROJECT_PHOTOS_BUCKET = "profile-photos"
const MAX_PROJECT_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PROJECT_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]
type HighlightPackTemplate = "software" | "content_creator" | "marketer"

const ABOUT_HIGHLIGHT_TEMPLATES: Array<Pick<IAboutHighlight, "title" | "description" | "icon"> & { for: HighlightPackTemplate[] }> = [
  {
    title: "Product Thinking",
    description: "I focus on user outcomes and business impact, not just feature delivery.",
    icon: "compass",
    for: ["software"],
  },
  {
    title: "Fast Delivery",
    description: "I ship in short iterations with clear milestones and continuous feedback.",
    icon: "rocket",
    for: ["software"],
  },
  {
    title: "Team Collaboration",
    description: "I work closely with designers, founders, and engineers to keep momentum high.",
    icon: "users",
    for: ["software"],
  },
  {
    title: "Modern Stack",
    description: "Building with current web patterns, automation, and scalable architecture.",
    icon: "sparkles",
    for: ["software"],
  },
  {
    title: "Performance First",
    description: "I optimize for speed, accessibility, and clean user interactions.",
    icon: "rocket",
    for: ["software"],
  },
  {
    title: "Continuous Learning",
    description: "I adapt quickly and keep upgrading my toolkit as tech evolves.",
    icon: "sparkles",
    for: ["software"],
  },
  {
    title: "Audience First",
    description: "I create content that resonates with my audience and drives engagement.",
    icon: "compass",
    for: ["content_creator"],
  },
  {
    title: "Brand Storytelling",
    description: "I craft authentic narratives that connect brands with their communities.",
    icon: "sparkles",
    for: ["content_creator"],
  },
  {
    title: "Multi-Platform Reach",
    description: "I optimize content for every platform to maximize visibility and growth.",
    icon: "rocket",
    for: ["content_creator"],
  },
  {
    title: "Community Builder",
    description: "I foster engaged communities through consistent, valuable content.",
    icon: "users",
    for: ["content_creator"],
  },
  {
    title: "Data-Driven",
    description: "I use analytics and insights to refine strategies and maximize ROI.",
    icon: "compass",
    for: ["marketer"],
  },
  {
    title: "Growth Focused",
    description: "I design campaigns that drive measurable business results.",
    icon: "rocket",
    for: ["marketer"],
  },
  {
    title: "Channel Expert",
    description: "I leverage the right channels to reach target audiences effectively.",
    icon: "sparkles",
    for: ["marketer"],
  },
  {
    title: "Campaign Strategy",
    description: "I plan and execute multi-channel campaigns that deliver impact.",
    icon: "users",
    for: ["marketer"],
  },
]

const ABOUT_HIGHLIGHT_PACKS: Array<{
  id: string
  label: string
  for: HighlightPackTemplate[]
  templates: Array<Pick<IAboutHighlight, "title" | "description" | "icon">>
}> = [
  {
    id: "frontend",
    label: "Frontend Developer",
    for: ["software"],
    templates: [
      { title: "UI Craft", description: "I build polished, responsive interfaces with clear visual hierarchy.", icon: "sparkles" },
      { title: "Performance First", description: "I optimize loading, interactions, and accessibility from day one.", icon: "rocket" },
      { title: "Product Thinking", description: "I prioritize user outcomes and conversion-focused experiences.", icon: "compass" },
    ],
  },
  {
    id: "backend",
    label: "Backend Developer",
    for: ["software"],
    templates: [
      { title: "Scalable Systems", description: "I design APIs and services that stay reliable as usage grows.", icon: "rocket" },
      { title: "Clean Architecture", description: "I focus on maintainable structure, observability, and consistency.", icon: "compass" },
      { title: "Team Collaboration", description: "I work closely with frontend and product teams for end-to-end delivery.", icon: "users" },
    ],
  },
  {
    id: "freelancer",
    label: "Freelancer",
    for: ["software"],
    templates: [
      { title: "Client Focused", description: "I align technical decisions with each client\'s business goals.", icon: "users" },
      { title: "Fast Delivery", description: "I ship quickly with transparent updates and clear milestones.", icon: "rocket" },
      { title: "Modern Stack", description: "I use practical, modern tools to keep projects future-ready.", icon: "sparkles" },
    ],
  },
  {
    id: "student",
    label: "Student",
    for: ["software"],
    templates: [
      { title: "Learning by Building", description: "I turn concepts into real projects to deepen practical skills.", icon: "sparkles" },
      { title: "Growth Mindset", description: "I continuously learn new technologies and improve my problem solving.", icon: "compass" },
      { title: "Project Execution", description: "I complete projects with focus on quality, deadlines, and iteration.", icon: "rocket" },
    ],
  },
  {
    id: "founder",
    label: "Startup Founder",
    for: ["software"],
    templates: [
      { title: "Vision to Product", description: "I turn ideas into working products with measurable user value.", icon: "compass" },
      { title: "Ship and Learn", description: "I launch fast, collect feedback, and improve through rapid cycles.", icon: "rocket" },
      { title: "Cross-Functional Leadership", description: "I collaborate across design, engineering, and growth to move fast.", icon: "users" },
    ],
  },
  {
    id: "youtuber",
    label: "YouTuber",
    for: ["content_creator"],
    templates: [
      { title: "Video Storytelling", description: "I craft compelling video narratives that keep viewers watching.", icon: "sparkles" },
      { title: "Audience Growth", description: "I build loyal audiences through consistent, valuable content.", icon: "rocket" },
      { title: "Brand Voice", description: "I develop authentic brand identities that resonate with communities.", icon: "compass" },
    ],
  },
  {
    id: "blogger",
    label: "Blogger",
    for: ["content_creator"],
    templates: [
      { title: "SEO Content", description: "I write content that ranks and drives organic traffic consistently.", icon: "compass" },
      { title: "Engaging Writing", description: "I create content that informs, entertains, and converts readers.", icon: "sparkles" },
      { title: "Content Strategy", description: "I plan editorial calendars and content funnels that deliver results.", icon: "rocket" },
    ],
  },
  {
    id: "social_media",
    label: "Social Media Creator",
    for: ["content_creator"],
    templates: [
      { title: "Viral Content", description: "I create shareable content that captures attention fast.", icon: "rocket" },
      { title: "Community Builder", description: "I foster engaged communities through authentic interactions.", icon: "users" },
      { title: "Trend Navigator", description: "I stay ahead of trends and adapt content for maximum reach.", icon: "sparkles" },
    ],
  },
  {
    id: "podcaster",
    label: "Podcaster",
    for: ["content_creator"],
    templates: [
      { title: "Audio Storytelling", description: "I create immersive audio experiences that listeners love.", icon: "compass" },
      { title: "Interview Mastery", description: "I bring out the best in guests through thoughtful conversations.", icon: "users" },
      { title: "Consistent Output", description: "I maintain a regular publishing schedule that builds loyalty.", icon: "rocket" },
    ],
  },
  {
    id: "seo_specialist",
    label: "SEO Specialist",
    for: ["marketer"],
    templates: [
      { title: "Search Visibility", description: "I optimize content and sites to rank higher and drive organic growth.", icon: "compass" },
      { title: "Keyword Strategy", description: "I research and target keywords that drive qualified traffic.", icon: "sparkles" },
      { title: "Technical SEO", description: "I ensure sites are fast, crawlable, and search-engine friendly.", icon: "rocket" },
    ],
  },
  {
    id: "social_media_manager",
    label: "Social Media Manager",
    for: ["marketer"],
    templates: [
      { title: "Engagement Driver", description: "I build brand presence through strategic social media campaigns.", icon: "users" },
      { title: "Content Calendar", description: "I plan and execute consistent, on-brand social content.", icon: "rocket" },
      { title: "Platform Expert", description: "I leverage each platform's strengths for maximum impact.", icon: "compass" },
    ],
  },
  {
    id: "growth_marketer",
    label: "Growth Marketer",
    for: ["marketer"],
    templates: [
      { title: "Experimentation", description: "I run rapid tests and iterate on what drives measurable growth.", icon: "rocket" },
      { title: "Funnel Optimization", description: "I optimize every stage of the customer journey for conversion.", icon: "compass" },
      { title: "Data-Led Decisions", description: "I use metrics and analytics to guide marketing strategy.", icon: "sparkles" },
    ],
  },
]

const aboutPreviewIcons: Record<AboutHighlightIcon, typeof Compass> = {
  compass: Compass,
  rocket: Rocket,
  users: Users,
  sparkles: Sparkles,
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 break-words [overflow-wrap:anywhere] dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-500"

const toCsv = (items: string[] | undefined) => (items && Array.isArray(items) ? items.join(", ") : "")

const fromCsv = (value: string) => normalizeSkillValues([value])

const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")

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
      (Array.isArray(project.skills) && project.skills.length) ||
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
  const contentChannelsStore = useStore((state) => state.contentChannels)
  const contentWorksStore = useStore((state) => state.contentWorks)
  const collaborationsStore = useStore((state) => state.collaborations)
  const creatorToolsStore = useStore((state) => state.creatorTools)

  const setAbout = useStore((state) => state.setAbout)
  const setSkills = useStore((state) => state.setSkills)
  const setProjects = useStore((state) => state.setProjects)
  const setExperience = useStore((state) => state.setExperience)
  const setEducation = useStore((state) => state.setEducation)
  const setCertificate = useStore((state) => state.setCertificate)
  const setContentChannels = useStore((state) => state.setContentChannels)
  const setContentWorks = useStore((state) => state.setContentWorks)
  const setCollaborations = useStore((state) => state.setCollaborations)
  const setCreatorTools = useStore((state) => state.setCreatorTools)
  const setUser = useStore((state) => state.setUser)
  const hasHydratedRef = useRef(false)
  const skillSyncDoneRef = useRef(false)
  const projectSyncDoneRef = useRef(false)
  const experienceSyncDoneRef = useRef(false)
  const educationSyncDoneRef = useRef(false)
  const certificateSyncDoneRef = useRef(false)
  const contentChannelsSyncDoneRef = useRef(false)
  const contentWorksSyncDoneRef = useRef(false)
  const collaborationsSyncDoneRef = useRef(false)
  const creatorToolsSyncDoneRef = useRef(false)
  const initialSyncRef = useRef(false)

  const [aboutHeading, setAboutHeading] = useState(about.type || "")
  const [aboutBody, setAboutBody] = useState((about.list || []).join("\n"))
  const [aboutVisible, setAboutVisible] = useState(Boolean(about.show))
  const [selectedAboutPackId, setSelectedAboutPackId] = useState(() => {
    const tpl = user.template || "software"
    const firstMatch = ABOUT_HIGHLIGHT_PACKS.find((p) => p.for.includes(tpl as HighlightPackTemplate))
    return firstMatch?.id || ABOUT_HIGHLIGHT_PACKS[0]?.id || ""
  })
  const [aboutHighlights, setAboutHighlights] = useState<IAboutHighlight[]>(
    about.highlights?.length
      ? about.highlights
      : [
          { id: createId(), title: "", description: "", icon: "compass", show: true },
          { id: createId(), title: "", description: "", icon: "rocket", show: true },
          { id: createId(), title: "", description: "", icon: "users", show: true },
        ],
  )

  const [skills, setSkillsDraft] = useState<ISkills[]>(() => {
    if (skillsStore.length > 0) {
      skillSyncDoneRef.current = true
    }
    return skillsStore.map((item) => ({
      ...item,
      skills: normalizeSkillValues(item.skills),
    }))
  })
  const [projects, setProjectsDraft] = useState<IProjects[]>(() => {
    if (projectsStore.length > 0) {
      projectSyncDoneRef.current = true
    }
    return projectsStore
  })
  const [experience, setExperienceDraft] = useState<IExperience[]>(() => {
    if (experienceStore.length > 0) {
      experienceSyncDoneRef.current = true
    }
    return experienceStore
  })
  const [education, setEducationDraft] = useState<IEducation[]>(() => {
    if (educationStore.length > 0) {
      educationSyncDoneRef.current = true
    }
    return educationStore
  })
  const [certificates, setCertificatesDraft] = useState<ICertificate[]>(() => {
    if (certificateStore.length > 0) {
      certificateSyncDoneRef.current = true
    }
    return certificateStore
  })
  const [contentChannelsDraft, setContentChannelsDraft] = useState<IContentChannel[]>(() => {
    if (contentChannelsStore.length > 0) {
      contentChannelsSyncDoneRef.current = true
    }
    return contentChannelsStore
  })
  const [contentWorksDraft, setContentWorksDraft] = useState<IContentWork[]>(() => {
    if (contentWorksStore.length > 0) {
      contentWorksSyncDoneRef.current = true
    }
    return contentWorksStore
  })
  const [collaborationsDraft, setCollaborationsDraft] = useState<ICollaboration[]>(() => {
    if (collaborationsStore.length > 0) {
      collaborationsSyncDoneRef.current = true
    }
    return collaborationsStore
  })
  const [creatorToolsDraft, setCreatorToolsDraft] = useState<ICreatorTool[]>(() => {
    if (creatorToolsStore.length > 0) {
      creatorToolsSyncDoneRef.current = true
    }
    return creatorToolsStore
  })
  const [notice, setNotice] = useState<Notice>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingProjectPhotos, setIsUploadingProjectPhotos] = useState(false)
  const [isUploadingContentMedia, setIsUploadingContentMedia] = useState(false)
  const [activeSkillTypeRow, setActiveSkillTypeRow] = useState<number | null>(null)
  const [activeSkillValueRow, setActiveSkillValueRow] = useState<number | null>(null)
  const [activeSkillDescriptionRow, setActiveSkillDescriptionRow] = useState<number | null>(null)
  const [activeSkillTypeSuggestionIndex, setActiveSkillTypeSuggestionIndex] = useState(-1)
  const [activeSkillValueSuggestionIndex, setActiveSkillValueSuggestionIndex] = useState(-1)
  const [activeSkillDescriptionSuggestionIndex, setActiveSkillDescriptionSuggestionIndex] = useState(-1)
  const [skillValueInputDrafts, setSkillValueInputDrafts] = useState<Record<string, string>>({})
  const [projectSkillInputDrafts, setProjectSkillInputDrafts] = useState<Record<string, string>>({})

  const distinctSkillTypes = useMemo(
    () => Array.from(new Set(skills.map((item) => (item.skilltype || "").trim()).filter(Boolean))),
    [skills],
  )

  const distinctSkillValues = useMemo(
    () => normalizeSkillValues(skills.flatMap((item) => item.skills || [])),
    [skills],
  )

  const distinctSkillDescriptions = useMemo(
    () => Array.from(new Set(skills.map((item) => (item.description || "").trim()).filter(Boolean))),
    [skills],
  )

  const currentTemplate: HighlightPackTemplate = (user.template || "software") as HighlightPackTemplate
  const filteredAboutPacks = useMemo(
    () => ABOUT_HIGHLIGHT_PACKS.filter((pack) => pack.for.includes(currentTemplate)),
    [currentTemplate],
  )
  const filteredAboutTemplates = useMemo(
    () => ABOUT_HIGHLIGHT_TEMPLATES.filter((tpl) => tpl.for.includes(currentTemplate)),
    [currentTemplate],
  )
  const selectedAboutPack = useMemo(
    () => ABOUT_HIGHLIGHT_PACKS.find((pack) => pack.id === selectedAboutPackId) || filteredAboutPacks[0] || ABOUT_HIGHLIGHT_PACKS[0],
    [selectedAboutPackId, filteredAboutPacks],
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

    const nextSkills = [...(row.skills || []), normalizedSuggestion]
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

  const applyAboutHighlightTemplate = (template: Pick<IAboutHighlight, "title" | "description" | "icon">) => {
    setAboutHighlights((prev) => {
      const existingIndex = prev.findIndex((item) => item.title.trim().toLowerCase() === template.title.toLowerCase())

      if (existingIndex !== -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                title: template.title,
                description: template.description,
                icon: template.icon,
                show: true,
              }
            : item,
        )
      }

      return [
        ...prev,
        {
          id: createId(),
          title: template.title,
          description: template.description,
          icon: template.icon,
          show: true,
        },
      ]
    })
  }

  const applyAboutHighlightPack = (packTemplates: Array<Pick<IAboutHighlight, "title" | "description" | "icon">>) => {
    setAboutHighlights(
      packTemplates.map((template) => ({
        id: createId(),
        title: template.title,
        description: template.description,
        icon: template.icon,
        show: true,
      })),
    )
  }

  const mergeAboutHighlightPack = (packTemplates: Array<Pick<IAboutHighlight, "title" | "description" | "icon">>) => {
    setAboutHighlights((prev) => {
      const merged = [...prev]

      packTemplates.forEach((template) => {
        const existingIndex = merged.findIndex((item) => item.title.trim().toLowerCase() === template.title.toLowerCase())

        if (existingIndex === -1) {
          merged.push({
            id: createId(),
            title: template.title,
            description: template.description,
            icon: template.icon,
            show: true,
          })
          return
        }

        merged[existingIndex] = {
          ...merged[existingIndex],
          title: template.title,
          description: template.description,
          icon: template.icon,
          show: true,
        }
      })

      return merged
    })
  }

  const moveAboutCard = (index: number, direction: "up" | "down") => {
    setAboutHighlights((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  useEffect(() => {
    if (hasHydratedRef.current) {
      return
    }

    let isMounted = true

    const hydratePortfolioContent = async () => {
      let session = await getCurrentSession()
      for (let attempt = 0; attempt < 3 && !session.data?.session; attempt++) {
        try {
          session = await getCurrentSession()
          if (session.data?.session) break
        } catch {
          if (attempt === 2) throw session
          await new Promise((resolve) => setTimeout(resolve, 150))
        }
      }
      const sessionUser = session.data.session?.user

      if (!sessionUser) {
        return
      }

      hasHydratedRef.current = true

      if (isMounted) {
        const fallbackUsername = sessionUser.email?.split("@")[0] || user.username || ""
        setUser({
          ...user,
          id: sessionUser.id,
          email: sessionUser.email || user.email,
          username: user.username || fallbackUsername,
          password: user.password || "",
          show: user.show ?? true,
        })
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, email, firstname, lastname, role, photo, description, gitlink, likedlin, resumelink, phone, show")
        .eq("id", sessionUser.id)
        .maybeSingle()

      if (profile && isMounted) {
        setUser({
          ...user,
          id: sessionUser.id,
          email: asString(profile.email) || sessionUser.email || user.email,
          username: asString(profile.username),
          firstname: asString(profile.firstname),
          lastname: asString(profile.lastname),
          role: asString(profile.role),
          photo: asString(profile.photo),
          description: asString(profile.description),
          gitlink: asString(profile.gitlink),
          likedlin: asString(profile.likedlin),
          resumelink: asString(profile.resumelink),
          phone: asString(profile.phone),
          show: asBoolean(profile.show, true),
          password: user.password || "",
        })
      }

      const { data: portfolioContent } = await supabase
        .from("portfolio_contents")
        .select("about, skills, projects, experience, education, certificates, content_channels, content_works, collaborations, creator_tools")
        .eq("user_id", sessionUser.id)
        .maybeSingle()

      if (!portfolioContent || !isMounted) {
        return
      }

      const mappedSkills = mapSkillsContent(portfolioContent.skills, sessionUser.id)
      const mappedProjects = mapProjectsContent(portfolioContent.projects, sessionUser.id)
      const mappedExperience = mapExperienceContent(portfolioContent.experience, sessionUser.id)
      const mappedEducation = mapEducationContent(portfolioContent.education, sessionUser.id)
      const mappedCertificates = mapCertificatesContent(portfolioContent.certificates, sessionUser.id)

      setAbout(mapAboutContent(portfolioContent.about, sessionUser.id))
      setSkills(mappedSkills)
      setProjects(mappedProjects)
      setExperience(mappedExperience)
      setEducation(mappedEducation)
      setCertificate(mappedCertificates)
      setContentChannels(mapContentChannelsContent(portfolioContent.content_channels, sessionUser.id))
      setContentWorks(mapContentWorksContent(portfolioContent.content_works, sessionUser.id))
      setCollaborations(mapCollaborationsContent(portfolioContent.collaborations, sessionUser.id))
      setCreatorTools(mapCreatorToolsContent(portfolioContent.creator_tools, sessionUser.id))

      skillSyncDoneRef.current = true
      projectSyncDoneRef.current = true
      experienceSyncDoneRef.current = true
      educationSyncDoneRef.current = true
      certificateSyncDoneRef.current = true
      contentChannelsSyncDoneRef.current = true
      contentWorksSyncDoneRef.current = true
      collaborationsSyncDoneRef.current = true
      creatorToolsSyncDoneRef.current = true
    }

    void hydratePortfolioContent()

    return () => {
      isMounted = false
    }
  }, [setAbout, setCertificate, setEducation, setExperience, setProjects, setSkills, setUser, user, setContentChannels, setContentWorks, setCollaborations, setCreatorTools])

  useEffect(() => {
    setAboutHeading(about.type || "")
    setAboutBody((about.list || []).join("\n"))
    setAboutVisible(Boolean(about.show))
    setAboutHighlights(
      about.highlights?.length
        ? about.highlights
        : [
            { id: createId(), title: "", description: "", icon: "compass", show: true },
            { id: createId(), title: "", description: "", icon: "rocket", show: true },
            { id: createId(), title: "", description: "", icon: "users", show: true },
          ],
    )
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
    setProjectsDraft(projectsStore.map((item) => ({ ...item, skills: normalizeSkillValues(item.skills) })))
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

  useEffect(() => {
    setContentChannelsDraft(contentChannelsStore)
  }, [contentChannelsStore])

  useEffect(() => {
    setContentWorksDraft(contentWorksStore)
  }, [contentWorksStore])

  useEffect(() => {
    setCollaborationsDraft(collaborationsStore)
  }, [collaborationsStore])

  useEffect(() => {
    setCreatorToolsDraft(creatorToolsStore)
  }, [creatorToolsStore])

  const handleProjectPhotoUpload = async (projectIdParam: string | undefined, event: ChangeEvent<HTMLInputElement>) => {
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

    const projectId = projects.find((p) => p.id === projectIdParam)?.id || projectIdParam || createId()
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
        prev.map((row) => {
          if (row.id !== (projectIdParam || row.id)) {
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

  const handleProjectPhotoRemove = async (projectId: string, photoUrl: string) => {
    const objectPath = getStorageObjectPath(photoUrl)

    if (objectPath) {
      await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([objectPath])
    }

    setProjectsDraft((prev) =>
      prev.map((row) => {
        if (row.id !== projectId) {
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

  const handleContentMediaUpload = async (workId: string | undefined, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const person = user.id || ""

    if (!files.length) return

    if (!person) {
      setNotice({ tone: "error", message: "Sign in again before uploading media." })
      event.target.value = ""
      return
    }

    const invalidFile = files.find(
      (file) => !ALLOWED_PROJECT_PHOTO_TYPES.includes(file.type) || file.size > MAX_PROJECT_PHOTO_SIZE,
    )

    if (invalidFile) {
      setNotice({ tone: "error", message: "Only JPG, PNG, or WEBP files up to 5 MB are allowed." })
      event.target.value = ""
      return
    }

    const resolvedId = workId || createId()
    setIsUploadingContentMedia(true)

    try {
      const uploadedUrls: string[] = []

      for (const [fileIndex, file] of files.entries()) {
        const fileExtension = file.name.includes(".") ? file.name.split(".").pop() : undefined
        const safeFileName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "content-media"
        const objectPath = `${person}/content/${resolvedId}/${Date.now()}-${fileIndex}-${safeFileName}${
          fileExtension ? `.${fileExtension.toLowerCase()}` : ""
        }`

        const { error: uploadError } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

        if (uploadError) {
          throw new Error(uploadError.message || "Content media upload failed.")
        }

        const { data } = supabase.storage.from(PROJECT_PHOTOS_BUCKET).getPublicUrl(objectPath)
        uploadedUrls.push(data.publicUrl)
      }

      setContentWorksDraft((prev) =>
        prev.map((row) => {
          if (row.id !== (workId || row.id)) return row
          const existingMedia = Array.isArray(row.media) ? row.media : []
          return { ...row, id: row.id || resolvedId, media: Array.from(new Set([...existingMedia, ...uploadedUrls])) }
        }),
      )

      setNotice({ tone: "success", message: `${uploadedUrls.length} file${uploadedUrls.length > 1 ? "s" : ""} uploaded.` })
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Content media upload failed." })
    } finally {
      setIsUploadingContentMedia(false)
      event.target.value = ""
    }
  }

  const handleContentMediaRemove = async (workId: string, mediaUrl: string) => {
    const objectPath = getStorageObjectPath(mediaUrl)
    if (objectPath) {
      await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([objectPath])
    }

    setContentWorksDraft((prev) =>
      prev.map((row) => {
        if (row.id !== workId) return row
        const existingMedia = Array.isArray(row.media) ? row.media : []
        return { ...row, media: existingMedia.filter((m) => m !== mediaUrl) }
      }),
    )
  }

  const saveContent = async () => {
    const person = user.id || ""

    if (!person) {
      setNotice({ tone: "error", message: "Sign in again before saving portfolio content." })
      return
    }

    if (focusSection === null || focusSection === "projects") {
      const invalidProjectIndex = projects.findIndex((item) => {
        const normalizedPhotos = normalizeProjectPhotos(item)
        return isProjectConfigured(item) && normalizedPhotos.length < 3
      })

      if (invalidProjectIndex !== -1) {
        setNotice({ tone: "error", message: `Project #${invalidProjectIndex + 1} needs at least 3 photos.` })
        return
      }
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
      highlights: aboutHighlights
        .map((item, index) => {
          const icon: AboutHighlightIcon = ABOUT_HIGHLIGHT_ICONS.includes(item.icon) ? item.icon : "compass"

          return {
            id: item.id || createId(),
            title: item.title.trim(),
            description: item.description.trim(),
            icon,
            show: Boolean(item.show),
            sortOrder: index,
          }
        })
        .filter((item) => item.title || item.description),
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
          startDate: item.startDate?.trim() || "",
          endDate: item.endDate?.trim() || "",
          gitlink: item.gitlink.trim(),
          weblink: (item.weblinks?.find((link) => link.url)?.url ?? item.weblink ?? "").trim(),
          weblinks: (item.weblinks ?? []).filter((link) => link.url.trim()).map((link) => ({ type: link.type.trim(), url: link.url.trim() })),
          logo: normalizedPhotos[0] ?? item.logo.trim(),
          projectType: item.projectType?.trim() || "",
          photos: normalizedPhotos,
          skills: (item.skills || []).map((skill) => skill.trim()).filter(Boolean),
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

    const contentChannelsPayload = contentChannelsDraft.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        platform: item.platform.trim(),
        url: item.url.trim(),
        handle: item.handle.trim(),
        subscriberCount: item.subscriberCount.trim(),
        description: item.description.trim(),
      }))

    const contentWorksPayload = contentWorksDraft.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        title: item.title.trim(),
        type: item.type.trim(),
        url: item.url.trim(),
        thumbnail: item.thumbnail.trim(),
        description: item.description.trim(),
        date: item.date.trim(),
        views: item.views.trim(),
      }))

    const collaborationsPayload = collaborationsDraft.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        brand: item.brand.trim(),
        description: item.description.trim(),
        url: item.url.trim(),
        date: item.date.trim(),
        logo: item.logo.trim(),
      }))

    const creatorToolsPayload = creatorToolsDraft.map((item) => ({
        ...item,
        id: item.id || createId(),
        person,
        name: item.name.trim(),
        category: item.category.trim(),
        description: item.description.trim(),
        icon: item.icon.trim(),
      }))

    setAbout(aboutPayload)
    setSkills(skillsPayload)
    setProjects(projectsPayload)
    setExperience(experiencePayload)
    setEducation(educationPayload)
    setCertificate(certificatesPayload)
    setContentChannels(contentChannelsPayload)
    setContentWorks(contentWorksPayload)
    setCollaborations(collaborationsPayload)
    setCreatorTools(creatorToolsPayload)

    const { error } = await supabase.from("portfolio_contents").upsert(
      {
        user_id: person,
        about: aboutPayload,
        skills: skillsPayload,
        projects: projectsPayload,
        experience: experiencePayload,
        education: educationPayload,
        certificates: certificatesPayload,
        content_channels: contentChannelsPayload,
        content_works: contentWorksPayload,
        collaborations: collaborationsPayload,
        creator_tools: creatorToolsPayload,
      },
      { onConflict: "user_id" },
    )

    if (error) {
      setNotice({ tone: "error", message: getFriendlySupabaseError(error) || "Portfolio content saved locally but not synced to cloud." })
      setIsSaving(false)
      return
    }

    setNotice({ tone: "success", message: "Portfolio content saved and synced to Supabase." })
    setIsSaving(false)
  }

  const showAllSections = focusSection === null
  const template = user.template || "software"
  const isDev = template === "software"
  const isCreator = template === "content_creator"
  const isMarketer = template === "marketer"

  const showAboutEditor = showAllSections || focusSection === "about"
  const showSkillsEditor = (isDev || isMarketer || isCreator) && (showAllSections || focusSection === "skills")
  const showProjectsEditor = (isDev || isMarketer) && (showAllSections || focusSection === "projects")
  const showExperienceEditor = (isDev || isMarketer) && (showAllSections || focusSection === "experience")
  const showEducationEditor = isDev && (showAllSections || focusSection === "education")
  const showCertificateEditor = isDev && (showAllSections || focusSection === "certificate")
  const showContentChannelsEditor = isCreator && (showAllSections || focusSection === "content_channels")
  const showContentPortfolioEditor = isCreator && (showAllSections || focusSection === "content_portfolio")
  const showCollaborationsEditor = (isCreator || isMarketer) && (showAllSections || focusSection === "collaborations")
  const showCreatorToolsEditor = isCreator && (showAllSections || focusSection === "creator_tools")

  return (
    <motion.section
      id="portfolio-content"
      className="scroll-mt-28 mt-8 rounded-[2rem] border border-slate-200/70 bg-white/75 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75 md:p-8 lg:p-10"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
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
            href={(() => {
              const t = user.type;
              const u = user.username;
              if (!u) return "/";
              if (t === "business") return `/b/${u}`;
              if (t === "team") return `/t/${u}`;
              return `/u/${u}`;
            })()}
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
        {showAboutEditor && <div id="edit-about" className="glass-card scroll-mt-28 p-6 min-h-[340px]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">About Section</h3>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={aboutVisible} onChange={(event) => setAboutVisible(event.target.checked)} />
              Show
            </label>
          </div>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <input
              value={aboutHeading}
              onChange={(event) => setAboutHeading(event.target.value)}
              className={inputClassName}
              placeholder="About heading"
            />
            <textarea
              value={aboutBody}
              onChange={(event) => setAboutBody(event.target.value)}
              rows={8}
              className={`${inputClassName} min-h-[220px]`}
              placeholder="Write one point per line"
            />
          </div>

          <div className="mt-6 border-t border-slate-200/70 pt-6 dark:border-slate-700/70">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">About Right Cards</h4>
              <button
                type="button"
                onClick={() => {
                  setAboutHighlights((prev) => [
                    { id: createId(), title: "", description: "", icon: "compass", show: true },
                    ...prev,
                  ])
                  const el = document.getElementById("edit-about")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Add Card
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-cyan-200/70 bg-cyan-50/60 p-4 dark:border-cyan-500/30 dark:bg-cyan-500/10">
              <p className="mb-2 text-sm font-semibold text-cyan-900 dark:text-cyan-100">Template Packs</p>
              <p className="mb-3 text-xs text-cyan-800 dark:text-cyan-200">Choose a profile style to replace cards, or merge cards into your existing set.</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {filteredAboutPacks.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedAboutPackId(pack.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedAboutPack?.id === pack.id
                        ? "border-cyan-500 bg-cyan-100 text-cyan-800 dark:border-cyan-300 dark:bg-cyan-500/25 dark:text-cyan-100"
                        : "border-cyan-300/80 bg-white text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-slate-900/40 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                    }`}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectedAboutPack && applyAboutHighlightPack(selectedAboutPack.templates)}
                  className="rounded-full border border-cyan-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-slate-900/40 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                >
                  Apply Selected Pack
                </button>
                <button
                  type="button"
                  onClick={() => selectedAboutPack && mergeAboutHighlightPack(selectedAboutPack.templates)}
                  className="rounded-full border border-teal-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:border-teal-500 hover:bg-teal-100 dark:border-teal-500/40 dark:bg-slate-900/40 dark:text-teal-200 dark:hover:bg-teal-500/20"
                >
                  Merge Selected Pack
                </button>
              </div>

              <p className="mb-3 text-sm font-medium text-cyan-800 dark:text-cyan-200">Quick Templates: select a card and it will be added to this section.</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAboutTemplates.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyAboutHighlightTemplate(template)}
                    className="rounded-xl border border-cyan-200/80 bg-white/90 px-3 py-2 text-left transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-slate-900/40 dark:hover:border-cyan-400/70"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{template.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {aboutHighlights.map((card, index) => (
                <div key={card.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Card #{index + 1}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveAboutCard(index, "up")}
                          disabled={index === 0}
                          className="inline-flex items-center rounded-full border border-slate-300/80 bg-white p-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                          aria-label="Move card up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAboutCard(index, "down")}
                          disabled={index === aboutHighlights.length - 1}
                          className="inline-flex items-center rounded-full border border-slate-300/80 bg-white p-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                          aria-label="Move card down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={card.show}
                          onChange={(event) =>
                            setAboutHighlights((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, show: event.target.checked } : item,
                              ),
                            )
                          }
                        />
                        Show
                      </label>
                      <button
                        type="button"
                        onClick={() => setAboutHighlights((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={card.title}
                      onChange={(event) =>
                        setAboutHighlights((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                      className={inputClassName}
                      placeholder="Card title"
                    />

                    <select
                      value={card.icon}
                      onChange={(event) =>
                        setAboutHighlights((prev) =>
                          prev.map((item, itemIndex) => {
                            if (itemIndex !== index) {
                              return item
                            }

                            const iconValue = event.target.value as AboutHighlightIcon
                            return {
                              ...item,
                              icon: ABOUT_HIGHLIGHT_ICONS.includes(iconValue) ? iconValue : "compass",
                            }
                          }),
                        )
                      }
                      className={inputClassName}
                    >
                      {ABOUT_HIGHLIGHT_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon.charAt(0).toUpperCase() + icon.slice(1)}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={card.description}
                      onChange={(event) =>
                        setAboutHighlights((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, description: event.target.value } : item,
                          ),
                        )
                      }
                      rows={3}
                      className={inputClassName}
                      placeholder="Card description"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/35">
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Live Preview</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {aboutHighlights.filter((item) => item.show && (item.title.trim() || item.description.trim())).length > 0 ? (
                  aboutHighlights
                    .filter((item) => item.show && (item.title.trim() || item.description.trim()))
                    .map((card, index) => {
                      const Icon = aboutPreviewIcons[card.icon] || Compass

                      return (
                        <div key={`${card.id || index}-preview`} className="rounded-xl border border-slate-200/70 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
                          <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title || "Untitled card"}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{card.description || "Add a description for this card."}</p>
                        </div>
                      )
                    })
                ) : (
                  <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300/80 p-4 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
                    No visible cards yet. Add or enable cards to preview how they will appear.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>}

        {showSkillsEditor && <div id="edit-skills" className="glass-card scroll-mt-28 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Skills</h3>
            <button
              type="button"
                onClick={() => {
                  skillSyncDoneRef.current = true
                  setSkillsDraft((prev) => [
                    { id: createId(), person: user.id || "", skilltype: "", skills: [], description: "", show: true },
                    ...prev,
                  ])
                  const el = document.getElementById("edit-skills")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
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
                      placeholder={
                        isCreator ? "e.g. Video Editing, Content Creation" :
                        isMarketer ? "e.g. SEO, Paid Ads, Analytics" :
                        "e.g. Frontend, Backend, DevOps"
                      }
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
                      placeholder={
                        isCreator ? "e.g. Premiere Pro, After Effects, Photoshop" :
                        isMarketer ? "e.g. Google Ads, SEMrush, HubSpot" :
                        "e.g. React, Next.js, TypeScript"
                      }
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
                onClick={() => {
                  setProjectsDraft((prev) => [
                    {
                      id: createId(),
                      person: user.id || "",
                      name: "",
                      description: "",
                      duration: "",
                      startDate: "",
                      endDate: "",
                      gitlink: "",
                      weblink: "",
                      weblinks: [],
                      logo: "",
                      projectType: "",
                      photos: [],
                      skills: [],
                      show: true,
                      sortOrder: 1,
                    },
                    ...prev,
                  ])
                const el = document.getElementById("edit-projects")
                el?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>

          </div>
          <div className="space-y-4">
            {[...projects]
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Project #{index + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="number"
                        min={1}
                        value={item.sortOrder ?? index + 1}
                        onChange={(event) => {
                          const newOrder = Number(event.target.value) || 0;
                          if (newOrder <= 0) return;
                          setProjectsDraft((prev) => {
                            const others = prev
                              .filter((row) => row.id !== item.id)
                              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                            const insertAt = Math.min(newOrder - 1, others.length);
                            others.splice(insertAt, 0, { ...item, sortOrder: newOrder });
                            return others.map((row, i) => ({ ...row, sortOrder: i + 1 }));
                          });
                        }}
                        className="w-20 rounded-lg border border-slate-300/70 bg-white/80 px-2 py-1 text-center text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Order</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={item.show}
                        onChange={(event) =>
                          setProjectsDraft((prev) => prev.map((row) => (row.id === item.id ? { ...row, show: event.target.checked } : row)))
                        }
                      />
                      Show
                    </label>
                    <button
                      type="button"
                      onClick={() => setProjectsDraft((prev) => prev.filter((row) => row.id !== item.id))}
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
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (row.id === item.id ? { ...row, name: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="Project name"
                  />
                  <DatePicker
                    value={item.startDate}
                    placeholder="Start date"
                    onChange={(value) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (row.id === item.id ? { ...row, startDate: value } : row)))
                    }
                  />
                  <DatePicker
                    value={item.endDate}
                    placeholder="End date"
                    onChange={(value) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (row.id === item.id ? { ...row, endDate: value } : row)))
                    }
                  />
                  <input
                    value={item.projectType || ""}
                    onChange={(event) => {
                      const projectType = event.target.value
                      const newTypes = parseProjectTypes(projectType)
                      setProjectsDraft((prev) =>
                        prev.map((row, rowIndex) => {
                          if (row.id !== item.id) return row
                          const keep = newTypes.length > 0 ? (row.weblinks ?? []).filter((l) => newTypes.includes(l.type)) : row.weblinks
                          return { ...row, projectType, weblinks: keep }
                        }),
                      )
                    }}
                    className={inputClassName}
                    placeholder="Project type (e.g. App, Web, Script, ML Model)"
                    list="project-type-suggestions"
                  />
                  <datalist id="project-type-suggestions">
                    <option value="App" />
                    <option value="Web" />
                    <option value="Script" />
                    <option value="ML Model" />
                    <option value="API" />
                    <option value="CLI" />
                    <option value="Library" />
                    <option value="Mobile" />
                  </datalist>
                  <input
                    value={item.gitlink}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (row.id === item.id ? { ...row, gitlink: event.target.value } : row)))
                    }
                    className={inputClassName}
                    placeholder="GitHub link"
                  />
                  {(parseProjectTypes(item.projectType || "").length > 0 ? parseProjectTypes(item.projectType || "") : ["Live"]).map((linkType, linkIndex) => {
                    const typedLink = (item.weblinks ?? []).find((link) => link.type === linkType)
                    const isDefault = item.weblinks && item.weblinks.length === 0
                    const urlValue = typedLink?.url ?? (isDefault && linkIndex === 0 ? item.weblink : "")
                    return (
                      <input
                        key={`${item.id || index}-weblink-${linkIndex}-${linkType}`}
                        value={urlValue}
                        onChange={(event) => {
                          const url = event.target.value
                          setProjectsDraft((prev) =>
                            prev.map((row, rowIndex) => {
                              if (row.id !== item.id) return row
                              const current = row.weblinks ?? []
                              const idx = current.findIndex((l) => l.type === linkType)
                              const next = [...current]
                              if (idx >= 0) {
                                next[idx] = { ...next[idx], url }
                              } else {
                                next.push({ type: linkType, url })
                              }
                              return { ...row, weblinks: next }
                            }),
                          )
                        }}
                        className={inputClassName}
                        placeholder={`${linkType === "Live" ? "" : linkType + ": "}Live demo link`}
                      />
                    )
                  })}
                  <input
                    value={projectSkillInputDrafts[item.id ?? index] ?? toCsv(item.skills)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setProjectSkillInputDrafts((prev) => {
                          const next = { ...prev }
                          delete next[item.id ?? index]
                          return next
                        })
                      }, 100)
                    }}
                    onChange={(event) => {
                      const inputValue = event.target.value
                      setProjectSkillInputDrafts((prev) => ({ ...prev, [item.id ?? index]: inputValue }))
                      setProjectsDraft((prev) =>
                        prev.map((row, rowIndex) => (row.id === item.id ? { ...row, skills: fromCsv(inputValue) } : row)),
                      )
                    }}
                    className={inputClassName}
                    placeholder="Tech stack (comma separated)"
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      setProjectsDraft((prev) => prev.map((row, rowIndex) => (row.id === item.id ? { ...row, description: event.target.value } : row)))
                    }
                    className={`${inputClassName} md:col-span-2`}
                    rows={3}
                    placeholder="Project description"
                  />
                  <div className="md:col-span-2">
                    <input
                      type="file"
                      accept={ALLOWED_PROJECT_PHOTO_TYPES.join(",")}
                      multiple
                      onChange={(event) => {
                        void handleProjectPhotoUpload(item.id, event)
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-cyan-500 disabled:opacity-70 dark:text-slate-300"
                      disabled={isSaving || isUploadingProjectPhotos}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Upload photos directly. Minimum 1 photo per project.
                    </p>
                    {normalizeProjectPhotos(item).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {normalizeProjectPhotos(item).map((photo, photoIndex) => (
                          <div
                            key={`${item.id || index}-photo-${photoIndex}`}
                            className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/40"
                          >
                            <div className="relative h-24 w-full">
                              <Image
                                src={photo}
                                alt={`Project ${index + 1} photo ${photoIndex + 1}`}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                void handleProjectPhotoRemove(item.id, photo)
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
          <div className="grid gap-8">
          {showExperienceEditor && (
            <div
              id="edit-experience"
              className="glass-card scroll-mt-28 p-6"
            >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Experience</h3>
              <button
                type="button"
                onClick={() => {
                  setExperienceDraft((prev) => [
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
                    ...prev,
                  ])
                  const el = document.getElementById("edit-experience")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="grid gap-3 md:grid-cols-2">
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
                      className={`${inputClassName} md:col-span-2`}
                      placeholder="Responsibilities. You can separate points with new lines."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>)}

          {showEducationEditor && <div id="edit-education" className="glass-card scroll-mt-28 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Education</h3>
              <button
                type="button"
                onClick={() => {
                  setEducationDraft((prev) => [
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
                    ...prev,
                  ])
                  const el = document.getElementById("edit-education")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
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
                  <div className="grid gap-3 md:grid-cols-2">
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
                      className={`${inputClassName} md:col-span-2`}
                      placeholder="Key achievements"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {showCertificateEditor && (
            <div
              id="edit-certificate"
              className="glass-card scroll-mt-28 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Certificates</h3>
                <button
                  type="button"
                onClick={() => {
                  setCertificatesDraft((prev) => [
                    { id: createId(), person: user.id || "", name: "", duration: "", link: "", photo: "", show: true },
                    ...prev,
                  ])
                    const el = document.getElementById("edit-certificate")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
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

        {(showContentChannelsEditor || showContentPortfolioEditor || showCollaborationsEditor || showCreatorToolsEditor) && (
          <div className="grid gap-8">
          {showContentChannelsEditor && (
            <div id="edit-content-channels" className="glass-card scroll-mt-28 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Content Channels</h3>
                <button
                  type="button"
                  onClick={() => {
                    setContentChannelsDraft((prev) => [
                      { id: createId(), person: user.id || "", platform: "", url: "", handle: "", subscriberCount: "", description: "", show: true },
                      ...prev,
                    ])
                    const el = document.getElementById("edit-content-channels")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Channel
                </button>
              </div>
              <div className="space-y-4">
                {contentChannelsDraft.map((item, index) => (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Channel #{index + 1}</p>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={item.show}
                            onChange={(event) =>
                              setContentChannelsDraft((prev) =>
                                prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                              )
                            }
                          />
                          Show
                        </label>
                        <button
                          type="button"
                          onClick={() => setContentChannelsDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        value={item.platform}
                        onChange={(event) =>
                          setContentChannelsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, platform: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                      >
                        <option value="">Select platform</option>
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="twitter">Twitter/X</option>
                        <option value="blog">Blog</option>
                        <option value="podcast">Podcast</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        value={item.handle}
                        onChange={(event) =>
                          setContentChannelsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, handle: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Handle / Username"
                      />
                      <input
                        value={item.url}
                        onChange={(event) =>
                          setContentChannelsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, url: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Channel URL"
                      />
                      <input
                        value={item.subscriberCount}
                        onChange={(event) =>
                          setContentChannelsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, subscriberCount: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Subscriber / Follower count"
                      />
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setContentChannelsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)),
                          )
                        }
                        rows={2}
                        className={`${inputClassName} md:col-span-2`}
                        placeholder="Channel description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showContentPortfolioEditor && (
            <div id="edit-content-portfolio" className="glass-card scroll-mt-28 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Content Portfolio</h3>
                <button
                  type="button"
                  onClick={() => {
                    setContentWorksDraft((prev) => [
                      { id: createId(), person: user.id || "", title: "", type: "", url: "", thumbnail: "", media: [], description: "", date: "", views: "", show: true, sortOrder: 0 },
                      ...prev,
                    ])
                    const el = document.getElementById("edit-content-portfolio")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Content
                </button>
              </div>
              <div className="space-y-4">
                {contentWorksDraft.map((item, index) => (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Content #{index + 1}</p>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={item.show}
                            onChange={(event) =>
                              setContentWorksDraft((prev) =>
                                prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                              )
                            }
                          />
                          Show
                        </label>
                        <button
                          type="button"
                          onClick={() => setContentWorksDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={item.title}
                        onChange={(event) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, title: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Content title"
                      />
                      <select
                        value={item.type}
                        onChange={(event) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, type: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                      >
                        <option value="">Select type</option>
                        <option value="video">Video</option>
                        <option value="article">Article</option>
                        <option value="photo">Photo</option>
                        <option value="podcast">Podcast</option>
                        <option value="reel">Reel</option>
                        <option value="short">Short</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        value={item.url}
                        onChange={(event) => {
                          const url = event.target.value
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => {
                              if (rowIndex !== index) return row
                              const detected = detectLink(url)
                              const updates: Partial<IContentWork> = { url }
                              if (detected.thumbnailUrl && !row.thumbnail) {
                                updates.thumbnail = detected.thumbnailUrl
                              }
                              if (detected.platform !== "unknown" && detected.displayType && !row.type) {
                                updates.type = detected.displayType
                              }
                              return { ...row, ...updates }
                            }),
                          )
                        }}
                        className={inputClassName}
                        placeholder="Paste a link (YouTube, Vimeo, Instagram, TikTok...)"
                      />
                      {item.url && detectLink(item.url).platform !== "unknown" && (
                        <p className="md:col-span-2 text-xs text-cyan-600 dark:text-cyan-400">
                          Detected: {getPlatformLabel(detectLink(item.url).platform)} — thumbnail and type auto-filled
                        </p>
                      )}
                      <DatePicker
                        value={item.date}
                        placeholder="Date"
                        onChange={(value) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, date: value } : row)),
                          )
                        }
                      />
                      <input
                        value={item.thumbnail}
                        onChange={(event) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, thumbnail: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Thumbnail URL"
                      />
                      <input
                        value={item.views}
                        onChange={(event) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, views: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Views / engagement count"
                      />
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setContentWorksDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)),
                          )
                        }
                        rows={2}
                        className={`${inputClassName} md:col-span-2`}
                        placeholder="Description"
                      />
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Media (photos/videos)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept={ALLOWED_PROJECT_PHOTO_TYPES.join(",")}
                          onChange={(e) => {
                            void handleContentMediaUpload(item.id, e)
                          }}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-cyan-500 disabled:opacity-70 dark:text-slate-300"
                          disabled={isSaving || isUploadingContentMedia}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Upload multiple photos or images. JPG, PNG, WEBP up to 5 MB each.
                        </p>
                        {Array.isArray(item.media) && item.media.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {item.media.map((mediaUrl, mediaIndex) => (
                              <div
                                key={`${item.id || index}-media-${mediaIndex}`}
                                className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/40"
                              >
                                <div className="relative h-24 w-full">
                                  <Image
                                    src={mediaUrl}
                                    alt={`Media ${mediaIndex + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 50vw, 25vw"
                                    className="object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleContentMediaRemove(item.id, mediaUrl)
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
            </div>
          )}

          {showCollaborationsEditor && (
            <div id="edit-collaborations" className="glass-card scroll-mt-28 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Brand Collaborations</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCollaborationsDraft((prev) => [
                      { id: createId(), person: user.id || "", brand: "", description: "", url: "", date: "", logo: "", show: true },
                      ...prev,
                    ])
                    const el = document.getElementById("edit-collaborations")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Collaboration
                </button>
              </div>
              <div className="space-y-4">
                {collaborationsDraft.map((item, index) => (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Collaboration #{index + 1}</p>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={item.show}
                            onChange={(event) =>
                              setCollaborationsDraft((prev) =>
                                prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                              )
                            }
                          />
                          Show
                        </label>
                        <button
                          type="button"
                          onClick={() => setCollaborationsDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={item.brand}
                        onChange={(event) =>
                          setCollaborationsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, brand: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Brand name"
                      />
                      <DatePicker
                        value={item.date}
                        placeholder="Date"
                        onChange={(value) =>
                          setCollaborationsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, date: value } : row)),
                          )
                        }
                      />
                      <input
                        value={item.url}
                        onChange={(event) =>
                          setCollaborationsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, url: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Collaboration URL"
                      />
                      <input
                        value={item.logo}
                        onChange={(event) =>
                          setCollaborationsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, logo: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Brand logo URL"
                      />
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setCollaborationsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)),
                          )
                        }
                        rows={2}
                        className={`${inputClassName} md:col-span-2`}
                        placeholder="Collaboration description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCreatorToolsEditor && (
            <div id="edit-creator-tools" className="glass-card scroll-mt-28 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Creator Tools</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorToolsDraft((prev) => [
                      { id: createId(), person: user.id || "", name: "", category: "", description: "", icon: "", show: true },
                      ...prev,
                    ])
                    const el = document.getElementById("edit-creator-tools")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Tool
                </button>
              </div>
              <div className="space-y-4">
                {creatorToolsDraft.map((item, index) => (
                  <div key={item.id || index} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tool #{index + 1}</p>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={item.show}
                            onChange={(event) =>
                              setCreatorToolsDraft((prev) =>
                                prev.map((row, rowIndex) => (rowIndex === index ? { ...row, show: event.target.checked } : row)),
                              )
                            }
                          />
                          Show
                        </label>
                        <button
                          type="button"
                          onClick={() => setCreatorToolsDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
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
                          setCreatorToolsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Tool name"
                      />
                      <input
                        value={item.category}
                        onChange={(event) =>
                          setCreatorToolsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, category: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Category (e.g. Camera, Editing, Audio)"
                      />
                      <input
                        value={item.icon}
                        onChange={(event) =>
                          setCreatorToolsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, icon: event.target.value } : row)),
                          )
                        }
                        className={inputClassName}
                        placeholder="Icon URL or emoji"
                      />
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setCreatorToolsDraft((prev) =>
                            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, description: event.target.value } : row)),
                          )
                        }
                        rows={2}
                        className={`${inputClassName} md:col-span-2`}
                        placeholder="Tool description"
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
