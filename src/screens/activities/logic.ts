import { STATUS_META } from '../../components/Chip'
import {
  ArrowDown,
  ArrowUp,
  Equal,
  type LucideIcon,
} from 'lucide-react'
import type { ChoiceOption } from '../../components/fields'
import { isOverdue } from '../../lib/format'
import type { ActivitiesTab } from '../../nav/routes'
import { selectFinished, selectGroup, selectMine } from '../../store/selectors'
import type { Activity, ActivityStatus, AppState, Place, Priority } from '../../store/types'

/** Regras puras da lista de Atividades: abas, busca, filtros e ordenação. */

export type ViewMode = 'lista' | 'status'

export type SortKey = 'agendamento' | 'distancia' | 'prioridade' | 'status' | 'criacao' | 'sincronizacao'

export type ScheduleFilter = 'any' | 'hoje' | 'semana' | 'atrasadas' | 'sem'

export interface Filters {
  schedule: ScheduleFilter
  priorities: Priority[]
  /** `null` = qualquer local/pessoa. */
  placeId: string | null
}

export const EMPTY_FILTERS: Filters = { schedule: 'any', priorities: [], placeId: null }
export const DEFAULT_SORT: SortKey = 'agendamento'

export const TAB_LABEL: Record<ActivitiesTab, string> = {
  minhas: 'Minhas',
  grupo: 'Do grupo',
  finalizadas: 'Finalizadas',
}

/** Status de cada aba, na ordem do fluxo (as antigas colunas do kanban). */
export const TAB_STATUSES: Record<ActivitiesTab, ActivityStatus[]> = {
  minhas: ['recebida', 'andamento', 'pausada'],
  grupo: ['recebida', 'andamento', 'pausada'],
  finalizadas: ['concluida', 'recusada', 'improdutiva'],
}

/** Rótulo no plural de cada grupo; ícone e tom vêm de STATUS_META (fonte única). */
const GROUP_LABEL: Record<ActivityStatus, string> = {
  recebida: 'Recebidas',
  andamento: 'Em andamento',
  pausada: 'Pausadas',
  concluida: 'Concluídas',
  recusada: 'Recusadas',
  improdutiva: 'Improdutivas',
}

export const STATUS_GROUP: Record<ActivityStatus, { label: string; icon: LucideIcon; tone: string }> = Object.fromEntries(
  (Object.keys(GROUP_LABEL) as ActivityStatus[]).map((s) => [s, { label: GROUP_LABEL[s], ...STATUS_META[s] }]),
) as Record<ActivityStatus, { label: string; icon: LucideIcon; tone: string }>

export const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; icon: LucideIcon }> = [
  { value: 'alta', label: 'Alta', icon: ArrowUp },
  { value: 'media', label: 'Média', icon: Equal },
  { value: 'baixa', label: 'Baixa', icon: ArrowDown },
]

/** Em Finalizadas, a data é a de finalização e 'Atrasadas' não se aplica. */
export function scheduleOptions(finished: boolean): ChoiceOption[] {
  if (!finished) return SCHEDULE_OPTIONS
  // Em Finalizadas o grupo é 'Data de finalização': sem 'Atrasadas' e sem 'Sem agendamento'.
  return SCHEDULE_OPTIONS.filter((o) => o.value !== 'atrasadas' && o.value !== 'sem')
}

export const SCHEDULE_OPTIONS: ChoiceOption[] = [
  { value: 'any', label: 'Qualquer data' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Esta semana', description: 'De segunda a domingo' },
  { value: 'atrasadas', label: 'Atrasadas', description: 'O horário agendado já passou e a atividade não foi iniciada' },
  { value: 'sem', label: 'Sem agendamento' },
]

export function sortOptions(tab: ActivitiesTab): ChoiceOption[] {
  const finished = tab === 'finalizadas'
  return [
    {
      value: 'agendamento',
      label: finished ? 'Data de finalização' : 'Data de agendamento',
      description: finished ? 'Mais recentes primeiro. É a ordem padrão.' : 'Atrasadas e mais próximas primeiro. É a ordem padrão.',
    },
    { value: 'distancia', label: 'Distância', description: 'Mais perto de você primeiro' },
    { value: 'prioridade', label: 'Prioridade', description: 'Alta, média, baixa e sem prioridade' },
    {
      value: 'status',
      label: 'Status',
      description: finished ? 'Concluídas, recusadas e improdutivas' : 'Recebidas, em andamento e pausadas',
    },
    { value: 'criacao', label: 'Data de criação', description: 'Abertas mais recentemente primeiro' },
    { value: 'sincronizacao', label: 'Aguardando envio', description: 'Atividades ainda não enviadas primeiro' },
  ]
}

/** Complemento da linha de resultado quando a ordem não é a padrão. */
export const SORT_SUMMARY: Record<SortKey, string> = {
  agendamento: 'por data de agendamento',
  distancia: 'por distância',
  prioridade: 'por prioridade',
  status: 'por status',
  criacao: 'por data de criação',
  sincronizacao: 'aguardando envio primeiro',
}

export function selectTab(state: AppState, tab: ActivitiesTab): Activity[] {
  if (tab === 'grupo') return selectGroup(state)
  if (tab === 'finalizadas') return selectFinished(state)
  return selectMine(state)
}

/** Minúsculas e sem acentos, para comparar "Belém" com "belem". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function matchesSearch(activity: Activity, place: Place | undefined, term: string): boolean {
  const needle = normalize(term)
  if (!needle) return true
  const haystack = [activity.title, activity.code, place?.name, place?.company, place?.address]
  return haystack.some((value) => value && normalize(value).includes(needle))
}

export function countActiveFilters(filters: Filters): number {
  return (filters.schedule !== 'any' ? 1 : 0) + (filters.priorities.length > 0 ? 1 : 0) + (filters.placeId ? 1 : 0)
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function matchesSchedule(activity: Activity, schedule: ScheduleFilter, now: Date): boolean {
  if (schedule === 'any') return true
  if (schedule === 'sem') return !activity.scheduledAt
  // Finalizadas são filtradas pela data de finalização, que é a data que o card mostra.
  const finished = activity.status === 'concluida' || activity.status === 'recusada' || activity.status === 'improdutiva'
  const ref = finished ? activity.finishedAt : activity.scheduledAt
  if (!ref) return false
  const t = Date.parse(ref)
  if (schedule === 'atrasadas') return activity.status === 'recebida' && isOverdue(activity.scheduledAt)
  const today = startOfDay(now)
  if (schedule === 'hoje') {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return t >= today.getTime() && t < tomorrow.getTime()
  }
  // Esta semana: de segunda 00:00 até a segunda seguinte.
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  return t >= monday.getTime() && t < nextMonday.getTime()
}

export function matchesFilters(activity: Activity, filters: Filters, now = new Date()): boolean {
  if (!matchesSchedule(activity, filters.schedule, now)) return false
  if (filters.priorities.length > 0 && (!activity.priority || !filters.priorities.includes(activity.priority))) {
    return false
  }
  if (filters.placeId && activity.placeId !== filters.placeId) return false
  return true
}

const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 }
const STATUS_RANK: Record<ActivityStatus, number> = {
  recebida: 0,
  andamento: 1,
  pausada: 2,
  concluida: 3,
  recusada: 4,
  improdutiva: 5,
}

function time(iso: string | undefined, missing: number): number {
  return iso ? Date.parse(iso) : missing
}

export function sortActivities(list: Activity[], key: SortKey, places: Place[], tab: ActivitiesTab): Activity[] {
  const finished = tab === 'finalizadas'
  const distance = (a: Activity) => places.find((p) => p.id === a.placeId)?.distanceKm ?? Number.MAX_SAFE_INTEGER
  // Abertas: atrasadas e próximas primeiro. Finalizadas: mais recentes primeiro.
  const bySchedule = (a: Activity, b: Activity) =>
    finished
      ? time(b.finishedAt ?? b.openedAt, 0) - time(a.finishedAt ?? a.openedAt, 0)
      : time(a.scheduledAt, Number.MAX_SAFE_INTEGER) - time(b.scheduledAt, Number.MAX_SAFE_INTEGER)

  const compare: Record<SortKey, (a: Activity, b: Activity) => number> = {
    agendamento: bySchedule,
    distancia: (a, b) => distance(a) - distance(b),
    prioridade: (a, b) => (a.priority ? PRIORITY_RANK[a.priority] : 3) - (b.priority ? PRIORITY_RANK[b.priority] : 3),
    status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
    criacao: (a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt),
    sincronizacao: (a, b) => Number(b.syncPending) - Number(a.syncPending),
  }
  return [...list].sort((a, b) => compare[key](a, b) || bySchedule(a, b))
}
