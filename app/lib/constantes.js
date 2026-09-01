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

// Cor por status — usada na borda dos cards da lista de OS.
// Cobertura completa dos status vem no item 9 (lista de OS), aqui é só
// a base pra já não ficar sem cor quando "agendado" aparecer.
export const COR_STATUS = {
  agendado: '#2196f3', // azul
  pendente: '#e53935', // vermelho
  andamento: '#ffb300', // amarelo
  pausada: '#0d47a1', // azul escuro (tom forte)
  concluida: '#4caf50', // verde
  finalizado: '#9e9e9e', // cinza
};

export function corDoStatus(status) {
  return COR_STATUS[status] || '#9e9e9e';
}

export const PRIORIDADES_OS = [
  { valor: 'alto', rotulo: 'Alto' },
  { valor: 'medio', rotulo: 'Médio' },
  { valor: 'baixo', rotulo: 'Baixo' },
];

export const COR_PRIORIDADE = {
  alto: '#e53935',
  medio: '#ffb300',
  baixo: '#4caf50',
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
 * Status exibido/filtrado no app — calculado a partir do fluxo (check-in/out,
 * finalização) e da data prevista vs. hoje. Não depende só do valor gravado no banco.
 */
export function statusEfetivo(os) {
  if (!os) return 'pendente';

  if (os.status === 'finalizado') return 'finalizado';
  if (os.checkout_em || os.status === 'concluida') return 'concluida';

  const hoje = hojeNoTimezone();
  const dataPrevista = parsearDataOs(os.data_inicio_prevista);

  if (os.checkin_em) {
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
