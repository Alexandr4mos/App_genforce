import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTema, RAIO, ALVO_TOQUE } from '../../lib/tema';
import Icone from './Icone';

// variante: primario | secundario | fantasma | perigo — tamanho: md | sm
export default function Botao({
  titulo,
  onPress,
  variante = 'primario',
  tamanho = 'md',
  icone,
  carregando = false,
  desabilitado = false,
  cheio = false,
  style,
}) {
  const { cores } = useTema();
  const inativo = desabilitado || carregando;

  const paleta = {
    primario: { bg: cores.primario, fg: cores.sobrePrimario, borda: 'transparent' },
    secundario: { bg: cores.fundoCard, fg: cores.texto, borda: cores.bordaInput },
    fantasma: { bg: 'transparent', fg: cores.primario, borda: 'transparent' },
    perigo: { bg: cores.erro, fg: '#FFFFFF', borda: 'transparent' },
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.base,
        tamanho === 'sm' ? styles.sm : styles.md,
        cheio && styles.cheio,
        {
          backgroundColor: paleta.bg,
          borderColor: paleta.borda,
          opacity: inativo ? 0.55 : pressed ? 0.85 : hovered ? 0.92 : 1,
        },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={paleta.fg} />
      ) : (
        <>
          {icone ? <Icone nome={icone} tamanho={18} cor={paleta.fg} /> : null}
          <Text style={[styles.texto, { color: paleta.fg }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RAIO.md,
    borderWidth: 1,
    gap: 8,
    transitionProperty: 'opacity, background-color',
    transitionDuration: '150ms',
  },
  md: { minHeight: ALVO_TOQUE, paddingHorizontal: 18 },
  sm: { minHeight: 36, paddingHorizontal: 12 },
  cheio: { alignSelf: 'stretch' },
  texto: { fontSize: 15, fontWeight: '600' },
});
