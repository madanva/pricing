"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface LanguageToggleProps {
  className?: string
  showText?: boolean
}

export default function LanguageToggle({ className = "", showText = true }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const toggleLanguage = (lang: "en" | "th") => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white rounded-lg shadow-sm transition-colors"
        aria-label={t("language")}
      >
        <Globe size={18} />
        {showText && <span className="text-sm font-medium">{language === "en" ? "EN" : "TH"}</span>}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border z-50 min-w-[120px]">
            <button
              onClick={() => toggleLanguage("en")}
              className={cn(
                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg transition-colors",
                language === "en" && "bg-blue-50 text-blue-600 font-medium",
              )}
            >
              {t("english")}
            </button>
            <button
              onClick={() => toggleLanguage("th")}
              className={cn(
                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg transition-colors",
                language === "th" && "bg-blue-50 text-blue-600 font-medium",
              )}
            >
              {t("thai")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
