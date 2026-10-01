import { ChevronRight, CircleAlert, Download, Plus, RefreshCw, ScanLine, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { ActivityCard } from '../../components/ActivityCard'
import { BrandIcon } from '../../components/BrandIcon'
import { BrandMark } from '../../components/BrandMark'
import { Button } from '../../components/Button'
import { StatusChip } from '../../components/Chip'
import { Icon } from '../../components/Icon'
import { Callout, EmptyState, ProgressBar, Screen, ScreenBody, Section } from '../../components/layout'
import { cx } from '../../lib/cx'
import { formatRelative, formatWhen, plural } from '../../lib/format'
import { useNow } from '../../lib/now'
import { useNav } from '../../nav/nav'
import {
  getPlace,
  getProgress,
  getQuestionnaire,
  selectGroup,
  selectInProgress,
  selectMine,
  selectToDo,
} from '../../store/selectors'
import { useStore } from '../../store/store'
import { AVAILABLE_VERSION } from '../../store/data'
import type { Activity } from '../../store/types'
import './home.css'

/**
 * Linha de sincronização do topo. O texto visível muda a cada passo, mas só
 * as transições (começou, falhou) são anunciadas; o sucesso já tem aviso.
 */
function SyncLine() {
  const { state } = useStore()
  const nav = useNav()
  useNow()
  const { sync } = state
  const failed = sync.entities.filter((e) => e.status === 'error').length
  const announcement =
    sync.status === 'syncing'
      ? 'Sincronizando.'
      : sync.status === 'error'
        ? `A sincronização falhou em ${plural(failed, 'item', 'itens')}.`
        : ''
  return (
    <>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
      {sync.status === 'syncing' ? (
        <div className="sync-line" aria-hidden="true">
          <span className="sync-line__row">
            <span className="spinner sync-line__spinner" />
            <span className="t-small">
              {sync.step} · <span className="t-tabular">{Math.round(sync.progress)}%</span>
            </span>
          </span>
          <ProgressBar value={sync.progress} label="Progresso da sincronização" />
        </div>
      ) : sync.status === 'error' ? (
        <button type="button" className="sync-line sync-line--error" onClick={() => nav.push({ name: 'sync' })}>
          <span className="sync-line__row">
            <Icon icon={CircleAlert} size={18} />
            <span className="t-small">A sincronização falhou em {plural(failed, 'item', 'itens')}.</span>
            <span className="t-label sync-line__link">Ver erro</span>
          </span>
        </button>
      ) : (
        <button type="button" className="sync-line" onClick={() => nav.push({ name: 'sync' })}>
          <span className="sync-line__row">
            <span className="sync-line__dot" aria-hidden="true" />
            <span className="t-small">
              Sincronizado {formatRelative(sync.lastSyncAt)}
              <span className="visually-hidden">. Ver detalhes da sincronização</span>
            </span>
            <Icon icon={ChevronRight} size={16} />
          </span>
        </button>
      )}
    </>
  )
}

function Stat({ value, label, hint, onClick }: { value: number; label: string; hint: string; onClick: () => void }) {
  const id = useId()
  return (
    <button
      type="button"
      className="stat"
      onClick={onClick}
      aria-labelledby={`${id}-value ${id}-label`}
      aria-describedby={`${id}-hint`}
    >
      <span id={`${id}-value`} className="t-display t-tabular stat__value">
        {value}
      </span>
      <span id={`${id}-label`} className="t-body-strong">
        {label}
      </span>
      <span id={`${id}-hint`} className="t-small stat__hint">
        {hint}
      </span>
    </button>
  )
}

function ContinueCard({ activity }: { activity: Activity }) {
  const { state } = useStore()
  const nav = useNav()
  useNow()
  const place = getPlace(state, activity.placeId)
  const progress = getProgress(activity, getQuestionnaire(state, activity.questionnaireId))
  const pct = progress.total ? (progress.answered / progress.total) * 100 : 0
  return (
    <article className="continue" aria-labelledby={`continue-${activity.id}`}>
      <div className="continue__head">
        <StatusChip status={activity.status} />
        <span className="t-caption t-muted t-tabular">{activity.code}</span>
      </div>
      <h3 id={`continue-${activity.id}`} className="t-title">
        {activity.title}
      </h3>
      {place && (
        <p className="t-small t-muted">
          {place.name} · {formatWhen(activity.scheduledAt)}
        </p>
      )}
      {progress.total > 0 && (
        <div className="continue__progress">
          <ProgressBar value={pct} label="Respostas preenchidas" />
          <p className="t-caption t-muted">
            {progress.answered} de {progress.total} respostas
            {progress.requiredMissing > 0 &&
              ` · ${plural(progress.requiredMissing, 'obrigatória pendente', 'obrigatórias pendentes')}`}
          </p>
        </div>
      )}
      <div className="continue__actions">
        <Button onClick={() => nav.push({ name: 'execute', id: activity.id })}>Continuar</Button>
        <Button variant="secondary" onClick={() => nav.push({ name: 'activity', id: activity.id })}>
          Detalhes
        </Button>
      </div>
    </article>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  busy,
  busyLabel,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  busy?: boolean
  busyLabel?: string
}) {
  return (
    <button type="button" className={cx('quick', busy && 'is-busy')} onClick={onClick} aria-busy={busy || undefined}>
      <span className="quick__icon">
        {busy ? <span className="spinner" aria-hidden="true" /> : <Icon icon={icon} size={24} />}
      </span>
      {/* O rótulo não muda durante o carregamento (mantém a largura); o estado vai para o leitor de tela. */}
      <span className="t-label quick__label">
        {label}
        {busy && busyLabel && <span className="visually-hidden">: {busyLabel}</span>}
      </span>
    </button>
  )
}

export function Home() {
  const { state, actions } = useStore()
  const nav = useNav()
  const mine = selectMine(state)
  const toDo = selectToDo(state)
  const group = selectGroup(state)
  const inProgress = selectInProgress(state)
  const [lead, ...alsoInProgress] = inProgress
  const next = toDo.slice(0, 3)
  const syncing = state.sync.status === 'syncing'
  const open = (a: Activity) => nav.push({ name: 'activity', id: a.id })

  return (
    <Screen>
      <ScreenBody padded={false}>
        <header className="home-hero">
          <div className="home-hero__top">
            <BrandMark variant="simbolo" tone="branco" width={24} />
            <span className="t-caption home-hero__env">Ambiente {state.user.environment}</span>
            <Button
              variant="on-dark"
              size="sm"
              leading={<BrandIcon name="suporte" size={20} />}
              onClick={() => nav.push({ name: 'support' })}
              className="home-hero__help"
            >
              Suporte
            </Button>
          </div>
          <div className="home-hero__greet">
            <h1 className="t-h3">Olá, {state.user.name}</h1>
            <SyncLine />
          </div>
          <div className={cx('home-hero__stats', !state.prototype.inGroup && 'is-single')}>
            {/* Mesma regra da aba Minhas e do número da barra inferior: atribuídas a você e abertas. */}
            <Stat
              value={mine.length}
              label="Minhas abertas"
              hint="Atribuídas a você e ainda não finalizadas"
              onClick={() => nav.goTab({ name: 'activities', tab: 'minhas' })}
            />
            {state.prototype.inGroup && (
              <Stat
                value={group.length}
                label="No seu grupo"
                hint={`Disponíveis para ${state.user.groupName}`}
                onClick={() => nav.goTab({ name: 'activities', tab: 'grupo' })}
              />
            )}
          </div>
        </header>

        <div className="home-body">
          {state.prototype.updateAvailable && state.updateDismissed && (
            <div className="home-notice">
              <Callout
                tone="brand"
                icon={Download}
                title={`Nova versão ${AVAILABLE_VERSION} disponível`}
                action={
                  <Button size="sm" variant="secondary" onClick={() => nav.push({ name: 'appVersion' })}>
                    Ver atualização
                  </Button>
                }
              >
                Algumas funções podem não funcionar até você atualizar.
              </Callout>
            </div>
          )}

          {lead && (
            <Section title="Continue de onde parou" id="home-continue">
              <div className="card-list">
                <ContinueCard activity={lead} />
                {alsoInProgress.length > 0 && (
                  <>
                    <h3 className="t-label t-muted home-also">Também em andamento</h3>
                    {alsoInProgress.map((a) => (
                      <ActivityCard key={a.id} activity={a} onOpen={open} compact />
                    ))}
                  </>
                )}
              </div>
            </Section>
          )}

          <Section title="Atalhos" id="home-quick">
            <div className="quick-row">
              <QuickAction icon={ScanLine} label={'Ler QR Code'} onClick={() => nav.push({ name: 'scan' })} />
              <QuickAction icon={Plus} label="Nova atividade" onClick={() => nav.push({ name: 'new' })} />
              <QuickAction
                icon={RefreshCw}
                label="Sincronizar"
                busyLabel="sincronizando"
                onClick={actions.startSync}
                busy={syncing}
              />
            </div>
          </Section>

          <Section
            title="Próximas"
            id="home-next"
            action={
              toDo.length > 0 && (
                <Button variant="tertiary" size="sm" onClick={() => nav.goTab({ name: 'activities', tab: 'minhas' })}>
                  Ver todas
                </Button>
              )
            }
          >
            {next.length > 0 ? (
              <div className="card-list">
                {next.map((a) => (
                  <ActivityCard key={a.id} activity={a} onOpen={open} compact />
                ))}
              </div>
            ) : group.length > 0 ? (
              <EmptyState
                glyph={<BrandIcon name="pessoas" size={32} />}
                title={lead ? 'Nenhuma outra atividade sua' : 'Nada atribuído a você agora'}
                description={`Há ${plural(group.length, 'atividade disponível', 'atividades disponíveis')} no seu grupo.`}
                action={
                  <Button variant="secondary" onClick={() => nav.goTab({ name: 'activities', tab: 'grupo' })}>
                    Ver atividades do grupo
                  </Button>
                }
              />
            ) : (
              <EmptyState
                glyph={<BrandIcon name="resultado" size={32} />}
                title={lead ? 'Nenhuma outra atividade agendada' : 'Nada para fazer agora'}
                description="Quando uma atividade for atribuída a você, ela aparece aqui."
                action={
                  <Button variant="secondary" iconStart={Plus} onClick={() => nav.push({ name: 'new' })}>
                    Nova atividade
                  </Button>
                }
              />
            )}
          </Section>
        </div>
      </ScreenBody>
    </Screen>
  )
}
