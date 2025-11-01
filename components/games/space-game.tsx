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
  const inputRef = useRef<HTMLInputElement>(null)
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 500

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
  }, [practiceContent, nextAsteroidId])

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
        return 2 // 50% faster
      default:
        return 0.8 // normal speed
    }
  }

  const speedMultiplier = getSpeedMultiplier()

  // Canvas animation loop for asteroid movement and explosions
  useEffect(() => {
    let animationId: number
    let lastTime = performance.now()
    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      if (isPlaying && !isComplete) {
        setAsteroids((prev) => {
          let updated = prev
            .map((asteroid) => ({
              ...asteroid,
              y: asteroid.y + (asteroid.speed * speedMultiplier) / 5,
            }))
            .filter((asteroid) => asteroid.y < 100)
          return updated
        })
        setExplosions((prev) => prev)
      }
      // Draw
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Background
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          ctx.fillStyle = "#1a1625"
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          // Stars
          for (let i = 0; i < 50; i++) {
            ctx.save()
            ctx.globalAlpha = 0.7
            ctx.beginPath()
            ctx.arc(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 1, 0, 2 * Math.PI)
            ctx.fillStyle = "#fff"
            ctx.fill()
            ctx.restore()
          }
          // Asteroids
          asteroids.forEach((asteroid) => {
            ctx.save()
            ctx.translate((asteroid.x / 100) * CANVAS_WIDTH, (asteroid.y / 100) * CANVAS_HEIGHT)
            ctx.font = "40px serif"
            ctx.textAlign = "center"
            ctx.fillText("☄️", 0, 0)
            ctx.font = "18px monospace"
            ctx.fillStyle = "#ff9800"
            ctx.fillText(asteroid.word, 0, 36)
            ctx.restore()
          })
          // Explosions
          explosions.forEach((explosion) => {
            ctx.save()
            ctx.translate((explosion.x / 100) * CANVAS_WIDTH, (explosion.y / 100) * CANVAS_HEIGHT)
            ctx.font = "48px serif"
            ctx.fillText("💥", 0, 0)
            ctx.font = "32px serif"
            ctx.fillText("🔥", 0, 0)
            ctx.restore()
          })
          // Earth
          ctx.save()
          ctx.font = "80px serif"
          ctx.textAlign = "center"
          ctx.fillText("🌍", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
          ctx.restore()
        }
      }
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying, isComplete, speedMultiplier, asteroids, explosions, CANVAS_HEIGHT])

  useEffect(() => {
    if (!isPlaying || isComplete) return
    if (asteroids.length < 3) {
      spawnAsteroid()
    }
    const spawnInterval = setInterval(() => {
      if (asteroids.length < 3) {
        spawnAsteroid()
      }
    }, 2000 / speedMultiplier)
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

    // 查找与输入完全匹配的陨石
    const matchedAsteroid = asteroids.find((a) => value === a.word)
    if (matchedAsteroid) {
      audioManager.playSuccess()
      setScore((prev) => prev + matchedAsteroid.word.length * 15)
      setTotalTyped((prev) => prev + matchedAsteroid.word.length)

      const newExplosion: Explosion = {
        id: Date.now(),
        x: matchedAsteroid.x,
        y: matchedAsteroid.y,
      }
      setExplosions((prev) => [...prev, newExplosion])
      setTimeout(() => {
        setExplosions((prev) => prev.filter((e) => e.id !== newExplosion.id))
      }, 600)

      setAsteroids((prev) => prev.filter((a) => a.id !== matchedAsteroid.id))
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
      {/* Canvas Game Area */}
      <div className="flex-1 flex items-center justify-center bg-black/30 rounded-3xl border-4 border-white/20 p-8 overflow-hidden min-h-[400px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            background: "#1a1625",
            borderRadius: 24,
            border: "2px solid #eee",
            width: 800,
            height: 500,
            display: "block",
          }}
        />
      </div>
      {/* Input Area */}
      <div className="mt-6">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-white/30 bg-white/90 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
          placeholder="Type here..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
          onBlur={() => {
            setTimeout(() => {
              inputRef.current?.focus()
            }, 100)
          }}
        />
      </div>
    </div>
  )
}
