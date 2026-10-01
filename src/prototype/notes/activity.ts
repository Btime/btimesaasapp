import type { NotesMap } from './types'

export const activityNotes: NotesMap = {
  activity: {
    summary:
      'Tudo o que a pessoa precisa saber antes de ir para a atividade, e o ponto de partida para iniciar, continuar ou encerrar.',
    changes: [
      'Recusar só aparece antes de iniciar; Tornar improdutiva, depois de iniciar. A opção que não vale aparece explicada, sem ação, para ensinar a diferença.',
      'As orientações de quem abriu a atividade aparecem no topo, em destaque. Antes ficavam escondidas no ícone "i".',
      'Informações organizadas em Onde, Quando, O que fazer e Responsável. "Como chegar" abre o Google Maps ou o Waze.',
      '"Tornar improdutiva" e "Recusar" ficam em "Mais ações". Cada opção explica o que acontece antes da ação: improdutiva é quando você começou e não conseguiu concluir; recusar é quando você não vai atender.',
      'Recusar pede confirmação com botão vermelho e avisa que não dá para desfazer. O motivo é opcional.',
      'Iniciar longe do endereço abre um aviso no meio da tela com a distância e a opção "Como chegar", em vez de uma mensagem confusa.',
      'Atividade finalizada mostra o resultado: data, motivo da recusa ou motivo, descrição e foto da improdutiva. Se ainda falta sincronizar, a tela avisa e oferece "Sincronizar agora".',
      'Depois de recusar, o aviso diz onde a atividade foi parar (Finalizadas) e tem o atalho "Ver".',
    ],
    openQuestions: [
      'Recusar deve pedir motivo obrigatório?',
      '"Tornar improdutiva" deve aparecer para uma atividade que ainda não foi iniciada?',
      'Ao iniciar uma atividade do grupo, ela passa a ser só de quem iniciou?',
      'Iniciar longe do local deve ser sempre permitido ou depende de uma configuração do gestor?',
    ],
  },
  execute: {
    summary: 'Responder o questionário da atividade, vendo o quanto falta e com uma saída clara para pausar.',
    changes: [
      'Botão "Pausar" visível no lugar da seta de voltar. Antes a atividade pausava escondida, ao tocar na seta.',
      'Faixa fixa de progresso: quantas respostas já foram dadas, quantas obrigatórias faltam e o aviso de que tudo fica salvo no aparelho.',
      '"Concluir atividade" fica sempre habilitado. Se faltar resposta obrigatória, a tela marca cada pergunta pendente com o erro em texto e leva até a primeira.',
      'Confirmação curta antes de concluir, dizendo o que muda depois.',
      'Orientações e dados da atividade ficam a um toque, no ícone de informações, sem sair da execução.',
      'O questionário ganhou o visual novo e manteve a estrutura atual. A forma de responder fica para a segunda fase.',
    ],
    openQuestions: [
      'Depois de concluir, quem pode editar as respostas: só o gestor ou também a própria pessoa enquanto não sincroniza?',
      'Pausar deve pedir um motivo?',
    ],
  },
  done: {
    summary: 'Confirma que a atividade foi concluída e diz onde encontrá-la depois.',
    changes: [
      'Nova tela de confirmação. Antes a atividade sumia da lista e o cliente achava que tinha perdido o trabalho.',
      'Diz onde a atividade fica (Atividades, aba Finalizadas) e tem o atalho "Ver finalizadas".',
      'Mostra se a atividade ainda vai ser enviada na próxima sincronização, com "Sincronizar agora".',
      '"Ir para a próxima" abre a próxima atividade para fazer, sem passar pela lista.',
    ],
    openQuestions: ['"Ir para a próxima" deve seguir a ordem de agendamento ou a distância até o local?'],
  },
  unproductive: {
    summary: 'Encerrar uma atividade que começou mas não pôde ser concluída, registrando motivo, descrição e foto.',
    changes: [
      'Explicação no topo do que é improdutiva (você começou e não conseguiu concluir), para não confundir com recusar.',
      'Motivos em lista de toque único. Descrição e foto são obrigatórias e cada campo explica para que serve.',
      'Os erros aparecem ao enviar, em texto, junto do campo, e a tela leva até o primeiro. O botão nunca fica travado sem explicação.',
      'Ao terminar, o aviso diz que a atividade está em Finalizadas e tem o atalho "Ver".',
    ],
    openQuestions: [
      'A improdutiva precisa de assinatura?',
      'A lista de motivos é fixa ou vem da configuração feita na web?',
    ],
  },
}
