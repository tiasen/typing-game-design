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
    id: 1,
    title: "Home Row Keys",
    description: "Learn the basic finger positions",
    icon: "🏠",
    content: [], // Will be populated dynamically
    targetWpm: 15,
    targetAccuracy: 90,
  },
  {
    id: 2,
    title: "All Letters",
    description: "Practice the entire alphabet",
    icon: "🔤",
    content: [], // Will be populated dynamically
    targetWpm: 25,
    targetAccuracy: 92,
  },
  {
    id: 3,
    title: "Simple Words",
    description: "Type common words",
    icon: "📝",
    content: [], // Will be populated dynamically
    targetWpm: 35,
    targetAccuracy: 94,
  },
  {
    id: 4,
    title: "Sentences",
    description: "Practice full sentences",
    icon: "📖",
    content: [], // Will be populated dynamically
    targetWpm: 45,
    targetAccuracy: 95,
  },
  {
    id: 5,
    title: "Speed Challenge",
    description: "Master your typing speed",
    icon: "⚡",
    content: [], // Will be populated dynamically
    targetWpm: 60,
    targetAccuracy: 96,
  },
]
