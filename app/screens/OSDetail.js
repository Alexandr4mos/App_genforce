import { useEffect, useState } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

function avisar(mensagem, titulo = 'Aviso') {
  if (Platform.OS === 'web') {
    window.alert(mensagem);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

function confirmarAcao(mensagem) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(mensagem));
  }
  return new Promise((resolve) => {
    Alert.alert('Confirmar', mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

// Chave composta: cada resposta pertence a um gerador (os_equipamento) + item específico.
// Usar só o id do item causava "vazamento" de resposta entre GMG 01 e GMG 02 quando
// os dois usam o mesmo checklist (mesmos template_item_id).
function chave(osEquipamentoId, templateItemId) {
  return `${osEquipamentoId}:${templateItemId}`;
}

export default function OSDetail({ osId, userId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [osEquipamentos, setOsEquipamentos] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [respostaIds, setRespostaIds] = useState({});
  const [fotosPorItem, setFotosPorItem] = useState({});
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [pendenciasPorEquipamento, setPendenciasPorEquipamento] = useState({});
  const [mostrarFormPendencia, setMostrarFormPendencia] = useState({});
  const [novoPendenciaTexto, setNovoPendenciaTexto] = useState({});
  const [novaPendenciaPrioridade, setNovaPendenciaPrioridade] = useState({});
  const [baixaTexto, setBaixaTexto] = useState({});
  const [salvandoPendencia, setSalvandoPendencia] = useState(false);
  const [observacoesItem, setObservacoesItem] = useState({});
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [salvandoObservacaoGeral, setSalvandoObservacaoGeral] = useState(false);
  const [fotosPorPendencia, setFotosPorPendencia] = useState({});
  const [uploadingPendencia, setUploadingPendencia] = useState(null);
  const [editandoPendenciaId, setEditandoPendenciaId] = useState(null);
  const [textoEdicaoPendencia, setTextoEdicaoPendencia] = useState({});
  const [salvandoEdicaoPendencia, setSalvandoEdicaoPendencia] = useState(false);
  const [salvandoRelatorio, setSalvandoRelatorio] = useState(false);
  const [osInfo, setOsInfo] = useState(null);
  const [processandoCheckin, setProcessandoCheckin] = useState(false);
  const [processandoCheckout, setProcessandoCheckout] = useState(false);
  const [relatorioSalvo, setRelatorioSalvo] = useState(false);

  useEffect(() => {
    loadData();
  }, [osId]);

  async function loadData() {
    setLoading(true);

    const { data: osEq, error: osEqError } = await supabase
      .from('os_equipamentos')
      .select('id, equipamento_id, template_id, equipamentos(tag, fabricante_gmg)')
      .eq('os_id', osId);

    if (osEqError) {
      console.log(osEqError);
      setLoading(false);
      return;
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
    setRespostas(respostasIniciais);
    setRespostaIds(idsIniciais);
    setFotosPorItem(fotosIniciais);
    setObservacoesItem(observacoesIniciais);

    // Busca a observação geral e os dados de check-in/checkout já salvos na OS
    const { data: osAtual } = await supabase
      .from('ordens_servico')
      .select('observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status')
      .eq('id', osId)
      .single();
    setObservacaoGeral(osAtual?.observacoes_gerais || '');
    setOsInfo(osAtual || null);

    // Busca pendências de cada equipamento (aparecem mesmo se abertas em OS anteriores)
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

    // Busca fotos já anexadas em cada pendência
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

    setLoading(false);
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

    // Rede de segurança: mesmo se o navegador travar no pedido de permissão,
    // não deixa o botão preso pra sempre em "Registrando...".
    const tempoLimite = new Promise((resolve) =>
      setTimeout(() => resolve({ lat: null, lng: null }), 7000)
    );

    return Promise.race([buscaLocalizacao, tempoLimite]);
  }

  async function fazerCheckin() {
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
      .select('observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status')
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
      avisar('Não há geradores vinculados a esta OS.', 'Não é possível encerrar');
      return;
    }

    if (!relatorioSalvo) {
      avisar(
        'Preencha todo o checklist e clique em "💾 Salvar Relatório" antes de fazer o check-out.',
        'Relatório não salvo'
      );
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
      .select('observacoes_gerais, checkin_em, checkin_lat, checkin_lng, checkout_em, checkout_lat, checkout_lng, status')
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

  function selecionarResposta(osEquipamentoId, templateItemId, valor) {
    setRespostas((prev) => ({ ...prev, [chave(osEquipamentoId, templateItemId)]: valor }));
    setRelatorioSalvo(false);
  }

  async function garantirRespostaSalva(osEquipamentoId, templateItemId) {
    const k = chave(osEquipamentoId, templateItemId);
    const valor = respostas[k];
    if (!valor) return null;
    const observacao = observacoesItem[k] || null;

    const { data: existente } = await supabase
      .from('checklist_respostas')
      .select('id')
      .eq('os_equipamento_id', osEquipamentoId)
      .eq('template_item_id', templateItemId)
      .maybeSingle();

    let respostaId = existente?.id;

    if (existente) {
      await supabase
        .from('checklist_respostas')
        .update({ resposta: valor, observacao, respondido_em: new Date().toISOString() })
        .eq('id', existente.id);
    } else {
      const { data: inserida } = await supabase
        .from('checklist_respostas')
        .insert({
          os_equipamento_id: osEquipamentoId,
          template_item_id: templateItemId,
          resposta: valor,
          observacao,
        })
        .select('id')
        .single();
      respostaId = inserida?.id;
    }

    setRespostaIds((prev) => ({ ...prev, [k]: respostaId }));
    return respostaId;
  }

  async function enviarFotoParaStorage(osEquipamentoId, templateItemId, uri) {
    const k = chave(osEquipamentoId, templateItemId);
    let respostaId = respostaIds[k];
    if (!respostaId) {
      respostaId = await garantirRespostaSalva(osEquipamentoId, templateItemId);
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

  function corDoStatus(status) {
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

  async function salvarObservacaoGeral() {
    setSalvandoObservacaoGeral(true);
    const { error } = await supabase
      .from('ordens_servico')
      .update({ observacoes_gerais: observacaoGeral })
      .eq('id', osId);
    setSalvandoObservacaoGeral(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar observação geral');
    }
  }

  async function salvarRelatorioCompleto() {
    setSalvandoRelatorio(true);

    for (const eq of osEquipamentos) {
      for (const item of eq.itens) {
        if (respostas[chave(eq.id, item.id)]) {
          await garantirRespostaSalva(eq.id, item.id);
        }
      }
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update({ observacoes_gerais: observacaoGeral })
      .eq('id', osId);

    setSalvandoRelatorio(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar relatório');
      return;
    }

    const faltando = [];
    osEquipamentos.forEach((eq) => {
      eq.itens.forEach((item) => {
        if (!respostas[chave(eq.id, item.id)]) {
          faltando.push(`${eq.equipamentos?.tag || 'Gerador'}: ${item.titulo}`);
        }
      });
    });

    if (faltando.length > 0) {
      setRelatorioSalvo(false);
      avisar(
        `Salvo, mas ainda faltam ${faltando.length} item(ns) pra completar: ${faltando.slice(0, 3).join(' · ')}`,
        'Relatório incompleto'
      );
      return;
    }

    setRelatorioSalvo(true);
    avisar('Relatório salvo com sucesso! Check-out liberado.', 'Sucesso');
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Detalhe da OS</Text>

      <View style={styles.checkinSection}>
        {!osInfo?.checkin_em ? (
          <TouchableOpacity
            style={styles.checkinBotao}
            onPress={fazerCheckin}
            disabled={processandoCheckin}
          >
            <Text style={styles.checkinBotaoTexto}>
              {processandoCheckin ? 'Registrando...' : '▶ Check-in (iniciar manutenção)'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.checkinInfoTexto}>
              Check-in: {formatarHorario(osInfo.checkin_em)}
            </Text>
            {osInfo?.checkout_em ? (
              <Text style={styles.checkinInfoTexto}>
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
                  ? '✓ Relatório salvo — check-out liberado'
                  : '⚠ Salve o relatório completo para liberar o check-out'}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {osEquipamentos.length === 0 ? (
        <Text>Nenhum equipamento vinculado a esta OS ainda.</Text>
      ) : null}

      {!osInfo?.checkin_em ? (
        <View style={styles.avisoCheckinSection}>
          <Text style={styles.avisoCheckinTexto}>
            Faça o check-in acima para liberar o preenchimento do relatório.
          </Text>
        </View>
      ) : (
        <>
          {osEquipamentos.map((eq) => (
        <View key={eq.id} style={styles.equipamentoBlock}>
          <Text style={styles.equipamentoTitle}>
            {eq.equipamentos?.tag} — {eq.equipamentos?.fabricante_gmg}
          </Text>

          <View style={styles.pendenciasSection}>
            <Text style={styles.pendenciasTitulo}>Pendências</Text>

            {(pendenciasPorEquipamento[eq.equipamento_id] || []).length === 0 ? (
              <Text style={styles.semPendencias}>Nenhuma pendência registrada.</Text>
            ) : (
              (pendenciasPorEquipamento[eq.equipamento_id] || []).map((p) => (
                <View key={p.id} style={styles.pendenciaCard}>
                  <View style={styles.pendenciaHeader}>
                    {editandoPendenciaId === p.id ? (
                      <TextInput
                        style={[styles.baixaInput, styles.pendenciaEdicaoInput]}
                        value={textoEdicaoPendencia[p.id] ?? p.item_solicitado}
                        onChangeText={(texto) =>
                          setTextoEdicaoPendencia((prev) => ({ ...prev, [p.id]: texto }))
                        }
                      />
                    ) : (
                      <Text style={styles.pendenciaItem}>{p.item_solicitado}</Text>
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
                        style={styles.editarPendenciaButton}
                        onPress={() => {
                          setEditandoPendenciaId(p.id);
                          setTextoEdicaoPendencia((prev) => ({ ...prev, [p.id]: p.item_solicitado }));
                        }}
                      >
                        <Text style={styles.editarPendenciaTexto}>✎</Text>
                      </TouchableOpacity>
                    )}

                    <View style={[styles.statusBadge, { backgroundColor: corDoStatus(p.status) }]}>
                      <Text style={styles.statusBadgeTexto}>{p.status}</Text>
                    </View>
                  </View>

                  {p.status !== 'resolvida' ? (
                    <Text style={styles.diasAbertaTexto}>
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
                      style={[styles.fotoBotao, styles.fotoBotaoCamera]}
                      onPress={() => tirarFotoPendencia(p.id)}
                      disabled={uploadingPendencia === p.id}
                    >
                      <Text style={styles.fotoBotaoTextoCamera}>
                        {uploadingPendencia === p.id ? 'Enviando...' : '📷 Tirar foto'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.fotoBotao}
                      onPress={() => escolherGaleriaPendencia(p.id)}
                      disabled={uploadingPendencia === p.id}
                    >
                      <Text style={styles.fotoBotaoTexto}>
                        {uploadingPendencia === p.id ? 'Enviando...' : 'Galeria'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {p.status !== 'resolvida' ? (
                    <View style={styles.baixaBlock}>
                      <TextInput
                        style={styles.baixaInput}
                        placeholder="O que foi feito? (obrigatório pra dar baixa)"
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
                  style={styles.baixaInput}
                  placeholder="O que precisa ser trocado/verificado?"
                  value={novoPendenciaTexto[eq.equipamento_id] || ''}
                  onChangeText={(texto) =>
                    setNovoPendenciaTexto((prev) => ({ ...prev, [eq.equipamento_id]: texto }))
                  }
                />
                <View style={styles.prioridadeRow}>
                  {['baixa', 'media', 'alta', 'critica'].map((p) => {
                    const selecionada = (novaPendenciaPrioridade[eq.equipamento_id] || 'media') === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.opcaoButton, selecionada && styles.opcaoSelecionada]}
                        onPress={() =>
                          setNovaPendenciaPrioridade((prev) => ({ ...prev, [eq.equipamento_id]: p }))
                        }
                      >
                        <Text style={selecionada ? styles.opcaoTextoSelecionado : styles.opcaoTexto}>
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
                style={styles.novaPendenciaBotao}
                onPress={() =>
                  setMostrarFormPendencia((prev) => ({ ...prev, [eq.equipamento_id]: true }))
                }
              >
                <Text style={styles.novaPendenciaBotaoTexto}>+ Nova pendência</Text>
              </TouchableOpacity>
            )}
          </View>

          {eq.itens.map((item) => (
            <View key={item.id} style={styles.itemBlock}>
              <Text style={styles.itemGrupo}>{item.grupo}</Text>
              <Text style={styles.itemTitulo}>{item.titulo}</Text>

              {item.tipo_resposta === 'numero' ? (
                <TextInput
                  style={styles.numeroInput}
                  placeholder={item.unidade ? `Valor (${item.unidade})` : 'Valor'}
                  keyboardType="numeric"
                  value={respostas[chave(eq.id, item.id)] || ''}
                  onChangeText={(texto) => selecionarResposta(eq.id, item.id, texto)}
                />
              ) : (
                <View style={styles.opcoesRow}>
                  {(item.opcoes || []).map((opcao) => {
                    const selecionado = respostas[chave(eq.id, item.id)] === opcao;
                    return (
                      <TouchableOpacity
                        key={opcao}
                        style={[styles.opcaoButton, selecionado && styles.opcaoSelecionada]}
                        onPress={() => selecionarResposta(eq.id, item.id, opcao)}
                      >
                        <Text style={selecionado ? styles.opcaoTextoSelecionado : styles.opcaoTexto}>
                          {opcao}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TextInput
                style={styles.observacaoInput}
                placeholder="Observação (opcional)"
                value={observacoesItem[chave(eq.id, item.id)] || ''}
                onChangeText={(texto) => {
                  setObservacoesItem((prev) => ({ ...prev, [chave(eq.id, item.id)]: texto }));
                  setRelatorioSalvo(false);
                }}
                multiline
              />

              {respostas[chave(eq.id, item.id)] ? (
                <View style={styles.fotosSectionMini}>
                  {(fotosPorItem[chave(eq.id, item.id)] || []).map((foto) => (
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
                        <Text style={styles.legendaFotoTexto} numberOfLines={1}>
                          {foto.legenda}
                        </Text>
                      ) : null}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.iconeFotoMini}
                    onPress={() => tirarFoto(eq.id, item.id)}
                    disabled={uploading === chave(eq.id, item.id)}
                  >
                    <Text style={styles.iconeFotoMiniTexto}>
                      {uploading === chave(eq.id, item.id) ? '…' : '📷'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconeFotoMini}
                    onPress={() => escolherDaGaleria(eq.id, item.id)}
                    disabled={uploading === chave(eq.id, item.id)}
                  >
                    <Text style={styles.iconeFotoMiniTexto}>🖼</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.avisoSalvarPrimeiro}>
                  Escolha uma opção acima antes de adicionar foto
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}

      <View style={styles.observacaoGeralSection}>
        <Text style={styles.pendenciasTitulo}>Observação geral da OS</Text>
        <TextInput
          style={[styles.observacaoInput, styles.observacaoGeralInput]}
          placeholder="Observações gerais sobre a manutenção..."
          value={observacaoGeral}
          onChangeText={(texto) => {
            setObservacaoGeral(texto);
            setRelatorioSalvo(false);
          }}
          multiline
        />
      </View>

      <TouchableOpacity
        style={styles.salvarRelatorioBotao}
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  equipamentoBlock: { marginBottom: 24 },
  equipamentoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  itemBlock: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 12 },
  itemGrupo: { fontSize: 12, color: '#888', marginBottom: 4 },
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
  opcaoSelecionada: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
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
  fotosSection: { marginTop: 10 },
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
  fotosSectionMini: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 6 },
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
  semPendencias: { fontSize: 13, color: '#999', marginBottom: 8 },
  pendenciaCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  pendenciaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
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
    marginBottom: 40,
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