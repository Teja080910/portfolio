"use client"

import { motion } from "framer-motion"
import { Briefcase, Calendar, Globe, MapPin } from "lucide-react"
import Image from "next/image"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

export default function Experience() {
  const experiences = [
    {
      company: "Freelance",
      location: "Remote",
      period: "2024 - Present",
      role: "MERN Stack Developer",
      responsibilities: [
        "Developing custom web applications for international clients",
        "Building responsive and scalable frontend interfaces with React",
        "Implementing secure backend systems with Node.js and Express",
        "Creating RESTful APIs and managing MongoDB databases",
        "Collaborating with clients to deliver high-quality solutions",
      ],
    },
    {
      company: "Salaba Fasteners",
      location: "Saudi Arabia (Hybrid)",
      period: "2024 - Present",
      role: "MERN Stack Developer",
      responsibilities: [
        "Developed full-fledged ERP system using MERN stack",
        "Designed and implemented RESTful APIs",
        "Created responsive interfaces with React.js and Redux",
        "Implemented secure authentication systems",
        "Utilized WebSockets for real-time features",
      ],
    },
    {
      company: "TechVention",
      location: "Lahore, Pakistan",
      period: "2022 - 2024",
      role: "Software Engineer",
      responsibilities: [
        "Migrated codebase to Fastify with TypeScript",
        "Implemented OOP concepts for scalability",
        "Built backend REST API and OAuth",
        "Integrated third-party APIs",
        "Implemented i18n features",
      ],
    },
  ]

  return (
    <section id="experience" className="section-shell">
      <div className="surface-grid relative z-10">
        <AnimatedSectionHeader title="Professional Experience" />
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card relative overflow-hidden"
            >
              <div
                className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-cyan-200/60 opacity-70 transition-transform duration-500 group-hover:scale-110 dark:bg-cyan-700/40"
              ></div>
              <div className="relative z-10">
                <h3 className="mb-2 flex items-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {exp.company === "Freelance" ? <Globe className="mr-2 h-6 w-6 text-cyan-500" /> : null}
                  {exp.company}
                </h3>
                <p className="mb-2 flex items-center text-slate-600 dark:text-slate-300">
                  <MapPin className="mr-2 h-4 w-4" />
                  {exp.location}
                </p>
                <p className="mb-4 flex items-center text-slate-600 dark:text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {exp.period}
                </p>
                <p className="mb-4 flex items-center text-xl font-medium text-slate-700 dark:text-slate-200">
                  <Briefcase className="mr-2 h-5 w-5" />
                  {exp.role}
                </p>
                <ul className="list-none space-y-2">
                  {exp.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start text-slate-700 dark:text-slate-300">
                      <span className="mr-2 text-cyan-500">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}

