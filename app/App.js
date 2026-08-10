import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from './lib/supabase';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';

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

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ordens, setOrdens] = useState([]);
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [criandoOS, setCriandoOS] = useState(false);
  const [osEditandoId, setOsEditandoId] = useState(null);
  const [menuAbertoId, setMenuAbertoId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchOrdens();
  }, [session]);

  async function fetchOrdens() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id, numero, tipo, status, descricao, checkin_em, checkout_em, clientes(nome)')
      .order('criado_em', { ascending: false });

    if (error) setErrorMsg(error.message);
    else setOrdens(data);
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setOrdens([]);
    setOsSelecionadaId(null);
  }

  async function excluirOSDaLista(osId) {
    const confirmado = await confirmarAcao(
      'Tem certeza que deseja excluir esta OS? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;

    await supabase.from('pendencias').update({ os_origem_id: null }).eq('os_origem_id', osId);
    await supabase.from('pendencias').update({ os_baixa_id: null }).eq('os_baixa_id', osId);

    const { error } = await supabase.from('ordens_servico').delete().eq('id', osId);

    if (error) {
      console.log(error);
      avisar(error.message || 'Tente novamente.', 'Erro ao excluir');
      return;
    }

    fetchOrdens();
  }

  function corDoCard(item) {
    if (item.checkout_em) return '#4caf50'; // verde: concluída
    if (item.checkin_em) return '#ffb300'; // amarelo: em andamento
    return '#e53935'; // vermelho: não iniciada
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Genforce — Login</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <Button title={loading ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={loading} />
      </View>
    );
  }

  if (osSelecionadaId) {
    return (
      <OSDetail
        osId={osSelecionadaId}
        userId={session.user.id}
        onBack={() => setOsSelecionadaId(null)}
      />
    );
  }

  if (criandoOS) {
    return (
      <NovaOS
        onBack={() => setCriandoOS(false)}
        onCriada={() => {
          setCriandoOS(false);
          fetchOrdens();
        }}
      />
    );
  }

  if (osEditandoId) {
    return (
      <EditarOS
        osId={osEditandoId}
        onBack={() => setOsEditandoId(null)}
        onSalva={() => {
          setOsEditandoId(null);
          fetchOrdens();
        }}
        onExcluida={() => {
          setOsEditandoId(null);
          fetchOrdens();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordens de Serviço</Text>
      {loading ? <ActivityIndicator /> : null}
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <TouchableOpacity style={styles.novaOsBotao} onPress={() => setCriandoOS(true)}>
        <Text style={styles.novaOsBotaoTexto}>+ Nova OS</Text>
      </TouchableOpacity>

      <View style={styles.legendaCoresRow}>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaBolinha, { backgroundColor: '#e53935' }]} />
          <Text style={styles.legendaTexto}>Não iniciada</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaBolinha, { backgroundColor: '#ffb300' }]} />
          <Text style={styles.legendaTexto}>Em andamento</Text>
        </View>
        <View style={styles.legendaItem}>
          <View style={[styles.legendaBolinha, { backgroundColor: '#4caf50' }]} />
          <Text style={styles.legendaTexto}>Concluída</Text>
        </View>
      </View>

      <FlatList
        data={ordens}
        keyExtractor={(item) => String(item.numero)}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: corDoCard(item) }]}>
            <View style={styles.cardHeaderRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setOsSelecionadaId(item.id)}>
                <Text style={styles.cardTitle}>
                  #{item.numero} — {item.status}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBotao}
                onPress={() => setMenuAbertoId(menuAbertoId === item.id ? null : item.id)}
              >
                <Text style={styles.menuBotaoTexto}>⋮</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setOsSelecionadaId(item.id)}>
              <Text style={styles.cardCliente}>{item.clientes?.nome}</Text>
              <Text>{item.tipo}</Text>
              <Text>{item.descricao}</Text>
            </TouchableOpacity>

            {menuAbertoId === item.id ? (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuOpcao}
                  onPress={() => {
                    setMenuAbertoId(null);
                    setOsEditandoId(item.id);
                  }}
                >
                  <Text style={styles.menuOpcaoTexto}>✎ Editar OS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuOpcao}
                  onPress={() => {
                    setMenuAbertoId(null);
                    excluirOSDaLista(item.id);
                  }}
                >
                  <Text style={[styles.menuOpcaoTexto, styles.menuOpcaoExcluirTexto]}>🗑 Excluir OS</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text>Nenhuma OS cadastrada ainda.</Text>}
      />
      <Button title="Sair" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'red', marginBottom: 12 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', marginBottom: 4 },
  cardCliente: { fontWeight: '600', color: '#007AFF', marginBottom: 2 },
  menuBotao: { paddingHorizontal: 10, paddingVertical: 4 },
  menuBotaoTexto: { fontSize: 20, color: '#666', fontWeight: 'bold' },
  menuDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuOpcao: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#f2f2f2' },
  menuOpcaoTexto: { color: '#333' },
  menuOpcaoExcluirTexto: { color: '#e53935' },
  novaOsBotao: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  novaOsBotaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  legendaCoresRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  legendaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 },
  legendaBolinha: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendaTexto: { fontSize: 12, color: '#666' },
});