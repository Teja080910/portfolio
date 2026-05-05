export const sectionViewport = {
  once: true,
  amount: 0.16,
} as const

export const softReveal = {
  initial: { opacity: 0, y: 30, scale: 0.985 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: sectionViewport,
  transition: {
    duration: 0.68,
    ease: [0.22, 1, 0.36, 1] as const,
  },
} as const

export const buildStaggerReveal = (index = 0, step = 0.1) => ({
  ...softReveal,
  transition: {
    ...softReveal.transition,
    delay: Math.min(index * step, 0.36),
  },
})
