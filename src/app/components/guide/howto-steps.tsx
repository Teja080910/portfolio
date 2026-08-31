"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { useState } from "react"

type Step = {
  number: number
  title: string
  description: string
}

type HowtoStepsProps = {
  steps: Step[]
  title: string
}

export default function HowtoSteps({ steps, title }: HowtoStepsProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  return (
    <div>
      <h3 className="mb-6 text-xl font-bold text-foreground">{title}</h3>
      <div className="space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.number

          return (
            <div
              key={step.number}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                isExpanded
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border/50 bg-card/30 hover:border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isExpanded
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/70 text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <span className={`text-sm font-semibold ${isExpanded ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
                <div className="ml-auto">
                  {isExpanded ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-4 pl-17">
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
