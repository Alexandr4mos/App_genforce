import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';
import { emailAuthDeLogin } from './lib/auth';
import { TemaProvider, useTema } from './lib/tema';
import { FiltroOSProvider, useFiltroOS } from './lib/filtroOS';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';
import ListaOS from './screens/ListaOS';
import Relatorio from './screens/Relatorio';
import Dashboard from './screens/Dashboard';
import EditarCliente from './screens/EditarCliente';
import ImportarClientes from './screens/ImportarClientes';
import Login from './screens/Login';
import RemanejarOS from './screens/RemanejarOS';
import GestaoUsuarios from './screens/GestaoUsuarios';

export default function App() {
  return (
    <TemaProvider>
      <FiltroOSProvider>
        <AppInterno />
      </FiltroOSProvider>
    </TemaProvider>
  );
}

function AppInterno() {
  const { modoEscuro } = useTema();
  const { resetFiltros } = useFiltroOS();
  const [session, setSession] = useState(null);
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [criandoOS, setCriandoOS] = useState(false);
  const [osEditandoId, setOsEditandoId] = useState(null);
  const [mostrandoRelatorio, setMostrandoRelatorio] = useState(false);
  const [mostrandoDashboard, setMostrandoDashboard] = useState(false);
  const [mostrandoEditarCliente, setMostrandoEditarCliente] = useState(false);
  const [mostrandoImportar, setMostrandoImportar] = useState(false);
  const [mostrandoGestaoUsuarios, setMostrandoGestaoUsuarios] = useState(false);
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
    const email = emailAuthDeLogin(usuarioLogin);
    if (!email) {
      setErrorMsg('Informe o usuário.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (perfilError) {
      await supabase.auth.signOut();
      setErrorMsg('Não foi possível verificar sua conta. Tente novamente.');
      setLoading(false);
      return;
    }

    if (perfil && perfil.ativo === false) {
      await supabase.auth.signOut();
      setErrorMsg('Esta conta está desativada. Entre em contato com um administrador.');
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setOsSelecionadaId(null);
    setMostrandoRelatorio(false);
    setMostrandoDashboard(false);
    setMostrandoEditarCliente(false);
    setMostrandoImportar(false);
    setMostrandoGestaoUsuarios(false);
    resetFiltros();
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <Login
          usuario={usuarioLogin}
          password={password}
          onUsuario={setUsuarioLogin}
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
        <Relatorio
          userId={session.user.id}
          onBack={() => setMostrandoRelatorio(false)}
          onAbrirOS={(id) => {
            setMostrandoRelatorio(false);
            setOsSelecionadaId(id);
          }}
        />
      </>
    );
  }

  if (mostrandoDashboard) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <Dashboard onBack={() => setMostrandoDashboard(false)} />
      </>
    );
  }

  if (mostrandoEditarCliente) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <EditarCliente onBack={() => setMostrandoEditarCliente(false)} />
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

  if (mostrandoGestaoUsuarios) {
    return (
      <>
        <StatusBar style={modoEscuro ? 'light' : 'dark'} />
        <GestaoUsuarios
          userId={session.user.id}
          onBack={() => setMostrandoGestaoUsuarios(false)}
        />
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
        userId={session.user.id}
        onAbrirOS={setOsSelecionadaId}
        onCriarOS={() => setCriandoOS(true)}
        onEditarOS={setOsEditandoId}
        onRemanejar={setOsRemanejandoId}
        onRelatorio={() => setMostrandoRelatorio(true)}
        onDashboard={() => setMostrandoDashboard(true)}
        onEditarCliente={() => setMostrandoEditarCliente(true)}
        onImportarClientes={() => setMostrandoImportar(true)}
        onGestaoUsuarios={() => setMostrandoGestaoUsuarios(true)}
        onSair={handleLogout}
      />
    </>
  );
}
