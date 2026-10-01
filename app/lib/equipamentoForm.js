/** Campos do formulário de gerador (create/edit) — strings para inputs. */
export const EQUIPAMENTO_FORM_VAZIO = {
  tag: '',
  fabricante_gmg: '',
  potencia_kva: '',
  tensao: '',
  tipo_gmg: '',
  n_serie_gmg: '',
  ano_fabricacao: '',
  fabricante_motor: '',
  modelo_motor: '',
  n_serie_motor: '',
  placa_motor: '',
  fabricante_alternador: '',
  modelo_alternador: '',
  n_serie_alternador: '',
  placa_alternador: '',
  data_inicio_contrato: '',
  periodicidade_manutencao: '',
};

/** Colunas úteis na listagem de geradores (chips). */
export const EQUIPAMENTO_LISTA_SELECT =
  'id, tag, fabricante_gmg, periodicidade_manutencao';

export const EQUIPAMENTO_COMPLETO_SELECT = `
  id, tag, fabricante_gmg, potencia_kva, tensao, tipo_gmg, n_serie_gmg, ano_fabricacao,
  fabricante_motor, modelo_motor, n_serie_motor, placa_motor,
  fabricante_alternador, modelo_alternador, n_serie_alternador, placa_alternador,
  data_inicio_contrato, periodicidade_manutencao
`.replace(/\s+/g, ' ').trim();

export function valoresFromEquipamento(row) {
  if (!row) return { ...EQUIPAMENTO_FORM_VAZIO };
  return {
    tag: row.tag || '',
    fabricante_gmg: row.fabricante_gmg || '',
    potencia_kva: row.potencia_kva != null ? String(row.potencia_kva) : '',
    tensao: row.tensao || '',
    tipo_gmg: row.tipo_gmg || '',
    n_serie_gmg: row.n_serie_gmg || '',
    ano_fabricacao: row.ano_fabricacao != null ? String(row.ano_fabricacao) : '',
    fabricante_motor: row.fabricante_motor || '',
    modelo_motor: row.modelo_motor || '',
    n_serie_motor: row.n_serie_motor || '',
    placa_motor: row.placa_motor || '',
    fabricante_alternador: row.fabricante_alternador || '',
    modelo_alternador: row.modelo_alternador || '',
    n_serie_alternador: row.n_serie_alternador || '',
    placa_alternador: row.placa_alternador || '',
    data_inicio_contrato: row.data_inicio_contrato || '',
    periodicidade_manutencao: row.periodicidade_manutencao || '',
  };
}

/** Payload para insert/update em `equipamentos` (sem unidade_id). */
export function payloadFromValores(valores) {
  return {
    tag: valores.tag.trim(),
    fabricante_gmg: valores.fabricante_gmg?.trim() || null,
    potencia_kva: valores.potencia_kva ? Number(valores.potencia_kva) : null,
    tensao: valores.tensao?.trim() || null,
    tipo_gmg: valores.tipo_gmg?.trim() || null,
    n_serie_gmg: valores.n_serie_gmg?.trim() || null,
    ano_fabricacao: valores.ano_fabricacao ? Number(valores.ano_fabricacao) : null,
    fabricante_motor: valores.fabricante_motor?.trim() || null,
    modelo_motor: valores.modelo_motor?.trim() || null,
    n_serie_motor: valores.n_serie_motor?.trim() || null,
    placa_motor: valores.placa_motor?.trim() || null,
    fabricante_alternador: valores.fabricante_alternador?.trim() || null,
    modelo_alternador: valores.modelo_alternador?.trim() || null,
    n_serie_alternador: valores.n_serie_alternador?.trim() || null,
    placa_alternador: valores.placa_alternador?.trim() || null,
    data_inicio_contrato: valores.data_inicio_contrato?.trim() || null,
    periodicidade_manutencao: valores.periodicidade_manutencao?.trim() || null,
  };
}

/** @returns {{ ok: true, filtros: object[] } | { ok: false, mensagem: string }} */
export function validarFiltrosForm(filtros) {
  const lista = filtros || [];
  if (lista.some((f) => !f.numero_peca?.trim())) {
    return {
      ok: false,
      mensagem: 'Preencha o nº da peça em todos os filtros ou remova a linha vazia.',
    };
  }
  return {
    ok: true,
    filtros: lista
      .filter((f) => f.numero_peca?.trim())
      .map((f) => ({
        tipo_filtro: f.tipo_filtro || 'oleo',
        numero_peca: f.numero_peca.trim(),
        observacao: f.observacao?.trim() || null,
      })),
  };
}

export function filtrosFromRows(rows) {
  return (rows || []).map((f) => ({
    id: f.id,
    tipo_filtro: f.tipo_filtro || 'oleo',
    numero_peca: f.numero_peca || '',
    observacao: f.observacao || '',
  }));
}

/** Substitui todos os filtros do gerador pela lista do formulário. */
export async function substituirFiltrosEquipamento(supabase, equipamentoId, filtrosValidos) {
  const { error: erroDelete } = await supabase
    .from('equipamento_filtros')
    .delete()
    .eq('equipamento_id', equipamentoId);
  if (erroDelete) return erroDelete;

  if (!filtrosValidos.length) return null;

  const { error: erroInsert } = await supabase.from('equipamento_filtros').insert(
    filtrosValidos.map((f) => ({
      equipamento_id: equipamentoId,
      tipo_filtro: f.tipo_filtro,
      numero_peca: f.numero_peca,
      observacao: f.observacao,
    }))
  );
  return erroInsert || null;
}
