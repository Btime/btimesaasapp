import { onSessionReset } from '../../lib/session'
import { AVAILABLE_VERSION } from '../../store/data'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatFull, formatRelative } from '../../lib/format'
import { selectPendingSyncCount } from '../../store/selectors'
import type { AppState, Language, ThemePreference } from '../../store/types'

/** Versão instalada no aparelho (simulada). */
/** Versão publicada na loja quando `prototype.updateAvailable` está ligado. */
export const NEW_VERSION = AVAILABLE_VERSION

export const UPDATE_STARTED_MESSAGE = 'Atualização iniciada na loja de aplicativos. (Simulação)'

export const LANGUAGE_LABELS: Record<Language, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Do aparelho',
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/** "Última há 2 min" / "Sincronizando…" / "Falhou em 1 item" */
export function syncDescription(state: AppState): string {
  if (state.sync.status === 'syncing') return 'Sincronizando…'
  if (state.sync.status === 'error') return 'Falhou em 1 item'
  const rel = formatRelative(state.sync.lastSyncAt)
  return rel === 'agora' ? 'Última há menos de 1 min' : `Última ${rel}`
}

/** "1 atividade aguardando envio" / "3 atividades aguardando envio" */
export function pendingLabel(n: number): string {
  return n === 1 ? '1 atividade aguardando envio' : `${n} atividades aguardando envio`
}

/** Resumo em texto puro para colar na conversa com o suporte. */
export function supportSummary(state: AppState): string {
  const { sync, user } = state
  const failed = sync.entities.find((e) => e.status === 'error')
  const syncState =
    sync.status === 'syncing'
      ? 'em andamento'
      : sync.status === 'error'
        ? `falhou${failed?.error ? ` (${failed.error.code})` : ''}`
        : 'ok'
  return [
    'Informações do app btime',
    `Versão do app: ${state.installedVersion}${state.prototype.updateAvailable ? ` (nova versão ${NEW_VERSION} disponível)` : ''}`,
    `Ambiente: ${user.environment}`,
    `Usuário: ${user.email ?? user.name}`,
    `Última sincronização: ${formatFull(sync.lastSyncAt)} (${formatRelative(sync.lastSyncAt)})`,
    `Estado da sincronização: ${syncState}`,
    `Atividades aguardando envio: ${selectPendingSyncCount(state)}`,
  ].join('\n')
}

/** Copia para a área de transferência. Devolve false se o navegador recusar. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Tarefa simulada com espera (ex.: "Enviando" por ~1 s). Limpa o timer se a
 * tela sair antes de terminar.
 */
export function useSimulatedTask(ms = 1000): [boolean, (onDone: () => void) => void] {
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )
  const run = useCallback(
    (onDone: () => void) => {
      if (timer.current) return
      setBusy(true)
      timer.current = window.setTimeout(() => {
        timer.current = null
        setBusy(false)
        onDone()
      }, ms)
    },
    [ms],
  )
  return [busy, run]
}

/*
 * Rascunho entregue à conversa com o suporte (ex.: "Falar com o suporte" na
 * tela de sincronização leva o código do erro). A rota `support` não tem
 * parâmetros, então o texto passa por aqui.
 */
let supportDraft: string | null = null
onSessionReset(() => {
  supportDraft = null
})

export function setSupportDraft(text: string): void {
  supportDraft = text
}

export function peekSupportDraft(): string {
  return supportDraft ?? ''
}

export function clearSupportDraft(): void {
  supportDraft = null
}
