// Timezone da empresa (Brasília). Presets como "Hoje" usam este fuso,
// nunca UTC implícito. Operações de mês/dia passam pelo calendário nativo
// (trata fevereiro, ano bissexto e virada dezembro↔janeiro).
export const CALENDAR_TIMEZONE = 'America/Sao_Paulo';

export const PRESETS = {
  ALL: 'ALL',
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
  TOMORROW: 'TOMORROW',
  CURRENT_MONTH: 'CURRENT_MONTH',
  PREVIOUS_MONTH: 'PREVIOUS_MONTH',
  NEXT_MONTH: 'NEXT_MONTH',
  CUSTOM: 'CUSTOM',
};

export const PRESET_OPCOES = [
  { valor: PRESETS.ALL, rotulo: 'Todos os períodos' },
  { valor: PRESETS.TODAY, rotulo: 'Hoje' },
  { valor: PRESETS.YESTERDAY, rotulo: 'Ontem' },
  { valor: PRESETS.TOMORROW, rotulo: 'Amanhã' },
  { valor: PRESETS.CURRENT_MONTH, rotulo: 'Mês Atual' },
  { valor: PRESETS.PREVIOUS_MONTH, rotulo: 'Mês Anterior' },
  { valor: PRESETS.NEXT_MONTH, rotulo: 'Próximo Mês' },
  { valor: PRESETS.CUSTOM, rotulo: 'Personalizado' },
];

export const RANGE_SELECTION = {
  IDLE: 'IDLE',
  SELECTING_END: 'SELECTING_END',
  COMPLETE: 'COMPLETE',
};

const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MES_LONGO = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dataCalendario(ano, mes, dia) {
  return new Date(ano, mes, dia, 12, 0, 0, 0);
}

function clonarDia(date) {
  return dataCalendario(date.getFullYear(), date.getMonth(), date.getDate());
}

function adicionarDias(date, n) {
  const d = clonarDia(date);
  d.setDate(d.getDate() + n);
  return d;
}

function adicionarMeses(date, n) {
  return dataCalendario(date.getFullYear(), date.getMonth() + n, 1);
}

function inicioDoMes(date) {
  return dataCalendario(date.getFullYear(), date.getMonth(), 1);
}

function fimDoMes(date) {
  return dataCalendario(date.getFullYear(), date.getMonth() + 1, 0);
}

function inicioDaSemana(date) {
  const d = clonarDia(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function fimDaSemana(date) {
  return adicionarDias(inicioDaSemana(date), 6);
}

export function hojeNoTimezone(agora = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [ano, mes, dia] = fmt.format(agora).split('-').map(Number);
  return dataCalendario(ano, mes - 1, dia);
}

export function formatarIsoData(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parsearDataOs(valor) {
  if (!valor) return null;
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return dataCalendario(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function calcularPreset(preset, referenceDate) {
  const hoje = referenceDate || hojeNoTimezone();
  switch (preset) {
    case PRESETS.TODAY:
      return { start: hoje, end: hoje };
    case PRESETS.YESTERDAY: {
      const d = adicionarDias(hoje, -1);
      return { start: d, end: d };
    }
    case PRESETS.TOMORROW: {
      const d = adicionarDias(hoje, 1);
      return { start: d, end: d };
    }
    case PRESETS.CURRENT_MONTH:
      return { start: inicioDoMes(hoje), end: fimDoMes(hoje) };
    case PRESETS.PREVIOUS_MONTH: {
      const ref = adicionarMeses(hoje, -1);
      return { start: inicioDoMes(ref), end: fimDoMes(ref) };
    }
    case PRESETS.NEXT_MONTH: {
      const ref = adicionarMeses(hoje, 1);
      return { start: inicioDoMes(ref), end: fimDoMes(ref) };
    }
    default:
      return { start: hoje, end: hoje };
  }
}

export function criarEstadoInicialFiltroData() {
  const referenceDate = hojeNoTimezone();
  const range = calcularPreset(PRESETS.TODAY, referenceDate);
  return {
    mode: 'PRESET',
    selectedPreset: PRESETS.TODAY,
    referenceDate,
    appliedRange: { start: range.start, end: range.end },
    draftRange: { start: null, end: null },
    calendar: {
      visibleMonth: referenceDate.getMonth(),
      visibleYear: referenceDate.getFullYear(),
    },
    rangeSelectionState: RANGE_SELECTION.IDLE,
    ui: { presetMenuOpen: false, calendarOpen: false },
    timezone: CALENDAR_TIMEZONE,
  };
}

/** Relatórios: sem filtro de data por padrão — busca histórico completo até o usuário restringir. */
export function criarEstadoInicialFiltroRelatorio() {
  const referenceDate = hojeNoTimezone();
  return {
    mode: 'PRESET',
    selectedPreset: PRESETS.ALL,
    referenceDate,
    appliedRange: null,
    draftRange: { start: null, end: null },
    calendar: {
      visibleMonth: referenceDate.getMonth(),
      visibleYear: referenceDate.getFullYear(),
    },
    rangeSelectionState: RANGE_SELECTION.IDLE,
    ui: { presetMenuOpen: false, calendarOpen: false },
    timezone: CALENDAR_TIMEZONE,
  };
}

export function rotuloPreset(preset) {
  return PRESET_OPCOES.find((o) => o.valor === preset)?.rotulo || 'Personalizado';
}

export function formatarDataCurta(date) {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  return `${d} ${MES_CURTO[date.getMonth()]} ${date.getFullYear()}`;
}

export function rotuloGatilho(selectedPreset, appliedRange) {
  const titulo = rotuloPreset(selectedPreset);
  if (selectedPreset === PRESETS.ALL || !appliedRange?.start) {
    return {
      titulo,
      subtitulo: selectedPreset === PRESETS.ALL ? 'Sem filtro de data' : '',
    };
  }
  if (!mesmaData(appliedRange.start, appliedRange.end)) {
    return {
      titulo,
      subtitulo: `${formatarDataCurta(appliedRange.start)} — ${formatarDataCurta(appliedRange.end)}`,
    };
  }
  return { titulo, subtitulo: formatarDataCurta(appliedRange.start) };
}

export function tituloMesAno(year, month) {
  return `${MES_LONGO[month]} ${year}`;
}

export function gradeDoMes(year, month) {
  const visivel = dataCalendario(year, month, 1);
  const inicio = inicioDaSemana(inicioDoMes(visivel));
  const fim = fimDaSemana(fimDoMes(visivel));
  const dias = [];
  let atual = clonarDia(inicio);
  const ultimo = clonarDia(fim);
  while (atual.getTime() <= ultimo.getTime()) {
    dias.push(clonarDia(atual));
    atual = adicionarDias(atual, 1);
  }
  return dias;
}

export function dataNoIntervalo(date, start, end) {
  if (!date || !start || !end) return false;
  const t = clonarDia(date).getTime();
  return t >= clonarDia(start).getTime() && t <= clonarDia(end).getTime();
}

export function mesmaData(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function mesmoMes(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function mesAnterior(year, month) {
  const d = adicionarMeses(dataCalendario(year, month, 1), -1);
  return { visibleYear: d.getFullYear(), visibleMonth: d.getMonth() };
}

export function proximoMes(year, month) {
  const d = adicionarMeses(dataCalendario(year, month, 1), 1);
  return { visibleYear: d.getFullYear(), visibleMonth: d.getMonth() };
}

export function dataEhAntes(a, b) {
  return clonarDia(a).getTime() < clonarDia(b).getTime();
}

function extrairHora(valor) {
  const m = String(valor).match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  if (m[1] === '00' && m[2] === '00') return null;
  return `${m[1]}h${m[2]}`;
}

function formatarDataHoraCard(valor) {
  const d = parsearDataOs(valor);
  if (!d) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = MES_CURTO[d.getMonth()];
  const hora = extrairHora(valor);
  if (hora) return `${dia} ${mes} ${hora}`;
  return `${dia} ${mes} ${d.getFullYear()}`;
}

export function formatarJanelaPrevista(inicio, fim) {
  if (!inicio) return null;
  const esquerda = formatarDataHoraCard(inicio);
  if (!fim) return esquerda;
  return `${esquerda} → ${formatarDataHoraCard(fim)}`;
}

export function limitesConsulta(appliedRange) {
  const start = formatarIsoData(appliedRange.start);
  const endDate = adicionarDias(appliedRange.end, 1);
  const endExclusivo = formatarIsoData(endDate);
  return {
    inicioIso: `${start}T00:00:00.000Z`,
    fimExclusivoIso: `${endExclusivo}T00:00:00.000Z`,
  };
}
