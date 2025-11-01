"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Stage } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { getAudioManager } from "@/lib/audio"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { generateStageContent } from "@/lib/content-generator"

interface Fruit {
  id: number
  word: string
  x: number
  y: number
  emoji: string
  rotation: number
}

const FRUIT_EMOJIS = ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍑"]

interface FruitGameProps {
  stage: Stage
  userId: string
  userName: string
  onBack: () => void
}

export function FruitGame({ stage, userId, userName, onBack }: FruitGameProps) {
  const { t, gameSpeed } = useLanguage()
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalTyped, setTotalTyped] = useState(0)
  const [errors, setErrors] = useState(0)
  const [nextFruitId, setNextFruitId] = useState(0)
  const [slicedFruits, setSlicedFruits] = useState<{ id: number; x: number; y: number }[]>([])
  const [practiceContent] = useState(() => generateStageContent(stage.id))

  const spawnFruit = useCallback(() => {
    const word = practiceContent[Math.floor(Math.random() * practiceContent.length)]
    const newFruit: Fruit = {
      id: nextFruitId,
      word,
      x: Math.random() * 70 + 15,
      y: 110,
      emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
      rotation: Math.random() * 360,
    }
    setNextFruitId((prev) => prev + 1)
    setFruits((prev) => [...prev, newFruit])
  }, [practiceContent, nextFruitId])

  useEffect(() => {
    if (!isPlaying || isComplete) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false)
          setIsComplete(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isComplete])

  const getSpeedMultiplier = () => {
    switch (gameSpeed) {
      case "slow":
        return 0.2 // 80% slower
      case "fast":
        return 1 // 50% faster
      default:
        return 0.5 // normal speed
    }
  }

  const speedMultiplier = getSpeedMultiplier()

  useEffect(() => {
    if (!isPlaying || isComplete) return

    const moveInterval = setInterval(() => {
      setFruits((prev) =>
        prev
          .map((fruit) => ({
            ...fruit,
            y: fruit.y - 2 * speedMultiplier,
            rotation: fruit.rotation + 5 * speedMultiplier,
          }))
          .filter((fruit) => fruit.y > -20),
      )
    }, 50)

    return () => clearInterval(moveInterval)
  }, [isPlaying, isComplete, speedMultiplier])

  useEffect(() => {
    if (!isPlaying || isComplete) return
    // 保证场上至少有1个目标
    if (fruits.length === 0) {
      spawnFruit()
    }
  }, [isPlaying, isComplete, fruits.length, spawnFruit])

  const handleStart = () => {
    setIsPlaying(true)
    setFruits([])
    setSlicedFruits([])
    setScore(0)
    setTimeLeft(60)
    setTotalTyped(0)
    setErrors(0)
    setIsComplete(false)
    spawnFruit()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const audioManager = getAudioManager()

    // 查找与输入完全匹配的目标
    const matchedFruit = fruits.find((f) => value === f.word)
    if (matchedFruit) {
      audioManager.playSuccess()
      setScore((prev) => prev + matchedFruit.word.length * 12)
      setTotalTyped((prev) => prev + matchedFruit.word.length)

      setSlicedFruits((prev) => [...prev, { id: matchedFruit.id, x: matchedFruit.x, y: matchedFruit.y }])
      setTimeout(() => {
        setSlicedFruits((prev) => prev.filter((f) => f.id !== matchedFruit.id))
      }, 800)

      setFruits((prev) => prev.filter((f) => f.id !== matchedFruit.id))
      setInput("")
    } else if (value.length > 0) {
      audioManager.playError()
      setErrors((prev) => prev + 1)
      setInput("")
    }
  }

  const saveScore = useCallback(async () => {
    const timeElapsed = (60 - timeLeft) / 60
    const calculatedWpm = Math.round(totalTyped / 5 / timeElapsed)
    const calculatedAccuracy = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100

    setWpm(calculatedWpm)
    setAccuracy(calculatedAccuracy)

    const supabase = createClient()
    await supabase.from("game_scores").insert({
      user_id: userId,
      stage_id: stage.id,
      game_type: "fruit",
      wpm: calculatedWpm,
      accuracy: calculatedAccuracy,
      score,
      duration: 60 - timeLeft,
    })

    const audioManager = getAudioManager()
    audioManager.playComplete()
  }, [userId, stage.id, score, timeLeft, totalTyped, errors])

  useEffect(() => {
    if (isComplete && !isPlaying) {
      saveScore()
    }
  }, [isComplete, isPlaying, saveScore])

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-4 border-accent/50 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-float">🏆</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("fruitMaster")}</h2>
              <p className="text-xl text-muted-foreground">
                {t("amazingSlicing")}, {userName}!
              </p>
            </div>

            <div className="space-y-3 bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("score")}:</span>
                <span className="text-2xl font-bold text-primary">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("speed")}:</span>
                <span className="text-2xl font-bold text-accent">
                  {wpm} {t("wpm")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t("accuracy")}:</span>
                <span className="text-2xl font-bold text-secondary">{accuracy}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("playAgain")}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
              >
                {t("chooseDifferentGame")}
              </Button>
              <Button variant="ghost" className="w-full h-12 text-lg rounded-2xl" asChild>
                <Link href="/dashboard">{t("backToDashboard")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-4 border-secondary/20 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-wiggle">🍎</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("fruitNinja")}</h2>
              <p className="text-lg text-muted-foreground">{t("fruitDesc")}</p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
              <p className="text-center font-medium">{t("howToPlay")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Type words on flying fruits</li>
                <li>• Slice them before they fall</li>
                <li>• More fruits = more points</li>
                <li>• You have 60 seconds</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("startSlicing")}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
              >
                {t("back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-amber-100 via-orange-100 to-red-100">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🔪</div>
          <div>
            <p className="text-sm text-muted-foreground">{t("score")}</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t("timeLeft")}</p>
          <p className="text-3xl font-bold text-destructive">{timeLeft}s</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative rounded-3xl border-4 border-primary/20 overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
        {/* Fruits */}
        {fruits.map((fruit) => (
          <div
            key={fruit.id}
            className="absolute transition-all duration-100"
            style={{
              left: `${fruit.x}%`,
              bottom: `${fruit.y}%`,
              transform: `translate(-50%, 50%) rotate(${fruit.rotation}deg)`,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-2">{fruit.emoji}</div>
              <div className="bg-white border-2 border-orange-500 rounded-xl px-3 py-1 shadow-lg">
                <p className="text-lg font-bold font-mono">{fruit.word}</p>
              </div>
            </div>
          </div>
        ))}

        {slicedFruits.map((sliced) => (
          <div
            key={sliced.id}
            className="absolute pointer-events-none"
            style={{
              left: `${sliced.x}%`,
              bottom: `${sliced.y}%`,
            }}
          >
            <div className="text-6xl animate-ping">✨</div>
            <div className="text-5xl animate-bounce absolute top-0 left-2">💫</div>
            <div className="text-4xl animate-pulse absolute top-2 left-4">⭐</div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all"
          placeholder="Type here..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
          onBlur={() => {
            // 延迟，避免和点击按钮等冲突
            setTimeout(() => {
              inputRef.current?.focus()
            }, 100)
          }}
        />
      </div>
    </div>
  )
}
