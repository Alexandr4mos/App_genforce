import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { TIPOS_OS, TEMPLATE_PADRAO_ID } from '../lib/constantes';
import { useTema } from '../lib/tema';
import { avisar } from '../lib/avisos';
import SeletorCliente from '../components/SeletorCliente';
import DatePickerCampo from '../components/DatePickerCampo';
import FormularioCliente from '../components/FormularioCliente';
import FormularioEquipamento from '../components/FormularioEquipamento';
import { cnpjValido, limparNumeros } from '../lib/mascaras';
import { gruposOpcionaisPadraoNovaOs, salvarGruposOpcionais } from '../lib/gruposOS';

export default function NovaOS({ onBack, onCriada }) {
  const { cores } = useTema();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);

  const [unidades, setUnidades] = useState([]);
  const [unidadeId, setUnidadeId] = useState(null);

  const [equipamentos, setEquipamentos] = useState([]);
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({});

  const [mostrarNovoEquipamento, setMostrarNovoEquipamento] = useState(false);
  const [novoEquipamento, setNovoEquipamento] = useState({
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
  });
  const [novosFiltros, setNovosFiltros] = useState([]);
  const [salvandoEquipamento, setSalvandoEquipamento] = useState(false);

  const [tiposSelecionados, setTiposSelecionados] = useState({});
  const [dataPrevista, setDataPrevista] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    cidade: '',
    uf: '',
  });
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [mostrarNovaUnidade, setMostrarNovaUnidade] = useState(false);
  const [novaUnidadeNome, setNovaUnidadeNome] = useState('');
  const [novaUnidadeEndereco, setNovaUnidadeEndereco] = useState('');
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);

  const [unidadeSelecionadaInfo, setUnidadeSelecionadaInfo] = useState(null);
  const unidadesRequestRef = useRef(0);
  const clienteNomeSelecionado = clientes.find((c) => c.id === clienteId)?.nome || '';

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
      setUnidadeSelecionadaInfo(null);
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
    const { data } = await supabase.from('clientes').select('id, nome, razao_social').order('nome');
    setClientes(data || []);
  }

  async function carregarUnidades(idCliente, { manterSelecao } = {}) {
    const requestId = ++unidadesRequestRef.current;
    const { data } = await supabase
      .from('unidades')
      .select('id, nome, endereco')
      .eq('cliente_id', idCliente)
      .order('nome');

    // Ignora resposta antiga (race com outro fetch ou com insert de unidade).
    if (requestId !== unidadesRequestRef.current) return;

    setUnidades(data || []);
    if (!manterSelecao) {
      setUnidadeId(null);
      setUnidadeSelecionadaInfo(null);
    }
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

  function abrirFormNovaUnidade() {
    const primeiraUnidade = unidades.length === 0;
    setNovaUnidadeNome(primeiraUnidade ? clienteNomeSelecionado : '');
    setNovaUnidadeEndereco('');
    setMostrarNovaUnidade(true);
  }

  async function cadastrarNovoCliente() {
    if (!novoCliente.nome.trim()) {
      avisar('Informe o nome do cliente.', 'Preencha o campo obrigatório');
      return;
    }
    const cnpjLimpo = limparNumeros(novoCliente.cnpj);
    if (cnpjLimpo && !cnpjValido(novoCliente.cnpj)) {
      avisar('CNPJ inválido. Verifique os dígitos.', 'Formato incorreto');
      return;
    }
    if (!novoCliente.email?.trim()) {
      avisar(
        'Cliente sem e-mail — o relatório não poderá ser enviado automaticamente.',
        'E-mail recomendado'
      );
    }

    setSalvandoCliente(true);
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: novoCliente.nome.trim(),
        cnpj: novoCliente.cnpj?.trim() || null,
        telefone: novoCliente.telefone?.trim() || null,
        email: novoCliente.email?.trim() || null,
        cidade: novoCliente.cidade?.trim() || null,
        uf: novoCliente.uf || null,
      })
      .select('id, nome, razao_social')
      .single();
    setSalvandoCliente(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar cliente');
      return;
    }

    setClientes((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    setClienteId(data.id);
    setNovoCliente({ nome: '', cnpj: '', telefone: '', email: '', cidade: '', uf: '' });
    setMostrarNovoCliente(false);
  }

  async function cadastrarNovaUnidade() {
    if (!clienteId) {
      avisar('Escolha o cliente antes de cadastrar a unidade.', 'Falta informação');
      return;
    }
    if (!novaUnidadeNome.trim()) {
      avisar('Informe o nome da unidade.', 'Preencha o campo obrigatório');
      return;
    }

    setSalvandoUnidade(true);
    // Invalida fetches em andamento pra não sobrescrever a lista após o insert.
    const requestId = ++unidadesRequestRef.current;
    const { data, error } = await supabase
      .from('unidades')
      .insert({
        cliente_id: clienteId,
        nome: novaUnidadeNome.trim(),
        endereco: novaUnidadeEndereco.trim() || null,
      })
      .select('id, nome, endereco')
      .single();
    setSalvandoUnidade(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar unidade');
      return;
    }

    if (requestId !== unidadesRequestRef.current) return;

    setUnidades((prev) => {
      const semDuplicata = prev.filter((u) => u.id !== data.id);
      return [...semDuplicata, data].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    setUnidadeId(data.id);
    setUnidadeSelecionadaInfo(data);
    setNovaUnidadeNome('');
    setNovaUnidadeEndereco('');
    setMostrarNovaUnidade(false);
  }

  async function cadastrarNovoEquipamento() {
    if (!novoEquipamento.tag.trim()) {
      avisar('Informe a identificação do gerador (ex: GMG 03).', 'Preencha o campo obrigatório');
      return;
    }

    const filtrosValidos = novosFiltros.filter((f) => f.numero_peca?.trim());
    const filtrosInvalidos = novosFiltros.some((f) => !f.numero_peca?.trim());
    if (filtrosInvalidos) {
      avisar('Preencha o nº da peça em todos os filtros ou remova a linha vazia.', 'Filtros incompletos');
      return;
    }

    setSalvandoEquipamento(true);

    const { data, error } = await supabase
      .from('equipamentos')
      .insert({
        unidade_id: unidadeId,
        tag: novoEquipamento.tag.trim(),
        fabricante_gmg: novoEquipamento.fabricante_gmg?.trim() || null,
        potencia_kva: novoEquipamento.potencia_kva ? Number(novoEquipamento.potencia_kva) : null,
        tensao: novoEquipamento.tensao?.trim() || null,
        tipo_gmg: novoEquipamento.tipo_gmg?.trim() || null,
        n_serie_gmg: novoEquipamento.n_serie_gmg?.trim() || null,
        ano_fabricacao: novoEquipamento.ano_fabricacao ? Number(novoEquipamento.ano_fabricacao) : null,
        fabricante_motor: novoEquipamento.fabricante_motor?.trim() || null,
        modelo_motor: novoEquipamento.modelo_motor?.trim() || null,
        n_serie_motor: novoEquipamento.n_serie_motor?.trim() || null,
        placa_motor: novoEquipamento.placa_motor?.trim() || null,
        fabricante_alternador: novoEquipamento.fabricante_alternador?.trim() || null,
        modelo_alternador: novoEquipamento.modelo_alternador?.trim() || null,
        n_serie_alternador: novoEquipamento.n_serie_alternador?.trim() || null,
        placa_alternador: novoEquipamento.placa_alternador?.trim() || null,
        data_inicio_contrato: novoEquipamento.data_inicio_contrato?.trim() || null,
      })
      .select('id, tag, fabricante_gmg')
      .single();

    if (error) {
      setSalvandoEquipamento(false);
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar gerador');
      return;
    }

    if (filtrosValidos.length > 0) {
      const linhasFiltros = filtrosValidos.map((f) => ({
        equipamento_id: data.id,
        tipo_filtro: f.tipo_filtro,
        numero_peca: f.numero_peca.trim(),
        observacao: f.observacao?.trim() || null,
      }));
      const { error: erroFiltros } = await supabase.from('equipamento_filtros').insert(linhasFiltros);
      if (erroFiltros) {
        setSalvandoEquipamento(false);
        avisar(erroFiltros.message, 'Gerador salvo, mas filtros não foram gravados');
        return;
      }
    }

    setSalvandoEquipamento(false);

    setEquipamentos((prev) => [...prev, data]);
    setEquipamentosSelecionados((prev) => ({ ...prev, [data.id]: true }));
    setNovoEquipamento({
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
    });
    setNovosFiltros([]);
    setMostrarNovoEquipamento(false);
  }

  function alterarNovoCliente(campo, valor) {
    setNovoCliente((prev) => ({ ...prev, [campo]: valor }));
  }

  function alterarNovoEquipamento(campo, valor) {
    setNovoEquipamento((prev) => ({ ...prev, [campo]: valor }));
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

    // DatePickerCampo já entrega YYYY-MM-DD
    const dataConvertida = dataPrevista.trim() || null;

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

    try {
      await salvarGruposOpcionais(
        supabase,
        novaOs.id,
        gruposOpcionaisPadraoNovaOs(tiposEscolhidos)
      );
    } catch (gruposError) {
      console.log(gruposError);
      avisar(gruposError.message || 'Tente novamente.', 'Erro ao configurar grupos do checklist');
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
      <SeletorCliente
        clientes={clientes}
        clienteId={clienteId}
        onSelecionar={(c) => setClienteId(c.id)}
      />

      {mostrarNovoCliente ? (
        <View style={styles.novoEquipamentoForm}>
          <FormularioCliente valores={novoCliente} onChange={alterarNovoCliente} />
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
            <TouchableOpacity style={styles.novoEquipamentoBotao} onPress={abrirFormNovaUnidade}>
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
              <FormularioEquipamento
                valores={novoEquipamento}
                onChange={alterarNovoEquipamento}
                filtros={novosFiltros}
                onChangeFiltros={setNovosFiltros}
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
          <DatePickerCampo
            value={dataPrevista}
            onChange={setDataPrevista}
            placeholder="Escolher data"
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