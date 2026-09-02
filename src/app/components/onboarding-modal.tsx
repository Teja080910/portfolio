"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  Code2,
  FileText,
  Github,
  Linkedin,
  Loader2,
  Phone,
  UserRound,
  Users,
  Video,
  TrendingUp,
  X,
} from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

const PROFILE_PHOTOS_BUCKET = "profile-photos"

const templateRoles: Record<string, string[]> = {
  software: ["Developer", "Designer", "Product Manager", "Other"],
  content_creator: ["YouTuber", "Blogger", "Podcast Host", "Social Media Manager", "Influencer", "Video Editor", "Photographer", "Other"],
  marketer: ["Marketing", "Sales", "Digital Marketer", "SEO Specialist", "Content Strategist", "Brand Manager", "Growth Hacker", "Email Marketer", "PPC Specialist", "Customer Support", "Other"],
}

type OnboardingStep = "personal" | "professional" | "portfolio"

export default function OnboardingModal({ username, email, firstname }: { username: string; email: string; firstname: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<OnboardingStep>("personal")
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    firstname: firstname || "",
    lastname: "",
    username: username || "",
    phone: "",
    description: "",
    gitlink: "",
    likedlin: "",
    resumelink: "",
    role: "",
  })

  const [profileType, setProfileType] = useState<"user" | "team" | "business">("user")
  const [selectedTemplate, setSelectedTemplate] = useState<"software" | "content_creator" | "marketer">("software")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Photo must be under 5MB." }))
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.photo
      return next
    })
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validatePersonal = () => {
    const nextErrors: Record<string, string> = {}
    const phoneDigits = formData.phone.replace(/\D/g, "")

    if (!formData.firstname.trim()) nextErrors.firstname = "First name is required."
    if (formData.username.trim() && formData.username.trim().length < 3) {
      nextErrors.username = "Username must be at least 3 characters."
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone number is required."
    } else if (phoneDigits.length < 7) {
      nextErrors.phone = "Enter a valid phone number."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handlePersonalContinue = () => {
    if (validatePersonal()) {
      setStep("professional")
    }
  }

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null
    const ext = photoFile.name.split(".").pop() || "jpg"
    const path = `${userId}/profile.${ext}`
    const { error } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, photoFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path)
    return data?.publicUrl || null
  }

  const handleFinish = async () => {
    setPending(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setErrors({ form: "Session expired. Please sign in again." })
        return
      }

      const generatedUsername =
        formData.username.trim() ||
        `${formData.firstname}${formData.lastname}`
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase()
          .slice(0, 18) +
          Math.floor(Math.random() * 1000)

      const photoUrl = await uploadPhoto(authUser.id)

      const profileUpdate: Record<string, unknown> = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        username: generatedUsername,
        phone: formData.phone.trim(),
        role: formData.role,
        type: profileType,
      }
      if (formData.description.trim()) profileUpdate.description = formData.description.trim()
      if (formData.gitlink.trim()) profileUpdate.gitlink = formData.gitlink.trim()
      if (formData.likedlin.trim()) profileUpdate.likedlin = formData.likedlin.trim()
      if (formData.resumelink.trim()) profileUpdate.resumelink = formData.resumelink.trim()
      if (photoUrl) profileUpdate.photo = photoUrl

      await supabase.from("profiles").update(profileUpdate).eq("id", authUser.id)

      await supabase
        .from("portfolio_contents")
        .upsert({ user_id: authUser.id, template: selectedTemplate }, { onConflict: "user_id" })

      const portfolioPath =
        profileType === "business"
          ? `/b/${encodeURIComponent(generatedUsername)}`
          : profileType === "team"
            ? `/t/${encodeURIComponent(generatedUsername)}`
            : `/u/${encodeURIComponent(generatedUsername)}`

      void router.replace(portfolioPath)
    } catch (err) {
      console.error("Onboarding error:", err)
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setPending(false)
    }
  }

  const steps = [
    { id: "personal", label: "Personal" },
    { id: "professional", label: "Professional" },
    { id: "portfolio", label: "Portfolio" },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)
  const availableRoles = templateRoles[selectedTemplate] || templateRoles.software

  const inputClass = "h-11 rounded-xl border-slate-200 bg-white/90 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950/70"
  const inputWithIcon = cn(inputClass, "pl-10")

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/95"
      >
        <div className="p-6 sm:p-8">
          {/* Step indicators */}
          <div className="mb-6 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    i <= currentStepIndex
                      ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {i < currentStepIndex ? <CheckCircle2 className="size-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("h-px w-8", i < currentStepIndex ? "bg-cyan-400" : "bg-slate-200 dark:bg-slate-800")} />
                )}
              </div>
            ))}
          </div>

          {errors.form && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300">
              {errors.form}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Personal Details */}
            {step === "personal" && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Personal Details</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tell us about yourself.</p>
                </div>

                {/* Photo */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 transition-colors hover:border-cyan-400 hover:text-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-cyan-500"
                  >
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                          <Camera className="size-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <Camera className="size-6" />
                    )}
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Optional. JPG, PNG or WebP, max 5MB.</p>
                    {photoPreview && (
                      <button type="button" onClick={handleRemovePhoto} className="mt-1 text-xs text-red-500 hover:text-red-600">
                        Remove photo
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </div>
                {errors.photo && <p className="text-center text-xs text-red-600 dark:text-red-300">{errors.photo}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="onb-firstname" className="text-sm font-medium text-slate-700 dark:text-slate-200">First name *</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="onb-firstname"
                        value={formData.firstname}
                        onChange={(e) => updateField("firstname", e.target.value)}
                        placeholder="John"
                        className={cn(inputWithIcon, errors.firstname && "border-red-300 focus-visible:ring-red-500")}
                      />
                    </div>
                    {errors.firstname && <p className="text-xs text-red-600 dark:text-red-300">{errors.firstname}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onb-lastname" className="text-sm font-medium text-slate-700 dark:text-slate-200">Last name</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="onb-lastname"
                        value={formData.lastname}
                        onChange={(e) => updateField("lastname", e.target.value)}
                        placeholder="Doe"
                        className={inputWithIcon}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="onb-phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone *</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="onb-phone"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+1 555 123 4567"
                        className={cn(inputWithIcon, errors.phone && "border-red-300 focus-visible:ring-red-500")}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-600 dark:text-red-300">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</Label>
                    <div className="relative">
                      <Input
                        value={email}
                        disabled
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Username <span className="text-xs font-normal text-slate-400">(auto-generated if blank)</span>
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="onb-username"
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      placeholder="johndoe"
                      className={cn(inputWithIcon, errors.username && "border-red-300 focus-visible:ring-red-500")}
                    />
                  </div>
                  {errors.username && <p className="text-xs text-red-600 dark:text-red-300">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-bio" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Bio <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </Label>
                  <Textarea
                    id="onb-bio"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="A short bio about yourself..."
                    rows={3}
                    className="rounded-xl border-slate-200 bg-white/90 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950/70"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handlePersonalContinue}
                    className="h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-teal-400"
                  >
                    Continue
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Professional */}
            {step === "professional" && (
              <motion.div
                key="professional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Professional Links</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add your professional presence. All optional.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-github" className="text-sm font-medium text-slate-700 dark:text-slate-200">GitHub URL</Label>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="onb-github"
                      value={formData.gitlink}
                      onChange={(e) => updateField("gitlink", e.target.value)}
                      placeholder="https://github.com/username"
                      className={inputWithIcon}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-linkedin" className="text-sm font-medium text-slate-700 dark:text-slate-200">LinkedIn URL</Label>
                  <div className="relative">
                    <Linkedin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="onb-linkedin"
                      value={formData.likedlin}
                      onChange={(e) => updateField("likedlin", e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className={inputWithIcon}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onb-resume" className="text-sm font-medium text-slate-700 dark:text-slate-200">Resume URL</Label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="onb-resume"
                      value={formData.resumelink}
                      onChange={(e) => updateField("resumelink", e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className={inputWithIcon}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("personal")} className="text-sm">Back</Button>
                  <Button
                    onClick={() => setStep("portfolio")}
                    className="h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-teal-400"
                  >
                    Continue
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Portfolio */}
            {step === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Portfolio Setup</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose your portfolio type, template, and role.</p>
                </div>

                {/* Profile Type */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Account Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "user" as const, label: "Individual", icon: UserRound, color: "cyan" },
                      { type: "team" as const, label: "Team", icon: Users, color: "teal" },
                      { type: "business" as const, label: "Business", icon: Building2, color: "purple" },
                    ].map(({ type, label, icon: Icon, color }) => (
                      <button
                        key={type}
                        onClick={() => setProfileType(type)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-200",
                          profileType === type
                            ? `border-${color}-400 bg-${color}-50/70 dark:border-${color}-500/50 dark:bg-${color}-950/30`
                            : "border-slate-200 bg-white/80 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60",
                        )}
                      >
                        <Icon className="size-5 text-slate-600 dark:text-slate-300" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Template</p>
                  <div className="space-y-2">
                    {[
                      { id: "software" as const, label: "Software", desc: "Projects, Skills, Experience, Education", icon: Code2, color: "cyan" },
                      { id: "content_creator" as const, label: "Content Creator", desc: "Channels, Portfolio, Collaborations", icon: Video, color: "pink" },
                      { id: "marketer" as const, label: "Marketer", desc: "Skills, Campaigns, Collaborations", icon: TrendingUp, color: "purple" },
                    ].map(({ id, label, desc, icon: Icon, color }) => (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedTemplate(id)
                          const roles = templateRoles[id]
                          if (roles && !roles.includes(formData.role)) {
                            updateField("role", "")
                          }
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200",
                          selectedTemplate === id
                            ? `border-${color}-400 bg-${color}-50/70 dark:border-${color}-500/50 dark:bg-${color}-950/30`
                            : "border-slate-200 bg-white/80 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60",
                        )}
                      >
                        <Icon className="size-5 shrink-0 text-slate-600 dark:text-slate-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                        </div>
                        {selectedTemplate === id && <CheckCircle2 className="size-4 shrink-0 text-cyan-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role (filtered by template) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</Label>
                  <div className="relative">
                    <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                    <Select value={formData.role} onValueChange={(v) => updateField("role", v)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white/90 pl-10 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("professional")} className="text-sm">Back</Button>
                  <Button
                    onClick={handleFinish}
                    disabled={pending}
                    className="h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-teal-400"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
