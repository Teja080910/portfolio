"use client"

import HowtoSteps from "@/app/components/guide/howto-steps"
import TemplateSelector from "@/app/components/guide/template-selector"
import { supabase } from "@/lib/db"
import { PortfolioTemplate } from "@/lib/interfaces"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  BookOpen,
  Code2,
  Compass,
  Rocket,
  Sparkles,
  Users,
  Video,
} from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type GuideContent = {
  id: string
  section: string
  title: string | null
  subtitle: string | null
  content: Record<string, unknown>
  sort_order: number
}

type IntroCard = { title: string; description: string; icon: string }
type Feature = { title: string; description: string; icon: string }
type Template = {
  id: PortfolioTemplate
  name: string
  description: string
  icon: string
  whoFor: string[]
  sections: string[]
}
type Step = { number: number; title: string; description: string }

const iconMap: Record<string, typeof Compass> = {
  compass: Compass,
  rocket: Rocket,
  users: Users,
  sparkles: Sparkles,
  code: Code2,
  video: Video,
}

export default function GuidePage() {
  const [guideData, setGuideData] = useState<GuideContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<PortfolioTemplate | null>(null)
  const [selectedHowto, setSelectedHowto] = useState<string>("howto_software")

  const fetchGuideContent = useCallback(async () => {
    const { data, error } = await supabase
      .from("guide_content")
      .select("id, section, title, subtitle, content, sort_order")
      .eq("show", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Failed to load guide content:", error.message)
    } else if (data) {
      setGuideData(data as GuideContent[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchGuideContent()
  }, [fetchGuideContent])

  const getSection = (section: string) => guideData.find((s) => s.section === section)
  const introData = getSection("intro")
  const benefitsData = getSection("benefits")
  const templateData = getSection("template")
  const howtoDeveloper = getSection("howto_software")
  const howtoCreator = getSection("howto_creator")
  const howtoMarketer = getSection("howto_marketer")

  const introContent = introData?.content as Record<string, unknown>
  const introParagraphs = Array.isArray(introContent?.paragraphs) ? (introContent.paragraphs as string[]) : []
  const introCards = Array.isArray(introContent?.cards) ? (introContent.cards as IntroCard[]) : []

  const benefitsContent = benefitsData?.content as Record<string, unknown>
  const benefitsParagraphs = Array.isArray(benefitsContent?.paragraphs) ? (benefitsContent.paragraphs as string[]) : []
  const benefitsFeatures = Array.isArray(benefitsContent?.features) ? (benefitsContent.features as Feature[]) : []

  const templateContent = templateData?.content as Record<string, unknown>
  const templates = Array.isArray(templateContent?.templates) ? (templateContent.templates as Template[]) : []

  const getHowtoSteps = (section: string): Step[] => {
    const data = getSection(section)
    const content = data?.content as Record<string, unknown>
    return Array.isArray(content?.steps) ? (content.steps as Step[]) : []
  }

  const howtoSteps = getHowtoSteps(selectedHowto)
  const howtoTitle =
    selectedHowto === "howto_software"
      ? howtoDeveloper?.title || ""
      : selectedHowto === "howto_creator"
        ? howtoCreator?.title || ""
        : howtoMarketer?.title || ""

  const templateHowtoMap: Record<PortfolioTemplate, string> = {
    software: "howto_software",
    content_creator: "howto_creator",
    marketer: "howto_marketer",
  }

  if (loading) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-purple-500/10" />
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold text-foreground">Loading guide...</h2>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head>
        <title>Guide | Portfolio Builder</title>
        <meta name="description" content="Learn how to build your portfolio step by step." />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-background transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:via-transparent dark:to-purple-500/10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full -translate-x-1/2 bg-gradient-radial from-primary/5 to-transparent dark:from-primary/10" />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-32">
          {/* Hero */}
          <motion.header
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Build Your{" "}
              <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to know about creating a stunning portfolio that gets you noticed.
            </p>
          </motion.header>

          {/* Intro: What is a Portfolio */}
          {introData && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="mb-3 text-3xl font-bold text-foreground">{introData.title}</h2>
              <p className="mb-8 text-lg text-muted-foreground">{introData.subtitle}</p>

              {introParagraphs.length > 0 && (
                <div className="mb-8 space-y-3">
                  {introParagraphs.map((p, i) => (
                    <p key={i} className="text-base leading-relaxed text-muted-foreground">{p}</p>
                  ))}
                </div>
              )}

              {introCards.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {introCards.map((card, i) => {
                    const Icon = iconMap[card.icon] || Compass
                    return (
                      <motion.div
                        key={card.title}
                        className="rounded-3xl border border-border/50 bg-card/50 p-6 backdrop-blur"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{card.description}</p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.section>
          )}

          {/* Benefits */}
          {benefitsData && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="mb-3 text-3xl font-bold text-foreground">{benefitsData.title}</h2>
              <p className="mb-8 text-lg text-muted-foreground">{benefitsData.subtitle}</p>

              {benefitsParagraphs.length > 0 && (
                <div className="mb-8 space-y-3">
                  {benefitsParagraphs.map((p, i) => (
                    <p key={i} className="text-base leading-relaxed text-muted-foreground">{p}</p>
                  ))}
                </div>
              )}

              {benefitsFeatures.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {benefitsFeatures.map((feature, i) => {
                    const Icon = iconMap[feature.icon] || Sparkles
                    return (
                      <motion.div
                        key={feature.title}
                        className="flex gap-4 rounded-3xl border border-border/50 bg-card/50 p-5 backdrop-blur"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.section>
          )}

          {/* Template Selector */}
          {templateData && templates.length > 0 && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="mb-3 text-3xl font-bold text-foreground">{templateData.title}</h2>
              <p className="mb-8 text-lg text-muted-foreground">{templateData.subtitle}</p>

              <TemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelect={(id) => {
                  setSelectedTemplate(id)
                  setSelectedHowto(templateHowtoMap[id])
                }}
              />
            </motion.section>
          )}

          {/* How-To Steps */}
          {howtoSteps.length > 0 && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <HowtoSteps steps={howtoSteps} title={howtoTitle} />
            </motion.section>
          )}

          {/* CTA */}
          <motion.section
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="mx-auto max-w-lg rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur">
              <h2 className="text-2xl font-bold text-foreground">Ready to Build Yours?</h2>
              <p className="mt-2 text-muted-foreground">
                Create your portfolio in minutes. It&apos;s free to start.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Rocket className="h-4 w-4" />
                  Get Started
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <Compass className="h-4 w-4" />
                  Explore Portfolios
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  )
}
