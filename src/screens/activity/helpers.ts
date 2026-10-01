/** Funções de apoio do fluxo da atividade (sem componentes). */

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Rola até o bloco de um campo com erro e põe o foco no primeiro controle
 * dele (radio, campo de texto ou botão de foto).
 */
export function focusFieldIn(container: HTMLElement | null): void {
  if (!container) return
  const target =
    container.querySelector<HTMLElement>('input:checked') ??
    container.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), button:not([disabled])')
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  // Rola só o corpo da tela, sem mexer na página em volta do aparelho.
  const scroller = container.closest<HTMLElement>('.screen__body')
  if (scroller) {
    const offset = container.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    scroller.scrollTo({ top: scroller.scrollTop + offset - 16, behavior })
  } else {
    container.scrollIntoView({ block: 'start', behavior })
  }
  target?.focus({ preventScroll: true })
}

/** "1 obrigatória pendente" / "2 obrigatórias pendentes" */
export function pendingRequiredLabel(n: number): string {
  return n === 1 ? '1 obrigatória pendente' : `${n} obrigatórias pendentes`
}

/** "Falta 1 pergunta obrigatória" / "Faltam 2 perguntas obrigatórias" */
export function missingRequiredNote(n: number): string {
  return n === 1 ? 'Falta 1 pergunta obrigatória' : `Faltam ${n} perguntas obrigatórias`
}
