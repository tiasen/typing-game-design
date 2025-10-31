export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled = true

  constructor() {
    if (typeof window !== "undefined") {
      // Load sound preference from localStorage
      const savedPreference = localStorage.getItem("soundEnabled")
      this.enabled = savedPreference !== "false"
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== "undefined") {
      localStorage.setItem("soundEnabled", enabled.toString())
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // Play typing sound
  playKeyPress() {
    if (!this.enabled) return
    // Using Web Audio API to generate a simple click sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.05)
  }

  // Play success sound
  playSuccess() {
    if (!this.enabled) return
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 523.25 // C5
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    // Add second note for chord
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 659.25 // E5
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.3)
    }, 100)
  }

  // Play error sound
  playError() {
    if (!this.enabled) return
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 200
    oscillator.type = "sawtooth"

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  // Play game complete sound
  playComplete() {
    if (!this.enabled) return
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Play ascending notes
    const notes = [523.25, 587.33, 659.25, 783.99] // C, D, E, G
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = freq
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      }, index * 100)
    })
  }
}

// Singleton instance
let audioManager: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (typeof window === "undefined") {
    return new AudioManager()
  }
  if (!audioManager) {
    audioManager = new AudioManager()
  }
  return audioManager
}
