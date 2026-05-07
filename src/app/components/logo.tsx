type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
  variant?: "default" | "icon-only" | "text-only"
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
}

export default function Logo({
  className = "",
  size = "md",
  showText = true,
  variant = "default",
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]
  const svgSize = iconSize + 8 // slight padding

  const Logomark = () => (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />   {/* cyan-400 */}
          <stop offset="100%" stopColor="#14b8a6" /> {/* teal-500 */}
        </linearGradient>
        <linearGradient id="logoGradDark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />   {/* cyan-500 */}
          <stop offset="100%" stopColor="#0d9488" /> {/* teal-600 */}
        </linearGradient>
      </defs>

      {/* Outer ring - decorative orbit */}
      <circle
        cx="22"
        cy="22"
        r="19"
        stroke="url(#logoGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        className="dark:hidden"
        opacity="0.6"
      />
      <circle
        cx="22"
        cy="22"
        r="19"
        stroke="url(#logoGradDark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        className="hidden dark:block"
        opacity="0.6"
      />

      {/* Background circle */}
      <circle
        cx="22"
        cy="22"
        r="14"
        className="fill-white/90 dark:fill-slate-800/90"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
      />

      {/* Stylized "folio" mark - a geometric document/person hybrid */}
      <g transform="translate(22, 22)">
        {/* Left stroke - stylized bracket/person */}
        <path
          d="M-5,-9 C-5,-9 -9,-6 -9,-2 C-9,2 -5,5 -5,5"
          stroke="url(#logoGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right stroke - document/page */}
        <path
          d="M5,-9 L9,-5 L9,6 C9,8 7,9 5,9 L-5,9 C-7,9 -9,8 -9,6 L-9,-2"
          stroke="url(#logoGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Accent dot */}
        <circle cx="2" cy="-1" r="1.8" fill="url(#logoGrad)" />
      </g>
    </svg>
  )

  if (variant === "icon-only") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Logomark />
      </div>
    )
  }

  if (variant === "text-only") {
    return (
      <span
        className={`inline-flex items-center font-sora font-bold tracking-tight ${textSize} ${className}`}
      >
        <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-teal-400">
          folio
        </span>
      </span>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logomark />
      {showText && (
        <span
          className={`font-sora font-bold tracking-tight ${textSize}`}
        >
          <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-teal-400">
            folio
          </span>
        </span>
      )}
    </div>
  )
}
