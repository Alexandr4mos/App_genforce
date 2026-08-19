import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';
import { TemaProvider, useTema } from './lib/tema';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';
import ListaOS from './screens/ListaOS';
import Relatorio from './screens/Relatorio';
import ImportarClientes from './screens/ImportarClientes';

export default function App() {
  return (
    <TemaProvider>
      <AppInterno />
    </TemaProvider>
  );
}

function AppInterno() {
  const { cores, modoEscuro } = useTema();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [criandoOS, setCriandoOS] = useState(false);
  const [osEditandoId, setOsEditandoId] = useState(null);
  const [mostrandoRelatorio, setMostrandoRelatorio] = useState(false);
  const [mostrandoImportar, setMostrandoImportar] = useState(false);

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
    setMostrandoRelatorio(false);
    setMostrandoImportar(false);
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: cores.fundo }]}>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <Text style={[styles.title, { color: cores.texto }]}>Genforce — Login</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
          ]}
          placeholder="E-mail"
          placeholderTextColor={cores.placeholder}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
          ]}
          placeholder="Senha"
          placeholderTextColor={cores.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errorMsg ? <Text style={[styles.error, { color: cores.erro }]}>{errorMsg}</Text> : null}
        <Button title={loading ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={loading} />
      </View>
    );
  }

  if (osSelecionadaId) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <OSDetail
          osId={osSelecionadaId}
          userId={session.user.id}
          onBack={() => setOsSelecionadaId(null)}
        />
      </>
    );
  }

  if (criandoOS) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <NovaOS onBack={() => setCriandoOS(false)} onCriada={() => setCriandoOS(false)} />
      </>
    );
  }

  if (osEditandoId) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <EditarOS
          osId={osEditandoId}
          onBack={() => setOsEditandoId(null)}
          onSalva={() => setOsEditandoId(null)}
          onExcluida={() => setOsEditandoId(null)}
        />
      </>
    );
  }

  if (mostrandoRelatorio) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <Relatorio onBack={() => setMostrandoRelatorio(false)} />
      </>
    );
  }

  if (mostrandoImportar) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <ImportarClientes onBack={() => setMostrandoImportar(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={modoEscuro ? 'light' : 'dark'} />
      <ListaOS
        onAbrirOS={setOsSelecionadaId}
        onCriarOS={() => setCriandoOS(true)}
        onEditarOS={setOsEditandoId}
        onRelatorio={() => setMostrandoRelatorio(true)}
        onImportarClientes={() => setMostrandoImportar(true)}
        onSair={handleLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { marginBottom: 12 },
});
