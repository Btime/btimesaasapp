import { useSyncExternalStore } from 'react'

/**
 * Relógio compartilhado (um único timer para o app inteiro). Componentes que
 * mostram tempo relativo ("há 2 min", "Hoje") usam useNow() para renderizar
 * de novo a cada minuto.
 */
let now = Date.now()
const listeners = new Set<() => void>()
let timer: number | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (timer === null) {
    timer = window.setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, 30_000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now)
}
