import { Info } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { ChoiceList, TextArea, type ChoiceOption } from '../../components/fields'
import { MediaField } from '../../components/MediaField'
import { ActionBar, Callout, EmptyState, Screen, ScreenBody, TopBar } from '../../components/layout'
import { useNav } from '../../nav/nav'
import type { Route } from '../../nav/routes'
import { isFinished, useActivity } from '../../store/selectors'
import { useStore, useToast } from '../../store/store'
import type { Activity, MediaItem } from '../../store/types'
import { focusFieldIn } from './helpers'
import { ActivityClosed, ActivityNotFound } from './parts'
import './activity.css'

const REASONS: ChoiceOption[] = [
  'Cliente ausente',
  'Local fechado ou sem acesso',
  'Falta de material ou equipamento',
  'Condições climáticas',
  'Outro',
].map((label) => ({ value: label, label }))

type FieldKey = 'reason' | 'description' | 'evidence'
const FIELD_ORDER: FieldKey[] = ['reason', 'description', 'evidence']

const ERRORS: Record<FieldKey, string> = {
  reason: 'Escolha um motivo.',
  description: 'Conte o que aconteceu.',
  evidence: 'Adicione uma foto que mostre a situação.',
}

export function Unproductive({ route }: { route: Extract<Route, { name: 'unproductive' }> }) {
  const { actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const { activity } = useActivity(route.id)
  const uid = useId()
  const [reason, setReason] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState<MediaItem[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ field: FieldKey; at: number } | null>(null)
  const fields = useRef<Record<FieldKey, HTMLDivElement | null>>({ reason: null, description: null, evidence: null })
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    if (focusRequest) focusFieldIn(fields.current[focusRequest.field])
  }, [focusRequest])

  if (!activity) return <ActivityNotFound title="Tornar improdutiva" />
  const a: Activity = activity
  if (isFinished(a)) return <ActivityClosed id={a.id} title="Tornar improdutiva" />
  if (a.status === 'recebida') return <NotStarted id={a.id} />

  const invalid: Record<FieldKey, boolean> = {
    reason: !reason,
    description: description.trim().length === 0,
    evidence: evidence.length === 0,
  }
  const errorFor = (key: FieldKey) => (submitted && invalid[key] ? ERRORS[key] : undefined)

  function submit() {
    if (sending) return
    setSubmitted(true)
    const first = FIELD_ORDER.find((key) => invalid[key])
    if (first) {
      setFocusRequest({ field: first, at: Date.now() })
      return
    }
    // O app funciona offline: o resultado é salvo no aparelho na hora, sem espera simulada.
    setSending(true)
    actions.markUnproductive(a.id, { reason: reason ?? '', description: description.trim(), evidence })
    showToast({
      message: 'Atividade marcada como improdutiva. Ela está em Finalizadas.',
      action: { label: 'Ver finalizadas', onAction: () => nav.goTab({ name: 'activities', tab: 'finalizadas' }) },
    })
    nav.reset([nav.stack[0]])
  }

  return (
    <Screen tone="surface">
      <TopBar title="Tornar improdutiva" subtitle={a.title} />
      <ScreenBody>
        <div className="act-form">
          <Callout tone="info" icon={Info}>
            Use quando você começou, mas não conseguiu concluir. A atividade é encerrada como improdutiva e vai para
            Finalizadas.
          </Callout>

          <div
            ref={(el) => {
              fields.current.reason = el
            }}
            className="act-form__field"
          >
            <ChoiceList
              name={`${uid}-motivo`}
              legend="Motivo"
              required
              options={REASONS}
              value={reason}
              onChange={setReason}
              error={errorFor('reason')}
            />
          </div>

          <div
            ref={(el) => {
              fields.current.description = el
            }}
            className="act-form__field"
          >
            <TextArea
              label="Descrição"
              required
              help="Conte o que aconteceu, para quem acompanha a atividade entender o motivo."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errorFor('description')}
            />
          </div>

          <div
            ref={(el) => {
              fields.current.evidence = el
            }}
            className="act-form__field"
          >
            <MediaField
              label="Evidência"
              required
              help="Uma foto que mostre a situação, como a fachada fechada."
              value={evidence}
              onChange={setEvidence}
              error={errorFor('evidence')}
            />
          </div>
        </div>
      </ScreenBody>

      <ActionBar>
        <Button onClick={submit} loading={sending} loadingLabel="Enviando">
          Tornar improdutiva
        </Button>
      </ActionBar>
    </Screen>
  )
}

/** Improdutiva é para quem começou: antes de iniciar, o caminho é recusar. */
function NotStarted({ id }: { id: string }) {
  const nav = useNav()
  return (
    <Screen>
      <TopBar title="Tornar improdutiva" />
      <ScreenBody>
        <EmptyState
          icon={Info}
          title="Disponível depois de iniciar"
          description="Tornar improdutiva é para quando você começou e não conseguiu concluir. Se você não vai atender, recuse a atividade no detalhe."
          action={
            <Button variant="secondary" onClick={() => nav.replace({ name: 'activity', id })}>
              Ver detalhes
            </Button>
          }
        />
      </ScreenBody>
    </Screen>
  )
}
