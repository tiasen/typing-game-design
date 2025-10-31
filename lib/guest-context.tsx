"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface GuestProfile {
  username: string
  avatarColor: string
  createdAt: string
}

interface GuestProgress {
  stageId: number
  completed: boolean
  stars: number
  bestWpm: number
  bestAccuracy: number
  completedAt: string
}

interface GuestContextType {
  isGuest: boolean
  guestProfile: GuestProfile | null
  setGuestProfile: (profile: GuestProfile) => void
  getProgress: (stageId: number) => GuestProgress | null
  saveProgress: (progress: GuestProgress) => void
  getAllProgress: () => GuestProgress[]
  clearGuestData: () => void
}

const GuestContext = createContext<GuestContextType | undefined>(undefined)

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestProfile, setGuestProfileState] = useState<GuestProfile | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("guestProfile")
    if (saved) {
      setGuestProfileState(JSON.parse(saved))
    }
  }, [])

  const setGuestProfile = (profile: GuestProfile) => {
    setGuestProfileState(profile)
    localStorage.setItem("guestProfile", JSON.stringify(profile))
  }

  const getProgress = (stageId: number): GuestProgress | null => {
    if (!guestProfile) return null
    const saved = localStorage.getItem(`guest_progress_${guestProfile.username}`)
    if (!saved) return null
    const allProgress: GuestProgress[] = JSON.parse(saved)
    return allProgress.find((p) => p.stageId === stageId) || null
  }

  const saveProgress = (progress: GuestProgress) => {
    if (!guestProfile) return
    const storageKey = `guest_progress_${guestProfile.username}`
    const saved = localStorage.getItem(storageKey)
    const allProgress: GuestProgress[] = saved ? JSON.parse(saved) : []
    const existingIndex = allProgress.findIndex((p) => p.stageId === progress.stageId)

    if (existingIndex >= 0) {
      // Update existing with better stats
      const existing = allProgress[existingIndex]
      allProgress[existingIndex] = {
        ...progress,
        stars: Math.max(existing.stars, progress.stars),
        bestWpm: Math.max(existing.bestWpm, progress.bestWpm),
        bestAccuracy: Math.max(existing.bestAccuracy, progress.bestAccuracy),
      }
    } else {
      allProgress.push(progress)
    }

    localStorage.setItem(storageKey, JSON.stringify(allProgress))
  }

  const getAllProgress = (): GuestProgress[] => {
    if (!guestProfile) return []
    const saved = localStorage.getItem(`guest_progress_${guestProfile.username}`)
    return saved ? JSON.parse(saved) : []
  }

  const clearGuestData = () => {
    if (guestProfile) {
      localStorage.removeItem(`guest_progress_${guestProfile.username}`)
    }
    localStorage.removeItem("guestProfile")
    setGuestProfileState(null)
  }

  return (
    <GuestContext.Provider
      value={{
        isGuest: !!guestProfile,
        guestProfile,
        setGuestProfile,
        getProgress,
        saveProgress,
        getAllProgress,
        clearGuestData,
      }}
    >
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest() {
  const context = useContext(GuestContext)
  if (!context) {
    throw new Error("useGuest must be used within GuestProvider")
  }
  return context
}
