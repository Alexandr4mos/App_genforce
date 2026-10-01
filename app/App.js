import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';
import { emailAuthDeLogin, sairComRetry, ehPrivilegiado } from './lib/auth';
import { TemaProvider, useTema, aplicarChromeWeb } from './lib/tema';
import { BRAND } from './lib/brand';
import { FiltroOSProvider, useFiltroOS } from './lib/filtroOS';
import OSDetail from './screens/OSDetail';
import NovaOS from './screens/NovaOS';
import EditarOS from './screens/EditarOS';
import ListaOS from './screens/ListaOS';
import ListaDeOS from './screens/ListaDeOS';
import ListaDePecas from './screens/ListaDePecas';
import Dashboard from './screens/Dashboard';
import EditarCliente from './screens/EditarCliente';
import ImportarClientes from './screens/ImportarClientes';
import Login from './screens/Login';
import RemanejarOS from './screens/RemanejarOS';
import GestaoUsuarios from './screens/GestaoUsuarios';
import AppShell from './components/AppShell';
import AppHeader from './components/AppHeader';
import SplashAbertura from './components/SplashAbertura';
import FeedbackHost from './components/ui/FeedbackHost';

export default function App() {
  return (
    <TemaProvider>
      <FiltroOSProvider>
        <AppInterno />
        <FeedbackHost />
      </FiltroOSProvider>
    </TemaProvider>
  );
}

function AppInterno() {
  const { modoEscuro } = useTema();
  const { resetFiltros } = useFiltroOS();
  const headerRef = useRef(null);
  const [session, setSession] = useState(null);
  const [sessaoCarregada, setSessaoCarregada] = useState(false);
  const [splashVisivel, setSplashVisivel] = useState(true);
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [criandoOS, setCriandoOS] = useState(false);
  const [osEditandoId, setOsEditandoId] = useState(null);
  const [secao, setSecao] = useState('os');
  const [papel, setPapel] = useState(null);
  const [osRemanejandoId, setOsRemanejandoId] = useState(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(console.log)
      .finally(() => setSessaoCarregada(true));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setPapel(null);
      return;
    }
    supabase
      .from('usuarios')
      .select('papel')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setPapel(data?.papel || 'tecnico'));
  }, [session?.user?.id]);

  // Status bar / chrome alinhados ao header de marca (#0B0D12).
  useEffect(() => {
    aplicarChromeWeb(BRAND.fundo);
  }, [session, modoEscuro]);

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
      await sairComRetry(supabase.auth);
      setErrorMsg('Não foi possível verificar sua conta. Tente novamente.');
      setLoading(false);
      return;
    }

    if (perfil && perfil.ativo === false) {
      await sairComRetry(supabase.auth);
      setErrorMsg('Esta conta está desativada. Entre em contato com um administrador.');
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  async function handleLogout() {
    await sairComRetry(supabase.auth);
    setOsSelecionadaId(null);
    setCriandoOS(false);
    setOsEditandoId(null);
    setOsRemanejandoId(null);
    setSecao('os');
    resetFiltros();
  }

  /** Tela inicial = lista de OS (não é “voltar” do histórico). */
  function irParaInicio() {
    setOsSelecionadaId(null);
    setCriandoOS(false);
    setOsEditandoId(null);
    setOsRemanejandoId(null);
    setSecao('os');
  }

  let appPorBaixo;
  if (!session) {
    appPorBaixo = (
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
  } else {
    const privilegiado = ehPrivilegiado(papel);
    const navegar = (id) => () => {
      setOsSelecionadaId(null);
      setCriandoOS(false);
      setOsEditandoId(null);
      setOsRemanejandoId(null);
      setSecao(id);
    };
    const itensNav = [
      { id: 'os', rotulo: 'Ordens de Serviço', rotuloCurto: 'Ordens', icone: 'list', principal: true, onPress: navegar('os') },
      { id: 'painel', rotulo: 'Painel', icone: 'chart', principal: true, onPress: navegar('painel') },
      { id: 'relatorio', rotulo: 'Lista de OS', rotuloCurto: 'Lista', icone: 'file', principal: true, onPress: navegar('relatorio') },
      { id: 'pecas', rotulo: 'Lista de peças', icone: 'package', onPress: navegar('pecas') },
      { id: 'clientes', rotulo: 'Clientes', icone: 'building', onPress: navegar('clientes') },
      { id: 'importar', rotulo: 'Importar clientes', icone: 'upload', onPress: navegar('importar') },
      ...(privilegiado
        ? [{ id: 'usuarios', rotulo: 'Gestão de usuários', icone: 'users', onPress: navegar('usuarios') }]
        : []),
    ];

    let corpo;
    if (osSelecionadaId) {
      corpo = (
        <OSDetail
          osId={osSelecionadaId}
          userId={session.user.id}
          onBack={() => setOsSelecionadaId(null)}
        />
      );
    } else if (criandoOS) {
      corpo = <NovaOS onBack={() => setCriandoOS(false)} onCriada={() => setCriandoOS(false)} />;
    } else if (osEditandoId) {
      corpo = (
        <EditarOS
          osId={osEditandoId}
          onBack={() => setOsEditandoId(null)}
          onSalva={() => setOsEditandoId(null)}
          onExcluida={() => setOsEditandoId(null)}
        />
      );
    } else if (osRemanejandoId) {
      corpo = (
        <RemanejarOS
          osId={osRemanejandoId}
          onBack={() => setOsRemanejandoId(null)}
          onSalvo={() => setOsRemanejandoId(null)}
        />
      );
    } else {
      let conteudo;
      if (secao === 'relatorio') {
        conteudo = (
          <ListaDeOS
            userId={session.user.id}
            onBack={() => setSecao('os')}
            onAbrirOS={setOsSelecionadaId}
            onEditarOS={setOsEditandoId}
            onRemanejar={setOsRemanejandoId}
          />
        );
      } else if (secao === 'pecas') {
        conteudo = <ListaDePecas onBack={() => setSecao('os')} />;
      } else if (secao === 'painel') {
        conteudo = <Dashboard onAbrirOS={setOsSelecionadaId} />;
      } else if (secao === 'clientes') {
        conteudo = <EditarCliente onBack={() => setSecao('os')} />;
      } else if (secao === 'importar') {
        conteudo = <ImportarClientes onBack={() => setSecao('os')} />;
      } else if (secao === 'usuarios' && privilegiado) {
        conteudo = <GestaoUsuarios userId={session.user.id} onBack={() => setSecao('os')} />;
      } else {
        conteudo = (
          <ListaOS
            userId={session.user.id}
            onAbrirOS={setOsSelecionadaId}
            onCriarOS={() => setCriandoOS(true)}
            onEditarOS={setOsEditandoId}
            onRemanejar={setOsRemanejandoId}
          />
        );
      }
      corpo = (
        <AppShell itens={itensNav} secaoAtiva={secao} onSair={handleLogout}>
          {conteudo}
        </AppShell>
      );
    }

    appPorBaixo = (
      <>
        <StatusBar style="light" />
        <View style={styles.raiz}>
          <AppHeader ref={headerRef} onPressLogo={irParaInicio} />
          <View style={styles.corpo}>{corpo}</View>
        </View>
      </>
    );
  }

  return (
    <View style={styles.raiz}>
      {appPorBaixo}
      {splashVisivel ? (
        <SplashAbertura sessaoPronta={sessaoCarregada} onConcluir={() => setSplashVisivel(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  corpo: { flex: 1, minHeight: 0 },
});
