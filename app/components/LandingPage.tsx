"use client"

import { Loader2, ArrowRight, ArrowDown, ArrowUp } from "lucide-react"
import ShareButton from "./ShareButton"
import LanguageToggle from "../../components/LanguageToggle"
import { useLanguage } from "@/contexts/LanguageContext"

interface LandingPageProps {
  onBegin: () => void
  isLoading: boolean
}

export default function LandingPage({ onBegin, isLoading }: LandingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="relative flex flex-col items-center justify-center h-[70vh] text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
      {/* Language Toggle - positioned at top right */}
      <div className="absolute top-2 right-2">
        <LanguageToggle />
      </div>

      <div className="mb-6">
        <h1 className="text-4xl font-bold">{t("appTitle")}</h1>
        <p className="text-gray-500 mt-1">{t("appSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs">
        <div className="flex flex-col items-center bg-green-50 p-3 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <ArrowRight className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-green-700">{t("fairPrice")}</p>
        </div>
        <div className="flex flex-col items-center bg-red-50 p-3 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <ArrowRight className="h-5 w-5 text-red-600 transform rotate-180" />
          </div>
          <p className="text-sm font-medium text-red-700">{t("notInterested")}</p>
        </div>
        <div className="flex flex-col items-center bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <ArrowUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-purple-700">{t("shouldBeHigher")}</p>
        </div>
        <div className="flex flex-col items-center bg-amber-50 p-3 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <ArrowDown className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-700">{t("shouldBeLower")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBegin}
          disabled={isLoading}
          className={`px-6 py-3 rounded-full text-lg font-medium shadow-md flex items-center justify-center min-w-[200px] ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600 transition-colors"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              {t("loadingPrices")}
            </>
          ) : (
            t("beginSwiping")
          )}
        </button>

        <ShareButton className="px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-medium hover:bg-blue-600 transition-colors shadow-md" />
      </div>
    </div>
  )
}
