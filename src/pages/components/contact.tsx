"use client"

import { useStore } from "@/lib/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2, Mail, Phone, Send, UserRound } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type FormData = z.infer<typeof formSchema>

export default function Contact() {
  const user = useStore((state) => state.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username || ""

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      void data
      // Here you would typically send the form data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
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
      <div className="surface-grid relative z-10">
        <motion.h2
          className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55 }}
        >
          Get in Touch
        </motion.h2>
        <div className="flex flex-col lg:flex-row gap-12">
          <motion.div
            className="lg:w-1/3"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <div className="glass-card p-8">
              <h3 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">Contact Information</h3>
              <div className="space-y-6">
                {user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center text-slate-600 transition-colors duration-300 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-300"
                  >
                    <Mail className="mr-3 h-6 w-6 text-cyan-600" />
                    {user.email}
                  </a>
                )}
                {user.phone && (
                  <a
                    href={`tel:${user.phone.replace(/\s+/g, "")}`}
                    className="flex items-center text-slate-600 transition-colors duration-300 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-300"
                  >
                    <Phone className="mr-3 h-6 w-6 text-cyan-600" />
                    {user.phone}
                  </a>
                )}
                {(fullName || user.role) && (
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <UserRound className="mr-3 h-6 w-6 text-cyan-600" />
                    <div className="flex flex-col">
                      {fullName && <span>{fullName}</span>}
                      {user.role && <span className="text-sm text-slate-500 dark:text-slate-400">{user.role}</span>}
                    </div>
                  </div>
                )}
                {!user.email && !user.phone && !fullName && !user.role && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add your profile details to show contact information here.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div
            className="lg:w-2/3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className={`w-full rounded-xl border bg-white/70 px-4 py-2.5 text-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-800/70 dark:text-slate-100 ${
                      errors.name ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className={`w-full rounded-xl border bg-white/70 px-4 py-2.5 text-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-800/70 dark:text-slate-100 ${
                      errors.email ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <input
                  {...register("subject")}
                  type="text"
                  className={`w-full rounded-xl border bg-white/70 px-4 py-2.5 text-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-800/70 dark:text-slate-100 ${
                    errors.subject ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>}
              </div>
              <div className="mt-6">
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message
                </label>
                <textarea
                  {...register("message")}
                  rows={4}
                  className={`w-full rounded-xl border bg-white/70 px-4 py-2.5 text-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-800/70 dark:text-slate-100 ${
                    errors.message ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                  }`}
                ></textarea>
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>}
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
              {submitSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-100 p-4 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Message sent successfully!
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}
