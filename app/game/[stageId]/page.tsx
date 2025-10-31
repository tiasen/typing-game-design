import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { STAGES } from "@/lib/types"
import { GameSelector } from "@/components/game-selector"

export default async function GamePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const stage = STAGES.find((s) => s.id === Number.parseInt(stageId))
  if (!stage) {
    redirect("/dashboard")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <GameSelector stage={stage} userId={user.id} userName={profile?.display_name || "Player"} />
    </div>
  )
}
