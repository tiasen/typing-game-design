"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { getAudioManager } from "@/lib/audio"
import type { Profile } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"
import { useGuest } from "@/lib/guest-context"

const AVATAR_COLORS = ["#FF6B9D", "#FFD93D", "#6BCF7F", "#4ECDC4", "#A78BFA", "#FB923C"]

interface SettingsClientProps {
  user: User
  profile: Profile | null
}

export function SettingsClient({ user, profile }: SettingsClientProps) {
  const { t, language, setLanguage, gameSpeed, setGameSpeed } = useLanguage()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [selectedColor, setSelectedColor] = useState(profile?.avatar_color || AVATAR_COLORS[0])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    const audioManager = getAudioManager()
    setSoundEnabled(audioManager.isEnabled())
  }, [])

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    const audioManager = getAudioManager()
    audioManager.setEnabled(enabled)

    if (enabled) {
      audioManager.playSuccess()
    }
  }

  const handleTestSound = () => {
    const audioManager = getAudioManager()
    audioManager.playKeyPress()
    setTimeout(() => audioManager.playSuccess(), 200)
    setTimeout(() => audioManager.playComplete(), 400)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_color: selectedColor,
        })
        .eq("id", user.id)

      if (error) throw error

      setSaveMessage("Profile updated successfully!")
      const audioManager = getAudioManager()
      audioManager.playSuccess()

      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      setSaveMessage("Failed to update profile")
      const audioManager = getAudioManager()
      audioManager.playError()
    } finally {
      setIsSaving(false)
    }
  }

  const { clearGuestData } = useGuest()

  const handleSignOut = async () => {
    const supabase = createClient()

    clearGuestData()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error)
    }

    window.location.href = "/"
  }

  return (
    <>
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b-4 border-primary/20 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚙️</div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{t("settings")}</h1>
              <p className="text-sm text-muted-foreground">Customize your experience</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full border-2 bg-transparent">
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="border-4 border-primary/20 shadow-xl rounded-3xl animate-bounce-in">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">👤</span>
                {t("profile")}
              </CardTitle>
              <CardDescription className="text-base">Update your display name and avatar color</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base font-semibold">
                  {t("displayName")}
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 text-base rounded-2xl border-2"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">{t("chooseColor")}</Label>
                <div className="flex gap-3 flex-wrap">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-14 h-14 rounded-full transition-transform hover:scale-110 ${
                        selectedColor === color ? "ring-4 ring-foreground scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {saveMessage && (
                <div
                  className={`p-3 rounded-2xl border-2 ${
                    saveMessage.includes("success")
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-destructive/10 border-destructive text-destructive"
                  }`}
                >
                  <p className="text-sm font-medium">{saveMessage}</p>
                </div>
              )}

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !displayName}
                className="w-full h-12 text-lg rounded-2xl shadow-lg"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card className="border-4 border-accent/20 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">🔊</span>
                {t("audio")}
              </CardTitle>
              <CardDescription className="text-base">Control sound effects and audio feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <div className="space-y-1">
                  <Label htmlFor="sound-toggle" className="text-base font-semibold cursor-pointer">
                    {t("soundEffects")}
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable typing sounds and game audio</p>
                </div>
                <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>

              <Button
                onClick={handleTestSound}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 bg-transparent"
                disabled={!soundEnabled}
              >
                <span className="mr-2">🎵</span>
                {t("testSound")}
              </Button>

              <div className="bg-muted/20 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sound effects include typing clicks, success chimes, error beeps, and completion melodies. These
                  sounds help provide feedback during practice and games.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Game Speed Settings */}
          <Card className="border-4 border-secondary/20 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">🎮</span>
                {t("gameplay")}
              </CardTitle>
              <CardDescription className="text-base">{t("speedDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">{t("gameSpeed")}</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => setGameSpeed("slow")}
                    variant={gameSpeed === "slow" ? "default" : "outline"}
                    className="h-14 text-lg rounded-2xl border-2"
                  >
                    <span className="mr-2">🐢</span>
                    {t("slow")}
                  </Button>
                  <Button
                    onClick={() => setGameSpeed("normal")}
                    variant={gameSpeed === "normal" ? "default" : "outline"}
                    className="h-14 text-lg rounded-2xl border-2"
                  >
                    <span className="mr-2">🚶</span>
                    {t("normal")}
                  </Button>
                  <Button
                    onClick={() => setGameSpeed("fast")}
                    variant={gameSpeed === "fast" ? "default" : "outline"}
                    className="h-14 text-lg rounded-2xl border-2"
                  >
                    <span className="mr-2">🚀</span>
                    {t("fast")}
                  </Button>
                </div>
              </div>
              <div className="bg-muted/20 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {gameSpeed === "slow" && "Slow speed is perfect for beginners learning to type."}
                  {gameSpeed === "normal" && "Normal speed provides a balanced challenge for most students."}
                  {gameSpeed === "fast" && "Fast speed is for advanced typists seeking a real challenge!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="border-4 border-secondary/20 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">🌐</span>
                {t("language")}
              </CardTitle>
              <CardDescription className="text-base">Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => setLanguage("en")}
                  variant={language === "en" ? "default" : "outline"}
                  className="flex-1 h-14 text-lg rounded-2xl border-2"
                >
                  <span className="mr-2 text-2xl">🇺🇸</span>
                  {t("english")}
                </Button>
                <Button
                  onClick={() => setLanguage("zh")}
                  variant={language === "zh" ? "default" : "outline"}
                  className="flex-1 h-14 text-lg rounded-2xl border-2"
                >
                  <span className="mr-2 text-2xl">🇨🇳</span>
                  {t("chinese")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-4 border-secondary/20 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">🔐</span>
                {t("account")}
              </CardTitle>
              <CardDescription className="text-base">Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">{t("email")}</p>
                <p className="text-base font-medium text-foreground">{user.email}</p>
              </div>

              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full h-12 text-lg rounded-2xl shadow-lg"
              >
                {t("signOut")}
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="border-4 border-muted/20 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-3xl">ℹ️</span>
                {t("about")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="text-6xl mb-4">⌨️</div>
                <h3 className="text-xl font-bold text-primary">Type Master Kids</h3>
                <p className="text-muted-foreground">{t("version")} 1.0.0</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A fun and engaging typing practice app designed for elementary school students. Learn to type through
                  progressive stages and exciting games!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
