import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../lib/tema';

export default function MenuLateral({ visivel, onFechar, itens }) {
  const { cores } = useTema();

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.row}>
        <View style={[styles.painel, { backgroundColor: cores.fundo, borderRightColor: cores.borda }]}>
          <Text style={[styles.titulo, { color: cores.texto }]}>Menu</Text>
          {itens.map((item) => (
            <TouchableOpacity
              key={item.rotulo}
              style={[styles.item, { borderBottomColor: cores.borda }]}
              onPress={() => {
                onFechar();
                item.onPress();
              }}
            >
              <Text style={[styles.itemTexto, { color: cores.texto }]}>{item.rotulo}</Text>
              {item.detalhe ? (
                <Text style={[styles.itemDetalhe, { color: cores.textoSecundario }]}>{item.detalhe}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
        <Pressable style={[styles.resto, { backgroundColor: cores.overlay }]} onPress={onFechar} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  painel: {
    width: 280,
    maxWidth: '80%',
    paddingTop: 56,
    paddingHorizontal: 8,
    borderRightWidth: 1,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 12, marginBottom: 12 },
  item: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1 },
  itemTexto: { fontSize: 16, fontWeight: '600' },
  itemDetalhe: { fontSize: 12, marginTop: 2 },
  resto: { flex: 1 },
});
