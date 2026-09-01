import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTema } from '../lib/tema';

export default function SeletorCliente({
  clientes,
  clienteId,
  onSelecionar,
  maxAltura = 260,
  filtrarLocal = true,
  onBuscaChange,
  placeholderBusca = 'Procurar...',
  conteudoQuandoBuscaVazia = null,
}) {
  const { cores } = useTema();
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const exibirAlternativa = Boolean(conteudoQuandoBuscaVazia) && !termo;
  const filtrados = filtrarLocal
    ? (clientes || []).filter((c) => {
        if (!termo) return true;
        return `${c.nome || ''} ${c.razao_social || ''}`.toLowerCase().includes(termo);
      })
    : clientes || [];

  function alterarBusca(valor) {
    setBusca(valor);
    onBuscaChange?.(valor);
  }

  return (
    <View>
      <TextInput
        style={[
          styles.input,
          { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundoCard },
        ]}
        placeholder={placeholderBusca}
        placeholderTextColor={cores.placeholder}
        value={busca}
        onChangeText={alterarBusca}
      />
      <View style={[styles.listaBox, { borderColor: cores.borda, maxHeight: maxAltura }]}>
        <ScrollView nestedScrollEnabled>
          {exibirAlternativa ? (
            conteudoQuandoBuscaVazia
          ) : (
            <>
          {filtrados.map((c) => {
            const selecionado = clienteId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.itemLista, selecionado && { backgroundColor: cores.primario }]}
                onPress={() => onSelecionar(c)}
              >
                <Text style={[styles.itemNome, { color: selecionado ? '#fff' : cores.texto }]}>{c.nome}</Text>
                {c.razao_social ? (
                  <Text style={[styles.itemRazao, { color: selecionado ? '#e8f1ff' : cores.textoSecundario }]}>
                    {c.razao_social}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
          {filtrados.length === 0 ? (
            <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>Nenhum cliente encontrado.</Text>
          ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  listaBox: { borderWidth: 1, borderRadius: 8, padding: 4 },
  itemLista: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  itemNome: { fontWeight: '600' },
  itemRazao: { fontSize: 12, marginTop: 2 },
  avisoVazio: { fontStyle: 'italic', padding: 10, fontSize: 13 },
});
