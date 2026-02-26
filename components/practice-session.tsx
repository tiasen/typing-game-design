"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Stage } from "@/lib/types"
import { getAudioManager } from "@/lib/audio"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useGuest } from "@/lib/guest-context"
import { generateStageContent } from "@/lib/content-generator" // Import content generator
import { KeyboardDisplay } from "@/components/keyboard-display"
import { ComboDisplay } from "@/components/combo-display"
import { ProgressMascot } from "@/components/progress-mascot"
import confetti from "canvas-confetti"

interface PracticeSessionProps {
  stage: Stage
  userId: string
}

export function PracticeSession({ stage, userId }: PracticeSessionProps) {
  const { t } = useLanguage()
  const { isGuest, saveProgress: saveGuestProgress } = useGuest()

  const [practiceContent] = useState(() => generateStageContent(stage.id))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [errors, setErrors] = useState(0)
  const [totalChars, setTotalChars] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [stars, setStars] = useState(0)
  const [combo, setCombo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentText = practiceContent[currentIndex]
  
  // Calculate total progress across all sentences
  const totalSentences = practiceContent.length
  // Current sentence progress
  const currentSentenceProgress = input.length / currentText.length
  // Overall progress: (completed sentences + current sentence partial) / total sentences
  const progress = ((currentIndex + currentSentenceProgress) / totalSentences) * 100

  const nextChar = input.length < currentText.length ? currentText[input.length] : undefined

  useEffect(() => {
    if (!startTime && input.length > 0) {
      setStartTime(Date.now())
    }
  }, [input, startTime])

  const calculateResults = useCallback((finalCharsToAdd = 0) => {
    if (!startTime) return { wpm: 0, accuracy: 100 }

    const timeInMinutes = (Date.now() - startTime) / 60000
    const finalTotalChars = totalChars + finalCharsToAdd
    const wordsTyped = finalTotalChars / 5
    const calculatedWpm = Math.round(wordsTyped / timeInMinutes)
    const calculatedAccuracy = finalTotalChars > 0 
      ? Math.round(((finalTotalChars - errors) / finalTotalChars) * 100)
      : 100

    return { wpm: calculatedWpm, accuracy: calculatedAccuracy }
  }, [startTime, totalChars, errors])

  const calculateStars = (wpm: number, accuracy: number) => {
    if (accuracy < 80) return 1 // Slightly more forgiving accuracy floor
    
    // 3 Stars: Meet both targets
    if (wpm >= stage.targetWpm && accuracy >= stage.targetAccuracy) return 3
    
    // 2 Stars: Meet 80% of speed target AND (meet accuracy target OR be within 5% of accuracy)
    const speedScore = wpm / stage.targetWpm
    if (speedScore >= 0.8 && accuracy >= (stage.targetAccuracy - 5)) return 2
    
    return 1
  }

  const handleComplete = useCallback(async (finalCharsToAdd = 0) => {
    const results = calculateResults(finalCharsToAdd)
    const earnedStars = calculateStars(results.wpm, results.accuracy)

    setWpm(results.wpm)
    setAccuracy(results.accuracy)
    setStars(earnedStars)
    setIsComplete(true)

    // Trigger celebration confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FFA07A']
    })

    const audioManager = getAudioManager()
    audioManager.playComplete()

    if (isGuest) {
      saveGuestProgress({
        stageId: stage.id,
        completed: true,
        stars: earnedStars,
        bestWpm: results.wpm,
        bestAccuracy: results.accuracy,
        completedAt: new Date().toISOString(),
      })
    } else {
      const supabase = createClient()

      const { data: existingProgress } = await supabase
        .from("learning_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("stage_id", stage.id)
        .single()

      if (existingProgress) {
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
    }
  }, [calculateResults, stage, userId, isGuest, saveGuestProgress])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const audioManager = getAudioManager()

    if (e.key === "Enter" && input === currentText) {
      audioManager.playSuccess()
      
      // Trigger mini confetti for sentence completion
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        scalar: 0.7,
        shapes: ['star'],
        colors: ['#FFE4E1', '#E6E6FA']
      })
      
      // Bonus combo for finishing sentence
      setCombo(prev => prev + 5)

      if (currentIndex < practiceContent.length - 1) {
        setTotalChars((prev) => prev + currentText.length)
        setCurrentIndex((prev) => prev + 1)
        setInput("")
      } else {
        // Pass the length of the last sentence, as state hasn't updated yet
        handleComplete(currentText.length)
      }
    } else if (e.key.length === 1) {
      audioManager.playKeyPress()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const audioManager = getAudioManager()

    if (newValue.length > input.length) {
      const newChar = newValue[newValue.length - 1]
      const expectedChar = currentText[newValue.length - 1]
      if (newChar !== expectedChar) {
        setErrors((prev) => prev + 1)
        audioManager.playError()
        setCombo(0) // Reset combo on error
      } else {
        // Correct char typed
        setCombo(prev => prev + 1)
      }
    }

    setInput(newValue)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setInput("")
    setStartTime(null)
    setErrors(0)
    setTotalChars(0)
    setIsComplete(false)
    setWpm(0)
    setAccuracy(100)
    setStars(0)
    setCombo(0)
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
              <Button className="w-full h-14 text-lg rounded-2xl shadow-lg" onClick={handleRestart}>
                {t("practiceAgain")}
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
              <h1 className="text-xl font-bold text-primary">{t(stage.title as any)}</h1>
              <p className="text-sm text-muted-foreground">{t(stage.description as any)}</p>
            </div>
          </div>
          <div className="text-2xl">{stage.icon}</div>
        </div>
      </header>

      {/* Progress Mascot */}
      <div className="pt-6 px-6 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ProgressMascot progress={progress} />
        </div>
      </div>

      {/* Practice Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <ComboDisplay combo={combo} />
        
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
            {/* Left: Keyboard Display */}
            <div className="lg:sticky lg:top-6">
              <KeyboardDisplay currentKey={nextChar} />
            </div>

            {/* Right: Practice Content */}
            <Card className="border-4 border-primary/20 shadow-2xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">{t("typeTextBelow")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Text to type */}
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <p className="text-4xl font-mono tracking-wide">
                    {currentText.split("").map((char, idx) => {
                      let color = "text-foreground"
                      if (input.length > idx) {
                        color = input[idx] === char ? "text-green-500" : "text-red-500"
                      }
                      return (
                        <span key={idx} className={color}>
                          {char}
                        </span>
                      )
                    })}
                  </p>
                </div>

                {/* Input field */}
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                    placeholder={t("startTyping")}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    onBlur={() => {
                      setTimeout(() => {
                        inputRef.current?.focus()
                      }, 100)
                    }}
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
          </div>
        </div>
      </main>
    </div>
  )
}
