export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled = true
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== "undefined") {
      // Load sound preference from localStorage
      const savedPreference = localStorage.getItem("soundEnabled")
      this.enabled = savedPreference !== "false"

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Resume AudioContext if it's suspended (required by browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }

    return this.audioContext
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
  async playKeyPress() {
    if (!this.enabled) return

    try {
      const audioContext = await this.ensureAudioContext()
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
    } catch (error) {
      console.error("Error playing keypress sound:", error)
    }
  }

  // Play success sound
  async playSuccess() {
    if (!this.enabled) return

    try {
      const audioContext = await this.ensureAudioContext()
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
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 659.25 // E5
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      osc2.start(audioContext.currentTime + 0.1)
      osc2.stop(audioContext.currentTime + 0.4)
    } catch (error) {
      console.error("Error playing success sound:", error)
    }
  }

  // Play error sound
  async playError() {
    if (!this.enabled) return

    try {
      const audioContext = await this.ensureAudioContext()
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
    } catch (error) {
      console.error("Error playing error sound:", error)
    }
  }

  // Play game complete sound
  async playComplete() {
    if (!this.enabled) return

    try {
      const audioContext = await this.ensureAudioContext()

      // Play ascending notes
      const notes = [523.25, 587.33, 659.25, 783.99] // C, D, E, G
      notes.forEach((freq, index) => {
        const startTime = audioContext.currentTime + index * 0.1
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = freq
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.2, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

        oscillator.start(startTime)
        oscillator.stop(startTime + 0.2)
      })
    } catch (error) {
      console.error("Error playing complete sound:", error)
    }
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
