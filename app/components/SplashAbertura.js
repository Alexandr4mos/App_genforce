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

// Tempos (ms) — total ~1100ms (+ espera de sessão se necessário)
const T_CRESCER = 350;
const T_FADE_G = 150; // 0,35–0,50
const T_LOGO_IN = 200; // 0,45–0,65 (começa quando G < 10%)
const T_HOLD_ATE = 800; // logo parada até ~0,8s
const T_FADE_LOGO = 100; // 0,8–0,9
const T_FADE_FUNDO = 200; // 0,9–1,1

/**
 * Splash de abertura — independente do header.
 * JPG do ícone ~#101115 ≠ #0B0D12 → borderRadius ~22% mascara o retângulo.
 */
export default function SplashAbertura({ sessaoPronta, onConcluir }) {
  const { width: larguraTela } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState(null);
  const [mostrarGEspera, setMostrarGEspera] = useState(false);
  const concluiuRef = useRef(false);
  const animacaoProntaRef = useRef(false);
  const sessaoRef = useRef(sessaoPronta);
  const pulsoLoopRef = useRef(null);
  const timersRef = useRef([]);

  const opacidadeFundo = useRef(new Animated.Value(1)).current;
  const escalaIcone = useRef(new Animated.Value(1)).current;
  const opacidadeIcone = useRef(new Animated.Value(1)).current;
  const opacidadeLogo = useRef(new Animated.Value(0)).current;
  const escalaLogo = useRef(new Animated.Value(0.95)).current;
  const brilho = useRef(new Animated.Value(0.35)).current;

  const usaDriver = Platform.OS !== 'web';
  const iconeTam = Math.max(96, Math.round(larguraTela * 0.3));
  const raioIcone = iconeTam * 0.22;
  const logoLargura = Math.min(larguraTela * 0.6, 420);
  const logoAltura = logoLargura / 2;

  useEffect(() => {
    // Remove splash HTML do primeiro paint sem flash
    if (typeof document !== 'undefined') {
      document.getElementById('splash-boot')?.remove();
    }
  }, []);

  useEffect(() => {
    sessaoRef.current = sessaoPronta;
    if (animacaoProntaRef.current && sessaoPronta) {
      encerrarAposLogo();
    }
  }, [sessaoPronta]);

  useEffect(() => {
    let ativo = true;
    const aplicar = (v) => {
      if (ativo) setReduzirMovimento(Boolean(v));
    };
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
    return id;
  }

  function finalizar() {
    if (concluiuRef.current) return;
    concluiuRef.current = true;
    limparTimers();
    pararPulso();
    onConcluir?.();
  }

  function fadeFundoESair() {
    if (concluiuRef.current) return;
    setMostrarGEspera(false);
    pararPulso();
    Animated.timing(opacidadeFundo, {
      toValue: 0,
      duration: T_FADE_FUNDO,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (finished) finalizar();
    });
  }

  /** Logo some primeiro; só depois o fundo. */
  function encerrarAposLogo() {
    if (concluiuRef.current) return;
    setMostrarGEspera(false);
    pararPulso();
    Animated.timing(opacidadeLogo, {
      toValue: 0,
      duration: T_FADE_LOGO,
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;
      fadeFundoESair();
    });
  }

  function marcarAnimacaoPronta() {
    if (concluiuRef.current) return;
    animacaoProntaRef.current = true;
    if (sessaoRef.current) {
      encerrarAposLogo();
    } else {
      // Sessão lenta: some logo, mantém G com glow pulsando
      Animated.timing(opacidadeLogo, {
        toValue: 0,
        duration: T_FADE_LOGO,
        useNativeDriver: usaDriver,
      }).start(() => {
        if (concluiuRef.current) return;
        opacidadeIcone.setValue(1);
        escalaIcone.setValue(1);
        setMostrarGEspera(true);
        iniciarPulso();
      });
    }
  }

  function iniciarPulso() {
    pararPulso();
    brilho.setValue(0.35);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 0.75,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: usaDriver,
        }),
        Animated.timing(brilho, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: usaDriver,
        }),
      ])
    );
    pulsoLoopRef.current = loop;
    loop.start();
  }

  function pararPulso() {
    if (pulsoLoopRef.current) {
      pulsoLoopRef.current.stop();
      pulsoLoopRef.current = null;
    }
  }

  function pular() {
    if (concluiuRef.current) return;
    limparTimers();
    escalaIcone.stopAnimation();
    opacidadeIcone.stopAnimation();
    opacidadeLogo.stopAnimation();
    escalaLogo.stopAnimation();
    brilho.stopAnimation();
    opacidadeIcone.setValue(0);
    opacidadeLogo.setValue(1);
    escalaLogo.setValue(1);
    brilho.setValue(0);
    marcarAnimacaoPronta();
  }

  useEffect(() => {
    if (reduzirMovimento === null) return;
    if (reduzirMovimento) {
      opacidadeIcone.setValue(0);
      opacidadeLogo.setValue(1);
      escalaLogo.setValue(1);
      marcarAnimacaoPronta();
      return;
    }

    // 1) 0–0,35s: G ~30% tela, scale 1→1,08 + glow no contorno
    Animated.parallel([
      Animated.timing(escalaIcone, {
        toValue: 1.08,
        duration: T_CRESCER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: usaDriver,
      }),
      Animated.timing(brilho, {
        toValue: 0.7,
        duration: T_CRESCER,
        easing: Easing.out(Easing.quad),
        useNativeDriver: usaDriver,
      }),
    ]).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;

      // 2) G some (0,35–0,50). Logo só entra quando G < 10%.
      const fadeG = Animated.timing(opacidadeIcone, {
        toValue: 0,
        duration: T_FADE_G,
        easing: Easing.in(Easing.quad),
        useNativeDriver: usaDriver,
      });
      Animated.timing(brilho, {
        toValue: 0,
        duration: T_FADE_G,
        useNativeDriver: usaDriver,
      }).start();

      // Quando G chega a ~10%: após 90% do fade (~135ms)
      agendar(() => {
        if (concluiuRef.current) return;
        // 3) logo 0,45–0,65
        Animated.parallel([
          Animated.timing(opacidadeLogo, {
            toValue: 1,
            duration: T_LOGO_IN,
            useNativeDriver: usaDriver,
          }),
          Animated.timing(escalaLogo, {
            toValue: 1,
            duration: T_LOGO_IN,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: usaDriver,
          }),
        ]).start();
      }, Math.round(T_FADE_G * 0.9));

      fadeG.start(({ finished: ok }) => {
        if (!ok || concluiuRef.current) return;
        // Hold até 0,8s desde o início: 800 - 500 = 300ms após fim do fade G
        const ja = T_CRESCER + T_FADE_G;
        const restoHold = Math.max(0, T_HOLD_ATE - ja);
        agendar(() => {
          if (!concluiuRef.current) marcarAnimacaoPronta();
        }, restoHold);
      });
    });

    return () => {
      limparTimers();
      pararPulso();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduzirMovimento, iconeTam]);

  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 28px 4px ${BRAND.destaque}`,
    },
    default: {
      shadowColor: BRAND.destaque,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 },
    },
  });

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, { backgroundColor: BRAND.fundo, opacity: opacidadeFundo }]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={pular}
        accessibilityRole="button"
        accessibilityLabel="Pular animação de abertura"
      />

      <View style={styles.centro} pointerEvents="none">
        {/* Glow = mesma forma arredondada do ícone (não círculo) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: iconeTam,
              height: iconeTam,
              borderRadius: raioIcone,
              backgroundColor: 'transparent',
              opacity: brilho,
              transform: [{ scale: escalaIcone }],
            },
            glowStyle,
          ]}
        />

        <Animated.View
          style={{
            position: 'absolute',
            opacity: opacidadeIcone,
            transform: [{ scale: escalaIcone }],
          }}
        >
          <Image
            source={ICONE}
            style={{
              width: iconeTam,
              height: iconeTam,
              borderRadius: raioIcone,
              overflow: 'hidden',
              backgroundColor: BRAND.fundo,
            }}
            resizeMode="cover"
          />
        </Animated.View>

        {!mostrarGEspera ? (
          <Animated.View
            style={{
              position: 'absolute',
              opacity: opacidadeLogo,
              transform: [{ scale: escalaLogo }],
            }}
          >
            <Image source={LOGO} style={{ width: logoLargura, height: logoAltura }} resizeMode="contain" />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
