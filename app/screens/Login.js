import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTema } from '../lib/tema';

const FOTO_CAPA = require('../assets-login/foto-geradores-capa.jpg');
const LOGO = require('../assets-login/genforce-logo-transparente.png');

const GRADIENTE_WEB =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0.32) 100%)';

const GRADIENTE_FATIAS = 48;
const GRADIENTE_MAX = 0.34;

function opacidadeGradiente(t) {
  return t * t * GRADIENTE_MAX;
}

function OverlayGradiente() {
  if (Platform.OS === 'web') {
    return <View style={styles.gradienteWeb} pointerEvents="none" />;
  }

  return (
    <View style={styles.gradienteWrap} pointerEvents="none">
      {Array.from({ length: GRADIENTE_FATIAS }, (_, i) => {
        const t = (i + 0.5) / GRADIENTE_FATIAS;
        return (
          <View
            key={i}
            style={[
              styles.gradienteFatia,
              {
                top: `${(i / GRADIENTE_FATIAS) * 100}%`,
                height: `${100 / GRADIENTE_FATIAS}%`,
                backgroundColor: `rgba(0,0,0,${opacidadeGradiente(t)})`,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function Login({
  usuario,
  password,
  onUsuario,
  onPassword,
  onEntrar,
  loading,
  errorMsg,
}) {
  const { cores, modoEscuro } = useTema();
  const zoom = useRef(new Animated.Value(1.06)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(36)).current;

  const usaDriverNativo = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(zoom, {
      toValue: 1.14,
      duration: 16000,
      useNativeDriver: usaDriverNativo,
    }).start();

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: usaDriverNativo }),
      Animated.timing(slide, { toValue: 0, duration: 900, useNativeDriver: usaDriverNativo }),
    ]).start();
  }, [fade, slide, zoom, usaDriverNativo]);

  return (
    <View style={styles.tela}>
      <View style={styles.fundoWrap}>
        <Animated.Image
          source={FOTO_CAPA}
          style={[styles.fundo, { transform: [{ scale: zoom }] }]}
          resizeMode="cover"
        />
      </View>

      <OverlayGradiente />

      <Animated.View
        style={[
          styles.conteudo,
          { opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <View style={styles.logoCaixa}>
          <View style={styles.logoClip}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.logoSub}>MANUTENÇÃO</Text>
        </View>

        <TextInput
          style={styles.pilula}
          placeholder="Usuário"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          value={usuario}
          onChangeText={onUsuario}
        />
        <TextInput
          style={styles.pilula}
          placeholder="Senha"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={onPassword}
        />

        {errorMsg ? <Text style={styles.erro}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.botaoEntrar, { backgroundColor: cores.primario }]}
          onPress={onEntrar}
          disabled={loading}
        >
          <Text style={styles.botaoEntrarTexto}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <Text style={[styles.temaAviso, { color: modoEscuro ? '#ddd' : '#fff' }]}>
          Genforce Engenharia
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  fundoWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  fundo: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '120%',
    height: '120%',
    ...(Platform.OS === 'web'
      ? {
          objectFit: 'cover',
          objectPosition: 'center center',
        }
      : null),
  },
  gradienteWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  gradienteWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: GRADIENTE_WEB,
  },
  gradienteFatia: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    alignItems: 'center',
  },
  logoCaixa: {
    backgroundColor: 'rgba(8,8,8,0.88)',
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 22,
    marginBottom: 36,
    overflow: 'hidden',
    alignItems: 'center',
    width: 280,
    maxWidth: '100%',
  },
  logoClip: {
    height: 52,
    width: 230,
    overflow: 'hidden',
    alignItems: 'center',
  },
  logoImg: { width: 230, height: 86, marginTop: -4 },
  logoSub: {
    marginTop: 6,
    color: '#3d6fd4',
    fontSize: 12,
    letterSpacing: 4.2,
    fontWeight: '600',
  },
  pilula: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    fontSize: 16,
    color: '#111',
    marginBottom: 12,
  },
  erro: {
    color: '#ffb4b4',
    marginBottom: 10,
    textAlign: 'center',
  },
  botaoEntrar: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  botaoEntrarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  temaAviso: { marginTop: 18, fontSize: 12, opacity: 0.85 },
});
