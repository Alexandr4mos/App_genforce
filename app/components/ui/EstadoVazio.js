import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../lib/tema';
import Botao from './Botao';
import Icone from './Icone';

// Estado vazio/erro: ícone, mensagem e uma chamada para ação.
export default function EstadoVazio({ icone = 'inbox', titulo, texto, acao, onAcao, tom = 'neutro' }) {
  const { cores } = useTema();
  const erro = tom === 'erro';
  return (
    <View style={styles.wrap}>
      <View style={[styles.icone, { backgroundColor: erro ? cores.erroFundo : cores.primarioFundo }]}>
        <Icone nome={icone} tamanho={28} cor={erro ? cores.erro : cores.primario} />
      </View>
      <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
      {texto ? <Text style={[styles.texto, { color: cores.textoSecundario }]}>{texto}</Text> : null}
      {acao ? (
        <View style={{ marginTop: 16 }}>
          <Botao titulo={acao} onPress={onAcao} variante={erro ? 'secundario' : 'primario'} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  icone: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  titulo: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  texto: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 360 },
});
