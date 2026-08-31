"use client"

import { PortfolioTemplate } from "@/lib/interfaces"
import { Code2, TrendingUp, Video } from "lucide-react"
import { useState } from "react"

type Template = {
  id: PortfolioTemplate
  name: string
  description: string
  icon: string
  whoFor: string[]
  sections: string[]
}

type TemplateSelectorProps = {
  templates: Template[]
  selectedTemplate: PortfolioTemplate | null
  onSelect: (template: PortfolioTemplate) => void
  showGetStarted?: boolean
}

const iconMap: Record<string, typeof Code2> = {
  code: Code2,
  video: Video,
  "trending-up": TrendingUp,
}

export default function TemplateSelector({ templates, selectedTemplate, onSelect, showGetStarted = true }: TemplateSelectorProps) {
  const [expandedId, setExpandedId] = useState<PortfolioTemplate | null>(selectedTemplate)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {templates.map((template) => {
        const Icon = iconMap[template.icon] || Code2
        const isSelected = selectedTemplate === template.id
        const isExpanded = expandedId === template.id

        return (
          <div
            key={template.id}
            className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
              isSelected
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-md"
            }`}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{template.name}</h3>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Who it is for
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.whoFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-secondary/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpandedId(isExpanded ? null : template.id)
                  onSelect(template.id)
                }}
                className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/70 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {isSelected ? "Selected" : "Choose This Template"}
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-border/50 bg-secondary/30 px-6 py-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Sections included
                </p>
                <ul className="space-y-1.5">
                  {template.sections.map((section) => (
                    <li key={section} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {section}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
