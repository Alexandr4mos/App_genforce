# PROMPT 2 — Bugs e ajustes da tela de OS e do checklist

> **Só rode depois do Prompt 1 (banco de dados).** Estes ajustes precisam de um banco funcionando
> pra serem testados, e o item 5 (assinaturas) depende da tabela `assinaturas` e do bucket de
> Storage criados lá.

---

Você está trabalhando no app **Genforce** — Expo/React Native + Supabase, publicado como PWA, para gestão de manutenção de geradores (GMG). O código está em `app/`.

Leia antes de mexer: `requisitos-app.md`, `checklist-implementacao.md`, e os arquivos que você for alterar.

## Arquitetura atual (não presuma, é assim mesmo)

- **Não há react-navigation.** `App.js` decide qual tela mostrar por `if` + `return`, com um estado por tela (`osSelecionadaId`, `criandoOS`, `osEditandoId`, `mostrandoRelatorio`, `mostrandoImportar`, `osRemanejandoId`). Isso significa que **a tela anterior é desmontada** ao navegar — detalhe que causa o bug do item 2 abaixo.
- Tema claro/escuro global: `app/lib/tema.js` (`TemaProvider` / `useTema`), envolvendo tudo em `App.js`.
- Alertas: `app/lib/avisos.js` exporta `avisar(mensagem, titulo)` e `confirmarAcao(mensagem)`, que tratam `Platform.OS === 'web'` (usa `window.alert`/`window.confirm`) vs nativo. **Sempre use esses** — nunca `alert()`/`confirm()` direto, e nunca redeclare a função local.
- Constantes compartilhadas: `app/lib/constantes.js` (`TIPOS_OS`, `rotuloTipo`, `STATUS_OS`, `rotuloStatus`, `COR_STATUS`, `corDoStatus`, `TEMPLATE_PADRAO_ID`).
- Estilos: `StyleSheet.create` no fim de cada arquivo, React Native puro, sem lib de UI externa.
- **Sem `localStorage` / `sessionStorage`** — não funciona de forma confiável no PWA aqui. Para persistir entre sessões use `@react-native-async-storage/async-storage` (já está no `package.json`) ou o Supabase.

## Dívidas técnicas a corrigir junto (são pequenas e evitam bug futuro)

- `screens/OSDetail.js` tem **cópias locais** de `avisar` (linha ~18), `confirmarAcao` (~26) e `corDoStatus` (~651). Apague as três e importe de `lib/avisos.js` e `lib/constantes.js`. Hoje a cor de status da tela de detalhe pode divergir da cor da lista, que é exatamente o tipo de inconsistência que isso causa.
- `screens/NovaOS.js`, `screens/EditarOS.js` e `screens/OSDetail.js` **não usam `useTema`** — têm cores fixas no `StyleSheet`. Como o modo escuro foi definido como tema global do app inteiro, essas três telas ficam brancas no escuro. Converta as três para consumir `useTema()`, seguindo o padrão que `screens/Relatorio.js` e `components/MenuLateral.js` já usam.

---

## Ajuste 1 — Botão de atualizar minimizado na tela de detalhe da OS

Hoje, em `screens/OSDetail.js`, o botão **"Atualizar (ver o que outros técnicos já preencheram)"** é um botão de largura total ocupando o topo da tela.

Transforme-o num **ícone pequeno no canto superior direito**, no mesmo estilo do ícone de recarregar (🔄) que já existe no topo da tela de Ordens de Serviço (`screens/ListaOS.js`). Mesma função (buscar dados frescos do servidor), só muda o visual e a posição.

Mantenha algum feedback visual enquanto carrega (o ícone girando, ou um `ActivityIndicator` no lugar dele), senão o usuário não sabe se clicou.

---

## Ajuste 2 — BUG: o filtro de data reseta pra "Hoje" ao voltar da OS

**Comportamento errado:** o usuário filtra a lista por outro dia (ex: "Ontem"), abre uma OS, volta pra lista — e o filtro voltou pra "Hoje" sozinho, obrigando a refiltrar toda vez.

**Causa raiz (já diagnosticada, não precisa investigar do zero):** o estado do filtro de período mora dentro de `screens/ListaOS.js`. Quando o usuário abre uma OS, `App.js` retorna `<OSDetail .../>` em vez de `<ListaOS .../>`, o que **desmonta o `ListaOS` inteiro** e joga fora o estado. Ao voltar, ele remonta do zero com o preset padrão.

**Correção:** suba o estado do intervalo aplicado (`appliedRange`, ou como estiver nomeado em `ListaOS.js` / `components/DateRangeFilter.js` / `lib/dateRangeService.js`) para um nível que sobreviva à navegação. Duas opções válidas, escolha a que ficar mais limpa no código atual:

- levantar o estado para `App.js` e passar por prop + callback; ou
- criar um contexto próprio (ex: `lib/filtroOS.js`, no mesmo padrão de `lib/tema.js`) e envolver o app com ele.

Requisitos do resultado:
- O período escolhido permanece ao ir pra OS e voltar, ao editar uma OS e voltar, e ao abrir Relatório/Importar e voltar.
- Só muda quando o usuário troca manualmente.
- Vale para os presets **e** para o intervalo "Personalizado".
- **Não** persista entre sessões (ao deslogar/relogar pode voltar pra "Hoje") — a menos que seja trivial fazer com AsyncStorage sem complicar o código.
- Cuidado pra não quebrar a proteção contra race condition já implementada em `dateRangeService.js` (resposta antiga não pode sobrescrever a mais nova).

---

## Ajuste 3 — BUG: dados perdidos ao sair da OS sem salvar

**Comportamento errado:** se o técnico preenche respostas do checklist, observações e medições e sai da tela sem clicar em "Salvar Relatório", perde tudo. Em campo isso é grave — o técnico refaz o trabalho.

**Correção: auto-save.** Os dados devem ser gravados automaticamente conforme são preenchidos, sem depender do clique no botão.

Implementação esperada:
- Campos de texto e numéricos (observações, medições): salvar com **debounce** (sugestão: 800ms–1,5s após parar de digitar) e/ou no `onBlur` do campo.
- Campos de escolha (opções do checklist): salvar **imediatamente** ao selecionar. Note que `OSDetail.js` já tem uma função `garantirRespostaSalva(...)` — reaproveite-a em vez de criar um caminho de gravação paralelo.
- **Indicador de estado visível**: "Salvando..." / "Salvo" / "Erro ao salvar — toque para tentar de novo". O técnico precisa saber que pode sair da tela em segurança.
- Em caso de falha de rede, **não descarte o dado da tela** e não deixe a UI dizendo "salvo". Mostre o erro e mantenha o valor preenchido para nova tentativa.
- O botão de salvar manual continua existindo (funciona como "salvar agora"), mas deixa de ser a única forma de não perder trabalho.

Cuidado com a interação já existente: hoje `relatorioSalvo` controla a liberação do check-out (`fazerCheckout` bloqueia se o relatório não estiver salvo). Ajuste essa lógica para conviver com o auto-save, sem afrouxar a regra de que o check-out exige o relatório completo.

---

## Ajuste 4 — Checklist dividido em seções, com salvar por seção

Hoje o checklist é uma lista corrida de ~67 itens com um único botão "Salvar Relatório" lá no fim — o técnico precisa rolar a página inteira.

**Como deve ficar** (baseado em print do 8Confirma real):

- Cada **seção é um bloco expansível/colapsável**, com o título da seção e um **contador de itens preenchidos** no canto direito.
- Quando colapsada, a seção mostra um resumo curto das respostas já dadas (no 8Confirma aparece algo como `Nível OK | Nível Ok | 3/4` embaixo do título).
- **Cada seção tem seu próprio botão de salvar** ao final dela, em vez de um único salvar no fim da página.
- Uma barra lateral colorida indica visualmente a seção (verde quando completa é uma boa referência).

**De onde vêm as seções:** a tabela `checklist_template_itens` **já tem a coluna `grupo`**, e `OSDetail.js` já lê `item.grupo` (linha ~973) — só que hoje renderiza como um rótulo solto. Agrupe os itens por `grupo` e monte as seções a partir disso. **Não crie uma estrutura nova de seções nem hardcode a lista de seções no código** — o agrupamento tem que sair do dado.

As seções esperadas (é assim que o template está organizado):
1. Verificações: Mecânica / Sistema de Arrefecimento / Sistema Combustível
2. Verificações: Sistema Elétrico / Sistema de Transferência / Sistema de Proteção
3. Verificações Gerais
4. Medições de Grandezas Elétricas (AC) / Mecânicas GMG — SEM CARGA
5. Medições de Grandezas Elétricas (AC) / Mecânicas GMG — COM CARGA
6. Medições de Grandezas Elétricas (DC) GMG
7. Observações
8. **Observações Gerais & Assinaturas** — bloco final, ver Ajuste 5

Com o auto-save do Ajuste 3 funcionando, o botão por seção passa a ser "confirmar/salvar agora" — os dois convivem, não são alternativas.

**Bloco final "Observações Gerais & Assinaturas"** deve conter, nesta ordem (igual ao 8Confirma):
- Observações Gerais (texto longo, obrigatório)
- Deslocamento de Saída — número, em Km → grava em `ordens_servico.km_saida` (**a coluna já existe**, hoje sem tela nenhuma)
- Deslocamento de Retorno — número, em Km → grava em `ordens_servico.km_retorno`
- Assinatura do Cliente (Ajuste 5)
- Assinatura do Técnico (Ajuste 5)

---

## Ajuste 5 — Assinatura do cliente e do técnico

No fechamento do relatório, dois campos de assinatura, ambos **obrigatórios para fechar a OS**.

Cada campo tem:
- **Área para desenhar a assinatura** com o dedo (celular) ou mouse (PWA no computador).
- **Campo de nome** de quem assinou (no 8Confirma aparece o nome ao lado do traço: "Ailton", "Alexandre").
- **Botão de editar (✎)** para refazer e **botão de excluir (🗑)** para apagar.
- Quando já assinado, mostra a miniatura da assinatura + o nome, no lugar da área de desenho.

**Banco:** a tabela `assinaturas` **já existe** e nunca foi usada por nenhuma tela — colunas `os_id`, `tipo` (`'cliente'` | `'tecnico'`), `nome_responsavel`, `imagem_url`. Use ela como está, sem criar tabela nova. A imagem vai para o Supabase Storage (mesmo padrão de upload que `OSDetail.js` já usa para fotos) e a URL vai em `imagem_url`.

**Biblioteca:** precisa funcionar tanto no navegador quanto no app. Avalie o que integra melhor com Expo + `react-native-web` (`react-native-signature-canvas` costuma ser o caminho, mas confirme a compatibilidade com a versão do Expo do projeto antes de instalar). Se nenhuma lib funcionar bem nos dois ambientes, implemente com `<canvas>` + PanResponder e documente a decisão.

**Regra de bloqueio:** o check-out / fechamento da OS só libera com as duas assinaturas preenchidas. Some isso à validação que já existe (relatório completo).

> **Ponto que precisa de confirmação antes de codar:** o pedido menciona que a assinatura do técnico deve alimentar "o comparativo de desempenho no Dashboard que já conversamos". Esse Dashboard **não existe no código nem está especificado em nenhum documento do repositório**. Não invente esse comparativo. Grave a assinatura corretamente (que já deixa o dado disponível) e **pergunte ao Alexandre o que exatamente esse comparativo deve mostrar** antes de construir qualquer tela de dashboard.

---

## Ao terminar

- Rode o app e confirme que nada quebrou nas telas existentes: login, lista de OS, filtros e período, Nova OS, Editar OS, check-in/check-out, checklist, fotos, pendências, menu ☰, Relatório, Importar clientes, Remanejar.
- Teste especificamente no **modo escuro**, já que três telas foram convertidas.
- Teste o Ajuste 2 navegando de verdade: filtra "Ontem" → abre OS → volta → o filtro tem que continuar "Ontem".
- Teste o Ajuste 3 preenchendo campos e **fechando a aba do navegador** sem salvar, depois reabrindo a OS.
- Atualize os checkboxes correspondentes em `checklist-implementacao.md`.
- Um commit por ajuste, com mensagem clara. Não junte os cinco num commit só.
