export type FingerType =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky"
  | "thumb"

export interface KeyInfo {
  key: string
  finger: FingerType
  display?: string
}

// Finger color mapping for visual guidance
export const fingerColors: Record<FingerType, string> = {
  "left-pinky": "bg-pink-400",
  "left-ring": "bg-purple-400",
  "left-middle": "bg-blue-400",
  "left-index": "bg-green-400",
  "right-index": "bg-yellow-400",
  "right-middle": "bg-orange-400",
  "right-ring": "bg-red-400",
  "right-pinky": "bg-rose-400",
  thumb: "bg-gray-400",
}

// Keyboard layout with finger assignments
export const keyboardLayout: KeyInfo[][] = [
  // Number row
  [
    { key: "1", finger: "left-pinky" },
    { key: "2", finger: "left-ring" },
    { key: "3", finger: "left-middle" },
    { key: "4", finger: "left-index" },
    { key: "5", finger: "left-index" },
    { key: "6", finger: "right-index" },
    { key: "7", finger: "right-index" },
    { key: "8", finger: "right-middle" },
    { key: "9", finger: "right-ring" },
    { key: "0", finger: "right-pinky" },
  ],
  // Top letter row
  [
    { key: "q", finger: "left-pinky" },
    { key: "w", finger: "left-ring" },
    { key: "e", finger: "left-middle" },
    { key: "r", finger: "left-index" },
    { key: "t", finger: "left-index" },
    { key: "y", finger: "right-index" },
    { key: "u", finger: "right-index" },
    { key: "i", finger: "right-middle" },
    { key: "o", finger: "right-ring" },
    { key: "p", finger: "right-pinky" },
  ],
  // Home row
  [
    { key: "a", finger: "left-pinky" },
    { key: "s", finger: "left-ring" },
    { key: "d", finger: "left-middle" },
    { key: "f", finger: "left-index" },
    { key: "g", finger: "left-index" },
    { key: "h", finger: "right-index" },
    { key: "j", finger: "right-index" },
    { key: "k", finger: "right-middle" },
    { key: "l", finger: "right-ring" },
    { key: ";", finger: "right-pinky", display: ";" },
  ],
  // Bottom row
  [
    { key: "z", finger: "left-pinky" },
    { key: "x", finger: "left-ring" },
    { key: "c", finger: "left-middle" },
    { key: "v", finger: "left-index" },
    { key: "b", finger: "left-index" },
    { key: "n", finger: "right-index" },
    { key: "m", finger: "right-index" },
    { key: ",", finger: "right-middle", display: "," },
    { key: ".", finger: "right-ring", display: "." },
    { key: "/", finger: "right-pinky", display: "/" },
  ],
]

// Get finger for a specific key
export function getFingerForKey(key: string): FingerType {
  const lowerKey = key.toLowerCase()
  for (const row of keyboardLayout) {
    for (const keyInfo of row) {
      if (keyInfo.key === lowerKey) {
        return keyInfo.finger
      }
    }
  }
  // Default to thumb for space and other keys
  return "thumb"
}
