import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Button,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar, confirmarAcao } from '../lib/avisos';
import { STATUS_OS, rotuloTipo, rotuloStatus, corDoStatus } from '../lib/constantes';
import { useTema } from '../lib/tema';
import DateRangeFilter from '../components/DateRangeFilter';
import MenuLateral from '../components/MenuLateral';
import {
  criarEstadoInicialFiltroData,
  formatarJanelaPrevista,
  limitesConsulta,
} from '../lib/dateRangeService';

const OPCOES_ORDENACAO = [
  { valor: 'data_asc', rotulo: 'Data prevista ↑' },
  { valor: 'data_desc', rotulo: 'Data prevista ↓' },
  { valor: 'numero_desc', rotulo: 'Número (maior)' },
  { valor: 'numero_asc', rotulo: 'Número (menor)' },
  { valor: 'cliente_asc', rotulo: 'Cliente (A–Z)' },
];

export default function ListaOS({
  onAbrirOS,
  onCriarOS,
  onEditarOS,
  onRelatorio,
  onImportarClientes,
  onSair,
}) {
  const { cores, modoEscuro, alternarTema } = useTema();
  const [menuAberto, setMenuAberto] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => criarEstadoInicialFiltroData());
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_asc');
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const queryIdRef = useRef(0);

  useEffect(() => {
    fetchOrdens(dateFilter.appliedRange);
  }, []);

  async function fetchOrdens(range) {
    const queryId = ++queryIdRef.current;
    setLoading(true);
    setErrorMsg('');
    setOrdens([]);

    const { inicioIso, fimExclusivoIso } = limitesConsulta(range);

    const { data, error } = await supabase
      .from('ordens_servico')
      .select(
        'id, numero, status, descricao, data_inicio_prevista, data_fim_prevista, checkin_em, checkout_em, clientes(nome, razao_social), os_tipos(tipo), os_equipamentos(equipamentos(tag, fabricante_gmg))'
      )
      .gte('data_inicio_prevista', inicioIso)
      .lt('data_inicio_prevista', fimExclusivoIso)
      .order('data_inicio_prevista', { ascending: true });

    if (queryId !== queryIdRef.current) return;

    if (error) {
      setErrorMsg(error.message);
      setOrdens([]);
    } else {
      setOrdens(data || []);
    }
    setLoading(false);
  }

  function onPeriodoAplicado(range) {
    fetchOrdens(range);
  }

  async function excluirOSDaLista(osId) {
    const confirmado = await confirmarAcao(
      'Tem certeza que deseja excluir esta OS? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;

    await supabase.from('pendencias').update({ os_origem_id: null }).eq('os_origem_id', osId);
    await supabase.from('pendencias').update({ os_baixa_id: null }).eq('os_baixa_id', osId);

    const { error } = await supabase.from('ordens_servico').delete().eq('id', osId);

    if (error) {
      avisar(error.message || 'Tente novamente.', 'Erro ao excluir');
      return;
    }

    fetchOrdens(dateFilter.appliedRange);
  }

  const contadores = useMemo(() => {
    const mapa = {};
    STATUS_OS.forEach((s) => {
      mapa[s.valor] = 0;
    });
    ordens.forEach((os) => {
      if (mapa[os.status] !== undefined) mapa[os.status] += 1;
    });
    return mapa;
  }, [ordens]);

  const ordensVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = ordens.filter((os) => {
      if (filtroStatus && os.status !== filtroStatus) return false;
      if (!termo) return true;
      const tipos = (os.os_tipos || []).map((t) => rotuloTipo(t.tipo)).join(' ');
      const texto = [
        String(os.numero || ''),
        os.descricao || '',
        os.clientes?.nome || '',
        os.clientes?.razao_social || '',
        tipos,
      ]
        .join(' ')
        .toLowerCase();
      return texto.includes(termo);
    });

    const copia = [...lista];
    copia.sort((a, b) => {
      if (ordenacao === 'numero_desc') return (b.numero || 0) - (a.numero || 0);
      if (ordenacao === 'numero_asc') return (a.numero || 0) - (b.numero || 0);
      if (ordenacao === 'cliente_asc') {
        return (a.clientes?.nome || '').localeCompare(b.clientes?.nome || '', 'pt-BR');
      }
      const da = a.data_inicio_prevista || '';
      const db = b.data_inicio_prevista || '';
      if (ordenacao === 'data_desc') return db.localeCompare(da);
      return da.localeCompare(db);
    });
    return copia;
  }, [ordens, busca, filtroStatus, ordenacao]);

  function chipsEquipamentos(item) {
    return (item.os_equipamentos || [])
      .map((vinculo) => vinculo.equipamentos)
      .filter(Boolean)
      .map((eq) => {
        const tag = eq.tag || 'GMG';
        const fab = eq.fabricante_gmg ? ` | ${eq.fabricante_gmg}` : '';
        return `${tag}${fab}`;
      });
  }

  function renderCard({ item }) {
    const janela = formatarJanelaPrevista(item.data_inicio_prevista, item.data_fim_prevista);
    const tipos = (item.os_tipos || []).map((t) => t.tipo);
    const equipamentos = chipsEquipamentos(item);
    const agendado = item.status === 'agendado';
    const cor = corDoStatus(item.status);

    return (
      <View style={[styles.card, { borderLeftColor: cor, backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
        <View style={styles.cardHeaderRow}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => onAbrirOS(item.id)}>
            <View style={styles.numeroRow}>
              <Text style={[styles.cardTitle, { color: cores.texto }]}>#{item.numero}</Text>
              <View style={[styles.statusChip, { backgroundColor: cor }]}>
                {agendado ? <Text style={styles.statusChipIcone}>📅 </Text> : null}
                <Text style={styles.statusChipTexto}>{rotuloStatus(item.status)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBotao}
            onPress={() => setMenuAbertoId(menuAbertoId === item.id ? null : item.id)}
          >
            <Text style={[styles.menuBotaoTexto, { color: cores.textoSecundario }]}>⋮</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onAbrirOS(item.id)}>
          {janela ? <Text style={[styles.cardJanela, { color: cores.textoSecundario }]}>{janela}</Text> : null}
          <Text style={[styles.cardCliente, { color: cores.primario }]}>{item.clientes?.nome}</Text>
          {item.clientes?.razao_social ? (
            <Text style={[styles.cardRazao, { color: cores.textoSuave }]}>{item.clientes.razao_social}</Text>
          ) : null}

          {tipos.length > 0 ? (
            <View style={styles.chipsRow}>
              {tipos.map((tipo) => (
                <View key={tipo} style={[styles.chipTipo, { backgroundColor: cores.chipTipoFundo }]}>
                  <Text style={[styles.chipTipoTexto, { color: cores.primarioTexto }]}>{rotuloTipo(tipo)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {equipamentos.length > 0 ? (
            <View style={styles.chipsRow}>
              {equipamentos.map((rotulo, idx) => (
                <View key={`${item.id}-eq-${idx}`} style={[styles.chipEquip, { backgroundColor: cores.chipEquipFundo }]}>
                  <Text style={[styles.chipEquipTexto, { color: cores.texto }]}>{rotulo}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {item.descricao ? <Text style={[styles.cardDescricao, { color: cores.textoSecundario }]}>{item.descricao}</Text> : null}
        </TouchableOpacity>

        {menuAbertoId === item.id ? (
          <View style={[styles.menuDropdown, { borderColor: cores.borda }]}>
            <TouchableOpacity
              style={styles.menuOpcao}
              onPress={() => {
                setMenuAbertoId(null);
                onEditarOS(item.id);
              }}
            >
              <Text style={[styles.menuOpcaoTexto, { color: cores.texto }]}>✎ Editar OS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOpcao}
              onPress={() => {
                setMenuAbertoId(null);
                excluirOSDaLista(item.id);
              }}
            >
              <Text style={[styles.menuOpcaoTexto, styles.menuOpcaoExcluirTexto]}>🗑 Excluir OS</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  const rotuloOrdenacao = OPCOES_ORDENACAO.find((o) => o.valor === ordenacao)?.rotulo || 'Ordenar';
  const rotuloFiltroStatus = filtroStatus
    ? rotuloStatus(filtroStatus)
    : 'Status';

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <MenuLateral
        visivel={menuAberto}
        onFechar={() => setMenuAberto(false)}
        itens={[
          { rotulo: 'Criar OS', onPress: onCriarOS },
          { rotulo: 'Relatório', onPress: onRelatorio },
          { rotulo: 'Importar clientes', onPress: onImportarClientes },
          {
            rotulo: modoEscuro ? 'Modo claro' : 'Modo escuro',
            detalhe: modoEscuro ? 'Tema escuro ativo' : 'Tema claro ativo',
            onPress: alternarTema,
          },
          { rotulo: 'Sair', onPress: onSair },
        ]}
      />

      <View style={styles.tituloRow}>
        <TouchableOpacity style={styles.hamburguer} onPress={() => setMenuAberto(true)}>
          <Text style={[styles.hamburguerTexto, { color: cores.texto }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: cores.texto }]}>Ordens de Serviço</Text>
        <TouchableOpacity
          style={styles.atualizarBotao}
          onPress={() => fetchOrdens(dateFilter.appliedRange)}
        >
          <Text style={[styles.atualizarTexto, { color: cores.primario }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <DateRangeFilter
        estado={dateFilter}
        onEstado={setDateFilter}
        onPeriodoAplicado={onPeriodoAplicado}
      />

      <View style={styles.contadoresRow}>
        {STATUS_OS.map((s) => (
          <TouchableOpacity
            key={s.valor}
            style={[
              styles.contadorChip,
              { borderColor: corDoStatus(s.valor) },
              filtroStatus === s.valor && { backgroundColor: corDoStatus(s.valor) },
            ]}
            onPress={() => setFiltroStatus(filtroStatus === s.valor ? null : s.valor)}
          >
            <Text
              style={[
                styles.contadorTexto,
                { color: filtroStatus === s.valor ? '#fff' : corDoStatus(s.valor) },
              ]}
            >
              {s.rotulo} {contadores[s.valor] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[
          styles.busca,
          { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
        ]}
        placeholder="Buscar cliente, número ou descrição..."
        placeholderTextColor={cores.placeholder}
        value={busca}
        onChangeText={setBusca}
      />

      <View style={styles.filtrosRow}>
        <View style={styles.filtroWrap}>
          <TouchableOpacity
            style={[styles.filtroBotao, { borderColor: cores.borda, backgroundColor: cores.fundoSecundario }]}
            onPress={() => setDropdownAberto(dropdownAberto === 'ordenar' ? null : 'ordenar')}
          >
            <Text style={[styles.filtroBotaoTexto, { color: cores.texto }]} numberOfLines={1}>
              {rotuloOrdenacao} ▾
            </Text>
          </TouchableOpacity>
          {dropdownAberto === 'ordenar' ? (
            <View style={[styles.dropdown, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
              {OPCOES_ORDENACAO.map((opcao) => (
                <TouchableOpacity
                  key={opcao.valor}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setOrdenacao(opcao.valor);
                    setDropdownAberto(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemTexto,
                      { color: cores.texto },
                      ordenacao === opcao.valor && { color: cores.primario, fontWeight: '700' },
                    ]}
                  >
                    {opcao.rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.filtroWrap}>
          <TouchableOpacity
            style={[styles.filtroBotao, { borderColor: cores.borda, backgroundColor: cores.fundoSecundario }]}
            onPress={() => setDropdownAberto(dropdownAberto === 'status' ? null : 'status')}
          >
            <Text style={[styles.filtroBotaoTexto, { color: cores.texto }]} numberOfLines={1}>
              {rotuloFiltroStatus} ▾
            </Text>
          </TouchableOpacity>
          {dropdownAberto === 'status' ? (
            <View style={[styles.dropdown, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setFiltroStatus(null);
                  setDropdownAberto(null);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemTexto,
                    { color: cores.texto },
                    !filtroStatus && { color: cores.primario, fontWeight: '700' },
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {STATUS_OS.map((s) => (
                <TouchableOpacity
                  key={s.valor}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFiltroStatus(s.valor);
                    setDropdownAberto(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemTexto,
                      { color: cores.texto },
                      filtroStatus === s.valor && { color: cores.primario, fontWeight: '700' },
                    ]}
                  >
                    {s.rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
      {errorMsg ? (
        <View style={styles.erroBox}>
          <Text style={[styles.error, { color: cores.erro }]}>{errorMsg}</Text>
          <Button title="Tentar de novo" onPress={() => fetchOrdens(dateFilter.appliedRange)} />
        </View>
      ) : null}

      <FlatList
        data={ordensVisiveis}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        onScrollBeginDrag={() => {
          setDropdownAberto(null);
          setMenuAbertoId(null);
        }}
        ListEmptyComponent={
          loading ? null : (
            <Text style={[styles.vazio, { color: cores.textoSuave }]}>
              {errorMsg ? '' : 'Nenhum resultado encontrado neste período.'}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  tituloRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hamburguer: { paddingRight: 10, paddingVertical: 4 },
  hamburguerTexto: { fontSize: 26, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  atualizarBotao: { paddingHorizontal: 10, paddingVertical: 4 },
  atualizarTexto: { fontSize: 22, color: '#007AFF' },
  contadoresRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  contadorChip: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  contadorTexto: { fontSize: 12, fontWeight: '700' },
  busca: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  filtrosRow: { flexDirection: 'row', zIndex: 20, marginBottom: 8 },
  filtroWrap: { flex: 1, marginRight: 8 },
  filtroBotao: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
  },
  filtroBotaoTexto: { fontSize: 13, color: '#333' },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    zIndex: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemTexto: { color: '#333' },
  dropdownItemAtivo: { color: '#007AFF', fontWeight: '700' },
  novaOsBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  novaOsBotaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: 'red', marginBottom: 8 },
  erroBox: { marginBottom: 8 },
  vazio: { color: '#888', textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  numeroRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginRight: 8, marginBottom: 4 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  statusChipIcone: { color: '#fff', fontSize: 11 },
  statusChipTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardJanela: { fontSize: 13, color: '#444', fontWeight: '600', marginBottom: 6 },
  cardCliente: { fontWeight: '700', color: '#007AFF', fontSize: 15 },
  cardRazao: { fontSize: 12, color: '#777', marginBottom: 6 },
  cardDescricao: { fontSize: 13, color: '#444', marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  chipTipo: {
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  chipTipoTexto: { fontSize: 11, color: '#0b5ed7', fontWeight: '700' },
  chipEquip: {
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  chipEquipTexto: { fontSize: 11, color: '#333', fontWeight: '600' },
  menuBotao: { paddingHorizontal: 10, paddingVertical: 4 },
  menuBotaoTexto: { fontSize: 20, color: '#666', fontWeight: 'bold' },
  menuDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuOpcao: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#f2f2f2' },
  menuOpcaoTexto: { color: '#333' },
  menuOpcaoExcluirTexto: { color: '#e53935' },
});
