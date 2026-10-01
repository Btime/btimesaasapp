import type { NotesMap } from './types'

export const newNotes: NotesMap = {
  new: {
    summary: 'Abre uma atividade em etapas curtas, mostrando onde a pessoa está e quanto falta.',
    changes: [
      'Indicador de etapas fixo no topo ("Etapa 2 de 4" e uma barra por etapa), como pedido na reunião.',
      'As etapas seguem a permissão do usuário: "Responsável" só aparece para quem pode abrir para outros e "Detalhes" (campos adicionais) só para quem preenche campos adicionais. Sem a permissão, o responsável é o próprio usuário.',
      'Cada etapa tem um título e uma frase que diz o que escolher, com busca que ignora acento e maiúscula nas listas de local/pessoa e de questionário.',
      'Avançar sem escolher não fica bloqueado em silêncio: o botão continua ativo e mostra "Escolha um local/pessoa para continuar." acima da lista.',
      'Fechar com algo já escolhido pede confirmação curta ("Descartar nova atividade?"), com "Continuar editando" como saída segura.',
      'Ao criar para si, a atividade abre direto no detalhe. Ao criar para outra pessoa, o app volta e confirma "Atividade criada para Amanda.".',
      'O endereço em "Detalhes" já vem preenchido com o endereço do local/pessoa escolhido.',
    ],
    openQuestions: [
      'Na web o local/pessoa se chama destino e o questionário às vezes aparece como checklist no app: qual termo usar nos dois?',
      'O responsável deve vir marcado como "você" por padrão quando a pessoa pode abrir para outros?',
      'Abrir para um grupo (e não só para um usuário) também deve ser possível pelo app?',
    ],
  },
  scan: {
    summary: 'Encontra uma atividade pelo QR Code do ativo ou da atividade, com digitação do código como alternativa.',
    changes: [
      'Tela de câmera em fundo escuro, com visor central e uma frase que diz o que apontar.',
      'Lanterna com estado ligado e desligado visível no próprio botão (ícone e fundo), não só pela cor.',
      '"Digitar código" abre uma folha com um campo só; se o código não existir, o erro aparece no campo e explica o que fazer.',
      'No protótipo a câmera é simulada: "Simular leitura" abre a atividade 000138/25 (Onboarding de Clientes).',
    ],
    openQuestions: [
      'Ler QR Code deve abrir direto a execução quando a atividade já está atribuída a mim?',
      'Quando o QR Code é de um ativo com várias atividades abertas, o app mostra uma lista para escolher?',
    ],
  },
}
