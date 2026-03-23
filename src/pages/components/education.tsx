"use client"

import { motion } from "framer-motion"
import { Award, Calendar, GraduationCap } from "lucide-react"
import Image from "next/image"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

export default function Education() {
  const education = [
    {
      degree: "Bachelor's Degree in Computer Science",
      institution: "GC University Faisalabad",
      period: "2018 – 2022",
      achievements: [
        "Graduated with honors",
        "Specialized in Web Technologies and Artificial Intelligence",
        "Completed capstone project on 'Intelligent Web Application for Healthcare'",
      ],
    },
  ]

  return (
    <section id="education" className="section-shell">
      <div className="surface-grid relative z-10">
        <AnimatedSectionHeader title="Education" />
        <div className="max-w-3xl mx-auto">
          {education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55 }}
              className="glass-card relative overflow-hidden p-8"
            >
              <div className="absolute left-0 top-0 h-28 w-28 rounded-br-full bg-cyan-200/60 opacity-80 dark:bg-cyan-700/35"></div>
              <div className="relative z-10">
                <h3 className="mb-2 flex items-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  <GraduationCap className="mr-2 h-6 w-6" />
                  {edu.degree}
                </h3>
                <p className="mb-4 text-xl text-slate-600 dark:text-slate-300">{edu.institution}</p>
                <p className="mb-4 flex items-center text-slate-600 dark:text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {edu.period}
                </p>
                <h4 className="mb-2 flex items-center text-lg font-medium text-slate-700 dark:text-slate-200">
                  <Award className="mr-2 h-5 w-5" />
                  Key Achievements:
                </h4>
                <ul className="list-disc list-inside space-y-2">
                  {edu.achievements.map((achievement, idx) => (
                    <li key={idx} className="text-slate-700 dark:text-slate-300">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute top-8 left-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}

