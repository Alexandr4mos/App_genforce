# PROMPT 3 — Fluxo de finalização, página de Relatórios e cadastros completos

> **Só rode depois dos Prompts 1 e 2.** Este é o maior dos três e provavelmente vale quebrar em
> duas rodadas: primeiro as partes 1 e 2 (cadastros + relatório de peças, que são diretas),
> depois as partes 3 e 4 (fluxo de finalização + envio de PDF, que envolvem decisão de
> infraestrutura).

---

Você está trabalhando no app **Genforce** — Expo/React Native + Supabase, PWA, gestão de manutenção de geradores (GMG).

Antes de começar, leia `requisitos-app.md`, `checklist-implementacao.md`, `schema.sql` e as telas que for alterar. **Siga as mesmas convenções descritas no Prompt 2** (sem react-navigation, `lib/avisos.js` para alertas, `lib/constantes.js` para constantes, `useTema()` em toda tela nova, sem `localStorage`, React Native puro).

---

## Parte 1 — Completar os cadastros de cliente e equipamento

Vários campos existem no banco há tempos mas **não têm nenhum campo no formulário** — o dado nunca chega lá.

### 1.1 Cliente

Adicione ao formulário de cadastro/edição de cliente (hoje em `screens/NovaOS.js`, e onde mais fizer sentido):
- **CNPJ** (com máscara e validação de formato)
- **Telefone** (com máscara)
- **E-mail** — obrigatório na prática, porque o envio automático do relatório (Parte 4) depende dele. Marque como recomendado no formulário e avise quando estiver vazio, mas não impeça o cadastro por isso.
- **Cidade** e **UF**

Todas essas colunas já existem no banco (`cnpj`, `telefone`, `email`; `cidade`/`uf` foram criadas no Prompt 1). Nenhuma tabela nova.

**Crie também uma tela de edição de cliente** — hoje só existe criação embutida no fluxo de Nova OS, então um cliente cadastrado errado (ou um dos 107 importados, que vieram sem CNPJ/telefone/e-mail) não tem como ser corrigido pelo app. Coloque o acesso pelo menu ☰.

### 1.2 Equipamento (gerador)

O formulário atual só tem tag, fabricante do GMG, potência, placa do motor e placa do alternador. Adicione os campos técnicos que já existem no banco e nunca apareceram na tela:
`modelo_motor`, `n_serie_motor`, `modelo_alternador`, `n_serie_alternador`, `fabricante_motor`, `fabricante_alternador`, `tensao`, `tipo_gmg`

E os que foram criados no Prompt 1:
- `data_inicio_contrato` — início do contrato de manutenção
- `n_serie_gmg` e `ano_fabricacao`
- **Numeração dos filtros:** fica na tabela `equipamento_filtros` (`tipo_filtro`, `numero_peca`, `observacao`), **não em colunas** de `equipamentos`. No formulário isso vira uma sub-lista onde dá pra adicionar/remover linhas — um GMG pode ter mais de um filtro do mesmo tipo.

Como são muitos campos, organize em seções colapsáveis (ex: "Identificação", "Motor", "Alternador", "Contrato e filtros") em vez de um formulário corrido gigante. Só a identificação precisa ser obrigatória; o resto é preenchido aos poucos.

---

## Parte 2 — Tela de Relatório de Peças (tabela pronta, zero tela)

A tabela `relatorio_pecas` existe no banco desde o começo e **nenhuma tela do app lê ou escreve nela**. O objetivo dela, já documentado em `requisitos-app.md`, é servir de prova pro cliente quando ele questiona se uma peça foi realmente trocada.

Construa o registro de peça trocada **dentro da tela de detalhe da OS** (`screens/OSDetail.js`), como uma seção própria:

- Campos: **peça** (nome), **código da peça** (`codigo_peca` — o código/nº de série exato, não o nome genérico), **quantidade**, **observação**. `tecnico_id` e `data_hora` são preenchidos automaticamente.
- Ao registrar a troca de um filtro, **pré-preencha o campo de código** buscando em `equipamento_filtros` os filtros cadastrados naquele equipamento (Parte 1.2). Se houver mais de um do mesmo tipo, ofereça a escolha. Isso fecha o ciclo: o filtro certo daquele modelo de GMG já vem sugerido, e o técnico só confirma.
- **Vínculo com pendência:** `relatorio_pecas.pendencia_id` já existe. Quando a troca resolve uma pendência aberta daquele equipamento, permita vincular as duas — e, ao dar baixa numa pendência, ofereça registrar a peça trocada no mesmo fluxo.
- O histórico de peças trocadas do equipamento deve ficar visível (nas manutenções seguintes e na página de Relatórios da Parte 3).

---

## Parte 3 — Página de Relatórios com filtros

Já existe uma `screens/Relatorio.js` (busca cliente → pendências resolvidas). Expanda essa página para o padrão da tela de OS do 8Confirma.

### 3.1 Filtros — todos por seleção, nunca digitação livre

**Regra geral do sistema, vale daqui pra frente:** sempre que um campo tiver um conjunto fixo de valores possíveis (status, tipo de OS, cliente), use **dropdown/seleção com as opções vindas do banco ou de `lib/constantes.js`** — nunca texto livre. Digitar o nome inteiro do cliente toda vez é lento e gera erro de digitação.

Filtros necessários:
- **Cliente** — dropdown com autocomplete puxando `clientes`. **Reaproveite `components/SeletorCliente.js`**, que já existe, em vez de criar outro seletor.
- **Tipo de manutenção** — multi-seleção com os 5 valores de `TIPOS_OS` (`lib/constantes.js`). Como uma OS pode ter mais de um tipo, o filtro tem que casar contra a tabela `os_tipos`.
- **Status** — seleção com os valores de `STATUS_OS`, incluindo o novo `finalizado`.
- **Pendências** — alternador para mostrar só OS que têm pendência **em aberto** daquele cliente.
- **Período** — reaproveite `components/DateRangeFilter.js`, não reimplemente.

### 3.2 Conteúdo

A lista resultante deve mostrar, por OS: número, data/hora, cliente + razão social, descrição, status (com a cor de `corDoStatus`), modalidades. Abrir um resultado leva ao relatório completo da OS (checklist, fotos, medições, peças trocadas, pendências, assinaturas).

Mantenha o que a tela já faz hoje (histórico de pendências **resolvidas** por cliente) — a regra de negócio segue valendo: pendência **aberta** não aparece no relatório, ela vive só dentro da OS.

---

## Parte 4 — Fluxo de finalização e envio ao cliente

Este é o fluxo de revisão do supervisor. Hoje a OS termina em "Concluída" e para por aí.

### 4.1 Fila de revisão

- Quando o técnico faz check-out e a OS fica **`concluida`**, ela entra automaticamente numa fila de revisão, visível **apenas para contas `admin` e `supervisor`** (campo `papel` da tabela `usuarios`).
- Essa fila fica na página de Relatórios (Parte 3), como uma aba/seção própria — ex: "Aguardando revisão".
- Conta de técnico **não vê** essa fila. Garanta isso tanto na UI quanto nas policies de RLS — esconder só na tela não é controle de acesso.

### 4.2 Ações do supervisor

Ao abrir uma OS concluída, o supervisor revisa o relatório completo e tem duas ações:

**Finalizar**
- Status vai para **`finalizado`** (valor criado no Prompt 1).
- Grava `aprovado_supervisor = true`, `aprovado_por` e `aprovado_em` (nomes reais das colunas — ver Prompt 1, seção 1.1).
- Dispara o envio automático do relatório em PDF por e-mail para o cliente (ver 4.3).

**Solicitar correção**
- Status volta para **`andamento`**.
- Campo obrigatório de observação explicando o que precisa ajustar → grava em `ordens_servico.observacao_correcao`.
- Essa observação precisa aparecer **com destaque** pro técnico ao abrir a OS, senão ele não descobre que foi devolvida.

Reflita os dois status novos na lista de OS: cor própria para `finalizado` em `COR_STATUS` (`lib/constantes.js`) e chip de contagem correspondente.

### 4.3 Geração e envio do PDF — LEIA ANTES DE CODAR

**Isso não dá para resolver só no app.** Um PWA não envia e-mail sozinho: precisa de backend e de um provedor de e-mail.

Caminho recomendado:
1. **Supabase Edge Function** que recebe o `os_id`, monta o PDF do relatório (checklist + fotos + medições + peças + assinaturas) e envia por e-mail.
2. Provedor de e-mail (Resend, SendGrid ou similar) — **exige conta e API key do Alexandre**.
3. Guarde o PDF gerado no Supabase Storage e grave o momento do envio em `ordens_servico.enviado_cliente_em`, pra ter rastro de "o relatório foi mandado".

**Antes de implementar, pare e confirme com o Alexandre:** qual provedor de e-mail usar e se ele já tem conta. Não escolha por ele nem deixe uma chave de API inventada no código. Se ele ainda não tiver definido, **implemente todo o fluxo até o ponto de gerar o PDF e deixar disponível para download/compartilhamento manual**, com o envio automático isolado atrás de uma função que fica pronta pra plugar depois. Assim o fluxo de revisão já funciona sem ficar bloqueado.

---

## Fora do escopo deste prompt — não implementar

Estes itens vieram da análise de mercado e **não estão aprovados**. Não comece nenhum deles; se achar que algum é pré-requisito de algo aqui, pergunte antes:

- **Modo offline com fila de sincronização** — é praticamente um projeto à parte. O app hoje chama o Supabase direto em toda ação; fazer offline de verdade exige fila local + reconciliação. Alto valor, esforço grande, merece planejamento próprio.
- **Painel web separado para supervisor** — a fila de revisão da Parte 4 roda dentro do próprio app (que já abre no navegador do computador). Painel web dedicado continua sendo item futuro.
- **Geofence / validação de proximidade no check-in** — bloqueado por dependência: as unidades têm endereço em texto, não coordenadas. Só faz sentido depois de geocodificar.
- **Checklist com lógica condicional** (resposta abre campo extra automaticamente) — esforço médio, prioridade baixa até o checklist em seções estar rodando estável.
- **Destaque visual de itens fora do padrão no checklist** — ideia boa e mais barata que a lógica condicional, mas ainda não aprovada.
- **Lista de colaboradores/técnicos na OS** (tabela `os_tecnicos`, também sem tela) — depende de as 8 contas de usuário existirem primeiro, e o Alexandre já pediu explicitamente pra deixar por último.

---

## Ao terminar

- Rode o app inteiro e confirme que nada quebrou.
- Teste o fluxo de finalização com **duas contas diferentes** (uma técnico, uma admin): o técnico não pode enxergar a fila de revisão nem finalizar OS.
- Teste "Solicitar correção" ponta a ponta: supervisor devolve → técnico abre a OS → vê a observação em destaque.
- Atualize `checklist-implementacao.md` e `schema.sql` se tiver mexido no banco.
- Commits separados por parte (1, 2, 3, 4), não um commit gigante.
