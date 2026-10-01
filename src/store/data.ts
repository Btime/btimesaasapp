import type { Activity, AppState, Place, Questionnaire, SyncEntity, User } from './types'

/**
 * Dados de demonstração. Nomes de locais e questionários vêm do ambiente de
 * testes mostrado no vídeo do app atual; perguntas e textos são ilustrativos.
 */

export const INSTALLED_VERSION = '1.294.7'
export const AVAILABLE_VERSION = '1.295.0'

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString()
}

export const places: Place[] = [
  { id: 'aracaju', name: 'Aracaju', company: 'btime Soluções LTDA', address: 'Rua Capela, Centro, Aracaju - SE', distanceKm: 2550 },
  { id: 'belem', name: 'Belém', company: 'btime Soluções LTDA', address: 'Rua Boaventura da Silva, Umarizal, Belém - PA', distanceKm: 3148 },
  { id: 'berrini', name: 'Berrini', company: 'btime Soluções LTDA', address: 'Avenida Engenheiro Luís Carlos Berrini, Itaim Bibi, São Paulo - SP', distanceKm: 815 },
  { id: 'cuiaba', name: 'Cuiabá', company: 'btime Soluções LTDA', address: 'Rua São Benedito, Despraiado, Cuiabá - MT', distanceKm: 1652 },
  { id: 'goiania', name: 'Francisca - Goiânia', company: 'btime Soluções LTDA', address: 'R. Francisca Costa Cunha D. Tita, 441, Goiânia - GO', distanceKm: 1464 },
  { id: 'koseritz', name: 'Koseritz', company: 'btime Soluções LTDA', address: 'Rua Carlos Von Koseritz, São João, Porto Alegre - RS', distanceKm: 27 },
  { id: 'blumenau', name: 'Blumenau', company: 'btime Soluções LTDA', address: 'Rua XV de Novembro, Centro, Blumenau - SC', distanceKm: 498 },
  { id: 'beaga', name: 'Beagá', company: 'btime Soluções LTDA', address: 'Avenida Afonso Pena, Centro, Belo Horizonte - MG', distanceKm: 1712 },
  { id: 'benevides', name: 'Benevides', company: 'btime Soluções LTDA', address: 'Rodovia BR-316, Centro, Benevides - PA', distanceKm: 3170 },
  { id: 'boa-vista', name: 'Boa Vista', company: 'btime Soluções LTDA', address: 'Avenida Ville Roy, Centro, Boa Vista - RR', distanceKm: 4985 },
  { id: 'boipeba', name: 'Boipeba', company: 'btime Soluções LTDA', address: 'Rua da Praia, Velha Boipeba, Cairu - BA', distanceKm: 2240 },
]

export const questionnaires: Questionnaire[] = [
  {
    id: 'distrato',
    name: '2. [Distrato] Geração do Documento',
    description: 'Anexe o documento de distrato assinado.',
    questions: [
      { id: 'doc', type: 'media', label: 'Anexar documento', help: 'Foto legível de todas as páginas.', required: true },
      { id: 'assinado', type: 'yesno', label: 'O cliente assinou todas as vias?', required: true },
      { id: 'obs', type: 'text', label: 'Observações', required: false },
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding de Clientes',
    questions: [
      { id: 'responsavel', type: 'text', label: 'Nome do responsável no cliente', required: true },
      { id: 'treinamento', type: 'single', label: 'Como foi o treinamento?', required: true, options: ['Presencial', 'Remoto', 'Não realizado'] },
      { id: 'fotos', type: 'media', label: 'Fotos da implantação', required: false },
    ],
  },
  {
    id: 'contrato',
    name: 'Assinatura de contrato',
    questions: [
      { id: 'contrato', type: 'media', label: 'Contrato assinado', required: true },
      { id: 'vias', type: 'number', label: 'Quantidade de vias', required: true },
    ],
  },
  {
    id: 'chamado-ti',
    name: 'Abertura de chamado de TI',
    questions: [
      { id: 'problema', type: 'single', label: 'Tipo de problema', required: true, options: ['Hardware', 'Rede', 'Sistema', 'Outro'] },
      { id: 'descricao', type: 'text', label: 'Descreva o problema', required: true },
      { id: 'evidencia', type: 'media', label: 'Foto do equipamento', required: false },
    ],
  },
  {
    id: 'entrega',
    name: 'Entrega de material',
    questions: [
      { id: 'recebedor', type: 'text', label: 'Quem recebeu', required: true },
      { id: 'completo', type: 'yesno', label: 'O material foi entregue completo?', required: true },
      { id: 'comprovante', type: 'media', label: 'Comprovante de entrega', required: true },
    ],
  },
  {
    id: 'qualidade',
    name: 'Qualidade',
    questions: [
      { id: 'nota', type: 'single', label: 'Avaliação geral do local', required: true, options: ['Adequado', 'Precisa de ajustes', 'Inadequado'] },
      { id: 'fotos', type: 'media', label: 'Fotos do local', required: true },
      { id: 'obs', type: 'text', label: 'Observações', required: false },
    ],
  },
  {
    id: 'chamado-cameras',
    name: 'Abertura de chamado câmeras',
    questions: [
      { id: 'camera', type: 'text', label: 'Identificação da câmera', required: true },
      { id: 'funcionando', type: 'yesno', label: 'A câmera está gravando?', required: true },
    ],
  },
  {
    id: 'satisfacao',
    name: 'Pesquisa de Satisfação de Implantação',
    questions: [
      { id: 'satisfacao', type: 'single', label: 'Satisfação do cliente', required: true, options: ['Satisfeito', 'Neutro', 'Insatisfeito'] },
      { id: 'comentario', type: 'text', label: 'Comentário', required: false },
    ],
  },
]

export const users: User[] = [
  { id: 'henrique', name: 'Henrique', email: 'henrique.cunha@btime.com.br' },
  { id: 'amanda', name: 'Amanda' },
  { id: 'btime', name: 'btime' },
  { id: 'natalia', name: 'Natália' },
]

const syncLabels = [
  'Atividades',
  'Questionários',
  'Perguntas',
  'Locais/pessoas',
  'Níveis dos locais/pessoas',
  'Configurações de locais/pessoas',
  'Tipos de locais',
  'Ativos',
  'Usuários',
  'Grupos de usuário',
  'Itens no estoque geral',
  'Itens no estoque do local',
  'Itens no estoque do usuário',
  'Bloqueios',
  'Projeto',
  'Segmentações',
  'Visualizações',
  'Campos adicionais',
  'Ativações de QR Codes',
  'Documentos',
]

export function buildSyncEntities(lastSyncAt: string): SyncEntity[] {
  return syncLabels.map((label, i) => ({
    id: `sync-${i}`,
    label,
    lastSyncAt,
    durationSec: (i * 7) % 5,
    status: 'ok' as const,
  }))
}

function buildActivities(): Activity[] {
  return [
    {
      id: 'a1',
      code: '000222/26',
      title: '2. [Distrato] Geração do Documento',
      status: 'pausada',
      placeId: 'aracaju',
      assetName: 'Aracaju',
      description: 'Teste',
      guidance: 'Levar duas vias impressas do distrato. O cliente já está ciente da visita.',
      questionnaireId: 'distrato',
      assignee: { type: 'me' },
      openedAt: at(-16, 15, 14),
      scheduledAt: at(0, 15, 14),
      startedAt: at(0, 10, 32),
      answers: { assinado: true },
      syncPending: false,
      createdBy: 'Julia',
    },
    {
      id: 'a2',
      code: '000138/25',
      title: 'Onboarding de Clientes',
      status: 'recebida',
      placeId: 'belem',
      assetName: 'Belém',
      questionnaireId: 'onboarding',
      assignee: { type: 'me' },
      openedAt: at(-30, 18, 38),
      scheduledAt: at(0, 17, 0),
      answers: {},
      syncPending: false,
    },
    {
      id: 'a3',
      code: '000135/25',
      title: 'Assinatura de contrato',
      status: 'recebida',
      placeId: 'berrini',
      questionnaireId: 'contrato',
      assignee: { type: 'me' },
      openedAt: at(-30, 18, 32),
      scheduledAt: at(1, 9, 30),
      answers: {},
      syncPending: false,
    },
    {
      id: 'a4',
      code: '000141/25',
      title: 'Abertura de chamado de TI',
      status: 'recebida',
      priority: 'alta',
      placeId: 'cuiaba',
      assetName: 'Notebook 0412',
      questionnaireId: 'chamado-ti',
      assignee: { type: 'me' },
      openedAt: at(-2, 18, 45),
      scheduledAt: at(2, 18, 43),
      answers: {},
      syncPending: false,
    },
    {
      id: 'a5',
      code: '1.000113/25',
      title: 'Entrega de material',
      status: 'recebida',
      priority: 'alta',
      placeId: 'goiania',
      questionnaireId: 'entrega',
      assignee: { type: 'group', groupName: 'Equipe btime' },
      openedAt: at(-3, 14, 23),
      scheduledAt: at(0, 14, 36),
      answers: {},
      syncPending: false,
    },
    {
      id: 'a6',
      code: '000107/25',
      title: 'Qualidade',
      status: 'recebida',
      priority: 'media',
      placeId: 'koseritz',
      questionnaireId: 'qualidade',
      assignee: { type: 'group', groupName: 'Equipe btime' },
      openedAt: at(-4, 13, 49),
      scheduledAt: at(3, 13, 49),
      answers: {},
      syncPending: false,
    },
    {
      id: 'a7',
      code: '000150/26',
      title: 'Abertura de chamado câmeras',
      status: 'recebida',
      priority: 'baixa',
      placeId: 'blumenau',
      questionnaireId: 'chamado-cameras',
      assignee: { type: 'group', groupName: 'Equipe btime' },
      openedAt: at(-1, 9, 10),
      answers: {},
      syncPending: false,
    },
    {
      id: 'f1',
      code: '000220/26',
      title: 'Pesquisa de Satisfação de Implantação',
      status: 'concluida',
      placeId: 'aracaju',
      questionnaireId: 'satisfacao',
      assignee: { type: 'me' },
      openedAt: at(-6, 9, 0),
      scheduledAt: at(-1, 10, 0),
      startedAt: at(-1, 10, 5),
      finishedAt: at(-1, 10, 41),
      answers: { satisfacao: 'Satisfeito' },
      syncPending: false,
    },
    {
      id: 'f2',
      code: '000101/25',
      title: 'Onboarding de Clientes',
      status: 'recusada',
      placeId: 'belem',
      questionnaireId: 'onboarding',
      assignee: { type: 'me' },
      openedAt: at(-9, 18, 38),
      scheduledAt: at(-8, 18, 37),
      finishedAt: at(-8, 11, 2),
      answers: {},
      syncPending: false,
      outcome: { kind: 'recusada', reason: 'Fora da minha região de atendimento.' },
    },
  ]
}

export function buildInitialState(): AppState {
  const lastSyncAt = minutesAgo(2)
  return {
    user: {
      id: 'henrique',
      name: 'Henrique',
      email: 'henrique.cunha@btime.com.br',
      environment: 'julia',
      groupName: 'Equipe btime',
    },
    activities: buildActivities(),
    places,
    questionnaires,
    users,
    sync: {
      status: 'idle',
      progress: 0,
      step: '',
      lastSyncAt,
      entities: buildSyncEntities(lastSyncAt),
    },
    prototype: {
      theme: 'light',
      language: 'pt-BR',
      updateAvailable: false,
      syncFails: false,
      nearPlace: false,
      inGroup: true,
      permissions: { assignOthers: true, extraFields: true },
    },
    updateDismissed: false,
    installedVersion: INSTALLED_VERSION,
  }
}
