import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { resetSession } from '../lib/session'
import { AVAILABLE_VERSION, buildInitialState, buildSyncEntities, INSTALLED_VERSION } from './data'
import type {
  Activity,
  ActivityStatus,
  Answer,
  AppState,
  MediaItem,
  NewActivityDraft,
  PrototypeSettings,
  Toast,
} from './types'

type Action =
  | { type: 'start'; id: string; at: string }
  | { type: 'pause'; id: string }
  | { type: 'answer'; id: string; questionId: string; value: Answer }
  | { type: 'conclude'; id: string; at: string }
  | { type: 'refuse'; id: string; reason?: string; at: string }
  | { type: 'unproductive'; id: string; reason: string; description: string; evidence: MediaItem[]; at: string }
  | { type: 'create'; activity: Activity }
  | { type: 'syncStart' }
  | { type: 'syncProgress'; progress: number; step: string }
  | { type: 'syncDone'; sent: Map<string, Activity>; at: string }
  | { type: 'syncError'; at: string }
  | { type: 'setPrototype'; patch: Partial<PrototypeSettings> }
  | { type: 'setPhoto'; hue: number | undefined }
  | { type: 'dismissUpdate' }
  | { type: 'installUpdate' }
  | { type: 'reset' }

const OPEN: ActivityStatus[] = ['recebida', 'andamento', 'pausada']

/** Aplica fn só se a atividade estiver num dos status permitidos. */
function transition(
  state: AppState,
  id: string,
  from: ActivityStatus[],
  fn: (a: Activity) => Activity,
): AppState {
  let changed = false
  const activities = state.activities.map((a) => {
    if (a.id !== id || !from.includes(a.status)) return a
    changed = true
    return fn(a)
  })
  return changed ? { ...state, activities } : state
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'start':
      return transition(state, action.id, ['recebida', 'pausada'], (a) => ({
        ...a,
        status: 'andamento',
        startedAt: a.startedAt ?? action.at,
        lastTouchedAt: action.at,
        syncPending: true,
        // Iniciar uma atividade do grupo é assumi-la: ela passa a ser sua.
        ...(a.assignee.type === 'group' ? { assignee: { type: 'me' as const }, fromGroup: a.assignee.groupName } : {}),
      }))
    case 'pause':
      return transition(state, action.id, ['andamento'], (a) => ({
        ...a,
        status: 'pausada',
        syncPending: true,
        lastTouchedAt: new Date().toISOString(),
      }))
    case 'answer':
      return transition(state, action.id, OPEN, (a) => ({
        ...a,
        answers: { ...a.answers, [action.questionId]: action.value },
        syncPending: true,
        lastTouchedAt: new Date().toISOString(),
      }))
    case 'conclude':
      return transition(state, action.id, ['andamento', 'pausada'], (a) => ({
        ...a,
        status: 'concluida',
        finishedAt: action.at,
        syncPending: true,
      }))
    case 'refuse':
      // Recusar vale só antes de iniciar; depois de começar, o caminho é a improdutiva.
      return transition(state, action.id, ['recebida'], (a) => ({
        ...a,
        status: 'recusada',
        finishedAt: action.at,
        syncPending: true,
        outcome: { kind: 'recusada', reason: action.reason },
      }))
    case 'unproductive':
      return transition(state, action.id, ['andamento', 'pausada'], (a) => ({
        ...a,
        status: 'improdutiva',
        finishedAt: action.at,
        syncPending: true,
        outcome: {
          kind: 'improdutiva',
          reason: action.reason,
          description: action.description,
          evidence: action.evidence,
        },
      }))
    case 'create':
      return { ...state, activities: [action.activity, ...state.activities] }
    case 'syncStart':
      return { ...state, sync: { ...state.sync, status: 'syncing', progress: 0, step: 'Enviando respostas' } }
    case 'syncProgress':
      return { ...state, sync: { ...state.sync, progress: action.progress, step: action.step } }
    case 'syncDone':
      return {
        ...state,
        // Só marca como enviado o que estava pendente no início e não mudou depois.
        activities: state.activities.map((a) =>
          a.syncPending && action.sent.get(a.id) === a ? { ...a, syncPending: false } : a,
        ),
        sync: {
          status: 'idle',
          progress: 100,
          step: '',
          lastSyncAt: action.at,
          entities: buildSyncEntities(action.at),
        },
      }
    case 'syncError': {
      const entities = buildSyncEntities(action.at).map((e) =>
        e.label === 'Atividades'
          ? {
              ...e,
              status: 'error' as const,
              lastSyncAt: state.sync.lastSyncAt,
              error: {
                code: 'SYNC-409',
                message:
                  'O servidor recusou 1 atividade porque ela foi alterada na web depois da sua última sincronização.',
              },
            }
          : e,
      )
      return { ...state, sync: { ...state.sync, status: 'error', progress: 100, step: '', entities } }
    }
    case 'setPrototype': {
      const next = { ...state, prototype: { ...state.prototype, ...action.patch } }
      // Ligar 'nova versão' no painel simula uma publicação nova: a instalada volta a ser a anterior.
      if (action.patch.updateAvailable && !state.prototype.updateAvailable) {
        return { ...next, installedVersion: INSTALLED_VERSION, updateDismissed: false }
      }
      return next
    }
    case 'setPhoto':
      return { ...state, user: { ...state.user, photoHue: action.hue } }
    case 'dismissUpdate':
      return { ...state, updateDismissed: true }
    case 'installUpdate':
      return {
        ...state,
        installedVersion: AVAILABLE_VERSION,
        updateDismissed: false,
        prototype: { ...state.prototype, updateAvailable: false },
      }
    case 'reset':
      return buildInitialState()
  }
}

const SYNC_STEPS = [
  'Enviando respostas',
  'Sincronizando atividades',
  'Sincronizando questionários',
  'Sincronizando locais/pessoas',
  'Sincronizando ativos',
  'Finalizando',
]

let idSeq = 100
export function makeId(prefix = 'id'): string {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

function nowIso(): string {
  return new Date().toISOString()
}

interface StoreValue {
  state: AppState
  actions: {
    startActivity: (id: string) => void
    pauseActivity: (id: string) => void
    setAnswer: (id: string, questionId: string, value: Answer) => void
    concludeActivity: (id: string) => void
    refuseActivity: (id: string, reason?: string) => void
    markUnproductive: (id: string, data: { reason: string; description: string; evidence: MediaItem[] }) => void
    createActivity: (draft: NewActivityDraft) => Activity
    startSync: () => void
    setPrototype: (patch: Partial<PrototypeSettings>) => void
    setPhoto: (hue: number | undefined) => void
    dismissUpdate: () => void
    /** Simula a instalação da versão nova (a versão instalada muda). */
    installUpdate: () => void
    reset: () => void
  }
}

const StoreContext = createContext<StoreValue | null>(null)

interface ToastValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  /** Segura o aviso enquanto o ponteiro ou o foco estão nele. */
  pauseToast: (id: string) => void
  resumeToast: (id: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

/** Avisos simples: 5 s. Avisos com ação: 10 s (WCAG 2.2.1), pausáveis. */
function toastDuration(toast: Omit<Toast, 'id'>): number {
  return toast.duration ?? (toast.action ? 10_000 : 5_000)
}

function codeNumber(code: string): number {
  const m = /(\d+)\/\d+$/.exec(code)
  return m ? Number(m[1]) : 0
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const syncTimer = useRef<number | null>(null)
  const toastTimers = useRef(new Map<string, { timer: number; remaining: number; startedAt: number }>())
  const codeSeq = useRef(0)
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  const dismissToast = useCallback((id: string) => {
    const t = toastTimers.current.get(id)
    if (t) window.clearTimeout(t.timer)
    toastTimers.current.delete(id)
    setToasts((list) => list.filter((x) => x.id !== id))
  }, [])

  const schedule = useCallback(
    (id: string, ms: number) => {
      const timer = window.setTimeout(() => dismissToast(id), ms)
      toastTimers.current.set(id, { timer, remaining: ms, startedAt: Date.now() })
    },
    [dismissToast],
  )

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = makeId('toast')
      setToasts((list) => {
        // Mantém no máximo dois avisos; o mais antigo sai.
        const keep = list.slice(-1)
        for (const old of list.slice(0, -1)) {
          const t = toastTimers.current.get(old.id)
          if (t) window.clearTimeout(t.timer)
          toastTimers.current.delete(old.id)
        }
        return [...keep, { ...toast, id }]
      })
      schedule(id, toastDuration(toast))
    },
    [schedule],
  )

  const pauseToast = useCallback((id: string) => {
    const t = toastTimers.current.get(id)
    if (!t || t.timer === 0) return
    window.clearTimeout(t.timer)
    toastTimers.current.set(id, { timer: 0, remaining: Math.max(1500, t.remaining - (Date.now() - t.startedAt)), startedAt: 0 })
  }, [])

  const resumeToast = useCallback(
    (id: string) => {
      const t = toastTimers.current.get(id)
      if (!t || t.timer !== 0) return
      schedule(id, t.remaining)
    },
    [schedule],
  )

  useEffect(() => {
    const timers = toastTimers.current
    return () => {
      if (syncTimer.current) window.clearInterval(syncTimer.current)
      timers.forEach((t) => window.clearTimeout(t.timer))
      timers.clear()
    }
  }, [])

  const startSync = useCallback(() => {
    // Trava síncrona: o ref do timer muda na hora, o estado só depois do commit.
    if (syncTimer.current !== null || stateRef.current.sync.status === 'syncing') return
    const sent = new Map(stateRef.current.activities.filter((a) => a.syncPending).map((a) => [a.id, a]))
    dispatch({ type: 'syncStart' })
    let progress = 0
    const id = window.setInterval(() => {
      progress += 7
      if (progress >= 100) {
        window.clearInterval(id)
        if (syncTimer.current === id) syncTimer.current = null
        if (stateRef.current.prototype.syncFails) {
          dispatch({ type: 'syncError', at: nowIso() })
        } else {
          dispatch({ type: 'syncDone', sent, at: nowIso() })
          showToast({ message: 'Tudo sincronizado.', tone: 'success' })
        }
        return
      }
      const step = SYNC_STEPS[Math.min(SYNC_STEPS.length - 1, Math.floor((progress / 100) * SYNC_STEPS.length))]
      dispatch({ type: 'syncProgress', progress, step })
    }, 180)
    syncTimer.current = id
  }, [showToast])

  const actions = useMemo<StoreValue['actions']>(
    () => ({
      startActivity: (id) => dispatch({ type: 'start', id, at: nowIso() }),
      pauseActivity: (id) => dispatch({ type: 'pause', id }),
      setAnswer: (id, questionId, value) => dispatch({ type: 'answer', id, questionId, value }),
      concludeActivity: (id) => dispatch({ type: 'conclude', id, at: nowIso() }),
      refuseActivity: (id, reason) => dispatch({ type: 'refuse', id, reason, at: nowIso() }),
      markUnproductive: (id, data) => dispatch({ type: 'unproductive', id, ...data, at: nowIso() }),
      createActivity: (draft) => {
        const s = stateRef.current
        const questionnaire = s.questionnaires.find((q) => q.id === draft.questionnaireId)
        const forMe = draft.assigneeUserId === s.user.id
        const assignee = s.users.find((u) => u.id === draft.assigneeUserId)
        // Contador monotônico a partir do maior código existente: não repete.
        if (codeSeq.current === 0) codeSeq.current = Math.max(0, ...s.activities.map((a) => codeNumber(a.code)))
        codeSeq.current += 1
        const year = String(new Date().getFullYear()).slice(-2)
        const activity: Activity = {
          id: makeId('nova'),
          code: `${String(codeSeq.current).padStart(6, '0')}/${year}`,
          title: questionnaire?.name ?? 'Nova atividade',
          status: 'recebida',
          placeId: draft.placeId,
          description: draft.description,
          questionnaireId: draft.questionnaireId,
          assignee: forMe ? { type: 'me' } : { type: 'other', name: assignee?.name ?? 'outra pessoa' },
          assignedTo: forMe ? undefined : assignee?.name,
          openedAt: nowIso(),
          scheduledAt: draft.scheduledAt,
          answers: {},
          syncPending: true,
          createdBy: s.user.name,
          // O endereço só vira campo adicional quando é diferente do endereço do local (evita duplicar no detalhe).
          extraFields:
            draft.address?.trim() && draft.address.trim() !== s.places.find((p) => p.id === draft.placeId)?.address
              ? { 'Endereço complementar': draft.address.trim() }
              : undefined,
        }
        // Sempre fica salva no aparelho até o envio (conta como pendente), mesmo quando é para outra pessoa.
        dispatch({ type: 'create', activity })
        return activity
      },
      startSync,
      setPrototype: (patch) => dispatch({ type: 'setPrototype', patch }),
      setPhoto: (hue) => dispatch({ type: 'setPhoto', hue }),
      dismissUpdate: () => dispatch({ type: 'dismissUpdate' }),
      installUpdate: () => dispatch({ type: 'installUpdate' }),
      reset: () => {
        if (syncTimer.current) window.clearInterval(syncTimer.current)
        syncTimer.current = null
        codeSeq.current = 0
        toastTimers.current.forEach((t) => window.clearTimeout(t.timer))
        toastTimers.current.clear()
        setToasts([])
        resetSession()
        dispatch({ type: 'reset' })
      },
    }),
    [startSync],
  )

  const storeValue = useMemo(() => ({ state, actions }), [state, actions])
  const toastValue = useMemo(
    () => ({ toasts, showToast, dismissToast, pauseToast, resumeToast }),
    [toasts, showToast, dismissToast, pauseToast, resumeToast],
  )

  return (
    <StoreContext.Provider value={storeValue}>
      <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
    </StoreContext.Provider>
  )
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore precisa de StoreProvider')
  return ctx
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa de StoreProvider')
  return ctx
}
