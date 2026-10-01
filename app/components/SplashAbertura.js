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

const ICONE_INICIAL = 72;
const DUR_CRESCER = 500;
const DUR_TROCA = 400;
const DUR_PAUSA = 300;
const DUR_FADE = 400;

/**
 * Splash de abertura — independente do header.
 * Some quando a animação termina E sessaoPronta=true.
 *
 * Nota: o JPG do ícone tem fundo ~#101115 (não exatamente #0B0D12);
 * aplicamos borderRadius ~22% para mascarar o retângulo, como ícone de app.
 */
export default function SplashAbertura({ sessaoPronta, onConcluir }) {
  const { width: larguraTela } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState(null); // null = ainda detectando
  const [aguardandoSessao, setAguardandoSessao] = useState(false);
  const concluiuRef = useRef(false);
  const animacaoProntaRef = useRef(false);
  const sessaoRef = useRef(sessaoPronta);
  const pulsoLoopRef = useRef(null);

  const opacidadeSplash = useRef(new Animated.Value(1)).current;
  const escalaIcone = useRef(new Animated.Value(1)).current;
  const opacidadeIcone = useRef(new Animated.Value(1)).current;
  const opacidadeLogo = useRef(new Animated.Value(0)).current;
  const escalaLogo = useRef(new Animated.Value(0.95)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0.35)).current;

  const usaDriver = Platform.OS !== 'web';
  const iconeFinal = Math.max(ICONE_INICIAL, larguraTela * 0.4);
  const escalaAlvo = iconeFinal / ICONE_INICIAL;
  const logoLargura = Math.min(larguraTela * 0.6, 420);
  const logoAltura = logoLargura / 2;
  const raioIcone = ICONE_INICIAL * 0.22;

  useEffect(() => {
    sessaoRef.current = sessaoPronta;
    if (animacaoProntaRef.current && sessaoPronta) {
      encerrarComFade();
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
      else if (!AccessibilityInfo.isReduceMotionEnabled) aplicar(false);
      const onChange = (e) => aplicar(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => {
        ativo = false;
        mq.removeEventListener?.('change', onChange);
      };
    }

    // fallback se AccessibilityInfo não existir
    const t = setTimeout(() => {
      if (ativo && reduzirMovimento === null) aplicar(false);
    }, 50);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, []);

  function finalizar() {
    if (concluiuRef.current) return;
    concluiuRef.current = true;
    pararPulso();
    onConcluir?.();
  }

  function encerrarComFade() {
    if (concluiuRef.current) return;
    setAguardandoSessao(false);
    pararPulso();
    Animated.timing(opacidadeSplash, {
      toValue: 0,
      duration: DUR_FADE,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: usaDriver,
    }).start(({ finished }) => {
      if (finished) finalizar();
    });
  }

  function marcarAnimacaoPronta() {
    if (concluiuRef.current) return;
    animacaoProntaRef.current = true;
    if (sessaoRef.current) {
      encerrarComFade();
    } else {
      setAguardandoSessao(true);
      iniciarPulso();
    }
  }

  function iniciarPulso() {
    pararPulso();
    pulso.setValue(0.35);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 0.8,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: usaDriver,
        }),
        Animated.timing(pulso, {
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
    pulso.setValue(0);
  }

  function pular() {
    if (concluiuRef.current) return;
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

    Animated.parallel([
      Animated.timing(escalaIcone, {
        toValue: escalaAlvo,
        duration: DUR_CRESCER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: usaDriver,
      }),
      Animated.sequence([
        Animated.delay(DUR_CRESCER - 120),
        Animated.timing(brilho, {
          toValue: 1,
          duration: 80,
          useNativeDriver: usaDriver,
        }),
        Animated.timing(brilho, {
          toValue: 0.2,
          duration: 160,
          useNativeDriver: usaDriver,
        }),
      ]),
    ]).start(({ finished }) => {
      if (!finished || concluiuRef.current) return;

      Animated.parallel([
        Animated.timing(opacidadeIcone, {
          toValue: 0,
          duration: DUR_TROCA,
          useNativeDriver: usaDriver,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: DUR_TROCA,
          useNativeDriver: usaDriver,
        }),
        Animated.timing(opacidadeLogo, {
          toValue: 1,
          duration: DUR_TROCA,
          useNativeDriver: usaDriver,
        }),
        Animated.timing(escalaLogo, {
          toValue: 1,
          duration: DUR_TROCA,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: usaDriver,
        }),
      ]).start(({ finished: ok }) => {
        if (!ok || concluiuRef.current) return;
        const t = setTimeout(() => {
          if (!concluiuRef.current) marcarAnimacaoPronta();
        }, DUR_PAUSA);
        return () => clearTimeout(t);
      });
    });

    return () => {
      pararPulso();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduzirMovimento, escalaAlvo]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, { backgroundColor: BRAND.fundo, opacity: opacidadeSplash }]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={pular}
        accessibilityRole="button"
        accessibilityLabel="Pular animação de abertura"
      />

      <View style={styles.centro} pointerEvents="none">
        <Animated.View
          style={[
            styles.brilho,
            {
              width: iconeFinal * 1.2,
              height: iconeFinal * 1.2,
              borderRadius: (iconeFinal * 1.2) / 2,
              backgroundColor: BRAND.destaque,
              opacity: brilho,
            },
          ]}
        />
        {aguardandoSessao ? (
          <Animated.View
            style={[
              styles.brilho,
              {
                width: logoLargura * 0.9,
                height: logoAltura * 0.9,
                borderRadius: 24,
                backgroundColor: BRAND.destaque,
                opacity: pulso,
              },
            ]}
          />
        ) : null}

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
              width: ICONE_INICIAL,
              height: ICONE_INICIAL,
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
            opacity: opacidadeLogo,
            transform: [{ scale: escalaLogo }],
          }}
        >
          <Image source={LOGO} style={{ width: logoLargura, height: logoAltura }} resizeMode="contain" />
        </Animated.View>
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
  brilho: {
    position: 'absolute',
  },
});
