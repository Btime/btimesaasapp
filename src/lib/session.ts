/**
 * Dados de sessão que vivem fora do store (ex.: conversa do suporte).
 * Quem guarda algo assim registra uma limpeza aqui; "Sair" e "Reiniciar
 * demonstração" chamam resetSession() junto com o reset do store.
 */
const resetters = new Set<() => void>()

export function onSessionReset(fn: () => void): void {
  resetters.add(fn)
}

export function resetSession(): void {
  resetters.forEach((fn) => fn())
}
