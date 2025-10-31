"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Stage } from "@/lib/types"
import { getAudioManager } from "@/lib/audio"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

interface PracticeSessionProps {
  stage: Stage
  userId: string
}

export function PracticeSession({ stage, userId }: PracticeSessionProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [errors, setErrors] = useState(0)
  const [totalChars, setTotalChars] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [stars, setStars] = useState(0)

  const currentText = stage.content[currentIndex]
  const progress = ((currentIndex + 1) / stage.content.length) * 100

  useEffect(() => {
    if (!startTime && input.length > 0) {
      setStartTime(Date.now())
    }
  }, [input, startTime])

  const calculateResults = useCallback(() => {
    if (!startTime) return { wpm: 0, accuracy: 100 }

    const timeInMinutes = (Date.now() - startTime) / 60000
    const wordsTyped = totalChars / 5
    const calculatedWpm = Math.round(wordsTyped / timeInMinutes)
    const calculatedAccuracy = Math.round(((totalChars - errors) / totalChars) * 100)

    return { wpm: calculatedWpm, accuracy: calculatedAccuracy }
  }, [startTime, totalChars, errors])

  const calculateStars = (wpm: number, accuracy: number) => {
    if (accuracy < 85) return 1
    if (wpm >= stage.targetWpm && accuracy >= stage.targetAccuracy) return 3
    if (wpm >= stage.targetWpm * 0.8 && accuracy >= stage.targetAccuracy - 3) return 2
    return 1
  }

  const handleComplete = useCallback(async () => {
    const results = calculateResults()
    const earnedStars = calculateStars(results.wpm, results.accuracy)

    setWpm(results.wpm)
    setAccuracy(results.accuracy)
    setStars(earnedStars)
    setIsComplete(true)

    const audioManager = getAudioManager()
    audioManager.playComplete()

    // Save progress to database
    const supabase = createClient()

    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("stage_id", stage.id)
      .single()

    if (existingProgress) {
      // Update if better
      await supabase
        .from("learning_progress")
        .update({
          completed: true,
          stars: Math.max(existingProgress.stars, earnedStars),
          best_wpm: Math.max(existingProgress.best_wpm, results.wpm),
          best_accuracy: Math.max(existingProgress.best_accuracy, results.accuracy),
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)
    } else {
      // Insert new
      await supabase.from("learning_progress").insert({
        user_id: userId,
        stage_id: stage.id,
        completed: true,
        stars: earnedStars,
        best_wpm: results.wpm,
        best_accuracy: results.accuracy,
        completed_at: new Date().toISOString(),
      })
    }
  }, [calculateResults, stage, userId])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const audioManager = getAudioManager()

    if (e.key === "Enter" && input === currentText) {
      audioManager.playSuccess()
      setTotalChars((prev) => prev + currentText.length)

      if (currentIndex < stage.content.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setInput("")
      } else {
        handleComplete()
      }
    } else if (e.key.length === 1) {
      audioManager.playKeyPress()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const audioManager = getAudioManager()

    // Check for errors
    if (newValue.length > input.length) {
      const newChar = newValue[newValue.length - 1]
      const expectedChar = currentText[newValue.length - 1]
      if (newChar !== expectedChar) {
        setErrors((prev) => prev + 1)
        audioManager.playError()
      }
    }

    setInput(newValue)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-4 border-accent/50 shadow-2xl rounded-3xl animate-bounce-in">
          <CardHeader className="text-center">
            <div className="text-7xl mb-4 animate-float">🎉</div>
            <CardTitle className="text-3xl text-foreground">{t("stageComplete")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((star) => (
                <span key={star} className="text-5xl animate-bounce-in" style={{ animationDelay: `${star * 0.1}s` }}>
                  {star <= stars ? "⭐" : "☆"}
                </span>
              ))}
            </div>

            <div className="space-y-3 bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("speed")}:</span>
                <span className="text-2xl font-bold text-primary">
                  {wpm} {t("wpm")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("accuracy")}:</span>
                <span className="text-2xl font-bold text-accent">{accuracy}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 text-lg rounded-2xl shadow-lg" asChild>
                <Link href={`/practice/${stage.id}`}>{t("practiceAgain")}</Link>
              </Button>
              <Button className="w-full h-14 text-lg rounded-2xl shadow-lg" asChild>
                <Link href={`/game/${stage.id}`}>
                  <span className="mr-2">🎮</span>
                  {t("playGame")}
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-14 text-lg rounded-2xl border-2 bg-transparent" asChild>
                <Link href="/dashboard">{t("backToDashboard")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b-4 border-primary/20 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <span className="text-2xl">←</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary">{stage.title}</h1>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </div>
          </div>
          <div className="text-2xl">{stage.icon}</div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card/50 px-6 py-3">
        <Progress value={progress} className="h-3" />
        <p className="text-center mt-2 text-sm font-medium">
          {currentIndex + 1} / {stage.content.length}
        </p>
      </div>

      {/* Practice Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-3xl w-full border-4 border-primary/20 shadow-2xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">{t("typeTextBelow")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Text to type */}
            <div className="bg-muted/30 rounded-2xl p-8 text-center">
              <p className="text-4xl font-mono tracking-wide text-foreground">{currentText}</p>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                placeholder={t("startTyping")}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
              <div className="flex justify-between text-sm text-muted-foreground px-2">
                <span>{t("pressEnter")}</span>
                <span className={input === currentText ? "text-accent font-bold" : ""}>
                  {input === currentText ? `✓ ${t("correct")}` : `${input.length} / ${currentText.length}`}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-around text-center">
              <div>
                <p className="text-sm text-muted-foreground">{t("errors")}</p>
                <p className="text-2xl font-bold text-destructive">{errors}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("characters")}</p>
                <p className="text-2xl font-bold text-primary">{totalChars}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
