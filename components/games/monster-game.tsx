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

interface Monster {
  id: number
  word: string
  position: number
  health: number
}

interface Particle {
  id: number
  x: number
  y: number
  emoji: string
}

interface MonsterGameProps {
  stage: Stage
  userId: string
  userName: string
  onBack: () => void
}

export function MonsterGame({ stage, userId, userName, onBack }: MonsterGameProps) {
  const { t, gameSpeed } = useLanguage()
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [input, setInput] = useState("")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalTyped, setTotalTyped] = useState(0)
  const [errors, setErrors] = useState(0)
  const [nextMonsterId, setNextMonsterId] = useState(0)

  const spawnMonster = useCallback(() => {
    const word = stage.content[Math.floor(Math.random() * stage.content.length)]
    const newMonster: Monster = {
      id: nextMonsterId,
      word,
      position: 0,
      health: word.length,
    }
    setNextMonsterId((prev) => prev + 1)
    setMonsters((prev) => [...prev, newMonster])
  }, [stage.content, nextMonsterId])

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
        return 0.6 // 40% slower
      case "fast":
        return 1.5 // 50% faster
      default:
        return 1.0 // normal speed
    }
  }

  const speedMultiplier = getSpeedMultiplier()

  useEffect(() => {
    if (!isPlaying || isComplete) return

    const moveInterval = setInterval(() => {
      setMonsters((prev) =>
        prev.map((monster) => ({
          ...monster,
          position: monster.position + 1 * speedMultiplier,
        })),
      )
    }, 1000)

    return () => clearInterval(moveInterval)
  }, [isPlaying, isComplete, speedMultiplier])

  useEffect(() => {
    if (!isPlaying || isComplete) return

    const spawnInterval = setInterval(() => {
      if (monsters.length < 3) {
        spawnMonster()
      }
    }, 2000 / speedMultiplier)

    return () => clearInterval(spawnInterval)
  }, [isPlaying, isComplete, monsters.length, spawnMonster, speedMultiplier])

  const handleStart = () => {
    setIsPlaying(true)
    setMonsters([])
    setScore(0)
    setTimeLeft(60)
    setTotalTyped(0)
    setErrors(0)
    setIsComplete(false)
    spawnMonster()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const audioManager = getAudioManager()

    const matchingMonster = monsters.find((m) => m.word.startsWith(value))
    if (matchingMonster) {
      if (value === matchingMonster.word) {
        audioManager.playSuccess()
        setScore((prev) => prev + matchingMonster.word.length * 10)
        setTotalTyped((prev) => prev + matchingMonster.word.length)

        const monsterElement = document.querySelector(`[data-monster-id="${matchingMonster.id}"]`)
        if (monsterElement) {
          const rect = monsterElement.getBoundingClientRect()
          const explosionParticles: Particle[] = ["💥", "⭐", "✨", "💫", "🌟"].map((emoji, i) => ({
            id: Date.now() + i,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            emoji,
          }))
          setParticles((prev) => [...prev, ...explosionParticles])
          setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !explosionParticles.find((ep) => ep.id === p.id)))
          }, 1000)
        }

        setMonsters((prev) => prev.filter((m) => m.id !== matchingMonster.id))
        setInput("")
        if (monsters.length <= 1) {
          spawnMonster()
        }
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
      game_type: "monster",
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
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("gameOver")}</h2>
              <p className="text-xl text-muted-foreground">
                {t("greatJob")}, {userName}!
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
        <Card className="max-w-md w-full border-4 border-primary/20 shadow-2xl rounded-3xl animate-bounce-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-wiggle">👾</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t("monsterTyping")}</h2>
              <p className="text-lg text-muted-foreground">{t("monsterDesc")}</p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
              <p className="text-center font-medium">{t("howToPlay")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Type the words shown on monsters</li>
                <li>• Complete words to defeat them</li>
                <li>• Don't let monsters reach you!</li>
                <li>• You have 60 seconds</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleStart} className="w-full h-12 text-lg rounded-2xl shadow-lg">
                {t("startGame")}
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
    <div className="min-h-screen flex flex-col p-6">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">👾</div>
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
      <div className="flex-1 relative bg-card/50 rounded-3xl border-4 border-primary/20 p-8 overflow-hidden">
        {monsters.map((monster) => (
          <div
            key={monster.id}
            data-monster-id={monster.id}
            className="absolute transition-all duration-1000"
            style={{
              left: `${Math.random() * 70}%`,
              top: `${monster.position * 10}%`,
            }}
          >
            <div className="text-center animate-float">
              <div className="text-6xl mb-2">👾</div>
              <div className="bg-card border-2 border-primary rounded-xl px-4 py-2 shadow-lg">
                <p className="text-xl font-bold font-mono">{monster.word}</p>
              </div>
            </div>
          </div>
        ))}

        {particles.map((particle) => (
          <div
            key={particle.id}
            className="fixed text-4xl pointer-events-none animate-ping z-50"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              animation: "ping 1s cubic-bezier(0, 0, 0.2, 1)",
            }}
          >
            {particle.emoji}
          </div>
        ))}

        {/* Player */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="text-7xl">🛡️</div>
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full h-16 text-2xl text-center rounded-2xl border-4 border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
          placeholder="Type here..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
