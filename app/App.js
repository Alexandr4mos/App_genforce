import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';
import ListaOS from './screens/ListaOS';

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [criandoOS, setCriandoOS] = useState(false);
  const [osEditandoId, setOsEditandoId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setOsSelecionadaId(null);
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
        onCriada={() => setCriandoOS(false)}
      />
    );
  }

  if (osEditandoId) {
    return (
      <EditarOS
        osId={osEditandoId}
        onBack={() => setOsEditandoId(null)}
        onSalva={() => setOsEditandoId(null)}
        onExcluida={() => setOsEditandoId(null)}
      />
    );
  }

  return (
    <ListaOS
      onAbrirOS={setOsSelecionadaId}
      onCriarOS={() => setCriandoOS(true)}
      onEditarOS={setOsEditandoId}
      onSair={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'red', marginBottom: 12 },
});
