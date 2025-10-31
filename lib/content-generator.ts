// Content generator for dynamic practice content

// Stage 1: Home row keys
const HOME_ROW_KEYS = ["a", "s", "d", "f", "j", "k", "l", ";"]

function generateHomeRowContent(count = 50): string[] {
  const content: string[] = []

  // Generate single letters
  for (let i = 0; i < 8; i++) {
    content.push(HOME_ROW_KEYS[Math.floor(Math.random() * HOME_ROW_KEYS.length)])
  }

  // Generate combinations of varying lengths
  while (content.length < count) {
    const length = Math.floor(Math.random() * 8) + 1 // 1-8 characters
    let combination = ""
    for (let i = 0; i < length; i++) {
      combination += HOME_ROW_KEYS[Math.floor(Math.random() * HOME_ROW_KEYS.length)]
    }
    content.push(combination)
  }

  return shuffleArray(content)
}

// Stage 2: All letters
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789".split("")
const COMMON_WORDS = [
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "man",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "boy",
  "did",
  "that",
  "with",
  "have",
  "this",
  "will",
  "your",
  "from",
  "they",
  "know",
  "want",
  "been",
  "good",
  "much",
  "some",
  "time",
  "very",
  "when",
  "come",
  "about",
  "after",
  "again",
  "could",
  "every",
  "first",
  "found",
  "great",
  "house",
  "large",
  "learn",
  "never",
  "other",
  "place",
  "right",
  "small",
  "sound",
  "spell",
  "still",
  "study",
  "their",
  "there",
  "these",
  "thing",
  "think",
  "three",
  "water",
  "where",
  "which",
  "world",
  "would",
  "write",
]

function generateAllLettersContent(count = 100): string[] {
  const content: string[] = []

  // Add all single letters
  content.push(...ALPHABET)

  // Generate random letter combinations
  for (let i = 0; i < 20; i++) {
    const length = Math.floor(Math.random() * 4) + 2 // 2-5 letters
    let combination = ""
    for (let j = 0; j < length; j++) {
      combination += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
    content.push(combination)
  }

  // Add common words
  while (content.length < count) {
    content.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)])
  }

  return shuffleArray(content)
}

// Stage 3: Simple words and phrases
const ADJECTIVES = [
  "big",
  "small",
  "happy",
  "sad",
  "fast",
  "slow",
  "hot",
  "cold",
  "new",
  "old",
  "good",
  "bad",
  "red",
  "blue",
  "green",
  "yellow",
]
const NOUNS = [
  "cat",
  "dog",
  "bird",
  "fish",
  "tree",
  "house",
  "car",
  "book",
  "pen",
  "ball",
  "sun",
  "moon",
  "star",
  "day",
  "night",
  "water",
]
const VERBS = [
  "run",
  "walk",
  "jump",
  "play",
  "eat",
  "drink",
  "read",
  "write",
  "sing",
  "dance",
  "sleep",
  "wake",
  "go",
  "come",
  "see",
  "hear",
]
const GREETINGS = [
  "hello",
  "goodbye",
  "thank you",
  "please",
  "yes",
  "no",
  "good morning",
  "good night",
  "see you",
  "bye bye",
]

function generateSimpleWordsContent(count = 60): string[] {
  const content: string[] = []

  // Add greetings
  content.push(...GREETINGS.slice(0, 10))

  // Generate two-word phrases
  for (let i = 0; i < 20; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    content.push(`${adj} ${noun}`)
  }

  // Generate three-word phrases
  for (let i = 0; i < 15; i++) {
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)]
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    content.push(`${verb} ${adj} ${noun}`)
  }

  // Generate simple sentences
  while (content.length < count) {
    const subject = ["I", "you", "we", "they", "he", "she"][Math.floor(Math.random() * 6)]
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)]
    const obj = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    content.push(`${subject} ${verb} ${obj}`)
  }

  return shuffleArray(content)
}

// Stage 4: Sentences
const SENTENCE_TEMPLATES = [
  (subj: string, verb: string, obj: string) => `The ${subj} ${verb} the ${obj}.`,
  (subj: string, verb: string, obj: string) => `I ${verb} ${obj} every day.`,
  (subj: string, verb: string, obj: string) => `She ${verb} ${obj} very well.`,
  (subj: string, verb: string, obj: string) => `We ${verb} ${obj} together.`,
  (subj: string, verb: string, obj: string) => `They ${verb} ${obj} at school.`,
  (subj: string, verb: string, obj: string) => `He ${verb} ${obj} in the morning.`,
  (subj: string, verb: string, obj: string) => `My ${subj} ${verb} ${obj} today.`,
  (subj: string, verb: string, obj: string) => `Your ${subj} can ${verb} ${obj}.`,
]

const SENTENCE_SUBJECTS = [
  "cat",
  "dog",
  "bird",
  "teacher",
  "student",
  "friend",
  "family",
  "brother",
  "sister",
  "mother",
  "father",
]
const SENTENCE_VERBS = [
  "likes",
  "loves",
  "enjoys",
  "plays",
  "reads",
  "writes",
  "draws",
  "sings",
  "watches",
  "learns",
  "teaches",
  "helps",
]
const SENTENCE_OBJECTS = [
  "books",
  "music",
  "games",
  "sports",
  "art",
  "science",
  "math",
  "stories",
  "pictures",
  "songs",
  "movies",
  "friends",
]

function generateSentencesContent(count = 50): string[] {
  const content: string[] = []

  while (content.length < count) {
    const template = SENTENCE_TEMPLATES[Math.floor(Math.random() * SENTENCE_TEMPLATES.length)]
    const subj = SENTENCE_SUBJECTS[Math.floor(Math.random() * SENTENCE_SUBJECTS.length)]
    const verb = SENTENCE_VERBS[Math.floor(Math.random() * SENTENCE_VERBS.length)]
    const obj = SENTENCE_OBJECTS[Math.floor(Math.random() * SENTENCE_OBJECTS.length)]
    content.push(template(subj, verb, obj))
  }

  return shuffleArray(content)
}

// Stage 5: Paragraphs and speed challenges
const PARAGRAPH_TEMPLATES = [
  () => {
    const activity = ["reading", "writing", "playing", "learning", "practicing", "studying"][
      Math.floor(Math.random() * 6)
    ]
    const time = ["every day", "in the morning", "after school", "on weekends", "during breaks"][
      Math.floor(Math.random() * 5)
    ]
    const benefit = ["improves skills", "is very fun", "helps me learn", "makes me happy", "is important"][
      Math.floor(Math.random() * 5)
    ]
    return `I enjoy ${activity} ${time} because it ${benefit}.`
  },
  () => {
    const subject = ["Typing", "Reading", "Writing", "Learning", "Practice"][Math.floor(Math.random() * 5)]
    const adjective = ["important", "useful", "helpful", "valuable", "essential"][Math.floor(Math.random() * 5)]
    const reason = ["for school", "for work", "for life", "for success", "for growth"][Math.floor(Math.random() * 5)]
    return `${subject} is very ${adjective} ${reason} and everyone should practice it regularly.`
  },
  () => {
    const person = ["My teacher", "My friend", "My parent", "My classmate"][Math.floor(Math.random() * 4)]
    const action = ["says", "believes", "thinks", "knows"][Math.floor(Math.random() * 4)]
    const advice = ["practice makes perfect", "never give up", "keep trying", "do your best"][
      Math.floor(Math.random() * 4)
    ]
    return `${person} ${action} that ${advice} when learning new skills.`
  },
]

function generateSpeedChallengeContent(count = 40): string[] {
  const content: string[] = []

  // Add the classic pangram
  content.push("The quick brown fox jumps over the lazy dog.")

  // Generate varied sentences
  while (content.length < count) {
    const template = PARAGRAPH_TEMPLATES[Math.floor(Math.random() * PARAGRAPH_TEMPLATES.length)]
    content.push(template())
  }

  return shuffleArray(content)
}

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Main generator function
export function generateStageContent(stageId: number): string[] {
  switch (stageId) {
    case 1:
      return generateHomeRowContent()
    case 2:
      return generateAllLettersContent()
    case 3:
      return generateSimpleWordsContent()
    case 4:
      return generateSentencesContent()
    case 5:
      return generateSpeedChallengeContent()
    default:
      return []
  }
}
