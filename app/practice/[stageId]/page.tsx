"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { STAGES } from "@/lib/types"
import { PracticeSession } from "@/components/practice-session"
import { useGuest } from "@/lib/guest-context"

export default function PracticePage({ params }: { params: { stageId: string } }) {
  const { stageId } = params
  const router = useRouter()
  const { isGuest, guestProfile } = useGuest()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (isGuest && guestProfile) {
        setUserId("guest")
        setLoading(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/")
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, isGuest, guestProfile])

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100" />
  }

  const stage = STAGES.find((s) => s.id === Number.parseInt(stageId))
  if (!stage || !userId) {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <PracticeSession stage={stage} userId={userId} />
    </div>
  )
}
