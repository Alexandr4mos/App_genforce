// Valores compartilhados entre NovaOS, EditarOS e a lista de OS (App.js).
// Centralizado aqui pra não duplicar e desalinhar entre as telas.

import { hojeNoTimezone, parsearDataOs } from './dateRangeService';

// Template padrão usado até existir uma tela de escolha de checklist
export const TEMPLATE_PADRAO_ID = '55555555-5555-5555-5555-555555555555';

// 5 tipos/modalidades vindos do 8Confirma (substituem os 4 antigos:
// preventiva/corretiva/visita_tecnica/observacao). Uma OS pode ter mais
// de um marcado ao mesmo tempo — ver tabela os_tipos no banco.
export const TIPOS_OS = [
  { valor: 'atendimento_emergencia', rotulo: 'Atendimento de Emergência' },
  { valor: 'manutencao_corretiva', rotulo: 'Manutenção Corretiva' },
  { valor: 'visita_tecnica', rotulo: 'Visita Técnica' },
  { valor: 'teste_carga_programado', rotulo: 'Teste com Carga Programado' },
  { valor: 'manutencao_preventiva', rotulo: 'Manutenção Preventiva' },
];

export function rotuloTipo(valor) {
  return TIPOS_OS.find((t) => t.valor === valor)?.rotulo || valor;
}

// Status possíveis de uma OS. "agendado" adicionado em 18/08/2026 (item 8).
export const STATUS_OS = [
  { valor: 'agendado', rotulo: 'Agendado' },
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'andamento', rotulo: 'Andamento' },
  { valor: 'pausada', rotulo: 'Pausada' },
  { valor: 'concluida', rotulo: 'Concluída' },
  { valor: 'finalizado', rotulo: 'Finalizado' },
];

export function rotuloStatus(valor) {
  return STATUS_OS.find((s) => s.valor === valor)?.rotulo || valor;
}

// Cor sólida por status (faixa lateral, pontos de legenda, calendário).
export const COR_STATUS = {
  agendado: '#3B82F6', // azul
  pendente: '#EF4444', // vermelho
  andamento: '#F59E0B', // âmbar
  pausada: '#A855F7', // roxo
  concluida: '#22C55E', // verde
  finalizado: '#94A3B8', // cinza-azulado
};

export function corDoStatus(status) {
  return COR_STATUS[status] || COR_STATUS.finalizado;
}

// Par texto/fundo suave para badges (contraste AA sobre o fundo).
const STATUS_BADGE = {
  claro: {
    agendado: { fg: '#1D4ED8', bg: '#DBEAFE' },
    pendente: { fg: '#B91C1C', bg: '#FEE2E2' },
    andamento: { fg: '#92400E', bg: '#FEF3C7' },
    pausada: { fg: '#7E22CE', bg: '#F3E8FF' },
    concluida: { fg: '#15803D', bg: '#DCFCE7' },
    finalizado: { fg: '#475569', bg: '#E2E8F0' },
  },
  escuro: {
    agendado: { fg: '#93C5FD', bg: '#16294A' },
    pendente: { fg: '#FCA5A5', bg: '#3B1616' },
    andamento: { fg: '#FCD34D', bg: '#3A2A0B' },
    pausada: { fg: '#D8B4FE', bg: '#2E1A47' },
    concluida: { fg: '#86EFAC', bg: '#14301F' },
    finalizado: { fg: '#CBD5E1', bg: '#26324A' },
  },
};

export function estiloBadgeStatus(status, modoEscuro = false) {
  const tema = modoEscuro ? STATUS_BADGE.escuro : STATUS_BADGE.claro;
  return tema[status] || tema.finalizado;
}

export const PRIORIDADES_OS = [
  { valor: 'alto', rotulo: 'Alto' },
  { valor: 'medio', rotulo: 'Médio' },
  { valor: 'baixo', rotulo: 'Baixo' },
];

export const COR_PRIORIDADE = {
  alto: '#EF4444',
  medio: '#F59E0B',
  baixo: '#22C55E',
};

export function rotuloPrioridade(valor) {
  return PRIORIDADES_OS.find((p) => p.valor === valor)?.rotulo || valor;
}

export function corDaPrioridade(prioridade) {
  return COR_PRIORIDADE[prioridade] || COR_PRIORIDADE.medio;
}

/** Ordem de exibição: alto (0) → médio (1) → baixo (2). */
export function pesoPrioridade(prioridade) {
  const mapa = { alto: 0, medio: 1, baixo: 2 };
  return mapa[prioridade] ?? 1;
}

/** Status em aberto para a aba Prioridade em Relatórios. */
export const STATUS_OS_ABERTAS = ['agendado', 'pendente', 'andamento', 'pausada'];

/**
 * Status exibido/filtrado no app.
 *
 * Regras (em ordem):
 * 1. finalizado / concluida (status do banco) — sempre respeitados
 * 2. checkout_em implica concluída, EXCETO se status foi devolvido para
 *    andamento/pausada (ciclo "Solicitar correção")
 * 3. pausada gravada no banco (pausa manual via Editar OS) — respeitada
 * 4. com check-in: se data prevista já passou → pausada (automático); senão → andamento
 * 5. sem check-in: data futura → agendado; caso contrário → pendente
 *
 * Não há trigger/cron no Supabase para isso — só esta função no client.
 */
export function statusEfetivo(os) {
  if (!os) return 'pendente';

  if (os.status === 'finalizado') return 'finalizado';
  if (os.status === 'concluida') return 'concluida';

  // Devolvida para correção: status andamento/pausada prevalece sobre checkout_em antigo.
  const devolvidaParaCorrecao = os.status === 'andamento' || os.status === 'pausada';
  if (os.checkout_em && !devolvidaParaCorrecao) return 'concluida';

  if (os.status === 'pausada') return 'pausada';

  const hoje = hojeNoTimezone();
  const dataPrevista = parsearDataOs(os.data_inicio_prevista);

  if (os.checkin_em) {
    // Pausa automática: OS em andamento cuja data prevista já passou.
    if (dataPrevista && dataPrevista.getTime() < hoje.getTime()) {
      return 'pausada';
    }
    return 'andamento';
  }

  if (dataPrevista && dataPrevista.getTime() > hoje.getTime()) {
    return 'agendado';
  }

  return 'pendente';
}

/** Borda lateral dos grupos do checklist (Parte 4 Prompt 4). */
export function corBordaGrupoChecklist(completa, statusEfetivoOs) {
  if (completa) return COR_STATUS.concluida;
  if (statusEfetivoOs === 'pausada') return COR_STATUS.andamento;
  return corDoStatus(statusEfetivoOs);
}

export const UFS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const TIPOS_FILTRO = [
  { valor: 'oleo', rotulo: 'Óleo' },
  { valor: 'combustivel', rotulo: 'Combustível' },
  { valor: 'ar', rotulo: 'Ar' },
  { valor: 'separador', rotulo: 'Separador' },
];

export function rotuloTipoFiltro(valor) {
  return TIPOS_FILTRO.find((t) => t.valor === valor)?.rotulo || valor;
}

export const PERIODICIDADES_MANUTENCAO = [
  { valor: 'mensal', rotulo: 'Mensal', meses: 1 },
  { valor: 'trimestral', rotulo: 'Trimestral', meses: 3 },
  { valor: 'semestral', rotulo: 'Semestral', meses: 6 },
  { valor: 'anual', rotulo: 'Anual', meses: 12 },
];

export function rotuloPeriodicidade(valor) {
  return PERIODICIDADES_MANUTENCAO.find((p) => p.valor === valor)?.rotulo || valor;
}

export function mesesPeriodicidade(valor) {
  return PERIODICIDADES_MANUTENCAO.find((p) => p.valor === valor)?.meses ?? null;
}
