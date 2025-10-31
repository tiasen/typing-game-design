"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Stage } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { getAudioManager } from "@/lib/audio"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { generateStageContent } from "@/lib/content-generator"

interface Asteroid {
  id: number
  word: string
  x: number
  y: number
  speed: number
}

interface Explosion {
  id: number
  x: number
  y: number
}

interface SpaceGameProps {
  stage: Stage
  userId: string
  userName: string
  onBack: () => void
}

export function SpaceGame({ stage, userId, userName, onBack }: SpaceGameProps) {
  const { t, gameSpeed } = useLanguage()
  const [asteroids, setAsteroids] = useState<Asteroid[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [input, setInput] = useState("")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalTyped, setTotalTyped] = useState(0)
  const [errors, setErrors] = useState(0)
  const [nextAsteroidId, setNextAsteroidId] = useState(0)
  const [practiceContent] = useState(() => generateStageContent(stage.id))

  const spawnAsteroid = useCallback(() => {
    const word = practiceContent[Math.floor(Math.random() * practiceContent.length)]
    const newAsteroid: Asteroid = {
      id: nextAsteroidId,
      word,
      x: Math.random() * 80 + 10,
      y: -10,
      speed: 1 + Math.random(),
    }
    setNextAsteroidId((prev) => prev + 1)
    setAsteroids((prev) => [...prev, newAsteroid])
  }, [stage.content, nextAsteroidId])

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
      setAsteroids((prev) =>
        prev
          .map((asteroid) => ({
            ...asteroid,
            y: asteroid.y + asteroid.speed * speedMultiplier,
          }))
          .filter((asteroid) => asteroid.y < 100),
      )
    }, 50)

    return () => clearInterval(moveInterval)
  }, [isPlaying, isComplete, speedMultiplier])

  useEffect(() => {
    if (!isPlaying || isComplete) return

    const spawnInterval = setInterval(() => {
      if (asteroids.length < 4) {
        spawnAsteroid()
      }
    }, 1500 / speedMultiplier)

    return () => clearInterval(spawnInterval)
  }, [isPlaying, isComplete, asteroids.length, spawnAsteroid, speedMultiplier])

  const handleStart = () => {
    setIsPlaying(true)
    setAsteroids([])
    setScore(0)
    setTimeLeft(60)
    setTotalTyped(0)
    setErrors(0)
    setIsComplete(false)
    spawnAsteroid()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const audioManager = getAudioManager()

    const matchingAsteroid = asteroids.find((a) => a.word.startsWith(value))
    if (matchingAsteroid) {
      if (value === matchingAsteroid.word) {
        audioManager.playSuccess()
        setScore((prev) => prev + matchingAsteroid.word.length * 15)
        setTotalTyped((prev) => prev + matchingAsteroid.word.length)

        const newExplosion: Explosion = {
          id: Date.now(),
          x: matchingAsteroid.x,
          y: matchingAsteroid.y,
        }
        setExplosions((prev) => [...prev, newExplosion])
        setTimeout(() => {
          setExplosions((prev) => prev.filter((e) => e.id !== newExplosion.id))
        }, 600)

        setAsteroids((prev) => prev.filter((a) => a.id !== matchingAsteroid.id))
        setInput("")
      }
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
      game_type: "space",
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
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("missionComplete")}</h2>
              <p className="text-xl text-muted-foreground">
                {t("excellentFlying")}, {userName}!
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
        <Card className="max-w-md w-full border-4 border-accent/20 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-float">🚀</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("spaceTyping")}</h2>
              <p className="text-lg text-muted-foreground">{t("spaceDesc")}</p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
              <p className="text-center font-medium">{t("howToPlay")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Type words on falling asteroids</li>
                <li>• Destroy them before they reach bottom</li>
                <li>• Faster typing = higher score</li>
                <li>• You have 60 seconds</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("launchMission")}
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
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🚀</div>
          <div>
            <p className="text-sm opacity-80">{t("score")}</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-80">{t("timeLeft")}</p>
          <p className="text-3xl font-bold">{timeLeft}s</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative rounded-3xl border-4 border-white/20 overflow-hidden bg-black/30">
        {/* Stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Asteroids */}
        {asteroids.map((asteroid) => (
          <div
            key={asteroid.id}
            className="absolute transition-all duration-100"
            style={{
              left: `${asteroid.x}%`,
              top: `${asteroid.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-center">
              <div className="text-5xl mb-2 animate-spin" style={{ animationDuration: "3s" }}>
                ☄️
              </div>
              <div className="bg-white/90 border-2 border-orange-500 rounded-xl px-3 py-1 shadow-lg">
                <p className="text-lg font-bold font-mono text-black">{asteroid.word}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Explosions */}
        {explosions.map((explosion) => (
          <div
            key={explosion.id}
            className="absolute pointer-events-none"
            style={{
              left: `${explosion.x}%`,
              top: `${explosion.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              <div className="text-6xl animate-ping absolute -translate-x-1/2 -translate-y-1/2">💥</div>
              <div className="text-4xl animate-pulse absolute -translate-x-1/2 -translate-y-1/2">🔥</div>
            </div>
          </div>
        ))}

        {/* Earth at bottom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="text-8xl">🌍</div>
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-white/30 bg-white/90 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
          placeholder="Type here..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
