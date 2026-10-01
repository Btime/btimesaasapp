# btimesaasapp

App de execução de atividades da btime, redesenhado com o **btime design system 1.2**. Este repositório guarda o app navegável que serve de referência visual e de comportamento para a implementação final.

O app executa atividades em campo: a pessoa vê o que está atribuído a ela ou ao grupo, executa o questionário, pausa, conclui, recusa ou torna improdutiva, e sincroniza quando tiver internet. A gestão continua na web.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

- Em telas largas (960 px ou mais), o app aparece dentro de um aparelho de 390 × 844, com um painel ao lado. O painel tem as notas de cada tela (o que mudou e o que falta decidir), atalhos para todas as telas, cenários simulados (atualização disponível, erro de sincronização, distância do local, grupo, permissões) e a troca de tema.
- No celular, o app ocupa a tela inteira.

Outros comandos:

```bash
npm run build
npm run lint
```

## Estrutura

```
src/
  styles/
    btime-tokens.css   Tokens da marca, copiados do design system 1.2 sem edição
    app-tokens.css     Tokens derivados para o app (estados, superfícies, escala mobile, tema escuro)
    base.css           Reset, tipografia (Branding 350/500/600) e foco visível
    components.css     Estilos dos componentes compartilhados
    shell.css          Estrutura do app, transições e navegação inferior
  components/          Botões, chips, campos, folhas e diálogos acessíveis, card de atividade, layout
  store/               Estado do app (useReducer), tipos, dados de demonstração e seletores
  nav/                 Navegação em pilha por aba (push, back, replace, goTab, reset)
  shell/               AppShell, navegação inferior e registro de telas
  screens/
    home/              Início
    activities/        Lista de atividades (Minhas, Do grupo, Finalizadas)
    activity/          Detalhe, execução, conclusão e tornar improdutiva
    new/               Nova atividade (etapas) e leitura de QR Code
    profile/           Perfil, ajuda e diagnóstico, sincronização, suporte, idioma, senha, aviso de atualização
  prototype/           Moldura do aparelho, painel de revisão e notas por tela
public/btime/          Assinaturas, ícones e fontes oficiais do kit (não redesenhar)
docs/referencias/      Transcrição da reunião de 15/09/2026 (os vídeos ficam fora do git)
```

## Regras que o código segue

- Cores, espaços, raios, tipografia e tempos de animação vêm só de tokens CSS. Os componentes não usam hexadecimal direto.
- A marca é escrita sempre como **btime**, em caixa-baixa. O logo é sempre o SVG oficial.
- A fonte é Branding, com pesos 350, 500 e 600. Não existe 700.
- Violeta sobre noite não chega a 3:1. Por isso, no tema escuro, o botão primário ganha contorno lavanda, e links e realces usam lavanda (`--accent-text`).
- Os chips e callouts de estado mantêm o fundo claro nos dois temas, como pede o DS 1.2.
- Folhas e diálogos são modais reais: recebem o foco, fecham com Escape, mantêm o foco dentro e o devolvem ao fechar. Enquanto estão abertos, o resto do app fica `inert`.
- Alvos de toque têm pelo menos 44 px, e o estado nunca é indicado só pela cor (sempre há ícone e texto).
- `prefers-reduced-motion` desliga as transições.

## Dados

Tudo o que aparece no app é demonstração (`src/store/data.ts`). Os nomes de locais e questionários vêm do ambiente de testes mostrado no vídeo do app atual. A câmera, a sincronização, a loja de aplicativos e o suporte são simulados.
