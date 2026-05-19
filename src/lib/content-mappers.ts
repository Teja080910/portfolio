import { AboutHighlightIcon, ICertificate, IEducation, IExperience, IProjects, ISkills } from "./interfaces"

export const ABOUT_HIGHLIGHT_ICONS: AboutHighlightIcon[] = ["compass", "rocket", "users", "sparkles"]

export const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}

export const asString = (value: unknown) => (typeof value === "string" ? value : "")

export const asBoolean = (value: unknown, fallback = true) => (typeof value === "boolean" ? value : fallback)

export const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => asString(item).trim())
        .filter(Boolean)
    : []

export const normalizeSkillValues = (values: string[]) => {
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

export const normalizeProjectPhotos = (project: Partial<IProjects>): string[] => {
  const photos = Array.isArray(project.photos) ? project.photos.filter(Boolean) : []

  if (photos.length > 0) {
    return photos
  }

  return project.logo ? [project.logo] : []
}

export const mapAboutContent = (value: unknown, person: string) => {
  const raw = asObject(value)
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights
        .map((item, index) => {
          const highlight = asObject(item)
          const iconValue = asString(highlight.icon).toLowerCase()
          const icon: AboutHighlightIcon = ABOUT_HIGHLIGHT_ICONS.includes(iconValue as AboutHighlightIcon)
            ? (iconValue as AboutHighlightIcon)
            : "compass"

          return {
            id: asString(highlight.id) || `about-highlight-${person}-${index}`,
            title: asString(highlight.title),
            description: asString(highlight.description),
            icon,
            show: asBoolean(highlight.show, true),
          }
        })
    : []

  return {
    id: asString(raw.id) || `about-${person}`,
    person: asString(raw.person) || person,
    type: asString(raw.type),
    list: asStringArray(raw.list),
    show: asBoolean(raw.show, true),
    highlights,
  }
}

export const mapSkillsContent = (value: unknown, person: string): ISkills[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = asObject(item)
    return {
      id: asString(raw.id) || `skill-${person}-${index}`,
      person: asString(raw.person) || person,
      skilltype: asString(raw.skilltype),
      skills: normalizeSkillValues(asStringArray(raw.skills)),
      description: asString(raw.description),
      show: asBoolean(raw.show, true),
    }
  })
}

export const mapProjectsContent = (value: unknown, person: string): IProjects[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = asObject(item)
    const photos = asStringArray(raw.photos)

    return {
      id: asString(raw.id) || `project-${person}-${index}`,
      person: asString(raw.person) || person,
      name: asString(raw.name),
      description: asString(raw.description),
      duration: asString(raw.duration),
      startDate: asString(raw.startDate),
      endDate: asString(raw.endDate),
      gitlink: asString(raw.gitlink),
      weblink: asString(raw.weblink),
      logo: asString(raw.logo),
      photos,
      skills: asStringArray(raw.skills),
      show: asBoolean(raw.show, true),
      projectType: asString(raw.projectType),
    }
  })
}

export const mapExperienceContent = (value: unknown, person: string): IExperience[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = asObject(item)
    return {
      id: asString(raw.id) || `experience-${person}-${index}`,
      person: asString(raw.person) || person,
      type: asString(raw.type),
      location: asString(raw.location),
      duration: asString(raw.duration),
      role: asString(raw.role),
      decription: asString(raw.decription),
      show: asBoolean(raw.show, true),
    }
  })
}

export const mapEducationContent = (value: unknown, person: string): IEducation[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = asObject(item)
    return {
      id: asString(raw.id) || `education-${person}-${index}`,
      person: asString(raw.person) || person,
      name: asString(raw.name),
      duration: asString(raw.duration),
      course: asString(raw.course),
      branch: asString(raw.branch),
      keyachivements: asString(raw.keyachivements),
      show: asBoolean(raw.show, true),
    }
  })
}

export const mapCertificatesContent = (value: unknown, person: string): ICertificate[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = asObject(item)
    return {
      id: asString(raw.id) || `certificate-${person}-${index}`,
      person: asString(raw.person) || person,
      name: asString(raw.name),
      duration: asString(raw.duration),
      link: asString(raw.link),
      photo: asString(raw.photo),
      show: asBoolean(raw.show, true),
    }
  })
}
