import type { NotesMap } from './types'

export const profileNotes: NotesMap = {
  profile: {
    summary: 'Quem está usando o app, as preferências da conta, o caminho para ajuda e a saída da conta, tudo em uma aba.',
    changes: [
      'Sair da conta saiu do menu "Mais" e ficou visível no Perfil, em vermelho e separado do resto.',
      'Antes de sair, o app avisa se há alterações que ainda não foram enviadas e oferece "Sincronizar agora". Sem pendências, a confirmação explica como entrar de novo.',
      'Foto, idioma e redefinir senha agora estão no Perfil, como pedido na reunião.',
      'Trocar de ambiente não existe: o ambiente atual aparece com o texto "Para usar outro ambiente, saia e entre de novo." em vez de prometer a função.',
      '"Configurações" virou "Ajuda e diagnóstico", com a descrição "Abra quando o suporte pedir", porque é uma área técnica.',
      'Aparência (claro, escuro ou do aparelho) fica junto das preferências da conta.',
    ],
    openQuestions: [
      'A foto do perfil aparece para outras pessoas (gestor na web, grupo) ou só no aparelho?',
      'Quais idiomas o app vai oferecer de fato no lançamento?',
    ],
  },
  diagnostics: {
    summary: 'Área técnica para o suporte: sincronização, versão, dados locais e GPS, com um botão para copiar tudo de uma vez.',
    changes: [
      'O nome "Configurações" foi trocado por "Ajuda e diagnóstico" e a tela explica que só precisa ser aberta quando a btime pedir.',
      'Cada linha mostra o estado atual em texto (ex.: "Última há 2 min", "Falhou em 1 item"), sem precisar abrir.',
      '"Copiar informações para o suporte" junta versão, ambiente, última sincronização e pendências em um texto pronto para colar.',
    ],
    openQuestions: ['Quais dados técnicos o suporte mais pede em print?'],
  },
  sync: {
    summary: 'Lugar único da sincronização detalhada: estado, itens, erro com código e o que fazer.',
    changes: [
      'A sincronização deixou de estar duplicada: a Início mostra só uma linha de status e o mesmo botão; os detalhes ficam aqui.',
      'O erro aparece explicado, com o código e o próximo passo ("Sincronizar de novo" ou "Enviar ao suporte"). A Início leva para cá com "Ver erro", não "Ver mais".',
      '"Enviar ao suporte" abre a conversa já com o código e a mensagem do erro no campo.',
      'O número de alterações aguardando envio aparece sempre que houver pendências.',
      'Cada item mostra quando sincronizou, quanto tempo levou e o estado com ícone e texto, não só cor.',
    ],
    openQuestions: [
      'O suporte precisa ver todos os itens da lista ou só os que falharam?',
      'Um erro deve ser reenviado sozinho quando a internet voltar?',
    ],
  },
  appVersion: {
    summary: 'Mostra a versão instalada e, quando há uma nova, o botão para atualizar pela loja.',
    changes: [
      'A faixa de atualização virou um aviso no meio da tela (UpdateDialog). Se a pessoa toca em "Agora não", o aviso continua acessível aqui e na Início.',
      'Sem versão nova, a tela confirma "Você está na versão mais recente."',
    ],
    openQuestions: ["O aviso de atualização deve bloquear o uso (sem 'Agora não') a partir de alguma versão?"],
  },
  localData: {
    summary: 'Registros salvos no aparelho para funcionar sem internet, com o JSON bruto para o suporte.',
    changes: [
      'Contagens vêm dos dados reais do app. Itens sem contagem conhecida mostram só o nome, sem número inventado.',
      'Tocar em um item abre o JSON em uma folha com rolagem própria e botão "Copiar". As linhas longas quebram para caber inteiras em um print.',
    ],
    openQuestions: [
      'Quais dados técnicos o suporte mais pede em print?',
      'O JSON pode mostrar dados pessoais de clientes (endereços, nomes) ou precisa ser mascarado?',
    ],
  },
  location: {
    summary: 'Explica por que o app usa o GPS e mostra a permissão atual.',
    changes: [
      'Texto simples: o GPS confere se a pessoa está no endereço para iniciar e só liga quando precisa.',
      'Permissão mostrada com ícone e texto ("Permitida durante o uso").',
      'Interruptor de simulação "Estou no endereço" para testar o início de atividades no protótipo.',
    ],
    openQuestions: ['O que o app deve fazer quando a pessoa nega a permissão de localização?'],
  },
  support: {
    summary: 'Conversa com o suporte btime dentro do app, sem barra inferior.',
    changes: [
      'O atalho de ajuda saiu da lista de atalhos e ficou no topo da Início e no Perfil.',
      'Tela vazia com sugestões de assunto ("Erro na sincronização", "Não encontro uma atividade", "Como atualizar o app") que preenchem o campo.',
      'Campo fixo no rodapé. Mensagem vazia mostra erro em texto em vez de desabilitar o botão.',
      'A resposta automática não promete prazo: "Uma pessoa do suporte responde em breve."',
    ],
    openQuestions: [
      'A conversa fica salva no aparelho ou vem do servidor (histórico entre aparelhos)?',
      'Qual é o horário de atendimento que podemos mostrar?',
    ],
  },
  language: {
    summary: 'Escolha do idioma do app.',
    changes: ['Idioma passou a ficar no Perfil, como pedido na reunião, com o idioma atual visível na linha.'],
    openQuestions: ['O idioma segue o do aparelho por padrão ou o escolhido na web?'],
  },
  password: {
    summary: 'Envia um link de redefinição de senha para o e-mail da conta.',
    changes: [
      'Redefinir senha agora está no Perfil.',
      'Mostra para qual e-mail o link vai e, depois do envio, lembra de conferir o spam, com opção de reenviar.',
    ],
    openQuestions: ['Por quanto tempo o link vale? (A tela não informa até termos a regra.)'],
  },
}
