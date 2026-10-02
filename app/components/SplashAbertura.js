import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { BRAND } from '../lib/brand';

const ICONE = require('../assets-login/genforce-app-icon-source.jpg');
const LOGO = require('../assets-login/genforce-logo-manutencoes-branca.png');
const FOTO_CAPA = require('../assets-login/foto-geradores-capa.jpg');

const T_CRESCER = 400; // 0–0,4s
const T_TROCA = 200; // 0,4–0,6s
const T_HOLD = 60; // ≤60ms parada após a troca
const T_VOO = 550; // subida da logo
const T_FUNDO = 450; // fade do fundo #0B0D12
const T_FADE_FUNDO_APP = 350;

/** cubic-bezier(0.22, 1, 0.36, 1) — sai rápido, desacelera no pouso */
const EASE_VOO = Easing.bezier(0.22, 1, 0.36, 1);

/** Campos começam quando a logo passou ~60% do caminho (progress) */
const CAMPOS_INICIO = 0.6;
const CAMPOS_DUR = 200 / T_VOO; // ~0,364 do progress
const CAMPOS_GAP = 50 / T_VOO; // ~0,091

async function garantirFotoLoginPronta() {
  try {
    const resolved = Image.resolveAssetSource?.(FOTO_CAPA);
    const uri = resolved?.uri;
    if (!uri) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      await new Promise((resolve) => {
        const img = new window.Image();
        img.decoding = 'sync';
        const done = () => resolve();
        img.onerror = done;
        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(done).catch(done);
          } else {
            done();
          }
        };
        img.src = uri;
      });
      return;
    }

    await Image.prefetch(uri);
  } catch {
    // segue mesmo se o prefetch falhar
  }
}

/**
 * Splash de abertura.
 * - destinoLogin: voo da logo (transform) até o Login + campos sincronizados
 * - !destinoLogin (app): fade da splash revelando o app (header intacto)
 */
export default function SplashAbertura({
  sessaoPronta,
  destinoLogin,
  loginLogoBox,
  progressoVoo,
  onRevelarFormulario,
  onLogoPousou,
  onConcluir,
}) {
  const { width: W, height: H } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState(null);
  const [modoEspera, setModoEspera] = useState(false);
  /** Destino do voo (uma re-render só no início da subida) */
  const [vooDestino, setVooDestino] = useState(null);

  const concluiuRef = useRef(false);
  const passo2FeitoRef = useRef(false);
  const emVooRef = useRef(false);
  const sessaoRef = useRef(sessaoPronta);
  const destinoRef = useRef(destinoLogin);
  const boxRef = useRef(loginLogoBox);
  const pulsoLoopRef = useRef(null);
  const timersRef = useRef([]);
  const fotoProntaRef = useRef(null);

  const progressInterno = useRef(new Animated.Value(0)).current;
  const progress = progressoVoo || progressInterno;

  const opacidadeFundo = useRef(new Animated.Value(1)).current;
  const escalaIcone = useRef(new Animated.Value(0.4)).current;
  const opacidadeIcone = useRef(new Animated.Value(1)).current;
  const opacidadeLogo = useRef(new Animated.Value(0)).current;
  const escalaLogo = useRef(new Animated.Value(0.95)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  const usaDriver = Platform.OS !== 'web';
  const iconeFinal = Math.max(96, Math.round(W * 0.3));
  const raioIcone = iconeFinal * 0.22;
  const logoCentroW = Math.min(W * 0.6, 420);
  const logoCentroH = logoCentroW / 2;
  const logoCentroLeft = (W - logoCentroW) / 2;
  const logoCentroTop = (H - logoCentroH) / 2;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.getElementById('splash-boot')?.remove();
    }
    fotoProntaRef.current = garantirFotoLoginPronta();
  }, []);

  useEffect(() => {
    sessaoRef.current = sessaoPronta;
    destinoRef.current = destinoLogin;
    boxRef.current = loginLogoBox;
    if (passo2FeitoRef.current && sessaoPronta && modoEspera) {
      setModoEspera(false);
      pararPulso();
      brilho.setValue(0);
      iniciarPasso2();
    } else if (passo2FeitoRef.current && sessaoPronta && !modoEspera && !emVooRef.current) {
      tentarPasso4();
    }
  }, [sessaoPronta, destinoLogin, loginLogoBox, modoEspera]);

  useEffect(() => {
    let ativo = true;
    const aplicar = (v) => ativo && setReduzirMovimento(Boolean(v));
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(aplicar)
      .catch(() => aplicar(false));
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) aplicar(true);
      const onChange = (e) => aplicar(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => {
        ativo = false;
        mq.removeEventListener?.('change', onChange);
      };
    }
    const t = setTimeout(() => aplicar(false), 40);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, []);

  function limparTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  function agendar(fn, ms) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }

  function finalizar() {
    if (concluiuRef.current) return;
    concluiuRef.current = true;
    limparTimers();
    pararPulso();
    onConcluir?.();
  }

  function iniciarPulso() {
    pararPulso();
    brilho.setValue(0.2);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: usaDriver }),
        Animated.timing(brilho, { toValue: 0.15, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: usaDriver }),
      ])
    );
    pulsoLoopRef.current = loop;
    loop.start();
  }
  function pararPulso() {
    pulsoLoopRef.current?.stop();
    pulsoLoopRef.current = null;
  }

  function pular() {
    if (concluiuRef.current) return;
    limparTimers();
    escalaIcone.stopAnimation();
    opacidadeIcone.stopAnimation();
    opacidadeLogo.stopAnimation();
    opacidadeFundo.stopAnimation();
    progress.stopAnimation();
    progress.setValue(1);
    opacidadeFundo.setValue(0);
    onLogoPousou?.();
    onRevelarFormulario?.();
    opacidadeIcone.setValue(0);
    opacidadeLogo.setValue(0);
    finalizar();
  }

  function fadeSplashApp() {
    Animated.parallel([
      Animated.timing(opacidadeLogo, { toValue: 0, duration: 180, useNativeDriver: usaDriver }),
      Animated.timing(opacidadeFundo, { toValue: 0, duration: T_FADE_FUNDO_APP, useNativeDriver: usaDriver }),
    ]).start(({ finished }) => {
      if (finished) finalizar();
    });
  }

  function iniciarPasso2() {
    Animated.timing(opacidadeIcone, {
      toValue: 0,
      duration: T_TROCA / 2,
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;
      Animated.parallel([
        Animated.timing(opacidadeLogo, { toValue: 1, duration: T_TROCA / 2, useNativeDriver: usaDriver }),
        Animated.timing(escalaLogo, { toValue: 1, duration: T_TROCA / 2, easing: Easing.out(Easing.cubic), useNativeDriver: usaDriver }),
      ]).start(({ finished: ok }) => {
        if (!ok || concluiuRef.current) return;
        passo2FeitoRef.current = true;
        agendar(() => tentarPasso4(), T_HOLD);
      });
    });
  }

  async function tentarPasso4() {
    if (concluiuRef.current || emVooRef.current) return;
    if (!sessaoRef.current) return;

    if (!destinoRef.current) {
      fadeSplashApp();
      return;
    }

    const box = boxRef.current;
    if (!box || box.width <= 0) return;

    emVooRef.current = true;

    await (fotoProntaRef.current || garantirFotoLoginPronta());
    if (concluiuRef.current) return;

    const startCx = logoCentroLeft + logoCentroW / 2;
    const startCy = logoCentroTop + logoCentroH / 2;
    const endCx = box.x + box.width / 2;
    const endCy = box.y + box.height / 2;
    const scaleFinal = box.width / logoCentroW;

    // Uma re-render liga transforms ao progress; o timing roda no effect abaixo
    progress.setValue(0);
    setVooDestino({
      tx: endCx - startCx,
      ty: endCy - startCy,
      scale: scaleFinal,
    });
  }

  useEffect(() => {
    if (!vooDestino || concluiuRef.current) return;

    Animated.timing(progress, {
      toValue: 1,
      duration: T_VOO,
      easing: EASE_VOO,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;
      onLogoPousou?.();
      requestAnimationFrame(() => {
        if (concluiuRef.current) return;
        opacidadeLogo.setValue(0);
        finalizar();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vooDestino]);

  useEffect(() => {
    if (reduzirMovimento === null) return;
    if (reduzirMovimento) {
      pular();
      return;
    }

    Animated.timing(escalaIcone, {
      toValue: 1,
      duration: T_CRESCER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;

      if (!sessaoRef.current) {
        setModoEspera(true);
        iniciarPulso();
        return;
      }
      iniciarPasso2();
    });

    return () => {
      limparTimers();
      pararPulso();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduzirMovimento]);

  // Fundo: some nos primeiros T_FUNDO ms do progress (sincronizado com o início da subida)
  const opacidadeFundoVoo = vooDestino
    ? progress.interpolate({
        inputRange: [0, T_FUNDO / T_VOO],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : opacidadeFundo;

  const glowStyle = Platform.select({
    web: { boxShadow: `0 0 22px 2px ${BRAND.destaque}` },
    default: {
      shadowColor: BRAND.destaque,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    },
  });

  const logoTransform = vooDestino
    ? [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, vooDestino.tx],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, vooDestino.ty],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, vooDestino.scale],
          }),
        },
      ]
    : [{ scale: escalaLogo }];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: BRAND.fundo, opacity: opacidadeFundoVoo }]}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={pular}
        accessibilityRole="button"
        accessibilityLabel="Pular animação de abertura"
      />

      <View style={styles.centro} pointerEvents="none">
        <Animated.View
          style={{
            opacity: opacidadeIcone,
            transform: [{ scale: escalaIcone }],
            width: iconeFinal,
            height: iconeFinal,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {modoEspera ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: iconeFinal,
                  height: iconeFinal,
                  borderRadius: raioIcone,
                  backgroundColor: 'transparent',
                  opacity: brilho,
                },
                glowStyle,
              ]}
            />
          ) : null}
          <Image
            source={ICONE}
            style={{
              width: iconeFinal,
              height: iconeFinal,
              borderRadius: raioIcone,
              overflow: 'hidden',
              backgroundColor: BRAND.fundo,
            }}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: logoCentroLeft,
              top: logoCentroTop,
              width: logoCentroW,
              height: logoCentroH,
              opacity: opacidadeLogo,
              transform: logoTransform,
            },
            Platform.OS === 'web' ? styles.logoWillChange : null,
          ]}
        >
          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  centro: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    // sem drop-shadow/filter durante o voo
  },
  logoWillChange: {
    // @ts-ignore web-only
    willChange: 'transform, opacity',
  },
});
