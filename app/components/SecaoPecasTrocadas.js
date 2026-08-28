import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';
import { rotuloTipoFiltro } from '../lib/constantes';

function formatarDataHora(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  const [form, setForm] = useState({
    peca: '',
    codigo_peca: '',
    quantidade: '1',
    observacao: '',
    pendencia_id: null,
  });

  const inputStyle = [
    styles.input,
    { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundo },
  ];

  const pendenciasAbertas = (pendencias || []).filter((p) => p.status !== 'resolvida');

  useEffect(() => {
    if (preenchimentoInicial) {
      setForm({
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
        tecnico_id: userId,
      })
      .select('*')
      .single();
    setSalvando(false);

    if (error) {
      avisar(error.message, 'Erro ao registrar peça');
      return;
    }

    onPecaRegistrada(data);
    setForm({ peca: '', codigo_peca: '', quantidade: '1', observacao: '', pendencia_id: null });
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
              <Button title={salvando ? 'Salvando...' : 'Registrar peça'} onPress={salvarPeca} disabled={salvando} />
              <TouchableOpacity onPress={() => setMostrarForm(false)} style={styles.cancelar}>
                <Text style={{ color: cores.textoSecundario }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.botaoAdicionar, { borderColor: cores.primario }]}
            onPress={() => {
              setForm({ peca: '', codigo_peca: '', quantidade: '1', observacao: '', pendencia_id: null });
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
  sugestoesFiltro: { marginBottom: 8 },
  sugestoesLabel: { fontSize: 12, marginBottom: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipTexto: { fontSize: 11, fontWeight: '600' },
  vinculoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  pendenciaOpcao: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6 },
  botoesForm: { marginTop: 4 },
  cancelar: { alignItems: 'center', padding: 8 },
  botaoAdicionar: { borderWidth: 1, borderRadius: 8, borderStyle: 'dashed', padding: 10, alignItems: 'center', marginTop: 4 },
  botaoAdicionarTexto: { fontWeight: '600' },
});
