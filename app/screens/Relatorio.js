import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';
import SeletorCliente from '../components/SeletorCliente';

export default function Relatorio({ onBack }) {
  const { cores } = useTema();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, razao_social')
      .order('nome');
    if (error) {
      avisar(error.message, 'Erro ao carregar clientes');
      return;
    }
    setClientes(data || []);
  }

  async function escolherCliente(id) {
    setClienteId(id);
    setLoading(true);
    setPendencias([]);

    const { data: unidades, error: erroUnidades } = await supabase
      .from('unidades')
      .select('id')
      .eq('cliente_id', id);

    if (erroUnidades) {
      setLoading(false);
      avisar(erroUnidades.message, 'Erro ao carregar unidades');
      return;
    }

    const unidadeIds = (unidades || []).map((u) => u.id);
    if (unidadeIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: equipamentos, error: erroEq } = await supabase
      .from('equipamentos')
      .select('id')
      .in('unidade_id', unidadeIds);

    if (erroEq) {
      setLoading(false);
      avisar(erroEq.message, 'Erro ao carregar geradores');
      return;
    }

    const equipamentoIds = (equipamentos || []).map((e) => e.id);
    if (equipamentoIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pendencias')
      .select('id, item_solicitado, observacao_tecnico, observacao_baixa, baixado_em, equipamentos(tag, fabricante_gmg)')
      .eq('status', 'resolvida')
      .in('equipamento_id', equipamentoIds)
      .order('baixado_em', { ascending: false });

    setLoading(false);

    if (error) {
      avisar(error.message, 'Erro ao carregar pendências');
      return;
    }

    setPendencias(data || []);
  }

  const clienteAtual = clientes.find((c) => c.id === clienteId);

  function formatarData(valor) {
    if (!valor) return '';
    const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return valor;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Relatório</Text>
      <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
        Pendências já baixadas (resolvidas) por cliente.
      </Text>

      <Text style={[styles.label, { color: cores.texto }]}>Cliente</Text>
      <SeletorCliente
        clientes={clientes}
        clienteId={clienteId}
        onSelecionar={(c) => escolherCliente(c.id)}
      />

      {clienteAtual ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>
            Pendências resolvidas — {clienteAtual.nome}
          </Text>
          {loading ? <ActivityIndicator /> : null}
          {!loading && pendencias.length === 0 ? (
            <Text style={[styles.avisoVazio, { color: cores.textoSuave }]}>
              Nenhuma pendência resolvida para este cliente.
            </Text>
          ) : null}
          {pendencias.map((p) => (
            <View
              key={p.id}
              style={[styles.card, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
            >
              <Text style={[styles.cardItem, { color: cores.texto }]}>{p.item_solicitado}</Text>
              {p.equipamentos?.tag ? (
                <Text style={[styles.cardEq, { color: cores.textoSecundario }]}>
                  {p.equipamentos.tag}
                  {p.equipamentos.fabricante_gmg ? ` | ${p.equipamentos.fabricante_gmg}` : ''}
                </Text>
              ) : null}
              {p.observacao_baixa ? (
                <Text style={[styles.cardObs, { color: cores.textoSecundario }]}>
                  Baixa: {p.observacao_baixa}
                </Text>
              ) : null}
              {p.baixado_em ? (
                <Text style={[styles.cardData, { color: cores.textoSuave }]}>
                  Resolvida em {formatarData(p.baixado_em)}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitulo: { fontSize: 13, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  listaBox: { borderWidth: 1, borderRadius: 8, padding: 4, marginBottom: 16, maxHeight: 280 },
  itemLista: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6 },
  itemNome: { fontWeight: '600' },
  itemRazao: { fontSize: 12, marginTop: 2 },
  avisoVazio: { fontStyle: 'italic', padding: 10, fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardItem: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  cardEq: { fontSize: 12, marginBottom: 4 },
  cardObs: { fontSize: 13 },
  cardData: { fontSize: 12, marginTop: 6 },
});
