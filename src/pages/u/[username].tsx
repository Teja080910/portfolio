import dynamic from "next/dynamic"

const PortfolioPage = dynamic(() => import("@/app/components/portfolio-page"), { ssr: false })

export default function PublicPortfolioPage() {
  return <PortfolioPage />
}
