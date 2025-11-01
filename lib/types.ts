export interface Profile {
  id: string
  display_name: string
  avatar_color: string
  created_at: string
}

export interface LearningProgress {
  id: string
  user_id: string
  stage_id: number
  completed: boolean
  stars: number
  best_wpm: number
  best_accuracy: number
  completed_at?: string
  created_at: string
}

export interface GameScore {
  id: string
  user_id: string
  stage_id: number
  game_type: string
  wpm: number
  accuracy: number
  score: number
  duration: number
  created_at: string
  profiles?: Profile
}

export interface Stage {
  id: number
  title: string
  description: string
  icon: string
  content: string[] // This will now be populated dynamically
  targetWpm: number
  targetAccuracy: number
}

export const STAGES: Stage[] = [
  {
    id: 0,
    title: "stage0Title",
    description: "stage0Desc",
    icon: "🐣",
    content: [],
    targetWpm: 5,
    targetAccuracy: 90,
  },
  {
    id: 1,
    title: "stage1Title",
    description: "stage1Desc",
    icon: "⌨️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 2,
    title: "stage2Title",
    description: "stage2Desc",
    icon: "⬆️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 3,
    title: "stage3Title",
    description: "stage3Desc",
    icon: "⬇️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 4,
    title: "stage4Title",
    description: "stage4Desc",
    icon: "🔢",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 5,
    title: "stage6Title",
    description: "stage6Desc",
    icon: "🔤",
    content: [], // Will be populated dynamically
    targetWpm: 25,
    targetAccuracy: 92,
  },
  {
    id: 6,
    title: "stage7Title",
    description: "stage7Desc",
    icon: "📝",
    content: [], // Will be populated dynamically
    targetWpm: 35,
    targetAccuracy: 94,
  },
  {
    id: 7,
    title: "stage8Title",
    description: "stage8Desc",
    icon: "📖",
    content: [], // Will be populated dynamically
    targetWpm: 45,
    targetAccuracy: 95,
  },
  {
    id: 8,
    title: "stage9Title",
    description: "stage9Desc",
    icon: "⚡",
    content: [], // Will be populated dynamically
    targetWpm: 60,
    targetAccuracy: 96,
  },
]
