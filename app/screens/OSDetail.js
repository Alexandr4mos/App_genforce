// TODO: item 8 do checklist — cabeçalho colorido por status + lista de colaboradores com acesso à OS. Depende de criar as outras contas de usuário primeiro (5 técnicos + 1 supervisor + 2 admin).
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useTema } from '../lib/tema';
import { avisar, confirmarAcao } from '../lib/avisos';
import AssinaturaCampo from '../components/AssinaturaCampo';
import SecaoChecklist from '../components/SecaoChecklist';

// Chave composta: cada resposta pertence a um gerador (os_equipamento) + item específico.
// Usar só o id do item causava "vazamento" de resposta entre GMG 01 e GMG 02 quando
// os dois usam o mesmo checklist (mesmos template_item_id).
function chave(osEquipamentoId, templateItemId) {
  return `${osEquipamentoId}:${templateItemId}`;
}

function agruparItensPorGrupo(itens) {
  const grupos = [];
  const mapa = new Map();
  (itens || []).forEach((item) => {
    const nome = item.grupo || 'Outros';
    if (!mapa.has(nome)) {
      mapa.set(nome, []);
      grupos.push(nome);
    }
    mapa.get(nome).push(item);
  });
  return grupos.map((nome) => ({ nome, itens: mapa.get(nome) }));
}

function osConcluida(status) {
  return status === 'concluida' || status === 'finalizado';
}

export default function OSDetail({ osId, userId, onBack }) {
  const { cores } = useTema();
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [osEquipamentos, setOsEquipamentos] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [respostaIds, setRespostaIds] = useState({});
  const [fotosPorItem, setFotosPorItem] = useState({});
  const [uploading, setUploading] = useState(null);
  const [pendenciasPorEquipamento, setPendenciasPorEquipamento] = useState({});
  const [mostrarFormPendencia, setMostrarFormPendencia] = useState({});
  const [novoPendenciaTexto, setNovoPendenciaTexto] = useState({});
  const [novaPendenciaPrioridade, setNovaPendenciaPrioridade] = useState({});
  const [baixaTexto, setBaixaTexto] = useState({});
  const [salvandoPendencia, setSalvandoPendencia] = useState(false);
  const [observacoesItem, setObservacoesItem] = useState({});
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [kmSaida, setKmSaida] = useState('');
  const [kmRetorno, setKmRetorno] = useState('');
  const [fotosPorPendencia, setFotosPorPendencia] = useState({});
  const [uploadingPendencia, setUploadingPendencia] = useState(null);
  const [editandoPendenciaId, setEditandoPendenciaId] = useState(null);
  const [textoEdicaoPendencia, setTextoEdicaoPendencia] = useState({});
  const [salvandoEdicaoPendencia, setSalvandoEdicaoPendencia] = useState(false);
  const [salvandoRelatorio, setSalvandoRelatorio] = useState(false);
  const [salvandoSecao, setSalvandoSecao] = useState(null);
  const [osInfo, setOsInfo] = useState(null);
  const [processandoCheckin, setProcessandoCheckin] = useState(false);
  const [processandoCheckout, setProcessandoCheckout] = useState(false);
  const [relatorioSalvo, setRelatorioSalvo] = useState(false);
  const [statusSalvamento, setStatusSalvamento] = useState('idle'); // idle | salvando | salvo | erro
  const [secoesAbertas, setSecoesAbertas] = useState({});
  const [assinaturaCliente, setAssinaturaCliente] = useState(null);
  const [assinaturaTecnico, setAssinaturaTecnico] = useState(null);
  const [ultimoErroSalvar, setUltimoErroSalvar] = useState(null);

  const debounceTimers = useRef({});
  const respostasRef = useRef({});
  const observacoesRef = useRef({});
  const observacaoGeralRef = useRef('');
  const kmSaidaRef = useRef('');
  const kmRetornoRef = useRef('');
  const assinaturaClienteRef = useRef(null);
  const assinaturaTecnicoRef = useRef(null);
  const osEquipamentosRef = useRef([]);

  useEffect(() => {
    respostasRef.current = respostas;
  }, [respostas]);
  useEffect(() => {
    observacoesRef.current = observacoesItem;
  }, [observacoesItem]);
  useEffect(() => {
    observacaoGeralRef.current = observacaoGeral;
  }, [observacaoGeral]);
  useEffect(() => {
    kmSaidaRef.current = kmSaida;
  }, [kmSaida]);
  useEffect(() => {
    kmRetornoRef.current = kmRetorno;
  }, [kmRetorno]);
  useEffect(() => {
    assinaturaClienteRef.current = assinaturaCliente;
  }, [assinaturaCliente]);
  useEffect(() => {
    assinaturaTecnicoRef.current = assinaturaTecnico;
  }, [assinaturaTecnico]);
  useEffect(() => {
    osEquipamentosRef.current = osEquipamentos;
  }, [osEquipamentos]);

  useEffect(() => {
    loadData();
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [osId]);

  function checklistCompleto(eqs, resps) {
    if (!eqs || eqs.length === 0) return false;
    return eqs.every((eq) =>
      (eq.itens || []).every((item) => {
        const v = resps[chave(eq.id, item.id)];
        return v != null && String(v).trim() !== '';
      })
    );
  }

  function recomputarRelatorioSalvo({
    resps = respostasRef.current,
    obsGeral = observacaoGeralRef.current,
    assCliente = assinaturaClienteRef.current,
    assTecnico = assinaturaTecnicoRef.current,
    eqs = osEquipamentosRef.current,
  } = {}) {
    const ok =
      checklistCompleto(eqs, resps) &&
      Boolean(obsGeral && String(obsGeral).trim()) &&
      Boolean(assCliente?.imagem_url) &&
      Boolean(assTecnico?.imagem_url);
    setRelatorioSalvo(ok);
    return ok;
  }

  async function loadData(mostrarLoading = true) {
    if (mostrarLoading) setLoading(true);

    const { data: osEq, error: osEqError } = await supabase
      .from('os_equipamentos')
      .select('id, equipamento_id, template_id, equipamentos(tag, fabricante_gmg)')
      .eq('os_id', osId);

    if (osEqError) {
      console.log(osEqError);
      setLoading(false);
      return null;
    }

    const withItens = await Promise.all(
      (osEq || []).map(async (item) => {
        const { data: itens } = await supabase
          .from('checklist_template_itens')
          .select('*')
          .eq('template_id', item.template_id)
          .order('ordem');

        const { data: respostasExistentes } = await supabase
          .from('checklist_respostas')
          .select('*')
          .eq('os_equipamento_id', item.id);

        return { ...item, itens: itens || [], respostasExistentes: respostasExistentes || [] };
      })
    );

    const respostasIniciais = {};
    const idsIniciais = {};
    const observacoesIniciais = {};
    withItens.forEach((eq) => {
      eq.respostasExistentes.forEach((r) => {
        const k = chave(eq.id, r.template_item_id);
        respostasIniciais[k] = r.resposta;
        idsIniciais[k] = r.id;
        observacoesIniciais[k] = r.observacao || '';
      });
    });

    const todosRespostaIds = Object.values(idsIniciais);
    let fotosIniciais = {};
    if (todosRespostaIds.length > 0) {
      const { data: fotos } = await supabase
        .from('fotos')
        .select('*')
        .in('checklist_resposta_id', todosRespostaIds);

      (fotos || []).forEach((foto) => {
        const chaveEncontrada = Object.keys(idsIniciais).find(
          (k) => idsIniciais[k] === foto.checklist_resposta_id
        );
        if (chaveEncontrada) {
          fotosIniciais[chaveEncontrada] = [...(fotosIniciais[chaveEncontrada] || []), foto];
        }
      });
    }

    setOsEquipamentos(withItens);
    osEquipamentosRef.current = withItens;
    setRespostas(respostasIniciais);
    respostasRef.current = respostasIniciais;
    setRespostaIds(idsIniciais);
    setFotosPorItem(fotosIniciais);
    setObservacoesItem(observacoesIniciais);
    observacoesRef.current = observacoesIniciais;

    const abertas = {};
    withItens.forEach((eq) => {
      agruparItensPorGrupo(eq.itens).forEach(({ nome }) => {
        abertas[`${eq.id}:${nome}`] = true;
      });
    });
    setSecoesAbertas(abertas);

    const { data: osAtual } = await supabase
      .from('ordens_servico')
      .select(
        'observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status, km_saida, km_retorno, importado'
      )
      .eq('id', osId)
      .single();
    const obsGeral = osAtual?.observacoes_gerais || '';
    setObservacaoGeral(obsGeral);
    observacaoGeralRef.current = obsGeral;
    const kmS = osAtual?.km_saida != null ? String(osAtual.km_saida) : '';
    const kmR = osAtual?.km_retorno != null ? String(osAtual.km_retorno) : '';
    setKmSaida(kmS);
    setKmRetorno(kmR);
    kmSaidaRef.current = kmS;
    kmRetornoRef.current = kmR;
    setOsInfo(osAtual || null);

    const { data: assinaturasExistentes } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('os_id', osId);
    const assCliente = (assinaturasExistentes || []).find((a) => a.tipo === 'cliente') || null;
    const assTecnico = (assinaturasExistentes || []).find((a) => a.tipo === 'tecnico') || null;
    setAssinaturaCliente(assCliente);
    setAssinaturaTecnico(assTecnico);
    assinaturaClienteRef.current = assCliente;
    assinaturaTecnicoRef.current = assTecnico;

    const pendenciasIniciais = {};
    await Promise.all(
      withItens.map(async (eq) => {
        const { data: pendencias } = await supabase
          .from('pendencias')
          .select('*')
          .eq('equipamento_id', eq.equipamento_id)
          .order('solicitado_em', { ascending: false });
        pendenciasIniciais[eq.equipamento_id] = pendencias || [];
      })
    );
    setPendenciasPorEquipamento(pendenciasIniciais);

    const todasPendenciaIds = Object.values(pendenciasIniciais).flat().map((p) => p.id);
    let fotosPendenciaIniciais = {};
    if (todasPendenciaIds.length > 0) {
      const { data: fotosPend } = await supabase
        .from('fotos')
        .select('*')
        .in('pendencia_id', todasPendenciaIds);

      (fotosPend || []).forEach((foto) => {
        fotosPendenciaIniciais[foto.pendencia_id] = [
          ...(fotosPendenciaIniciais[foto.pendencia_id] || []),
          foto,
        ];
      });
    }
    setFotosPorPendencia(fotosPendenciaIniciais);

    recomputarRelatorioSalvo({
      resps: respostasIniciais,
      obsGeral,
      assCliente,
      assTecnico,
      eqs: withItens,
    });

    setLoading(false);

    return { osEquipamentos: withItens, respostas: respostasIniciais };
  }

  async function atualizarDados() {
    setAtualizando(true);
    await loadData(false);
    setAtualizando(false);
    avisar('Dados atualizados com o que os outros técnicos já preencheram.', 'Sincronizado');
  }

  function pegarLocalizacao() {
    const buscaLocalizacao = new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 6000 }
      );
    });

    const tempoLimite = new Promise((resolve) =>
      setTimeout(() => resolve({ lat: null, lng: null }), 7000)
    );

    return Promise.race([buscaLocalizacao, tempoLimite]);
  }

  async function fazerCheckin() {
    if (osConcluida(osInfo?.status)) {
      avisar('Esta OS já está concluída — não é possível reabrir o check-in.', 'OS concluída');
      return;
    }

    setProcessandoCheckin(true);
    const { lat, lng } = await pegarLocalizacao();

    const { data: atualizada, error } = await supabase
      .from('ordens_servico')
      .update({
        checkin_em: new Date().toISOString(),
        checkin_lat: lat,
        checkin_lng: lng,
        status: 'andamento',
      })
      .eq('id', osId)
      .select(
        'observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status, km_saida, km_retorno, importado'
      )
      .single();

    setProcessandoCheckin(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao fazer check-in');
      return;
    }

    setOsInfo(atualizada);
  }

  async function fazerCheckout() {
    if (osEquipamentos.length === 0) {
      avisar(
        osInfo?.importado
          ? 'Esta OS foi importada do sistema antigo e não tem gerador/checklist vinculados.'
          : 'Não há geradores vinculados a esta OS.',
        'Não é possível encerrar'
      );
      return;
    }

    if (!assinaturaClienteRef.current?.imagem_url || !assinaturaTecnicoRef.current?.imagem_url) {
      avisar(
        'Assinaturas do cliente e do técnico são obrigatórias antes do check-out.',
        'Assinaturas pendentes'
      );
      return;
    }

    if (!relatorioSalvo) {
      avisar(
        'Preencha todo o checklist, observações gerais e assinaturas antes de fazer o check-out.',
        'Relatório incompleto'
      );
      return;
    }

    const dadosFrescos = await loadData(false);
    if (!dadosFrescos) return;

    const faltando = [];
    dadosFrescos.osEquipamentos.forEach((eq) => {
      eq.itens.forEach((item) => {
        if (!dadosFrescos.respostas[chave(eq.id, item.id)]) {
          faltando.push(`${eq.equipamentos?.tag || 'Gerador'}: ${item.titulo}`);
        }
      });
    });

    if (faltando.length > 0) {
      setRelatorioSalvo(false);
      avisar(
        `Outro técnico pode ter deixado itens pendentes em outro gerador. Faltam ${faltando.length} item(ns): ${faltando.slice(0, 3).join(' · ')}`,
        'Relatório incompleto'
      );
      return;
    }

    if (!observacaoGeralRef.current?.trim()) {
      avisar('Preencha as observações gerais antes do check-out.', 'Observações obrigatórias');
      return;
    }

    const confirmado = await confirmarAcao('Confirma o encerramento desta manutenção (check-out)?');
    if (!confirmado) return;

    setProcessandoCheckout(true);
    const { lat, lng } = await pegarLocalizacao();

    const { data: atualizada, error } = await supabase
      .from('ordens_servico')
      .update({
        checkout_em: new Date().toISOString(),
        checkout_lat: lat,
        checkout_lng: lng,
        status: 'concluida',
      })
      .eq('id', osId)
      .select(
        'observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status, km_saida, km_retorno, importado'
      )
      .single();

    setProcessandoCheckout(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao fazer check-out');
      return;
    }

    setOsInfo(atualizada);
  }

  function formatarHorario(dataIso) {
    if (!dataIso) return null;
    const data = new Date(dataIso);
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  async function garantirRespostaSalva(osEquipamentoId, templateItemId, overrides = {}) {
    const k = chave(osEquipamentoId, templateItemId);
    const valor =
      overrides.valor !== undefined ? overrides.valor : respostasRef.current[k];
    if (valor == null || String(valor).trim() === '') return null;
    const observacao =
      overrides.observacao !== undefined
        ? overrides.observacao
        : observacoesRef.current[k] || null;

    const { data: existente, error: errExistente } = await supabase
      .from('checklist_respostas')
      .select('id')
      .eq('os_equipamento_id', osEquipamentoId)
      .eq('template_item_id', templateItemId)
      .maybeSingle();

    if (errExistente) throw errExistente;

    let respostaId = existente?.id;

    if (existente) {
      const { error } = await supabase
        .from('checklist_respostas')
        .update({ resposta: valor, observacao, respondido_em: new Date().toISOString() })
        .eq('id', existente.id);
      if (error) throw error;
    } else {
      const { data: inserida, error } = await supabase
        .from('checklist_respostas')
        .insert({
          os_equipamento_id: osEquipamentoId,
          template_item_id: templateItemId,
          resposta: valor,
          observacao,
        })
        .select('id')
        .single();
      if (error) throw error;
      respostaId = inserida?.id;
    }

    setRespostaIds((prev) => ({ ...prev, [k]: respostaId }));
    return respostaId;
  }

  async function executarSalvamento(fn, chaveRetry = null) {
    setStatusSalvamento('salvando');
    setUltimoErroSalvar(chaveRetry ? { tipo: 'retry', ...chaveRetry } : null);
    try {
      await fn();
      setStatusSalvamento('salvo');
      recomputarRelatorioSalvo();
    } catch (err) {
      console.log(err);
      setStatusSalvamento('erro');
      setUltimoErroSalvar(chaveRetry || { tipo: 'generico', fn });
    }
  }

  function selecionarResposta(osEquipamentoId, templateItemId, valor) {
    const k = chave(osEquipamentoId, templateItemId);
    setRespostas((prev) => {
      const next = { ...prev, [k]: valor };
      respostasRef.current = next;
      return next;
    });
    setRelatorioSalvo(false);
    executarSalvamento(
      () => garantirRespostaSalva(osEquipamentoId, templateItemId, { valor }),
      { tipo: 'resposta', osEquipamentoId, templateItemId, valor }
    );
  }

  function agendarSalvarResposta(osEquipamentoId, templateItemId, overrides = {}) {
    const k = chave(osEquipamentoId, templateItemId);
    if (debounceTimers.current[k]) clearTimeout(debounceTimers.current[k]);
    debounceTimers.current[k] = setTimeout(() => {
      const valor =
        overrides.valor !== undefined ? overrides.valor : respostasRef.current[k];
      if (valor == null || String(valor).trim() === '') return;
      executarSalvamento(
        () =>
          garantirRespostaSalva(osEquipamentoId, templateItemId, {
            valor,
            observacao:
              overrides.observacao !== undefined
                ? overrides.observacao
                : observacoesRef.current[k],
          }),
        { tipo: 'resposta', osEquipamentoId, templateItemId, valor }
      );
    }, 1000);
  }

  function salvarRespostaNoBlur(osEquipamentoId, templateItemId) {
    const k = chave(osEquipamentoId, templateItemId);
    if (debounceTimers.current[k]) {
      clearTimeout(debounceTimers.current[k]);
      delete debounceTimers.current[k];
    }
    const valor = respostasRef.current[k];
    if (valor == null || String(valor).trim() === '') return;
    executarSalvamento(
      () => garantirRespostaSalva(osEquipamentoId, templateItemId, { valor }),
      { tipo: 'resposta', osEquipamentoId, templateItemId, valor }
    );
  }

  async function salvarCamposOs(campos) {
    const { error } = await supabase.from('ordens_servico').update(campos).eq('id', osId);
    if (error) throw error;
  }

  function agendarSalvarOs(chaveDebounce, camposFn) {
    if (debounceTimers.current[chaveDebounce]) clearTimeout(debounceTimers.current[chaveDebounce]);
    debounceTimers.current[chaveDebounce] = setTimeout(() => {
      const campos = camposFn();
      executarSalvamento(() => salvarCamposOs(campos), {
        tipo: 'os',
        campos,
      });
    }, 1000);
  }

  function salvarOsNoBlur(chaveDebounce, camposFn) {
    if (debounceTimers.current[chaveDebounce]) {
      clearTimeout(debounceTimers.current[chaveDebounce]);
      delete debounceTimers.current[chaveDebounce];
    }
    const campos = camposFn();
    executarSalvamento(() => salvarCamposOs(campos), { tipo: 'os', campos });
  }

  async function tentarSalvarDeNovo() {
    if (!ultimoErroSalvar) {
      setStatusSalvamento('idle');
      return;
    }
    if (ultimoErroSalvar.tipo === 'resposta') {
      const { osEquipamentoId, templateItemId, valor } = ultimoErroSalvar;
      await executarSalvamento(
        () => garantirRespostaSalva(osEquipamentoId, templateItemId, { valor }),
        ultimoErroSalvar
      );
    } else if (ultimoErroSalvar.tipo === 'os') {
      await executarSalvamento(
        () => salvarCamposOs(ultimoErroSalvar.campos),
        ultimoErroSalvar
      );
    } else if (ultimoErroSalvar.tipo === 'generico' && ultimoErroSalvar.fn) {
      await executarSalvamento(ultimoErroSalvar.fn, ultimoErroSalvar);
    }
  }

  async function enviarFotoParaStorage(osEquipamentoId, templateItemId, uri) {
    const k = chave(osEquipamentoId, templateItemId);
    let respostaId = respostaIds[k];
    if (!respostaId) {
      try {
        respostaId = await garantirRespostaSalva(osEquipamentoId, templateItemId);
      } catch (err) {
        console.log(err);
        avisar(err.message || 'Tente novamente.', 'Erro ao salvar resposta');
        return;
      }
    }
    if (!respostaId) {
      avisar('Escolha uma opção de resposta antes de adicionar foto.', 'Selecione uma resposta');
      return;
    }

    setUploading(k);

    const respostaFetch = await fetch(uri);
    const blob = await respostaFetch.blob();
    const nomeArquivo = `${respostaId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nomeArquivo, blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      console.log(uploadError);
      avisar(uploadError.message || 'Tente novamente.', 'Erro ao enviar foto');
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(nomeArquivo);

    const { data: fotoInserida, error: insertError } = await supabase
      .from('fotos')
      .insert({
        checklist_resposta_id: respostaId,
        url: urlData.publicUrl,
      })
      .select('*')
      .single();

    if (insertError) {
      console.log(insertError);
      avisar(insertError.message || 'Tente novamente.', 'Erro ao registrar foto');
      setUploading(null);
      return;
    }

    setFotosPorItem((prev) => ({
      ...prev,
      [k]: [...(prev[k] || []), fotoInserida],
    }));

    setUploading(null);
  }

  async function editarLegendaFoto(osEquipamentoId, templateItemId, foto) {
    if (Platform.OS !== 'web') return;
    const novaLegenda = window.prompt('Descrição da foto:', foto.legenda || '');
    if (novaLegenda === null) return;

    const k = chave(osEquipamentoId, templateItemId);
    await supabase.from('fotos').update({ legenda: novaLegenda }).eq('id', foto.id);

    setFotosPorItem((prev) => ({
      ...prev,
      [k]: (prev[k] || []).map((f) => (f.id === foto.id ? { ...f, legenda: novaLegenda } : f)),
    }));
  }

  async function tirarFoto(osEquipamentoId, templateItemId) {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      avisar('Preciso de acesso à câmera para tirar a foto.', 'Permissão necessária');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (resultado.canceled) return;
    await enviarFotoParaStorage(osEquipamentoId, templateItemId, resultado.assets[0].uri);
  }

  async function escolherDaGaleria(osEquipamentoId, templateItemId) {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (resultado.canceled) return;
    await enviarFotoParaStorage(osEquipamentoId, templateItemId, resultado.assets[0].uri);
  }

  async function excluirFoto(osEquipamentoId, templateItemId, foto) {
    const confirmado = await confirmarAcao('Tem certeza que deseja excluir esta foto?');
    if (!confirmado) return;

    const k = chave(osEquipamentoId, templateItemId);
    const caminhoArquivo = foto.url.split('/evidencias/')[1];

    if (caminhoArquivo) {
      await supabase.storage.from('evidencias').remove([caminhoArquivo]);
    }

    await supabase.from('fotos').delete().eq('id', foto.id);

    setFotosPorItem((prev) => ({
      ...prev,
      [k]: (prev[k] || []).filter((f) => f.id !== foto.id),
    }));
  }

  async function criarPendencia(equipamentoId) {
    const texto = novoPendenciaTexto[equipamentoId];
    if (!texto || !texto.trim()) {
      avisar('Descreva o que precisa ser trocado/verificado.', 'Preencha o item');
      return;
    }

    setSalvandoPendencia(true);

    const { data: inserida, error } = await supabase
      .from('pendencias')
      .insert({
        equipamento_id: equipamentoId,
        os_origem_id: osId,
        item_solicitado: texto.trim(),
        prioridade: novaPendenciaPrioridade[equipamentoId] || 'media',
        status: 'solicitada',
        solicitado_por: userId,
      })
      .select('*')
      .single();

    setSalvandoPendencia(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar pendência');
      return;
    }

    setPendenciasPorEquipamento((prev) => ({
      ...prev,
      [equipamentoId]: [inserida, ...(prev[equipamentoId] || [])],
    }));
    setNovoPendenciaTexto((prev) => ({ ...prev, [equipamentoId]: '' }));
    setMostrarFormPendencia((prev) => ({ ...prev, [equipamentoId]: false }));
  }

  async function darBaixaPendencia(equipamentoId, pendenciaId) {
    const observacao = baixaTexto[pendenciaId];
    if (!observacao || !observacao.trim()) {
      avisar('Preencha a observação antes de confirmar.', 'Descreva o que foi feito');
      return;
    }

    const { data: atualizada, error } = await supabase
      .from('pendencias')
      .update({
        status: 'resolvida',
        baixado_por: userId,
        baixado_em: new Date().toISOString(),
        observacao_baixa: observacao.trim(),
        os_baixa_id: osId,
      })
      .eq('id', pendenciaId)
      .select('*')
      .single();

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao dar baixa');
      return;
    }

    setPendenciasPorEquipamento((prev) => ({
      ...prev,
      [equipamentoId]: (prev[equipamentoId] || []).map((p) =>
        p.id === pendenciaId ? atualizada : p
      ),
    }));
    setBaixaTexto((prev) => ({ ...prev, [pendenciaId]: '' }));
  }

  async function enviarFotoParaPendencia(pendenciaId, uri) {
    setUploadingPendencia(pendenciaId);

    const respostaFetch = await fetch(uri);
    const blob = await respostaFetch.blob();
    const nomeArquivo = `pendencias/${pendenciaId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nomeArquivo, blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      console.log(uploadError);
      avisar(uploadError.message || 'Tente novamente.', 'Erro ao enviar foto');
      setUploadingPendencia(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(nomeArquivo);

    const { data: fotoInserida, error: insertError } = await supabase
      .from('fotos')
      .insert({ pendencia_id: pendenciaId, url: urlData.publicUrl })
      .select('*')
      .single();

    if (insertError) {
      console.log(insertError);
      avisar(insertError.message || 'Tente novamente.', 'Erro ao registrar foto');
      setUploadingPendencia(null);
      return;
    }

    setFotosPorPendencia((prev) => ({
      ...prev,
      [pendenciaId]: [...(prev[pendenciaId] || []), fotoInserida],
    }));
    setUploadingPendencia(null);
  }

  async function tirarFotoPendencia(pendenciaId) {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      avisar('Preciso de acesso à câmera para tirar a foto.', 'Permissão necessária');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (resultado.canceled) return;
    await enviarFotoParaPendencia(pendenciaId, resultado.assets[0].uri);
  }

  async function escolherGaleriaPendencia(pendenciaId) {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (resultado.canceled) return;
    await enviarFotoParaPendencia(pendenciaId, resultado.assets[0].uri);
  }

  async function excluirFotoPendencia(pendenciaId, foto) {
    const confirmado = await confirmarAcao('Tem certeza que deseja excluir esta foto?');
    if (!confirmado) return;

    const caminhoArquivo = foto.url.split('/evidencias/')[1];
    if (caminhoArquivo) {
      await supabase.storage.from('evidencias').remove([caminhoArquivo]);
    }
    await supabase.from('fotos').delete().eq('id', foto.id);

    setFotosPorPendencia((prev) => ({
      ...prev,
      [pendenciaId]: (prev[pendenciaId] || []).filter((f) => f.id !== foto.id),
    }));
  }

  async function salvarEdicaoPendencia(equipamentoId, pendenciaId) {
    const novoTexto = textoEdicaoPendencia[pendenciaId];
    if (!novoTexto || !novoTexto.trim()) {
      avisar('O texto não pode ficar vazio.', 'Preencha o item');
      return;
    }

    setSalvandoEdicaoPendencia(true);
    const { data: atualizada, error } = await supabase
      .from('pendencias')
      .update({ item_solicitado: novoTexto.trim() })
      .eq('id', pendenciaId)
      .select('*')
      .single();
    setSalvandoEdicaoPendencia(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao editar pendência');
      return;
    }

    setPendenciasPorEquipamento((prev) => ({
      ...prev,
      [equipamentoId]: (prev[equipamentoId] || []).map((p) =>
        p.id === pendenciaId ? atualizada : p
      ),
    }));
    setEditandoPendenciaId(null);
  }

  // Domínio de pendências — não usar corDoStatus de constantes (status de OS).
  function corDoStatusPendencia(status) {
    switch (status) {
      case 'resolvida':
        return '#4caf50';
      case 'recusada':
        return '#9e9e9e';
      case 'aprovada':
        return '#2196f3';
      case 'proposta_enviada':
      case 'aguardando_comercial':
        return '#ff9800';
      default:
        return '#e53935';
    }
  }

  function diasAberta(solicitadoEm) {
    const dias = Math.floor((Date.now() - new Date(solicitadoEm).getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) return 'hoje';
    if (dias === 1) return 'há 1 dia';
    return `há ${dias} dias`;
  }

  // Dashboard comparativo de assinaturas/desempenho aguarda confirmação do Alexandre — só persistimos aqui.
  async function salvarAssinatura(tipo, { nome_responsavel, blob, contentType, extensao }) {
    setStatusSalvamento('salvando');
    try {
      const nomeArquivo = `assinaturas/${osId}/${tipo}-${Date.now()}.${extensao || 'png'}`;
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(nomeArquivo, blob, { contentType: contentType || 'image/png' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(nomeArquivo);
      const existente = tipo === 'cliente' ? assinaturaCliente : assinaturaTecnico;

      if (existente?.imagem_url) {
        const caminhoAntigo = existente.imagem_url.split('/evidencias/')[1];
        if (caminhoAntigo) {
          await supabase.storage.from('evidencias').remove([caminhoAntigo]);
        }
      }

      let salva;
      if (existente?.id) {
        const { data, error } = await supabase
          .from('assinaturas')
          .update({
            nome_responsavel,
            imagem_url: urlData.publicUrl,
          })
          .eq('id', existente.id)
          .select('*')
          .single();
        if (error) throw error;
        salva = data;
      } else {
        const { data, error } = await supabase
          .from('assinaturas')
          .insert({
            os_id: osId,
            tipo,
            nome_responsavel,
            imagem_url: urlData.publicUrl,
          })
          .select('*')
          .single();
        if (error) throw error;
        salva = data;
      }

      if (tipo === 'cliente') {
        setAssinaturaCliente(salva);
        assinaturaClienteRef.current = salva;
      } else {
        setAssinaturaTecnico(salva);
        assinaturaTecnicoRef.current = salva;
      }
      setStatusSalvamento('salvo');
      recomputarRelatorioSalvo({
        assCliente: tipo === 'cliente' ? salva : assinaturaClienteRef.current,
        assTecnico: tipo === 'tecnico' ? salva : assinaturaTecnicoRef.current,
      });
    } catch (err) {
      console.log(err);
      setStatusSalvamento('erro');
      avisar(err.message || 'Tente novamente.', 'Erro ao salvar assinatura');
      throw err;
    }
  }

  async function excluirAssinatura(tipo) {
    const existente = tipo === 'cliente' ? assinaturaCliente : assinaturaTecnico;
    if (!existente) return;
    const confirmado = await confirmarAcao('Excluir esta assinatura?');
    if (!confirmado) return;

    setStatusSalvamento('salvando');
    try {
      if (existente.imagem_url) {
        const caminho = existente.imagem_url.split('/evidencias/')[1];
        if (caminho) await supabase.storage.from('evidencias').remove([caminho]);
      }
      const { error } = await supabase.from('assinaturas').delete().eq('id', existente.id);
      if (error) throw error;

      if (tipo === 'cliente') {
        setAssinaturaCliente(null);
        assinaturaClienteRef.current = null;
      } else {
        setAssinaturaTecnico(null);
        assinaturaTecnicoRef.current = null;
      }
      setRelatorioSalvo(false);
      setStatusSalvamento('salvo');
    } catch (err) {
      console.log(err);
      setStatusSalvamento('erro');
      avisar(err.message || 'Tente novamente.', 'Erro ao excluir assinatura');
    }
  }

  async function salvarSecao(eq, itensDaSecao, chaveSecao) {
    setSalvandoSecao(chaveSecao);
    try {
      for (const item of itensDaSecao) {
        const k = chave(eq.id, item.id);
        if (respostasRef.current[k]) {
          await garantirRespostaSalva(eq.id, item.id);
        }
      }
      setStatusSalvamento('salvo');
      recomputarRelatorioSalvo();
      avisar('Seção salva.', 'Sucesso');
    } catch (err) {
      console.log(err);
      setStatusSalvamento('erro');
      avisar(err.message || 'Tente novamente.', 'Erro ao salvar seção');
    } finally {
      setSalvandoSecao(null);
    }
  }

  async function salvarRelatorioCompleto() {
    setSalvandoRelatorio(true);
    setStatusSalvamento('salvando');

    try {
      for (const eq of osEquipamentos) {
        for (const item of eq.itens) {
          if (respostasRef.current[chave(eq.id, item.id)]) {
            await garantirRespostaSalva(eq.id, item.id);
          }
        }
      }

      await salvarCamposOs({
        observacoes_gerais: observacaoGeralRef.current,
        km_saida: kmSaidaRef.current === '' ? null : Number(kmSaidaRef.current),
        km_retorno: kmRetornoRef.current === '' ? null : Number(kmRetornoRef.current),
      });

      const faltando = [];
      osEquipamentos.forEach((eq) => {
        eq.itens.forEach((item) => {
          if (!respostasRef.current[chave(eq.id, item.id)]) {
            faltando.push(`${eq.equipamentos?.tag || 'Gerador'}: ${item.titulo}`);
          }
        });
      });

      if (faltando.length > 0) {
        setRelatorioSalvo(false);
        setStatusSalvamento('salvo');
        avisar(
          `Salvo, mas ainda faltam ${faltando.length} item(ns) pra completar: ${faltando.slice(0, 3).join(' · ')}`,
          'Relatório incompleto'
        );
        return;
      }

      if (!observacaoGeralRef.current?.trim()) {
        setRelatorioSalvo(false);
        setStatusSalvamento('salvo');
        avisar('Preencha as observações gerais.', 'Relatório incompleto');
        return;
      }

      if (!assinaturaClienteRef.current || !assinaturaTecnicoRef.current) {
        setRelatorioSalvo(false);
        setStatusSalvamento('salvo');
        avisar('Assinaturas do cliente e do técnico são obrigatórias.', 'Relatório incompleto');
        return;
      }

      setStatusSalvamento('salvo');
      recomputarRelatorioSalvo();
      avisar('Relatório salvo com sucesso! Check-out liberado.', 'Sucesso');
    } catch (err) {
      console.log(err);
      setStatusSalvamento('erro');
      avisar(err.message || 'Tente novamente.', 'Erro ao salvar relatório');
    } finally {
      setSalvandoRelatorio(false);
    }
  }

  function renderItemChecklist(eq, item) {
    const k = chave(eq.id, item.id);
    return (
      <View key={item.id} style={[styles.itemBlock, { borderColor: cores.borda }]}>
        <Text style={[styles.itemTitulo, { color: cores.texto }]}>{item.titulo}</Text>

        {item.tipo_resposta === 'numero' || item.tipo_resposta === 'texto' ? (
          <TextInput
            style={[
              styles.numeroInput,
              item.tipo_resposta === 'texto' && styles.textoInputLargo,
              {
                borderColor: cores.bordaInput,
                color: cores.texto,
                backgroundColor: cores.fundo,
              },
            ]}
            placeholder={
              item.tipo_resposta === 'numero'
                ? item.unidade
                  ? `Valor (${item.unidade})`
                  : 'Valor'
                : 'Texto'
            }
            placeholderTextColor={cores.placeholder}
            keyboardType={item.tipo_resposta === 'numero' ? 'numeric' : 'default'}
            value={respostas[k] || ''}
            onChangeText={(texto) => {
              setRespostas((prev) => {
                const next = { ...prev, [k]: texto };
                respostasRef.current = next;
                return next;
              });
              setRelatorioSalvo(false);
              agendarSalvarResposta(eq.id, item.id, { valor: texto });
            }}
            onBlur={() => salvarRespostaNoBlur(eq.id, item.id)}
          />
        ) : (
          <View style={styles.opcoesRow}>
            {(item.opcoes || []).map((opcao) => {
              const selecionado = respostas[k] === opcao;
              return (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.opcaoButton,
                    { borderColor: cores.bordaInput },
                    selecionado && { backgroundColor: cores.primario, borderColor: cores.primario },
                  ]}
                  onPress={() => selecionarResposta(eq.id, item.id, opcao)}
                >
                  <Text
                    style={
                      selecionado
                        ? styles.opcaoTextoSelecionado
                        : [styles.opcaoTexto, { color: cores.texto }]
                    }
                  >
                    {opcao}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TextInput
          style={[
            styles.observacaoInput,
            {
              borderColor: cores.bordaInput,
              color: cores.texto,
              backgroundColor: cores.fundo,
            },
          ]}
          placeholder="Observação (opcional)"
          placeholderTextColor={cores.placeholder}
          value={observacoesItem[k] || ''}
          onChangeText={(texto) => {
            setObservacoesItem((prev) => {
              const next = { ...prev, [k]: texto };
              observacoesRef.current = next;
              return next;
            });
            setRelatorioSalvo(false);
            if (respostasRef.current[k]) {
              agendarSalvarResposta(eq.id, item.id, { observacao: texto });
            }
          }}
          onBlur={() => {
            if (respostasRef.current[k]) salvarRespostaNoBlur(eq.id, item.id);
          }}
          multiline
        />

        {respostas[k] ? (
          <View style={styles.fotosSectionMini}>
            {(fotosPorItem[k] || []).map((foto) => (
              <View key={foto.id} style={styles.fotoWrapperMini}>
                <Image source={{ uri: foto.url }} style={styles.fotoThumbMini} />
                <TouchableOpacity
                  style={styles.editarFotoBotao}
                  onPress={() => editarLegendaFoto(eq.id, item.id, foto)}
                >
                  <Text style={styles.editarFotoTexto}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.excluirFotoButtonMini}
                  onPress={() => excluirFoto(eq.id, item.id, foto)}
                >
                  <Text style={styles.excluirFotoTexto}>×</Text>
                </TouchableOpacity>
                {foto.legenda ? (
                  <Text style={[styles.legendaFotoTexto, { color: cores.textoSuave }]} numberOfLines={1}>
                    {foto.legenda}
                  </Text>
                ) : null}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.iconeFotoMini, { borderColor: cores.primario }]}
              onPress={() => tirarFoto(eq.id, item.id)}
              disabled={uploading === k}
            >
              <Text style={styles.iconeFotoMiniTexto}>{uploading === k ? '…' : '📷'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconeFotoMini, { borderColor: cores.primario }]}
              onPress={() => escolherDaGaleria(eq.id, item.id)}
              disabled={uploading === k}
            >
              <Text style={styles.iconeFotoMiniTexto}>🖼</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.avisoSalvarPrimeiro, { color: cores.placeholder }]}>
            Escolha uma opção acima antes de adicionar foto
          </Text>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator color={cores.primario} />
      </View>
    );
  }

  const concluida = osConcluida(osInfo?.status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <View style={styles.tituloRow}>
        <Text style={[styles.title, { color: cores.texto }]}>Detalhe da OS</Text>
        <TouchableOpacity style={styles.atualizarBotao} onPress={atualizarDados} disabled={atualizando}>
          {atualizando ? (
            <ActivityIndicator size="small" color={cores.primario} />
          ) : (
            <Text style={[styles.atualizarTexto, { color: cores.primario }]}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {osInfo?.checkin_em ? (
        <TouchableOpacity
          onPress={statusSalvamento === 'erro' ? tentarSalvarDeNovo : undefined}
          disabled={statusSalvamento !== 'erro'}
          style={styles.statusSalvamentoRow}
        >
          <Text
            style={[
              styles.statusSalvamentoTexto,
              statusSalvamento === 'salvo' && { color: '#4caf50' },
              statusSalvamento === 'salvando' && { color: cores.textoSecundario },
              statusSalvamento === 'erro' && { color: cores.erro },
              statusSalvamento === 'idle' && { color: cores.textoSuave },
            ]}
          >
            {statusSalvamento === 'salvando'
              ? 'Salvando...'
              : statusSalvamento === 'salvo'
                ? 'Salvo'
                : statusSalvamento === 'erro'
                  ? 'Erro ao salvar — toque para tentar de novo'
                  : ' '}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View
        style={[
          styles.checkinSection,
          { backgroundColor: cores.fundoSecundario, borderColor: cores.borda },
        ]}
      >
        {!osInfo?.checkin_em ? (
          concluida ? (
            <Text style={[styles.osConcluidaTexto, { color: cores.erro }]}>
              Esta OS já está concluída — não é possível reabrir o check-in.
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.checkinBotao}
              onPress={fazerCheckin}
              disabled={processandoCheckin}
            >
              <Text style={styles.checkinBotaoTexto}>
                {processandoCheckin ? 'Registrando...' : '▶ Check-in (iniciar manutenção)'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <>
            <Text style={[styles.checkinInfoTexto, { color: cores.texto }]}>
              Check-in: {formatarHorario(osInfo.checkin_em)}
            </Text>
            {osInfo?.checkout_em ? (
              <Text style={[styles.checkinInfoTexto, { color: cores.texto }]}>
                Check-out: {formatarHorario(osInfo.checkout_em)}
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.checkoutBotao}
                onPress={fazerCheckout}
                disabled={processandoCheckout}
              >
                <Text style={styles.checkinBotaoTexto}>
                  {processandoCheckout ? 'Registrando...' : '■ Check-out (encerrar manutenção)'}
                </Text>
              </TouchableOpacity>
            )}
            {!osInfo?.checkout_em ? (
              <Text style={relatorioSalvo ? styles.relatorioSalvoTexto : styles.relatorioNaoSalvoTexto}>
                {relatorioSalvo
                  ? '✓ Relatório completo — check-out liberado'
                  : '⚠ Complete checklist, observações e assinaturas para liberar o check-out'}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {osEquipamentos.length === 0 ? (
        <Text style={{ color: cores.texto, marginBottom: 12 }}>
          {osInfo?.importado
            ? 'OS importada do sistema antigo, sem checklist — só consulta histórica.'
            : 'Nenhum equipamento vinculado a esta OS ainda.'}
        </Text>
      ) : null}

      {!osInfo?.checkin_em ? (
        <View style={styles.avisoCheckinSection}>
          <Text style={styles.avisoCheckinTexto}>
            {concluida
              ? 'Esta OS já está concluída — não é possível reabrir o check-in.'
              : 'Faça o check-in acima para liberar o preenchimento do relatório.'}
          </Text>
        </View>
      ) : (
        <>
          {osEquipamentos.map((eq) => (
            <View key={eq.id} style={styles.equipamentoBlock}>
              <Text style={[styles.equipamentoTitle, { color: cores.texto }]}>
                {eq.equipamentos?.tag} — {eq.equipamentos?.fabricante_gmg}
              </Text>

              <View
                style={[
                  styles.pendenciasSection,
                  { backgroundColor: cores.fundoSecundario, borderColor: cores.borda },
                ]}
              >
                <Text style={[styles.pendenciasTitulo, { color: cores.texto }]}>Pendências</Text>

                {(pendenciasPorEquipamento[eq.equipamento_id] || []).length === 0 ? (
                  <Text style={[styles.semPendencias, { color: cores.placeholder }]}>
                    Nenhuma pendência registrada.
                  </Text>
                ) : (
                  (pendenciasPorEquipamento[eq.equipamento_id] || []).map((p) => (
                    <View
                      key={p.id}
                      style={[
                        styles.pendenciaCard,
                        { borderColor: cores.borda, backgroundColor: cores.fundoCard },
                      ]}
                    >
                      <View style={styles.pendenciaHeader}>
                        {editandoPendenciaId === p.id ? (
                          <TextInput
                            style={[
                              styles.baixaInput,
                              styles.pendenciaEdicaoInput,
                              {
                                borderColor: cores.bordaInput,
                                color: cores.texto,
                                backgroundColor: cores.fundo,
                              },
                            ]}
                            value={textoEdicaoPendencia[p.id] ?? p.item_solicitado}
                            onChangeText={(texto) =>
                              setTextoEdicaoPendencia((prev) => ({ ...prev, [p.id]: texto }))
                            }
                          />
                        ) : (
                          <Text style={[styles.pendenciaItem, { color: cores.texto }]}>
                            {p.item_solicitado}
                          </Text>
                        )}

                        {editandoPendenciaId === p.id ? (
                          <TouchableOpacity
                            style={styles.confirmarEdicaoButton}
                            onPress={() => salvarEdicaoPendencia(eq.equipamento_id, p.id)}
                            disabled={salvandoEdicaoPendencia}
                          >
                            <Text style={styles.confirmarEdicaoTexto}>✓</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.editarPendenciaButton, { borderColor: cores.primario }]}
                            onPress={() => {
                              setEditandoPendenciaId(p.id);
                              setTextoEdicaoPendencia((prev) => ({
                                ...prev,
                                [p.id]: p.item_solicitado,
                              }));
                            }}
                          >
                            <Text style={[styles.editarPendenciaTexto, { color: cores.primario }]}>
                              ✎
                            </Text>
                          </TouchableOpacity>
                        )}

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: corDoStatusPendencia(p.status) },
                          ]}
                        >
                          <Text style={styles.statusBadgeTexto}>{p.status}</Text>
                        </View>
                      </View>

                      {p.status !== 'resolvida' ? (
                        <Text style={[styles.diasAbertaTexto, { color: cores.textoSecundario }]}>
                          Aberta {diasAberta(p.solicitado_em)} · prioridade: {p.prioridade}
                        </Text>
                      ) : null}

                      <View style={styles.fotosRow}>
                        {(fotosPorPendencia[p.id] || []).map((foto) => (
                          <View key={foto.id} style={styles.fotoWrapper}>
                            <Image source={{ uri: foto.url }} style={styles.fotoThumb} />
                            <TouchableOpacity
                              style={styles.excluirFotoButton}
                              onPress={() => excluirFotoPendencia(p.id, foto)}
                            >
                              <Text style={styles.excluirFotoTexto}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>

                      <View style={styles.fotoBotoesRow}>
                        <TouchableOpacity
                          style={[styles.fotoBotao, styles.fotoBotaoCamera, { borderColor: cores.primario, backgroundColor: cores.primario }]}
                          onPress={() => tirarFotoPendencia(p.id)}
                          disabled={uploadingPendencia === p.id}
                        >
                          <Text style={styles.fotoBotaoTextoCamera}>
                            {uploadingPendencia === p.id ? 'Enviando...' : '📷 Tirar foto'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.fotoBotao, { borderColor: cores.primario }]}
                          onPress={() => escolherGaleriaPendencia(p.id)}
                          disabled={uploadingPendencia === p.id}
                        >
                          <Text style={[styles.fotoBotaoTexto, { color: cores.primario }]}>
                            {uploadingPendencia === p.id ? 'Enviando...' : 'Galeria'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {p.status !== 'resolvida' ? (
                        <View style={styles.baixaBlock}>
                          <TextInput
                            style={[
                              styles.baixaInput,
                              {
                                borderColor: cores.bordaInput,
                                color: cores.texto,
                                backgroundColor: cores.fundo,
                              },
                            ]}
                            placeholder="O que foi feito? (obrigatório pra dar baixa)"
                            placeholderTextColor={cores.placeholder}
                            value={baixaTexto[p.id] || ''}
                            onChangeText={(texto) =>
                              setBaixaTexto((prev) => ({ ...prev, [p.id]: texto }))
                            }
                          />
                          <Button
                            title="Realizado"
                            onPress={() => darBaixaPendencia(eq.equipamento_id, p.id)}
                          />
                        </View>
                      ) : (
                        <Text style={styles.pendenciaResolvidaTexto}>
                          Resolvida: {p.observacao_baixa}
                        </Text>
                      )}
                    </View>
                  ))
                )}

                {mostrarFormPendencia[eq.equipamento_id] ? (
                  <View style={styles.novaPendenciaForm}>
                    <TextInput
                      style={[
                        styles.baixaInput,
                        {
                          borderColor: cores.bordaInput,
                          color: cores.texto,
                          backgroundColor: cores.fundo,
                        },
                      ]}
                      placeholder="O que precisa ser trocado/verificado?"
                      placeholderTextColor={cores.placeholder}
                      value={novoPendenciaTexto[eq.equipamento_id] || ''}
                      onChangeText={(texto) =>
                        setNovoPendenciaTexto((prev) => ({ ...prev, [eq.equipamento_id]: texto }))
                      }
                    />
                    <View style={styles.prioridadeRow}>
                      {['baixa', 'media', 'alta', 'critica'].map((p) => {
                        const selecionada =
                          (novaPendenciaPrioridade[eq.equipamento_id] || 'media') === p;
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.opcaoButton,
                              { borderColor: cores.bordaInput },
                              selecionada && {
                                backgroundColor: cores.primario,
                                borderColor: cores.primario,
                              },
                            ]}
                            onPress={() =>
                              setNovaPendenciaPrioridade((prev) => ({
                                ...prev,
                                [eq.equipamento_id]: p,
                              }))
                            }
                          >
                            <Text
                              style={
                                selecionada
                                  ? styles.opcaoTextoSelecionado
                                  : [styles.opcaoTexto, { color: cores.texto }]
                              }
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Button
                      title={salvandoPendencia ? 'Salvando...' : 'Salvar pendência'}
                      onPress={() => criarPendencia(eq.equipamento_id)}
                      disabled={salvandoPendencia}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.novaPendenciaBotao, { borderColor: cores.primario }]}
                    onPress={() =>
                      setMostrarFormPendencia((prev) => ({ ...prev, [eq.equipamento_id]: true }))
                    }
                  >
                    <Text style={[styles.novaPendenciaBotaoTexto, { color: cores.primario }]}>
                      + Nova pendência
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {agruparItensPorGrupo(eq.itens).map(({ nome, itens: itensGrupo }) => {
                const chaveSecao = `${eq.id}:${nome}`;
                const preenchidos = itensGrupo.filter((item) => {
                  const v = respostas[chave(eq.id, item.id)];
                  return v != null && String(v).trim() !== '';
                }).length;
                const completa = preenchidos === itensGrupo.length && itensGrupo.length > 0;
                const resumo = itensGrupo
                  .map((item) => respostas[chave(eq.id, item.id)])
                  .filter((v) => v != null && String(v).trim() !== '')
                  .slice(0, 4)
                  .join(' | ');
                const aberta = secoesAbertas[chaveSecao] !== false;

                return (
                  <SecaoChecklist
                    key={chaveSecao}
                    titulo={nome}
                    preenchidos={preenchidos}
                    total={itensGrupo.length}
                    resumo={resumo}
                    aberta={aberta}
                    completa={completa}
                    onToggle={() =>
                      setSecoesAbertas((prev) => ({ ...prev, [chaveSecao]: !aberta }))
                    }
                    onSalvarSecao={() => salvarSecao(eq, itensGrupo, chaveSecao)}
                    salvandoSecao={salvandoSecao === chaveSecao}
                  >
                    {itensGrupo.map((item) => renderItemChecklist(eq, item))}
                  </SecaoChecklist>
                );
              })}
            </View>
          ))}

          <View
            style={[
              styles.observacaoGeralSection,
              { backgroundColor: cores.fundoSecundario, borderColor: cores.borda },
            ]}
          >
            <Text style={[styles.pendenciasTitulo, { color: cores.texto }]}>
              Observações Gerais & Assinaturas
            </Text>

            <Text style={[styles.campoRotulo, { color: cores.texto }]}>Observações Gerais *</Text>
            <TextInput
              style={[
                styles.observacaoInput,
                styles.observacaoGeralInput,
                {
                  borderColor: cores.bordaInput,
                  color: cores.texto,
                  backgroundColor: cores.fundo,
                },
              ]}
              placeholder="Observações gerais sobre a manutenção..."
              placeholderTextColor={cores.placeholder}
              value={observacaoGeral}
              onChangeText={(texto) => {
                setObservacaoGeral(texto);
                observacaoGeralRef.current = texto;
                setRelatorioSalvo(false);
                agendarSalvarOs('obs_geral', () => ({
                  observacoes_gerais: observacaoGeralRef.current,
                }));
              }}
              onBlur={() =>
                salvarOsNoBlur('obs_geral', () => ({
                  observacoes_gerais: observacaoGeralRef.current,
                }))
              }
              multiline
            />

            <Text style={[styles.campoRotulo, { color: cores.texto }]}>
              Deslocamento de Saída (km)
            </Text>
            <TextInput
              style={[
                styles.numeroInput,
                {
                  borderColor: cores.bordaInput,
                  color: cores.texto,
                  backgroundColor: cores.fundo,
                },
              ]}
              placeholder="Km"
              placeholderTextColor={cores.placeholder}
              keyboardType="numeric"
              value={kmSaida}
              onChangeText={(texto) => {
                setKmSaida(texto);
                kmSaidaRef.current = texto;
                agendarSalvarOs('km_saida', () => ({
                  km_saida: kmSaidaRef.current === '' ? null : Number(kmSaidaRef.current),
                }));
              }}
              onBlur={() =>
                salvarOsNoBlur('km_saida', () => ({
                  km_saida: kmSaidaRef.current === '' ? null : Number(kmSaidaRef.current),
                }))
              }
            />

            <Text style={[styles.campoRotulo, { color: cores.texto }]}>
              Deslocamento de Retorno (km)
            </Text>
            <TextInput
              style={[
                styles.numeroInput,
                {
                  borderColor: cores.bordaInput,
                  color: cores.texto,
                  backgroundColor: cores.fundo,
                },
              ]}
              placeholder="Km"
              placeholderTextColor={cores.placeholder}
              keyboardType="numeric"
              value={kmRetorno}
              onChangeText={(texto) => {
                setKmRetorno(texto);
                kmRetornoRef.current = texto;
                agendarSalvarOs('km_retorno', () => ({
                  km_retorno: kmRetornoRef.current === '' ? null : Number(kmRetornoRef.current),
                }));
              }}
              onBlur={() =>
                salvarOsNoBlur('km_retorno', () => ({
                  km_retorno: kmRetornoRef.current === '' ? null : Number(kmRetornoRef.current),
                }))
              }
            />

            <AssinaturaCampo
              titulo="Assinatura do Cliente"
              assinatura={assinaturaCliente}
              onSalvar={(dados) => salvarAssinatura('cliente', dados)}
              onExcluir={() => excluirAssinatura('cliente')}
            />

            <AssinaturaCampo
              titulo="Assinatura do Técnico"
              assinatura={assinaturaTecnico}
              onSalvar={(dados) => salvarAssinatura('tecnico', dados)}
              onExcluir={() => excluirAssinatura('tecnico')}
            />
          </View>

          <TouchableOpacity
            style={[styles.salvarRelatorioBotao, { backgroundColor: cores.primario }]}
            onPress={salvarRelatorioCompleto}
            disabled={salvandoRelatorio}
          >
            <Text style={styles.salvarRelatorioTexto}>
              {salvandoRelatorio ? 'Salvando relatório...' : '💾 Salvar Relatório'}
            </Text>
          </TouchableOpacity>
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20, backgroundColor: '#fff' },
  backButton: { marginBottom: 10 },
  backText: { color: '#007AFF', fontSize: 16 },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  atualizarBotao: { paddingHorizontal: 10, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
  atualizarTexto: { fontSize: 22, color: '#007AFF' },
  statusSalvamentoRow: { marginBottom: 12 },
  statusSalvamentoTexto: { fontSize: 13, fontWeight: '600' },
  equipamentoBlock: { marginBottom: 24 },
  equipamentoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  itemBlock: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 12 },
  itemTitulo: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  opcoesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  opcaoButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  opcaoTexto: { color: '#333' },
  opcaoTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
  numeroInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    width: 150,
  },
  textoInputLargo: { width: '100%' },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  fotoWrapper: { marginRight: 8, marginBottom: 8, position: 'relative' },
  fotoThumb: { width: 70, height: 70, borderRadius: 8 },
  excluirFotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e53935',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  excluirFotoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14, lineHeight: 16 },
  fotoBotoesRow: { flexDirection: 'row' },
  fotoBotao: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  fotoBotaoCamera: { backgroundColor: '#007AFF' },
  fotoBotaoTexto: { color: '#007AFF', fontWeight: '600' },
  fotoBotaoTextoCamera: { color: '#fff', fontWeight: '600' },
  avisoSalvarPrimeiro: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
  fotosSectionMini: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  fotoWrapperMini: { width: 54, marginRight: 8, marginBottom: 8, position: 'relative' },
  fotoThumbMini: { width: 54, height: 54, borderRadius: 6 },
  editarFotoBotao: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: '#007AFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editarFotoTexto: { color: '#fff', fontSize: 10 },
  excluirFotoButtonMini: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e53935',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendaFotoTexto: { fontSize: 9, color: '#666', marginTop: 2 },
  iconeFotoMini: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  iconeFotoMiniTexto: { fontSize: 18 },
  pendenciasSection: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pendenciasTitulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  campoRotulo: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  semPendencias: { fontSize: 13, color: '#999', marginBottom: 8 },
  pendenciaCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  pendenciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendenciaItem: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeTexto: { color: '#fff', fontSize: 11, fontWeight: '600' },
  baixaBlock: { marginTop: 6 },
  baixaInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  pendenciaResolvidaTexto: { fontSize: 12, color: '#4caf50', marginTop: 4 },
  novaPendenciaForm: { marginTop: 8 },
  prioridadeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  novaPendenciaBotao: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  novaPendenciaBotaoTexto: { color: '#007AFF', fontWeight: '600' },
  diasAbertaTexto: { fontSize: 12, color: '#666', marginBottom: 6, fontStyle: 'italic' },
  observacaoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  observacaoGeralSection: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  observacaoGeralInput: { minHeight: 80, backgroundColor: '#fff' },
  pendenciaEdicaoInput: { flex: 1, marginBottom: 0, marginRight: 8 },
  editarPendenciaButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editarPendenciaTexto: { color: '#007AFF', fontSize: 13 },
  confirmarEdicaoButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  confirmarEdicaoTexto: { color: '#fff', fontWeight: 'bold' },
  salvarRelatorioBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  salvarRelatorioTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  checkinSection: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  checkinBotao: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutBotao: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  checkinBotaoTexto: { color: '#fff', fontWeight: 'bold' },
  checkinInfoTexto: { fontSize: 14, color: '#333', marginBottom: 4 },
  osConcluidaTexto: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  avisoCheckinSection: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffcc80',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  avisoCheckinTexto: { color: '#e65100', fontWeight: '600', textAlign: 'center' },
  relatorioSalvoTexto: { fontSize: 12, color: '#4caf50', marginTop: 8, fontWeight: '600' },
  relatorioNaoSalvoTexto: { fontSize: 12, color: '#e65100', marginTop: 8, fontWeight: '600' },
});
