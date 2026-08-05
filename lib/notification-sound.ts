"use client"

/**
 * Tono de aviso de mensaje nuevo.
 *
 * Se sintetiza con la Web Audio API en lugar de reproducir un fichero: no hay
 * que servir ningún asset, suena igual sin conexión y evita el retardo de la
 * primera descarga. Son dos notas cortas ascendentes, al estilo de los avisos
 * de mensajería.
 *
 * Los navegadores bloquean el audio hasta que el usuario ha interactuado con
 * la página, así que esto puede no sonar en la primera carga. Falla en
 * silencio: un aviso que no suena nunca debe romper la aplicación.
 */

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    if (!audioContext) audioContext = new Ctor()
    return audioContext
  } catch {
    return null
  }
}

/** Una nota con ataque y caída suaves, para que no chasquee. */
function playTone(ctx: AudioContext, frequency: number, startAt: number, duration: number, peak: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(frequency, startAt)

  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.02)
}

export function playNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // El contexto arranca suspendido si aún no hubo interacción del usuario.
    if (ctx.state === "suspended") ctx.resume().catch(() => {})

    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.14, 0.18)          // La5
    playTone(ctx, 1174.66, now + 0.13, 0.22, 0.15) // Re6
  } catch {
    // Sin sonido, pero la app sigue.
  }
}

/** Vibración corta en móvil, como refuerzo del aviso. */
export function vibrateOnce() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(120)
    }
  } catch {
    // Ignorado: no todos los navegadores lo permiten.
  }
}
