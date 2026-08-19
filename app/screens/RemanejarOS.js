import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Button,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';

function isoParaBr(valor) {
  if (!valor) return '';
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function brParaIso(valor) {
  const partes = valor.trim().split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  if (!dia || !mes || !ano || ano.length !== 4) return null;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

export default function RemanejarOS({ osId, onBack, onSalvo }) {
  const { cores } = useTema();
  const [dataPrevista, setDataPrevista] = useState('');
  const [marcarAgendado, setMarcarAgendado] = useState(true);
  const [numero, setNumero] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, [osId]);

  async function carregar() {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('numero, data_inicio_prevista, status')
      .eq('id', osId)
      .single();

    if (error || !data) {
      avisar(error?.message || 'Não foi possível carregar esta OS.', 'Erro');
      return;
    }

    setNumero(data.numero);
    setDataPrevista(isoParaBr(data.data_inicio_prevista));
    setMarcarAgendado(data.status !== 'concluida');
  }

  async function salvar() {
    const iso = brParaIso(dataPrevista);
    if (!iso) {
      avisar('Informe a nova data no formato DD/MM/AAAA.', 'Data inválida');
      return;
    }

    setSalvando(true);
    const payload = { data_inicio_prevista: iso };
    if (marcarAgendado) payload.status = 'agendado';

    const { error } = await supabase.from('ordens_servico').update(payload).eq('id', osId);
    setSalvando(false);

    if (error) {
      avisar(error.message || 'Tente novamente.', 'Erro ao remanejar');
      return;
    }

    onSalvo();
  }

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>
        Remanejar OS{numero ? ` #${numero}` : ''}
      </Text>
      <Text style={[styles.texto, { color: cores.textoSecundario }]}>
        Só a data prevista é alterada. A OS não é excluída nem recriada.
      </Text>

      <Text style={[styles.label, { color: cores.texto }]}>Nova data</Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
        ]}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={cores.placeholder}
        value={dataPrevista}
        onChangeText={setDataPrevista}
      />

      <TouchableOpacity style={styles.checkLinha} onPress={() => setMarcarAgendado((v) => !v)}>
        <View
          style={[
            styles.checkbox,
            { borderColor: cores.bordaInput },
            marcarAgendado && { backgroundColor: cores.primario, borderColor: cores.primario },
          ]}
        >
          {marcarAgendado ? <Text style={styles.checkboxMarca}>✓</Text> : null}
        </View>
        <Text style={[styles.checkTexto, { color: cores.texto }]}>Marcar status como Agendado</Text>
      </TouchableOpacity>

      <Button title={salvando ? 'Salvando...' : 'Salvar nova data'} onPress={salvar} disabled={salvando} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  texto: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 16 },
  checkLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarca: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  checkTexto: { fontSize: 14 },
});
