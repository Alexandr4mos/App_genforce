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
import { BRAND } from '../lib/brand';

const FOTO_CAPA = require('../assets-login/foto-geradores-capa.jpg');
const LOGO = require('../assets-login/genforce-logo-manutencoes-branca.png');

const OVERLAY_TOP = 0.85;
const OVERLAY_BOTTOM = 0.45;
const OVERLAY_RGB = '11,13,18';

const GRADIENTE_WEB = `linear-gradient(180deg, rgba(${OVERLAY_RGB},${OVERLAY_TOP}) 0%, rgba(${OVERLAY_RGB},0.68) 42%, rgba(${OVERLAY_RGB},${OVERLAY_BOTTOM}) 100%)`;
const GRADIENTE_FATIAS = 48;

function opacidadeGradiente(t) {
  return OVERLAY_TOP + (OVERLAY_BOTTOM - OVERLAY_TOP) * t;
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
                backgroundColor: `rgba(${OVERLAY_RGB},${opacidadeGradiente(t)})`,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * @param {boolean} logoVisivel — controlado pela splash (opacity 0 até pousar)
 * @param {boolean} revelarFormulario — dispara fade-in escalonado dos campos
 * @param {(box:{x,y,width,height})=>void} onLogoMedida — measureInWindow da logo
 */
export default function Login({
  usuario,
  password,
  onUsuario,
  onPassword,
  onEntrar,
  loading,
  errorMsg,
  logoVisivel = true,
  revelarFormulario = true,
  onLogoMedida,
}) {
  const zoom = useRef(new Animated.Value(1.06)).current;
  const logoRef = useRef(null);
  const usaDriver = Platform.OS !== 'web';

  const fadeUsuario = useRef(new Animated.Value(revelarFormulario ? 1 : 0)).current;
  const fadeSenha = useRef(new Animated.Value(revelarFormulario ? 1 : 0)).current;
  const fadeBotao = useRef(new Animated.Value(revelarFormulario ? 1 : 0)).current;
  const fadeAviso = useRef(new Animated.Value(revelarFormulario ? 1 : 0)).current;
  const slideUsuario = useRef(new Animated.Value(revelarFormulario ? 0 : 12)).current;
  const slideSenha = useRef(new Animated.Value(revelarFormulario ? 0 : 12)).current;
  const slideBotao = useRef(new Animated.Value(revelarFormulario ? 0 : 12)).current;
  const slideAviso = useRef(new Animated.Value(revelarFormulario ? 0 : 12)).current;

  useEffect(() => {
    Animated.timing(zoom, {
      toValue: 1.14,
      duration: 16000,
      useNativeDriver: usaDriver,
    }).start();
  }, [zoom, usaDriver]);

  useEffect(() => {
    if (!revelarFormulario) return;
    const dur = 280;
    const gap = 60;
    const mk = (op, sl, delay) =>
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: dur, delay, useNativeDriver: usaDriver }),
        Animated.timing(sl, { toValue: 0, duration: dur, delay, useNativeDriver: usaDriver }),
      ]);
    Animated.parallel([
      mk(fadeUsuario, slideUsuario, 0),
      mk(fadeSenha, slideSenha, gap),
      mk(fadeBotao, slideBotao, gap * 2),
      mk(fadeAviso, slideAviso, gap * 3),
    ]).start();
  }, [revelarFormulario, usaDriver, fadeUsuario, fadeSenha, fadeBotao, fadeAviso, slideUsuario, slideSenha, slideBotao, slideAviso]);

  function reportarMedida() {
    if (!onLogoMedida || !logoRef.current?.measureInWindow) return;
    logoRef.current.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onLogoMedida({ x, y, width, height });
    });
  }

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

      <View style={styles.conteudo}>
        <View style={styles.logoWrap}>
          <Image
            ref={logoRef}
            collapsable={false}
            source={LOGO}
            style={[styles.logoImg, { opacity: logoVisivel ? 1 : 0 }]}
            resizeMode="contain"
            onLayout={reportarMedida}
            onLoad={reportarMedida}
          />
        </View>

        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: fadeUsuario, transform: [{ translateY: slideUsuario }] }}>
          <TextInput
            style={styles.pilula}
            placeholder="Usuário"
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            value={usuario}
            onChangeText={onUsuario}
          />
        </Animated.View>
        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: fadeSenha, transform: [{ translateY: slideSenha }] }}>
          <TextInput
            style={styles.pilula}
            placeholder="Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={onPassword}
          />
        </Animated.View>

        {errorMsg ? <Text style={styles.erro}>{errorMsg}</Text> : null}

        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: fadeBotao, transform: [{ translateY: slideBotao }] }}>
          <TouchableOpacity
            style={[styles.botaoEntrar, { backgroundColor: BRAND.destaque }]}
            onPress={onEntrar}
            disabled={loading}
          >
            <Text style={styles.botaoEntrarTexto}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAviso, transform: [{ translateY: slideAviso }] }}>
          <Text style={styles.temaAviso}>Genforce Engenharia</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: BRAND.fundo, overflow: 'hidden' },
  fundoWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: BRAND.fundo,
  },
  fundo: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '120%',
    height: '120%',
    ...(Platform.OS === 'web'
      ? { objectFit: 'cover', objectPosition: 'center center' }
      : null),
  },
  gradienteWrap: { ...StyleSheet.absoluteFillObject },
  gradienteWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: GRADIENTE_WEB,
  },
  gradienteFatia: { position: 'absolute', left: 0, right: 0 },
  conteudo: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    alignItems: 'center',
    zIndex: 1,
  },
  logoWrap: {
    marginBottom: 36,
    alignItems: 'center',
    width: 280,
    maxWidth: '100%',
    backgroundColor: 'transparent',
  },
  logoImg: {
    width: 244,
    height: 122,
    ...(Platform.OS === 'web'
      ? { filter: 'drop-shadow(0 0 14px rgba(11,13,18,0.60))' }
      : {
          shadowColor: BRAND.fundo,
          shadowOpacity: 0.6,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        }),
  },
  pilula: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    fontSize: 16,
    color: '#111',
    marginBottom: 12,
  },
  erro: { color: '#ffb4b4', marginBottom: 10, textAlign: 'center' },
  botaoEntrar: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  botaoEntrarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  temaAviso: {
    marginTop: 18,
    fontSize: 12,
    color: BRAND.branco,
    opacity: 0.95,
    textShadowColor: 'rgba(11,13,18,0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
