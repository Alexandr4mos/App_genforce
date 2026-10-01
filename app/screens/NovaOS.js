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
import { TIPOS_OS, PRIORIDADES_OS, TEMPLATE_PADRAO_ID, statusEfetivo, rotuloPeriodicidade } from '../lib/constantes';
import { useTema } from '../lib/tema';
import { avisar } from '../lib/avisos';
import SeletorCliente from '../components/SeletorCliente';
import DatePickerCampo from '../components/DatePickerCampo';
import FormularioCliente from '../components/FormularioCliente';
import FormularioEquipamento from '../components/FormularioEquipamento';
import { cnpjValido, limparNumeros } from '../lib/mascaras';
import { gruposOpcionaisPadraoNovaOs, salvarGruposOpcionais } from '../lib/gruposOS';
import { COR_MARCA } from '../lib/tema';
import {
  EQUIPAMENTO_FORM_VAZIO,
  EQUIPAMENTO_LISTA_SELECT,
  EQUIPAMENTO_COMPLETO_SELECT,
  valoresFromEquipamento,
  payloadFromValores,
  validarFiltrosForm,
  filtrosFromRows,
  substituirFiltrosEquipamento,
} from '../lib/equipamentoForm';

export default function NovaOS({ onBack, onCriada }) {
  const { cores } = useTema();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);

  const [unidades, setUnidades] = useState([]);
  const [unidadeId, setUnidadeId] = useState(null);

  const [equipamentos, setEquipamentos] = useState([]);
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({});

  const [mostrarNovoEquipamento, setMostrarNovoEquipamento] = useState(false);
  const [novoEquipamento, setNovoEquipamento] = useState({ ...EQUIPAMENTO_FORM_VAZIO });
  const [novosFiltros, setNovosFiltros] = useState([]);
  const [salvandoEquipamento, setSalvandoEquipamento] = useState(false);

  const [tiposSelecionados, setTiposSelecionados] = useState({});
  const [prioridade, setPrioridade] = useState('medio');
  const [dataPrevista, setDataPrevista] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    telefone_alternativo: '',
    email: '',
    email_alternativo: '',
    cidade: '',
    uf: '',
  });
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [mostrarNovaUnidade, setMostrarNovaUnidade] = useState(false);
  const [novaUnidadeNome, setNovaUnidadeNome] = useState('');
  const [novaUnidadeEndereco, setNovaUnidadeEndereco] = useState('');
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);

  const [unidadeSelecionadaInfo, setUnidadeSelecionadaInfo] = useState(null);
  const [equipamentoEditandoId, setEquipamentoEditandoId] = useState(null);
  const [edicaoEquipamento, setEdicaoEquipamento] = useState({ ...EQUIPAMENTO_FORM_VAZIO });
  const [edicaoFiltros, setEdicaoFiltros] = useState([]);
  const [carregandoEdicaoEquipamento, setCarregandoEdicaoEquipamento] = useState(false);
  const [salvandoEdicaoEquipamento, setSalvandoEdicaoEquipamento] = useState(false);
  const edicaoRequestRef = useRef(0);
  // Refs sincronizadas: respostas async antigas são ignoradas se o id já mudou.
  const clienteIdRef = useRef(null);
  const unidadeIdRef = useRef(null);
  const unidadesRequestRef = useRef(0);
  const equipamentosRequestRef = useRef(0);
  const clienteNomeSelecionado = clientes.find((c) => c.id === clienteId)?.nome || '';

  const geradoresMarcados = equipamentos.filter((e) => equipamentosSelecionados[e.id]);

  function limparUnidadeEGeradores() {
    unidadeIdRef.current = null;
    equipamentosRequestRef.current += 1;
    edicaoRequestRef.current += 1;
    setUnidades([]);
    setUnidadeId(null);
    setUnidadeSelecionadaInfo(null);
    setEquipamentos([]);
    setEquipamentosSelecionados({});
    setEquipamentoEditandoId(null);
    setEdicaoEquipamento({ ...EQUIPAMENTO_FORM_VAZIO });
    setEdicaoFiltros([]);
    setCarregandoEdicaoEquipamento(false);
  }

  function alternarTipo(valor) {
    setTiposSelecionados((prev) => ({ ...prev, [valor]: !prev[valor] }));
  }

  function selecionarCliente(c) {
    // Invalida qualquer fetch de unidades/geradores ainda em voo.
    unidadesRequestRef.current += 1;
    clienteIdRef.current = c.id;
    setClienteId(c.id);
    limparUnidadeEGeradores();
    setMostrarNovaUnidade(false);
    setMostrarNovoEquipamento(false);
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (clienteId) carregarUnidades(clienteId);
    else {
      clienteIdRef.current = null;
      limparUnidadeEGeradores();
    }
  }, [clienteId]);

  useEffect(() => {
    if (unidadeId) {
      unidadeIdRef.current = unidadeId;
      carregarEquipamentos(unidadeId);
    } else {
      unidadeIdRef.current = null;
      equipamentosRequestRef.current += 1;
      setEquipamentos([]);
      setEquipamentosSelecionados({});
    }
  }, [unidadeId]);

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('id, nome, razao_social').order('nome');
    setClientes(data || []);
  }

  async function carregarUnidades(idCliente) {
    const requestId = ++unidadesRequestRef.current;
    const { data } = await supabase
      .from('unidades')
      .select('id, nome, endereco, cliente_id')
      .eq('cliente_id', idCliente)
      .order('nome');

    // Ignora se o usuário já trocou de cliente (ou invalidou a fila).
    if (requestId !== unidadesRequestRef.current) return;
    if (clienteIdRef.current !== idCliente) return;

    const lista = (data || []).filter((u) => u.cliente_id === idCliente);
    setUnidades(lista);

    if (lista.length === 1) {
      const unica = lista[0];
      unidadeIdRef.current = unica.id;
      setUnidadeId(unica.id);
      setUnidadeSelecionadaInfo(unica);
    } else {
      unidadeIdRef.current = null;
      setUnidadeId(null);
      setUnidadeSelecionadaInfo(null);
    }
  }

  async function carregarEquipamentos(idUnidade) {
    const requestId = ++equipamentosRequestRef.current;
    const { data } = await supabase
      .from('equipamentos')
      .select(EQUIPAMENTO_LISTA_SELECT)
      .eq('unidade_id', idUnidade)
      .order('tag');

    if (requestId !== equipamentosRequestRef.current) return;
    if (unidadeIdRef.current !== idUnidade) return;

    setEquipamentos(data || []);
    setEquipamentosSelecionados({});
    setEquipamentoEditandoId(null);
  }

  function alternarSelecao(idEquipamento) {
    setEquipamentosSelecionados((prev) => ({ ...prev, [idEquipamento]: !prev[idEquipamento] }));
  }

  function fecharEdicaoEquipamento() {
    edicaoRequestRef.current += 1;
    setEquipamentoEditandoId(null);
    setEdicaoEquipamento({ ...EQUIPAMENTO_FORM_VAZIO });
    setEdicaoFiltros([]);
    setCarregandoEdicaoEquipamento(false);
  }

  async function abrirEdicaoEquipamento(e) {
    const requestId = ++edicaoRequestRef.current;
    setEquipamentoEditandoId(e.id);
    setCarregandoEdicaoEquipamento(true);
    setEdicaoEquipamento(valoresFromEquipamento(e));
    setEdicaoFiltros([]);
    setMostrarNovoEquipamento(false);

    const [{ data: completo, error }, { data: filtrosDb, error: erroFiltros }] = await Promise.all([
      supabase.from('equipamentos').select(EQUIPAMENTO_COMPLETO_SELECT).eq('id', e.id).single(),
      supabase
        .from('equipamento_filtros')
        .select('id, tipo_filtro, numero_peca, observacao')
        .eq('equipamento_id', e.id)
        .order('tipo_filtro'),
    ]);

    if (requestId !== edicaoRequestRef.current) return;

    if (error) {
      console.log(error);
      setCarregandoEdicaoEquipamento(false);
      avisar(error.message || 'Tente novamente.', 'Erro ao carregar gerador');
      fecharEdicaoEquipamento();
      return;
    }
    if (erroFiltros) console.log(erroFiltros);

    setEdicaoEquipamento(valoresFromEquipamento(completo));
    setEdicaoFiltros(filtrosFromRows(filtrosDb));
    setCarregandoEdicaoEquipamento(false);
  }

  function alterarEdicaoEquipamento(campo, valor) {
    setEdicaoEquipamento((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEdicaoEquipamento() {
    if (!edicaoEquipamento.tag.trim()) {
      avisar('Informe a identificação do gerador (ex: GMG 03).', 'Preencha o campo obrigatório');
      return;
    }

    const filtrosCheck = validarFiltrosForm(edicaoFiltros);
    if (!filtrosCheck.ok) {
      avisar(filtrosCheck.mensagem, 'Filtros incompletos');
      return;
    }

    const idEditando = equipamentoEditandoId;
    setSalvandoEdicaoEquipamento(true);
    const dadosAtualizados = payloadFromValores(edicaoEquipamento);
    const { error } = await supabase.from('equipamentos').update(dadosAtualizados).eq('id', idEditando);

    if (error) {
      setSalvandoEdicaoEquipamento(false);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar gerador');
      return;
    }

    const erroFiltros = await substituirFiltrosEquipamento(supabase, idEditando, filtrosCheck.filtros);
    setSalvandoEdicaoEquipamento(false);

    if (erroFiltros) {
      avisar(erroFiltros.message || 'Tente novamente.', 'Gerador salvo, mas filtros não foram gravados');
      return;
    }

    setEquipamentos((prev) =>
      prev.map((eq) =>
        eq.id === idEditando
          ? {
              ...eq,
              tag: dadosAtualizados.tag,
              fabricante_gmg: dadosAtualizados.fabricante_gmg,
              periodicidade_manutencao: dadosAtualizados.periodicidade_manutencao,
            }
          : eq
      )
    );
    fecharEdicaoEquipamento();
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
        telefone_alternativo: novoCliente.telefone_alternativo?.trim() || null,
        email: novoCliente.email?.trim() || null,
        email_alternativo: novoCliente.email_alternativo?.trim() || null,
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
    // Mesmo fluxo de selecionarCliente: limpa e invalida fetches do cliente anterior.
    unidadesRequestRef.current += 1;
    clienteIdRef.current = data.id;
    setClienteId(data.id);
    limparUnidadeEGeradores();
    setNovoCliente({ nome: '', cnpj: '', telefone: '', telefone_alternativo: '', email: '', email_alternativo: '', cidade: '', uf: '' });
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

    const clienteNoMomento = clienteId;
    setSalvandoUnidade(true);
    // Invalida fetches em andamento pra não sobrescrever a lista após o insert.
    const requestId = ++unidadesRequestRef.current;
    const { data, error } = await supabase
      .from('unidades')
      .insert({
        cliente_id: clienteNoMomento,
        nome: novaUnidadeNome.trim(),
        endereco: novaUnidadeEndereco.trim() || null,
      })
      .select('id, nome, endereco, cliente_id')
      .single();
    setSalvandoUnidade(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar unidade');
      return;
    }

    if (requestId !== unidadesRequestRef.current) return;
    if (clienteIdRef.current !== clienteNoMomento) return;

    setUnidades((prev) => {
      const semDuplicata = prev.filter((u) => u.id !== data.id);
      return [...semDuplicata, data].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    unidadeIdRef.current = data.id;
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

    const filtrosCheck = validarFiltrosForm(novosFiltros);
    if (!filtrosCheck.ok) {
      avisar(filtrosCheck.mensagem, 'Filtros incompletos');
      return;
    }

    setSalvandoEquipamento(true);

    const { data, error } = await supabase
      .from('equipamentos')
      .insert({
        unidade_id: unidadeId,
        ...payloadFromValores(novoEquipamento),
      })
      .select(EQUIPAMENTO_LISTA_SELECT)
      .single();

    if (error) {
      setSalvandoEquipamento(false);
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao cadastrar gerador');
      return;
    }

    if (filtrosCheck.filtros.length > 0) {
      const { error: erroFiltros } = await supabase.from('equipamento_filtros').insert(
        filtrosCheck.filtros.map((f) => ({
          equipamento_id: data.id,
          tipo_filtro: f.tipo_filtro,
          numero_peca: f.numero_peca,
          observacao: f.observacao,
        }))
      );
      if (erroFiltros) {
        setSalvandoEquipamento(false);
        avisar(erroFiltros.message, 'Gerador salvo, mas filtros não foram gravados');
        return;
      }
    }

    setSalvandoEquipamento(false);

    setEquipamentos((prev) => [...prev, data]);
    setEquipamentosSelecionados((prev) => ({ ...prev, [data.id]: true }));
    setNovoEquipamento({ ...EQUIPAMENTO_FORM_VAZIO });
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
      avisar(
        unidades.length > 1
          ? 'Selecione o local / unidade deste cliente.'
          : 'Cadastre uma unidade para este cliente antes de criar a OS.',
        'Falta informação'
      );
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
        status: statusEfetivo({
          status: 'pendente',
          data_inicio_prevista: dataConvertida,
          checkin_em: null,
          checkout_em: null,
        }),
        data_inicio_prevista: dataConvertida,
        descricao: descricao.trim() || null,
        prioridade,
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
        onSelecionar={selecionarCliente}
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
          {unidades.length > 1 ? (
            <>
              <Text style={[styles.label, { color: cores.texto }]}>Local / unidade</Text>
              <View style={[styles.listaBox, { borderColor: cores.borda }]}>
                {unidades.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.itemLista, unidadeId === u.id && styles.itemListaSelecionado]}
                    onPress={() => {
                      unidadeIdRef.current = u.id;
                      setUnidadeId(u.id);
                      setUnidadeSelecionadaInfo(u);
                    }}
                  >
                    <Text
                      style={
                        unidadeId === u.id
                          ? styles.itemListaTextoSelecionado
                          : [styles.itemListaTexto, { color: cores.texto }]
                      }
                    >
                      {u.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {unidadeSelecionadaInfo?.endereco ? (
            <Text style={[styles.enderecoTexto, { color: cores.textoSecundario }]}>
              📍 {unidadeSelecionadaInfo.endereco}
            </Text>
          ) : null}

          {unidades.length === 0 ? (
            <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>
              Nenhuma unidade cadastrada para este cliente. Cadastre uma para listar os geradores.
            </Text>
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
              <View key={e.id}>
                <View style={styles.checkboxLinha}>
                  <TouchableOpacity style={styles.checkboxLinhaConteudo} onPress={() => alternarSelecao(e.id)}>
                    <View
                      style={[
                        styles.checkbox,
                        equipamentosSelecionados[e.id] && styles.checkboxMarcado,
                      ]}
                    >
                      {equipamentosSelecionados[e.id] ? (
                        <Text style={styles.checkboxMarcaTexto}>✓</Text>
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemListaTexto, { color: cores.texto }]}>
                        {e.tag} {e.fabricante_gmg ? `— ${e.fabricante_gmg}` : ''}
                      </Text>
                      {e.periodicidade_manutencao ? (
                        <Text style={{ color: cores.textoSecundario, fontSize: 12, marginTop: 2 }}>
                          Periodicidade: {rotuloPeriodicidade(e.periodicidade_manutencao)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => abrirEdicaoEquipamento(e)} style={styles.editarEquipamentoBotao}>
                    <Text style={styles.editarEquipamentoBotaoTexto}>✎ editar</Text>
                  </TouchableOpacity>
                </View>

                {equipamentoEditandoId === e.id ? (
                  <View style={styles.novoEquipamentoForm}>
                    {carregandoEdicaoEquipamento ? (
                      <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>
                        Carregando dados do gerador...
                      </Text>
                    ) : (
                      <FormularioEquipamento
                        valores={edicaoEquipamento}
                        onChange={alterarEdicaoEquipamento}
                        filtros={edicaoFiltros}
                        onChangeFiltros={setEdicaoFiltros}
                      />
                    )}
                    <View style={styles.linhaBotoesEdicao}>
                      <TouchableOpacity
                        style={styles.cancelarEdicaoBotao}
                        onPress={fecharEdicaoEquipamento}
                      >
                        <Text style={styles.cancelarEdicaoBotaoTexto}>Cancelar</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Button
                          title={salvandoEdicaoEquipamento ? 'Salvando...' : 'Salvar gerador'}
                          onPress={salvarEdicaoEquipamento}
                          disabled={salvandoEdicaoEquipamento || carregandoEdicaoEquipamento}
                        />
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
            {equipamentos.length === 0 ? (
              <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>
                Nenhum gerador cadastrado nesta unidade ainda.
              </Text>
            ) : null}
          </View>

          {geradoresMarcados.length > 0 ? (
            <View style={[styles.periodicidadeBox, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
              <Text style={[styles.label, { color: cores.texto, marginTop: 0 }]}>
                Periodicidade de manutenção
              </Text>
              {geradoresMarcados.map((e) => (
                <Text key={e.id} style={{ color: cores.textoSecundario, fontSize: 13, marginBottom: 4 }}>
                  {geradoresMarcados.length > 1 ? `${e.tag}: ` : ''}
                  {e.periodicidade_manutencao
                    ? `Periodicidade contratada: ${rotuloPeriodicidade(e.periodicidade_manutencao)}`
                    : 'Periodicidade não cadastrada — toque em ✎ editar no gerador'}
                </Text>
              ))}
            </View>
          ) : null}

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
              onPress={() => {
                fecharEdicaoEquipamento();
                setMostrarNovoEquipamento(true);
              }}
            >
              <Text style={styles.novoEquipamentoBotaoTexto}>+ Cadastrar novo gerador</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { color: cores.texto }]}>Nível de prioridade</Text>
          <View style={styles.tipoRow}>
            {PRIORIDADES_OS.map((p) => (
              <TouchableOpacity
                key={p.valor}
                style={[styles.tipoButton, prioridade === p.valor && styles.tipoButtonSelecionado]}
                onPress={() => setPrioridade(p.valor)}
              >
                <Text style={prioridade === p.valor ? styles.tipoTextoSelecionado : styles.tipoTexto}>
                  {prioridade === p.valor ? '✓ ' : ''}
                  {p.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
  backText: { color: COR_MARCA, fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  listaBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 4 },
  itemLista: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  itemListaSelecionado: { backgroundColor: COR_MARCA },
  itemListaTexto: { color: '#333' },
  itemListaTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
  avisoVazio: { color: '#999', fontStyle: 'italic', padding: 10, fontSize: 13 },
  enderecoTexto: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 4 },
  checkboxLinha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  checkboxLinhaConteudo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
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
  checkboxMarcado: { backgroundColor: COR_MARCA, borderColor: COR_MARCA },
  checkboxMarcaTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  editarEquipamentoBotao: { paddingHorizontal: 8, paddingVertical: 4 },
  editarEquipamentoBotaoTexto: { color: COR_MARCA, fontSize: 12, fontWeight: '600' },
  labelPequeno: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  linhaBotoesEdicao: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cancelarEdicaoBotao: { paddingVertical: 10, paddingHorizontal: 12 },
  cancelarEdicaoBotaoTexto: { color: '#666', fontWeight: '600' },
  periodicidadeBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  novoEquipamentoForm: { marginTop: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10 },
  novoEquipamentoBotao: {
    borderWidth: 1,
    borderColor: COR_MARCA,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  novoEquipamentoBotaoTexto: { color: COR_MARCA, fontWeight: '600' },
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
  tipoButtonSelecionado: { backgroundColor: COR_MARCA, borderColor: COR_MARCA },
  tipoTexto: { color: '#333' },
  tipoTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
});