import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  TIPOS_OS,
  STATUS_OS,
  PRIORIDADES_OS,
  TEMPLATE_PADRAO_ID,
  PERIODICIDADES_MANUTENCAO,
  rotuloPeriodicidade,
} from '../lib/constantes';
import { useTema } from '../lib/tema';
import { avisar, confirmarAcao } from '../lib/avisos';
import DatePickerCampo from '../components/DatePickerCampo';
import {
  aplicarMudancaTipos,
  gruposOpcionaisIniciais,
  salvarGruposOpcionais,
} from '../lib/gruposOS';
import { COR_MARCA } from '../lib/tema';

export default function EditarOS({ osId, onBack, onSalva, onExcluida }) {
  const { cores } = useTema();
  const [loading, setLoading] = useState(true);
  const [unidadeId, setUnidadeId] = useState(null);
  const [tiposSelecionados, setTiposSelecionados] = useState({});
  const [prioridade, setPrioridade] = useState('medio');
  const [status, setStatus] = useState('pendente');
  const [descricao, setDescricao] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Geradores da OS (item 1a/1b)
  const [equipamentos, setEquipamentos] = useState([]);
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState({});
  const [equipamentosOriginais, setEquipamentosOriginais] = useState(new Set());

  // Editar dados cadastrais de um gerador já existente (item 1b)
  const [equipamentoEditandoId, setEquipamentoEditandoId] = useState(null);
  const [edTag, setEdTag] = useState('');
  const [edFabricante, setEdFabricante] = useState('');
  const [edPotencia, setEdPotencia] = useState('');
  const [edPlacaMotor, setEdPlacaMotor] = useState('');
  const [edPlacaAlternador, setEdPlacaAlternador] = useState('');
  const [edPeriodicidade, setEdPeriodicidade] = useState('');
  const [salvandoEdicaoEquipamento, setSalvandoEdicaoEquipamento] = useState(false);

  // Cadastrar gerador novo direto daqui (mesma UX da NovaOS)
  const [mostrarNovoEquipamento, setMostrarNovoEquipamento] = useState(false);
  const [novoTag, setNovoTag] = useState('');
  const [novoFabricante, setNovoFabricante] = useState('');
  const [novoPotencia, setNovoPotencia] = useState('');
  const [novoPlacaMotor, setNovoPlacaMotor] = useState('');
  const [novoPlacaAlternador, setNovoPlacaAlternador] = useState('');
  const [novoPeriodicidade, setNovoPeriodicidade] = useState('');
  const [salvandoEquipamento, setSalvandoEquipamento] = useState(false);

  const geradoresMarcados = equipamentos.filter((e) => equipamentosSelecionados[e.id]);

  const [nomesGrupos, setNomesGrupos] = useState([]);
  const [gruposOpcionais, setGruposOpcionais] = useState(new Set());
  const [tiposOriginais, setTiposOriginais] = useState([]);

  useEffect(() => {
    carregar();
  }, [osId]);

  function alternarTipo(valor) {
    setTiposSelecionados((prev) => ({ ...prev, [valor]: !prev[valor] }));
  }

  function alternarSelecaoEquipamento(idEquipamento) {
    setEquipamentosSelecionados((prev) => ({ ...prev, [idEquipamento]: !prev[idEquipamento] }));
  }

  function alternarGrupoObrigatorio(grupo, obrigatorio) {
    setGruposOpcionais((prev) => {
      const next = new Set(prev);
      if (obrigatorio) next.delete(grupo);
      else next.add(grupo);
      return next;
    });
  }

  async function carregar() {
    setLoading(true);

    const { data: os, error } = await supabase
      .from('ordens_servico')
      .select('status, descricao, data_inicio_prevista, unidade_id, prioridade')
      .eq('id', osId)
      .single();

    if (error || !os) {
      setLoading(false);
      avisar(error?.message || 'Não foi possível carregar esta OS.', 'Erro');
      return;
    }

    setStatus(os.status || 'pendente');
    setPrioridade(os.prioridade || 'medio');
    setDescricao(os.descricao || '');
    setUnidadeId(os.unidade_id);
    setDataPrevista(os.data_inicio_prevista ? String(os.data_inicio_prevista).slice(0, 10) : '');

    const { data: tiposAtuais } = await supabase.from('os_tipos').select('tipo').eq('os_id', osId);
    const mapaTipos = {};
    (tiposAtuais || []).forEach((t) => {
      mapaTipos[t.tipo] = true;
    });
    setTiposSelecionados(mapaTipos);

    const tiposLista = Object.keys(mapaTipos).filter((valor) => mapaTipos[valor]);
    setTiposOriginais(tiposLista);

    const { data: gruposOpcDb } = await supabase
      .from('os_grupos_opcionais')
      .select('grupo')
      .eq('os_id', osId);
    setGruposOpcionais(
      gruposOpcionaisIniciais(tiposLista, (gruposOpcDb || []).map((g) => g.grupo))
    );

    const { data: itensTemplate } = await supabase
      .from('checklist_template_itens')
      .select('grupo')
      .eq('template_id', TEMPLATE_PADRAO_ID)
      .order('ordem');
    const vistos = new Set();
    const grupos = [];
    (itensTemplate || []).forEach((row) => {
      if (!vistos.has(row.grupo)) {
        vistos.add(row.grupo);
        grupos.push(row.grupo);
      }
    });
    setNomesGrupos(grupos);

    const { data: vinculos } = await supabase
      .from('os_equipamentos')
      .select('equipamento_id')
      .eq('os_id', osId);
    const idsVinculados = new Set((vinculos || []).map((v) => v.equipamento_id));
    setEquipamentosOriginais(idsVinculados);
    const mapaEquipamentos = {};
    idsVinculados.forEach((id) => {
      mapaEquipamentos[id] = true;
    });
    setEquipamentosSelecionados(mapaEquipamentos);

    if (os.unidade_id) {
      const { data: equipamentosDaUnidade } = await supabase
        .from('equipamentos')
        .select('id, tag, fabricante_gmg, potencia_kva, placa_motor, placa_alternador, periodicidade_manutencao')
        .eq('unidade_id', os.unidade_id)
        .order('tag');
      setEquipamentos(equipamentosDaUnidade || []);
    }

    setLoading(false);
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
        periodicidade_manutencao: novoPeriodicidade?.trim() || null,
      })
      .select('id, tag, fabricante_gmg, potencia_kva, placa_motor, placa_alternador, periodicidade_manutencao')
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
    setNovoPeriodicidade('');
    setMostrarNovoEquipamento(false);
  }

  function abrirEdicaoEquipamento(e) {
    setEquipamentoEditandoId(e.id);
    setEdTag(e.tag || '');
    setEdFabricante(e.fabricante_gmg || '');
    setEdPotencia(e.potencia_kva ? String(e.potencia_kva) : '');
    setEdPlacaMotor(e.placa_motor || '');
    setEdPlacaAlternador(e.placa_alternador || '');
    setEdPeriodicidade(e.periodicidade_manutencao || '');
  }

  async function salvarEdicaoEquipamento() {
    if (!edTag.trim()) {
      avisar('Informe a identificação do gerador (ex: GMG 03).', 'Preencha o campo obrigatório');
      return;
    }

    setSalvandoEdicaoEquipamento(true);

    const dadosAtualizados = {
      tag: edTag.trim(),
      fabricante_gmg: edFabricante.trim() || null,
      potencia_kva: edPotencia ? Number(edPotencia) : null,
      placa_motor: edPlacaMotor.trim() || null,
      placa_alternador: edPlacaAlternador.trim() || null,
      periodicidade_manutencao: edPeriodicidade?.trim() || null,
    };

    const { error } = await supabase
      .from('equipamentos')
      .update(dadosAtualizados)
      .eq('id', equipamentoEditandoId);

    setSalvandoEdicaoEquipamento(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar gerador');
      return;
    }

    setEquipamentos((prev) =>
      prev.map((e) => (e.id === equipamentoEditandoId ? { ...e, ...dadosAtualizados } : e))
    );
    setEquipamentoEditandoId(null);
  }

  async function salvar() {
    const tiposEscolhidos = Object.keys(tiposSelecionados).filter((valor) => tiposSelecionados[valor]);
    if (tiposEscolhidos.length === 0) {
      avisar('Marque ao menos um tipo de OS.', 'Falta informação');
      return;
    }
    const idsEquipamentosEscolhidos = Object.keys(equipamentosSelecionados).filter(
      (id) => equipamentosSelecionados[id]
    );
    if (idsEquipamentosEscolhidos.length === 0) {
      avisar('Marque ao menos um gerador para esta OS.', 'Falta informação');
      return;
    }

    setSalvando(true);

    const dataConvertida = dataPrevista.trim() || null;

    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status,
        descricao: descricao.trim() || null,
        data_inicio_prevista: dataConvertida,
        prioridade,
      })
      .eq('id', osId);

    if (error) {
      console.log(error);
      setSalvando(false);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar');
      return;
    }

    // Tipos: regrava do zero com a seleção atual (mais simples que diff item a item)
    await supabase.from('os_tipos').delete().eq('os_id', osId);
    const { error: tiposError } = await supabase
      .from('os_tipos')
      .insert(tiposEscolhidos.map((tipo) => ({ os_id: osId, tipo })));

    if (tiposError) {
      console.log(tiposError);
      setSalvando(false);
      avisar(tiposError.message || 'Tente novamente.', 'Erro ao salvar tipo da OS');
      return;
    }

    // Geradores: remove os desmarcados, adiciona os novos marcados (não mexe nos que não mudaram)
    const idsParaRemover = [...equipamentosOriginais].filter(
      (id) => !idsEquipamentosEscolhidos.includes(id)
    );
    const idsParaAdicionar = idsEquipamentosEscolhidos.filter((id) => !equipamentosOriginais.has(id));

    if (idsParaRemover.length > 0) {
      const { error: removeError } = await supabase
        .from('os_equipamentos')
        .delete()
        .eq('os_id', osId)
        .in('equipamento_id', idsParaRemover);
      if (removeError) {
        console.log(removeError);
        setSalvando(false);
        avisar(removeError.message || 'Tente novamente.', 'Erro ao atualizar geradores');
        return;
      }
    }

    if (idsParaAdicionar.length > 0) {
      const { error: addError } = await supabase.from('os_equipamentos').insert(
        idsParaAdicionar.map((idEquipamento) => ({
          os_id: osId,
          equipamento_id: idEquipamento,
          template_id: TEMPLATE_PADRAO_ID,
        }))
      );
      if (addError) {
        console.log(addError);
        setSalvando(false);
        avisar(addError.message || 'Tente novamente.', 'Erro ao vincular geradores');
        return;
      }
    }

    const gruposFinal = aplicarMudancaTipos(tiposOriginais, tiposEscolhidos, gruposOpcionais);
    try {
      await salvarGruposOpcionais(supabase, osId, gruposFinal);
    } catch (gruposError) {
      console.log(gruposError);
      setSalvando(false);
      avisar(gruposError.message || 'Tente novamente.', 'Erro ao salvar grupos do checklist');
      return;
    }

    setSalvando(false);
    onSalva();
  }

  async function excluir() {
    const confirmado = await confirmarAcao(
      'Tem certeza que deseja excluir esta OS? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;

    setExcluindo(true);

    // Pendências ligadas a esta OS (como origem ou baixa) continuam existindo,
    // só perdem a referência a esta OS específica.
    await supabase.from('pendencias').update({ os_origem_id: null }).eq('os_origem_id', osId);
    await supabase.from('pendencias').update({ os_baixa_id: null }).eq('os_baixa_id', osId);

    const { error } = await supabase.from('ordens_servico').delete().eq('id', osId);

    setExcluindo(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao excluir');
      return;
    }

    onExcluida();
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Editar OS</Text>

      <Text style={[styles.label, { color: cores.texto }]}>Tipo de OS (marque um ou mais)</Text>
      <View style={styles.tipoRow}>
        {TIPOS_OS.map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[styles.tipoButton, tiposSelecionados[t.valor] && styles.tipoButtonSelecionado]}
            onPress={() => alternarTipo(t.valor)}
          >
            <Text style={tiposSelecionados[t.valor] ? styles.tipoTextoSelecionado : [styles.tipoTexto, { color: cores.texto }]}>
              {tiposSelecionados[t.valor] ? '✓ ' : ''}
              {t.rotulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: cores.texto }]}>Nível de prioridade</Text>
      <View style={styles.tipoRow}>
        {PRIORIDADES_OS.map((p) => (
          <TouchableOpacity
            key={p.valor}
            style={[styles.tipoButton, prioridade === p.valor && styles.tipoButtonSelecionado]}
            onPress={() => setPrioridade(p.valor)}
          >
            <Text
              style={
                prioridade === p.valor ? styles.tipoTextoSelecionado : [styles.tipoTexto, { color: cores.texto }]
              }
            >
              {prioridade === p.valor ? '✓ ' : ''}
              {p.rotulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: cores.texto }]}>Grupos obrigatórios para fechar</Text>
      <Text style={[styles.gruposAjuda, { color: cores.textoSuave }]}>
        Desligue um grupo se ele não se aplica a esta OS — itens vazios desse grupo não bloqueiam o
        check-out.
      </Text>
      <View style={[styles.listaBox, { borderColor: cores.borda }]}>
        {nomesGrupos.map((grupo) => {
          const obrigatorio = !gruposOpcionais.has(grupo);
          return (
            <View key={grupo} style={[styles.grupoLinha, { borderBottomColor: cores.borda }]}>
              <Text style={[styles.grupoNome, { color: cores.texto }]} numberOfLines={2}>
                {grupo}
              </Text>
              <Switch
                value={obrigatorio}
                onValueChange={(valor) => alternarGrupoObrigatorio(grupo, valor)}
                trackColor={{ false: '#ccc', true: cores.primario }}
                thumbColor="#ffffff"
              />
            </View>
          );
        })}
      </View>

      <Text style={[styles.label, { color: cores.texto }]}>Status</Text>
      <View style={styles.tipoRow}>
        {STATUS_OS.map((s) => (
          <TouchableOpacity
            key={s.valor}
            style={[styles.tipoButton, status === s.valor && styles.tipoButtonSelecionado]}
            onPress={() => setStatus(s.valor)}
          >
            <Text style={status === s.valor ? styles.tipoTextoSelecionado : [styles.tipoTexto, { color: cores.texto }]}>
              {s.rotulo}
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

      <Text style={[styles.label, { color: cores.texto }]}>Geradores (marque um ou mais)</Text>
      <View style={[styles.listaBox, { borderColor: cores.borda }]}>
        {equipamentos.map((e) => (
          <View key={e.id}>
            <View style={styles.checkboxLinha}>
              <TouchableOpacity
                style={styles.checkboxLinhaConteudo}
                onPress={() => alternarSelecaoEquipamento(e.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    equipamentosSelecionados[e.id] && styles.checkboxMarcado,
                  ]}
                >
                  {equipamentosSelecionados[e.id] ? <Text style={styles.checkboxMarcaTexto}>✓</Text> : null}
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
                <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                  placeholder="Identificação (ex: GMG 03) *"
                  value={edTag}
                  onChangeText={setEdTag}
                />
                <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                  placeholder="Fabricante do GMG"
                  value={edFabricante}
                  onChangeText={setEdFabricante}
                />
                <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                  placeholder="Potência (KVA)"
                  value={edPotencia}
                  onChangeText={setEdPotencia}
                  keyboardType="numeric"
                />
                <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                  placeholder="Placa do motor"
                  value={edPlacaMotor}
                  onChangeText={setEdPlacaMotor}
                />
                <TextInput
                style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard }]}
                  placeholder="Placa do alternador"
                  value={edPlacaAlternador}
                  onChangeText={setEdPlacaAlternador}
                />
                <Text style={[styles.label, { color: cores.texto, marginTop: 4 }]}>Periodicidade de manutenção</Text>
                <View style={styles.tipoRow}>
                  {PERIODICIDADES_MANUTENCAO.map((p) => {
                    const selecionado = edPeriodicidade === p.valor;
                    return (
                      <TouchableOpacity
                        key={p.valor}
                        style={[styles.tipoButton, selecionado && styles.tipoButtonSelecionado]}
                        onPress={() => setEdPeriodicidade(selecionado ? '' : p.valor)}
                      >
                        <Text
                          style={
                            selecionado
                              ? styles.tipoTextoSelecionado
                              : [styles.tipoTexto, { color: cores.texto }]
                          }
                        >
                          {p.rotulo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.linhaBotoesEdicao}>
                  <TouchableOpacity
                    style={styles.cancelarEdicaoBotao}
                    onPress={() => setEquipamentoEditandoId(null)}
                  >
                    <Text style={styles.cancelarEdicaoBotaoTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={salvandoEdicaoEquipamento ? 'Salvando...' : 'Salvar gerador'}
                      onPress={salvarEdicaoEquipamento}
                      disabled={salvandoEdicaoEquipamento}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ))}
        {equipamentos.length === 0 ? (
          <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>Nenhum gerador cadastrado nesta unidade ainda.</Text>
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
          <Text style={[styles.label, { color: cores.texto, marginTop: 4 }]}>Periodicidade de manutenção</Text>
          <View style={styles.tipoRow}>
            {PERIODICIDADES_MANUTENCAO.map((p) => {
              const selecionado = novoPeriodicidade === p.valor;
              return (
                <TouchableOpacity
                  key={p.valor}
                  style={[styles.tipoButton, selecionado && styles.tipoButtonSelecionado]}
                  onPress={() => setNovoPeriodicidade(selecionado ? '' : p.valor)}
                >
                  <Text
                    style={
                      selecionado
                        ? styles.tipoTextoSelecionado
                        : [styles.tipoTexto, { color: cores.texto }]
                    }
                  >
                    {p.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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

      <View style={{ height: 20 }} />

      <Button title={salvando ? 'Salvando...' : 'Salvar alterações'} onPress={salvar} disabled={salvando} />

      <View style={{ height: 20 }} />

      <TouchableOpacity style={styles.excluirBotao} onPress={excluir} disabled={excluindo}>
        <Text style={styles.excluirBotaoTexto}>
          {excluindo ? 'Excluindo...' : '🗑 Excluir esta OS'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20, backgroundColor: '#fff' },
  backButton: { marginBottom: 10 },
  backText: { color: COR_MARCA, fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
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
  gruposAjuda: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  grupoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  grupoNome: { flex: 1, fontSize: 13, marginRight: 8 },
  listaBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 4 },
  itemListaTexto: { color: '#333' },
  avisoVazio: { color: '#999', fontStyle: 'italic', padding: 10, fontSize: 13 },
  checkboxLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 6 },
  checkboxLinhaConteudo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 6 },
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
  editarEquipamentoBotao: { paddingVertical: 6, paddingHorizontal: 8 },
  editarEquipamentoBotaoTexto: { color: COR_MARCA, fontSize: 12, fontWeight: '600' },
  novoEquipamentoForm: { marginTop: 10, marginBottom: 6, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10 },
  novoEquipamentoBotao: {
    borderWidth: 1,
    borderColor: COR_MARCA,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  novoEquipamentoBotaoTexto: { color: COR_MARCA, fontWeight: '600' },
  periodicidadeBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  linhaBotoesEdicao: { flexDirection: 'row', alignItems: 'center' },
  cancelarEdicaoBotao: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 },
  cancelarEdicaoBotaoTexto: { color: '#666' },
  excluirBotao: {
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  excluirBotaoTexto: { color: '#e53935', fontWeight: 'bold' },
});
