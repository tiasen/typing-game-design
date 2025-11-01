"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { STAGES } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useGuest } from "@/lib/guest-context"

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { guestProfile, getAllProgress } = useGuest()
  const [profile, setProfile] = useState<any>(null)
  const [progressData, setProgressData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (!error && user) {
        setIsAuthenticated(true)
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        const { data: progress } = await supabase.from("learning_progress").select("*").eq("user_id", user.id)

        setProfile(profileData)
        setProgressData(progress || [])
        setLoading(false)
        return
      }

      if (guestProfile) {
        setIsAuthenticated(false)
        const guestProgress = getAllProgress()
        setProfile({ display_name: guestProfile.username, avatar_color: guestProfile.avatarColor })
        setProgressData(
          guestProgress.map((p) => ({
            stage_id: p.stageId,
            completed: p.completed,
            stars: p.stars,
            best_wpm: p.bestWpm,
            best_accuracy: p.bestAccuracy,
          })),
        )
        setLoading(false)
        return
      }

      router.push("/")
    }

    loadData()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/")
      } else if (event === "SIGNED_IN") {
        loadData()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, guestProfile, getAllProgress])

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100" />
  }

  const progressMap = new Map(progressData?.map((p) => [p.stage_id, p]) || [])
  const completedStages = progressData?.filter((p) => p.completed).length || 0
  const totalStages = STAGES.length
  const overallProgress = (completedStages / totalStages) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b-4 border-primary/20 shadow-lg relative">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⌨️</div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{t("appTitle")}</h1>
              <p className="text-sm text-muted-foreground">
                {!isAuthenticated ? t("guestWelcome") : `${t("welcomeBackUser")}, ${profile?.display_name}!`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link href="/leaderboard">
                <Button variant="outline" className="rounded-full border-2 bg-transparent">
                  <span className="text-xl mr-2">🏆</span>
                  {t("leaderboard")}
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button variant="outline" className="rounded-full border-2 bg-transparent">
                <span className="text-xl mr-2">⚙️</span>
                {t("settings")}
              </Button>
            </Link>
            {/* Language Switcher */}
            <div className="ml-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!isAuthenticated && (
          <Card className="mb-6 border-4 border-yellow-400/50 bg-yellow-50 shadow-xl rounded-3xl">
            <CardContent className="py-4">
              <p className="text-center text-sm font-medium text-yellow-800">⚠️ {t("guestLimitation")}</p>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="mb-8 border-4 border-primary/20 shadow-xl rounded-3xl animate-bounce-in">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-3xl">📊</span>
              {t("yourProgress")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("youveCompleted")} {completedStages} {t("outOf")} {totalStages} {t("stages")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-4" />
            <p className="text-center mt-2 text-lg font-semibold text-primary">{Math.round(overallProgress)}%</p>
          </CardContent>
        </Card>

        {/* Stages Grid */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            {t("learningStages")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STAGES.map((stage, index) => {
              const progress = progressMap.get(stage.id)
              const isLocked = index > 0 && !progressMap.get(STAGES[index - 1].id)?.completed
              const isCompleted = progress?.completed || false

              return (
                <Card
                  key={stage.id}
                  className={`border-4 shadow-xl rounded-3xl transition-all hover:scale-105 ${
                    isLocked
                      ? "border-muted/50 opacity-60"
                      : isCompleted
                        ? "border-accent/50 bg-accent/5"
                        : "border-primary/20"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-5xl mb-2">{stage.icon}</div>
                      {isLocked && <div className="text-3xl">🔒</div>}
                      {isCompleted && <div className="text-3xl">✅</div>}
                    </div>
                    <CardTitle className="text-xl">{t(`stage${stage.id}Title` as any)}</CardTitle>
                    <CardDescription className="text-base">{t(`stage${stage.id}Desc` as any)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t("bestWPM")}:</span>
                          <span className="font-bold text-primary">{progress.best_wpm}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t("bestAccuracy")}:</span>
                          <span className="font-bold text-accent">{progress.best_accuracy}%</span>
                        </div>
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3].map((star) => (
                            <span key={star} className="text-2xl">
                              {star <= (progress.stars || 0) ? "⭐" : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <Link href={isLocked ? "#" : `/practice/${stage.id}`}>
                        <Button
                          className="w-full h-12 rounded-2xl shadow-lg"
                          disabled={isLocked}
                          variant={isCompleted ? "outline" : "default"}
                        >
                          {isLocked ? t("locked") : isCompleted ? t("practiceAgain") : t("startLearningBtn")}
                        </Button>
                      </Link>
                      {progress && !isLocked && (
                        <Link href={`/game/${stage.id}`}>
                          <Button className="w-full h-12 rounded-2xl shadow-lg" variant="secondary">
                            <span className="mr-2">🎮</span>
                            {t("playGame")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
