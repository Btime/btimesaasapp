import { CircleCheck, X } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Screen, ScreenBody } from '../../components/layout'
import { formatFull, formatWhen } from '../../lib/format'
import { useNav } from '../../nav/nav'
import type { Route } from '../../nav/routes'
import { selectInProgress, selectToDo, useActivity } from '../../store/selectors'
import { useStore } from '../../store/store'
import { ActivityNotFound, SyncPendingNotice } from './parts'
import './activity.css'

export function Done({ route }: { route: Extract<Route, { name: 'done' }> }) {
  const { state } = useStore()
  const nav = useNav()
  const { activity } = useActivity(route.id)

  if (!activity) return <ActivityNotFound title="Atividade concluída" />

  // Primeiro o que já foi começado (o mesmo destaque da Início); depois a próxima agendada.
  const resume = selectInProgress(state).find((x) => x.id !== activity.id)
  const next = resume ?? selectToDo(state).find((x) => x.id !== activity.id)
  const goHome = () => nav.reset([{ name: 'home' }])

  return (
    <Screen tone="surface">
      <div className="act-done__top">
        <IconButton icon={X} label="Fechar" onClick={goHome} />
      </div>

      <ScreenBody className="act-done">
        <div className="act-done__icon" aria-hidden="true">
          <Icon icon={CircleCheck} size={40} />
        </div>
        <div className="act-done__text">
          <h1 className="t-h3">Atividade concluída</h1>
          <p className="t-body t-muted">Ela fica em Atividades, na aba Finalizadas.</p>
        </div>

        <div className="act-done__summary">
          <p className="t-caption t-muted t-tabular">{activity.code}</p>
          <p className="t-body-strong">{activity.title}</p>
          <p className="t-small t-muted">Concluída em {formatFull(activity.finishedAt)}</p>
        </div>

        <div className="act-done__sync">
          <SyncPendingNotice pending={activity.syncPending}>Será enviada na próxima sincronização.</SyncPendingNotice>
        </div>
      </ScreenBody>

      <div className="act-done__footer">
        {next && (
          <p className="t-small t-muted act-done__next">
            {resume ? 'Continue de onde parou' : 'Próxima'}: {next.title} · {formatWhen(next.scheduledAt).toLowerCase()}
          </p>
        )}
        {next ? (
          <Button
            block
            onClick={() =>
              nav.reset(
                resume
                  ? [{ name: 'home' }, { name: 'execute', id: next.id }]
                  : [{ name: 'home' }, { name: 'activity', id: next.id }],
              )
            }
          >
            {resume ? 'Continuar a próxima' : 'Ir para a próxima'}
          </Button>
        ) : (
          <Button block onClick={goHome}>
            Voltar ao início
          </Button>
        )}
        <Button block variant="secondary" onClick={() => nav.goTab({ name: 'activities', tab: 'finalizadas' })}>
          Ver finalizadas
        </Button>
      </div>
    </Screen>
  )
}
