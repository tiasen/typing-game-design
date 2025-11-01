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
    title: "Beginner (Single Key)",
    description: "Practice one letter or number at a time",
    icon: "🐣",
    content: [],
    targetWpm: 5,
    targetAccuracy: 90,
  },
  {
    id: 1,
    title: "Home Row (ASDF)",
    description: "Practice the home row keys: ASDF JKL;",
    icon: "⌨️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 2,
    title: "Top Row (QWER)",
    description: "Practice the top row keys: QWER UIOP",
    icon: "⬆️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 3,
    title: "Bottom Row (ZXCV)",
    description: "Practice the bottom row keys: ZXCV M,./",
    icon: "⬇️",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 4,
    title: "Number Row",
    description: "Practice the number row: 1234567890",
    icon: "🔢",
    content: [],
    targetWpm: 10,
    targetAccuracy: 90,
  },
  {
    id: 5,
    title: "All Letters",
    description: "Practice the entire alphabet",
    icon: "🔤",
    content: [], // Will be populated dynamically
    targetWpm: 25,
    targetAccuracy: 92,
  },
  {
    id: 6,
    title: "Simple Words",
    description: "Type common words",
    icon: "📝",
    content: [], // Will be populated dynamically
    targetWpm: 35,
    targetAccuracy: 94,
  },
  {
    id: 7,
    title: "Sentences",
    description: "Practice full sentences",
    icon: "📖",
    content: [], // Will be populated dynamically
    targetWpm: 45,
    targetAccuracy: 95,
  },
  {
    id: 8,
    title: "Speed Challenge",
    description: "Master your typing speed",
    icon: "⚡",
    content: [], // Will be populated dynamically
    targetWpm: 60,
    targetAccuracy: 96,
  },
]
