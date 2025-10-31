import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { STAGES } from "@/lib/types"
import { PracticeSession } from "@/components/practice-session"

export default async function PracticePage({ params }: { params: Promise<{ stageId: string }> }) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <PracticeSession stage={stage} userId={user.id} />
    </div>
  )
}
