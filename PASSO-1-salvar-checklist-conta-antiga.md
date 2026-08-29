# PASSO 1 — Salvar o checklist da conta antiga do Supabase

> **Faça isto antes de qualquer outra coisa.** É a única parte do projeto que não dá pra
> reconstruir: os 67 itens do checklist "Preventiva Completa GMG" existem só como linhas na
> conta antiga do Supabase. Não tem cópia no repositório, não tem backup, não tem no código.
> Se o acesso àquela conta acabar, esses 67 itens somem e alguém vai ter que redigitar tudo —
> e item de checklist redigitado errado vira procedimento errado em campo.
>
> Leva uns 10 minutos. Só depois disso a gente roda o `prompt-1-banco-de-dados.md`.

---

## Antes de começar: você ainda tem acesso?

Entre em [app.supabase.com](https://app.supabase.com) **com a conta antiga** (o e-mail/login antigo, não o novo) e veja se o projeto do app-geradores ainda aparece na lista.

- **Aparece e abre normalmente** → siga para a Etapa 1.
- **Não aparece / conta bloqueada / projeto pausado** → pule para a seção "Se você perdeu o acesso", no fim deste arquivo.

> Se o projeto aparecer com aviso de **"paused"**, clique em restaurar/*restore* e espere ele
> subir antes de continuar. Projeto pausado não deixa rodar SQL.

---

## Etapa 1 — Conferir que os dados estão lá

No projeto antigo: menu lateral → **SQL Editor** → **New query**. Cole e rode:

```sql
select
  (select count(*) from checklist_templates) as templates,
  (select count(*) from checklist_template_itens) as itens,
  (select count(*) from checklist_template_itens
     where template_id = '55555555-5555-5555-5555-555555555555') as itens_do_template_padrao;
```

**O que você deve ver:** `itens_do_template_padrao` = **67**.

> **✅ RODADO EM 21/08/2026 — resultado real:**
> `templates = 2` · `itens = 72` · `itens_do_template_padrao = **67**`
>
> Os 67 itens do template padrão estão intactos. Além dele existe **um segundo template com
> 5 itens** no banco. A query da Etapa 2 exporta os dois — não precisa fazer nada diferente,
> só saber que o arquivo final vai ter **74 linhas** (2 templates + 72 itens), não 68.

- Se der **erro dizendo que a tabela não existe** → você provavelmente está no projeto errado. Confira na lista de projetos do Supabase.

---

## Etapa 2 — Gerar o arquivo de recuperação

Ainda no **SQL Editor**, abra uma query nova e rode este bloco inteiro:

```sql
with linhas as (
  select 1 as ordem_saida, id::text as chave,
    'insert into checklist_templates (id, nome, descricao, ativo) values ('
    || format('%L::uuid, %L, %L, %L', id, nome, descricao, ativo)
    || ') on conflict (id) do nothing;' as linha
  from checklist_templates
  union all
  select 2, lpad(coalesce(ordem,0)::text, 6, '0') || id::text,
    'insert into checklist_template_itens (id, template_id, grupo, titulo, tipo_resposta, opcoes, unidade, obrigatorio, ordem) values ('
    || format('%L::uuid, %L::uuid, %L, %L, %L, %L::text[], %L, %L, %L',
         id, template_id, grupo, titulo, tipo_resposta, opcoes, unidade, obrigatorio, ordem)
    || ') on conflict (id) do nothing;'
  from checklist_template_itens
)
select linha from linhas order by ordem_saida, chave;
```

Ela não altera nada — só **lê** e devolve uma coluna de texto, uma linha por comando `INSERT`, já na ordem certa (o template primeiro, os itens depois).

**Essa query foi testada:** rodei ela num Postgres de teste com acentos, apóstrofo (`d'água`), campos vazios e opções contendo vírgula e aspas, exportei e reimportei num banco limpo — o resultado voltou idêntico, com os UUIDs preservados. Os UUIDs importam porque o código tem o ID do template fixo:

```js
// app/lib/constantes.js
export const TEMPLATE_PADRAO_ID = '55555555-5555-5555-5555-555555555555';
```

Se o UUID mudar na recriação, o app para de achar o checklist.

### Salvando o resultado

No painel de resultados do Supabase, use o botão de **download** (ícone de seta pra baixo / "Export" → CSV). Salve o arquivo.

Depois, abra o arquivo baixado num editor de texto e salve o conteúdo como:

```
C:\Users\alexa\Documents\app-geradores\seed-checklist.sql
```

Duas coisas ao salvar:
- **Apague a primeira linha** se ela vier escrito só `linha` — é o cabeçalho do CSV, não é comando SQL.
- Se as linhas vierem **entre aspas duplas** (o CSV às vezes faz isso), remova as aspas do começo e do fim de cada linha. Cada linha tem que começar com `insert into` e terminar com `;`.

> **Alternativa se o download der trabalho:** selecione tudo no resultado e copie (Ctrl+A, Ctrl+C) direto pra dentro de um arquivo novo `seed-checklist.sql`. Funciona igual — só confira que as **74 linhas** vieram (2 templates + 72 itens).

> **Sobre o aviso "Limited to only 100 rows":** o painel do Supabase só *mostra* 100 linhas na
> tela, mas o botão **Export** baixa o resultado completo. Como aqui são 74 linhas, está tudo
> dentro do limite de qualquer jeito — nada é cortado.

---

## Etapa 3 — Conferir o arquivo salvo

Abra o `seed-checklist.sql` e confira:

1. As **duas primeiras linhas** começam com `insert into checklist_templates` — os templates vêm antes dos itens. Se estiver invertido, o import vai falhar por causa da chave estrangeira.
2. O total de linhas é **74** (2 templates + 72 itens).
3. O texto `55555555-5555-5555-5555-555555555555` aparece numa das duas primeiras linhas.
4. Os acentos estão certos: procure por "Verificações" ou "Medições" e veja se não virou `VerificaÃ§Ãµes`. Se tiver virado, salve o arquivo de novo escolhendo a codificação **UTF-8**.

---

## Etapa 4 — Enquanto está lá, salve o resto (5 minutos a mais)

O checklist é o único item insubstituível, mas já que você está dentro da conta antiga, vale levar o resto junto. Só que **CSV é mais que suficiente** aqui — esses dados não têm array nem UUID travado no código.

No SQL Editor, rode uma por vez e baixe o CSV de cada:

```sql
select * from unidades;
```
```sql
select * from equipamentos;
```
```sql
select * from pendencias;
```

Salve os três como `unidades.csv`, `equipamentos.csv` e `pendencias.csv` na mesma pasta do projeto.

**Por que vale a pena:** as unidades e os geradores que você cadastrou testando (endereço, tag, fabricante, potência) sumiriam junto com a conta. Não é crítico — dá pra recadastrar — mas custa 5 minutos agora e economiza digitação depois.

**O que NÃO precisa exportar:**
- `clientes` — já temos os 107 no `clientes-genforce.csv`
- `ordens_servico`, `checklist_respostas`, `fotos` — são OS de teste, não têm valor
- `usuarios` / `auth.users` — as contas vão ser recriadas no banco novo mesmo

---

## Etapa 5 — Me avisar

Quando os arquivos estiverem na pasta `C:\Users\alexa\Documents\app-geradores\`, me manda uma mensagem dizendo:

- se conseguiu exportar (e quantos itens vieram), **ou**
- que não tem mais acesso à conta antiga.

A partir daí seguimos pro `prompt-1-banco-de-dados.md`, que vai usar o `seed-checklist.sql` pra recriar o checklist no banco novo com os mesmos UUIDs.

---

## Se você perdeu o acesso à conta antiga

Não é o fim do mundo, mas dá trabalho: os 67 itens vão precisar ser redigitados.

Antes de aceitar isso, tente nesta ordem:

1. **Recuperação de senha** no e-mail antigo da conta Supabase.
2. **Outro membro da organização** — se a conta antiga era de organização, alguém mais pode ter acesso.
3. **Suporte do Supabase** — se o projeto foi deletado há pouco tempo, às vezes ainda dá pra restaurar.
4. **O próprio 8Confirma** — o checklist deles tem a mesma estrutura de seções. Se você conseguir tirar um print ou exportar um relatório de OS preenchido de lá, dá pra reconstruir a lista de itens a partir disso, seção por seção.

Se nada funcionar, me avisa que eu monto a estrutura das 7 seções (que já tenho confirmada pelos prints do 8Confirma) e você me passa os itens de cada uma. **Eu não vou inventar item de checklist de manutenção de gerador** — isso vira procedimento errado em campo, e o custo de um item errado é muito maior que o de digitar.
