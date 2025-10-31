"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"

const AVATAR_COLORS = ["#FF6B9D", "#FFD93D", "#6BCF7F", "#4ECDC4", "#A78BFA", "#FB923C"]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            display_name: displayName,
            avatar_color: selectedColor,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="w-full max-w-md animate-bounce-in">
        {/* Cute header - Using translations */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-4 animate-float">🎉</div>
          <h1 className="text-3xl font-bold text-primary">{t("joinTheFun")}</h1>
        </div>

        <Card className="border-4 border-primary/20 shadow-2xl rounded-3xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-foreground">{t("createAccount")}</CardTitle>
            <CardDescription className="text-base">{t("startYourAdventure")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base font-semibold">
                  {t("yourName")}
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t("enterYourName")}
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 text-base rounded-2xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">{t("chooseYourColor")}</Label>
                <div className="flex gap-3 justify-center">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                        selectedColor === color ? "ring-4 ring-foreground scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-2xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  {t("password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("atLeast6Chars")}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base rounded-2xl border-2"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-3">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform"
                disabled={isLoading}
              >
                {isLoading ? t("creatingAccount") : t("signUp")}
              </Button>

              <div className="text-center">
                <p className="text-muted-foreground">
                  {t("alreadyHaveAccount")}{" "}
                  <Link href="/auth/login" className="text-primary font-bold hover:underline">
                    {t("login")}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
