import type { NotesMap } from './types'

export const activitiesNotes: NotesMap = {
  activities: {
    summary:
      'Todas as atividades em um só lugar, separadas em Minhas, Do grupo e Finalizadas, com busca, ordenação, filtros e uma visão por status.',
    changes: [
      '"Atividades finalizadas" saiu do menu "Mais" e virou aba fixa, com contagem. Quem conclui encontra a atividade ali, com o aviso de que depois de concluir só o gestor pode editar as respostas. Isso responde ao "cliente conclui e acha que a atividade sumiu".',
      'A aba "Do grupo" fica ao lado de "Minhas", com a quantidade disponível, sempre que a pessoa pertence a um grupo. Antes ela ficava escondida.',
      'Visão "Por status", proposta do Henrique para o kanban no celular: as colunas viraram grupos verticais (Recebidas, Em andamento, Pausadas; ou Concluídas, Recusadas, Improdutivas) que recolhem ao tocar no cabeçalho. Grupo vazio fica fechado, com "0" e "Nenhuma".',
      'Ordenar e Filtrar ficam à vista logo abaixo das abas. O botão Filtrar mostra quantos filtros estão ativos ("Filtrar · 2") e os filtros só valem ao tocar em "Aplicar filtros", com a prévia de quantas atividades vão aparecer.',
      'Filtros: visões salvas da web, agendamento (hoje, esta semana, atrasadas, sem agendamento), prioridade (uma ou mais) e local/pessoa com busca.',
      'Busca por título, código, local ou endereço, sem diferenciar acentos nem maiúsculas. Se não houver resultado na aba atual mas houver em outra, a tela avisa e leva até ela.',
      'Ler QR Code no topo da tela e botão "Nova atividade" fixo no canto (Minhas e Do grupo), sem cobrir o último card.',
      'Título, abas e ferramentas ficam fixos no topo; só a lista rola.',
      'Cada lista vazia tem mensagem própria que explica quando as atividades aparecem ali.',
    ],
    openQuestions: [
      '"Esta semana" deve ser a semana do calendário (segunda a domingo, como está no protótipo) ou os próximos 7 dias?',
      'Visões salvas: o app só mostra as visões criadas na web ou a pessoa também deve poder salvar uma visão pelo celular?',
      'A ordenação, os filtros e a visão escolhida (Lista ou Por status) devem ficar salvos de uma sessão para a outra?',
      'Na ordenação por status, a ordem do fluxo (recebidas, em andamento, pausadas) atende ou "em andamento" deve vir primeiro?',
      '"Nova atividade" deve aparecer também na aba Do grupo (como está) ou só em Minhas?',
      'Por quanto tempo as atividades finalizadas continuam visíveis no aparelho?',
    ],
  },
}
