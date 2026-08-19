import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';

export default function ImportarClientes({ onBack }) {
  const { cores } = useTema();

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: cores.texto }]}>Importar clientes</Text>
      <Text style={[styles.texto, { color: cores.textoSecundario }]}>
        A tela de envio do arquivo CSV entra em seguida nesta implementação.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  texto: { fontSize: 14, lineHeight: 20 },
});
