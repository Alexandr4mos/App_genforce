import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTema } from '../lib/tema';
import SeletorCliente from './SeletorCliente';
import {
  HORIMETRO_TEMPLATE_ITEM_ID,
  contarTrocasPorDescricao,
  rotulosTiposOs,
  textoProximaTroca,
} from '../lib/pecasHistorico';

function formatarDataHora(valor) {
  if (!valor) return '—';
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

const COLUNAS = [
  { chave: 'data', rotulo: 'Data', largura: 110 },
  { chave: 'tipo', rotulo: 'Tipo', largura: 140 },
  { chave: 'peca', rotulo: 'Descrição da peça', largura: 160 },
  { chave: 'horimetro', rotulo: 'Horímetro', largura: 90 },
  { chave: 'responsavel', rotulo: 'Responsável', largura: 120 },
  { chave: 'qtd', rotulo: 'Qtd. trocas', largura: 90 },
  { chave: 'proxima', rotulo: 'Próxima troca', largura: 180 },
  { chave: 'fotos', rotulo: 'Fotos', largura: 80 },
];

export default function HistoricoPecas() {
  const { cores } = useTema();
  const [clientesBusca, setClientesBusca] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [equipamentoId, setEquipamentoId] = useState(null);
  const [pecas, setPecas] = useState([]);
  const [horimetroPorOs, setHorimetroPorOs] = useState({});
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingPecas, setLoadingPecas] = useState(false);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_desc');
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [termoCliente, setTermoCliente] = useState('');

  useEffect(() => {
    const termo = termoCliente.trim();
    if (termo.length < 2) {
      setClientesBusca([]);
      setLoadingClientes(false);
      return;
    }

    setLoadingClientes(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, razao_social')
        .or(`nome.ilike.%${termo}%,razao_social.ilike.%${termo}%`)
        .order('nome')
        .limit(40);
      setClientesBusca(data || []);
      setLoadingClientes(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [termoCliente]);

  useEffect(() => {
    if (!clienteId) {
      setEquipamentos([]);
      setEquipamentoId(null);
      return;
    }

    async function carregarEquipamentos() {
      const { data: unidades } = await supabase
        .from('unidades')
        .select('id')
        .eq('cliente_id', clienteId);

      const unidadeIds = (unidades || []).map((u) => u.id);
      if (!unidadeIds.length) {
        setEquipamentos([]);
        setEquipamentoId(null);
        return;
      }

      const { data } = await supabase
        .from('equipamentos')
        .select('id, tag, fabricante_gmg, unidades(nome)')
        .in('unidade_id', unidadeIds)
        .order('tag');

      setEquipamentos(data || []);
      setEquipamentoId(null);
    }

    carregarEquipamentos();
  }, [clienteId]);

  useEffect(() => {
    if (!equipamentoId) {
      setPecas([]);
      setHorimetroPorOs({});
      return;
    }
    carregarPecas(equipamentoId);
  }, [equipamentoId]);

  async function carregarHorimetros(osIds, eqId) {
    if (!osIds.length) {
      setHorimetroPorOs({});
      return;
    }

    const { data: osEquip } = await supabase
      .from('os_equipamentos')
      .select('id, os_id')
      .eq('equipamento_id', eqId)
      .in('os_id', osIds);

    const mapaOsParaOe = {};
    (osEquip || []).forEach((row) => {
      mapaOsParaOe[row.os_id] = row.id;
    });

    const oeIds = Object.values(mapaOsParaOe);
    if (!oeIds.length) {
      setHorimetroPorOs({});
      return;
    }

    const { data: respostas } = await supabase
      .from('checklist_respostas')
      .select('valor, os_equipamento_id')
      .in('os_equipamento_id', oeIds)
      .eq('template_item_id', HORIMETRO_TEMPLATE_ITEM_ID);

    const mapa = {};
    osIds.forEach((osId) => {
      const oeId = mapaOsParaOe[osId];
      const resp = (respostas || []).find((r) => r.os_equipamento_id === oeId);
      if (resp?.valor != null && String(resp.valor).trim() !== '') {
        mapa[osId] = resp.valor;
      }
    });
    setHorimetroPorOs(mapa);
  }

  async function carregarPecas(eqId) {
    setLoadingPecas(true);
    const { data, error } = await supabase
      .from('relatorio_pecas')
      .select(
        `id, peca, codigo_peca, quantidade, data_hora, proxima_troca_prevista, os_id,
        usuarios(nome),
        ordens_servico(os_tipos(tipo)),
        fotos(id, url)`
      )
      .eq('equipamento_id', eqId)
      .order('data_hora', { ascending: false });

    if (error) {
      setPecas([]);
      setHorimetroPorOs({});
      setLoadingPecas(false);
      return;
    }

    const lista = data || [];
    setPecas(lista);
    await carregarHorimetros([...new Set(lista.map((p) => p.os_id).filter(Boolean))], eqId);
    setLoadingPecas(false);
  }

  const pecasVisiveis = useMemo(() => {
    let lista = [...pecas];
    const termo = buscaPeca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((p) => (p.peca || '').toLowerCase().includes(termo));
    }

    lista.sort((a, b) => {
      if (ordenacao === 'peca_asc') return (a.peca || '').localeCompare(b.peca || '', 'pt-BR');
      if (ordenacao === 'peca_desc') return (b.peca || '').localeCompare(a.peca || '', 'pt-BR');
      const da = new Date(a.data_hora).getTime();
      const db = new Date(b.data_hora).getTime();
      return ordenacao === 'data_asc' ? da - db : db - da;
    });

    return lista;
  }, [pecas, buscaPeca, ordenacao]);

  function selecionarCliente(c) {
    setClienteId(c.id);
    setEquipamentoId(null);
    setPecas([]);
  }

  function rotuloEquipamento(eq) {
    const tag = eq.tag || 'Sem tag';
    const fab = eq.fabricante_gmg ? ` · ${eq.fabricante_gmg}` : '';
    const unidade = eq.unidades?.nome ? ` (${eq.unidades.nome})` : '';
    return `${tag}${fab}${unidade}`;
  }

  return (
    <View>
      <Text style={[styles.label, { color: cores.texto }]}>Cliente</Text>
      <Text style={[styles.dica, { color: cores.textoSecundario }]}>
        Digite ao menos 2 letras para buscar o cliente.
      </Text>
      <SeletorCliente
        clientes={clientesBusca}
        clienteId={clienteId}
        onSelecionar={selecionarCliente}
        filtrarLocal={false}
        onBuscaChange={setTermoCliente}
        placeholderBusca="Buscar cliente..."
      />
      {loadingClientes ? <ActivityIndicator style={{ marginVertical: 8 }} /> : null}

      {clienteId ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>Gerador / equipamento</Text>
          {equipamentos.length === 0 ? (
            <Text style={[styles.dica, { color: cores.textoSuave }]}>
              Nenhum equipamento cadastrado para este cliente.
            </Text>
          ) : (
            <View style={styles.equipRow}>
              {equipamentos.map((eq) => {
                const ativo = equipamentoId === eq.id;
                return (
                  <TouchableOpacity
                    key={eq.id}
                    style={[
                      styles.equipChip,
                      {
                        borderColor: cores.borda,
                        backgroundColor: ativo ? cores.primario : cores.fundoCard,
                      },
                    ]}
                    onPress={() => setEquipamentoId(eq.id)}
                  >
                    <Text style={{ color: ativo ? '#fff' : cores.texto, fontSize: 12, fontWeight: '600' }}>
                      {rotuloEquipamento(eq)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      {equipamentoId ? (
        <>
          <TextInput
            style={[
              styles.buscaPeca,
              { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
            ]}
            placeholder="Filtrar por descrição da peça (ex: óleo)"
            placeholderTextColor={cores.placeholder}
            value={buscaPeca}
            onChangeText={setBuscaPeca}
          />

          <View style={styles.ordenacaoRow}>
            <Text style={[styles.ordenacaoLabel, { color: cores.textoSecundario }]}>Ordenar:</Text>
            {[
              { valor: 'data_desc', rotulo: 'Data ↓' },
              { valor: 'data_asc', rotulo: 'Data ↑' },
              { valor: 'peca_asc', rotulo: 'Peça A–Z' },
              { valor: 'peca_desc', rotulo: 'Peça Z–A' },
            ].map((op) => (
              <TouchableOpacity
                key={op.valor}
                style={[
                  styles.ordenacaoChip,
                  {
                    borderColor: cores.borda,
                    backgroundColor: ordenacao === op.valor ? cores.primario : cores.fundoCard,
                  },
                ]}
                onPress={() => setOrdenacao(op.valor)}
              >
                <Text
                  style={{
                    color: ordenacao === op.valor ? '#fff' : cores.texto,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {op.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingPecas ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

          {!loadingPecas && pecasVisiveis.length === 0 ? (
            <Text style={[styles.dica, { color: cores.textoSuave }]}>
              Nenhuma peça registrada para este gerador.
            </Text>
          ) : null}

          {!loadingPecas && pecasVisiveis.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={[styles.linhaHeader, { borderColor: cores.borda, backgroundColor: cores.fundoSecundario }]}>
                  {COLUNAS.map((col) => (
                    <Text
                      key={col.chave}
                      style={[styles.celulaHeader, { width: col.largura, color: cores.texto }]}
                    >
                      {col.rotulo}
                    </Text>
                  ))}
                </View>
                {pecasVisiveis.map((p) => {
                  const fotos = p.fotos || [];
                  return (
                    <View
                      key={p.id}
                      style={[styles.linhaDados, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
                    >
                      <Text style={[styles.celula, { width: COLUNAS[0].largura, color: cores.texto }]}>
                        {formatarDataHora(p.data_hora)}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[1].largura, color: cores.texto }]}>
                        {rotulosTiposOs(p.ordens_servico?.os_tipos)}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[2].largura, color: cores.texto }]}>
                        {p.peca}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[3].largura, color: cores.texto }]}>
                        {horimetroPorOs[p.os_id] ?? '—'}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[4].largura, color: cores.texto }]}>
                        {p.usuarios?.nome || '—'}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[5].largura, color: cores.texto }]}>
                        {contarTrocasPorDescricao(pecas, p.peca)}
                      </Text>
                      <Text style={[styles.celula, { width: COLUNAS[6].largura, color: cores.texto }]}>
                        {textoProximaTroca(p.proxima_troca_prevista)}
                      </Text>
                      <View style={[styles.celulaFotos, { width: COLUNAS[7].largura }]}>
                        {fotos.length === 0 ? (
                          <Text style={{ color: cores.textoSuave }}>—</Text>
                        ) : (
                          <View style={styles.fotosRow}>
                            {fotos.map((f) => (
                              <TouchableOpacity key={f.id} onPress={() => setFotoAmpliada(f.url)}>
                                <Image source={{ uri: f.url }} style={styles.fotoMini} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
        </>
      ) : null}

      <Modal visible={Boolean(fotoAmpliada)} transparent animationType="fade" onRequestClose={() => setFotoAmpliada(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFotoAmpliada(null)}>
          {fotoAmpliada ? (
            <Image source={{ uri: fotoAmpliada }} style={styles.fotoGrande} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  dica: { fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  equipChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  buscaPeca: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  ordenacaoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 },
  ordenacaoLabel: { fontSize: 12, fontWeight: '600' },
  ordenacaoChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  linhaHeader: { flexDirection: 'row', borderWidth: 1, borderBottomWidth: 0 },
  linhaDados: { flexDirection: 'row', borderWidth: 1, borderTopWidth: 0 },
  celulaHeader: { fontSize: 11, fontWeight: '700', padding: 8 },
  celula: { fontSize: 12, padding: 8 },
  celulaFotos: { padding: 6, justifyContent: 'center' },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  fotoMini: { width: 36, height: 36, borderRadius: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fotoGrande: { width: '100%', height: '80%' },
});
