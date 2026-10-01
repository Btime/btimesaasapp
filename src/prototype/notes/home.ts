import type { NotesMap } from './types'

export const homeNotes: NotesMap = {
  home: {
    summary: 'Ponto de partida do dia: o que está em andamento, o que falta fazer e o estado da sincronização.',
    changes: [
      'Contadores com nome e explicação: "Minhas abertas" (atribuídas a você e ainda não finalizadas) e "No seu grupo". O nome e o número batem com a aba Minhas e com o selo da barra inferior.',
      'A atividade em andamento ou pausada aparece logo abaixo do topo, com "Continuar" direto. Se houver mais de uma, as outras ficam listadas em "Também em andamento".',
      '"Precisa de ajuda?" saiu dos atalhos e foi para o topo como "Suporte". A área técnica virou "Diagnóstico técnico", no Perfil, para não ser confundida com ajuda.',
      'Atalhos reduzidos a três (Ler QR Code, Nova atividade, Sincronizar), em uma linha.',
      'A faixa colorida de sincronização no topo virou uma linha de status discreta. Erro aparece como aviso com "Ver erro", não "Ver mais".',
      'Próximas atividades em lista vertical, em vez de carrossel lateral. Sem atividades suas, a tela aponta para o grupo quando houver atividades disponíveis lá.',
      'Falha de sincronização aparece como aviso em qualquer tela, com "Ver erro".',
    ],
    openQuestions: ['O contador "Minhas abertas" deve destacar as atrasadas de dias anteriores?'],
  },
}
