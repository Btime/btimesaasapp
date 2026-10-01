import { ClipboardList, MapPin, MapPinOff, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BrandIcon } from '../../components/BrandIcon'
import { Button, IconButton } from '../../components/Button'
import { TextArea, TextField } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { ActionBar, Avatar, Screen, ScreenBody, Stepper, TopBar } from '../../components/layout'
import { Dialog } from '../../components/overlay'
import { plural } from '../../lib/format'
import { useNav } from '../../nav/nav'
import { getPlace, getQuestionnaire } from '../../store/selectors'
import { useStore, useToast } from '../../store/store'
import type { NewActivityDraft } from '../../store/types'
import { PickStep, type PickOption } from './PickStep'
import './new.css'

type StepKey = 'place' | 'questionnaire' | 'assignee' | 'details'

interface StepDef {
  key: StepKey
  /** Rótulo curto no indicador de etapas. */
  label: string
  title: string
  support: string
}

const STEPS: Record<StepKey, StepDef> = {
  place: {
    key: 'place',
    label: 'Local/pessoa',
    title: 'Escolha o local/pessoa',
    support: 'Onde a atividade vai acontecer.',
  },
  questionnaire: {
    key: 'questionnaire',
    label: 'Questionário',
    title: 'Escolha o questionário',
    support: 'O que vai ser feito no local.',
  },
  assignee: {
    key: 'assignee',
    label: 'Responsável',
    title: 'Escolha o responsável',
    support: 'Quem vai executar.',
  },
  details: {
    key: 'details',
    label: 'Detalhes',
    title: 'Adicione detalhes',
    support: 'Informações adicionais da atividade.',
  },
}

const REQUIRED_MESSAGE: Partial<Record<StepKey, string>> = {
  place: 'Escolha um local/pessoa para continuar.',
  questionnaire: 'Escolha um questionário para continuar.',
  assignee: 'Escolha o responsável para continuar.',
}

const CREATE_DELAY_MS = 700

/** "2026-10-01T14:30" (horário local) para ISO; vazio ou inválido vira undefined. */
function localToIso(value: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** Espera o React aplicar a etapa nova antes de mexer em rolagem e foco. */
function afterRender(fn: () => void) {
  requestAnimationFrame(fn)
}

export function NewActivity() {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const me = state.user
  const { assignOthers, extraFields } = state.prototype.permissions

  // As etapas dependem da permissão e podem mudar com a tela aberta.
  const steps: StepDef[] = [
    STEPS.place,
    STEPS.questionnaire,
    ...(assignOthers ? [STEPS.assignee] : []),
    ...(extraFields ? [STEPS.details] : []),
  ]

  // Guarda a etapa pela chave; se ela sumir, usa o índice preso ao total.
  const [cursor, setCursor] = useState<{ key: StepKey; index: number }>({ key: 'place', index: 0 })
  const found = steps.findIndex((s) => s.key === cursor.key)
  const current = found >= 0 ? found : Math.min(cursor.index, steps.length - 1)
  const step = steps[current]
  const isLast = current === steps.length - 1

  const [placeId, setPlaceId] = useState<string | null>(null)
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState<string>(me.id)
  const [scheduledAt, setScheduledAt] = useState('')
  /** null = ainda não editado; usa o endereço do local escolhido. */
  const [address, setAddress] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Partial<Record<StepKey, string>>>({})
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [creating, setCreating] = useState(false)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const place = placeId ? getPlace(state, placeId) : undefined
  const questionnaire = questionnaireId ? getQuestionnaire(state, questionnaireId) : undefined
  const addressValue = address ?? place?.address ?? ''
  // Sem permissão para atribuir a outros, o responsável é sempre quem está criando.
  const effectiveAssignee = assignOthers ? assigneeId : me.id

  const hasChoice =
    placeId !== null ||
    questionnaireId !== null ||
    assigneeId !== me.id ||
    scheduledAt !== '' ||
    address !== null ||
    description.trim() !== ''

  function isMissing(key: StepKey): boolean {
    if (key === 'place') return !place
    if (key === 'questionnaire') return !questionnaire
    if (key === 'assignee') return !state.users.some((u) => u.id === effectiveAssignee)
    return false
  }

  function clearError(key: StepKey) {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  }

  function scrollBodyToTop() {
    titleRef.current?.closest('.screen__body')?.scrollTo({ top: 0 })
  }

  /** Momento da última troca de etapa: evita que um toque duplo em Avançar pule a última etapa. */
  const lastStepChange = useRef(0)

  function goTo(index: number) {
    lastStepChange.current = performance.now()
    setCursor({ key: steps[index].key, index })
    afterRender(() => {
      scrollBodyToTop()
      titleRef.current?.focus({ preventScroll: true })
    })
  }

  function showError(key: StepKey) {
    setErrors((e) => ({ ...e, [key]: REQUIRED_MESSAGE[key] }))
    afterRender(() => {
      const root = stepRef.current
      scrollBodyToTop()
      const target =
        root?.querySelector<HTMLElement>('input[type="radio"]:not(:disabled)') ??
        root?.querySelector<HTMLElement>('input[type="search"]')
      target?.focus({ preventScroll: true })
    })
  }

  function create() {
    if (!place || !questionnaire) return
    setCreating(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      const draft: NewActivityDraft = {
        placeId: place.id,
        questionnaireId: questionnaire.id,
        assigneeUserId: effectiveAssignee,
        ...(extraFields
          ? {
              scheduledAt: localToIso(scheduledAt),
              address: addressValue.trim() || undefined,
              description: description.trim() || undefined,
            }
          : {}),
      }
      const nova = actions.createActivity(draft)
      if (effectiveAssignee === me.id) {
        showToast({ message: 'Atividade criada.', tone: 'success' })
        nav.replace({ name: 'activity', id: nova.id })
      } else {
        const who = state.users.find((u) => u.id === effectiveAssignee)?.name ?? 'outra pessoa'
        showToast({ message: `Atividade criada para ${who}.`, tone: 'success' })
        nav.back()
      }
    }, CREATE_DELAY_MS)
  }

  function onNext() {
    if (creating) return
    if (performance.now() - lastStepChange.current < 400) return
    if (isMissing(step.key)) {
      showError(step.key)
      return
    }
    if (!isLast) {
      goTo(current + 1)
      return
    }
    // Última etapa: confere tudo (uma permissão pode ter mudado no caminho).
    const firstMissing = steps.findIndex((s) => isMissing(s.key))
    if (firstMissing >= 0) {
      goTo(firstMissing)
      showError(steps[firstMissing].key)
      return
    }
    create()
  }

  function onPrev() {
    if (creating || current === 0) return
    goTo(current - 1)
  }

  function onClose() {
    if (creating) return
    if (hasChoice) setConfirmDiscard(true)
    else nav.back()
  }

  const placeOptions: PickOption[] = state.places.map((p) => ({
    value: p.id,
    label: p.name,
    description: `${p.company} · ${p.address}`,
    searchText: `${p.name} ${p.company} ${p.address}`,
    leading: (
      <span className="new-glyph">
        <Icon icon={MapPin} size={20} />
      </span>
    ),
  }))

  const questionnaireOptions: PickOption[] = state.questionnaires.map((q) => ({
    value: q.id,
    label: q.name,
    description: plural(q.questions.length, 'pergunta', 'perguntas'),
    leading: (
      <span className="new-glyph">
        <BrandIcon name="documento" size={20} />
      </span>
    ),
  }))

  const others = state.users.filter((u) => u.id !== me.id)
  const assigneeOptions: PickOption[] = [
    {
      value: me.id,
      label: `${me.name} (você)`,
      leading: <Avatar name={me.name} size={32} hue={me.photoHue} />,
    },
    ...others.map((u) => ({
      value: u.id,
      label: u.name,
      leading: <Avatar name={u.name} size={32} />,
    })),
  ]

  return (
    <Screen className="new-screen">
      <TopBar
        title="Nova atividade"
        leading={<IconButton icon={X} label="Cancelar nova atividade" onClick={onClose} disabled={creating} />}
      />
      <div className="new-progress">
        <Stepper steps={steps.map((s) => s.label)} current={current} />
      </div>

      <ScreenBody>
        <div className="new-step" ref={stepRef}>
          <header className="new-step__head">
            <h2 ref={titleRef} tabIndex={-1} className="t-title new-step__title">
              <span className="visually-hidden">
                Etapa {current + 1} de {steps.length}.{' '}
              </span>
              {step.title}
            </h2>
            <p className="t-body t-muted">{step.support}</p>
          </header>

          {step.key === 'place' && (
            <PickStep
              key="place"
              name="new-place"
              legend="Local/pessoa"
              options={placeOptions}
              value={placeId}
              onChange={(v) => {
                setPlaceId(v)
                clearError('place')
              }}
              error={errors.place}
              search={{
                label: 'Buscar local/pessoa',
                placeholder: 'Nome, empresa ou endereço',
                emptyTitle: 'Nenhum local/pessoa encontrado',
                emptyDescription: 'Confira a grafia ou busque por outro nome, empresa ou endereço.',
              }}
              empty={{
                icon: MapPinOff,
                title: 'Nenhum local/pessoa disponível',
                description: 'Sincronize o app para receber a lista atualizada.',
              }}
            />
          )}

          {step.key === 'questionnaire' && (
            <PickStep
              key="questionnaire"
              name="new-questionnaire"
              legend="Questionário"
              options={questionnaireOptions}
              value={questionnaireId}
              onChange={(v) => {
                setQuestionnaireId(v)
                clearError('questionnaire')
              }}
              error={errors.questionnaire}
              search={{
                label: 'Buscar questionário',
                placeholder: 'Buscar questionário',
                emptyTitle: 'Nenhum questionário encontrado',
                emptyDescription: 'Confira a grafia ou busque por outro nome.',
              }}
              empty={{
                icon: ClipboardList,
                title: 'Nenhum questionário disponível',
                description: 'Sincronize o app para receber a lista atualizada.',
              }}
            />
          )}

          {step.key === 'assignee' && (
            <PickStep
              key="assignee"
              name="new-assignee"
              legend="Responsável"
              options={assigneeOptions}
              value={assigneeId}
              onChange={(v) => {
                setAssigneeId(v)
                clearError('assignee')
              }}
              error={errors.assignee}
              empty={{
                icon: Users,
                title: 'Nenhum usuário disponível',
                description: 'Sincronize o app para receber a lista atualizada.',
              }}
            />
          )}

          {step.key === 'details' && (
            <div className="new-fields">
              <TextField
                label="Data de agendamento"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <TextField
                label="Endereço complementar"
                value={addressValue}
                onChange={(e) => setAddress(e.target.value)}
                help={place ? 'Começa com o endereço do local/pessoa. A rota continua usando o endereço do local; use este campo para um complemento.' : undefined}
                autoComplete="off"
              />
              <TextArea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          )}
        </div>
      </ScreenBody>

      <ActionBar>
        {current > 0 && (
          <Button variant="secondary" onClick={onPrev} disabled={creating}>
            Voltar
          </Button>
        )}
        <Button onClick={onNext} loading={creating} loadingLabel="Criando">
          {isLast ? 'Criar atividade' : 'Avançar'}
        </Button>
      </ActionBar>

      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        tone="danger"
        title="Descartar nova atividade?"
        actions={
          <>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDiscard(false)
                nav.back()
              }}
            >
              Descartar
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
              Continuar editando
            </Button>
          </>
        }
      >
        <p>O que você escolheu até aqui não será salvo.</p>
      </Dialog>
    </Screen>
  )
}
