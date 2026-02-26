"use client";

import { useState } from "react";
import Link from "next/link";
import { FroggerGame } from "@/components/games/frogger-game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";

export default function FunModePage() {
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState<"frogger" | null>(null);

  if (activeGame === "frogger") {
    return <FroggerGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b-4 border-primary/20 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎉</div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{t("funModeTitle")}</h1>
              <p className="text-sm text-muted-foreground">{t("funModeDesc")}</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full border-2 bg-transparent">
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="text-4xl">🕹️</span>
            {t("chooseYourGame")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Frogger Game */}
            <Card className="border-4 border-emerald-300/60 shadow-xl rounded-3xl hover:scale-105 transition-transform cursor-pointer"
              onClick={() => setActiveGame("frogger")}
            >
              <CardHeader className="text-center">
                <div className="text-6xl mb-3">🐸</div>
                <CardTitle className="text-2xl">{t("froggerTyping")}</CardTitle>
                <CardDescription className="text-base">{t("froggerDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full rounded-2xl shadow-lg" variant="secondary">
                  {t("playNow")}
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder mini-games for future */}
            <Card className="border-4 border-muted/30 shadow-xl rounded-3xl opacity-60 cursor-not-allowed">
              <CardHeader className="text-center">
                <div className="text-6xl mb-3">🏃‍♂️</div>
                <CardTitle className="text-2xl">Sprint Typing</CardTitle>
                <CardDescription className="text-base">{t("comingSoon")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-4 border-muted/30 shadow-xl rounded-3xl opacity-60 cursor-not-allowed">
              <CardHeader className="text-center">
                <div className="text-6xl mb-3">🎈</div>
                <CardTitle className="text-2xl">Balloon Pop</CardTitle>
                <CardDescription className="text-base">{t("comingSoon")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
