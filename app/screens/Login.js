import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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

/** Alinhado à splash: campos a partir de ~60% do progress; ~200ms / gap ~50ms */
const CAMPOS_INICIO = 0.6;
const CAMPOS_DUR = 200 / 550;
const CAMPOS_GAP = 50 / 550;
const T_SOMBRA = 150;

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

function interpolarCampo(progresso, indice, tipo) {
  const start = CAMPOS_INICIO + indice * CAMPOS_GAP;
  const end = Math.min(1, start + CAMPOS_DUR);
  if (tipo === 'opacidade') {
    return progresso.interpolate({
      inputRange: [0, start, end, 1],
      outputRange: [0, 0, 1, 1],
      extrapolate: 'clamp',
    });
  }
  return progresso.interpolate({
    inputRange: [0, start, end, 1],
    outputRange: [12, 12, 0, 0],
    extrapolate: 'clamp',
  });
}

/**
 * @param {boolean} logoVisivel — opacity 0 até a splash pousar
 * @param {boolean} revelarFormulario — skip/fim: campos em 1
 * @param {Animated.Value} [progressoVoo] — 0→1 da splash (sem setState na subida)
 * @param {(box:{x,y,width,height})=>void} onLogoMedida
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
  progressoVoo,
  onLogoMedida,
}) {
  const zoom = useRef(new Animated.Value(1.06)).current;
  const logoRef = useRef(null);
  const sombraOp = useRef(new Animated.Value(0)).current;
  const [sombraWeb, setSombraWeb] = useState(false);
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
    try {
      const uri = Image.resolveAssetSource?.(FOTO_CAPA)?.uri;
      if (!uri) return;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const img = new window.Image();
        img.src = uri;
        img.decode?.().catch(() => {});
      } else {
        Image.prefetch(uri);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    Animated.timing(zoom, {
      toValue: 1.14,
      duration: 16000,
      useNativeDriver: usaDriver,
    }).start();
  }, [zoom, usaDriver]);

  // Sombra só após o pouso (~150ms), sem filtro durante o voo da splash
  useEffect(() => {
    if (!logoVisivel) {
      sombraOp.setValue(0);
      setSombraWeb(false);
      return;
    }
    if (Platform.OS === 'web') {
      const t = setTimeout(() => setSombraWeb(true), 16);
      return () => clearTimeout(t);
    }
    Animated.timing(sombraOp, {
      toValue: 1,
      duration: T_SOMBRA,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [logoVisivel, sombraOp]);

  useEffect(() => {
    if (!revelarFormulario) return;
    fadeUsuario.setValue(1);
    fadeSenha.setValue(1);
    fadeBotao.setValue(1);
    fadeAviso.setValue(1);
    slideUsuario.setValue(0);
    slideSenha.setValue(0);
    slideBotao.setValue(0);
    slideAviso.setValue(0);
  }, [
    revelarFormulario,
    fadeUsuario,
    fadeSenha,
    fadeBotao,
    fadeAviso,
    slideUsuario,
    slideSenha,
    slideBotao,
    slideAviso,
  ]);

  function reportarMedida() {
    if (!onLogoMedida || !logoRef.current?.measureInWindow) return;
    logoRef.current.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onLogoMedida({ x, y, width, height });
    });
  }

  const usarProgress = Boolean(progressoVoo);

  const opUsuario = usarProgress ? interpolarCampo(progressoVoo, 0, 'opacidade') : fadeUsuario;
  const opSenha = usarProgress ? interpolarCampo(progressoVoo, 1, 'opacidade') : fadeSenha;
  const opBotao = usarProgress ? interpolarCampo(progressoVoo, 2, 'opacidade') : fadeBotao;
  const opAviso = usarProgress ? interpolarCampo(progressoVoo, 3, 'opacidade') : fadeAviso;
  const yUsuario = usarProgress ? interpolarCampo(progressoVoo, 0, 'slide') : slideUsuario;
  const ySenha = usarProgress ? interpolarCampo(progressoVoo, 1, 'slide') : slideSenha;
  const yBotao = usarProgress ? interpolarCampo(progressoVoo, 2, 'slide') : slideBotao;
  const yAviso = usarProgress ? interpolarCampo(progressoVoo, 3, 'slide') : slideAviso;

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
          <Animated.View
            style={
              Platform.OS !== 'web'
                ? {
                    shadowColor: BRAND.fundo,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: sombraOp.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.6],
                    }),
                  }
                : null
            }
          >
            <Image
              ref={logoRef}
              collapsable={false}
              source={LOGO}
              style={[
                styles.logoImg,
                { opacity: logoVisivel ? 1 : 0 },
                Platform.OS === 'web'
                  ? {
                      // @ts-ignore web-only
                      filter: sombraWeb ? 'drop-shadow(0 0 14px rgba(11,13,18,0.60))' : 'none',
                      // @ts-ignore web-only
                      transition: `filter ${T_SOMBRA}ms ease-out`,
                    }
                  : null,
              ]}
              resizeMode="contain"
              onLayout={reportarMedida}
              onLoad={reportarMedida}
            />
          </Animated.View>
        </View>

        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: opUsuario, transform: [{ translateY: yUsuario }] }}>
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
        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: opSenha, transform: [{ translateY: ySenha }] }}>
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

        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: opBotao, transform: [{ translateY: yBotao }] }}>
          <TouchableOpacity
            style={[styles.botaoEntrar, { backgroundColor: BRAND.destaque }]}
            onPress={onEntrar}
            disabled={loading}
          >
            <Text style={styles.botaoEntrarTexto}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: opAviso, transform: [{ translateY: yAviso }] }}>
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
