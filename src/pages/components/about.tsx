"use client"

import { motion } from "framer-motion"
import { Code, Database, Server, Zap } from "lucide-react"
import Image from "next/image"

export default function About() {
  const skills = [
    { icon: <Code className="h-7 w-7 text-cyan-600 dark:text-cyan-300" />, title: "Frontend", description: "React, Next.js, Redux" },
    { icon: <Server className="h-7 w-7 text-teal-600 dark:text-teal-300" />, title: "Backend", description: "Node.js, Express, Fastify" },
    { icon: <Database className="h-7 w-7 text-sky-600 dark:text-sky-300" />, title: "Database", description: "MongoDB, Mongoose" },
    { icon: <Zap className="h-7 w-7 text-amber-600 dark:text-amber-300" />, title: "Performance", description: "Optimization, Caching" },
  ]

  return (
    <section id="about" className="section-shell">
      <div className="surface-grid relative z-10">
        <motion.h2
          className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55 }}
        >
          About Me
        </motion.h2>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <span className="accent-chip">Who I Am</span>
            <p className="mb-6 mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              As a passionate MERN Stack Developer, I specialize in building robust and scalable web applications. With
              a strong foundation in MongoDB, Express.js, React, and Node.js, I create seamless full-stack solutions
              that deliver exceptional user experiences.
            </p>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              My expertise extends to modern frameworks like Next.js and state management tools like Redux. I&apos;m
              committed to writing clean, efficient code and staying up-to-date with the latest industry trends to
              deliver cutting-edge solutions for my clients.
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            {skills.map((skill, index) => (
              <div key={index} className="glass-card">
                {skill.icon}
                <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{skill.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{skill.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}

