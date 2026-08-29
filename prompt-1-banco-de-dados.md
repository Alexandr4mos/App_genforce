# PROMPT 1 — Recriar o banco de dados do zero (Supabase novo, via MCP)

> **Rode este prompt PRIMEIRO e sozinho.** Enquanto o banco não existir, o app não sobe e
> nenhum dos outros dois prompts pode ser testado. Não misture com os prompts 2 e 3.

---

Você está trabalhando no app **Genforce** — Expo/React Native + Supabase, publicado como PWA, para gestão de manutenção de geradores (GMG) da empresa Genforce Engenharia. O app está em `app/` dentro deste repositório.

**Contexto crítico:** a conta do Supabase foi trocada. O projeto novo está **vazio** — nenhuma tabela, nenhum dado, nenhum usuário. Você tem acesso ao Supabase via **MCP**; use as ferramentas do MCP para executar o SQL e verificar o resultado, não peça pro usuário copiar e colar no SQL Editor.

**Projeto de destino (confirme ANTES de rodar qualquer coisa):**

| | |
|---|---|
| Organização | `Alexandr4mos's Org` |
| Projeto | `App-genforce` |
| **Project ref** | **`dfpmhqsqksewcjexrmhg`** |
| URL da API | `https://dfpmhqsqksewcjexrmhg.supabase.co` |
| Região | South America (São Paulo) — `sa-east-1` |

**Primeira ação obrigatória:** confirme via MCP que você está conectado nesse ref e que o banco está vazio. Se aparecer qualquer tabela do app (`clientes`, `ordens_servico`, `checklist_template_itens`), **PARE imediatamente** — você está no projeto ERRADO. O projeto antigo tem ref `efcasyqjycnonobbgmir` e contém dados de produção que não podem ser tocados.

Antes de começar, leia estes arquivos do repositório:

- `schema.sql` — schema de referência, mas **NÃO é a verdade**. Em 23/08 o banco antigo foi inspecionado e está **à frente** deste arquivo: tem a tabela `equipamento_filtros`, a coluna `fotos.pendencia_id` (que o app USA) e quatro campos de aprovação em `ordens_servico` que o arquivo não registra. **A seção 1 deste prompt é a fonte da verdade** — ela já incorpora tudo isso. Onde os dois divergirem, siga este prompt.
- `migracao-01-tipos-e-agendado.sql` — **NÃO RODE ESTE ARQUIVO.** É a migração aplicada no banco ANTIGO, e ela mexe numa coluna (`ordens_servico.tipo`) que o banco novo nem vai ter. O banco novo nasce pronto, sem migração nenhuma. O arquivo fica no repositório só como registro histórico.
- `requisitos-app.md` e `checklist-implementacao.md` — histórico das decisões de produto.
- `clientes-genforce.csv` — 107 clientes reais da Genforce, prontos pra carga inicial.

## Objetivo

Criar, do zero e via MCP, o banco completo já no estado final que o app precisa hoje — sem deixar dívida de migração pra depois.

---

## 1. Schema

Recrie todas as tabelas de `schema.sql`, **com estas correções e adições obrigatórias**:

### 1.1 `ordens_servico`

- A coluna `tipo` (texto único) **não deve existir**. Foi substituída pela tabela `os_tipos`. Não crie essa coluna nem como opcional — o app não escreve mais nela.
- `status text not null default 'pendente'`, com os valores usados pelo app:
  `agendado` | `pendente` | `andamento` | `pausada` | `concluida` | `finalizado`
  O valor `finalizado` é novo — é o status que o supervisor aplica ao aprovar a OS (ver Prompt 3). Já deixe previsto agora.
- Campos do fluxo de aprovação do supervisor (Prompt 3). **Os quatro primeiros já existem no banco antigo — use exatamente estes nomes, não invente `finalizado_por`/`finalizado_em`:**
  - `aprovado_supervisor boolean default false`
  - `aprovado_por uuid references usuarios(id)`
  - `aprovado_em timestamptz`
  - `enviado_cliente_em timestamptz` — quando o relatório foi enviado por e-mail ao cliente
  - `observacao_correcao text` — **este é novo**: o que o supervisor escreve ao devolver a OS pro técnico pedindo ajuste
- Adicione `numero_legado int unique` — o número da OS no 8Confirma (ex: 9755, 10213), usado pelo seed de histórico. A coluna `numero` (serial) continua gerando o número novo normalmente; os dois convivem sem brigar com a sequence.
- Adicione `importado boolean default false` — marca as OS trazidas do 8Confirma como histórico. A lista de OS deve poder filtrar essas (elas não têm gerador nem checklist).
- **NÃO** crie campo de prioridade: confirmado com o Alexandre em 22/08 que a Genforce usa sempre "Normal", então o campo não tem função.
- Mantenha `km_saida` e `km_retorno` (já existem no schema antigo) — no 8Confirma esses campos aparecem como "Deslocamento de Saída" e "Deslocamento de Retorno", em Km, no fim do relatório.

### 1.2 `os_tipos` (tabela nova, já no schema inicial)

Uma OS pode ter mais de um tipo/modalidade ao mesmo tempo (ex: "Teste com Carga Programado" + "Manutenção Preventiva" juntos).

```sql
create table os_tipos (
  os_id uuid references ordens_servico(id) on delete cascade,
  tipo text not null,
  primary key (os_id, tipo)
);
create index idx_os_tipos_os on os_tipos(os_id);
```

Valores usados pelo app (batem com `app/lib/constantes.js`, não invente outros):
`atendimento_emergencia` | `manutencao_corretiva` | `visita_tecnica` | `teste_carga_programado` | `manutencao_preventiva`

### 1.3 `clientes`

Mantenha as colunas existentes (`nome`, `razao_social`, `cnpj`, `endereco`, `telefone`, `email`, `ativo`).
**Observação:** a coluna `email` **já existe** no schema antigo — não precisa criar, mas confirme que ela está lá, porque o envio automático do relatório (Prompt 3) depende dela.

Adicione: `cidade text` e `uf text` (o CSV de carga já traz esses dois separados).

### 1.4 `equipamentos`

Mantenha todos os campos técnicos que já existem no schema (`tag`, `fabricante_gmg`, `modelo_alternador`, `n_serie_alternador`, `tensao`, `potencia_kva`, `fabricante_motor`, `modelo_motor`, `n_serie_motor`, `tipo_gmg`, `fabricante_alternador`).

Adicione estes:
- `placa_motor text`, `placa_alternador text` e `data_inicio_contrato date` — **já existem no banco antigo real**, só faltam no `schema.sql`. `NovaOS.js` e `EditarOS.js` gravam nas duas placas, então sem elas o cadastro de gerador quebra.
- `n_serie_gmg text` e `ano_fabricacao int` — **descobertos em 22/08** no export de equipamentos do 8Confirma (`conferir-geradores.xlsx`, aba "Fichas Técnicas"), que traz esses dois campos para os 298 geradores. São novos; crie agora para não precisar migrar depois.

### 1.4b `equipamento_filtros` (tabela, não colunas)

A numeração dos filtros fica em **tabela própria**, não em colunas de `equipamentos`. Este desenho já existe no banco antigo e vamos mantê-lo — um GMG pode ter mais de um filtro do mesmo tipo, e cada um comporta uma observação (ex: "aceita equivalente X").

```sql
create table equipamento_filtros (
  id uuid primary key default uuid_generate_v4(),
  equipamento_id uuid references equipamentos(id) on delete cascade,
  tipo_filtro text not null,   -- 'oleo' | 'combustivel' | 'ar' | 'separador'
  numero_peca text not null,   -- o código da peça
  observacao text
);
create index idx_equipamento_filtros_equip on equipamento_filtros(equipamento_id);
```

**Não crie colunas `filtro_oleo`/`filtro_combustivel`/`filtro_ar`/`filtro_separador` em `equipamentos`** — seriam um segundo desenho para a mesma coisa.

### 1.5 `relatorio_pecas`

Mantenha como está no schema, e adicione `codigo_peca text` — o código/número de série da peça específica trocada, não só o nome genérico ("Filtro de óleo"). Filtro errado em GMG é problema real de compatibilidade por modelo, e o código exato é o que comprova pro cliente qual peça foi usada.

### 1.5b `fotos` — coluna que o app usa e o schema.sql não tem

```sql
pendencia_id uuid references pendencias(id) on delete cascade
```

**Isto NÃO é opcional.** `screens/OSDetail.js` lê e grava nessa coluna em 4 lugares (linhas ~174, 177, 178 e 566) para anexar foto a uma pendência. Se a tabela `fotos` for recriada a partir do `schema.sql`, que não tem essa coluna, **a foto em pendência quebra na primeira tentativa de uso**.

### 1.6 Demais tabelas

`unidades`, `usuarios`, `checklist_templates`, `checklist_template_itens`, `os_tecnicos`, `os_equipamentos`, `checklist_respostas`, `fotos`, `pendencias`, `assinaturas` — recrie exatamente como estão em `schema.sql`, com os mesmos índices.

Confirme especialmente que `checklist_template_itens.grupo` existe: é essa coluna que vai alimentar a divisão do checklist em seções (Prompt 2), então ela é obrigatória.

---

## 2. Storage

Crie os buckets do Supabase Storage que o app usa para fotos (o código em `OSDetail.js` faz upload de fotos de checklist e de pendências — verifique no código qual nome de bucket ele espera e crie com esse nome exato, com as policies necessárias pra usuário autenticado ler e escrever).

O Prompt 2 vai adicionar upload de imagem de assinatura — já deixe o bucket preparado pra isso também.

---

## 3. RLS (Row Level Security)

Ative RLS em todas as tabelas e crie policies. Regra de negócio da equipe (4 técnicos + 3 admin — ver 4.2):

- **Técnico:** lê e escreve nas OS em que está alocado (`os_tecnicos`), e lê clientes/unidades/equipamentos/templates.
- **Supervisor e admin:** leem e escrevem tudo.
- Ninguém sem autenticação acessa nada.

Se por qualquer motivo uma policy completa travar o desenvolvimento agora, prefira uma policy permissiva para usuário autenticado **e deixe um comentário `-- TODO RLS:` explícito no SQL dizendo o que falta apertar** — nunca deixe a tabela sem RLS e sem aviso.

### ⚠️ Por que RLS aqui não é opcional

**Precedente real:** o banco ANTIGO foi auditado em 23/08 e as 16 tabelas estavam com `rowsecurity = false` e **zero policies** — ou seja, totalmente abertas. Não repita isso aqui.

Este projeto foi criado com **"Automatically expose new tables" LIGADO** e **"Enable automatic RLS" DESLIGADO**. Ou seja: toda tabela nova nasce publicada na API REST **sem nenhuma proteção**, até você habilitar RLS nela explicitamente.

E o app é um **PWA** — a `anon key` fica embutida no JavaScript que roda no navegador do usuário, então qualquer pessoa consegue extrair essa chave. **RLS é a única coisa protegendo os dados**, não a chave.

Sem RLS, qualquer um com a chave lê os 107 clientes, as OS e os endereços das unidades — e pode apagar tudo.

Por isso, **ao final, rode esta conferência e mostre o resultado**:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
```

**Toda linha tem que vir com `rowsecurity = true`.** Qualquer tabela com `false` é uma porta aberta — corrija antes de dar a tarefa por concluída.

Rode também `select * from pg_policies where schemaname = 'public';` e confirme que cada tabela tem ao menos uma policy. Tabela com RLS ligado e **zero policy** bloqueia tudo, inclusive o app — o que quebra o login em vez de proteger.

---

## 4. Carga inicial de dados (seed)

### 4.1 Clientes — pronto pra rodar

Importe os **107 clientes** de `clientes-genforce.csv` para a tabela `clientes`.

- Colunas do CSV: `codigo,nome,razao_social,endereco,cidade,uf`
- O `codigo` é o ID do sistema antigo (8Confirma). Guarde-o em uma coluna `codigo_legado int` em `clientes` — ajuda a conferir a migração depois e a não duplicar cliente numa importação futura.
- `cnpj`, `telefone` e `email` vêm vazios (o PDF de origem não trazia esses dados) — vão ser preenchidos manualmente depois.
- Não crie unidades automaticamente para esses clientes. A unidade é cadastrada na hora de criar a primeira OS.

### 4.1b Histórico de Ordens de Serviço — `seed-os-historico.sql`

Se o arquivo `seed-os-historico.sql` existir na raiz do repositório, rode-o **depois** de importar os clientes. São 100 OS reais exportadas do 8Confirma (03/08 a 28/08/2026), trazidas como histórico de consulta por decisão do Alexandre em 22/08.

Elas são incompletas de propósito e isso é esperado: vêm **sem unidade e sem equipamento**, porque o export do 8Confirma não traz esses campos. Consequência: não têm checklist, fotos nem pendências. Por isso vão marcadas com `importado = true`.

**Isso tem impacto no app** — garanta que as telas não quebrem com uma OS sem equipamento vinculado:
- a lista de OS deve renderizar o card normalmente (sem chip de equipamento);
- abrir uma dessas OS não pode dar erro por não achar `os_equipamentos` — mostre um aviso do tipo "OS importada do sistema antigo, sem checklist" em vez de tela vazia ou crash.

Confira depois de rodar: `select status, count(*) from ordens_servico where importado group by 1` deve dar finalizado 46, agendado 25, concluida 19, andamento 9, pendente 1.

### 4.2 Usuários da equipe

A equipe da Genforce são **7 pessoas** (informado em 22/08 — corrige o "8 contas" que aparecia antes nos documentos):

| Nome | Papel | E-mail |
|---|---|---|
| Alexandre Luiz | `admin` | alexandreluiz2002@gmail.com |
| Valdemar | `admin` | *pendente* |
| André Luiz | `admin` | *pendente* |
| Marcos | `tecnico` | *pendente* |
| Marcelo | `tecnico` | *pendente* |
| Márcio | `tecnico` | *pendente* |
| Wesley | `tecnico` | *pendente* |

**Crie AGORA apenas a conta do Alexandre**, com `papel = 'admin'`. É o suficiente para testar o app inteiro.

As outras 6 ficam pendentes até o Alexandre passar os e-mails (ele vai levantar durante a semana). **Não invente e-mail** — sem e-mail real não dá pra criar conta no `auth.users`, e conta com e-mail fictício não é recuperável depois.

Duas observações sobre os papéis:
- Os três primeiros foram descritos como "admin/supervisor". Como no desenho de RLS deste prompt **supervisor e admin têm exatamente as mesmas permissões** (leem e escrevem tudo), estão todos como `admin`. Se mais pra frente o supervisor passar a ter permissão diferente do admin, aí sim vale separar — nesse momento não muda nada.
- Ninguém está como `papel = 'supervisor'` por enquanto. O valor continua válido no schema, só não está em uso.

### 4.3 Template de checklist — `seed-checklist.sql`

O app depende de um template chamado **"Preventiva Completa GMG" com 67 itens**, cujo UUID está fixo no código:

```js
// app/lib/constantes.js
export const TEMPLATE_PADRAO_ID = '55555555-5555-5555-5555-555555555555';
```

**Por isso os UUIDs do seed não podem ser alterados** — se o id do template mudar, o app para de achar o checklist. Não gere UUIDs novos ao importar.

Esses itens existiam só na conta antiga do Supabase e já foram resgatados em 21/08. O que fazer:

1. **O arquivo `seed-checklist.sql` já existe na raiz do repositório** — foi exportado da conta antiga em 21/08 e testado importando num banco limpo. Ele traz **2 templates e 72 itens**: o "Preventiva Completa GMG" (`55555555-…`) com os 67 itens, e um "Preventiva Mensal GMG" (`44444444-…`) com 5. Os UUIDs originais estão preservados.
2. **Rode-o no banco novo depois de criar as tabelas.** Confira ao final que `select count(*) from checklist_template_itens where template_id = '55555555-5555-5555-5555-555555555555'` retorna **67**, e que `select count(*) from checklist_template_itens` retorna **72**.
3. **Se o arquivo NÃO existir:** pare e pergunte ao Alexandre antes de seguir — não crie o banco sem o checklist e não invente os itens. Se ele confirmar que o acesso à conta antiga se perdeu, os 67 itens vão precisar ser redigitados; nesse caso, use como base a estrutura de seções que o 8Confirma usa (confirmada por print do app real), preenchendo o campo `grupo` de cada item com uma destas seções:
   - `Verificações: Mecânica / Sistema de Arrefecimento / Sistema Combustível`
   - `Verificações: Sistema Elétrico / Sistema de Transferência / Sistema de Proteção`
   - `Verificações Gerais`
   - `Medições de Grandezas Elétricas (AC) / Mecânicas GMG — SEM CARGA`
   - `Medições de Grandezas Elétricas (AC) / Mecânicas GMG — COM CARGA`
   - `Medições de Grandezas Elétricas (DC) GMG`

   E **peça ao Alexandre a lista dos 67 itens** — não invente itens de checklist de manutenção de gerador. Item de checklist errado vira procedimento errado em campo.

---

## 5. Conectar o app ao banco novo

- Atualize `app/.env` com a URL e a anon key do projeto novo.
- Confira `app/lib/supabase.js` — se a chave estiver hardcoded em algum lugar em vez de vir do `.env`, corrija.
- Confirme que `.env` está no `.gitignore` (não commite chave).

---

## 6. Verificação antes de dar por pronto

Não considere a tarefa concluída sem rodar estes testes de fumaça, via MCP ou rodando o app:

1. Você está no projeto `dfpmhqsqksewcjexrmhg` (não no `efcasyqjycnonobbgmir`).
2. `select count(*) from clientes` retorna 107.
3. Login com a conta do Alexandre funciona.
4. Criar uma OS pela tela "Nova OS" salva sem erro, com **dois tipos marcados ao mesmo tempo**, e gera 2 linhas em `os_tipos`.
5. A lista de OS carrega e mostra os tipos da OS criada.
6. Marcar uma OS como `agendado` faz a borda do card ficar azul.
7. Abrir uma OS e fazer check-in grava `checkin_em`, `checkin_lat` e `checkin_lng`.
8. O checklist carrega os itens do template (esse teste só passa depois de resolver o item 4.3).
9. `select count(*) from ordens_servico where importado` retorna 100, e abrir uma delas no app não quebra a tela de detalhe.

Ao final, **atualize o `schema.sql` do repositório** para refletir exatamente o banco que você criou — ele é a documentação do projeto e não pode continuar desatualizado.

Os seeds de checklist (`seed-checklist.sql`) e de OS (`seed-os-historico.sql`) já existem e não precisam ser reescritos. Gere apenas um `seed-clientes.sql` a partir do `clientes-genforce.csv`, para que o banco inteiro possa ser recriado no futuro só com arquivos do repositório, sem depender de nenhuma conta do Supabase.

---

## O que NÃO fazer neste prompt

- Não altere nenhuma tela do app além do necessário para conectar no banco novo (`.env` / `supabase.js`). Ajustes de UI e features novas são os Prompts 2 e 3.
- Não invente dados: nem e-mails de usuário, nem itens de checklist, nem CNPJs.
- Não deixe migração pendente: o banco tem que nascer no estado final.
