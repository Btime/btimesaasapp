export type ActivityStatus =
  | 'recebida'
  | 'andamento'
  | 'pausada'
  | 'concluida'
  | 'recusada'
  | 'improdutiva'

export type Priority = 'alta' | 'media' | 'baixa'

export type QuestionType = 'media' | 'text' | 'single' | 'yesno' | 'number'

export interface Question {
  id: string
  type: QuestionType
  label: string
  help?: string
  required: boolean
  options?: string[]
}

export interface Questionnaire {
  id: string
  name: string
  description?: string
  questions: Question[]
}

/** Local/pessoa. Na web o mesmo conceito se chama "destino". */
export interface Place {
  id: string
  name: string
  company: string
  address: string
  distanceKm: number
}

export interface User {
  id: string
  name: string
  email?: string
}

/** Foto simulada: o protótipo não acessa a câmera, gera uma miniatura. */
export interface MediaItem {
  id: string
  hue: number
  name: string
}

export type Answer = string | boolean | MediaItem[] | null

export type Assignee =
  | { type: 'me' }
  | { type: 'group'; groupName: string }
  /** Aberta por mim para outra pessoa: fica no aparelho só até ser enviada. */
  | { type: 'other'; name: string }

export type Outcome =
  | { kind: 'recusada'; reason?: string }
  | { kind: 'improdutiva'; reason: string; description: string; evidence: MediaItem[] }

export interface Activity {
  id: string
  code: string
  title: string
  status: ActivityStatus
  priority?: Priority
  placeId: string
  assetName?: string
  description?: string
  /** Orientações de quem abriu a atividade. */
  guidance?: string
  questionnaireId: string
  assignee: Assignee
  openedAt: string
  scheduledAt?: string
  startedAt?: string
  finishedAt?: string
  answers: Record<string, Answer>
  syncPending: boolean
  outcome?: Outcome
  createdBy?: string
  /** Nome do responsável quando a atividade foi aberta para outra pessoa. */
  assignedTo?: string
  /** Grupo de origem, quando a pessoa assumiu uma atividade do grupo ao iniciar. */
  fromGroup?: string
  /** Última interação (iniciar, pausar, responder): define o destaque 'Continue de onde parou'. */
  lastTouchedAt?: string
  extraFields?: Record<string, string>
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type Language = 'pt-BR' | 'en' | 'es'

export interface PrototypeSettings {
  theme: ThemePreference
  language: Language
  /** Simula uma versão nova publicada na loja. */
  updateAvailable: boolean
  /** A próxima sincronização falha em um item. */
  syncFails: boolean
  /** O GPS informa que a pessoa está no endereço da atividade. */
  nearPlace: boolean
  /** O usuário pertence a um grupo (habilita a aba "Do grupo"). */
  inGroup: boolean
  permissions: {
    /** Pode abrir atividade para outros usuários. */
    assignOthers: boolean
    /** Preenche campos adicionais ao abrir atividade. */
    extraFields: boolean
  }
}

export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface SyncEntity {
  id: string
  label: string
  lastSyncAt: string
  durationSec: number
  status: 'ok' | 'error'
  error?: { code: string; message: string }
}

export interface SyncState {
  status: SyncStatus
  progress: number
  step: string
  lastSyncAt: string
  entities: SyncEntity[]
}

export interface Toast {
  id: string
  message: string
  tone?: 'neutral' | 'success' | 'error'
  action?: { label: string; onAction: () => void }
  /** Tempo na tela em ms (padrão 5 s; 10 s com ação). */
  duration?: number
}

export interface AppState {
  user: User & { environment: string; groupName: string; photoHue?: number }
  activities: Activity[]
  places: Place[]
  questionnaires: Questionnaire[]
  users: User[]
  sync: SyncState
  prototype: PrototypeSettings
  /** O aviso de atualização já foi dispensado nesta sessão. */
  updateDismissed: boolean
  /** Versão do app instalada no aparelho. */
  installedVersion: string
}

export interface NewActivityDraft {
  placeId: string
  questionnaireId: string
  assigneeUserId: string
  scheduledAt?: string
  address?: string
  description?: string
}
