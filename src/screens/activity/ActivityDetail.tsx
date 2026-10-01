import {
  Ban,
  Building2,
  CalendarClock,
  CircleCheck,
  CircleSlash,
  ClipboardList,
  Clock,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  MapPinOff,
  Navigation,
  Package,
  Play,
  Route as RouteIcon,
  TextCursorInput,
  TriangleAlert,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { PriorityChip, StatusChip } from '../../components/Chip'
import { TextArea } from '../../components/fields'
import { Icon } from '../../components/Icon'
import {
  ActionBar,
  Callout,
  DefinitionList,
  ListRow,
  RowGroup,
  Screen,
  ScreenBody,
  Section,
  TopBar,
} from '../../components/layout'
import { Dialog, Sheet } from '../../components/overlay'
import { formatDistance, formatFull, isOverdue, plural } from '../../lib/format'
import { useNav } from '../../nav/nav'
import type { Route } from '../../nav/routes'
import { getProgress, isFarFromPlace, isFinished, isOpen, useActivity } from '../../store/selectors'
import { useStore, useToast } from '../../store/store'
import type { Activity, AppState, Place, Questionnaire } from '../../store/types'
import { ActivityNotFound, DirectionsSheet, PhotoThumbs, SyncPendingNotice } from './parts'
import './activity.css'

type Item = { term: string; value: ReactNode; icon?: LucideIcon }
type Overlay = 'more' | 'refuse' | 'directions' | 'far' | null

function withSub(main: string, sub: string) {
  return (
    <>
      {main}
      <span className="act-sub t-small t-muted">{sub}</span>
    </>
  )
}

function placeItems(state: AppState, place: Place | undefined): Item[] {
  if (!place) return [{ term: 'Local/pessoa', value: 'Não informado', icon: Building2 }]
  return [
    { term: 'Local/pessoa', value: withSub(place.name, place.company), icon: Building2 },
    { term: 'Endereço', value: place.address, icon: MapPin },
    {
      term: 'Distância',
      value: state.prototype.nearPlace ? 'Você está no local' : `${formatDistance(place.distanceKm)} de você`,
      icon: RouteIcon,
    },
  ]
}

function whenItems(a: Activity): Item[] {
  const overdue = a.status === 'recebida' && isOverdue(a.scheduledAt)
  const items: Item[] = [
    {
      term: 'Agendada para',
      value: a.scheduledAt ? (
        <>
          {formatFull(a.scheduledAt)}
          {overdue && (
            <span className="act-warn t-small">
              <Icon icon={TriangleAlert} size={16} />
              Atrasada
            </span>
          )}
        </>
      ) : (
        'Sem agendamento'
      ),
      icon: CalendarClock,
    },
    { term: 'Aberta em', value: formatFull(a.openedAt), icon: Clock },
  ]
  if (a.startedAt) items.push({ term: 'Iniciada em', value: formatFull(a.startedAt), icon: Play })
  return items
}

function whatItems(a: Activity, questionnaire: Questionnaire | undefined): Item[] {
  const items: Item[] = [
    {
      term: 'Questionário',
      value: questionnaire
        ? withSub(questionnaire.name, plural(questionnaire.questions.length, 'pergunta', 'perguntas'))
        : 'Não informado',
      icon: ClipboardList,
    },
  ]
  if (a.assetName) items.push({ term: 'Ativo', value: a.assetName, icon: Package })
  if (a.description) items.push({ term: 'Descrição', value: a.description, icon: FileText })
  return items
}

function resultItems(a: Activity, questionnaire: Questionnaire | undefined): Item[] {
  const finishedAt = { term: 'Finalizada em', value: formatFull(a.finishedAt), icon: Clock }
  const outcome = a.outcome
  if (a.status === 'recusada') {
    return [
      finishedAt,
      {
        term: 'Motivo da recusa',
        value: outcome?.kind === 'recusada' && outcome.reason ? outcome.reason : 'Nenhum motivo informado.',
        icon: Ban,
      },
    ]
  }
  if (a.status === 'improdutiva' && outcome?.kind === 'improdutiva') {
    return [
      finishedAt,
      { term: 'Motivo', value: outcome.reason, icon: CircleSlash },
      { term: 'Descrição', value: outcome.description, icon: FileText },
      {
        term: 'Evidência',
        value: outcome.evidence.length ? (
          <PhotoThumbs items={outcome.evidence} label="Fotos da evidência" />
        ) : (
          'Nenhuma foto.'
        ),
        icon: ImageIcon,
      },
    ]
  }
  const progress = getProgress(a, questionnaire)
  return [
    finishedAt,
    { term: 'Respostas', value: `${progress.answered} de ${progress.total}`, icon: CircleCheck },
  ]
}

export function ActivityDetail({ route }: { route: Extract<Route, { name: 'activity' }> }) {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const { activity, place, questionnaire } = useActivity(route.id)
  const uid = useId()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [refuseReason, setRefuseReason] = useState('')

  if (!activity) return <ActivityNotFound />
  const a: Activity = activity
  const open = isOpen(a)
  const finished = isFinished(a)
  const close = () => setOverlay(null)

  function begin() {
    actions.startActivity(a.id)
    setOverlay(null)
    nav.push({ name: 'execute', id: a.id })
  }

  function onStart() {
    if (isFarFromPlace(state, place)) setOverlay('far')
    else begin()
  }

  function openRefuse() {
    setRefuseReason('')
    setOverlay('refuse')
  }

  function refuse() {
    actions.refuseActivity(a.id, refuseReason.trim() || undefined)
    setOverlay(null)
    showToast({
      message: 'Atividade recusada. Ela está em Finalizadas.',
      action: { label: 'Ver finalizadas', onAction: () => nav.goTab({ name: 'activities', tab: 'finalizadas' }) },
    })
    if (nav.canGoBack) nav.back()
    else nav.reset([{ name: 'home' }])
  }

  const progress = getProgress(a, questionnaire)
  const extra = Object.entries(a.extraFields ?? {})

  return (
    <Screen>
      <TopBar
        title="Atividade"
        subtitle={a.code}
      />
      <ScreenBody className="act-detail">
        <header className="act-head">
          <div className="act-head__chips">
            <StatusChip status={a.status} />
            {a.priority && <PriorityChip priority={a.priority} />}
          </div>
          <h2 className="t-h3">{a.title}</h2>
          {a.createdBy && <p className="t-small t-muted">Aberta por {a.createdBy}</p>}
        </header>

        {a.guidance && (
          <div className="act-block">
            <Callout tone="brand" icon={Info} title="Orientações">
              {a.guidance}
            </Callout>
          </div>
        )}

        {finished && (
          <div className="act-block">
            <SyncPendingNotice pending={a.syncPending}>
              O resultado está salvo neste aparelho e será enviado na próxima sincronização.
            </SyncPendingNotice>
          </div>
        )}

        <div className="act-sections">
          {finished && (
            <Section title="Resultado" id={`${uid}-resultado`}>
              <div className="act-panel">
                <DefinitionList items={resultItems(a, questionnaire)} />
              </div>
            </Section>
          )}

          <Section title="Onde" id={`${uid}-onde`}>
            <div className="act-panel">
              <DefinitionList items={placeItems(state, place)} />
            </div>
            {place && (
              <div className="act-section-action">
                <Button variant="secondary" iconStart={Navigation} onClick={() => setOverlay('directions')}>
                  Como chegar
                </Button>
              </div>
            )}
          </Section>

          <Section title="Quando" id={`${uid}-quando`}>
            <div className="act-panel">
              <DefinitionList items={whenItems(a)} />
            </div>
          </Section>

          <Section title="O que fazer" id={`${uid}-oque`}>
            <div className="act-panel">
              <DefinitionList items={whatItems(a, questionnaire)} />
            </div>
          </Section>

          {extra.length > 0 && (
            <Section title="Campos adicionais" id={`${uid}-extra`}>
              <div className="act-panel">
                <DefinitionList
                  items={extra.map(([term, value]) => ({ term, value, icon: TextCursorInput }))}
                />
              </div>
            </Section>
          )}

          <Section title="Responsável" id={`${uid}-resp`}>
            <div className="act-panel">
              <DefinitionList
                items={[
                  a.assignee.type === 'me'
                    ? {
                        term: 'Atribuída a',
                        value: a.fromGroup ? `Você (assumida do grupo ${a.fromGroup})` : 'Você',
                        icon: User,
                      }
                    : a.assignee.type === 'group'
                      ? { term: 'Atribuída a', value: `Grupo ${a.assignee.groupName}`, icon: Users }
                      : { term: 'Atribuída a', value: a.assignee.name, icon: User },
                ]}
              />
            </div>
          </Section>
        </div>
      </ScreenBody>

      {open && (
        <ActionBar
          note={
            a.status !== 'recebida' && progress.total > 0
              ? `${progress.answered} de ${progress.total} respostas preenchidas`
              : undefined
          }
        >
          <Button variant="secondary" onClick={() => setOverlay('more')}>
            Mais ações
          </Button>
          {a.status === 'recebida' ? (
            <Button onClick={onStart}>Iniciar atividade</Button>
          ) : (
            <Button onClick={() => nav.push({ name: 'execute', id: a.id })}>Continuar</Button>
          )}
        </ActionBar>
      )}

      <Sheet open={overlay === 'more'} onClose={close} title="O que você quer fazer?" kicker={a.code}>
        <RowGroup>
          {/* Recusar vale antes de iniciar; improdutiva, depois. A opção que não vale aparece explicada, sem ação. */}
          {a.status === 'recebida' ? (
            <>
              <ListRow
                icon={Ban}
                tone="danger"
                label="Recusar atividade"
                description="Você não vai atender. A atividade vai para Finalizadas e não dá para desfazer."
                onClick={openRefuse}
              />
              <ListRow
                icon={CircleSlash}
                label="Tornar improdutiva"
                description="Disponível depois de iniciar: é para quando você começou e não conseguiu concluir."
              />
            </>
          ) : (
            <>
              <ListRow
                icon={CircleSlash}
                label="Tornar improdutiva"
                description="Você começou, mas não conseguiu concluir. Por exemplo: cliente ausente ou local fechado. Pede motivo, descrição e foto."
                onClick={() => {
                  setOverlay(null)
                  nav.push({ name: 'unproductive', id: a.id })
                }}
              />
              <ListRow
                icon={Ban}
                label="Recusar atividade"
                description="Só antes de iniciar. Depois de começar, use Tornar improdutiva."
              />
            </>
          )}
        </RowGroup>
      </Sheet>

      <Sheet
        open={overlay === 'refuse'}
        onClose={close}
        title="Recusar atividade?"
        kicker={a.code}
        description="A atividade vai para Finalizadas. Não dá para desfazer."
        footer={
          <>
            <Button variant="danger" iconStart={Ban} onClick={refuse}>
              Recusar atividade
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
          </>
        }
      >
        <TextArea
          label="Motivo"
          help="Opcional. Conte por que você não vai atender."
          rows={3}
          value={refuseReason}
          onChange={(e) => setRefuseReason(e.target.value)}
        />
      </Sheet>

      <DirectionsSheet open={overlay === 'directions'} onClose={close} place={place} />

      <Dialog
        open={overlay === 'far'}
        onClose={close}
        tone="warning"
        icon={<Icon icon={MapPinOff} size={24} />}
        title="Você está longe do local"
        actions={
          <>
            <Button onClick={begin}>Iniciar mesmo assim</Button>
            <Button variant="secondary" iconStart={Navigation} onClick={() => setOverlay('directions')}>
              Como chegar
            </Button>
            <Button variant="tertiary" onClick={close}>
              Cancelar
            </Button>
          </>
        }
      >
        {place && (
          <p>
            Você está a {formatDistance(place.distanceKm)} de {place.address}. Se iniciar agora, a execução fica
            registrada fora do local.
          </p>
        )}
      </Dialog>
    </Screen>
  )
}
