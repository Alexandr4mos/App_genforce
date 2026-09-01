import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';
import HistoricoPecas from '../components/HistoricoPecas';

export default function ListaDePecas({ onBack }) {
  const { cores } = useTema();

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Lista de peças</Text>
      <HistoricoPecas />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
});
