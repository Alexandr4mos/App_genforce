import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Button,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';
import { rotuloTipoFiltro } from '../lib/constantes';
import DatePickerCampo from './DatePickerCampo';
import { textoProximaTroca } from '../lib/pecasHistorico';

function formatarDataHora(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FORM_VAZIO = {
  peca: '',
  codigo_peca: '',
  quantidade: '1',
  observacao: '',
  pendencia_id: null,
  proxima_troca_prevista: '',
  fotosPendentes: [],
};

export default function SecaoPecasTrocadas({
  osId,
  equipamentoId,
  userId,
  pecasOs,
  historicoPecas,
  filtrosEquipamento,
  pendencias,
  onPecaRegistrada,
  preenchimentoInicial,
  onLimparPreenchimento,
  somenteLeitura = false,
}) {
  const { cores } = useTema();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);

  const inputStyle = [
    styles.input,
    { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundo },
  ];

  const pendenciasAbertas = (pendencias || []).filter((p) => p.status !== 'resolvida');

  useEffect(() => {
    if (preenchimentoInicial) {
      setForm({
        ...FORM_VAZIO,
        peca: preenchimentoInicial.peca || '',
        codigo_peca: preenchimentoInicial.codigo_peca || '',
        quantidade: preenchimentoInicial.quantidade || '1',
        observacao: preenchimentoInicial.observacao || '',
        pendencia_id: preenchimentoInicial.pendencia_id || null,
      });
      setMostrarForm(true);
      onLimparPreenchimento?.();
    }
  }, [preenchimentoInicial]);

  function aplicarFiltroCadastrado(filtro) {
    setForm((prev) => ({
      ...prev,
      codigo_peca: filtro.numero_peca,
      peca: prev.peca || `Filtro de ${rotuloTipoFiltro(filtro.tipo_filtro)}`,
    }));
  }

  async function enviarFotoPeca(relatorioPecaId, uri) {
    const respostaFetch = await fetch(uri);
    const blob = await respostaFetch.blob();
    const nomeArquivo = `pecas/${relatorioPecaId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nomeArquivo, blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      throw new Error(uploadError.message || 'Erro ao enviar foto');
    }

    const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(nomeArquivo);

    const { error: insertError } = await supabase.from('fotos').insert({
      relatorio_peca_id: relatorioPecaId,
      os_id: osId,
      url: urlData.publicUrl,
    });

    if (insertError) {
      throw new Error(insertError.message || 'Erro ao registrar foto');
    }
  }

  async function adicionarFoto(uri) {
    setForm((prev) => ({
      ...prev,
      fotosPendentes: [...(prev.fotosPendentes || []), uri],
    }));
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      avisar('Preciso de acesso à câmera para tirar a foto.', 'Permissão necessária');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (resultado.canceled) return;
    await adicionarFoto(resultado.assets[0].uri);
  }

  async function escolherGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (resultado.canceled) return;
    const uris = resultado.assets.map((a) => a.uri);
    setForm((prev) => ({
      ...prev,
      fotosPendentes: [...(prev.fotosPendentes || []), ...uris],
    }));
  }

  function removerFotoPendente(indice) {
    setForm((prev) => ({
      ...prev,
      fotosPendentes: (prev.fotosPendentes || []).filter((_, i) => i !== indice),
    }));
  }

  async function salvarPeca() {
    if (!form.peca.trim()) {
      avisar('Informe o nome da peça.', 'Campo obrigatório');
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase
      .from('relatorio_pecas')
      .insert({
        os_id: osId,
        equipamento_id: equipamentoId,
        pendencia_id: form.pendencia_id || null,
        peca: form.peca.trim(),
        codigo_peca: form.codigo_peca?.trim() || null,
        quantidade: form.quantidade ? Number(form.quantidade) : 1,
        observacao: form.observacao?.trim() || null,
        proxima_troca_prevista: form.proxima_troca_prevista?.trim() || null,
        tecnico_id: userId,
      })
      .select('*')
      .single();

    if (error) {
      setSalvando(false);
      avisar(error.message, 'Erro ao registrar peça');
      return;
    }

    const fotosPendentes = form.fotosPendentes || [];
    if (fotosPendentes.length > 0) {
      setUploadingFoto(true);
      try {
        for (const uri of fotosPendentes) {
          await enviarFotoPeca(data.id, uri);
        }
        const { data: fotos } = await supabase.from('fotos').select('id, url').eq('relatorio_peca_id', data.id);
        data.fotos = fotos || [];
      } catch (err) {
        avisar(err.message || 'Peça salva, mas houve erro ao enviar foto(s).', 'Aviso');
      }
      setUploadingFoto(false);
    }

    setSalvando(false);
    onPecaRegistrada(data);
    setForm(FORM_VAZIO);
    setMostrarForm(false);
  }

  const historicoFiltrado = (historicoPecas || []).filter((p) => p.os_id !== osId);

  return (
    <View style={[styles.secao, { backgroundColor: cores.fundoSecundario, borderColor: cores.borda }]}>
      <Text style={[styles.titulo, { color: cores.texto }]}>Peças trocadas</Text>

      {(pecasOs || []).length === 0 ? (
        <Text style={[styles.vazio, { color: cores.placeholder }]}>Nenhuma peça registrada nesta OS.</Text>
      ) : (
        (pecasOs || []).map((p) => (
          <View key={p.id} style={[styles.card, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
            <Text style={[styles.pecaNome, { color: cores.texto }]}>{p.peca}</Text>
            {p.codigo_peca ? (
              <Text style={[styles.pecaCodigo, { color: cores.textoSecundario }]}>Código: {p.codigo_peca}</Text>
            ) : null}
            <Text style={[styles.pecaDetalhe, { color: cores.textoSecundario }]}>
              Qtd: {p.quantidade ?? 1} · {formatarDataHora(p.data_hora)}
            </Text>
            {p.proxima_troca_prevista ? (
              <Text style={[styles.pecaDetalhe, { color: cores.textoSecundario }]}>
                Próxima troca: {textoProximaTroca(p.proxima_troca_prevista)}
              </Text>
            ) : null}
            {p.observacao ? (
              <Text style={[styles.pecaObs, { color: cores.textoSecundario }]}>{p.observacao}</Text>
            ) : null}
          </View>
        ))
      )}

      {historicoFiltrado.length > 0 ? (
        <>
          <Text style={[styles.subtitulo, { color: cores.texto }]}>Histórico deste gerador</Text>
          {historicoFiltrado.slice(0, 5).map((p) => (
            <View key={`hist-${p.id}`} style={[styles.cardHistorico, { borderColor: cores.borda }]}>
              <Text style={[styles.pecaNome, { color: cores.texto }]}>{p.peca}</Text>
              {p.codigo_peca ? (
                <Text style={[styles.pecaCodigo, { color: cores.textoSecundario }]}>{p.codigo_peca}</Text>
              ) : null}
              <Text style={[styles.pecaDetalhe, { color: cores.textoSuave }]}>
                {formatarDataHora(p.data_hora)}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {!somenteLeitura ? (
        mostrarForm ? (
          <View style={styles.form}>
            <TextInput
              style={inputStyle}
              placeholder="Peça (nome) *"
              placeholderTextColor={cores.placeholder}
              value={form.peca}
              onChangeText={(v) => setForm((prev) => ({ ...prev, peca: v }))}
            />
            <TextInput
              style={inputStyle}
              placeholder="Código da peça / nº série"
              placeholderTextColor={cores.placeholder}
              value={form.codigo_peca}
              onChangeText={(v) => setForm((prev) => ({ ...prev, codigo_peca: v }))}
            />
            {(filtrosEquipamento || []).length > 0 ? (
              <View style={styles.sugestoesFiltro}>
                <Text style={[styles.sugestoesLabel, { color: cores.textoSecundario }]}>
                  Sugerir código do filtro cadastrado:
                </Text>
                <View style={styles.chipsRow}>
                  {(filtrosEquipamento || []).map((filtro) => (
                    <TouchableOpacity
                      key={filtro.id}
                      style={[styles.chip, { borderColor: cores.primario, backgroundColor: cores.primarioFundo }]}
                      onPress={() => aplicarFiltroCadastrado(filtro)}
                    >
                      <Text style={[styles.chipTexto, { color: cores.primario }]}>
                        {rotuloTipoFiltro(filtro.tipo_filtro)} — {filtro.numero_peca}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            <TextInput
              style={inputStyle}
              placeholder="Quantidade"
              placeholderTextColor={cores.placeholder}
              value={form.quantidade}
              onChangeText={(v) => setForm((prev) => ({ ...prev, quantidade: v }))}
              keyboardType="numeric"
            />
            <TextInput
              style={inputStyle}
              placeholder="Observação"
              placeholderTextColor={cores.placeholder}
              value={form.observacao}
              onChangeText={(v) => setForm((prev) => ({ ...prev, observacao: v }))}
            />

            <Text style={[styles.campoLabel, { color: cores.texto }]}>Próxima troca prevista (opcional)</Text>
            <DatePickerCampo
              value={form.proxima_troca_prevista}
              onChange={(v) => setForm((prev) => ({ ...prev, proxima_troca_prevista: v }))}
              placeholder="Escolher data"
            />

            <Text style={[styles.campoLabel, { color: cores.texto }]}>Foto (opcional)</Text>
            <View style={styles.fotoBotoesRow}>
              <TouchableOpacity
                style={[styles.fotoBotao, styles.fotoBotaoCamera, { borderColor: cores.primario, backgroundColor: cores.primario }]}
                onPress={tirarFoto}
                disabled={uploadingFoto}
              >
                <Text style={styles.fotoBotaoTextoCamera}>
                  {uploadingFoto ? 'Enviando...' : '📷 Tirar foto'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fotoBotao, { borderColor: cores.primario }]}
                onPress={escolherGaleria}
                disabled={uploadingFoto}
              >
                <Text style={[styles.fotoBotaoTexto, { color: cores.primario }]}>🖼 Galeria</Text>
              </TouchableOpacity>
            </View>
            {(form.fotosPendentes || []).length > 0 ? (
              <View style={styles.fotosPendentesRow}>
                {(form.fotosPendentes || []).map((uri, idx) => (
                  <View key={`${uri}-${idx}`} style={styles.fotoPendenteWrap}>
                    <Image source={{ uri }} style={styles.fotoPendenteThumb} />
                    <TouchableOpacity style={styles.fotoRemover} onPress={() => removerFotoPendente(idx)}>
                      <Text style={styles.fotoRemoverTexto}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            {pendenciasAbertas.length > 0 ? (
              <>
                <Text style={[styles.vinculoLabel, { color: cores.texto }]}>Vincular à pendência (opcional)</Text>
                {pendenciasAbertas.map((pend) => (
                  <TouchableOpacity
                    key={pend.id}
                    style={[
                      styles.pendenciaOpcao,
                      {
                        borderColor: cores.borda,
                        backgroundColor: form.pendencia_id === pend.id ? cores.primarioFundo : cores.fundoCard,
                      },
                    ]}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        pendencia_id: prev.pendencia_id === pend.id ? null : pend.id,
                        peca: prev.peca || pend.item_solicitado,
                      }))
                    }
                  >
                    <Text style={{ color: cores.texto, fontSize: 13 }}>{pend.item_solicitado}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
            <View style={styles.botoesForm}>
              <Button
                title={salvando ? 'Salvando...' : 'Registrar peça'}
                onPress={salvarPeca}
                disabled={salvando || uploadingFoto}
              />
              <TouchableOpacity
                onPress={() => {
                  setForm(FORM_VAZIO);
                  setMostrarForm(false);
                }}
                style={styles.cancelar}
              >
                <Text style={{ color: cores.textoSecundario }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.botaoAdicionar, { borderColor: cores.primario }]}
            onPress={() => {
              setForm(FORM_VAZIO);
              setMostrarForm(true);
            }}
          >
            <Text style={[styles.botaoAdicionarTexto, { color: cores.primario }]}>+ Registrar peça trocada</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  titulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  subtitulo: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  vazio: { fontSize: 13, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  cardHistorico: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6, borderStyle: 'dashed' },
  pecaNome: { fontWeight: '700', fontSize: 14 },
  pecaCodigo: { fontSize: 12, marginTop: 2 },
  pecaDetalhe: { fontSize: 12, marginTop: 4 },
  pecaObs: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  form: { marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  campoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  sugestoesFiltro: { marginBottom: 8 },
  sugestoesLabel: { fontSize: 12, marginBottom: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipTexto: { fontSize: 11, fontWeight: '600' },
  vinculoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  pendenciaOpcao: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6 },
  fotoBotoesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  fotoBotao: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fotoBotaoCamera: {},
  fotoBotaoTexto: { fontWeight: '600' },
  fotoBotaoTextoCamera: { color: '#fff', fontWeight: '600' },
  fotosPendentesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  fotoPendenteWrap: { position: 'relative' },
  fotoPendenteThumb: { width: 64, height: 64, borderRadius: 6 },
  fotoRemover: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e53935',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoRemoverTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  botoesForm: { marginTop: 4 },
  cancelar: { alignItems: 'center', padding: 8 },
  botaoAdicionar: { borderWidth: 1, borderRadius: 8, borderStyle: 'dashed', padding: 10, alignItems: 'center', marginTop: 4 },
  botaoAdicionarTexto: { fontWeight: '600' },
});
