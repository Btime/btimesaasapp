import { ChevronDown } from 'lucide-react'
import { ActivityCard } from '../../components/ActivityCard'
import { Icon } from '../../components/Icon'
import { cx } from '../../lib/cx'
import { plural } from '../../lib/format'
import type { Activity, ActivityStatus } from '../../store/types'
import { STATUS_GROUP } from './logic'

/**
 * Visão "Por status": as colunas do kanban da web viram grupos verticais.
 * Cada grupo recolhe ao tocar no cabeçalho; grupo vazio fica fechado.
 */
export function StatusGroups({
  statuses,
  activities,
  collapsed,
  onToggle,
  onOpen,
}: {
  statuses: ActivityStatus[]
  activities: Activity[]
  collapsed: ActivityStatus[]
  onToggle: (status: ActivityStatus) => void
  onOpen: (activity: Activity) => void
}) {
  return (
    <div className="acts-groups">
      {statuses.map((status) => {
        const group = STATUS_GROUP[status]
        const items = activities.filter((a) => a.status === status)
        const empty = items.length === 0
        const expanded = !empty && !collapsed.includes(status)
        const panelId = `acts-group-${status}`
        const lead = (
          <>
            <span className={cx('acts-group__icon', `acts-group__icon--${group.tone}`)} aria-hidden="true">
              <Icon icon={group.icon} size={18} />
            </span>
            <span className="t-body-strong acts-group__label">{group.label}</span>
            <span className="acts-group__count t-caption t-tabular" aria-hidden="true">
              {items.length}
            </span>
          </>
        )
        return (
          <section key={status} className={cx('acts-group', expanded && 'is-expanded', empty && 'is-empty')}>
            <h2 className="acts-group__heading">
              {empty ? (
                <span className="acts-group__head">
                  {lead}
                  <span className="t-small t-muted acts-group__end">Nenhuma</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="acts-group__head acts-group__head--action"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => onToggle(status)}
                >
                  {lead}
                  <span className="visually-hidden">, {plural(items.length, 'atividade', 'atividades')}</span>
                  <Icon icon={ChevronDown} size={20} className="acts-group__end acts-group__chevron" />
                </button>
              )}
            </h2>
            {!empty && (
              <div id={panelId} className="acts-group__panel" inert={!expanded || undefined}>
                <div className="acts-group__clip">
                  <div className="card-list acts-group__cards">
                    {items.map((a) => (
                      <ActivityCard key={a.id} activity={a} onOpen={onOpen} compact />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
