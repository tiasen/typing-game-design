"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Language } from "./i18n"
import { translations } from "./i18n"

export type GameSpeed = "slow" | "normal" | "fast"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  gameSpeed: GameSpeed
  setGameSpeed: (speed: GameSpeed) => void
  t: (key: keyof typeof translations.en) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [gameSpeed, setGameSpeedState] = useState<GameSpeed>("normal")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "en" || saved === "zh")) {
      setLanguageState(saved)
    }
    const savedSpeed = localStorage.getItem("gameSpeed") as GameSpeed
    if (savedSpeed && (savedSpeed === "slow" || savedSpeed === "normal" || savedSpeed === "fast")) {
      setGameSpeedState(savedSpeed)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const setGameSpeed = (speed: GameSpeed) => {
    setGameSpeedState(speed)
    localStorage.setItem("gameSpeed", speed)
  }

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, gameSpeed, setGameSpeed, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
