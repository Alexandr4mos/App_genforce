// Valores compartilhados entre NovaOS, EditarOS e a lista de OS (App.js).
// Centralizado aqui pra não duplicar e desalinhar entre as telas.

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
  pausada: '#9e9e9e', // cinza
  concluida: '#4caf50', // verde
  finalizado: '#1565c0', // azul escuro
};

export function corDoStatus(status) {
  return COR_STATUS[status] || '#9e9e9e';
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
