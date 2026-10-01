import type { RouteName } from '../../nav/routes'

/** Nota de revisão exibida no painel ao lado do aparelho. */
export interface ScreenNote {
  /** Uma frase: o que a tela resolve. */
  summary: string
  /** O que mudou em relação ao app atual (ligado ao que foi levantado na reunião). */
  changes: string[]
  /** Decisões que dependem de produto/Julia. */
  openQuestions?: string[]
}

export type NotesMap = Partial<Record<RouteName, ScreenNote>>
