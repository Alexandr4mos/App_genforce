import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useTema, RAIO } from '../../lib/tema';

// Bloco cinza pulsante para estados de carregamento.
export function SkeletonBloco({ largura = '100%', altura = 14, raio = 6, style }) {
  const { cores } = useTema();
  const opacidade = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacidade, { toValue: 0.55, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacidade]);

  return (
    <Animated.View
      style={[{ width: largura, height: altura, borderRadius: raio, backgroundColor: cores.fundoSecundario, opacity: opacidade }, style]}
    />
  );
}

// Esqueleto de um card de OS da lista.
export function SkeletonCardOS() {
  const { cores } = useTema();
  return (
    <View style={[styles.card, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}>
      <View style={styles.linha}>
        <SkeletonBloco largura={56} altura={18} />
        <SkeletonBloco largura={88} altura={22} raio={11} />
      </View>
      <SkeletonBloco largura="70%" altura={16} style={{ marginTop: 14 }} />
      <SkeletonBloco largura="40%" altura={12} style={{ marginTop: 8 }} />
      <View style={[styles.linha, { marginTop: 14 }]}>
        <SkeletonBloco largura={120} altura={22} raio={11} />
        <SkeletonBloco largura={90} altura={22} raio={11} />
      </View>
    </View>
  );
}

export function SkeletonListaOS({ quantidade = 4 }) {
  return (
    <View accessibilityLabel="Carregando ordens de serviço" accessibilityRole="progressbar">
      {Array.from({ length: quantidade }, (_, i) => (
        <SkeletonCardOS key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RAIO.lg, padding: 16, marginBottom: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
