# Checklist de Implementação — App Genforce

> Consolidação de tudo que foi combinado em `requisitos-app.md` (itens 1 a 8), organizado
> numa ordem prática pra começar a codar. Cada item vira uma tarefa concreta.
> Gerado em 18/08/2026, antes de começar a rodar o código.

> ## ⚠️ ATUALIZAÇÃO 21/08/2026 — leia antes de usar este checklist
>
> A conta do Supabase foi trocada e o banco vai ser **recriado do zero**. Enquanto isso não
> acontecer, nada aqui roda. A ordem de trabalho agora é:
>
> 1. `prompt-1-banco-de-dados.md` — recriar o banco via MCP (**bloqueia tudo**)
> 2. `prompt-2-bugs-e-ajustes.md` — botão de atualizar, filtro que reseta, auto-save, checklist em seções, assinaturas
> 3. `prompt-3-finalizacao-relatorios-cadastros.md` — fluxo de finalização, Relatórios com filtros, cadastros completos, relatório de peças
>
> As seções 3 a 7 abaixo já foram implementadas pela Cursor entre 18 e 20/08 (lista de OS,
> menu ☰, importar clientes, remanejar, login) — os checkboxes não foram atualizados na época.
> A seção 8 (detalhe da OS) continua adiada. Ver `requisitos-app.md`, seção
> "Rodada de 21/08/2026", para a triagem completa e os pontos em aberto.

> ## ✅ PROMPT 2 — Bugs e ajustes (23/08/2026)
>
> - [x] Dívida: `avisar`/`confirmarAcao` de `lib/avisos.js` em OSDetail/NovaOS/EditarOS; `corDoStatusPendencia` separado
> - [x] Ajuste 1: ícone ↻ de atualizar no detalhe da OS
> - [x] Ajuste 2: filtro de período sobe pra `lib/filtroOS.js` (sobrevive à navegação)
> - [x] Ajuste 3: auto-save do checklist com indicador Salvando/Salvo/Erro
> - [x] Ajuste 4: checklist em seções por `grupo` + km saída/retorno + bloco assinaturas
> - [x] Ajuste 5: assinaturas cliente/técnico (`AssinaturaCampo` + tabela `assinaturas`) — Dashboard comparativo **não** inventado (aguarda Alexandre)
> - [x] Ajuste 6: race ao salvar unidade em Nova OS + pré-preenche nome na 1ª unidade + RLS insert autenticado
> - [x] Ajuste 7: `DatePickerCampo` (data única) em Nova OS
> - [x] Ajuste 8: chips de status com `extraData`, update funcional e barra "Filtrando…"
> - [x] Ajuste 9: check-in bloqueado em OS `concluida`/`finalizado`

> ## ✅ PROMPT 3 — Finalização, relatórios, cadastros, dashboard (27/08/2026)
>
> - [x] Parte 1: cadastros completos de cliente (CNPJ, telefone, e-mail, cidade, UF) e equipamento (campos técnicos + `equipamento_filtros`); tela **Editar cliente** no menu ☰
> - [x] Parte 2: seção **Peças trocadas** em `OSDetail` (`relatorio_pecas`), sugestão de código via filtros cadastrados, vínculo com pendência na baixa
> - [x] Parte 3: página **Relatórios** expandida — filtros por seleção, aba busca OS, histórico de pendências resolvidas mantido
> - [x] Parte 4: fila **Aguardando revisão** (só admin/supervisor), finalizar → `finalizado` + PDF manual (`lib/relatorioPdf.js`); solicitar correção → `andamento` + `observacao_correcao` em destaque
> - [x] Parte 5: tela **Desempenho** (Dashboard) — contagem de assinaturas `tipo=tecnico` por `usuario_id`; migration `migracao-02-assinaturas-usuario.sql`
> - [x] Parte 6: redesenho **Detalhe da OS** — cabeçalho colorido, barras de progresso, card resumo, botões Check-In / Informações / Cliente, árvore por equipamento; Observações/Assinaturas fora da árvore por equipamento
> - [x] Parte 7: **switch** modo escuro/claro no menu ☰ + persistência em AsyncStorage (`lib/tema.js`)
> - [x] Parte 8: grupos de checklist opcionais por OS (`os_grupos_opcionais`), toggle em **Editar OS**, regra automática COM CARGA; migration `migracao-03-os-grupos-opcionais.sql`
> - [ ] Envio automático de PDF por e-mail — **aguarda** escolha de provedor (Resend/SendGrid) pelo Alexandre

## Antes de começar — pontos a confirmar (evitam retrabalho)

- [x] **Login (item 3):** ✅ respondido 18/08 com rascunho — foto cobrindo a tela inteira (sem card branco), logo numa caixa escura perto do topo, campos "Login"/"Senha" em pílulas brancas arredondadas flutuando direto sobre a foto. Minha sugestão de gradiente escuro sutil por trás dos campos ainda aguarda aprovação
- [x] **Modo escuro/claro (item 2):** ✅ respondido 18/08 — tema global (app inteiro), com a opção de trocar dentro do menu ☰
- [x] **Filtro de período (item 7/8):** ✅ respondido 18/08 — confirmado: no "Personalizado" escolhe início e fim, e aparecem as manutenções agendadas no meio do intervalo. Cobre a necessidade de planejamento mensal

**Todas as 3 perguntas foram respondidas — sem bloqueio pra começar a implementar.**

---

## 1. Banco de dados (Supabase) ✅ implementado 18/08

- [x] Adicionar `agendado` na lista de status possíveis de `ordens_servico` (item 8) — status é campo texto livre, código já usa o valor novo (ver `lib/constantes.js`)
- [x] Criada tabela `os_tipos` pra suportar múltiplos tipos por OS (ver item 2b). Migração em `migracao-01-tipos-e-agendado.sql` — **rodar manualmente no SQL Editor do Supabase**
- [ ] Ainda em aberto: revisar se precisa de mais status pra bater com os 6 do 8Confirma (urgente/atrasada, agendada, em aberto, pausada, concluída, arquivada) — por ora ficou só pendente/andamento/pausada/concluida/agendado

## 2. Editar OS (`EditarOS.js`) — item 1 ✅ implementado 18/08

- [x] (a) Trazer a seleção de geradores do `NovaOS.js` pra dentro de `EditarOS.js` — trocar/adicionar/remover geradores vinculados à OS
- [x] (b) Criar forma de editar os dados cadastrais de um gerador já existente (fabricante, potência etc.) — botão "✎ editar" em cada gerador na lista

## 2b. Tipo de OS / Modalidade — item 6 (corrigido 18/08) ✅ implementado 18/08

- [x] Atualizar as opções de `TIPOS_OS` (agora em `lib/constantes.js`, importado por `NovaOS.js`/`EditarOS.js`) pros 5 valores do 8Confirma: Atendimento de Emergência, Manutenção Corretiva, Visita Técnica, Teste com Carga Programado, Manutenção Preventiva (no lugar dos 4 antigos: preventiva/corretiva/visita_tecnica/observacao)
- [x] **Confirmado (18/08): seleção múltipla.** Pode marcar mais de um tipo na mesma OS, com checkbox + chips removíveis (igual ao print do 8Confirma). Isso muda o campo `tipo`: deixa de ser um texto único e vira uma lista — no banco, melhor caminho é uma tabela própria (`os_tipos` ou similar, ligando `ordens_servico` a vários valores de tipo) em vez de tentar guardar array direto num campo texto
- QR code continua eliminado, não mexer

## 3. Lista de OS — dinâmica e visual (item 2 + item 7/8) ★ maior bloco

> Já feito 18/08 como efeito colateral da migração de tipos (não é o redesign completo, só o mínimo pra lista não quebrar): `App.js` já busca `os_tipos` e mostra os tipos como texto no card, e a borda já fica azul quando `status === 'agendado'`. O resto do item abaixo continua em aberto.

- [ ] Resumo com contadores por status (chips coloridos no topo, como no print do 8Confirma)
- [ ] Barra de busca + Filtros + Ordenar + Status (dropdowns)
- [ ] Filtro de período com presets: Hoje, Ontem, Amanhã, Mês Atual, Mês Anterior, Próximo Mês, Personalizado (seguir a spec técnica em `especificacao-date-range-picker.md` à risca: presets calculados dinamicamente, `appliedRange`/`draftRange` separados, sem botão "Aplicar" no personalizado, proteção contra requisição antiga sobrescrever a mais nova)
- [ ] Cards de OS mais ricos: janela de data/hora prevista (início → fim), nome do cliente + razão social embaixo, chip do tipo de manutenção, chip por equipamento com marca/modelo, descrição
- [ ] Status "Agendado" refletido visualmente (chip azul, ícone de calendário)
- [ ] Cor por status na borda de cada card (estender a lógica que já existe pra cobrir todos os status, incluindo "Agendado") + bordas arredondadas nos cards (item 9)

## 4. Menu hambúrguer (☰) — item 4

- [ ] Ícone de três barras no canto superior da lista de OS
- [ ] Opção **Criar OS** (tira o botão fixo "+ Nova OS" da tela)
- [ ] Opção **Relatório**: busca cliente → mostra pendências já baixadas (resolvidas) daquele cliente. Pendência aberta não aparece — fica só na OS
- [ ] Opção **Importar clientes** (ver item 5)
- [ ] Opção **Modo escuro/claro**: tema global do app inteiro (confirmado 18/08), o toggle mora aqui no menu

## 5. Importar clientes — item 5

- [ ] Tela de "importar arquivo" (reutilizável, dentro do menu ☰)
- [ ] Carga inicial: os ~50 clientes já extraídos do PDF `Genforce | Clientes` (nome, razão social, endereço) — não precisa esperar nada, já tenho os dados
- [ ] Seletor de cliente com busca (campo "Procurar...", estilo do 8Confirma) reutilizado onde escolhe cliente (Nova OS, Relatório etc.)

## 6. Remanejar OS — item 8

- [ ] Opção "Remanejar" no menu de três pontos (⋮) de cada OS na lista, junto com "Editar OS" e "Excluir OS" — muda a data sem excluir/recriar

## 7. Tela de login — item 3

> **Testado 19/08 pelo Alexandre — feedback pendente, NÃO mexer até ele mandar o ajuste exato:** não gostou da animação de brilho/pulso no nome "Genforce", nem da cor de fundo preta da caixa da logo (aparecem linhas/faixas nela, "nada a ver com o que queria"). A foto de fundo também vai ser trocada por ele depois. Ver detalhe em `requisitos-app.md`, seção 3 (login).

- [ ] Foto dos geradores (`assets-login/foto-geradores-capa.jpg`, cor natural, sem filtro azulado) cobrindo a tela inteira de fundo
- [ ] Logo `assets-login/genforce-logo-transparente.png` (com "ENERGIA" recriado como "MANUTENÇÃO", fallback pra "ENERGIA" se não ficar bom) dentro de uma caixa escura perto do topo, por cima da foto
- [ ] Campos "Login" e "Senha" em formato de pílula branca arredondada, flutuando direto sobre a foto (sem card/fundo branco atrás)
- [x] Gradiente escuro sutil da metade pra baixo da foto, pra legibilidade dos campos/botão — **aprovado (18/08)**: "vamos ver como fica, depois qualquer coisa mudamos"
- [ ] Modo escuro/claro é tema global do app — o próprio login deve respeitar isso, mas a capa com foto provavelmente fica igual nos dois modos (a definir quando chegar lá)
- [ ] Animação: Ken Burns sutil no fundo + campos surgindo com fade/slide + brilho/pulso de luz na logo ao abrir (é pra testar, pode trocar depois)

## 8. Tela de detalhe da OS — item 10 (confirmado, baixa prioridade — depois da rodada de teste)

- [ ] Cabeçalho da tela de detalhe da OS colorido pelo status (mesma lógica de cor do item 9)
- [ ] Mostrar os técnicos com acesso à OS ("colaboradores")
- [ ] **Pré-requisito:** cadastrar as outras contas de usuário (4 técnicos + 3 admin — ver requisitos, seção 5) antes de fazer sentido mostrar essa lista

## Eliminado do escopo (não implementar) — item 6

- ~~QR code~~ — Genforce não usa
- ~~Modalidade~~ — **correção 18/08: NÃO está mais eliminado.** Era só um mal-entendido de nome — Modalidade = nosso "tipo de OS". Ver item 2b acima

## Não confirmado ainda / ideia futura (não faz parte deste checklist)

<!-- Coisas que vieram da minha análise comparativa com o 8Confirma mas o Alexandre ainda não
confirmou que quer — ficam de fora do checklist até ele bater o martelo. Ver detalhes em
requisitos-app.md, seção "Análise comparativa com o 8Confirma". -->
- Assinatura digital do cliente (banco já tem a tabela `assinaturas` pronta) — **implementada no Prompt 2 (23/08)**; comparativo de desempenho no Dashboard ainda aguarda definição do Alexandre
- Geração automática de PDF do relatório final + envio por WhatsApp/e-mail
- Painel web pro supervisor (seção 6b do requisitos — maior gap em aberto)
- Mapa com localização em tempo real dos técnicos / reatribuir OS / sugestão de técnico mais próximo
- Modo offline, controle de estoque de peças, notificações push
- Migração de dados históricos do 8Confirma (clientes/equipamentos/OS além dos ~50 clientes já pegos)
