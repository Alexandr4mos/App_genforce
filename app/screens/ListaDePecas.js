import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';
import HistoricoPecas from '../components/HistoricoPecas';

export default function ListaDePecas({ onBack }) {
  const { cores } = useTema();

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <Text style={[styles.title, { color: cores.texto }]}>Lista de peças</Text>
      <HistoricoPecas />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 16 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 },
});
