"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="max-w-4xl w-full text-center space-y-8 animate-bounce-in">
        {/* Cute mascot area */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="text-9xl animate-float">⌨️</div>
            <div className="absolute -top-4 -right-4 text-6xl animate-wiggle">✨</div>
          </div>
        </div>

        {/* Title - Using translations */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary tracking-tight">{t("appTitle")}</h1>
          <p className="text-2xl text-muted-foreground font-medium">{t("appTagline")}</p>
        </div>

        {/* Features - Using translations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-card p-6 rounded-3xl shadow-lg border-4 border-primary/20">
            <div className="text-5xl mb-3">🎮</div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("funGames")}</h3>
            <p className="text-muted-foreground">{t("funGamesDesc")}</p>
          </div>
          <div className="bg-card p-6 rounded-3xl shadow-lg border-4 border-accent/20">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("earnStars")}</h3>
            <p className="text-muted-foreground">{t("earnStarsDesc")}</p>
          </div>
          <div className="bg-card p-6 rounded-3xl shadow-lg border-4 border-secondary/20">
            <div className="text-5xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("trackProgress")}</h3>
            <p className="text-muted-foreground">{t("trackProgressDesc")}</p>
          </div>
        </div>

        {/* CTA Buttons - Using translations */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            asChild
            size="lg"
            className="w-64 h-14 text-lg rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <Link href="/guest-setup">{t("startLearning")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-64 h-14 text-lg rounded-full shadow-lg hover:scale-105 transition-transform border-4 bg-transparent"
          >
            <Link href="/auth/login">{t("login")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
