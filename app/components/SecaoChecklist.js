import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';

export default function SecaoChecklist({
  titulo,
  preenchidos,
  total,
  resumo,
  aberta,
  onToggle,
  completa,
  corBordaLateral,
  children,
  onSalvarSecao,
  salvandoSecao,
}) {
  const { cores } = useTema();
  const bordaCor = corBordaLateral ?? (completa ? '#4caf50' : cores.primario);

  return (
    <View
      style={[
        styles.secao,
        {
          borderColor: cores.borda,
          backgroundColor: cores.fundoSecundario,
          borderLeftColor: bordaCor,
        },
      ]}
    >
      <TouchableOpacity style={styles.cabecalho} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.cabecalhoTexto}>
          <Text style={[styles.titulo, { color: cores.texto }]}>
            {aberta ? '▼' : '▶'} {titulo}
          </Text>
          {!aberta && resumo ? (
            <Text style={[styles.resumo, { color: cores.textoSuave }]} numberOfLines={2}>
              {resumo}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.contador, { color: completa ? '#4caf50' : cores.textoSecundario }]}>
          {preenchidos}/{total}
        </Text>
      </TouchableOpacity>

      {aberta ? (
        <View style={styles.corpo}>
          {children}
          <TouchableOpacity
            style={[styles.salvarSecaoBotao, { borderColor: cores.primario }]}
            onPress={onSalvarSecao}
            disabled={salvandoSecao}
          >
            <Text style={[styles.salvarSecaoTexto, { color: cores.primario }]}>
              {salvandoSecao ? 'Salvando seção...' : 'Salvar seção'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
  },
  cabecalhoTexto: { flex: 1, marginRight: 8 },
  titulo: { fontSize: 15, fontWeight: '700' },
  resumo: { fontSize: 12, marginTop: 4 },
  contador: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  corpo: { paddingHorizontal: 12, paddingBottom: 12 },
  salvarSecaoBotao: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  salvarSecaoTexto: { fontWeight: '600', fontSize: 13 },
});
