import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTema } from '../lib/tema';
import { STATUS_OS, corDoStatus } from '../lib/constantes';
import {
  formatarIsoData,
  gradeDoMes,
  hojeNoTimezone,
  limitesConsulta,
  mesAnterior,
  mesmaData,
  mesmoMes,
  parsearDataOs,
  proximoMes,
} from '../lib/dateRangeService';

const MESES_TITULO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_CABECALHO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function tituloMesExibido(ano, mes) {
  return `Mês de ${MESES_TITULO[mes]} de ${ano}`;
}

function agruparOsPorDia(lista) {
  const mapa = {};
  (lista || []).forEach((os) => {
    const dia = parsearDataOs(os.data_inicio_prevista);
    if (!dia) return;
    const chave = formatarIsoData(dia);
    if (!mapa[chave]) mapa[chave] = {};
    mapa[chave][os.status] = (mapa[chave][os.status] || 0) + 1;
  });
  return mapa;
}

export default function CalendarioPlanejamento() {
  const { cores } = useTema();
  const hoje = hojeNoTimezone();
  const [anoVisivel, setAnoVisivel] = useState(hoje.getFullYear());
  const [mesVisivel, setMesVisivel] = useState(hoje.getMonth());
  const [contagemPorDia, setContagemPorDia] = useState({});
  const [carregando, setCarregando] = useState(false);

  const diasGrade = useMemo(() => gradeDoMes(anoVisivel, mesVisivel), [anoVisivel, mesVisivel]);

  useEffect(() => {
    carregarMes();
  }, [anoVisivel, mesVisivel]);

  async function carregarMes() {
    setCarregando(true);
    const inicio = new Date(anoVisivel, mesVisivel, 1, 12, 0, 0, 0);
    const fim = new Date(anoVisivel, mesVisivel + 1, 0, 12, 0, 0, 0);
    const { inicioIso, fimExclusivoIso } = limitesConsulta({ start: inicio, end: fim });

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('status, data_inicio_prevista')
      .gte('data_inicio_prevista', inicioIso)
      .lt('data_inicio_prevista', fimExclusivoIso);

    setCarregando(false);
    if (error) {
      console.log(error);
      setContagemPorDia({});
      return;
    }
    setContagemPorDia(agruparOsPorDia(data));
  }

  function irMesAnterior() {
    const { visibleYear, visibleMonth } = mesAnterior(anoVisivel, mesVisivel);
    setAnoVisivel(visibleYear);
    setMesVisivel(visibleMonth);
  }

  function irProximoMes() {
    const { visibleYear, visibleMonth } = proximoMes(anoVisivel, mesVisivel);
    setAnoVisivel(visibleYear);
    setMesVisivel(visibleMonth);
  }

  function irHoje() {
    const ref = hojeNoTimezone();
    setAnoVisivel(ref.getFullYear());
    setMesVisivel(ref.getMonth());
  }

  function statusDoDia(chaveDia) {
    const contagem = contagemPorDia[chaveDia] || {};
    return STATUS_OS.map((s) => s.valor).filter((status) => contagem[status] > 0);
  }

  return (
    <View style={[styles.wrap, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={irMesAnterior} style={styles.navBtn} accessibilityLabel="Mês anterior">
          <Text style={[styles.navBtnTexto, { color: cores.primario }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.tituloCol}>
          <Text style={[styles.tituloMes, { color: cores.texto }]}>
            {tituloMesExibido(anoVisivel, mesVisivel)}
          </Text>
          <TouchableOpacity onPress={irHoje}>
            <Text style={[styles.btnHoje, { color: cores.primario }]}>Hoje</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={irProximoMes} style={styles.navBtn} accessibilityLabel="Próximo mês">
          <Text style={[styles.navBtnTexto, { color: cores.primario }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.diasHeader}>
        {DIAS_CABECALHO.map((dia) => (
          <Text key={dia} style={[styles.diaHeader, { color: cores.textoSecundario }]}>
            {dia}
          </Text>
        ))}
      </View>

      {carregando ? (
        <ActivityIndicator style={styles.loader} color={cores.primario} />
      ) : (
        <View style={styles.grade}>
          {diasGrade.map((data) => {
            const chave = formatarIsoData(data);
            const noMes = mesmoMes(data, anoVisivel, mesVisivel);
            const ehHoje = mesmaData(data, hoje);
            const statuses = statusDoDia(chave);

            return (
              <View
                key={chave}
                style={[
                  styles.celula,
                  {
                    borderColor: ehHoje ? cores.primario : cores.borda,
                    backgroundColor: ehHoje ? cores.primarioFundo : noMes ? cores.fundo : cores.fundoSecundario,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numeroDia,
                    {
                      color: noMes ? cores.texto : cores.textoSuave,
                      fontWeight: ehHoje ? '800' : '600',
                    },
                  ]}
                >
                  {data.getDate()}
                </Text>
                {noMes && statuses.length > 0 ? (
                  <View style={styles.marcadoresRow}>
                    {statuses.map((status) => (
                      <View
                        key={status}
                        style={[styles.marcador, { backgroundColor: corDoStatus(status) }]}
                        accessibilityLabel={`${contagemPorDia[chave][status]} OS ${status}`}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.marcadoresRow} />
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.legendaRow, { borderTopColor: cores.borda }]}>
        {STATUS_OS.filter((s) =>
          Object.values(contagemPorDia).some((dia) => dia[s.valor] > 0)
        ).map((s) => (
          <View key={s.valor} style={styles.legendaItem}>
            <View style={[styles.marcador, { backgroundColor: corDoStatus(s.valor) }]} />
            <Text style={[styles.legendaTexto, { color: cores.textoSecundario }]}>{s.rotulo}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navBtnTexto: { fontSize: 26, fontWeight: '300', lineHeight: 28 },
  tituloCol: { flex: 1, alignItems: 'center' },
  tituloMes: { fontSize: 15, fontWeight: '700' },
  btnHoje: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  diasHeader: { flexDirection: 'row', marginBottom: 6 },
  diaHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loader: { marginVertical: 24 },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: {
    width: `${100 / 7}%`,
    minHeight: 52,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  numeroDia: { fontSize: 15, lineHeight: 18 },
  marcadoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
    minHeight: 8,
  },
  marcador: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendaTexto: { fontSize: 10, fontWeight: '600' },
});
