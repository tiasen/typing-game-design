"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Stage } from "@/lib/types"
import Link from "next/link"
import { MonsterGame } from "@/components/games/monster-game"
import { SpaceGame } from "@/components/games/space-game"
import { FruitGame } from "@/components/games/fruit-game"
import { useLanguage } from "@/lib/language-context"

interface GameSelectorProps {
  stage: Stage
  userId: string
  userName: string
}

type GameType = "monster" | "space" | "fruit" | null

export function GameSelector({ stage, userId, userName }: GameSelectorProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>(null)
  const { t } = useLanguage()

  if (selectedGame === "monster") {
    return <MonsterGame stage={stage} userId={userId} userName={userName} onBack={() => setSelectedGame(null)} />
  }

  if (selectedGame === "space") {
    return <SpaceGame stage={stage} userId={userId} userName={userName} onBack={() => setSelectedGame(null)} />
  }

  if (selectedGame === "fruit") {
    return <FruitGame stage={stage} userId={userId} userName={userName} onBack={() => setSelectedGame(null)} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 animate-bounce-in">
        {/* Header - Using translations */}
        <div className="text-center space-y-4">
          <div className="text-7xl animate-float">🎮</div>
          <h1 className="text-4xl font-bold text-primary">{t("chooseYourGame")}</h1>
          <p className="text-xl text-muted-foreground">
            {t("pickFunWay")} {t(`stage${stage.id}Title` as any)}
          </p>
        </div>

        {/* Game Options - Using translations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="border-4 border-primary/20 shadow-xl rounded-3xl cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedGame("monster")}
          >
            <CardHeader className="text-center">
              <div className="text-6xl mb-3">👾</div>
              <CardTitle className="text-2xl">{t("monsterTyping")}</CardTitle>
              <CardDescription className="text-base">{t("monsterDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-2xl shadow-lg">{t("playNow")}</Button>
            </CardContent>
          </Card>

          <Card
            className="border-4 border-accent/20 shadow-xl rounded-3xl cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedGame("space")}
          >
            <CardHeader className="text-center">
              <div className="text-6xl mb-3">🚀</div>
              <CardTitle className="text-2xl">{t("spaceTyping")}</CardTitle>
              <CardDescription className="text-base">{t("spaceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-2xl shadow-lg" variant="secondary">
                {t("playNow")}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-4 border-secondary/20 shadow-xl rounded-3xl cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedGame("fruit")}
          >
            <CardHeader className="text-center">
              <div className="text-6xl mb-3">🍎</div>
              <CardTitle className="text-2xl">{t("fruitNinja")}</CardTitle>
              <CardDescription className="text-base">{t("fruitDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-2xl shadow-lg bg-transparent" variant="outline">
                {t("playNow")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Button - Using translations */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="rounded-full border-2 bg-transparent">
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
