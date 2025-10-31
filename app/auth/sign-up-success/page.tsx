"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function SignUpSuccessPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="w-full max-w-md animate-bounce-in">
        <div className="text-center mb-6">
          <div className="text-7xl mb-4 animate-float">📧</div>
          <h1 className="text-3xl font-bold text-primary">{t("checkEmail")}</h1>
        </div>

        <Card className="border-4 border-accent/20 shadow-2xl rounded-3xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-foreground">{t("checkEmail")}</CardTitle>
            <CardDescription className="text-base">{t("confirmationSent")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-accent/10 border-2 border-accent rounded-2xl p-4">
              <p className="text-foreground text-center leading-relaxed">{t("confirmationSent")}</p>
            </div>
            <Button asChild className="w-full h-12 text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform">
              <Link href="/auth/login">{t("backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
