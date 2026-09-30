import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { registrarOuvinteFeedback } from '../../lib/avisos';
import { useTema, RAIO, SOMBRA } from '../../lib/tema';
import Botao from './Botao';
import Icone from './Icone';

const DURACAO_TOAST = 5000;

// Montado uma vez em App.js. Mostra toasts (avisar) e o modal de confirmar (confirmarAcao).
export default function FeedbackHost() {
  const { cores } = useTema();
  const [toasts, setToasts] = useState([]);
  const [confirmacao, setConfirmacao] = useState(null);
  const contador = useRef(0);

  useEffect(() => {
    return registrarOuvinteFeedback((evento) => {
      if (evento.tipo === 'toast') {
        const id = ++contador.current;
        setToasts((atual) => [...atual.slice(-2), { ...evento, id }]);
        setTimeout(() => setToasts((atual) => atual.filter((t) => t.id !== id)), DURACAO_TOAST);
      } else {
        setConfirmacao(evento);
      }
    });
  }, []);

  function responder(valor) {
    confirmacao?.resolver(valor);
    setConfirmacao(null);
  }

  return (
    <>
      <View style={styles.toastArea} pointerEvents="box-none">
        {toasts.map((t) => {
          const erro = t.variante === 'erro';
          return (
            <Pressable
              key={t.id}
              accessibilityRole="alert"
              onPress={() => setToasts((atual) => atual.filter((x) => x.id !== t.id))}
              style={[
                styles.toast,
                {
                  backgroundColor: cores.fundoCard,
                  borderColor: erro ? cores.erro : cores.borda,
                  boxShadow: SOMBRA.lg,
                },
              ]}
            >
              <View style={[styles.toastIcone, { backgroundColor: erro ? cores.erroFundo : cores.infoFundo }]}>
                <Icone nome={erro ? 'alert' : 'info'} tamanho={18} cor={erro ? cores.erro : cores.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toastTitulo, { color: cores.texto }]}>{t.titulo}</Text>
                <Text style={[styles.toastTexto, { color: cores.textoSecundario }]}>{t.mensagem}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={!!confirmacao} transparent animationType="fade" onRequestClose={() => responder(false)}>
        <View style={[styles.overlay, { backgroundColor: cores.overlay }]}>
          <View
            accessibilityRole="alert"
            style={[styles.modal, { backgroundColor: cores.fundoCard, boxShadow: SOMBRA.lg }]}
          >
            <Text style={[styles.modalTitulo, { color: cores.texto }]}>Confirmar ação</Text>
            <Text style={[styles.modalTexto, { color: cores.textoSecundario }]}>{confirmacao?.mensagem}</Text>
            <View style={styles.modalAcoes}>
              <Botao titulo="Cancelar" variante="secundario" onPress={() => responder(false)} style={{ flex: 1 }} />
              <Botao titulo="Confirmar" onPress={() => responder(true)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toastArea: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 440,
    borderRadius: RAIO.md,
    borderWidth: 1,
    padding: 12,
  },
  toastIcone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toastTitulo: { fontSize: 14, fontWeight: '700' },
  toastTexto: { fontSize: 13, marginTop: 2 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 400, borderRadius: RAIO.lg, padding: 20 },
  modalTitulo: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  modalTexto: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  modalAcoes: { flexDirection: 'row', gap: 12 },
});
