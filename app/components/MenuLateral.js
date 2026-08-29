import { Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTema } from '../lib/tema';

export default function MenuLateral({ visivel, onFechar, itens, toggleTema }) {
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

          {toggleTema ? (
            <View style={[styles.itemToggle, { borderBottomColor: cores.borda, backgroundColor: cores.fundoSecundario }]}>
              <View style={styles.toggleRotulo}>
                <Text style={styles.toggleIcone}>{toggleTema.valor ? '🌙' : '☀️'}</Text>
                <View>
                  <Text style={[styles.itemTexto, { color: cores.texto }]}>
                    {toggleTema.valor ? 'Modo escuro' : 'Modo claro'}
                  </Text>
                  <Text style={[styles.itemDetalhe, { color: cores.textoSecundario }]}>
                    {toggleTema.valor ? 'Tema escuro ativo' : 'Tema claro ativo'}
                  </Text>
                </View>
              </View>
              <Switch
                value={toggleTema.valor}
                onValueChange={toggleTema.onAlternar}
                trackColor={{ false: '#ccc', true: cores.primario }}
                thumbColor="#ffffff"
              />
            </View>
          ) : null}
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
  itemToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    marginHorizontal: 4,
  },
  toggleRotulo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  toggleIcone: { fontSize: 22, marginRight: 10 },
  resto: { flex: 1 },
});
