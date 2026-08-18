# Especificação de Implementação — Filtro de Período com Date Range Picker

## Instrução para a IA desenvolvedora

Implemente no aplicativo o mecanismo de seleção de período descrito neste documento.

O objetivo não é apenas reproduzir a aparência visual do calendário, mas reproduzir corretamente:

- os estados;
- as interações;
- as regras de datas;
- os presets;
- a seleção personalizada de intervalo;
- a navegação entre meses e anos;
- a sincronização com os dados da tela;
- loading, vazio e erros;
- proteção contra respostas antigas de requisições concorrentes.

Quando algum detalhe visual do aplicativo atual conflitar com esta especificação, preserve o design system existente do projeto, mas mantenha o comportamento funcional descrito aqui.

---

# 1. Nome do recurso

**Filtro de Período com Presets e Date Range Picker Personalizado**

Nome técnico em inglês:

**Date Range Filter with Presets + Calendar Date Range Picker**

---

# 2. Objetivo

Permitir que o usuário filtre os dados da tela por um intervalo de datas.

O usuário pode escolher entre períodos rápidos:

- Hoje
- Ontem
- Amanhã
- Mês Atual
- Mês Anterior
- Próximo Mês
- Personalizado

No modo **Personalizado**, o usuário escolhe:

1. data inicial;
2. data final.

Após a segunda seleção, o intervalo é aplicado automaticamente.

---

# 3. Estrutura geral do fluxo

```text
Filtro de período
      ↓
Bottom Sheet de presets
      ↓
┌───────────────────────────────┐
│ Hoje                          │
│ Ontem                         │
│ Amanhã                        │
│ Mês Atual                     │
│ Mês Anterior                  │
│ Próximo Mês                   │
│ Personalizado                 │
└───────────────────────────────┘
      ↓
Preset rápido
OU
Calendário personalizado
      ↓
startDate + endDate
      ↓
Atualização do estado global
      ↓
Loading
      ↓
Consulta dos dados
      ↓
Atualização de contadores/lista
```

---

# 4. Estado inicial

Ao abrir a tela, utilizar o preset padrão definido pelo produto.

Na referência analisada, o padrão era:

```text
preset = TODAY
startDate = today
endDate = today
```

Exemplo:

```text
Hoje
14 AGO 2026
```

Não codificar a data da referência.

Sempre calcular dinamicamente a data atual.

---

# 5. Abertura do filtro

Quando o usuário tocar no controle de período:

1. manter a tela atual ao fundo;
2. aplicar overlay escuro;
3. abrir uma Bottom Sheet;
4. exibir os presets disponíveis.

Estado:

```text
PRESET_MENU_OPEN
```

---

# 6. Presets

## Hoje

```text
startDate = today
endDate = today
```

## Ontem

```text
date = today - 1 day

startDate = date
endDate = date
```

## Amanhã

```text
date = today + 1 day

startDate = date
endDate = date
```

## Mês Atual

```text
startDate = startOfMonth(today)
endDate = endOfMonth(today)
```

## Mês Anterior

```text
reference = addMonths(today, -1)

startDate = startOfMonth(reference)
endDate = endOfMonth(reference)
```

## Próximo Mês

```text
reference = addMonths(today, 1)

startDate = startOfMonth(reference)
endDate = endOfMonth(reference)
```

### Regra importante

Nunca implementar "mês anterior" ou "próximo mês" usando valores fixos como:

```text
today - 30 days
today + 30 days
```

Utilizar operações reais de calendário.

---

# 7. Seleção de preset

Fluxo:

```text
Usuário toca em um preset
→ calcular startDate/endDate
→ atualizar selectedPreset
→ fechar Bottom Sheet
→ atualizar label do filtro
→ atualizar estado global
→ iniciar loading
→ buscar novos dados
→ atualizar toda a tela dependente do período
```

Exemplo:

```text
selectedPreset = YESTERDAY
startDate = 2026-08-13
endDate = 2026-08-13
```

---

# 8. Modo Personalizado

Quando o usuário tocar em:

```text
Personalizado
```

executar:

```text
fechar Bottom Sheet
→ abrir calendário mensal
```

O calendário deve permitir selecionar um intervalo.

---

# 9. Estrutura visual do calendário

Exemplo:

```text
‹        agosto 2026        ›

dom seg ter qua qui sex sáb

26 27 28 29 30 31  1
 2  3  4  5  6  7  8
 9 10 11 12 13 14 15
16 17 18 19 20 21 22
23 24 25 26 27 28 29
30 31  1  2  3  4  5
```

Características:

- um mês por vez;
- mês e ano no cabeçalho;
- botão para mês anterior;
- botão para próximo mês;
- dias da semana em pt-BR;
- dias de meses adjacentes podem aparecer para completar a grade;
- dias adjacentes devem possuir diferenciação visual.

---

# 10. Navegação entre meses

Botão anterior:

```text
visibleMonth = addMonths(visibleMonth, -1)
```

Botão próximo:

```text
visibleMonth = addMonths(visibleMonth, 1)
```

A biblioteca de datas deve tratar automaticamente:

```text
dezembro 2026 → janeiro 2027
janeiro 2027 → dezembro 2026
```

Não implementar controle manual de mês sem considerar o ano.

---

# 11. Seleção personalizada — primeira data

Quando o calendário estiver aguardando uma nova seleção e o usuário tocar em uma data:

```text
draftStartDate = clickedDate
draftEndDate = null
rangeSelectionState = SELECTING_END
```

Visualmente:

- remover o destaque completo do intervalo anterior;
- destacar a nova data inicial;
- manter o calendário aberto;
- aguardar a segunda data.

Fluxo:

```text
Usuário toca 01/08
→ 01/08 passa a ser o início
→ calendário continua aberto
→ sistema aguarda a data final
```

---

# 12. Seleção personalizada — segunda data

Quando:

```text
rangeSelectionState == SELECTING_END
```

e o usuário tocar em uma segunda data válida:

```text
draftEndDate = clickedDate
```

Depois:

```text
appliedRange.start = draftStartDate
appliedRange.end = draftEndDate

selectedPreset = CUSTOM
```

Então:

```text
destacar intervalo
→ aplicar seleção
→ fechar calendário automaticamente
→ atualizar label
→ atualizar estado global
→ iniciar loading
→ buscar dados
```

Não há botão **Aplicar** no comportamento de referência.

A segunda data completa e aplica o intervalo automaticamente.

---

# 13. Destaque do intervalo

Exemplo:

```text
startDate = 01/08/2026
endDate   = 08/08/2026
```

Representação conceitual:

```text
[ 01 ][──02──03──04──05──06──07──][ 08 ]
```

Regras visuais:

- data inicial com destaque forte;
- data final com destaque forte;
- datas intermediárias com fundo contínuo;
- extremidade inicial arredondada à esquerda;
- extremidade final arredondada à direita;
- intervalo visualmente contínuo.

---

# 14. Intervalo inclusivo

O intervalo deve incluir as duas extremidades.

Exemplo:

```text
01/08 → 08/08
```

inclui:

```text
01
02
03
04
05
06
07
08
```

---

# 15. Segunda data anterior à primeira

Esse comportamento não foi determinado com segurança pela referência.

Implementação recomendada:

```text
Se o usuário selecionar uma data anterior ao draftStartDate
→ considerar essa data como um novo início
→ draftEndDate = null
→ continuar aguardando uma data final
```

Exemplo:

```text
primeiro toque: 20/08
segundo toque: 10/08

resultado:
draftStartDate = 10/08
draftEndDate = null
```

Se o produto já tiver uma regra diferente definida, priorizar a regra existente.

---

# 16. Estado aplicado x estado temporário

Separar explicitamente:

```text
appliedRange
```

de:

```text
draftRange
```

Modelo:

```text
appliedRange = {
    start,
    end
}

draftRange = {
    start,
    end
}
```

Isso evita alterar o filtro real quando o usuário ainda está no meio de uma seleção.

---

# 17. Modelo de estado recomendado

```text
DateFilterState {
    mode

    selectedPreset

    referenceDate

    appliedRange {
        start
        end
    }

    draftRange {
        start
        end
    }

    calendar {
        visibleMonth
        visibleYear
    }

    rangeSelectionState

    ui {
        presetMenuOpen
        calendarOpen
    }

    query {
        loading
        error
    }

    timezone

    minDate?
    maxDate?
}
```

---

# 18. Valores possíveis

## mode

```text
PRESET
CUSTOM
```

## selectedPreset

```text
TODAY
YESTERDAY
TOMORROW
CURRENT_MONTH
PREVIOUS_MONTH
NEXT_MONTH
CUSTOM
```

## rangeSelectionState

```text
IDLE
SELECTING_END
COMPLETE
```

---

# 19. Aplicação do filtro

Sempre que o intervalo aplicado mudar:

```text
appliedRange
→ atualizar estado global
→ invalidar consulta anterior
→ entrar em loading
→ consultar dados
→ atualizar componentes dependentes
```

O componente de data deve funcionar como um filtro global da tela.

Exemplo:

```text
DateRangeFilter
       ↓
Global Filter State
       ↓
Query / Repository
       ↓
Backend/API
       ↓
Dashboard + Lista + Contadores
```

---

# 20. Integração com backend

O backend deve preferencialmente receber datas absolutas.

Exemplo:

```http
GET /appointments?start_date=2026-08-01&end_date=2026-08-08
```

ou:

```json
{
  "startDate": "2026-08-01",
  "endDate": "2026-08-08"
}
```

Evitar enviar apenas:

```text
CURRENT_MONTH
```

se não houver necessidade.

O frontend resolve o preset para datas concretas antes da consulta.

---

# 21. Responsabilidades do frontend

Devem funcionar localmente:

- renderização do calendário;
- navegação entre meses;
- cálculo dos presets;
- seleção de intervalo;
- destaque visual;
- cálculo de início/fim de mês;
- fevereiro;
- ano bissexto;
- formatação;
- pt-BR;
- controle do modal;
- estado temporário.

Navegar entre meses não deve disparar consulta ao backend.

A consulta só deve acontecer quando o **intervalo aplicado** mudar.

---

# 22. Loading

Após alteração do período:

```text
período aplicado
→ loading
→ consulta
→ resultados
```

Durante loading:

- mostrar skeleton ou indicador equivalente ao design atual;
- não apresentar dados antigos como se fossem do novo período.

---

# 23. Estado vazio

Quando:

```text
request success
AND
results.length == 0
```

mostrar estado vazio.

Exemplo:

```text
Nenhum resultado encontrado.
```

Diferenciar claramente:

```text
LOADING
EMPTY
ERROR
LOADED
```

---

# 24. Erro

Embora o erro não tenha sido demonstrado na referência, a implementação deve prever:

```text
ERROR
```

Com possibilidade de:

- mensagem adequada;
- retry;
- preservação do intervalo selecionado.

---

# 25. Concorrência de requisições

Evitar race condition.

Exemplo:

```text
Usuário seleciona Agosto
→ Request A inicia

Usuário seleciona Setembro
→ Request B inicia

Request B termina
→ Setembro é exibido

Request A termina depois
→ resposta A NÃO pode sobrescrever Setembro
```

Implementar uma das estratégias:

- cancelamento da requisição anterior;
- AbortController;
- query key;
- requestId/version;
- biblioteca de query com invalidação apropriada.

Exemplo conceitual:

```text
currentQueryId = 18

if response.queryId == currentQueryId:
    aceitar resposta
else:
    ignorar resposta
```

---

# 26. Timezone

Definir explicitamente qual timezone determina:

```text
Hoje
Ontem
Amanhã
Mês Atual
```

Evitar usar UTC implicitamente.

A aplicação deve ter uma fonte clara:

```text
calendarTimezone
```

Possibilidades:

- timezone do usuário;
- timezone da empresa;
- timezone do estabelecimento;
- timezone definido pela aplicação/backend.

Usar a regra já existente no projeto.

Se ainda não existir uma regra, tornar o timezone configurável.

---

# 27. Virada do dia

O componente deve continuar correto se a aplicação permanecer aberta durante a mudança de dia.

Exemplo:

```text
23:59 → 00:00
```

Se o preset ativo for relativo, como `TODAY`, decidir conforme arquitetura existente se:

- recalcula automaticamente;
- recalcula ao atualizar;
- recalcula ao reabrir a tela.

Não congelar uma data antiga indefinidamente sem intenção.

---

# 28. Fevereiro e ano bissexto

Usar biblioteca real de datas.

Regras:

```text
2027:
28/02 → 01/03

2028:
28/02 → 29/02 → 01/03
```

Não implementar manualmente quantidade de dias por mês.

---

# 29. Datas mínima e máxima

O mecanismo deve aceitar configuração opcional:

```text
minDate?: Date
maxDate?: Date
```

Não criar limites arbitrários se o produto ainda não os definiu.

---

# 30. Reabertura do personalizado

Ao abrir novamente o modo personalizado:

- exibir o intervalo atualmente aplicado, caso o preset ativo seja `CUSTOM`;
- posicionar o calendário em um mês relevante ao intervalo;
- permitir iniciar nova seleção.

Ao tocar em uma nova data:

```text
intervalo anterior deixa de ser a seleção em edição
→ nova data vira draftStartDate
→ sistema aguarda novo final
```

---

# 31. Pseudocódigo geral

## Inicialização

```text
onScreenOpen():

    referenceDate = getCurrentDate(calendarTimezone)

    if no persisted filter:
        selectedPreset = TODAY
        appliedRange = {
            start: referenceDate,
            end: referenceDate
        }

    fetchData(appliedRange)
```

## Abrir filtro

```text
onDateFilterClick():

    ui.presetMenuOpen = true
```

## Selecionar preset

```text
onPresetSelected(preset):

    if preset == CUSTOM:
        ui.presetMenuOpen = false
        openCustomCalendar()
        return

    range = calculatePreset(
        preset,
        getCurrentDate(calendarTimezone)
    )

    selectedPreset = preset
    appliedRange = range

    ui.presetMenuOpen = false

    refreshData(range)
```

## Abrir personalizado

```text
openCustomCalendar():

    if selectedPreset == CUSTOM:
        draftRange = appliedRange
        calendar.visibleMonth = appliedRange.start
    else:
        draftRange = null
        calendar.visibleMonth = appliedRange.start

    rangeSelectionState = IDLE
    ui.calendarOpen = true
```

## Selecionar data

```text
onCalendarDateClick(date):

    if rangeSelectionState != SELECTING_END:

        draftRange.start = date
        draftRange.end = null

        rangeSelectionState = SELECTING_END

        return
```

## Segunda seleção

```text
if date >= draftRange.start:

    draftRange.end = date

    appliedRange = draftRange

    selectedPreset = CUSTOM

    rangeSelectionState = COMPLETE

    ui.calendarOpen = false

    refreshData(appliedRange)
```

## Segunda data anterior

```text
else:

    draftRange.start = date
    draftRange.end = null

    rangeSelectionState = SELECTING_END
```

---

# 32. Serviço conceitual de datas

Criar ou utilizar uma camada equivalente a:

```text
DateRangeService
```

Responsável por:

```text
resolveToday()
resolveYesterday()
resolveTomorrow()
resolveCurrentMonth()
resolvePreviousMonth()
resolveNextMonth()
validateRange()
```

Evitar espalhar lógica de calendário pelos componentes visuais.

---

# 33. Estrutura recomendada dos componentes

```text
DateRangeFilter
│
├── DateFilterTrigger
│
├── PresetBottomSheet
│
└── CalendarRangePicker
    │
    ├── CalendarHeader
    ├── WeekdayHeader
    ├── MonthGrid
    └── DayCell
```

Separar apresentação, estado e regras.

---

# 34. Biblioteca vs desenvolvimento próprio

Preferência:

**utilizar uma biblioteca madura de calendário/date range e customizar sua aparência.**

Pesquisar por:

```text
date range picker
calendar date range picker
date range picker with presets
preset date range filter
mobile date range picker
custom date range picker
calendar range selection
date range picker bottom sheet
```

Evitar implementar manualmente o motor de calendário se o framework já oferecer solução robusta.

---

# 35. O que NÃO deve ser inferido

Não assumir sem verificar o projeto:

- swipe entre meses;
- scroll infinito de calendário;
- limite máximo de navegação;
- limite mínimo;
- datas bloqueadas;
- disponibilidade específica;
- backend responsável pelo cálculo dos presets;
- refresh automático específico;
- persistência entre sessões.

Caso o projeto já tenha regras para esses itens, preservar as regras existentes.

---

# 36. Critérios de aceite

- [ ] Ao abrir a tela, o período padrão aparece corretamente.
- [ ] `Hoje` resolve corretamente a data atual no timezone definido.
- [ ] `Ontem` resolve exatamente o dia anterior.
- [ ] `Amanhã` resolve exatamente o dia seguinte.
- [ ] `Mês Atual` utiliza o primeiro e último dia reais do mês.
- [ ] `Mês Anterior` funciona inclusive na transição janeiro → dezembro.
- [ ] `Próximo Mês` funciona inclusive na transição dezembro → janeiro.
- [ ] O toque no filtro abre a Bottom Sheet de presets.
- [ ] A opção `Personalizado` abre o calendário.
- [ ] O calendário exibe corretamente mês e ano.
- [ ] A navegação entre meses funciona.
- [ ] A mudança de dezembro para janeiro atualiza o ano.
- [ ] A mudança de janeiro para dezembro atualiza o ano.
- [ ] A primeira data inicia uma nova seleção.
- [ ] Após a primeira data, o calendário permanece aberto.
- [ ] A segunda data completa o intervalo.
- [ ] O intervalo é inclusivo.
- [ ] Datas intermediárias recebem destaque visual contínuo.
- [ ] Início e fim possuem diferenciação visual.
- [ ] O calendário fecha automaticamente após a segunda seleção válida.
- [ ] Não existe necessidade de botão Aplicar no fluxo de referência.
- [ ] O filtro passa a indicar `Personalizado`.
- [ ] O cabeçalho apresenta o intervalo selecionado.
- [ ] O intervalo aplicado fica sincronizado com o estado global.
- [ ] Alterar o intervalo dispara atualização dos dados dependentes.
- [ ] Durante a consulta existe estado de loading.
- [ ] Resultado vazio é diferente de loading.
- [ ] Erro é diferente de vazio.
- [ ] Respostas antigas não sobrescrevem consultas mais recentes.
- [ ] Fevereiro é tratado corretamente.
- [ ] Ano bissexto é tratado corretamente.
- [ ] O timezone é explicitamente definido.
- [ ] Não existem cálculos de mês baseados em 30 dias fixos.
- [ ] Navegar no calendário sem concluir uma seleção não dispara consulta desnecessária.
- [ ] `appliedRange` e `draftRange` são tratados separadamente.

---

# 37. Prioridade de implementação

## Prioridade 1 — comportamento funcional

Implementar primeiro:

```text
presets
→ startDate/endDate
→ personalizado
→ primeira/segunda seleção
→ navegação mensal
→ estado global
→ consulta
```

## Prioridade 2 — robustez

Depois garantir:

```text
timezone
race conditions
loading
empty
error
edge cases de calendário
```

## Prioridade 3 — fidelidade visual

Finalmente ajustar:

```text
Bottom Sheet
overlay
tipografia
cores
rounded endpoints
faixa intermediária
animações
spacing
```

---

# 38. Resultado esperado

A implementação final deve reproduzir este comportamento:

```text
Usuário abre filtro
→ escolhe preset OU personalizado

SE preset:
    calcular intervalo
    → aplicar
    → carregar dados

SE personalizado:
    abrir calendário
    → selecionar início
    → selecionar fim
    → destacar intervalo
    → fechar automaticamente
    → aplicar intervalo
    → carregar dados
```

A funcionalidade deve ser tratada como um **filtro temporal global**, não apenas como um componente visual de calendário.

O ponto central da implementação é:

```text
seleção de período
→ estado consistente
→ intervalo absoluto
→ consulta segura
→ interface sincronizada
```

Esse comportamento deve ser preservado independentemente do framework ou biblioteca utilizados.
