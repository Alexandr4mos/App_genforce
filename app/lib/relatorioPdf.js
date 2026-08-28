import { Platform } from 'react-native';
import { supabase } from './supabase';
import { rotuloStatus, rotuloTipo } from './constantes';
import { avisar } from './avisos';

function escHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function abrirRelatorioParaImpressao(osId) {
  const { data: os, error } = await supabase
    .from('ordens_servico')
    .select(
      `numero, status, descricao, observacoes_gerais, km_saida, km_retorno,
      checkin_em, checkout_em, data_inicio_prevista, data_fim_prevista,
      clientes(nome, razao_social, email),
      os_tipos(tipo)`
    )
    .eq('id', osId)
    .single();

  if (error || !os) {
    avisar(error?.message || 'OS não encontrada.', 'Erro');
    return;
  }

  const { data: osEq } = await supabase
    .from('os_equipamentos')
    .select('id, equipamentos(tag, fabricante_gmg)')
    .eq('os_id', osId);

  const { data: pecas } = await supabase.from('relatorio_pecas').select('*').eq('os_id', osId);
  const { data: assinaturas } = await supabase.from('assinaturas').select('*').eq('os_id', osId);

  let checklistHtml = '';
  for (const eq of osEq || []) {
    const { data: respostas } = await supabase
      .from('checklist_respostas')
      .select('resposta, observacao, checklist_template_itens(titulo, grupo)')
      .eq('os_equipamento_id', eq.id);

    checklistHtml += `<h3>${escHtml(eq.equipamentos?.tag)} — ${escHtml(eq.equipamentos?.fabricante_gmg)}</h3><ul>`;
    (respostas || []).forEach((r) => {
      checklistHtml += `<li><strong>${escHtml(r.checklist_template_itens?.titulo)}</strong>: ${escHtml(r.resposta)}`;
      if (r.observacao) checklistHtml += ` <em>(${escHtml(r.observacao)})</em>`;
      checklistHtml += '</li>';
    });
    checklistHtml += '</ul>';
  }

  const tipos = (os.os_tipos || []).map((t) => rotuloTipo(t.tipo)).join(', ');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OS ${os.numero}</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;color:#111}
h1{margin:0 0 8px}h2{border-bottom:1px solid #ccc;padding-bottom:4px}
ul{padding-left:20px}img{max-width:280px;border:1px solid #ddd;margin-top:8px}
@media print{button{display:none}}
</style></head><body>
<h1>Relatório OS #${os.numero}</h1>
<p><strong>Status:</strong> ${escHtml(rotuloStatus(os.status))}</p>
<p><strong>Cliente:</strong> ${escHtml(os.clientes?.nome)} ${os.clientes?.razao_social ? `(${escHtml(os.clientes.razao_social)})` : ''}</p>
<p><strong>Modalidades:</strong> ${escHtml(tipos)}</p>
<p><strong>Descrição:</strong> ${escHtml(os.descricao)}</p>
<p><strong>Observações gerais:</strong> ${escHtml(os.observacoes_gerais)}</p>
<p><strong>Km:</strong> saída ${os.km_saida ?? '—'} / retorno ${os.km_retorno ?? '—'}</p>
<h2>Checklist</h2>${checklistHtml}
<h2>Peças trocadas</h2><ul>${(pecas || [])
    .map((p) => `<li>${escHtml(p.peca)} — código ${escHtml(p.codigo_peca)} (qtd ${p.quantidade})</li>`)
    .join('')}</ul>
<h2>Assinaturas</h2>
${(assinaturas || [])
  .map(
    (a) =>
      `<p><strong>${escHtml(a.tipo)}:</strong> ${escHtml(a.nome_responsavel)}<br/>` +
      (a.imagem_url ? `<img src="${a.imagem_url}" alt="assinatura"/>` : '') +
      '</p>'
  )
  .join('')}
<p style="margin-top:24px;font-size:12px;color:#666">Gerado em ${new Date().toLocaleString('pt-BR')} — envio automático por e-mail pendente de configuração.</p>
<button onclick="window.print()">Imprimir / Salvar PDF</button>
</body></html>`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.write(html);
      janela.document.close();
    } else {
      avisar('Permita pop-ups para abrir o relatório.', 'Bloqueado');
    }
    return;
  }

  avisar('No celular, use a versão web no navegador para imprimir ou salvar o PDF.', 'Relatório');
}
