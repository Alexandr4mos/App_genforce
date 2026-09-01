import { hojeNoTimezone, parsearDataOs, formatarDataCurta } from './dateRangeService';
import { rotuloTipo } from './constantes';

/** Item de checklist "Horas de funcionamento (horímetro)" no template padrão. */
export const HORIMETRO_TEMPLATE_ITEM_ID = 'b555deec-cff3-4435-9480-23163b52780e';

export function normalizarDescricaoPeca(texto) {
  return (texto || '').trim().toLowerCase();
}

export function contarTrocasPorDescricao(pecas, descricao) {
  const alvo = normalizarDescricaoPeca(descricao);
  return (pecas || []).filter((p) => normalizarDescricaoPeca(p.peca) === alvo).length;
}

export function rotulosTiposOs(osTipos) {
  const tipos = (osTipos || []).map((t) => t.tipo || t);
  if (!tipos.length) return '—';
  return tipos.map(rotuloTipo).join(', ');
}

export function textoProximaTroca(isoData) {
  if (!isoData) return '—';
  const prevista = parsearDataOs(isoData);
  if (!prevista) return formatarDataCurta(isoData);

  const hoje = hojeNoTimezone();
  const diffMs = prevista.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const dataFmt = formatarDataCurta(prevista);

  if (diffDias > 0) return `${dataFmt} (faltam ${diffDias} dia${diffDias === 1 ? '' : 's'})`;
  if (diffDias < 0) {
    const atraso = Math.abs(diffDias);
    return `${dataFmt} (atrasado há ${atraso} dia${atraso === 1 ? '' : 's'})`;
  }
  return `${dataFmt} (hoje)`;
}
