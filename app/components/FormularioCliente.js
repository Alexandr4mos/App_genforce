import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';
import { UFS_BR } from '../lib/constantes';
import { mascararCNPJ, mascararTelefone } from '../lib/mascaras';

export default function FormularioCliente({ valores, onChange, mostrarRazaoSocial = false }) {
  const { cores } = useTema();
  const inputStyle = [
    styles.input,
    { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundo },
  ];

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder="Nome do cliente *"
        placeholderTextColor={cores.placeholder}
        value={valores.nome}
        onChangeText={(v) => onChange('nome', v)}
      />
      {mostrarRazaoSocial ? (
        <TextInput
          style={inputStyle}
          placeholder="Razão social"
          placeholderTextColor={cores.placeholder}
          value={valores.razao_social || ''}
          onChangeText={(v) => onChange('razao_social', v)}
        />
      ) : null}
      <TextInput
        style={inputStyle}
        placeholder="CNPJ"
        placeholderTextColor={cores.placeholder}
        value={valores.cnpj || ''}
        onChangeText={(v) => onChange('cnpj', mascararCNPJ(v))}
        keyboardType="numeric"
      />
      <TextInput
        style={inputStyle}
        placeholder="Telefone"
        placeholderTextColor={cores.placeholder}
        value={valores.telefone || ''}
        onChangeText={(v) => onChange('telefone', mascararTelefone(v))}
        keyboardType="phone-pad"
      />
      <TextInput
        style={inputStyle}
        placeholder="Telefone alternativo"
        placeholderTextColor={cores.placeholder}
        value={valores.telefone_alternativo || ''}
        onChangeText={(v) => onChange('telefone_alternativo', mascararTelefone(v))}
        keyboardType="phone-pad"
      />
      <View>
        <TextInput
          style={inputStyle}
          placeholder="E-mail (recomendado — envio do relatório)"
          placeholderTextColor={cores.placeholder}
          value={valores.email || ''}
          onChangeText={(v) => onChange('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!valores.email?.trim() ? (
          <Text style={[styles.avisoEmail, { color: cores.textoSuave }]}>
            Sem e-mail o relatório não poderá ser enviado automaticamente ao cliente.
          </Text>
        ) : null}
      </View>
      <TextInput
        style={inputStyle}
        placeholder="E-mail alternativo"
        placeholderTextColor={cores.placeholder}
        value={valores.email_alternativo || ''}
        onChangeText={(v) => onChange('email_alternativo', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={inputStyle}
        placeholder="Cidade"
        placeholderTextColor={cores.placeholder}
        value={valores.cidade || ''}
        onChangeText={(v) => onChange('cidade', v)}
      />
      <Text style={[styles.ufLegenda, { color: cores.textoSecundario }]}>
        UF: {valores.uf || '— toque para selecionar'}
      </Text>
      <View style={styles.ufGrid}>
        {UFS_BR.map((uf) => (
          <TouchableOpacity
            key={uf}
            style={[
              styles.ufChip,
              {
                backgroundColor: valores.uf === uf ? cores.primario : cores.fundoSecundario,
                borderColor: cores.borda,
              },
            ]}
            onPress={() => onChange('uf', valores.uf === uf ? '' : uf)}
          >
            <Text style={{ color: valores.uf === uf ? '#fff' : cores.texto, fontSize: 12, fontWeight: '600' }}>
              {uf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  avisoEmail: { fontSize: 12, marginTop: -6, marginBottom: 10, fontStyle: 'italic' },
  ufLegenda: { fontSize: 12, marginBottom: 6 },
  ufGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  ufChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
