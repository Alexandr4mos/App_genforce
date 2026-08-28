import { useEffect, useMemo, useState } from 'react';
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
import DateRangeFilter from '../components/DateRangeFilter';
import { limitesConsulta, criarEstadoInicialFiltroData } from '../lib/dateRangeService';

export default function Dashboard({ onBack }) {
  const { cores } = useTema();
  const [dateFilter, setDateFilter] = useState(() => criarEstadoInicialFiltroData());
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRanking(dateFilter.appliedRange);
  }, [dateFilter.appliedRange]);

  async function carregarRanking(range) {
    setLoading(true);
    let query = supabase
      .from('assinaturas')
      .select('id, usuario_id, criado_em, usuarios(id, nome)')
      .eq('tipo', 'tecnico')
      .not('usuario_id', 'is', null);

    const limites = range ? limitesConsulta(range) : null;
    if (limites?.inicioIso) query = query.gte('criado_em', limites.inicioIso);
    if (limites?.fimExclusivoIso) query = query.lt('criado_em', limites.fimExclusivoIso);

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      avisar(error.message, 'Erro ao carregar desempenho');
      return;
    }

    const contagem = {};
    (data || []).forEach((a) => {
      const id = a.usuario_id;
      const nome = a.usuarios?.nome || 'Técnico';
      if (!contagem[id]) contagem[id] = { id, nome, total: 0 };
      contagem[id].total += 1;
    });

    setRanking(
      Object.values(contagem).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
    );
  }

  const maxTotal = useMemo(() => Math.max(1, ...ranking.map((r) => r.total)), [ranking]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Desempenho</Text>
      <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
        Assinaturas de técnico por pessoa — cada assinatura conta.
      </Text>

      <DateRangeFilter
        estado={dateFilter}
        onEstado={setDateFilter}
        onPeriodoAplicado={(range) => setDateFilter((prev) => ({ ...prev, appliedRange: range }))}
      />

      {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}

      {!loading && ranking.length === 0 ? (
        <Text style={[styles.vazio, { color: cores.textoSuave }]}>
          Nenhuma assinatura de técnico vinculada a usuário no período.
        </Text>
      ) : null}

      {!loading
        ? ranking.map((item, indice) => (
            <View
              key={item.id}
              style={[styles.linha, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
            >
              <Text style={[styles.posicao, { color: cores.textoSecundario }]}>{indice + 1}º</Text>
              <View style={styles.dados}>
                <Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text>
                <View style={[styles.barraTrack, { backgroundColor: cores.fundoSecundario }]}>
                  <View
                    style={[
                      styles.barraFill,
                      { width: `${Math.round((item.total / maxTotal) * 100)}%`, backgroundColor: cores.primario },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.total, { color: cores.primario }]}>{item.total}</Text>
            </View>
          ))
        : null}

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
  vazio: { fontStyle: 'italic', padding: 12 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  posicao: { fontSize: 16, fontWeight: '700', width: 28 },
  dados: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  barraTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraFill: { height: '100%' },
  total: { fontSize: 22, fontWeight: 'bold', minWidth: 36, textAlign: 'right' },
});
