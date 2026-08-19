import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';
import { TemaProvider, useTema } from './lib/tema';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';
import ListaOS from './screens/ListaOS';
import Relatorio from './screens/Relatorio';
import ImportarClientes from './screens/ImportarClientes';
import Login from './screens/Login';
import RemanejarOS from './screens/RemanejarOS';

export default function App() {
  return (
    <TemaProvider>
      <AppInterno />
    </TemaProvider>
  );
}

function AppInterno() {
  const { modoEscuro } = useTema();
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
  const [osRemanejandoId, setOsRemanejandoId] = useState(null);

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
      <>
        <StatusBar style="light" />
        <Login
          email={email}
          password={password}
          onEmail={setEmail}
          onPassword={setPassword}
          onEntrar={handleLogin}
          loading={loading}
          errorMsg={errorMsg}
        />
      </>
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

  if (osRemanejandoId) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <RemanejarOS
          osId={osRemanejandoId}
          onBack={() => setOsRemanejandoId(null)}
          onSalvo={() => setOsRemanejandoId(null)}
        />
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
        onRemanejar={setOsRemanejandoId}
        onRelatorio={() => setMostrandoRelatorio(true)}
        onImportarClientes={() => setMostrandoImportar(true)}
        onSair={handleLogout}
      />
    </>
  );
}
