import { StyleSheet, Text, View } from 'react-native';
import { useTema, RAIO } from '../../lib/tema';
import { estiloBadgeStatus, rotuloStatus, corDoStatus } from '../../lib/constantes';

// Badge de status de OS: fundo suave + ponto de cor + texto com contraste AA.
export function BadgeStatus({ status }) {
  const { modoEscuro } = useTema();
  const { fg, bg } = estiloBadgeStatus(status, modoEscuro);
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <View style={[styles.ponto, { backgroundColor: corDoStatus(status) }]} />
      <Text style={[styles.texto, { color: fg }]}>{rotuloStatus(status)}</Text>
    </View>
  );
}

// Badge genérico. tom: neutro | primario | sucesso | alerta | erro | info
export default function Badge({ tom = 'neutro', children }) {
  const { cores } = useTema();
  const mapa = {
    neutro: { fg: cores.textoSecundario, bg: cores.fundoSecundario },
    primario: { fg: cores.primarioTexto, bg: cores.primarioFundo },
    sucesso: { fg: cores.sucesso, bg: cores.sucessoFundo },
    alerta: { fg: cores.alerta, bg: cores.alertaFundo },
    erro: { fg: cores.erro, bg: cores.erroFundo },
    info: { fg: cores.info, bg: cores.infoFundo },
  };
  const { fg, bg } = mapa[tom] || mapa.neutro;
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.texto, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RAIO.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ponto: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  texto: { fontSize: 12, fontWeight: '600' },
});
