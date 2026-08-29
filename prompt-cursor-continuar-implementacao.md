Você está trabalhando no app "Genforce" — Expo/React Native + Supabase, publicado como PWA, para gestão de manutenção de geradores (GMG). Este é um app real em uso pela empresa Genforce Engenharia, substituindo o sistema "8Confirma".

Antes de qualquer alteração, leia estes arquivos do projeto pra entender o contexto completo:
- `requisitos-app.md` — histórico completo de decisões e por que cada coisa foi pedida
- `checklist-implementacao.md` — checklist oficial, seções 1, 2 e 2b já estão implementadas e marcadas como concluídas, NÃO mexer nelas de novo
- `schema.sql` — schema do banco (Supabase/Postgres)
- `especificacao-date-range-picker.md` — spec técnica detalhada do filtro de período (obrigatória pra seção 3)
- `app/lib/constantes.js` — já existe: exporta `TIPOS_OS`, `rotuloTipo`, `STATUS_OS`, `rotuloStatus`, `COR_STATUS`, `corDoStatus`, `TEMPLATE_PADRAO_ID`. Reaproveite essas constantes em vez de recriar
- `app/lib/supabase.js` — client do Supabase já configurado
- `app/App.js`, `app/screens/NovaOS.js`, `app/screens/EditarOS.js`, `app/screens/OSDetail.js` — telas existentes, já atualizadas na última rodada (banco, tipos multi-seleção, geradores editáveis)

## Convenções do projeto (siga à risca)

- Todo texto visível ao usuário é em português (pt-BR), inclusive nomes de variáveis de UI e mensagens de erro.
- Alertas usam o padrão já existente: função `avisar(mensagem, titulo)` e `confirmarAcao(mensagem)` que tratam `Platform.OS === 'web'` (usa `window.alert`/`window.confirm`) vs nativo (usa `Alert.alert`). Reaproveite esse padrão em telas novas — não use `alert()`/`confirm()` direto.
- Estilo dos componentes: `StyleSheet.create` no fim do arquivo, sem lib de UI externa (nada de styled-components, tailwind, etc.) — é só React Native puro, do jeito que já está em `NovaOS.js`/`EditarOS.js`.
- Sem `localStorage`/`sessionStorage` (não funciona no PWA aqui) — use estado React ou, se precisar persistir entre sessões, Supabase.
- Consultas ao banco sempre via `supabase.from(...)`, seguindo o padrão de `try/error` já usado (checar `error`, chamar `avisar` com `error.message`).
- Cada tela nova deve seguir o padrão de navegação já usado em `App.js`: um estado boolean/id no componente pai que decide qual tela renderizar (não há react-navigation instalado, é tudo controle manual de estado).

## O que NÃO fazer

- Não mexer nas seções 1, 2 e 2b do checklist (banco de dados, geradores em Editar OS, tipo/modalidade multi-seleção) — já estão prontas e testadas.
- Não recriar `TIPOS_OS`/`STATUS_OS` localmente em nenhuma tela nova — sempre importar de `app/lib/constantes.js`.
- Não implementar nada da seção "Não confirmado ainda / ideia futura" do `checklist-implementacao.md` (assinatura digital, PDF automático, painel web, mapa em tempo real, modo offline, etc.) — está fora de escopo por enquanto.

## Ordem de implementação — siga esta sequência, uma seção por vez, garantindo que o app continua rodando sem erro antes de ir pra próxima

---

### Seção 3 — Lista de OS: dinâmica e visual (★ bloco maior)

Já existe um mínimo em `App.js`: a query já busca `os_tipos(tipo)` e mostra os tipos como texto simples no card, e a borda do card já fica azul quando `status === 'agendado'`. Isso é só um remendo temporário — substitua pelo redesign completo abaixo.

1. **Resumo com contadores por status**: chips coloridos no topo da lista (ex: "Pendente 3", "Andamento 2", "Concluída 8"), usando as cores de `corDoStatus()` de `lib/constantes.js`. Contagem calculada a partir da lista de OS já carregada (sem query extra).
2. **Barra de busca + filtros**: campo de busca por texto (nome do cliente, número da OS, descrição) + dropdown de ordenação + dropdown de filtro por status. Filtragem client-side sobre os dados já carregados é aceitável nesta fase.
3. **Filtro de período** com os presets: Hoje, Ontem, Amanhã, Mês Atual, Mês Anterior, Próximo Mês, Personalizado. **Siga a spec em `especificacao-date-range-picker.md` à risca**, especialmente:
   - separação entre `draftRange` (rascunho, enquanto o usuário ainda está escolhendo) e `appliedRange` (o que realmente filtra a lista)
   - presets calculados dinamicamente em relação à data atual (nada de offset fixo tipo "hoje - 30 dias")
   - no modo "Personalizado" não existe botão "Aplicar" — o comportamento descrito na spec é diferente, confira o documento
   - proteção contra race condition: se o usuário trocar o filtro rápido, a resposta de uma requisição antiga não pode sobrescrever uma mais nova (usar um id de requisição ou `AbortController`)
   - tratamento explícito de timezone (o documento especifica como)
   - se fizer sentido, pode usar uma lib de date-range-picker madura ao invés de implementar do zero — a spec já recomenda isso
4. **Cards de OS mais ricos**: janela de data/hora prevista (início → fim), nome do cliente + razão social embaixo, chip com o(s) tipo(s) de manutenção (usar `rotuloTipo()`, pode ter mais de um chip já que tipo agora é multi-seleção), chip por equipamento vinculado (buscar de `os_equipamentos` + `equipamentos`, mostrar tag + fabricante), descrição.
5. **Status "Agendado"** com destaque visual: chip azul + ícone de calendário no card.
6. **Cor por status na borda do card**: usar `corDoStatus()` pra cobrir todos os status (não só agendado como está hoje), e aplicar bordas arredondadas nos cards (`borderRadius` maior, hoje é reto).

### Seção 4 — Menu hambúrguer (☰)

1. Ícone de três barras no canto superior da lista de OS (`App.js`), abre um drawer/menu lateral ou dropdown (a escolha de componente é livre, mas tem que funcionar bem tanto no navegador do celular quanto no computador via PWA).
2. Opção **Criar OS** — remove o botão fixo "+ Nova OS" da tela e move essa ação pra dentro do menu.
3. Opção **Relatório** — abre uma busca de cliente; ao escolher um cliente, mostra a lista de pendências **já baixadas/resolvidas** daquele cliente (`pendencias` com `status = 'resolvida'` e `equipamento_id` pertencente a uma unidade do cliente escolhido). Pendência aberta (qualquer outro status) NÃO aparece aqui — ela só aparece dentro da própria OS.
4. Opção **Importar clientes** — abre a tela da seção 5.
5. Opção **Modo escuro/claro** — toggle que aplica um tema (claro/escuro) no app inteiro. Ver observação de tema abaixo.

**Sobre o tema escuro/claro**: é global (afeta todo o app, confirmado com o Alexandre), o toggle mora só dentro deste menu. Implemente com um Context de tema (`ThemeContext`) provendo cores (fundo, texto, borda, etc.) consumidas em todas as telas — ou, se preferir algo mais simples de manter, um hook `useTema()` que lê um estado global (Context/Zustand/o que já for idiomático no projeto — hoje não tem lib de state management instalada, então Context puro do React é a opção mais simples). Não precisa persistir a escolha entre sessões nesta fase (pode reiniciar em claro a cada login), a menos que seja trivial salvar num campo do usuário no Supabase.

### Seção 5 — Importar clientes

1. Tela de "importar arquivo" reutilizável, acessada pelo menu ☰ → Importar clientes. Deve aceitar upload de um arquivo (CSV é o mais simples de implementar; se quiser aceitar PDF também, ok, mas CSV é o essencial) com nome, razão social e endereço do cliente, e inserir em lote na tabela `clientes` (usar `supabase.from('clientes').insert([...])` com múltiplas linhas).
2. Peça ao Alexandre o arquivo com a carga inicial dos ~50 clientes já extraídos (ele tem os dados prontos, é só pedir se não estiver na pasta do projeto) — não precisa gerar dados fictícios.
3. Crie (ou refatore para) um componente de **seletor de cliente com busca** — campo de texto "Procurar..." que filtra a lista de clientes conforme digita — e reutilize esse componente em todo lugar que hoje faz uma lista simples de clientes: `NovaOS.js` (seleção de cliente) e a tela de Relatório da seção 4.

### Seção 6 — Remanejar OS

1. No menu de três pontos (⋮) de cada card de OS na lista (hoje só tem "Editar OS" e "Excluir OS" em `App.js`), adicione a opção **"Remanejar"**.
2. Ao clicar, abre um modal/tela simples só com o campo de nova data (reaproveitar o padrão de input `DD/MM/AAAA` já usado em `NovaOS.js`/`EditarOS.js`), atualiza `data_inicio_prevista` da OS existente. Não exclui nem recria a OS — só muda a data (e, se fizer sentido, também deveria permitir mudar o status pra "Agendado" nesse mesmo fluxo, já que remanejar normalmente serve pra isso).

### Seção 7 — Tela de login

Os assets já existem em `assets-login/`: `foto-geradores-capa.jpg` (cor natural, sem filtro azulado) e `genforce-logo-transparente.png` (a logo ainda tem o texto "ENERGIA" — se conseguir recriar como "MANUTENÇÃO" com fonte compatível, ótimo; senão, mantenha "ENERGIA" e avise).

Layout (baseado em rascunho aprovado pelo Alexandre):
1. Foto cobrindo a tela inteira de fundo (`ImageBackground` ou similar).
2. Gradiente escuro sutil da metade pra baixo da foto, pra legibilidade — **já aprovado**, pode implementar direto (ex: `expo-linear-gradient`, instalar se não tiver).
3. Logo dentro de uma caixa escura perto do topo, por cima da foto.
4. Campos "Login" e "Senha" em formato de pílula branca bem arredondada, flutuando direto sobre a foto (sem card/fundo branco atrás deles).
5. Animação ao abrir a tela: efeito Ken Burns sutil (zoom lento) no fundo + campos surgindo com fade/slide de baixo pra cima + um brilho/pulso de luz atravessando a logo (como se "ligasse"). Use `Animated` do React Native (já vem no core, não precisa instalar lib nova, mas se `react-native-reanimated` já estiver no projeto pode usar). É pra testar — não precisa ficar perfeito de primeira, o Alexandre já sabe que pode pedir ajuste depois.
6. A tela de login deve respeitar o tema claro/escuro global (seção 4) nos elementos de UI padrão, mas a foto de fundo provavelmente fica igual nos dois modos — não se preocupe em duplicar a foto por tema.

### Seção 8 — Tela de detalhe da OS (baixa prioridade, comentar mas não implementar código de UI ainda)

Este item foi confirmado mas o próprio Alexandre pediu pra deixar por último ("vamos mexer mais pra frente"). **Não implemente esta seção agora** — só deixe um comentário `// TODO: item 8 do checklist — cabeçalho colorido por status + lista de colaboradores com acesso à OS. Depende de criar as outras contas de usuário primeiro (5 técnicos + 1 supervisor + 2 admin).` no topo de `OSDetail.js`, pra não esquecer.

---

## Ao terminar cada seção

- Rode o app localmente e confirme que não quebrou nada nas telas existentes (login, lista de OS, Nova OS, Editar OS, check-in/checkout, checklist, fotos, pendências continuam funcionando).
- Atualize os checkboxes correspondentes em `checklist-implementacao.md` (marque `[x]` só no que realmente terminou).
- Não misture seções num único commit gigante — prefira um commit por seção, com mensagem clara (ex: "Seção 4: menu hambúrguer com criar OS, relatório, importar clientes e tema").
