import { LucideIcon } from "lucide-react"

interface cardProps {
  title: string
  subtitle: string
  icon: LucideIcon
}

export const HeroCard = ({ title, subtitle, icon: Icon }: cardProps) => {
  return (
    <div className="flex h-auto flex-row rounded-2xl bg-white dark:bg-[#2e2c3a] p-4 sm:p-5">
      <div className="flex-shrink-0 border-r pr-4 sm:pr-5 flex items-start pt-1">
        <Icon size={32} className="text-black dark:text-violet-500 sm:w-10 sm:h-10" />
      </div>
      <div className="pl-4 sm:pl-5">
        <h1 className="text-xs sm:text-lg font-semibold leading-snug">{title}</h1>
        <p className="text-[12px] sm:text-base pt-1 sm:pt-2 text-black dark:text-gray-300 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}

export default HeroCard