import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar, confirmarAcao } from '../lib/avisos';
import { STATUS_OS, rotuloTipo, rotuloStatus, corDoStatus, estiloBadgeStatus, statusEfetivo } from '../lib/constantes';
import { ehPrivilegiado } from '../lib/auth';
import { useTema, RAIO, SOMBRA, ALVO_TOQUE, LARGURA_DESKTOP } from '../lib/tema';
import { useFiltroOS } from '../lib/filtroOS';
import DateRangeFilter from '../components/DateRangeFilter';
import Botao from '../components/ui/Botao';
import Icone from '../components/ui/Icone';
import { BadgeStatus } from '../components/ui/Badge';
import { SkeletonListaOS } from '../components/ui/Skeleton';
import EstadoVazio from '../components/ui/EstadoVazio';
import { formatarJanelaPrevista, limitesConsulta } from '../lib/dateRangeService';

const OPCOES_ORDENACAO = [
  { valor: 'data_asc', rotulo: 'Data prevista ↑' },
  { valor: 'data_desc', rotulo: 'Data prevista ↓' },
  { valor: 'numero_desc', rotulo: 'Número (maior)' },
  { valor: 'numero_asc', rotulo: 'Número (menor)' },
  { valor: 'cliente_asc', rotulo: 'Cliente (A–Z)' },
];

export default function ListaOS({
  userId,
  onAbrirOS,
  onCriarOS,
  onEditarOS,
  onRemanejar,
}) {
  const { cores, modoEscuro } = useTema();
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;
  const colunas = width >= 1400 ? 2 : 1;
  const { dateFilter, setDateFilter, filtroStatus, setFiltroStatus } = useFiltroOS();
  const [papel, setPapel] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_asc');
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const queryIdRef = useRef(0);
  const appliedRangeRef = useRef(dateFilter.appliedRange);
  const giroRefresh = useRef(new Animated.Value(0)).current;
  const giroLoopRef = useRef(null);

  const privilegiado = ehPrivilegiado(papel);


  useEffect(() => {
    if (!userId) return;
    supabase
      .from('usuarios')
      .select('papel')
      .eq('id', userId)
      .single()
      .then(({ data }) => setPapel(data?.papel || 'tecnico'));
  }, [userId]);

  useEffect(() => {
    if (loading) {
      giroRefresh.setValue(0);
      const loop = Animated.loop(
        Animated.timing(giroRefresh, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      giroLoopRef.current = loop;
      loop.start();
      return () => {
        loop.stop();
        giroLoopRef.current = null;
      };
    }
    giroLoopRef.current?.stop();
    giroLoopRef.current = null;
    giroRefresh.setValue(0);
  }, [loading, giroRefresh]);

  function tentarCriarOS() {
    if (!privilegiado) {
      avisar(
        'Você não tem permissão para esta ação. Apenas administradores podem criar OS.',
        'Sem permissão'
      );
      return;
    }
    onCriarOS();
  }

  function tentarRemanejar(osId) {
    if (!privilegiado) {
      avisar(
        'Você não tem permissão para esta ação. Apenas administradores podem remanejar OS.',
        'Sem permissão'
      );
      return;
    }
    onRemanejar(osId);
  }

  useEffect(() => {
    appliedRangeRef.current = dateFilter.appliedRange;
    fetchOrdens(dateFilter.appliedRange);
  }, []);

  // Se o período mudou enquanto a tela estava desmontada, recarrega ao remontar.
  useEffect(() => {
    if (appliedRangeRef.current !== dateFilter.appliedRange) {
      appliedRangeRef.current = dateFilter.appliedRange;
      fetchOrdens(dateFilter.appliedRange);
    }
  }, [dateFilter.appliedRange]);

  async function fetchOrdens(range) {
    const queryId = ++queryIdRef.current;
    setLoading(true);
    setErrorMsg('');
    setOrdens([]);

    let query = supabase
      .from('ordens_servico')
      .select(
        'id, numero, status, descricao, data_inicio_prevista, data_fim_prevista, checkin_em, checkout_em, clientes(nome, razao_social), os_tipos(tipo), os_equipamentos(equipamentos(tag, fabricante_gmg))'
      );

    if (range?.start && range?.end) {
      const { inicioIso, fimExclusivoIso } = limitesConsulta(range);
      query = query
        .gte('data_inicio_prevista', inicioIso)
        .lt('data_inicio_prevista', fimExclusivoIso);
    }

    const { data, error } = await query.order('data_inicio_prevista', { ascending: true });

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
      const efetivo = statusEfetivo(os);
      if (mapa[efetivo] !== undefined) mapa[efetivo] += 1;
    });
    return mapa;
  }, [ordens]);

  const ordensVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const statusAlvo = filtroStatus ? String(filtroStatus).trim() : null;
    let lista = ordens.filter((os) => {
      const efetivo = statusEfetivo(os);
      if (statusAlvo && efetivo !== statusAlvo) return false;
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

  // Sticky nativo da FlatList (índice 0 = período). Em 2 colunas usa fallback CSS sticky.
  const stickyNativo = colunas === 1;
  const listData = useMemo(() => {
    if (!stickyNativo) return loading ? [] : ordensVisiveis;
    return [
      { id: '__periodo', __tipo: 'periodo' },
      { id: '__toolbar', __tipo: 'toolbar' },
      ...(loading ? [] : ordensVisiveis),
    ];
  }, [stickyNativo, loading, ordensVisiveis]);

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
    const efetivo = statusEfetivo(item);
    const cor = corDoStatus(efetivo);
    const menuAberto = menuAbertoId === item.id;

    return (
      <View style={styles.cardWrap}>
        <View
          style={[
            styles.card,
            { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.sm },
            menuAberto && { zIndex: 40 },
          ]}
        >
          <View style={[styles.faixa, { backgroundColor: cor }]} />
          <View style={styles.cardCorpo}>
            <View style={styles.cardTopo}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir OS ${item.numero}`}
                style={styles.cardTopoTexto}
                onPress={() => onAbrirOS(item.id)}
              >
                <View style={styles.numeroRow}>
                  <Text style={[styles.numero, { color: cores.texto }]}>OS #{item.numero}</Text>
                  <BadgeStatus status={efetivo} />
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ações da OS ${item.numero}`}
                style={({ hovered }) => [styles.menuBotao, hovered && { backgroundColor: cores.fundoSecundario }]}
                onPress={() => setMenuAbertoId(menuAberto ? null : item.id)}
              >
                <Icone nome="more" tamanho={20} cor={cores.textoSecundario} />
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" onPress={() => onAbrirOS(item.id)}>
              <Text style={[styles.cliente, { color: cores.texto }]} numberOfLines={2}>
                {item.clientes?.nome}
              </Text>
              {item.clientes?.razao_social ? (
                <Text style={[styles.razao, { color: cores.textoSuave }]} numberOfLines={1}>
                  {item.clientes.razao_social}
                </Text>
              ) : null}

              {janela ? (
                <View style={styles.janelaRow}>
                  <Icone nome="calendar" tamanho={15} cor={cores.textoSecundario} />
                  <Text style={[styles.janela, { color: cores.textoSecundario }]}>{janela}</Text>
                </View>
              ) : null}

              {tipos.length > 0 || equipamentos.length > 0 ? (
                <View style={styles.chipsRow}>
                  {tipos.map((tipo) => (
                    <View key={tipo} style={[styles.chip, { backgroundColor: cores.chipTipoFundo }]}>
                      <Text style={[styles.chipTexto, { color: cores.primarioTexto }]}>{rotuloTipo(tipo)}</Text>
                    </View>
                  ))}
                  {equipamentos.map((rotulo, idx) => (
                    <View key={`${item.id}-eq-${idx}`} style={[styles.chip, { backgroundColor: cores.chipEquipFundo }]}>
                      <Text style={[styles.chipTexto, { color: cores.textoSecundario }]}>{rotulo}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {item.descricao ? (
                <Text style={[styles.descricao, { color: cores.textoSecundario }]} numberOfLines={2}>
                  {item.descricao}
                </Text>
              ) : null}
            </Pressable>
          </View>

          {menuAberto ? (
            <View style={[styles.menuDropdown, { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.md }]}>
              <OpcaoMenu
                icone="edit"
                texto="Editar OS"
                onPress={() => {
                  setMenuAbertoId(null);
                  onEditarOS(item.id);
                }}
              />
              <OpcaoMenu
                icone="calendar"
                texto="Remanejar"
                onPress={() => {
                  setMenuAbertoId(null);
                  tentarRemanejar(item.id);
                }}
              />
              <OpcaoMenu
                icone="trash"
                texto="Excluir OS"
                perigo
                onPress={() => {
                  setMenuAbertoId(null);
                  excluirOSDaLista(item.id);
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  const rotuloOrdenacao = OPCOES_ORDENACAO.find((o) => o.valor === ordenacao)?.rotulo || 'Ordenar';
  const rotuloFiltroStatus = filtroStatus ? rotuloStatus(filtroStatus) : 'Todos os status';

  const contagemTexto = loading
    ? 'Carregando…'
    : `${ordensVisiveis.length} ${ordensVisiveis.length === 1 ? 'ordem' : 'ordens'}`;

  function renderPeriodoCard() {
    const botaoAtualizar = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Atualizar lista"
        hitSlop={4}
        disabled={loading}
        style={styles.botaoAtualizar}
        onPress={() => fetchOrdens(dateFilter.appliedRange)}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: giroRefresh.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <Icone nome="refresh" tamanho={20} cor={cores.textoSecundario} />
        </Animated.View>
      </Pressable>
    );

    return (
      <View
        style={[
          styles.periodoSticky,
          {
            backgroundColor: cores.fundo,
            marginHorizontal: desktop ? -32 : -16,
            paddingHorizontal: desktop ? 32 : 16,
          },
        ]}
      >
        <DateRangeFilter
          compacto
          estado={dateFilter}
          onEstado={setDateFilter}
          onPeriodoAplicado={onPeriodoAplicado}
          contagemTexto={contagemTexto}
          direitaExtra={
            <View style={styles.periodoAcoes}>
              {botaoAtualizar}
              {desktop ? <Botao titulo="Nova OS" icone="plus" onPress={tentarCriarOS} /> : null}
            </View>
          }
        />
      </View>
    );
  }

  function renderToolbar() {
    return (
      <View style={{ zIndex: 50 }}>
        <View style={styles.contadoresRow}>
          {STATUS_OS.map((s) => {
            const ativo = filtroStatus === s.valor;
            const { fg, bg } = estiloBadgeStatus(s.valor, modoEscuro);
            return (
              <Pressable
                key={s.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={`Filtrar por ${s.rotulo}: ${contadores[s.valor] || 0}`}
                style={[
                  styles.contadorChip,
                  { backgroundColor: bg, borderColor: ativo ? fg : 'transparent' },
                ]}
                onPress={() => setFiltroStatus((atual) => (atual === s.valor ? null : s.valor))}
              >
                <View style={[styles.contadorPonto, { backgroundColor: corDoStatus(s.valor) }]} />
                <Text style={[styles.contadorTexto, { color: fg }]}>{s.rotulo}</Text>
                <Text style={[styles.contadorNumero, { color: fg }]}>{contadores[s.valor] || 0}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.buscaWrap, { borderColor: cores.bordaInput, backgroundColor: cores.fundoCard }]}>
          <Icone nome="search" tamanho={18} cor={cores.textoSuave} />
          <TextInput
            accessibilityLabel="Buscar OS"
            style={[styles.busca, { color: cores.texto }]}
            placeholder="Buscar cliente, número ou descrição…"
            placeholderTextColor={cores.placeholder}
            value={busca}
            onChangeText={setBusca}
          />
          {busca ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setBusca('')} style={styles.limpar}>
              <Icone nome="x" tamanho={16} cor={cores.textoSuave} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtrosRow}>
          <SeletorDropdown
            rotulo={rotuloOrdenacao}
            aberto={dropdownAberto === 'ordenar'}
            onAlternar={() => setDropdownAberto(dropdownAberto === 'ordenar' ? null : 'ordenar')}
            opcoes={OPCOES_ORDENACAO}
            valor={ordenacao}
            onEscolher={(v) => {
              setOrdenacao(v);
              setDropdownAberto(null);
            }}
          />
          <SeletorDropdown
            rotulo={rotuloFiltroStatus}
            aberto={dropdownAberto === 'status'}
            onAlternar={() => setDropdownAberto(dropdownAberto === 'status' ? null : 'status')}
            opcoes={[{ valor: '', rotulo: 'Todos os status' }, ...STATUS_OS]}
            valor={filtroStatus || ''}
            onEscolher={(v) => {
              setFiltroStatus(v || null);
              setDropdownAberto(null);
            }}
          />
        </View>

        {loading ? <SkeletonListaOS quantidade={3} /> : null}

        {!loading && ordensVisiveis.length === 0 ? (
          errorMsg ? (
            <EstadoVazio
              tom="erro"
              icone="alert"
              titulo="Não foi possível carregar as ordens"
              texto={`${errorMsg}. Verifique sua conexão e tente novamente.`}
              acao="Tentar de novo"
              onAcao={() => fetchOrdens(dateFilter.appliedRange)}
            />
          ) : (
            <EstadoVazio
              icone="inbox"
              titulo={
                filtroStatus
                  ? `Nenhuma OS "${rotuloStatus(filtroStatus)}" neste período`
                  : 'Nenhuma OS neste período'
              }
              texto="Ajuste o período ou os filtros para ver outras ordens de serviço."
              acao={filtroStatus || busca ? 'Limpar filtros' : privilegiado ? 'Criar OS' : undefined}
              onAcao={filtroStatus || busca ? () => { setFiltroStatus(null); setBusca(''); } : tentarCriarOS}
            />
          )
        ) : null}
      </View>
    );
  }

  function renderItem({ item }) {
    if (item.__tipo === 'periodo') return renderPeriodoCard();
    if (item.__tipo === 'toolbar') return renderToolbar();
    return renderCard({ item });
  }

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <FlatList
        key={`colunas-${colunas}-sticky-${stickyNativo ? 1 : 0}`}
        numColumns={!stickyNativo && colunas > 1 ? colunas : undefined}
        columnWrapperStyle={!stickyNativo && colunas > 1 ? styles.colunasWrap : undefined}
        style={styles.lista}
        contentContainerStyle={[styles.listaConteudo, desktop && styles.listaDesktop]}
        data={listData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        stickyHeaderIndices={stickyNativo ? [0] : undefined}
        ListHeaderComponent={
          stickyNativo
            ? null
            : () => (
                <View style={{ zIndex: 50 }}>
                  <View
                    style={
                      Platform.OS === 'web'
                        ? {
                            position: 'sticky',
                            top: 0,
                            zIndex: 40,
                            backgroundColor: cores.fundo,
                          }
                        : { backgroundColor: cores.fundo }
                    }
                  >
                    {renderPeriodoCard()}
                  </View>
                  {renderToolbar()}
                </View>
              )
        }
        extraData={{ filtroStatus, busca, ordenacao, cores, dropdownAberto, contadores, menuAbertoId, colunas, loading, errorMsg }}
        onScrollBeginDrag={() => {
          setDropdownAberto(null);
          setMenuAbertoId(null);
        }}
        ListEmptyComponent={null}
      />
      {!desktop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova OS"
          onPress={tentarCriarOS}
          style={[styles.fab, { backgroundColor: cores.primario, boxShadow: SOMBRA.lg }]}
        >
          <Icone nome="plus" tamanho={26} cor={cores.sobrePrimario} />
        </Pressable>
      ) : null}
    </View>
  );
}

function OpcaoMenu({ icone, texto, onPress, perigo }) {
  const { cores } = useTema();
  const cor = perigo ? cores.erro : cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }) => [styles.menuOpcao, hovered && { backgroundColor: cores.fundoSecundario }]}
    >
      <Icone nome={icone} tamanho={17} cor={cor} />
      <Text style={[styles.menuOpcaoTexto, { color: cor }]}>{texto}</Text>
    </Pressable>
  );
}

function SeletorDropdown({ rotulo, aberto, onAlternar, opcoes, valor, onEscolher }) {
  const { cores } = useTema();
  return (
    <View style={styles.filtroWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        style={[styles.filtroBotao, { borderColor: cores.bordaInput, backgroundColor: cores.fundoCard }]}
        onPress={onAlternar}
      >
        <Text style={[styles.filtroBotaoTexto, { color: cores.texto }]} numberOfLines={1}>
          {rotulo}
        </Text>
        <Icone nome="chevronDown" tamanho={16} cor={cores.textoSuave} />
      </Pressable>
      {aberto ? (
        <View style={[styles.dropdown, { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.md }]}>
          {opcoes.map((opcao) => {
            const ativo = valor === opcao.valor;
            return (
              <Pressable
                key={opcao.valor || 'todos'}
                accessibilityRole="menuitem"
                style={({ hovered }) => [styles.dropdownItem, hovered && { backgroundColor: cores.fundoSecundario }]}
                onPress={() => onEscolher(opcao.valor)}
              >
                <Text style={{ flex: 1, fontSize: 14, color: ativo ? cores.primario : cores.texto, fontWeight: ativo ? '700' : '500' }}>
                  {opcao.rotulo}
                </Text>
                {ativo ? <Icone nome="check" tamanho={16} cor={cores.primario} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lista: { flex: 1 },
  listaConteudo: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 96 },
  listaDesktop: { paddingHorizontal: 32, paddingTop: 16, width: '100%', maxWidth: 1240, alignSelf: 'center' },
  periodoSticky: {
    zIndex: 40,
    paddingBottom: 8,
  },
  periodoAcoes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoAtualizar: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadoresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 12 },
  contadorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RAIO.pill,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  contadorPonto: { width: 7, height: 7, borderRadius: 4 },
  contadorTexto: { fontSize: 13, fontWeight: '600' },
  contadorNumero: { fontSize: 13, fontWeight: '700' },
  buscaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: RAIO.md,
    paddingHorizontal: 14,
    minHeight: ALVO_TOQUE,
    marginBottom: 10,
  },
  busca: { flex: 1, fontSize: 15, paddingVertical: 10, outlineStyle: 'none' },
  limpar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  filtrosRow: { flexDirection: 'row', gap: 10, zIndex: 60, marginBottom: 16 },
  filtroWrap: { flex: 1 },
  filtroBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderRadius: RAIO.md,
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 14,
  },
  filtroBotaoTexto: { fontSize: 14, fontWeight: '500', flex: 1 },
  dropdown: {
    position: 'absolute',
    top: ALVO_TOQUE + 6,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: RAIO.md,
    paddingVertical: 4,
    zIndex: 70,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', minHeight: 40, paddingHorizontal: 14 },
  cardWrap: { flex: 1, minWidth: 0 },
  colunasWrap: { gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: RAIO.lg,
    marginBottom: 12,
    marginHorizontal: 0,
    flexDirection: 'row',
    overflow: 'visible',
  },
  faixa: { width: 5, borderTopLeftRadius: RAIO.lg, borderBottomLeftRadius: RAIO.lg },
  cardCorpo: { flex: 1, padding: 16, minWidth: 0 },
  cardTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTopoTexto: { flex: 1 },
  numeroRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  numero: { fontSize: 14, fontWeight: '700' },
  menuBotao: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    marginRight: -10,
    marginTop: -10,
    borderRadius: RAIO.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cliente: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  razao: { fontSize: 13, marginTop: 2 },
  janelaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  janela: { fontSize: 13, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { borderRadius: RAIO.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipTexto: { fontSize: 12, fontWeight: '600' },
  descricao: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  menuDropdown: {
    position: 'absolute',
    top: 44,
    right: 12,
    minWidth: 180,
    borderWidth: 1,
    borderRadius: RAIO.md,
    paddingVertical: 4,
    zIndex: 80,
  },
  menuOpcao: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 14 },
  menuOpcaoTexto: { fontSize: 14, fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
