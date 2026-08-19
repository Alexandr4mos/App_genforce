import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTema } from '../lib/tema';

const FOTO_CAPA = require('../assets-login/foto-geradores-capa.jpg');
const LOGO = require('../assets-login/genforce-logo-transparente.png');

export default function Login({
  email,
  password,
  onEmail,
  onPassword,
  onEntrar,
  loading,
  errorMsg,
}) {
  const { cores, modoEscuro } = useTema();
  const zoom = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(36)).current;
  const brilho = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.timing(zoom, {
      toValue: 1.12,
      duration: 16000,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.delay(2600),
        Animated.timing(brilho, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [brilho, fade, slide, zoom]);

  const brilhoX = brilho.interpolate({
    inputRange: [-1, 1],
    outputRange: [-90, 250],
  });

  return (
    <View style={styles.tela}>
      <Animated.Image
        source={FOTO_CAPA}
        style={[styles.fundo, { transform: [{ scale: zoom }] }]}
        resizeMode="cover"
      />

      <View pointerEvents="none" style={styles.gradienteWrap}>
        <View style={[styles.gradienteFaixa, { bottom: '42%', opacity: 0.12 }]} />
        <View style={[styles.gradienteFaixa, { bottom: 0, height: '55%', opacity: 0.28 }]} />
        <View style={[styles.gradienteFaixa, { bottom: 0, height: '38%', opacity: 0.42 }]} />
        <View style={[styles.gradienteFaixa, { bottom: 0, height: '22%', opacity: 0.55 }]} />
      </View>

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
          <Animated.View
            pointerEvents="none"
            style={[styles.brilho, { transform: [{ translateX: brilhoX }, { rotate: '18deg' }] }]}
          />
        </View>

        <TextInput
          style={styles.pilula}
          placeholder="Login"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={email}
          onChangeText={onEmail}
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
  fundo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradienteWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  gradienteFaixa: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: '#000',
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
  brilho: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.28)',
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
