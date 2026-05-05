"use client"

import { supabase } from "@/lib/db"
import { IUser } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  FileText,
  Github,
  ImageIcon,
  Linkedin,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Save,
  ShieldCheck,
  UserRound
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const PROFILE_PHOTOS_BUCKET = "profile-photos"
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]

const isValidUrl = (value: string) => {
  if (!value.trim()) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => isValidUrl(value), "Enter a valid URL or leave this blank")

const profileSchema = z.object({
  firstname: z.string().trim().min(2, "First name must be at least 2 characters").max(40, "Keep it under 40 characters"),
  lastname: z.string().trim().min(1, "Last name is required").max(40, "Keep it under 40 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be 24 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores"),
  role: z.string().trim().min(2, "Role is required").max(60, "Keep the role under 60 characters"),
  phone: z.string().trim().max(25, "Phone number is too long"),
  description: z.string().trim().max(320, "Bio should stay under 320 characters"),
  gitlink: optionalUrlSchema,
  likedlin: optionalUrlSchema,
  resumelink: optionalUrlSchema,
  type: z.enum(["user", "team", "business"]).default("user"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

type StatusState =
  | {
      tone: "success" | "error"
      message: string
    }
  | null

const enhancePhotoUrl = (url?: string | null) => {
  if (!url) return "";
  let enhancedUrl = url;
  if (enhancedUrl.includes("googleusercontent.com")) {
      if (enhancedUrl.match(/=s\d+-c/)) {
          enhancedUrl = enhancedUrl.replace(/=s\d+-c/g, "=s800-c");
      } else if (!enhancedUrl.includes("=")) {
          enhancedUrl += "=s800-c";
      }
  } else if (enhancedUrl.includes("avatars.githubusercontent.com")) {
      if (!enhancedUrl.includes("s=")) {
          enhancedUrl = enhancedUrl.includes("?") ? `${enhancedUrl}&s=800` : `${enhancedUrl}?s=800`;
      }
  }
  return enhancedUrl;
};

const mapProfileToUser = (profile: Partial<IUser>, fallbackEmail = ""): IUser => ({
  id: profile.id,
  username: profile.username ?? "",
  email: profile.email ?? fallbackEmail,
  photo: enhancePhotoUrl(profile.photo),
  firstname: profile.firstname ?? "",
  lastname: profile.lastname ?? "",
  role: profile.role ?? "",
  description: profile.description ?? "",
  gitlink: profile.gitlink ?? "",
  likedlin: profile.likedlin ?? "",
  resumelink: profile.resumelink ?? "",
  phone: profile.phone ?? "",
  password: profile.password ?? "",
  confirmpassword: "",
  show: profile.show ?? true,
  type: profile.type ?? "user",
})

const buildDefaults = (user: Partial<IUser>): ProfileFormValues => ({
  firstname: user.firstname ?? "",
  lastname: user.lastname ?? "",
  username: user.username ?? "",
  role: user.role ?? "",
  phone: user.phone ?? "",
  description: user.description ?? "",
  gitlink: user.gitlink ?? "",
  likedlin: user.likedlin ?? "",
  resumelink: user.resumelink ?? "",
  type: user.type ?? "user",
})

const buildFallbackUser = (authUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>, currentUser: IUser) => {
  const metadata = authUser.user_metadata ?? {}
  const oauthFullName = (metadata.full_name as string | undefined) || (metadata.name as string | undefined) || ""
  const oauthFirstName = oauthFullName ? oauthFullName.split(" ")[0] : "New"
  const oauthLastName = oauthFullName ? oauthFullName.split(" ").slice(1).join(" ") : "User"
  const oauthPhoto = (metadata.avatar_url as string | undefined) || (metadata.picture as string | undefined) || ""

  return mapProfileToUser(
    {
      id: authUser.id,
      email: authUser.email ?? currentUser.email,
      username:
        currentUser.username ||
        (typeof metadata.username === "string" ? metadata.username.trim() : "") ||
        oauthFullName.replace(/\s+/g, "").toLowerCase().slice(0, 15) ||
        authUser.email?.split("@")[0] ||
        "",
      firstname: currentUser.firstname || (typeof metadata.firstname === "string" ? metadata.firstname.trim() : "") || oauthFirstName,
      lastname: currentUser.lastname || (typeof metadata.lastname === "string" ? metadata.lastname.trim() : "") || oauthLastName,
      role: currentUser.role || (typeof metadata.role === "string" ? metadata.role.trim() : "") || "Developer",
      phone: currentUser.phone || (typeof metadata.phone === "string" ? metadata.phone.trim() : ""),
      description: currentUser.description ?? "",
      photo: currentUser.photo || enhancePhotoUrl(oauthPhoto),
      gitlink: currentUser.gitlink ?? "",
      likedlin: currentUser.likedlin ?? "",
      resumelink: currentUser.resumelink ?? "",
      password: currentUser.password || "oauth-provider",
      show: currentUser.show ?? true,
    },
    authUser.email ?? currentUser.email,
  )
}

const textInputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-500"

const labelClassName = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"

const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")

const getProfilePhotoObjectPath = (photoUrl?: string | null) => {
  if (!photoUrl) {
    return null
  }

  try {
    const parsedUrl = new URL(photoUrl)
    const marker = `/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/`
    const markerIndex = parsedUrl.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

const uploadProfilePhoto = async (userId: string, file: File) => {
  const fileExtension = file.name.includes(".") ? file.name.split(".").pop() : undefined
  const safeFileName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "profile-photo"
  const objectPath = `${userId}/${Date.now()}-${safeFileName}${fileExtension ? `.${fileExtension.toLowerCase()}` : ""}`

  const { error: uploadError } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) {
    return {
      objectPath: null,
      publicUrl: null,
      error: uploadError,
    }
  }

  const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(objectPath)

  return {
    objectPath,
    publicUrl: data.publicUrl,
    error: null,
  }
}

const buildPhotoUploadErrorMessage = (message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? ""

  if (normalizedMessage.includes("bucket") || normalizedMessage.includes("row-level security")) {
    return "Profile photo upload needs the latest Supabase storage migration. Apply it, then try uploading again."
  }

  return message || "We could not upload your profile photo right now."
}

export default function ProfileForm() {
  const router = useRouter()
  const currentUser = useStore((state) => state.user)
  const addUser = useStore((state) => state.addUser)
  const [accountEmail, setAccountEmail] = useState(currentUser.email ?? "")
  const [isHydrating, setIsHydrating] = useState(true)
  const [status, setStatus] = useState<StatusState>(null)
  const [photoUrl, setPhotoUrl] = useState(currentUser.photo ?? "")
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("")
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState("")
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoInputKey, setPhotoInputKey] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: buildDefaults(currentUser),
  })

  useEffect(() => {
    let isActive = true

    const syncProfile = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        if (isActive) {
          setIsHydrating(false)
          void router.replace("/sign-in")
        }
        return
      }

      setAccountEmail(authUser.email ?? "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      let resolvedUser: IUser;
      
      if (profile) {
        // Sync photo from OAuth if it's missing in the profile
        const metadata = authUser.user_metadata ?? {};
        const oauthPhoto = (metadata.avatar_url as string | undefined) || (metadata.picture as string | undefined);
        
        if (oauthPhoto && !profile.photo) {
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .update({ photo: oauthPhoto })
            .eq("id", authUser.id)
            .select("*")
            .single();
            
          resolvedUser = mapProfileToUser(updatedProfile || profile, authUser.email ?? "");
        } else {
          resolvedUser = mapProfileToUser(profile, authUser.email ?? "");
        }
      } else {
        resolvedUser = buildFallbackUser(authUser, useStore.getState().user);
      }

      addUser(resolvedUser)

      if (isActive) {
        reset(buildDefaults(resolvedUser))
        setPhotoUrl(resolvedUser.photo ?? "")
        setSelectedPhotoFile(null)
        setPhotoError("")
        setRemovePhoto(false)
        setPhotoInputKey((previous) => previous + 1)
        setIsHydrating(false)
      }
    }

    void syncProfile()

    return () => {
      isActive = false
    }
  }, [addUser, reset, router])

  useEffect(() => {
    if (!selectedPhotoFile) {
      setPhotoPreviewUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(selectedPhotoFile)
    setPhotoPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedPhotoFile])

  const watchedValues = watch()
  const activePhotoPreview = removePhoto ? "" : photoPreviewUrl || photoUrl

  const preview = useMemo(() => {
    const fullName =
      [watchedValues.firstname, watchedValues.lastname].filter(Boolean).join(" ").trim() ||
      watchedValues.username ||
      accountEmail

    const initials =
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U"

    return {
      fullName,
      initials,
      username: watchedValues.username ? `@${watchedValues.username}` : "@your-username",
      role: watchedValues.role || "Your role will appear here",
      description:
        watchedValues.description ||
        "Add a short introduction so your homepage feels like yours instead of a generic starter profile.",
      photo: activePhotoPreview,
      gitlink: watchedValues.gitlink,
      likedlin: watchedValues.likedlin,
      resumelink: watchedValues.resumelink,
    }
  }, [accountEmail, activePhotoPreview, watchedValues])

  const resetFormFromUser = (user: IUser) => {
    reset(buildDefaults(user))
    setPhotoUrl(user.photo ?? "")
    setSelectedPhotoFile(null)
    setPhotoError("")
    setRemovePhoto(false)
    setPhotoInputKey((previous) => previous + 1)
    setStatus(null)
  }

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Upload a JPG, PNG, or WEBP image.")
      setSelectedPhotoFile(null)
      setPhotoInputKey((previous) => previous + 1)
      return
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      setPhotoError("Profile photo must be 5 MB or smaller.")
      setSelectedPhotoFile(null)
      setPhotoInputKey((previous) => previous + 1)
      return
    }

    setPhotoError("")
    setSelectedPhotoFile(file)
    setRemovePhoto(false)
    setStatus(null)
  }

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null)
    setPhotoError("")
    setRemovePhoto(true)
    setPhotoInputKey((previous) => previous + 1)
    setStatus(null)
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setStatus(null)

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      setStatus({
        tone: "error",
        message: "Your session expired. Sign in again and then retry saving your profile.",
      })
      void router.replace("/sign-in")
      return
    }

    if (photoError) {
      setStatus({
        tone: "error",
        message: photoError,
      })
      return
    }

    const trimmedValues = {
      firstname: values.firstname.trim(),
      lastname: values.lastname.trim(),
      username: values.username.trim(),
      role: values.role.trim(),
      type: values.type,
      phone: values.phone.trim(),
      description: values.description.trim(),
      gitlink: values.gitlink.trim(),
      likedlin: values.likedlin.trim(),
      resumelink: values.resumelink.trim(),
    }

    const existingPhotoPath = getProfilePhotoObjectPath(photoUrl)
    let nextPhotoUrl = removePhoto ? "" : photoUrl
    let uploadedPhotoPath: string | null = null

    if (selectedPhotoFile) {
      const { objectPath, publicUrl, error: uploadError } = await uploadProfilePhoto(authUser.id, selectedPhotoFile)

      if (uploadError || !publicUrl || !objectPath) {
        setStatus({
          tone: "error",
          message: buildPhotoUploadErrorMessage(uploadError?.message),
        })
        return
      }

      uploadedPhotoPath = objectPath
      nextPhotoUrl = publicUrl
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          email: authUser.email ?? accountEmail,
          ...trimmedValues,
          type: values.type,
          photo: nextPhotoUrl,
          show: currentUser.show ?? true,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single()

    if (profileError || !updatedProfile) {
      if (uploadedPhotoPath) {
        await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([uploadedPhotoPath])
      }

      const errorMessage = profileError?.message ?? "We could not save your profile right now."

      if (errorMessage.toLowerCase().includes("username")) {
        setError("username", { type: "manual", message: errorMessage })
      }

      setStatus({
        tone: "error",
        message: errorMessage,
      })
      return
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        firstname: trimmedValues.firstname,
        lastname: trimmedValues.lastname,
        username: trimmedValues.username,
        role: trimmedValues.role,
        phone: trimmedValues.phone,
      },
    })

    const resolvedUser = mapProfileToUser(updatedProfile, authUser.email ?? accountEmail)

    if (removePhoto && existingPhotoPath) {
      await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([existingPhotoPath])
    }

    if (uploadedPhotoPath && existingPhotoPath && existingPhotoPath !== uploadedPhotoPath) {
      await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([existingPhotoPath])
    }

    addUser(resolvedUser)
    resetFormFromUser(resolvedUser)
    setAccountEmail(authUser.email ?? accountEmail)
    setStatus({
      tone: metadataError ? "error" : "success",
      message: metadataError
        ? "Profile saved, but auth metadata could not be synced. Your portfolio still uses the saved profile values."
        : "Profile updated successfully. Your homepage should reflect these changes right away.",
    })
  }

  return (
    <motion.section
      className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/75 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75 md:p-8 lg:p-10"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/15" />

      <div className="relative z-10">
        <div className="flex flex-col gap-6 border-b border-slate-200/70 pb-8 dark:border-slate-700/70 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="accent-chip">Own Your Profile</span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
              Edit the details your portfolio shows after login
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
              This page updates your personal profile row in Supabase and refreshes the app state immediately, so your
              hero section and contact card stop showing starter content.
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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Editing your own account
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="firstname" className={labelClassName}>
                  First Name
                </label>
                <input id="firstname" {...register("firstname")} className={textInputClassName} placeholder="Teja" />
                {errors.firstname && <p className="mt-2 text-sm text-rose-500">{errors.firstname.message}</p>}
              </div>

              <div>
                <label htmlFor="lastname" className={labelClassName}>
                  Last Name
                </label>
                <input id="lastname" {...register("lastname")} className={textInputClassName} placeholder="Simma" />
                {errors.lastname && <p className="mt-2 text-sm text-rose-500">{errors.lastname.message}</p>}
              </div>

              <div>
                <label htmlFor="username" className={labelClassName}>
                  Username
                </label>
                <input
                  id="username"
                  {...register("username")}
                  className={textInputClassName}
                  placeholder="tejasimma"
                  autoCapitalize="none"
                />
                {errors.username && <p className="mt-2 text-sm text-rose-500">{errors.username.message}</p>}
              </div>

              <div>
                <label htmlFor="role" className={labelClassName}>
                  Role
                </label>
                <input
                  id="role"
                  {...register("role")}
                  className={textInputClassName}
                  placeholder="Frontend Developer"
                />
                {errors.role && <p className="mt-2 text-sm text-rose-500">{errors.role.message}</p>}
              </div>

              <div>
                <label htmlFor="type" className={labelClassName}>
                  Profile Type
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="type"
                    {...register("type")}
                    className={`${textInputClassName} appearance-none pl-11`}
                  >
                    <option value="user">Individual User</option>
                    <option value="team">Team</option>
                    <option value="business">Business</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {errors.type && <p className="mt-2 text-sm text-rose-500">{errors.type.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className={labelClassName}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    {...register("phone")}
                    className={`${textInputClassName} pl-11`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-sm text-rose-500">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClassName}>
                Account Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  value={accountEmail}
                  readOnly
                  className={`${textInputClassName} pl-11 text-slate-500 dark:text-slate-400`}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Email is read-only here to avoid Supabase confirmation flow conflicts.
              </p>
            </div>

            <div>
              <label htmlFor="description" className={labelClassName}>
                Short Bio
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={5}
                className={textInputClassName}
                placeholder="Tell visitors what you build, what you enjoy working on, and what makes your portfolio yours."
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>This copy appears in your hero section.</span>
                <span>{watchedValues.description.length}/320</span>
              </div>
              {errors.description && <p className="mt-2 text-sm text-rose-500">{errors.description.message}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="photoUpload" className={labelClassName}>
                  Profile Photo
                </label>
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/70 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/35">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Upload your photo to the Supabase bucket
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG, or WEBP. Max size 5 MB.
                      </p>
                    </div>
                  </div>

                  <input
                    key={photoInputKey}
                    id="photoUpload"
                    type="file"
                    accept={ALLOWED_PROFILE_PHOTO_TYPES.join(",")}
                    onChange={handlePhotoSelection}
                    className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-cyan-500 dark:text-slate-300"
                  />

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {selectedPhotoFile && <span>Selected: {selectedPhotoFile.name}</span>}
                    {!selectedPhotoFile && activePhotoPreview && <span>Current photo ready</span>}
                    {!selectedPhotoFile && !activePhotoPreview && <span>No photo uploaded yet</span>}
                  </div>

                  {activePhotoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-4 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors duration-300 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                      Remove current photo
                    </button>
                  )}
                </div>
                {photoError && <p className="mt-2 text-sm text-rose-500">{photoError}</p>}
              </div>

              <div>
                <label htmlFor="resumelink" className={labelClassName}>
                  Resume URL
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="resumelink"
                    {...register("resumelink")}
                    className={`${textInputClassName} pl-11`}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                {errors.resumelink && <p className="mt-2 text-sm text-rose-500">{errors.resumelink.message}</p>}
              </div>

              <div>
                <label htmlFor="gitlink" className={labelClassName}>
                  GitHub URL
                </label>
                <div className="relative">
                  <Github className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="gitlink"
                    {...register("gitlink")}
                    className={`${textInputClassName} pl-11`}
                    placeholder="https://github.com/your-handle"
                  />
                </div>
                {errors.gitlink && <p className="mt-2 text-sm text-rose-500">{errors.gitlink.message}</p>}
              </div>

              <div>
                <label htmlFor="likedlin" className={labelClassName}>
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Linkedin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="likedlin"
                    {...register("likedlin")}
                    className={`${textInputClassName} pl-11`}
                    placeholder="https://linkedin.com/in/your-handle"
                  />
                </div>
                {errors.likedlin && <p className="mt-2 text-sm text-rose-500">{errors.likedlin.message}</p>}
              </div>
            </div>

            {status && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  status.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isDirty ? "You have unsaved changes." : "Everything here is in sync with your saved profile."}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => resetFormFromUser(useStore.getState().user)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition-transform duration-300 hover:-translate-y-0.5 dark:border-slate-600 dark:bg-slate-950/35 dark:text-slate-200"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isHydrating}
                  className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 ${
                    isSubmitting || isHydrating ? "cursor-not-allowed opacity-75" : ""
                  }`}
                >
                  {isSubmitting || isHydrating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? "Saving Changes..." : isHydrating ? "Loading Profile..." : "Save Profile"}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <motion.div
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-slate-100 p-6 dark:border-slate-700/70 dark:bg-slate-950/55">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-cyan-500/20 via-teal-400/10 to-transparent" />
                <div className="relative flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 text-2xl font-bold text-white shadow-lg">
                    {preview.photo ? (
                        <div
                          aria-label={preview.fullName}
                          className="h-full w-full bg-cover bg-center"
                          role="img"
                          style={{ backgroundImage: `url(${preview.photo})` }}
                        />
                      ) : (
                        preview.initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Live Preview</p>
                      <h2 className="mt-1 break-words text-2xl font-semibold text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100">{preview.fullName}</h2>
                      <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">{preview.username}</p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 items-start gap-3 text-slate-600 dark:text-slate-300">
                      <Briefcase className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{preview.role}</span>
                    </div>
                    <div className="flex min-w-0 items-start gap-3 text-slate-600 dark:text-slate-300">
                      <UserRound className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{preview.description}</span>
                    </div>
                    <div className="flex min-w-0 items-start gap-3 text-slate-600 dark:text-slate-300">
                      <Mail className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{accountEmail || "Your email will appear here"}</span>
                    </div>
                    <div className="flex min-w-0 items-start gap-3 text-slate-600 dark:text-slate-300">
                      <Phone className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{watchedValues.phone || "Add a phone number if you want it in the contact section"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <PencilLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What updates from here</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    These fields feed the personalized sections we already switched away from starter content.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Your hero section uses your name, role, bio, photo, GitHub, LinkedIn, and email.</p>
                <p>Your contact section uses your name, email, phone, and role.</p>
                <p>Portfolio sections are now editable from the Edit Portfolio Content area below this form.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
