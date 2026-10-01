import { useStore } from './store'
import type { Activity, ActivityStatus, AppState, Place, Question, Questionnaire } from './types'

export const OPEN_STATUSES: ActivityStatus[] = ['recebida', 'andamento', 'pausada']
export const FINISHED_STATUSES: ActivityStatus[] = ['concluida', 'recusada', 'improdutiva']

export function isOpen(a: Activity): boolean {
  return OPEN_STATUSES.includes(a.status)
}

export function isFinished(a: Activity): boolean {
  return FINISHED_STATUSES.includes(a.status)
}

export function isInProgress(a: Activity): boolean {
  return a.status === 'andamento' || a.status === 'pausada'
}

function bySchedule(a: Activity, b: Activity): number {
  const ta = a.scheduledAt ? Date.parse(a.scheduledAt) : Number.MAX_SAFE_INTEGER
  const tb = b.scheduledAt ? Date.parse(b.scheduledAt) : Number.MAX_SAFE_INTEGER
  return ta - tb
}

export function selectMine(state: AppState): Activity[] {
  return state.activities.filter((a) => a.assignee.type === 'me' && isOpen(a)).sort(bySchedule)
}

/** Atribuídas a mim e ainda não iniciadas. */
export function selectToDo(state: AppState): Activity[] {
  return selectMine(state).filter((a) => a.status === 'recebida')
}

/** Em andamento ou pausadas, da última mexida para a mais antiga. */
export function selectInProgress(state: AppState): Activity[] {
  const touched = (a: Activity) => Date.parse(a.lastTouchedAt ?? a.startedAt ?? a.openedAt)
  return state.activities
    .filter((a) => a.assignee.type === 'me' && isInProgress(a))
    .sort((a, b) => touched(b) - touched(a))
}

export function selectGroup(state: AppState): Activity[] {
  if (!state.prototype.inGroup) return []
  return state.activities.filter((a) => a.assignee.type === 'group' && isOpen(a)).sort(bySchedule)
}

export function selectFinished(state: AppState): Activity[] {
  return state.activities
    .filter((a) => a.assignee.type !== 'other' && isFinished(a))
    .sort((a, b) => Date.parse(b.finishedAt ?? b.openedAt) - Date.parse(a.finishedAt ?? a.openedAt))
}

export function selectPendingSyncCount(state: AppState): number {
  return state.activities.filter((a) => a.syncPending).length
}

export function getPlace(state: AppState, id: string): Place | undefined {
  return state.places.find((p) => p.id === id)
}

export function getQuestionnaire(state: AppState, id: string): Questionnaire | undefined {
  return state.questionnaires.find((q) => q.id === id)
}

export function isAnswered(_q: Question, value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'boolean'
}

export interface ActivityProgress {
  answered: number
  total: number
  requiredMissing: number
}

export function getProgress(activity: Activity, questionnaire: Questionnaire | undefined): ActivityProgress {
  const questions = questionnaire?.questions ?? []
  let answered = 0
  let requiredMissing = 0
  for (const q of questions) {
    const ok = isAnswered(q, activity.answers[q.id])
    if (ok) answered += 1
    else if (q.required) requiredMissing += 1
  }
  return { answered, total: questions.length, requiredMissing }
}

export function useActivity(id: string) {
  const { state } = useStore()
  const activity = state.activities.find((a) => a.id === id)
  const place = activity ? getPlace(state, activity.placeId) : undefined
  const questionnaire = activity ? getQuestionnaire(state, activity.questionnaireId) : undefined
  return { activity, place, questionnaire }
}

/** A distância só bloqueia quando o GPS diz que a pessoa está longe (> 0,5 km). */
export function isFarFromPlace(state: AppState, place: Place | undefined): boolean {
  if (!place) return false
  if (state.prototype.nearPlace) return false
  return place.distanceKm > 0.5
}
