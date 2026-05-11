"use client"

import { useStore } from "@/lib/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2, Mail, PencilLine, Phone, Send, UserRound } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type FormData = z.infer<typeof formSchema>

type ContactProps = {
  isReadOnly?: boolean
}

export default function Contact({ isReadOnly = false }: ContactProps) {
  const user = useStore((state) => state.user)
  const userId = user.id
  const editProfileHref = `/u/${encodeURIComponent(user.username || "me")}/profile`
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username || ""
  const hasContactInfo = Boolean(user.email || user.phone || fullName || user.role)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: fullName,
      email: user.email || "",
      subject: "",
      message: "",
    },
  })

  useEffect(() => {
    reset({
      name: fullName,
      email: user.email || "",
      subject: "",
      message: "",
    })
  }, [fullName, reset, user.email])

  if (isReadOnly && !hasContactInfo) {
    return null
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      void data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitSuccess(true)
      reset()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="section-shell">
      {/* Background */}
      <div className="orb left-[-10%] top-[-5%] h-[30%] w-[30%] bg-primary/5 dark:bg-primary/10" />
      <div className="orb bottom-[-5%] right-[-5%] h-[25%] w-[25%] bg-purple-500/5 dark:bg-purple-500/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editProfileHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Contact Details
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Get in Touch" subtitle="Have a question or want to work together? Drop me a message!" />

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Contact Information */}
          <motion.div
            className={isReadOnly ? "w-full" : "w-full lg:w-2/5"}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <div className="glass-card p-8">
              <h3 className="mb-8 text-xl font-bold text-foreground">Contact Information</h3>
              <div className="space-y-6">
                {user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="group flex items-center gap-4 text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/5">
                      <Mail className="h-5 w-5" />
                    </div>
                    <span className="break-all text-sm">{user.email}</span>
                  </a>
                )}
                {user.phone && (
                  <a
                    href={`tel:${user.phone.replace(/\s+/g, "")}`}
                    className="group flex items-center gap-4 text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/5">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="text-sm">{user.phone}</span>
                  </a>
                )}
                {(fullName || user.role) && (
                  <div className="group flex items-center gap-4 text-muted-foreground">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/5">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      {fullName && <span className="text-sm font-medium text-foreground">{fullName}</span>}
                      {user.role && <span className="text-xs text-muted-foreground">{user.role}</span>}
                    </div>
                  </div>
                )}
                {!user.email && !user.phone && !fullName && !user.role && (
                  <p className="text-sm text-muted-foreground">
                    Add your profile details to show contact information here.
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          {!isReadOnly && (
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.55 }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground/80">
                      Name
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className={`w-full rounded-xl border bg-background/50 px-4 py-2.5 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        errors.name ? "border-destructive" : "border-border"
                      }`}
                      placeholder="Your name"
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground/80">
                      Email
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className={`w-full rounded-xl border bg-background/50 px-4 py-2.5 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        errors.email ? "border-destructive" : "border-border"
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground/80">
                    Subject
                  </label>
                  <input
                    {...register("subject")}
                    type="text"
                    className={`w-full rounded-xl border bg-background/50 px-4 py-2.5 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      errors.subject ? "border-destructive" : "border-border"
                    }`}
                    placeholder="What's this about?"
                  />
                  {errors.subject && <p className="mt-1.5 text-xs text-destructive">{errors.subject.message}</p>}
                </div>

                <div className="mt-6">
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground/80">
                    Message
                  </label>
                  <textarea
                    {...register("message")}
                    rows={4}
                    className={`w-full rounded-xl border bg-background/50 px-4 py-2.5 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      errors.message ? "border-destructive" : "border-border"
                    }`}
                    placeholder="Your message..."
                  />
                  {errors.message && <p className="mt-1.5 text-xs text-destructive">{errors.message.message}</p>}
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                      isSubmitting ? "cursor-not-allowed opacity-70" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>

                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    Message sent successfully! I&apos;ll get back to you soon.
                  </motion.div>
                )}
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
