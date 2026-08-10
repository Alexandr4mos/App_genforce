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
  ActivityIndicator,
} from 'react-native';
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

const TIPOS_OS = [
  { valor: 'preventiva', rotulo: 'Preventiva' },
  { valor: 'corretiva', rotulo: 'Corretiva' },
  { valor: 'visita_tecnica', rotulo: 'Visita Técnica' },
];

const STATUS_OS = [
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'andamento', rotulo: 'Andamento' },
  { valor: 'pausada', rotulo: 'Pausada' },
  { valor: 'concluida', rotulo: 'Concluída' },
];

export default function EditarOS({ osId, onBack, onSalva, onExcluida }) {
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('preventiva');
  const [status, setStatus] = useState('pendente');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregar();
  }, [osId]);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('tipo, status, descricao')
      .eq('id', osId)
      .single();

    if (!error && data) {
      setTipo(data.tipo || 'preventiva');
      setStatus(data.status || 'pendente');
      setDescricao(data.descricao || '');
    }
    setLoading(false);
  }

  async function salvar() {
    setSalvando(true);
    const { error } = await supabase
      .from('ordens_servico')
      .update({ tipo, status, descricao: descricao.trim() || null })
      .eq('id', osId);
    setSalvando(false);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao salvar');
      return;
    }

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

      <Text style={styles.title}>Editar OS</Text>

      <Text style={styles.label}>Tipo de OS</Text>
      <View style={styles.tipoRow}>
        {TIPOS_OS.map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[styles.tipoButton, tipo === t.valor && styles.tipoButtonSelecionado]}
            onPress={() => setTipo(t.valor)}
          >
            <Text style={tipo === t.valor ? styles.tipoTextoSelecionado : styles.tipoTexto}>
              {t.rotulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Status</Text>
      <View style={styles.tipoRow}>
        {STATUS_OS.map((s) => (
          <TouchableOpacity
            key={s.valor}
            style={[styles.tipoButton, status === s.valor && styles.tipoButtonSelecionado]}
            onPress={() => setStatus(s.valor)}
          >
            <Text style={status === s.valor ? styles.tipoTextoSelecionado : styles.tipoTexto}>
              {s.rotulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.descricaoInput]}
        placeholder="Descrição da OS..."
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />

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
  backText: { color: '#007AFF', fontSize: 16 },
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
  tipoButtonSelecionado: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tipoTexto: { color: '#333' },
  tipoTextoSelecionado: { color: '#fff', fontWeight: 'bold' },
  excluirBotao: {
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  excluirBotaoTexto: { color: '#e53935', fontWeight: 'bold' },
});