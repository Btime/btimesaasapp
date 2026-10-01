import { Building2, CalendarClock, CloudUpload, MapPin } from 'lucide-react'
import { useId } from 'react'
import { cx } from '../lib/cx'
import { useNow } from '../lib/now'
import { formatDistance, formatFull, formatWhen, isOverdue } from '../lib/format'
import { getPlace, getProgress, getQuestionnaire } from '../store/selectors'
import { useStore } from '../store/store'
import type { Activity } from '../store/types'
import { BrandIcon } from './BrandIcon'
import { PriorityChip, StatusChip } from './Chip'
import { Icon } from './Icon'

/**
 * Card de atividade. O card inteiro é um botão que abre o detalhe; as ações
 * (executar, recusar, tornar improdutiva) ficam no detalhe, com explicação.
 * Nome acessível curto (título, status, prioridade, atraso); o resto vira descrição.
 */
export function ActivityCard({
  activity,
  onOpen,
  compact,
}: {
  activity: Activity
  onOpen: (activity: Activity) => void
  compact?: boolean
}) {
  const { state } = useStore()
  useNow()
  const uid = useId()
  const place = getPlace(state, activity.placeId)
  const questionnaire = getQuestionnaire(state, activity.questionnaireId)
  const progress = getProgress(activity, questionnaire)
  const finished = ['concluida', 'recusada', 'improdutiva'].includes(activity.status)
  const overdue = !finished && activity.status === 'recebida' && isOverdue(activity.scheduledAt)

  return (
    <button
      type="button"
      className={cx('activity-card', compact && 'activity-card--compact')}
      onClick={() => onOpen(activity)}
      aria-labelledby={`${uid}-title ${uid}-chips${overdue ? ` ${uid}-late` : ''}`}
      aria-describedby={`${uid}-code ${uid}-meta${activity.syncPending ? ` ${uid}-pending` : ''}`}
    >
      <span className="activity-card__chips">
        <span id={`${uid}-chips`} className="activity-card__chip-group">
          <StatusChip status={activity.status} />
          {activity.priority && <PriorityChip priority={activity.priority} />}
        </span>
        <span id={`${uid}-code`} className="activity-card__code t-caption t-muted t-tabular">
          <span className="visually-hidden">Código </span>
          {activity.code}
        </span>
      </span>
      <span id={`${uid}-title`} className="activity-card__title t-title">
        {activity.title}
      </span>
      <span id={`${uid}-meta`} className="activity-card__meta">
        {place && (
          <span className="meta-line">
            <Icon icon={Building2} size={16} />
            <span className="t-small">
              {place.name} · {place.company}
            </span>
          </span>
        )}
        {finished ? (
          <span className="meta-line">
            <Icon icon={CalendarClock} size={16} />
            <span className="t-small">Finalizada em {formatFull(activity.finishedAt)}</span>
          </span>
        ) : (
          <span className={cx('meta-line', overdue && 'meta-line--warn')}>
            <Icon icon={CalendarClock} size={16} />
            <span className="t-small">
              {activity.scheduledAt ? `Agendada para ${formatWhen(activity.scheduledAt).toLowerCase()}` : 'Sem agendamento'}
              {overdue && <span id={`${uid}-late`}> · atrasada</span>}
            </span>
          </span>
        )}
        {place && !compact && (
          <span className="meta-line">
            <Icon icon={MapPin} size={16} />
            <span className="t-small">
              {place.address} · {formatDistance(place.distanceKm)}
            </span>
          </span>
        )}
        {activity.assignee.type === 'group' && (
          <span className="meta-line">
            <BrandIcon name="pessoas" size={16} />
            <span className="t-small">Do grupo {activity.assignee.groupName}</span>
          </span>
        )}
      </span>
      {(activity.status === 'andamento' || activity.status === 'pausada') && progress.total > 0 && (
        <span className="activity-card__progress t-caption t-muted">
          {progress.answered} de {progress.total} respostas
        </span>
      )}
      {activity.syncPending && (
        <span id={`${uid}-pending`} className="activity-card__pending t-caption">
          <Icon icon={CloudUpload} size={14} />
          Aguardando envio
        </span>
      )}
    </button>
  )
}
