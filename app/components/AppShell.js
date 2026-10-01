import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useTema, RAIO, SOMBRA, LARGURA_DESKTOP, ALVO_TOQUE } from '../lib/tema';
import Icone from './ui/Icone';

// Estrutura de navegação: sidebar fixa no desktop, barra inferior + "Mais" no mobile.
// `itens`: [{ id, rotulo, icone, onPress, principal }] — principal = aparece na barra inferior.
// Logo de marca fica no AppHeader (topo), não aqui.
export default function AppShell({ itens, secaoAtiva, onSair, children }) {
  const { cores, modoEscuro, alternarTema } = useTema();
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;
  const [maisAberto, setMaisAberto] = useState(false);

  const principais = itens.filter((i) => i.principal);
  const secundarios = itens.filter((i) => !i.principal);
  const ativoEmMais = secundarios.some((i) => i.id === secaoAtiva);

  if (desktop) {
    return (
      <View style={[styles.raiz, { backgroundColor: cores.fundo, flexDirection: 'row' }]}>
        <View style={[styles.sidebar, { backgroundColor: cores.fundoCard, borderRightColor: cores.borda }]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2, paddingTop: 8 }}>
            {itens.map((item) => (
              <ItemNav key={item.id} item={item} ativo={item.id === secaoAtiva} />
            ))}
          </ScrollView>
          <View style={[styles.rodape, { borderTopColor: cores.borda }]}>
            <View style={styles.temaLinha}>
              <Icone nome={modoEscuro ? 'moon' : 'sun'} tamanho={18} cor={cores.textoSecundario} />
              <Text style={[styles.temaTexto, { color: cores.textoSecundario }]}>
                {modoEscuro ? 'Modo escuro' : 'Modo claro'}
              </Text>
              <Switch
                value={modoEscuro}
                onValueChange={alternarTema}
                accessibilityLabel="Alternar modo escuro"
                trackColor={{ false: cores.bordaInput, true: cores.primario }}
                thumbColor="#FFFFFF"
              />
            </View>
            <ItemNav item={{ id: 'sair', rotulo: 'Sair', icone: 'logout', onPress: onSair }} ativo={false} />
          </View>
        </View>
        <View style={styles.conteudo}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <View style={styles.conteudo}>{children}</View>
      <View style={[styles.barra, { backgroundColor: cores.fundoCard, borderTopColor: cores.borda }]}>
        {principais.map((item) => (
          <AbaInferior key={item.id} item={item} ativo={item.id === secaoAtiva} />
        ))}
        <AbaInferior
          item={{ id: 'mais', rotulo: 'Mais', icone: 'menu', onPress: () => setMaisAberto(true) }}
          ativo={ativoEmMais}
        />
      </View>

      <Modal visible={maisAberto} transparent animationType="fade" onRequestClose={() => setMaisAberto(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: cores.overlay }]} onPress={() => setMaisAberto(false)}>
          <Pressable
            style={[styles.folha, { backgroundColor: cores.fundoCard, boxShadow: SOMBRA.lg }]}
            onPress={() => {}}
          >
            <View style={[styles.puxador, { backgroundColor: cores.borda }]} />
            {secundarios.map((item) => (
              <ItemNav
                key={item.id}
                item={{
                  ...item,
                  onPress: () => {
                    setMaisAberto(false);
                    item.onPress();
                  },
                }}
                ativo={item.id === secaoAtiva}
              />
            ))}
            <View style={[styles.temaLinha, { paddingHorizontal: 12, paddingVertical: 10 }]}>
              <Icone nome={modoEscuro ? 'moon' : 'sun'} tamanho={20} cor={cores.textoSecundario} />
              <Text style={[styles.temaTexto, { color: cores.texto, fontSize: 15 }]}>
                {modoEscuro ? 'Modo escuro' : 'Modo claro'}
              </Text>
              <Switch
                value={modoEscuro}
                onValueChange={alternarTema}
                accessibilityLabel="Alternar modo escuro"
                trackColor={{ false: cores.bordaInput, true: cores.primario }}
                thumbColor="#FFFFFF"
              />
            </View>
            <ItemNav
              item={{
                id: 'sair',
                rotulo: 'Sair',
                icone: 'logout',
                onPress: () => {
                  setMaisAberto(false);
                  onSair();
                },
              }}
              ativo={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ItemNav({ item, ativo }) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={item.rotulo}
      accessibilityState={{ selected: ativo }}
      onPress={item.onPress}
      style={({ hovered, pressed }) => [
        styles.item,
        {
          backgroundColor: ativo ? cores.primarioFundo : hovered || pressed ? cores.fundoSecundario : 'transparent',
          transitionProperty: 'background-color',
          transitionDuration: '150ms',
        },
      ]}
    >
      <Icone nome={item.icone} tamanho={20} cor={ativo ? cores.primarioTexto : cores.textoSecundario} />
      <Text style={[styles.itemTexto, { color: ativo ? cores.primarioTexto : cores.texto, fontWeight: ativo ? '700' : '500' }]}>
        {item.rotulo}
      </Text>
    </Pressable>
  );
}

function AbaInferior({ item, ativo }) {
  const { cores } = useTema();
  const cor = ativo ? cores.primario : cores.textoSuave;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.rotulo}
      accessibilityState={{ selected: ativo }}
      onPress={item.onPress}
      style={styles.aba}
    >
      <View style={[styles.abaIcone, ativo && { backgroundColor: cores.primarioFundo }]}>
        <Icone nome={item.icone} tamanho={22} cor={cor} />
      </View>
      <Text style={[styles.abaTexto, { color: cor, fontWeight: ativo ? '700' : '500' }]}>{item.rotuloCurto || item.rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { flex: 1, minWidth: 0 },
  sidebar: { width: 248, borderRightWidth: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  rodape: { borderTopWidth: 1, paddingTop: 8, marginTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 12,
    borderRadius: RAIO.md,
  },
  itemTexto: { fontSize: 15, flex: 1 },
  temaLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 6 },
  temaTexto: { flex: 1, fontSize: 13, fontWeight: '500' },
  barra: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 6, paddingTop: 4 },
  aba: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 2 },
  abaIcone: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  abaTexto: { fontSize: 11 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  folha: { borderTopLeftRadius: RAIO.lg + 4, borderTopRightRadius: RAIO.lg + 4, padding: 12, paddingBottom: 24 },
  puxador: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
});
