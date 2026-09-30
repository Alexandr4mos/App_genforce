import { Platform, Image } from 'react-native';
import { supabase } from './supabase';
import { rotuloStatus, rotuloTipo, statusEfetivo, rotuloPeriodicidade } from './constantes';
import { avisar } from './avisos';
import { normalizarNomeResponsavel } from './assinaturas';

const LOGO_GENFORCE = require('../assets-login/genforce-logo-transparente.png');

function escHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarDataHora(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarData(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 10);
  return d.toLocaleDateString('pt-BR');
}

function linhaInfo(rotulo, valor) {
  if (valor == null || String(valor).trim() === '') return '';
  return `<div class="info-linha"><span class="info-rotulo">${escHtml(rotulo)}</span><span class="info-valor">${escHtml(valor)}</span></div>`;
}

function agruparRespostasPorGrupo(respostas) {
  const ordemGrupos = [];
  const mapa = new Map();
  (respostas || []).forEach((r) => {
    const item = r.checklist_template_itens || {};
    const nome = item.grupo || 'Outros';
    if (!mapa.has(nome)) {
      mapa.set(nome, []);
      ordemGrupos.push(nome);
    }
    mapa.get(nome).push(r);
  });
  ordemGrupos.forEach((nome) => {
    mapa.get(nome).sort(
      (a, b) => (a.checklist_template_itens?.ordem ?? 0) - (b.checklist_template_itens?.ordem ?? 0)
    );
  });
  return ordemGrupos.map((nome) => ({ nome, itens: mapa.get(nome) }));
}

function rotuloTipoAssinatura(tipo) {
  if (tipo === 'cliente') return 'Cliente';
  if (tipo === 'tecnico') return 'Técnico';
  return String(tipo || '—');
}

function urlDoLogo() {
  try {
    return Image.resolveAssetSource(LOGO_GENFORCE)?.uri || '';
  } catch {
    return '';
  }
}

function blocoEquipamento(eq) {
  const e = eq.equipamentos || {};
  const unidade = e.unidades || {};
  const linhas = [
    linhaInfo('Tag', e.tag),
    linhaInfo('Fabricante GMG', e.fabricante_gmg),
    linhaInfo('Tipo', e.tipo_gmg),
    linhaInfo('Potência', e.potencia_kva != null ? `${e.potencia_kva} kVA` : null),
    linhaInfo('Tensão', e.tensao),
    linhaInfo('Nº série GMG', e.n_serie_gmg),
    linhaInfo('Ano de fabricação', e.ano_fabricacao),
    linhaInfo('Fabricante motor', e.fabricante_motor),
    linhaInfo('Modelo motor', e.modelo_motor),
    linhaInfo('Nº série motor', e.n_serie_motor),
    linhaInfo('Placa motor', e.placa_motor),
    linhaInfo('Fabricante alternador', e.fabricante_alternador),
    linhaInfo('Modelo alternador', e.modelo_alternador),
    linhaInfo('Nº série alternador', e.n_serie_alternador),
    linhaInfo('Placa alternador', e.placa_alternador),
    linhaInfo('Periodicidade', e.periodicidade_manutencao ? rotuloPeriodicidade(e.periodicidade_manutencao) : null),
    linhaInfo('Unidade / local', unidade.nome),
    linhaInfo('Endereço da unidade', unidade.endereco),
  ].join('');

  return `<section class="bloco-equipamento">
    <h3>${escHtml(e.tag || 'Gerador')}${e.fabricante_gmg ? ` — ${escHtml(e.fabricante_gmg)}` : ''}</h3>
    <div class="grid-info">${linhas || '<p class="vazio">Sem dados cadastrais do equipamento.</p>'}</div>
  </section>`;
}

function blocoChecklist(eq, respostas) {
  const grupos = agruparRespostasPorGrupo(respostas);
  if (!grupos.length) {
    return `<p class="vazio">Nenhum item de checklist respondido para este gerador.</p>`;
  }

  return grupos
    .map(({ nome, itens }) => {
      const linhas = itens
        .map((r) => {
          const titulo = r.checklist_template_itens?.titulo || 'Item';
          const obs = r.observacao
            ? `<div class="item-obs">${escHtml(r.observacao)}</div>`
            : '';
          return `<div class="check-item">
            <div class="check-titulo">${escHtml(titulo)}</div>
            <div class="check-resposta">${escHtml(r.resposta || '—')}</div>
            ${obs}
          </div>`;
        })
        .join('');
      return `<div class="grupo-checklist">
        <div class="grupo-titulo">${escHtml(nome)}</div>
        ${linhas}
      </div>`;
    })
    .join('');
}

export async function abrirRelatorioParaImpressao(osId) {
  const { data: os, error } = await supabase
    .from('ordens_servico')
    .select(
      `numero, status, descricao, observacoes_gerais, km_saida, km_retorno,
      checkin_em, checkout_em, data_inicio_prevista, data_fim_prevista, prioridade,
      clientes(nome, razao_social, cnpj, endereco, cidade, uf, telefone, telefone_alternativo, email, email_alternativo),
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
    .select(
      `id, equipamentos(
        tag, fabricante_gmg, tipo_gmg, potencia_kva, tensao, n_serie_gmg, ano_fabricacao,
        fabricante_motor, modelo_motor, n_serie_motor, placa_motor,
        fabricante_alternador, modelo_alternador, n_serie_alternador, placa_alternador,
        periodicidade_manutencao,
        unidades(nome, endereco)
      )`
    )
    .eq('os_id', osId);

  const { data: pecas } = await supabase
    .from('relatorio_pecas')
    .select('*')
    .eq('os_id', osId)
    .order('data_hora', { ascending: true });

  const { data: assinaturas } = await supabase.from('assinaturas').select('*').eq('os_id', osId);

  const checklistsPorEq = {};
  await Promise.all(
    (osEq || []).map(async (eq) => {
      const { data: respostas } = await supabase
        .from('checklist_respostas')
        .select('resposta, observacao, checklist_template_itens(titulo, grupo, ordem)')
        .eq('os_equipamento_id', eq.id);
      checklistsPorEq[eq.id] = respostas || [];
    })
  );

  const cliente = os.clientes || {};
  const tipos = (os.os_tipos || []).map((t) => rotuloTipo(t.tipo)).join(', ') || '—';
  const logoUrl = urlDoLogo();
  const enderecoCliente = [cliente.endereco, [cliente.cidade, cliente.uf].filter(Boolean).join('/')]
    .filter(Boolean)
    .join(' — ');

  const equipamentosHtml = (osEq || [])
    .map((eq) => {
      return `${blocoEquipamento(eq)}
      <h4 class="subsecao">Checklist</h4>
      ${blocoChecklist(eq, checklistsPorEq[eq.id] || [])}`;
    })
    .join('');

  const pecasHtml =
    (pecas || []).length > 0
      ? `<table class="tabela">
          <thead>
            <tr>
              <th>Peça</th>
              <th>Código</th>
              <th>Qtd</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${(pecas || [])
              .map(
                (p) => `<tr>
                  <td>${escHtml(p.peca)}</td>
                  <td>${escHtml(p.codigo_peca || '—')}</td>
                  <td>${escHtml(p.quantidade ?? '—')}</td>
                  <td>${escHtml(formatarDataHora(p.data_hora))}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<p class="vazio">Nenhuma peça registrada nesta OS.</p>`;

  const assinaturasHtml =
    (assinaturas || []).length > 0
      ? (assinaturas || [])
          .map((a) => {
            const nome = normalizarNomeResponsavel(a.nome_responsavel) || '—';
            return `<div class="assinatura-card">
              <div class="assinatura-rotulo">${escHtml(rotuloTipoAssinatura(a.tipo))}</div>
              <div class="assinatura-nome">${escHtml(nome)}</div>
              ${
                a.imagem_url
                  ? `<img class="assinatura-img" src="${escHtml(a.imagem_url)}" alt="Assinatura ${escHtml(rotuloTipoAssinatura(a.tipo))}" crossorigin="anonymous"/>`
                  : '<p class="vazio">Sem imagem de assinatura.</p>'
              }
            </div>`;
          })
          .join('')
      : `<p class="vazio">Nenhuma assinatura registrada.</p>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Relatório OS #${escHtml(os.numero)} — Genforce</title>
  <style>
    :root {
      --azul: #0b5ed7;
      --azul-claro: #e8f1ff;
      --texto: #111;
      --muted: #666;
      --borda: #dde3ea;
      --fundo: #fff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      color: var(--texto);
      background: #eef2f6;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 12px 16px;
      background: #fff;
      border-bottom: 1px solid var(--borda);
    }
    .toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-primario { background: var(--azul); color: #fff; }
    .btn-sec { background: #f0f3f7; color: #222; }
    .folha {
      max-width: 860px;
      margin: 16px auto 40px;
      background: var(--fundo);
      padding: 28px 32px;
      border-radius: 4px;
      box-shadow: 0 1px 8px rgba(0,0,0,0.08);
    }
    .cabecalho {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      border-bottom: 3px solid var(--azul);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .logo { max-height: 64px; max-width: 220px; object-fit: contain; }
    .marca h1 {
      margin: 0;
      font-size: 22px;
      color: var(--azul);
      letter-spacing: 0.02em;
    }
    .marca p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .meta-os { text-align: right; font-size: 13px; color: var(--muted); }
    .meta-os strong { display: block; color: var(--texto); font-size: 18px; margin-bottom: 4px; }
    h2 {
      margin: 22px 0 10px;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--azul);
      border-bottom: 1px solid var(--borda);
      padding-bottom: 6px;
    }
    h3 { margin: 14px 0 8px; font-size: 16px; }
    h4.subsecao { margin: 12px 0 8px; font-size: 13px; color: var(--muted); text-transform: uppercase; }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
    }
    .info-linha { display: flex; gap: 8px; font-size: 13px; line-height: 1.35; }
    .info-rotulo { min-width: 130px; color: var(--muted); font-weight: 600; }
    .info-valor { color: var(--texto); flex: 1; }
    .bloco-equipamento {
      border: 1px solid var(--borda);
      border-radius: 8px;
      padding: 12px 14px;
      margin: 10px 0 8px;
      background: #fafcff;
    }
    .grupo-checklist {
      border: 1px solid var(--borda);
      border-left: 4px solid var(--azul);
      border-radius: 8px;
      margin: 0 0 12px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .grupo-titulo {
      background: var(--azul-claro);
      color: var(--azul);
      font-weight: 700;
      font-size: 13px;
      padding: 8px 12px;
    }
    .check-item {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 8px;
      padding: 8px 12px;
      border-top: 1px solid var(--borda);
      font-size: 13px;
      page-break-inside: avoid;
    }
    .check-titulo { font-weight: 600; }
    .check-resposta { color: #0b3d91; font-weight: 600; text-align: right; }
    .item-obs { grid-column: 1 / -1; color: var(--muted); font-size: 12px; font-style: italic; }
    .tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabela th, .tabela td { border: 1px solid var(--borda); padding: 8px; text-align: left; }
    .tabela th { background: var(--azul-claro); color: var(--azul); }
    .assinaturas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .assinatura-card {
      border: 1px solid var(--borda);
      border-radius: 8px;
      padding: 12px;
      page-break-inside: avoid;
    }
    .assinatura-rotulo { font-size: 12px; font-weight: 700; color: var(--azul); text-transform: uppercase; }
    .assinatura-nome { margin: 6px 0 10px; font-weight: 600; }
    .assinatura-img {
      width: 100%;
      max-height: 120px;
      object-fit: contain;
      background: #fff;
      border: 1px solid var(--borda);
      border-radius: 6px;
    }
    .vazio { color: var(--muted); font-style: italic; font-size: 13px; }
    .rodape {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid var(--borda);
      font-size: 11px;
      color: var(--muted);
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .folha {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        max-width: none;
        padding: 0;
      }
      @page { margin: 12mm; }
    }
    @media (max-width: 700px) {
      .grid-info, .assinaturas, .check-item { grid-template-columns: 1fr; }
      .check-resposta { text-align: left; }
      .cabecalho { flex-direction: column; }
      .meta-os { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-primario" id="btnBaixarPdf" type="button">Baixar PDF</button>
    <button class="btn-sec" type="button" onclick="window.print()">Imprimir</button>
  </div>

  <div class="folha" id="relatorio">
    <header class="cabecalho">
      <div class="marca">
        ${
          logoUrl
            ? `<img class="logo" src="${escHtml(logoUrl)}" alt="Genforce"/>`
            : `<h1>GENFORCE</h1>`
        }
        <p>Manutenção de geradores · Relatório de ordem de serviço</p>
      </div>
      <div class="meta-os">
        <strong>OS #${escHtml(os.numero)}</strong>
        Status: ${escHtml(rotuloStatus(statusEfetivo(os)))}<br/>
        Emitido em ${escHtml(formatarDataHora(new Date().toISOString()))}
      </div>
    </header>

    <h2>Dados da OS</h2>
    <div class="grid-info">
      ${linhaInfo('Modalidades', tipos)}
      ${linhaInfo('Data prevista', formatarData(os.data_inicio_prevista))}
      ${linhaInfo('Check-in', formatarDataHora(os.checkin_em))}
      ${linhaInfo('Check-out', formatarDataHora(os.checkout_em))}
      ${linhaInfo('Km saída', os.km_saida ?? '—')}
      ${linhaInfo('Km retorno', os.km_retorno ?? '—')}
    </div>
    ${os.descricao ? `<p style="margin-top:10px;font-size:13px"><strong>Descrição:</strong> ${escHtml(os.descricao)}</p>` : ''}
    ${
      os.observacoes_gerais
        ? `<p style="margin-top:8px;font-size:13px"><strong>Observações gerais:</strong> ${escHtml(os.observacoes_gerais)}</p>`
        : ''
    }

    <h2>Cliente</h2>
    <div class="grid-info">
      ${linhaInfo('Nome', cliente.nome)}
      ${linhaInfo('Razão social', cliente.razao_social)}
      ${linhaInfo('CNPJ', cliente.cnpj)}
      ${linhaInfo('Endereço', enderecoCliente)}
      ${linhaInfo('Telefone', cliente.telefone || cliente.telefone_alternativo)}
      ${linhaInfo('E-mail', cliente.email || cliente.email_alternativo)}
    </div>

    <h2>Equipamentos e checklist</h2>
    ${(osEq || []).length ? equipamentosHtml : '<p class="vazio">Nenhum gerador vinculado a esta OS.</p>'}

    <h2>Peças trocadas</h2>
    ${pecasHtml}

    <h2>Assinaturas</h2>
    <div class="assinaturas">${assinaturasHtml}</div>

    <div class="rodape">
      Documento gerado pelo app Genforce. Em caso de divergência, prevalece o registro digital da OS #${escHtml(os.numero)}.
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    (function () {
      var botao = document.getElementById('btnBaixarPdf');
      if (!botao) return;
      botao.addEventListener('click', function () {
        if (typeof html2pdf === 'undefined') {
          alert('Não foi possível carregar o gerador de PDF. Use Imprimir e escolha "Salvar como PDF".');
          return;
        }
        botao.disabled = true;
        botao.textContent = 'Gerando PDF...';
        var el = document.getElementById('relatorio');
        html2pdf()
          .set({
            margin: [10, 10, 12, 10],
            filename: 'OS-${String(os.numero).replace(/'/g, '')}-Genforce.pdf',
            image: { type: 'jpeg', quality: 0.96 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
          })
          .from(el)
          .save()
          .then(function () {
            botao.disabled = false;
            botao.textContent = 'Baixar PDF';
          })
          .catch(function () {
            botao.disabled = false;
            botao.textContent = 'Baixar PDF';
            alert('Falha ao gerar o PDF. Tente Imprimir → Salvar como PDF.');
          });
      });
    })();
  </script>
</body>
</html>`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.open();
      janela.document.write(html);
      janela.document.close();
    } else {
      avisar('Permita pop-ups para abrir o relatório.', 'Bloqueado');
    }
    return;
  }

  avisar('No celular, use a versão web no navegador para baixar ou imprimir o PDF.', 'Relatório');
}
