import {
  Building2,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  ClipboardList,
  HardDrive,
  Info,
  MapPin,
  Pause,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button, IconButton } from '../../components/Button'
import { ChoiceList, TextArea, TextField, type ChoiceOption } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { MediaField } from '../../components/MediaField'
import {
  ActionBar,
  Callout,
  DefinitionList,
  EmptyState,
  ListRow,
  ProgressBar,
  RowGroup,
  Screen,
  ScreenBody,
  TopBar,
} from '../../components/layout'
import { Dialog, Sheet } from '../../components/overlay'
import { formatFull, plural } from '../../lib/format'
import { useNav } from '../../nav/nav'
import type { Route } from '../../nav/routes'
import { getProgress, isAnswered, isFinished, useActivity } from '../../store/selectors'
import { useStore, useToast } from '../../store/store'
import type { Activity, Answer, Question } from '../../store/types'
import { focusFieldIn, missingRequiredNote, pendingRequiredLabel } from './helpers'
import { ActivityClosed, ActivityNotFound } from './parts'
import './activity.css'

const YES_NO: ChoiceOption[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

const REQUIRED_ERROR = 'Responda esta pergunta para concluir.'

/** Um campo por tipo de pergunta. Estrutura simples: o questionário completo fica para a segunda fase. */
function QuestionField({
  question: q,
  name,
  value,
  error,
  onChange,
}: {
  question: Question
  name: string
  value: Answer | undefined
  error?: string
  onChange: (value: Answer) => void
}) {
  switch (q.type) {
    case 'media':
      return (
        <MediaField
          label={q.label}
          help={q.help}
          required={q.required}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          error={error}
        />
      )
    case 'text':
      return (
        <TextArea
          label={q.label}
          help={q.help}
          required={q.required}
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )
    case 'number':
      return (
        <TextField
          label={q.label}
          help={q.help}
          required={q.required}
          inputMode="numeric"
          autoComplete="off"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          error={error}
        />
      )
    case 'single':
      return (
        <ChoiceList
          name={name}
          legend={q.label}
          required={q.required}
          options={(q.options ?? []).map((o) => ({ value: o, label: o }))}
          value={typeof value === 'string' ? value : null}
          onChange={onChange}
          error={error}
        />
      )
    case 'yesno':
      return (
        <ChoiceList
          name={name}
          legend={q.label}
          required={q.required}
          options={YES_NO}
          value={value === true ? 'sim' : value === false ? 'nao' : null}
          onChange={(v) => onChange(v === 'sim')}
          error={error}
        />
      )
  }
}

export function Execute({ route }: { route: Extract<Route, { name: 'execute' }> }) {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const { activity, place, questionnaire } = useActivity(route.id)
  const uid = useId()
  const [overlay, setOverlay] = useState<'info' | 'confirm' | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ questionId: string; at: number } | null>(null)
  const blocks = useRef<Record<string, HTMLDivElement | null>>({})

  // Ao abrir a execução, a atividade recebida ou pausada passa a "Em andamento" (só uma vez).
  const status = activity?.status
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !status) return
    started.current = true
    if (status === 'recebida' || status === 'pausada') actions.startActivity(route.id)
  }, [status, actions, route.id])

  // Depois de mostrar os erros, leva até a primeira pergunta pendente.
  useEffect(() => {
    if (focusRequest) focusFieldIn(blocks.current[focusRequest.questionId] ?? null)
  }, [focusRequest])

  if (!activity) return <ActivityNotFound title="Execução" />
  const a: Activity = activity
  if (isFinished(a)) return <ActivityClosed id={a.id} title={a.title} />

  const questions = questionnaire?.questions ?? []
  const progress = getProgress(a, questionnaire)
  const pct = progress.total ? (progress.answered / progress.total) * 100 : 0
  const close = () => setOverlay(null)

  function pause() {
    actions.pauseActivity(a.id)
    showToast({ message: 'Atividade pausada. Suas respostas ficam salvas.' })
    if (nav.canGoBack) nav.back()
    else nav.reset([{ name: 'home' }])
  }

  function onConclude() {
    if (!questionnaire) {
      showToast({ tone: 'error', message: 'Sincronize para receber o questionário antes de concluir.' })
      return
    }
    const firstMissing = questions.find((q) => q.required && !isAnswered(q, a.answers[q.id]))
    if (firstMissing) {
      setShowErrors(true)
      setFocusRequest({ questionId: firstMissing.id, at: Date.now() })
      return
    }
    setOverlay('confirm')
  }

  function conclude() {
    actions.concludeActivity(a.id)
    setOverlay(null)
    nav.replace({ name: 'done', id: a.id })
  }

  return (
    <Screen>
      <TopBar
        title={a.title}
        subtitle={place ? `${a.code} · ${place.name}` : a.code}
        leading={
          <Button variant="secondary" size="sm" iconStart={Pause} onClick={pause}>
            Pausar
          </Button>
        }
        actions={<IconButton icon={Info} label="Detalhes da atividade" onClick={() => setOverlay('info')} />}
      />

      <div className="act-exec__status">
        <ProgressBar value={pct} label="Respostas preenchidas" />
        <div className="act-exec__counts">
          <p className="t-caption t-tabular">
            {progress.answered} de {progress.total} respostas
            {progress.requiredMissing > 0 && (
              <span className="t-muted"> · {pendingRequiredLabel(progress.requiredMissing)}</span>
            )}
          </p>
          <p className="act-exec__saved t-caption t-muted">
            <Icon icon={HardDrive} size={14} />
            Respostas salvas no aparelho
          </p>
        </div>
      </div>

      <ScreenBody className="act-exec">
        {questionnaire && (
          <div className="act-exec__intro">
            <p className="t-kicker t-muted">{questionnaire.name}</p>
            {questionnaire.description && <p className="t-small t-muted">{questionnaire.description}</p>}
          </div>
        )}
        {questions.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={questionnaire ? 'Esta atividade não tem perguntas' : 'O questionário ainda não chegou'}
            description={
              questionnaire
                ? 'Você pode concluir a atividade direto.'
                : 'Sincronize para receber o questionário antes de concluir.'
            }
            action={
              !questionnaire && (
                <Button
                  variant="secondary"
                  loading={state.sync.status === 'syncing'}
                  loadingLabel="Sincronizando"
                  onClick={actions.startSync}
                >
                  Sincronizar agora
                </Button>
              )
            }
          />
        )}
        <div className="act-questions">
          {questions.map((q) => {
            const value = a.answers[q.id]
            const missing = showErrors && q.required && !isAnswered(q, value)
            return (
              <div
                key={q.id}
                ref={(el) => {
                  blocks.current[q.id] = el
                }}
                className={missing ? 'act-question is-invalid' : 'act-question'}
              >
                <QuestionField
                  question={q}
                  name={`${uid}-${q.id}`}
                  value={value}
                  error={missing ? REQUIRED_ERROR : undefined}
                  onChange={(v) => actions.setAnswer(a.id, q.id, v)}
                />
              </div>
            )
          })}
        </div>
      </ScreenBody>

      <ActionBar
        note={
          progress.requiredMissing > 0 ? (
            <>
              <Icon icon={CircleAlert} size={16} />
              {missingRequiredNote(progress.requiredMissing)}
            </>
          ) : undefined
        }
      >
        <Button onClick={onConclude}>Concluir atividade</Button>
      </ActionBar>

      <Sheet open={overlay === 'info'} onClose={close} title="Detalhes da atividade" kicker={a.code}>
        <div className="act-sheet-stack">
          {a.guidance && (
            <Callout tone="brand" icon={Info} title="Orientações">
              {a.guidance}
            </Callout>
          )}
          <DefinitionList
            items={[
              {
                term: 'Local/pessoa',
                value: place ? `${place.name} · ${place.company}` : 'Não informado',
                icon: Building2,
              },
              ...(place ? [{ term: 'Endereço', value: place.address, icon: MapPin }] : []),
              {
                term: 'Agendada para',
                value: a.scheduledAt ? formatFull(a.scheduledAt) : 'Sem agendamento',
                icon: CalendarClock,
              },
              {
                term: 'Questionário',
                value: questionnaire
                  ? `${questionnaire.name} · ${plural(questionnaire.questions.length, 'pergunta', 'perguntas')}`
                  : 'Não informado',
                icon: ClipboardList,
              },
            ]}
          />
          {/* Sair pela improdutiva sem passar por uma pausa que a pessoa não quis. */}
          <RowGroup>
            <ListRow
              icon={CircleSlash}
              label="Tornar improdutiva"
              description="Você começou, mas não vai conseguir concluir. Pede motivo, descrição e foto."
              onClick={() => {
                setOverlay(null)
                nav.push({ name: 'unproductive', id: a.id })
              }}
            />
          </RowGroup>
        </div>
      </Sheet>

      <Dialog
        open={overlay === 'confirm'}
        onClose={close}
        icon={<Icon icon={CircleCheck} size={24} />}
        title="Concluir atividade?"
        actions={
          <>
            <Button onClick={conclude}>Concluir</Button>
            <Button variant="secondary" onClick={close}>
              Revisar respostas
            </Button>
          </>
        }
      >
        <p>Depois de concluir, só o gestor pode editar as respostas.</p>
      </Dialog>
    </Screen>
  )
}
