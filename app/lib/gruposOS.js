export const GRUPO_MEDICOES_COM_CARGA =
  'Medições de Grandezas Elétricas (AC) / Mecânicas — COM CARGA';

export const TIPO_TESTE_CARGA = 'teste_carga_programado';

export function itemExigeResposta(item, gruposOpcionais) {
  const opcionais =
    gruposOpcionais instanceof Set ? gruposOpcionais : new Set(gruposOpcionais || []);
  if (opcionais.has(item.grupo)) return false;
  if (item.obrigatorio === false) return false;
  return true;
}

/** Grupos que não bloqueiam check-out ao carregar uma OS existente. */
export function gruposOpcionaisIniciais(tiposOs, salvosDb) {
  const set = new Set(salvosDb || []);
  if ((salvosDb || []).length === 0 && !tiposOs.includes(TIPO_TESTE_CARGA)) {
    set.add(GRUPO_MEDICOES_COM_CARGA);
  }
  return set;
}

/** Padrão ao criar OS nova. */
export function gruposOpcionaisPadraoNovaOs(tiposOs) {
  const set = new Set();
  if (!tiposOs.includes(TIPO_TESTE_CARGA)) {
    set.add(GRUPO_MEDICOES_COM_CARGA);
  }
  return set;
}

export async function salvarGruposOpcionais(supabase, osId, gruposOpcionaisSet) {
  const { error: delError } = await supabase.from('os_grupos_opcionais').delete().eq('os_id', osId);
  if (delError) throw delError;

  const lista = [...gruposOpcionaisSet];
  if (lista.length === 0) return;

  const { error } = await supabase
    .from('os_grupos_opcionais')
    .insert(lista.map((grupo) => ({ os_id: osId, grupo })));
  if (error) throw error;
}

/** Ajusta COM CARGA quando o tipo teste_carga_programado entra ou sai da OS. */
export function aplicarMudancaTipos(tiposAntigos, tiposNovos, gruposOpcionaisSet) {
  const set = new Set(gruposOpcionaisSet);
  const tinhaTeste = tiposAntigos.includes(TIPO_TESTE_CARGA);
  const temTeste = tiposNovos.includes(TIPO_TESTE_CARGA);
  if (temTeste && !tinhaTeste) {
    set.delete(GRUPO_MEDICOES_COM_CARGA);
  } else if (!temTeste && tinhaTeste) {
    set.add(GRUPO_MEDICOES_COM_CARGA);
  }
  return set;
}
