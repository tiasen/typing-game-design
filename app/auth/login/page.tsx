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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
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
          <div className="text-7xl mb-4 animate-float">👋</div>
          <h1 className="text-3xl font-bold text-primary">{t("welcomeBack")}</h1>
        </div>

        <Card className="border-4 border-primary/20 shadow-2xl rounded-3xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-foreground">{t("login")}</CardTitle>
            <CardDescription className="text-base">{t("enterEmailToContinue")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
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
                  required
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
                {isLoading ? t("loggingIn") : t("login")}
              </Button>
              <div className="text-center">
                <p className="text-muted-foreground">
                  {t("dontHaveAccount")}{" "}
                  <Link href="/auth/sign-up" className="text-primary font-bold hover:underline">
                    {t("signUp")}
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
