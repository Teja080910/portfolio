"use client"

import { motion } from "framer-motion"
import { Code, Layout, Server, Smartphone } from "lucide-react"
import Image from "next/image"

export default function Certificate() {
  const services = [
    {
      icon: <Layout className="h-10 w-10 text-cyan-500" />,
      title: "Web Application Development",
      description: "Custom web applications built with React and Next.js, focusing on performance and user experience.",
    },
    {
      icon: <Server className="h-10 w-10 text-teal-500" />,
      title: "Backend Development",
      description: "Robust and scalable server-side solutions using Node.js, Express, and Fastify.",
    },
    {
      icon: <Code className="h-10 w-10 text-sky-500" />,
      title: "API Development",
      description:
        "RESTful and GraphQL API design and implementation for seamless data flow between client and server.",
    },
    {
      icon: <Smartphone className="h-10 w-10 text-amber-500" />,
      title: "Responsive Design",
      description: "Mobile-first, responsive web designs that work flawlessly across all devices and screen sizes.",
    },
  ]

  return (
    <section id="certificate" className="section-shell">
      <div className="surface-grid relative z-10">
        <motion.h2
          className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55 }}
        >
          My Services
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="glass-card h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                {service.icon}
                <h3 className="ml-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{service.title}</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute top-8 left-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="Decorative background" width={160} height={160} />
      </div>
    </section>
  )
}

