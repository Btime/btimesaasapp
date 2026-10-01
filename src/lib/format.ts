import type { ActivityStatus, Priority } from '../store/types'

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dayMonthFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fullFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const numberFmt = new Intl.NumberFormat('pt-BR')

function startOfDay(d: Date): number {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c.getTime()
}

/** "Hoje, 15:14" / "Amanhã, 09:30" / "Ontem, 10:41" / "19/09, 15:14" */
export function formatWhen(iso: string | undefined): string {
  if (!iso) return 'Sem agendamento'
  const d = new Date(iso)
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000)
  const time = timeFmt.format(d)
  if (diffDays === 0) return `Hoje, ${time}`
  if (diffDays === 1) return `Amanhã, ${time}`
  if (diffDays === -1) return `Ontem, ${time}`
  return `${dayMonthFmt.format(d)}, ${time}`
}

/** "19/09/2026, 15:14" */
export function formatFull(iso: string | undefined): string {
  if (!iso) return 'Não informado'
  return fullFmt.format(new Date(iso))
}

/** "agora" / "há 2 min" / "há 3 h" / "há 2 dias" */
export function formatRelative(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const h = Math.round(diffMin / 60)
  if (h < 24) return `há ${h} h`
  const days = Math.round(h / 24)
  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

export function formatDistance(km: number): string {
  if (km < 1) return `${numberFmt.format(Math.round(km * 1000))} m`
  return `${numberFmt.format(Math.round(km))} km`
}

export function isOverdue(iso: string | undefined): boolean {
  return !!iso && Date.parse(iso) < Date.now()
}

export const statusLabel: Record<ActivityStatus, string> = {
  recebida: 'Recebida',
  andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
  recusada: 'Recusada',
  improdutiva: 'Improdutiva',
}

export const priorityLabel: Record<Priority, string> = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  baixa: 'Prioridade baixa',
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
