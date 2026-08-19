import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { TIPOS_OS, TEMPLATE_PADRAO_ID } from '../lib/constantes';
import { useTema } from '../lib/tema';

function avisar(mensagem, titulo = 'Aviso') {
  if (Platform.OS === 'web') {
    window.alert(mensagem);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export default function NovaOS({ onBack, onCriada }) {
  const { cores } = useTema();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);

  const [unidades, setUnidades] = useState([]);
  const [unidadeId, setUnidadeId] = useState(null);

  const [equipamentos, setEquipamentos] = useState([]);
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({});

  const [mostrarNovoEquipamento, setMostrarNovoEquipamento] = useState(false);
  const [novoTag, setNovoTag] = useState('');
  const [novoFabricante, setNovoFabricante] = useState('');
  const [novoPotencia, setNovoPotencia] = useState('');
  const [novoPlacaMotor, setNovoPlacaMotor] = useState('');
  const [novoPlacaAlternador, setNovoPlacaAlternador] = useState('');
  const [salvandoEquipamento, setSalvandoEquipamento] = useState(false);

  const [tiposSelecionados, setTiposSelecionados] = useState({});
  const [dataPrevista, setDataPrevista] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [mostrarNovaUnidade, setMostrarNovaUnidade] = useState(false);
  const [novaUnidadeNome, setNovaUnidadeNome] = useState('');
  const [novaUnidadeEndereco, setNovaUnidadeEndereco] = useState('');
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);

  const [unidadeSelecionadaInfo, setUnidadeSelecionadaInfo] = useState(null);

  function alternarTipo(valor) {
    setTiposSelecionados((prev) => ({ ...prev, [valor]: !prev[valor] }));
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (clienteId) carregarUnidades(clienteId);
    else {
      setUnidades([]);
      setUnidadeId(null);
    }
  }, [clienteId]);

  useEffect(() => {
    if (unidadeId) carregarEquipamentos(unidadeId);
    else {
      setEquipamentos([]);
      setEquipamentosSelecionados({});
    }
  }, [unidadeId]);

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('id, nome').order('nome');
    setClientes(data || []);
  }

  async function carregarUnidades(idCliente) {
    const { data } = await supabase
      .from('unidades')
      .select('id, nome, endereco')
      .eq('cliente_id', idCliente)
      .order('nome');
    setUnidades(data || []);
    setUnidadeId(null);
    setUnidadeSelecionadaInfo(null);
  }

  async function carregarEquipamentos(idUnidade) {
    const { data } = await supabase
      .from('equipamentos')
      .select('id, tag, fabricante_gmg')
      .eq('unidade_id', idUnidade)
      .order('tag');
    setEquipamentos(data || []);
    setEquipamentosSelecionados({});
  }

  function alternarSelecao(idEquipamento) {
    setEquipamentosSelecionados((prev) => ({ ...prev, [idEquipamento]: !prev[idEquipamento] }));
  }

  async function cadastrarNovoCliente() {
    if (!novoClienteNome.trim()) {
      avisar('Informe o nome do cliente.', 'Preencha o campo obrigatório');
      return;
    }

    setSalvandoCliente(true);
    const { data, error } = await supabase
      .from('clientes')
      .insert({ nome: novoClienteNome.trim() })
      .select('id, nome')
      .single();
    setSalvandoCliente(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar cliente');
      return;
    }

    setClientes((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    setClienteId(data.id);
    setNovoClienteNome('');
    setMostrarNovoCliente(false);
  }

  async function cadastrarNovaUnidade() {
    if (!novaUnidadeNome.trim()) {
      avisar('Informe o nome da unidade.', 'Preencha o campo obrigatório');
      return;
    }

    setSalvandoUnidade(true);
    const { data, error } = await supabase
      .from('unidades')
      .insert({ cliente_id: clienteId, nome: novaUnidadeNome.trim(), endereco: novaUnidadeEndereco.trim() || null })
      .select('id, nome, endereco')
      .single();
    setSalvandoUnidade(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar unidade');
      return;
    }

    setUnidades((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    setUnidadeId(data.id);
    setUnidadeSelecionadaInfo(data);
    setNovaUnidadeNome('');
    setNovaUnidadeEndereco('');
    setMostrarNovaUnidade(false);
  }

  async function cadastrarNovoEquipamento() {
    if (!novoTag.trim()) {
      avisar('Informe a identificação do gerador (ex: GMG 03).', 'Preencha o campo obrigatório');
      return;
    }

    setSalvandoEquipamento(true);

    const { data, error } = await supabase
      .from('equipamentos')
      .insert({
        unidade_id: unidadeId,
        tag: novoTag.trim(),
        fabricante_gmg: novoFabricante.trim() || null,
        potencia_kva: novoPotencia ? Number(novoPotencia) : null,
        placa_motor: novoPlacaMotor.trim() || null,
        placa_alternador: novoPlacaAlternador.trim() || null,
      })
      .select('id, tag, fabricante_gmg')
      .single();

    setSalvandoEquipamento(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar gerador');
      return;
    }

    setEquipamentos((prev) => [...prev, data]);
    setEquipamentosSelecionados((prev) => ({ ...prev, [data.id]: true }));
    setNovoTag('');
    setNovoFabricante('');
    setNovoPotencia('');
    setNovoPlacaMotor('');
    setNovoPlacaAlternador('');
    setMostrarNovoEquipamento(false);
  }

  async function criarOS() {
    if (!clienteId) {
      avisar('Escolha o cliente.', 'Falta informação');
      return;
    }
    if (!unidadeId) {
      avisar('Escolha a unidade.', 'Falta informação');
      return;
    }
    const idsSelecionados = Object.keys(equipamentosSelecionados).filter(
      (id) => equipamentosSelecionados[id]
    );
    if (idsSelecionados.length === 0) {
      avisar('Marque ao menos um gerador para esta OS.', 'Falta informação');
      return;
    }
    const tiposEscolhidos = Object.keys(tiposSelecionados).filter((valor) => tiposSelecionados[valor]);
    if (tiposEscolhidos.length === 0) {
      avisar('Marque ao menos um tipo de OS.', 'Falta informação');
      return;
    }

    setSalvando(true);

    let dataConvertida = null;
    if (dataPrevista.trim()) {
      const partes = dataPrevista.trim().split('/');
      if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        dataConvertida = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }

    const { data: novaOs, error: osError } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_id: clienteId,
        unidade_id: unidadeId,
        status: 'pendente',
        data_inicio_prevista: dataConvertida,
        descricao: descricao.trim() || null,
      })
      .select('id')
      .single();

    if (osError) {
      console.log(osError);
      avisar(osError.message || 'Tente novamente.', 'Erro ao criar OS');
      setSalvando(false);
      return;
    }

    const linhasOsEquipamentos = idsSelecionados.map((idEquipamento) => ({
      os_id: novaOs.id,
      equipamento_id: idEquipamento,
      template_id: TEMPLATE_PADRAO_ID,
    }));

    const { error: vinculoError } = await supabase
      .from('os_equipamentos')
      .insert(linhasOsEquipamentos);

    if (vinculoError) {
      console.log(vinculoError);
      setSalvando(false);
      avisar(vinculoError.message || 'Tente novamente.', 'Erro ao vincular geradores');
      return;
    }

    const linhasOsTipos = tiposEscolhidos.map((valorTipo) => ({
      os_id: novaOs.id,
      tipo: valorTipo,
    }));

    const { error: tiposError } = await supabase.from('os_tipos').insert(linhasOsTipos);

    setSalvando(false);

    if (tiposError) {
      console.log(tiposError);
      avisar(tiposError.message || 'Tente novamente.', 'Erro ao salvar tipo da OS');
      return;
    }

    onCriada();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Nova OS</Text>

      <Text style={[styles.label, { color: cores.texto }]}>Cliente</Text>
      <View style={[styles.listaBox, { borderColor: cores.borda }]}>
        {clientes.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.itemLista, clienteId === c.id && styles.itemListaSelecionado]}
            onPress={() => setClienteId(c.id)}
          >
            <Text style={clienteId === c.id ? styles.itemListaTextoSelecionado : [styles.itemListaTexto, { color: cores.texto }]}>
              {c.nome}
            </Text>
          </TouchableOpacity>
        ))}
        {clientes.length === 0 ? <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>Nenhum cliente cadastrado.</Text> : null}
      </View>

      {mostrarNovoCliente ? (
        <View style={styles.novoEquipamentoForm}>
          <TextInput
            style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
            placeholder="Nome do cliente *"
            placeholderTextColor={cores.placeholder}
            value={novoClienteNome}
            onChangeText={setNovoClienteNome}
          />
          <Button
            title={salvandoCliente ? 'Salvando...' : 'Salvar cliente'}
            onPress={cadastrarNovoCliente}
            disabled={salvandoCliente}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.novoEquipamentoBotao} onPress={() => setMostrarNovoCliente(true)}>
          <Text style={styles.novoEquipamentoBotaoTexto}>+ Cadastrar novo cliente</Text>
        </TouchableOpacity>
      )}

      {clienteId ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>Unidade</Text>
          <View style={[styles.listaBox, { borderColor: cores.borda }]}>
            {unidades.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.itemLista, unidadeId === u.id && styles.itemListaSelecionado]}
                onPress={() => {
                  setUnidadeId(u.id);
                  setUnidadeSelecionadaInfo(u);
                }}
              >
                <Text style={unidadeId === u.id ? styles.itemListaTextoSelecionado : [styles.itemListaTexto, { color: cores.texto }]}>
                  {u.nome}
                </Text>
              </TouchableOpacity>
            ))}
            {unidades.length === 0 ? (
              <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>Nenhuma unidade cadastrada para este cliente.</Text>
            ) : null}
          </View>

          {unidadeSelecionadaInfo?.endereco ? (
            <Text style={[styles.enderecoTexto, { color: cores.textoSecundario }]}>📍 {unidadeSelecionadaInfo.endereco}</Text>
          ) : null}

          {mostrarNovaUnidade ? (
            <View style={styles.novoEquipamentoForm}>
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Nome da unidade (ex: Sede, Filial Norte) *"
                value={novaUnidadeNome}
                onChangeText={setNovaUnidadeNome}
              />
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Endereço / localização"
                value={novaUnidadeEndereco}
                onChangeText={setNovaUnidadeEndereco}
              />
              <Button
                title={salvandoUnidade ? 'Salvando...' : 'Salvar unidade'}
                onPress={cadastrarNovaUnidade}
                disabled={salvandoUnidade}
              />
            </View>
          ) : (
            <TouchableOpacity style={styles.novoEquipamentoBotao} onPress={() => setMostrarNovaUnidade(true)}>
              <Text style={styles.novoEquipamentoBotaoTexto}>+ Cadastrar nova unidade</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      {unidadeId ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>Geradores (marque um ou mais)</Text>
          <View style={[styles.listaBox, { borderColor: cores.borda }]}>
            {equipamentos.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.checkboxLinha}
                onPress={() => alternarSelecao(e.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    equipamentosSelecionados[e.id] && styles.checkboxMarcado,
                  ]}
                >
                  {equipamentosSelecionados[e.id] ? <Text style={styles.checkboxMarcaTexto}>✓</Text> : null}
                </View>
                <Text style={[styles.itemListaTexto, { color: cores.texto }]}>
                  {e.tag} {e.fabricante_gmg ? `— ${e.fabricante_gmg}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
            {equipamentos.length === 0 ? (
              <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>Nenhum gerador cadastrado nesta unidade ainda.</Text>
            ) : null}
          </View>

          {mostrarNovoEquipamento ? (
            <View style={styles.novoEquipamentoForm}>
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Identificação (ex: GMG 03) *"
                value={novoTag}
                onChangeText={setNovoTag}
              />
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Fabricante do GMG"
                value={novoFabricante}
                onChangeText={setNovoFabricante}
              />
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Potência (KVA)"
                value={novoPotencia}
                onChangeText={setNovoPotencia}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Placa do motor"
                value={novoPlacaMotor}
                onChangeText={setNovoPlacaMotor}
              />
              <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                placeholder="Placa do alternador"
                value={novoPlacaAlternador}
                onChangeText={setNovoPlacaAlternador}
              />
              <Button
                title={salvandoEquipamento ? 'Salvando...' : 'Salvar gerador'}
                onPress={cadastrarNovoEquipamento}
                disabled={salvandoEquipamento}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.novoEquipamentoBotao}
              onPress={() => setMostrarNovoEquipamento(true)}
            >
              <Text style={styles.novoEquipamentoBotaoTexto}>+ Cadastrar novo gerador</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { color: cores.texto }]}>Tipo de OS (marque um ou mais)</Text>
          <View style={styles.tipoRow}>
            {TIPOS_OS.map((t) => (
              <TouchableOpacity
                key={t.valor}
                style={[styles.tipoButton, tiposSelecionados[t.valor] && styles.tipoButtonSelecionado]}
                onPress={() => alternarTipo(t.valor)}
              >
                <Text style={tiposSelecionados[t.valor] ? styles.tipoTextoSelecionado : styles.tipoTexto}>
                  {tiposSelecionados[t.valor] ? '✓ ' : ''}
                  {t.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: cores.texto }]}>Data prevista da manutenção</Text>
          <TextInput
            style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={cores.placeholder}
            value={dataPrevista}
            onChangeText={setDataPrevista}
          />

          <Text style={[styles.label, { color: cores.texto }]}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.descricaoInput, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
            placeholder="Descrição da OS..."
            placeholderTextColor={cores.placeholder}
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <Button
            title={salvando ? 'Criando OS...' : 'Criar OS'}
            onPress={criarOS}
            disabled={salvando}
          />
          <View style={{ height: 40 }} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20, backgroundColor: '#fff' },
  backButton: { marginBottom: 10 },
  backText: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  listaBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 4 },
  itemLista: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  itemListaSelecionado: { backgroundColor: '#007AFF' },
  itemListaTexto: { color: '#333' },
  itemListaTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
  avisoVazio: { color: '#999', fontStyle: 'italic', padding: 10, fontSize: 13 },
  enderecoTexto: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 4 },
  checkboxLinha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkboxMarcaTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  novoEquipamentoForm: { marginTop: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10 },
  novoEquipamentoBotao: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  novoEquipamentoBotaoTexto: { color: '#007AFF', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  descricaoInput: { minHeight: 80, textAlignVertical: 'top' },
  tipoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tipoButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  tipoButtonSelecionado: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tipoTexto: { color: '#333' },
  tipoTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
});