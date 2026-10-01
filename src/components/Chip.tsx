import {
  ArrowDown,
  ArrowUp,
  Ban,
  CircleCheck,
  CircleDot,
  CirclePause,
  CircleSlash,
  Equal,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { priorityLabel, statusLabel } from '../lib/format'
import type { ActivityStatus, Priority } from '../store/types'
import { Icon } from './Icon'

export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'brand'

/** Chip de estado: forma pill, ícone e rótulo sempre visíveis (nunca só cor). */
export function Chip({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: ChipTone
  icon?: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cx('chip', `chip--${tone}`, className)}>
      {icon && <Icon icon={icon} size={14} />}
      {children}
    </span>
  )
}

/** Tom e ícone de cada status (fonte única para chips e agrupamentos). */
export const STATUS_META: Record<ActivityStatus, { tone: ChipTone; icon: LucideIcon }> = {
  recebida: { tone: 'info', icon: Inbox },
  andamento: { tone: 'brand', icon: CircleDot },
  pausada: { tone: 'warning', icon: CirclePause },
  concluida: { tone: 'success', icon: CircleCheck },
  recusada: { tone: 'error', icon: Ban },
  improdutiva: { tone: 'neutral', icon: CircleSlash },
}

export function StatusChip({ status }: { status: ActivityStatus }) {
  const { tone, icon } = STATUS_META[status]
  return (
    <Chip tone={tone} icon={icon}>
      {statusLabel[status]}
    </Chip>
  )
}

const PRIORITY_ICON: Record<Priority, LucideIcon> = { alta: ArrowUp, media: Equal, baixa: ArrowDown }
const PRIORITY_TONE: Record<Priority, ChipTone> = { alta: 'error', media: 'warning', baixa: 'neutral' }

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <Chip tone={PRIORITY_TONE[priority]} icon={PRIORITY_ICON[priority]}>
      {priorityLabel[priority].replace('Prioridade ', '')}
      <span className="visually-hidden"> prioridade</span>
    </Chip>
  )
}
