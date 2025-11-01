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
import { GAME_SPEED_CONFIG } from "@/lib/game-speed-config"

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
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([])
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
  const [practiceContent] = useState(() => generateStageContent(stage.id))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 500

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
    return GAME_SPEED_CONFIG.fruit.speedMultiplier[gameSpeed] ?? GAME_SPEED_CONFIG.fruit.speedMultiplier.normal
  }
  const speedMultiplier = getSpeedMultiplier()

  // Canvas animation loop for fruit movement and particles
  useEffect(() => {
    let animationId: number
    let lastTime = performance.now()
    const moveSpeed = GAME_SPEED_CONFIG.fruit.move
    const rotateSpeed = GAME_SPEED_CONFIG.fruit.rotate
    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      if (isPlaying && !isComplete) {
        setFruits((prev) => {
          let updated = prev
            .map((fruit) => ({
              ...fruit,
              y: fruit.y - moveSpeed * speedMultiplier,
              rotation: fruit.rotation + rotateSpeed * speedMultiplier,
            }))
            .filter((fruit) => fruit.y > -20)
          return updated
        })
        setParticles((prev) =>
          prev.map((p) => ({ ...p, y: p.y - 40 * dt })).filter((p) => p.y > 0)
        )
      }
      // Draw
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          fruits.forEach((fruit) => {
            ctx.save()
            ctx.translate((fruit.x / 100) * CANVAS_WIDTH, (fruit.y / 100) * CANVAS_HEIGHT)
            ctx.rotate((fruit.rotation * Math.PI) / 180)
            ctx.font = "48px serif"
            ctx.textAlign = "center"
            ctx.fillText(fruit.emoji, 0, 0)
            ctx.font = "20px monospace"
            ctx.fillStyle = "#d97706"
            ctx.fillText(fruit.word, 0, 40)
            ctx.restore()
          })
          particles.forEach((particle) => {
            ctx.font = "32px serif"
            ctx.fillText(particle.emoji, particle.x, particle.y)
          })
        }
      }
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying, isComplete, speedMultiplier, fruits, particles, CANVAS_HEIGHT])

  useEffect(() => {
    if (!isPlaying || isComplete) return
    if (fruits.length < GAME_SPEED_CONFIG.fruit.maxFruits) {
      spawnFruit()
    }
    const spawnInterval = setInterval(() => {
      if (fruits.length < GAME_SPEED_CONFIG.fruit.maxFruits) {
        spawnFruit()
      }
    }, GAME_SPEED_CONFIG.fruit.spawnInterval / speedMultiplier)
    return () => clearInterval(spawnInterval)
  }, [isPlaying, isComplete, fruits.length, spawnFruit, speedMultiplier])

  const handleStart = () => {
    setIsPlaying(true)
    setFruits([])
    setParticles([])
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
      // 计算水果在canvas上的中心坐标
      const x = (matchedFruit.x / 100) * CANVAS_WIDTH
      const y = (matchedFruit.y / 100) * CANVAS_HEIGHT
      const explosionParticles = ["✨", "💫", "⭐"].map((emoji, i) => ({
        id: Date.now() + i,
        x,
        y,
        emoji,
      }))
      setParticles((prev) => [...prev, ...explosionParticles])
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !explosionParticles.find((ep) => ep.id === p.id)))
      }, 800)
      setFruits((prev) => prev.filter((f) => f.id !== matchedFruit.id))
      setInput("")
      if (fruits.length <= 1) {
        spawnFruit()
      }
    } else if (value.length > 0) {
      audioManager.playError()
      setErrors((prev) => prev + 1)
      setInput("")
    }
  }
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
      {/* Canvas Game Area */}
      <div className="flex-1 flex items-center justify-center bg-card/50 rounded-3xl border-4 border-primary/20 p-8 overflow-hidden min-h-[400px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            background: "#fff",
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
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all"
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
