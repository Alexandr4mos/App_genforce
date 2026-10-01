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

const T_CRESCER = 400; // 0–0,4s
const T_TROCA = 200; // 0,4–0,6s
const T_HOLD = 150; // 0,6–0,75s
const T_VOO = 600; // 0,75–1,35s
const T_FADE_FUNDO_APP = 350;

/**
 * Splash de abertura.
 * - destinoLogin: anima logo até a posição do Login e revela o formulário
 * - !destinoLogin (app): fade da splash revelando o app (header intacto)
 */
export default function SplashAbertura({
  sessaoPronta,
  destinoLogin,
  loginLogoBox,
  onRevelarFormulario,
  onLogoPousou,
  onConcluir,
}) {
  const { width: W, height: H } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState(null);
  const [modoEspera, setModoEspera] = useState(false);
  const [faseVoo, setFaseVoo] = useState(false);
  const concluiuRef = useRef(false);
  const passo2FeitoRef = useRef(false);
  const sessaoRef = useRef(sessaoPronta);
  const destinoRef = useRef(destinoLogin);
  const boxRef = useRef(loginLogoBox);
  const pulsoLoopRef = useRef(null);
  const timersRef = useRef([]);

  const opacidadeFundo = useRef(new Animated.Value(1)).current;
  const escalaIcone = useRef(new Animated.Value(0.4)).current;
  const opacidadeIcone = useRef(new Animated.Value(1)).current;
  const opacidadeLogo = useRef(new Animated.Value(0)).current;
  const escalaLogo = useRef(new Animated.Value(0.95)).current;
  const logoLeft = useRef(new Animated.Value(0)).current;
  const logoTop = useRef(new Animated.Value(0)).current;
  const logoW = useRef(new Animated.Value(0)).current;
  const logoH = useRef(new Animated.Value(0)).current;
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
    // Posição inicial da logo (centro)
    logoLeft.setValue(logoCentroLeft);
    logoTop.setValue(logoCentroTop);
    logoW.setValue(logoCentroW);
    logoH.setValue(logoCentroH);
  }, []);

  useEffect(() => {
    sessaoRef.current = sessaoPronta;
    destinoRef.current = destinoLogin;
    boxRef.current = loginLogoBox;
    if (passo2FeitoRef.current && sessaoPronta && modoEspera) {
      // Saiu da espera: segue do passo 2
      setModoEspera(false);
      pararPulso();
      brilho.setValue(0);
      iniciarPasso2();
    } else if (passo2FeitoRef.current && sessaoPronta && !modoEspera && !faseVoo) {
      // Já estávamos no hold aguardando box/sessão
      tentarPasso4();
    }
  }, [sessaoPronta, destinoLogin, loginLogoBox, modoEspera, faseVoo]);

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
    onLogoPousou?.();
    onRevelarFormulario?.();
    opacidadeIcone.setValue(0);
    opacidadeLogo.setValue(0);
    opacidadeFundo.setValue(0);
    finalizar();
  }

  function fadeSplashApp() {
    // Logado: some logo da splash e o fundo
    Animated.parallel([
      Animated.timing(opacidadeLogo, { toValue: 0, duration: 180, useNativeDriver: usaDriver }),
      Animated.timing(opacidadeFundo, { toValue: 0, duration: T_FADE_FUNDO_APP, useNativeDriver: usaDriver }),
    ]).start(({ finished }) => {
      if (finished) finalizar();
    });
  }

  function iniciarPasso2() {
    // G some, logo aparece (nunca juntos)
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

  function tentarPasso4() {
    if (concluiuRef.current || faseVoo) return;
    if (!sessaoRef.current) return;

    if (!destinoRef.current) {
      fadeSplashApp();
      return;
    }

    const box = boxRef.current;
    if (!box || box.width <= 0) {
      // Espera onLayout do Login
      return;
    }

    setFaseVoo(true);
    onRevelarFormulario?.();

    // Voo da logo + fade do fundo
    Animated.parallel([
      Animated.timing(logoLeft, { toValue: box.x, duration: T_VOO, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(logoTop, { toValue: box.y, duration: T_VOO, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(logoW, { toValue: box.width, duration: T_VOO, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(logoH, { toValue: box.height, duration: T_VOO, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(opacidadeFundo, {
        toValue: 0,
        duration: T_VOO,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;
      // Login logo no mesmo lugar; splash some no frame seguinte (sem gap vazio)
      onLogoPousou?.();
      requestAnimationFrame(() => {
        if (concluiuRef.current) return;
        opacidadeLogo.setValue(0);
        finalizar();
      });
    });
  }

  useEffect(() => {
    if (reduzirMovimento === null) return;
    if (reduzirMovimento) {
      pular();
      return;
    }

    // 1) G vem de longe (scale 0,4 → 1), tamanho final ~30% largura — sem glow
    Animated.timing(escalaIcone, {
      toValue: 1,
      duration: T_CRESCER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;

      if (!sessaoRef.current) {
        // Espera sessão com G + glow sutil
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

  const glowStyle = Platform.select({
    web: { boxShadow: `0 0 22px 2px ${BRAND.destaque}` },
    default: {
      shadowColor: BRAND.destaque,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    },
  });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: BRAND.fundo, opacity: opacidadeFundo }]}
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
          style={{
            position: 'absolute',
            left: logoLeft,
            top: logoTop,
            width: logoW,
            height: logoH,
            opacity: opacidadeLogo,
            transform: faseVoo ? [] : [{ scale: escalaLogo }],
          }}
        >
          <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
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
});
