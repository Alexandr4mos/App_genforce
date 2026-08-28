import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';
import {
  TIPOS_OS,
  STATUS_OS,
  rotuloTipo,
  rotuloStatus,
  corDoStatus,
} from '../lib/constantes';
import SeletorCliente from '../components/SeletorCliente';
import DateRangeFilter from '../components/DateRangeFilter';
import { limitesConsulta, formatarJanelaPrevista, criarEstadoInicialFiltroData } from '../lib/dateRangeService';

function formatarDataHora(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Relatorio({ onBack, onAbrirOS, userId }) {
  const { cores } = useTema();
  const [aba, setAba] = useState('busca');
  const [papel, setPapel] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [tiposSelecionados, setTiposSelecionados] = useState({});
  const [somenteComPendencia, setSomenteComPendencia] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => criarEstadoInicialFiltroData());
  const [resultados, setResultados] = useState([]);
  const [filaRevisao, setFilaRevisao] = useState([]);
  const [pendenciasResolvidas, setPendenciasResolvidas] = useState([]);
  const [loading, setLoading] = useState(false);

  const privilegiado = papel === 'admin' || papel === 'supervisor';

  useEffect(() => {
    carregarClientes();
    if (userId) {
      supabase
        .from('usuarios')
        .select('papel')
        .eq('id', userId)
        .single()
        .then(({ data }) => setPapel(data?.papel || 'tecnico'));
    }
  }, [userId]);

  useEffect(() => {
    if (privilegiado) carregarFilaRevisao();
  }, [privilegiado]);

  useEffect(() => {
    if (aba === 'busca') buscarOS();
    else if (aba === 'revisao' && privilegiado) carregarFilaRevisao();
  }, [aba, clienteId, filtroStatus, tiposSelecionados, somenteComPendencia, dateFilter.appliedRange, privilegiado]);

  useEffect(() => {
    if (clienteId) carregarPendenciasResolvidas(clienteId);
    else setPendenciasResolvidas([]);
  }, [clienteId]);

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('id, nome, razao_social').order('nome');
    setClientes(data || []);
  }

  async function buscarOS() {
    setLoading(true);
    let query = supabase
      .from('ordens_servico')
      .select(
        `id, numero, status, descricao, data_inicio_prevista, data_fim_prevista, checkout_em, criado_em,
        clientes(nome, razao_social), os_tipos(tipo)`
      )
      .order('numero', { ascending: false });

    if (clienteId) query = query.eq('cliente_id', clienteId);
    if (filtroStatus) query = query.eq('status', filtroStatus);

    const limites = dateFilter.appliedRange ? limitesConsulta(dateFilter.appliedRange) : null;
    if (limites?.inicioIso) query = query.gte('data_inicio_prevista', limites.inicioIso);
    if (limites?.fimExclusivoIso) query = query.lt('data_inicio_prevista', limites.fimExclusivoIso);

    const { data, error } = await query.limit(200);
    setLoading(false);

    if (error) {
      avisar(error.message, 'Erro na busca');
      return;
    }

    let lista = data || [];
    const tiposAtivos = Object.keys(tiposSelecionados).filter((t) => tiposSelecionados[t]);
    if (tiposAtivos.length > 0) {
      lista = lista.filter((os) => {
        const tiposOs = (os.os_tipos || []).map((t) => t.tipo);
        return tiposAtivos.some((t) => tiposOs.includes(t));
      });
    }

    if (somenteComPendencia && clienteId) {
      const idsComPendencia = await osComPendenciaAberta(clienteId);
      lista = lista.filter((os) => idsComPendencia.has(os.id));
    }

    setResultados(lista);
  }

  async function osComPendenciaAberta(idCliente) {
    const { data: unidades } = await supabase.from('unidades').select('id').eq('cliente_id', idCliente);
    const unidadeIds = (unidades || []).map((u) => u.id);
    if (!unidadeIds.length) return new Set();

    const { data: equipamentos } = await supabase
      .from('equipamentos')
      .select('id')
      .in('unidade_id', unidadeIds);
    const equipamentoIds = (equipamentos || []).map((e) => e.id);
    if (!equipamentoIds.length) return new Set();

    const { data: pendencias } = await supabase
      .from('pendencias')
      .select('os_origem_id, equipamento_id')
      .in('equipamento_id', equipamentoIds)
      .neq('status', 'resolvida');

    const { data: osEq } = await supabase
      .from('os_equipamentos')
      .select('os_id, equipamento_id')
      .in('equipamento_id', equipamentoIds);

    const mapaEqOs = {};
    (osEq || []).forEach((row) => {
      mapaEqOs[row.equipamento_id] = [...(mapaEqOs[row.equipamento_id] || []), row.os_id];
    });

    const ids = new Set();
    (pendencias || []).forEach((p) => {
      if (p.os_origem_id) ids.add(p.os_origem_id);
      (mapaEqOs[p.equipamento_id] || []).forEach((osId) => ids.add(osId));
    });
    return ids;
  }

  async function carregarFilaRevisao() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(
        `id, numero, status, descricao, checkout_em,
        clientes(nome, razao_social), os_tipos(tipo)`
      )
      .eq('status', 'concluida')
      .order('checkout_em', { ascending: false });
    setLoading(false);
    if (error) {
      avisar(error.message, 'Erro ao carregar fila');
      return;
    }
    setFilaRevisao(data || []);
  }

  async function carregarPendenciasResolvidas(id) {
    const { data: unidades } = await supabase.from('unidades').select('id').eq('cliente_id', id);
    const unidadeIds = (unidades || []).map((u) => u.id);
    if (!unidadeIds.length) {
      setPendenciasResolvidas([]);
      return;
    }
    const { data: equipamentos } = await supabase
      .from('equipamentos')
      .select('id')
      .in('unidade_id', unidadeIds);
    const equipamentoIds = (equipamentos || []).map((e) => e.id);
    if (!equipamentoIds.length) {
      setPendenciasResolvidas([]);
      return;
    }
    const { data } = await supabase
      .from('pendencias')
      .select('id, item_solicitado, observacao_baixa, baixado_em, equipamentos(tag, fabricante_gmg)')
      .eq('status', 'resolvida')
      .in('equipamento_id', equipamentoIds)
      .order('baixado_em', { ascending: false });
    setPendenciasResolvidas(data || []);
  }

  function alternarTipo(valor) {
    setTiposSelecionados((prev) => ({ ...prev, [valor]: !prev[valor] }));
  }

  function renderCardOS(os) {
    const tipos = (os.os_tipos || []).map((t) => t.tipo);
    const dataRef = os.checkout_em || os.data_inicio_prevista || os.criado_em;
    return (
      <TouchableOpacity
        key={os.id}
        style={[styles.card, { borderColor: corDoStatus(os.status), backgroundColor: cores.fundoCard }]}
        onPress={() => onAbrirOS?.(os.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardNumero, { color: cores.texto }]}>OS #{os.numero}</Text>
          <View style={[styles.statusBadge, { backgroundColor: corDoStatus(os.status) }]}>
            <Text style={styles.statusBadgeTexto}>{rotuloStatus(os.status)}</Text>
          </View>
        </View>
        <Text style={[styles.cardCliente, { color: cores.texto }]}>
          {os.clientes?.nome}
          {os.clientes?.razao_social ? ` — ${os.clientes.razao_social}` : ''}
        </Text>
        {os.descricao ? (
          <Text style={[styles.cardDescricao, { color: cores.textoSecundario }]} numberOfLines={2}>
            {os.descricao}
          </Text>
        ) : null}
        <View style={styles.tiposRow}>
          {tipos.map((t) => (
            <View key={t} style={[styles.tipoChip, { backgroundColor: cores.chipTipoFundo }]}>
              <Text style={[styles.tipoChipTexto, { color: cores.primarioTexto }]}>{rotuloTipo(t)}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cardData, { color: cores.textoSuave }]}>{formatarDataHora(dataRef)}</Text>
      </TouchableOpacity>
    );
  }

  const clienteAtual = clientes.find((c) => c.id === clienteId);
  const listaAtual = aba === 'revisao' ? filaRevisao : resultados;

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Relatórios</Text>

      <View style={styles.abasRow}>
        <TouchableOpacity
          style={[styles.aba, aba === 'busca' && { backgroundColor: cores.primario }]}
          onPress={() => setAba('busca')}
        >
          <Text style={[styles.abaTexto, { color: aba === 'busca' ? '#fff' : cores.texto }]}>Buscar OS</Text>
        </TouchableOpacity>
        {privilegiado ? (
          <TouchableOpacity
            style={[styles.aba, aba === 'revisao' && { backgroundColor: cores.primario }]}
            onPress={() => setAba('revisao')}
          >
            <Text style={[styles.abaTexto, { color: aba === 'revisao' ? '#fff' : cores.texto }]}>
              Aguardando revisão ({filaRevisao.length})
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {aba === 'busca' ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>Cliente</Text>
          <SeletorCliente
            clientes={clientes}
            clienteId={clienteId}
            onSelecionar={(c) => setClienteId(c.id)}
          />

          <Text style={[styles.label, { color: cores.texto }]}>Status</Text>
          <View style={styles.chipsRow}>
            {STATUS_OS.map((s) => (
              <TouchableOpacity
                key={s.valor}
                style={[
                  styles.chip,
                  {
                    borderColor: corDoStatus(s.valor),
                    backgroundColor: filtroStatus === s.valor ? corDoStatus(s.valor) : cores.fundoCard,
                  },
                ]}
                onPress={() => setFiltroStatus((atual) => (atual === s.valor ? null : s.valor))}
              >
                <Text style={{ color: filtroStatus === s.valor ? '#fff' : corDoStatus(s.valor), fontSize: 12 }}>
                  {s.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: cores.texto }]}>Tipo de manutenção</Text>
          <View style={styles.chipsRow}>
            {TIPOS_OS.map((t) => (
              <TouchableOpacity
                key={t.valor}
                style={[
                  styles.chip,
                  {
                    borderColor: cores.borda,
                    backgroundColor: tiposSelecionados[t.valor] ? cores.primario : cores.fundoCard,
                  },
                ]}
                onPress={() => alternarTipo(t.valor)}
              >
                <Text
                  style={{
                    color: tiposSelecionados[t.valor] ? '#fff' : cores.texto,
                    fontSize: 11,
                  }}
                >
                  {t.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.toggleRow, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
            onPress={() => setSomenteComPendencia((v) => !v)}
          >
            <Text style={[styles.toggleTexto, { color: cores.texto }]}>
              {somenteComPendencia ? '☑' : '☐'} Só OS com pendência em aberto
            </Text>
          </TouchableOpacity>

          <DateRangeFilter
            estado={dateFilter}
            onEstado={setDateFilter}
            onPeriodoAplicado={(range) => setDateFilter((prev) => ({ ...prev, appliedRange: range }))}
          />
        </>
      ) : (
        <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
          OS concluídas aguardando revisão do supervisor.
        </Text>
      )}

      {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      {!loading && listaAtual.length === 0 ? (
        <Text style={[styles.vazio, { color: cores.textoSuave }]}>Nenhuma OS encontrada.</Text>
      ) : null}
      {!loading ? listaAtual.map(renderCardOS) : null}

      {aba === 'busca' && clienteAtual ? (
        <>
          <Text style={[styles.label, { color: cores.texto, marginTop: 20 }]}>
            Pendências resolvidas — {clienteAtual.nome}
          </Text>
          {pendenciasResolvidas.length === 0 ? (
            <Text style={[styles.vazio, { color: cores.textoSuave }]}>
              Nenhuma pendência resolvida para este cliente.
            </Text>
          ) : (
            pendenciasResolvidas.map((p) => (
              <View
                key={p.id}
                style={[styles.card, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
              >
                <Text style={[styles.cardCliente, { color: cores.texto }]}>{p.item_solicitado}</Text>
                {p.equipamentos?.tag ? (
                  <Text style={[styles.cardDescricao, { color: cores.textoSecundario }]}>
                    {p.equipamentos.tag}
                  </Text>
                ) : null}
                {p.observacao_baixa ? (
                  <Text style={[styles.cardDescricao, { color: cores.textoSecundario }]}>
                    Baixa: {p.observacao_baixa}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  subtitulo: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  abasRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  aba: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  abaTexto: { fontWeight: '700', fontSize: 13 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  toggleRow: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  toggleTexto: { fontSize: 14 },
  vazio: { fontStyle: 'italic', padding: 10 },
  card: { borderWidth: 2, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardNumero: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardCliente: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardDescricao: { fontSize: 13, marginBottom: 4 },
  tiposRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tipoChip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tipoChipTexto: { fontSize: 10, fontWeight: '600' },
  cardData: { fontSize: 12 },
});
