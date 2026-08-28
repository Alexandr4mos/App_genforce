import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';

export default function SecaoColapsavel({ titulo, subtitulo, abertoInicial = false, children }) {
  const { cores } = useTema();
  const [aberto, setAberto] = useState(abertoInicial);

  return (
    <View style={[styles.secao, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
      <TouchableOpacity style={styles.cabecalho} onPress={() => setAberto((v) => !v)}>
        <Text style={[styles.icone, { color: cores.textoSecundario }]}>{aberto ? '⊖' : '⊕'}</Text>
        <View style={styles.titulos}>
          <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
          {subtitulo ? (
            <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>{subtitulo}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
      {aberto ? <View style={styles.conteudo}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { borderWidth: 1, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  icone: { fontSize: 18, width: 28 },
  titulos: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2 },
  conteudo: { paddingHorizontal: 12, paddingBottom: 12 },
});
