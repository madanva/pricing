"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "en" | "th"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Landing Page
    appTitle: "Clothes Swiper",
    appSubtitle: "Rate product prices with a swipe",
    beginSwiping: "Begin Swiping",
    loadingPrices: "Loading Prices...",
    fairPrice: "Fair Price",
    notInterested: "Not Interested",
    shouldBeHigher: "Should Be Higher",
    shouldBeLower: "Should Be Lower",

    // Instructions
    howToRate: "How to Rate Prices",
    swipeRightFair: "Swipe RIGHT if price is FAIR",
    swipeLeftDislike: "Swipe LEFT if you DISLIKE",
    swipeUpHigher: "Swipe UP if price should be HIGHER",
    swipeDownLower: "Swipe DOWN if price should be LOWER",
    gotIt: "Got it!",

    // Feedback indicators
    priceHigher: "Price Should Be Higher",
    priceLower: "Price Should Be Lower",

    // Summary
    thankYou: "Thank you for your feedback!",
    helpImprove: "Your input will help improve our pricing recommendations.",
    startAgain: "Start Again",
    feedbackSummary: "Your Feedback Summary:",
    product: "Product",

    // Feedback types
    fairPriceText: "Fair Price",
    priceHigherText: "Price Higher",
    priceLowerText: "Price Lower",
    notInterestedText: "Not Interested",

    // Language toggle
    language: "Language",
    english: "English",
    thai: "ไทย",
  },
  th: {
    // Landing Page
    appTitle: "เสื้อผ้าสไวเปอร์",
    appSubtitle: "ให้คะแนนราคาสินค้าด้วยการปัด",
    beginSwiping: "เริ่มปัด",
    loadingPrices: "กำลังโหลดราคา...",
    fairPrice: "ราคาเหมาะสม",
    notInterested: "ไม่สนใจ",
    shouldBeHigher: "ควรสูงกว่านี้",
    shouldBeLower: "ควรต่ำกว่านี้",

    // Instructions
    howToRate: "วิธีให้คะแนนราคา",
    swipeRightFair: "ปัดขวา หากราคาเหมาะสม",
    swipeLeftDislike: "ปัดซ้าย หากไม่ชอบ",
    swipeUpHigher: "ปัดขึ้น หากราคาควรสูงกว่านี้",
    swipeDownLower: "ปัดลง หากราคาควรต่ำกว่านี้",
    gotIt: "เข้าใจแล้ว!",

    // Feedback indicators
    priceHigher: "ราคาควรสูงกว่านี้",
    priceLower: "ราคาควรต่ำกว่านี้",

    // Summary
    thankYou: "ขอบคุณสำหรับความคิดเห็น!",
    helpImprove: "ข้อมูลของคุณจะช่วยปรับปรุงคำแนะนำราคาของเรา",
    startAgain: "เริ่มใหม่",
    feedbackSummary: "สรุปความคิดเห็นของคุณ:",
    product: "สินค้า",

    // Feedback types
    fairPriceText: "ราคาเหมาะสม",
    priceHigherText: "ราคาสูงกว่านี้",
    priceLowerText: "ราคาต่ำกว่านี้",
    notInterestedText: "ไม่สนใจ",

    // Language toggle
    language: "ภาษา",
    english: "English",
    thai: "ไทย",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
