"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGuest } from "@/lib/guest-context"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"

const AVATAR_COLORS = ["#FF6B9D", "#4ECDC4", "#FFD93D", "#A8E6CF", "#C7CEEA", "#FF8B94"]

export default function GuestSetupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { setGuestProfile } = useGuest()
  const [username, setUsername] = useState("")
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().length < 2) return

    setGuestProfile({
      username: username.trim(),
      avatarColor: selectedColor,
      createdAt: new Date().toISOString(),
    })

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <Card className="max-w-md w-full border-4 border-primary/20 shadow-2xl rounded-3xl animate-bounce-in">
        <CardHeader className="text-center">
          <div className="text-7xl mb-4 animate-float">👋</div>
          <CardTitle className="text-3xl text-foreground">{t("guestMode")}</CardTitle>
          <CardDescription className="text-base">{t("guestModeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-semibold">
                {t("username")}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("enterUsername")}
                className="h-12 text-lg rounded-xl border-2"
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("chooseYourColor")}</Label>
              <div className="flex gap-3 justify-center flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full transition-all hover:scale-110 ${
                      selectedColor === color ? "ring-4 ring-primary ring-offset-2 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-lg" disabled={username.length < 2}>
              {t("startPracticing")}
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary underline">
                {t("alreadyHaveAccount")} {t("login")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
